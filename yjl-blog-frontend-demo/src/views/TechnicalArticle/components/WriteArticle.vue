<template>
  <div class="write-article-wrapper">
    <!-- 星空粒子背景 -->
    <div class="stars-container">
      <div
        v-for="(star, index) in stars"
        :key="index"
        class="star"
        :style="{
          left: star.x + 'px',
          top: star.y + 'px',
          width: star.size + 'px',
          height: star.size + 'px',
          opacity: star.opacity,
          animationDuration: star.duration + 's',
          animationDelay: star.delay + 's',
        }"
      ></div>
    </div>

    <div class="write-article-container">
      <div class="back-button">
        <el-button @click="goBack" size="large" link>
          <el-icon :size="20"><ArrowLeft /></el-icon>
          <el-text size="large" class="back-text">返回</el-text>
        </el-button>
      </div>

      <el-card class="write-article-card">
        <template #header>
          <ArticleHeader
            v-model="article.title"
            @save="handleSave"
            @publish="handlePublish"
            :disabled="isLoading"
          />
        </template>

        <!-- 文章设置面板 -->
        <el-collapse v-model="activeNames" style="margin-bottom: 20px">
          <el-collapse-item title="文章设置" name="1">
            <el-form label-width="80px">
              <el-form-item label="分类" style="margin-top: 22px">
                <el-select
                  v-model="article.categoryId"
                  placeholder="请选择分类"
                  style="width: 100%"
                  clearable
                  :loading="!article.categories.length"
                  :disabled="!article.categories.length"
                  @change="handleCategoryChange"
                >
                  <el-option
                    v-for="cat in article.categories"
                    :key="cat.id"
                    :label="cat.name"
                    :value="cat.id"
                  />
                  <template v-if="!article.categories.length" #empty>
                    <div style="padding: 10px; text-align: center; color: #909399">
                      {{ article.categories.length === 0 ? '暂无分类' : '分类加载失败' }}
                    </div>
                  </template>
                </el-select>
              </el-form-item>
              <el-form-item label="标签">
                <el-tag
                  v-for="tag in article.tags"
                  :key="tag"
                  closable
                  @close="removeTag(tag)"
                  style="margin-right: 8px"
                >
                  {{ tag }}
                </el-tag>
                <el-input
                  v-if="inputVisible"
                  ref="saveTagInput"
                  v-model="inputValue"
                  size="small"
                  style="width: 90px"
                  @keyup.enter="handleInputConfirm"
                  @blur="handleInputConfirm"
                />
                <el-button v-else size="small" @click="showInput">+ 新标签</el-button>
              </el-form-item>
              <el-form-item label="封面图">
                <el-upload
                  class="cover-upload"
                  action=""
                  :show-file-list="false"
                  :before-upload="beforeCoverUpload"
                  :http-request="uploadCover"
                >
                  <img v-if="article.coverUrl" :src="article.coverUrl" class="cover-image" />
                  <el-icon v-else class="cover-upload-icon"><Plus /></el-icon>
                </el-upload>
              </el-form-item>
            </el-form>
          </el-collapse-item>
        </el-collapse>

        <!-- Markdown 文件上传器 -->
        <div v-loading="isLoading" element-loading-text="正在加载文章内容...">
          <MarkdownUploader
            v-if="!isEditMode"
            v-model="article.content"
            @metadata-parsed="handleMetadataParsed"
          />
          <div v-else class="edit-mode-notice">
            <el-alert
              title="编辑模式"
              type="info"
              description="当前为编辑模式,不支持重新上传 Markdown 文件。如需修改内容,请删除后重新创建。"
              :closable="false"
              show-icon
            />
          </div>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useArticleStore } from '@/stores/article.ts'
import { ElMessage } from 'element-plus'
import ArticleHeader from './writeArticle/ArticleHeader.vue'
import MarkdownUploader from './MarkdownUploader.vue'
import { ref, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { Plus, ArrowLeft } from '@element-plus/icons-vue'
import { uploadImage } from '@/utils/upload-config'
import { getArticleDetail } from '@/apis/articles'
import { Article } from '@/models/Article'

const router = useRouter()
const article = useArticleStore()
const activeNames = ref(['1'])
const inputVisible = ref(false)
const inputValue = ref('')
const saveTagInput = ref()
const isEditMode = ref(false)
const editArticleId = ref<string | null>(null)
const isLoading = ref(false)

// 星空粒子系统
const stars = ref<
  Array<{
    x: number
    y: number
    size: number
    opacity: number
    duration: number
    delay: number
  }>
>([])

// 创建星空粒子
const createStars = () => {
  const starCount = 150
  const newStars = []

  for (let i = 0; i < starCount; i++) {
    const duration = Math.random() * 30 + 20
    newStars.push({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      size: Math.random() * 2 + 0.5,
      opacity: Math.random() * 0.8 + 0.2,
      duration: duration,
      delay: -Math.random() * duration,
    })
  }

  stars.value = newStars
}

// 窗口大小变化时重新创建粒子
const handleResize = () => {
  createStars()
}

// 处理 Markdown Front Matter 元数据
const handleMetadataParsed = (metadata: any) => {
  if (metadata.title) {
    article.title = metadata.title
  }
  if (metadata.tags && Array.isArray(metadata.tags)) {
    article.tags = metadata.tags
  }
  if (metadata.category) {
    // 根据分类名称查找分类 ID
    const category = article.categories.find((cat) => cat.name === metadata.category)
    if (category) {
      article.categoryId = category.id
      article.category = category.name
    }
  }
  if (metadata.categoryId) {
    article.categoryId = metadata.categoryId
  }
  if (metadata.description) {
    article.description = metadata.description
  }
  if (metadata.coverUrl) {
    article.coverUrl = metadata.coverUrl
  }
}

// 加载文章数据（编辑模式）
const loadArticleForEdit = async (articleId: string) => {
  isLoading.value = true
  try {
    const response = await getArticleDetail(articleId)

    if (!response || !response.data) {
      throw new Error('文章数据为空')
    }

    const articleData = response.data

    // 使用文章存储的setArticle方法填充数据
    article.setArticle(
      new Article({
        title: articleData.title || '',
        content: articleData.content || '',
        tags: articleData.tags || [],
        categoryId: articleData.categoryId,
        description: articleData.description || '',
        coverUrl: articleData.coverUrl || '',
        status: articleData.status || 0,
        views: articleData.views || 0,
        likeCount: articleData.likeCount || 0,
        commentCount: articleData.commentCount || 0,
      }),
    )

    // 等待DOM更新完成后再继续
    await nextTick()
  } catch (error) {
    console.error('加载文章数据失败:', error)
    ElMessage.error('加载文章数据失败')
    // 如果加载失败，跳转回文章列表
    router.push('/article')
  } finally {
    isLoading.value = false
  }
}

// 监听路由变化，确保在切换模式时正确处理
watch(
  () => router.currentRoute.value.query.id,
  (newId, oldId) => {
    if (newId) {
      // 切换到编辑模式
      isEditMode.value = true
      editArticleId.value = newId as string
      loadArticleForEdit(newId as string)
    } else if (oldId && !newId) {
      // 从编辑模式切换到新建模式
      article.resetArticle()
      isEditMode.value = false
      editArticleId.value = null
    }
  },
)

// 加载分类数据
onMounted(async () => {
  // 初始化星空粒子
  createStars()
  window.addEventListener('resize', handleResize)

  // 检查是否为编辑模式
  const queryId = router.currentRoute.value.query.id as string
  if (queryId) {
    isEditMode.value = true
    editArticleId.value = queryId
    await loadArticleForEdit(queryId)
  } else {
    // 新建文章模式 - 重置所有数据
    article.resetArticle()
    isEditMode.value = false
    editArticleId.value = null
  }

  try {
    await article.loadCategories()
  } catch (error) {
    console.error('分类数据加载失败:', error)
    ElMessage.error('分类数据加载失败')
  }
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})

// 保存草稿
const handleSave = async () => {
  try {
    if (isEditMode.value && editArticleId.value) {
      // 编辑模式 - 更新文章（保存为草稿）
      await article.updateArticle(editArticleId.value, false)
      ElMessage.success('草稿更新成功')
    } else {
      // 新建模式 - 保存草稿
      await article.saveArticles(false)
      ElMessage.success('草稿保存成功')
    }
  } catch (error) {
    ElMessage.error((error as Error).message)
  }
}

// 发布文章
const handlePublish = async () => {
  try {
    if (isEditMode.value && editArticleId.value) {
      // 编辑模式 - 更新文章
      await article.updateArticle(editArticleId.value)
      ElMessage.success('文章更新成功')
    } else {
      // 新建模式 - 发布文章
      await article.saveArticles(true)
      ElMessage.success('文章发布成功')
    }
    router.push('/article')
  } catch (error) {
    ElMessage.error((error as Error).message)
  }
}

// 标签管理
const removeTag = (tag: string) => {
  article.tags = article.tags.filter((t) => t !== tag)
}

const showInput = () => {
  inputVisible.value = true
  nextTick(() => {
    saveTagInput.value?.focus()
  })
}

const handleInputConfirm = () => {
  if (inputValue.value) {
    article.tags.push(inputValue.value)
  }
  inputVisible.value = false
  inputValue.value = ''
}

// 封面图上传
const beforeCoverUpload = (file: File) => {
  const isImage = file.type.startsWith('image/')
  const isLt2M = file.size / 1024 / 1024 < 2

  if (!isImage) {
    ElMessage.error('只能上传图片文件!')
    return false
  }
  if (!isLt2M) {
    ElMessage.error('图片大小不能超过 2MB!')
    return false
  }
  return true
}

const uploadCover = async (options: any) => {
  try {
    const imageUrl = await uploadImage(options.file)
    article.coverUrl = imageUrl
    ElMessage.success('封面图上传成功')
  } catch (error) {
    ElMessage.error('封面图上传失败: ' + ((error as Error)?.message || '未知错误'))
    console.error('封面图上传失败:', error)
  }
}

// 分类变化处理函数
const handleCategoryChange = (categoryId: number | undefined) => {
  if (categoryId) {
    const selectedCategory = article.categories.find((cat) => cat.id === categoryId)
    article.category = selectedCategory?.name || ''
  } else {
    article.category = ''
  }
}

// 返回按钮点击事件
const goBack = () => {
  // 清除编辑模式状态
  if (isEditMode.value) {
    isEditMode.value = false
    editArticleId.value = null
    article.resetArticle() // 重置文章数据
  }
  router.back()
}
</script>

<style scoped>
.write-article-wrapper {
  position: relative;
  width: 100%;
  min-height: 100vh;
  display: flex;
  justify-content: center;
  padding: 100px 20px 40px 20px;
  background: radial-gradient(ellipse at bottom left, #1b2735 0%, #090a0f 100%);
  overflow: hidden;
}

/* 星空粒子容器 */
.stars-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 0;
}

/* 单个星星 */
.star {
  position: absolute;
  background: #ffffff;
  border-radius: 50%;
  box-shadow: 0 0 10px rgba(255, 255, 255, 0.8);
  animation: starFloat linear infinite;
}

/* 星星浮动动画 */
@keyframes starFloat {
  0% {
    transform: translateY(100vh) scale(0.5);
    opacity: 0;
  }
  10% {
    opacity: 1;
  }
  90% {
    opacity: 1;
  }
  100% {
    transform: translateY(-100px) scale(1.2);
    opacity: 0;
  }
}

.write-article-container {
  width: 100%;
  max-width: 1400px;
  position: relative;
  z-index: 1;
  display: flex;
  justify-content: center;
}

.back-button {
  position: absolute;
  right: 50%;
  margin-right: 550px;
  z-index: 10;
}

.back-button :deep(.el-button) {
  color: #e2e8f0;
}

.back-button .el-icon {
  position: absolute;
  left: -10px;
}

.back-text {
  position: absolute;
  top: 6px;
}

.write-article-card {
  width: 900px;
  border-radius: 12px;
  background-color: rgba(30, 41, 59, 0.8) !important;
  backdrop-filter: blur(10px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #e2e8f0;
  margin-bottom: 20px;
}

/* 深色主题适配 */
.write-article-card :deep(.el-card__header) {
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.write-article-card :deep(.el-form-item__label) {
  color: #e2e8f0;
}

.write-article-card :deep(.el-collapse) {
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  --el-collapse-header-bg-color: transparent;
  --el-collapse-content-bg-color: transparent;
  --el-collapse-border-color: rgba(255, 255, 255, 0.1);
}

.write-article-card :deep(.el-collapse-item__header) {
  color: #e2e8f0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.write-article-card :deep(.el-collapse-item__content) {
  color: #e2e8f0;
  padding-bottom: 25px;
}

.write-article-card :deep(.el-input__wrapper),
.write-article-card :deep(.el-textarea__inner),
.write-article-card :deep(.el-select__wrapper) {
  background-color: rgba(0, 0, 0, 0.2);
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.1) inset;
}

.write-article-card :deep(.el-input__inner) {
  color: #e2e8f0;
}

.cover-upload {
  width: 178px;
  height: 178px;
  border: 1px dashed rgba(255, 255, 255, 0.3);
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: var(--el-transition-duration-fast);
  background-color: rgba(0, 0, 0, 0.2);
}

.cover-upload:hover {
  border-color: var(--el-color-primary);
}

.cover-upload-icon {
  font-size: 28px;
  color: #8c939d;
  width: 178px;
  height: 178px;
  text-align: center;
  line-height: 178px;
}

.cover-image {
  width: 178px;
  height: 178px;
  display: block;
  object-fit: cover;
}

.edit-mode-notice {
  padding: 20px;
}
</style>
