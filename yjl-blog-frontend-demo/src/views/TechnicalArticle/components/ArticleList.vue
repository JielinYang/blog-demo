<template>
  <div>
    <!-- 表格展示 -->
    <el-table :data="postList" style="width: 100%" fit>
      <el-table-column prop="id" label="ID" width="100" />
      <el-table-column prop="title" label="标题" width="450" />
      <el-table-column prop="isTop" label="是否置顶" width="100" />
      <el-table-column prop="viewsCount" label="热度" width="100" />
      <el-table-column prop="pubTime" label="发布时间" width="200" />
      <el-table-column label="操作">
        <template #default="scope">
          <el-button size="mini" type="danger" @click="deleteItem(scope.row.id)"> 删除 </el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页控制 -->
    <el-pagination
      @size-change="handleSizeChange"
      @current-change="handleCurrentChange"
      :current-page="pagination.currentPage"
      :page-sizes="[10, 20, 30, 40]"
      :page-size="pagination.pageSize"
      layout="total, sizes, prev, pager, next, jumper"
      :total="pagination.total"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'

// 文章数据与分页配置
const postList = ref<Post[]>()
const pagination = ref({
  currentPage: 1,
  pageSize: 10,
  total: 0,
})

type Post = {
  id: number
  title: string
  isTop: string
  viewsCount: number
  pubTime: string
}

// 获取文章数据（模拟 API 请求）
const fetchData = async () => {
  const fakeList = [
    {
      id: 1,
      title: '基于深度学习的图像识别技术研究', // 网页2：使用 fake.catch_phrase() 生成标题
      isTop: '是', // 随机选择“是”或“否”
      viewsCount: 2543, // 热度范围为 100-10000
      pubTime: '2025-03-20 14:35:22', // 网页2：格式化为 YYYY-MM-DD HH:mm:ss
    },
    {
      id: 2,
      title: '区块链在金融安全中的应用前景分析',
      isTop: '否',
      viewsCount: 1890,
      pubTime: '2025-03-21 09:15:47',
    },
    {
      id: 3,
      title: '人工智能驱动的医疗诊断系统优化方案',
      isTop: '是',
      viewsCount: 4321,
      pubTime: '2025-03-22 16:20:33',
    },
    {
      id: 4,
      title: '云计算环境下的数据隐私保护策略',
      isTop: '否',
      viewsCount: 765,
      pubTime: '2025-03-23 11:05:19',
    },
    {
      id: 5,
      title: '元宇宙社交平台的用户体验设计研究',
      isTop: '是',
      viewsCount: 5987,
      pubTime: '2025-03-24 18:40:55',
    },
    {
      id: 6,
      title: '5G 网络在工业自动化中的实践案例',
      isTop: '否',
      viewsCount: 3210,
      pubTime: '2025-03-25 08:30:12',
    },
    {
      id: 7,
      title: '大数据分析在电商推荐系统中的应用',
      isTop: '是',
      viewsCount: 4100,
      pubTime: '2025-03-25 10:22:44',
    },
    {
      id: 8,
      title: '物联网设备的安全漏洞与防护措施',
      isTop: '否',
      viewsCount: 1234,
      pubTime: '2025-03-25 13:17:29',
    },
    {
      id: 9,
      title: '虚拟现实技术在教育领域的创新实践',
      isTop: '是',
      viewsCount: 6789,
      pubTime: '2025-03-25 15:55:03',
    },
    {
      id: 10,
      title: '分布式系统的高可用性架构设计',
      isTop: '否',
      viewsCount: 987,
      pubTime: '2025-03-25 17:38:57',
    },
  ]
  const res = {
    data: {
      list: fakeList,
      total: 10,
    },
    code: 200,
  }
  postList.value = res.data.list
  pagination.value.total = res.data.total
}

// 分页事件处理
const handleSizeChange = (newSize: number) => {
  pagination.value.pageSize = newSize
  fetchData()
}

const handleCurrentChange = (newPage: number) => {
  pagination.value.currentPage = newPage
  fetchData()
}

// 删除文章
const deleteItem = (id: number) => {
  // 调用删除接口后刷新数据
  if (postList.value) {
    postList.value = postList.value.filter((item) => item.id !== id)
    ElMessage.success('删除成功')
  }
}

// 初始化加载
onMounted(fetchData)
</script>
