// 使用命名空间导入，这是qiniu-js稳定版本的推荐导入方式
import * as qiniu from 'qiniu-js'
import request from '@/utils/request'
import { ElMessage } from 'element-plus'

// 扩展Window接口，添加qiniuScopeKey属性
declare global {
  interface Window {
    qiniuScopeKey?: string
  }
}

interface QiniuConfig {
  token: string
  domain: string
  tokenExpireTime?: number // token过期时间
}

const config: QiniuConfig = {
  token: '', // 从后端获取的上传token
  domain: 'https://fbranch.s3.cn-south-1.qiniucs.com', // 测试域名，实际部署时替换为真实七牛云域名
}

// 检查token是否有效（简单实现，实际可能需要更复杂的验证）
const isTokenValid = (): boolean => {
  // 如果没有token或token过期时间已过，则认为无效
  if (!config.token) {
    return false
  }
  // 如果设置了过期时间且已过期
  if (config.tokenExpireTime && Date.now() > config.tokenExpireTime) {
    return false
  }
  // 拒绝模拟token
  if (config.token === 'demo_token_for_development_only') {
    return false
  }
  return true
}

export const uploadToQiniu = async (file: File): Promise<string> => {
  // 确保token有效
  if (!isTokenValid()) {
    try {
      await getQiniuToken()
    } catch (error) {
      console.error('获取上传凭证时发生错误:', error)
      throw new Error('无法获取有效的上传凭证，请检查后端服务是否正常运行')
    }
  }

  // 生成唯一文件名，避免覆盖
  const timestamp = Date.now()
  const randomStr = Math.random().toString(36).substring(2, 10)
  const fileExt = file.name.split('.').pop() || 'jpg'

  // 根据七牛云官方解释：上传的scope为bucket:key的形式
  // 上传文件的key必须与scope中的key完全一致
  const originalFileName = file.name.split('/').pop() || file.name

  // 获取后端返回的scope key前缀
  const scopeKeyPrefix = window.qiniuScopeKey || ''

  // 根据scope key前缀生成key
  let key = ''
  if (scopeKeyPrefix) {
    // 如果后端指定了key前缀，使用指定的前缀
    key = `${scopeKeyPrefix}${timestamp}_${randomStr}_${originalFileName}`
  } else {
    // 如果后端没有指定key前缀，使用默认格式
    key = `${timestamp}_${randomStr}_${originalFileName}`
  }

  console.log('上传文件信息:', {
    originalName: file.name,
    key: key,
    scopeKeyPrefix: scopeKeyPrefix,
    fileExt: fileExt,
    tokenPreview: config.token.substring(0, 20) + '...',
    note: '根据后端返回的scope信息生成key',
  })

  return new Promise((resolve, reject) => {
    try {
      // 检查qiniu模块是否正确加载
      console.log('qiniu模块:', Object.keys(qiniu || {}))

      // 上传配置
      const uploadConfig = {
        region: qiniu.region.z2, // 华南区域
        useCdnDomain: true,
        disableStatisticsReport: false,
        retryCount: 3,
        concurrentRequestLimit: 3,
      }

      // 自定义变量配置
      const putExtra = {
        fname: file.name,
        params: {},
        mimeType: null, // 自动检测文件类型
      }

      // 稳定版本使用标准的upload方法调用
      const observable = qiniu.upload(file, key, config.token, putExtra, uploadConfig)

      observable.subscribe({
        next: (res) => {
          const progress = Math.floor(res.total.percent)
          console.log(`上传进度: ${progress}%`)
        },
        error: (err) => {
          console.error('上传失败详细信息:', {
            code: err.code,
            message: err.message,
            response: err.response,
            reqId: err.reqId,
            isRequestError: err.isRequestError,
            key: key,
            token: config.token.substring(0, 30) + '...',
          })

          // 更详细的错误处理
          let errorMessage = '图片上传失败: '

          if (err.code === 401 && err.response && err.response.error === 'bad token') {
            errorMessage += '上传凭证无效。请检查后端服务是否正常运行。'
            // 清除无效token
            config.token = ''
          } else if (
            err.code === 403 &&
            err.response &&
            err.response.error === "key doesn't match with scope"
          ) {
            errorMessage += '上传文件路径与token作用域不匹配。'
            console.error('403错误详情：', {
              key: key,
              tokenScope: '请检查后端生成token时的scope设置',
              bucket: 'fbranch',
              suggestion: '确保后端生成token时使用的bucket和key前缀与上传配置一致',
            })
          } else {
            errorMessage += err.message || '未知错误'
          }

          reject(new Error(errorMessage))
        },
        complete: (res) => {
          console.log('上传完成响应:', res)
          const imageUrl = `${config.domain}/${res.key}`
          console.log('图片上传成功，URL:', imageUrl)
          resolve(imageUrl)
        },
      })
    } catch (error) {
      console.error('初始化上传失败:', error)
      reject(new Error('图片上传初始化失败: ' + (error.message || '未知错误')))
    }
  })
}

export const getQiniuToken = async (): Promise<string> => {
  try {
    // 调用后端API获取七牛云上传token
    console.log('正在请求七牛云token...')
    const response = await request.get('/qiniu/token')

    // 详细打印响应内容用于调试
    console.log('token API响应:', JSON.stringify(response))

    // 检查响应格式（考虑到响应拦截器直接返回response.data）
    // 这里需要根据实际返回的数据结构来调整
    let token = ''
    let expireIn = 0
    let scope = '' // 添加scope信息

    // 处理不同可能的响应结构
    if (typeof response === 'string') {
      // 如果直接返回token字符串
      token = response
    } else if (response.token) {
      // 如果响应对象直接包含token
      token = response.token
      expireIn = response.expireIn || 3600 // 默认1小时
      scope = response.scope || '' // 获取scope信息
    } else if (response.data && response.data.token) {
      // 原有的结构检查
      token = response.data.token
      expireIn = response.data.expireIn || 3600
      scope = response.data.scope || '' // 获取scope信息
    }

    if (!token) {
      throw new Error('后端未返回有效token')
    }

    // 设置token和scope信息
    config.token = token

    // 存储scope信息用于后续的key生成
    if (scope) {
      console.log('后端返回的scope信息:', scope)
      // 解析scope格式：bucket:key 或 bucket
      const scopeParts = scope.split(':')
      window.qiniuScopeKey = scopeParts.length === 2 ? scopeParts[1] : ''
      console.log('提取的key前缀:', window.qiniuScopeKey)
    }

    // 设置token过期时间（提前10分钟过期，避免临界情况）
    config.tokenExpireTime = Date.now() + (expireIn - 600) * 1000

    console.log('获取七牛云token成功！！！')
    return config.token
  } catch (error) {
    console.error('获取七牛云token失败:', error)
    ElMessage.error('获取上传凭证失败')
    throw error
  }
}
