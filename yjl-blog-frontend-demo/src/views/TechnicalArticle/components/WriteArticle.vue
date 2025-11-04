<template>
  <div class="write-article-container">
    <el-button @click="goBack" size="large" link style="margin-bottom: 20px">
      <el-icon><ArrowLeft /></el-icon>
      返回
    </el-button>

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
            <el-form-item label="分类">
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
              <el-button size="small" @click="testLoadCategories" style="margin-left: 10px"
                >测试加载分类</el-button
              >
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

      <!-- 文章内容编辑器 -->
      <div v-loading="isLoading" element-loading-text="正在加载文章内容...">
        <RichTextEditor
          v-if="!isEditMode || article.content"
          ref="richTextEditor"
          v-model="article.content"
          placeholder="请输入文章内容..."
          @insert-image="showImageDialog = true"
        />
      </div>
      <div v-if="isEditMode && !article.content" style="color: red; padding: 10px">
        调试信息: 内容为空，isLoading: {{ isLoading }}, 内容长度: {{ article.content?.length }}
      </div>
    </el-card>

    <ImageUploadDialog v-model="showImageDialog" @confirm="handleImageInsert" />
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useArticleStore } from '@/stores/article.ts'
import { ElMessage } from 'element-plus'
import ArticleHeader from './writeArticle/ArticleHeader.vue'
import RichTextEditor from './RichTextEditor.vue'
import ImageUploadDialog from './ImageUploadDialog.vue'
import { ref, onMounted, nextTick, watch } from 'vue'
import { Plus } from '@element-plus/icons-vue'
import { uploadImage } from '@/utils/upload-config'
import { getArticleDetail } from '@/apis/articles'

const router = useRouter()
const article = useArticleStore()
const showImageDialog = ref(false)
const richTextEditor = ref()
const activeNames = ref(['1'])
const inputVisible = ref(false)
const inputValue = ref('')
const saveTagInput = ref()
const isEditMode = ref(false)
const editArticleId = ref<string | null>(null)
const isLoading = ref(false)

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
    article.setArticle({
      title: articleData.title || '',
      content: articleData.content || '',
      tags: articleData.tags || [],
      category: articleData.categoryName || '',
      categoryId: articleData.categoryId,
      description: articleData.description || '',
      coverUrl: articleData.coverUrl || '',
      status: articleData.status || 0,
      views: articleData.views || 0,
      likeCount: articleData.likeCount || 0,
      commentCount: articleData.commentCount || 0,
    })

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

const handleImageInsert = (imageUrl: string) => {
  // 调用子组件的插入图片方法
  richTextEditor.value?.insertImage(imageUrl)
}

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

// 测试加载分类的手动函数
const testLoadCategories = async () => {
  try {
    await article.loadCategories()
    ElMessage.success(`成功加载 ${article.categories.length} 个分类`)
  } catch (error) {
    console.error('手动加载失败:', error)
    ElMessage.error('分类加载失败')
  }
}
</script>

<style scoped>
.write-article-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.write-article-card {
  margin-bottom: 20px;
}

.cover-upload {
  width: 178px;
  height: 178px;
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: var(--el-transition-duration-fast);
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
</style>
