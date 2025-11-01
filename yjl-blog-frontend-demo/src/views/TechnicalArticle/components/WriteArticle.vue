<template>
  <div class="write-article-container">
    <el-button @click="router.back()" size="large" link style="margin-bottom: 20px">
      <el-icon><ArrowLeft /></el-icon>
      返回
    </el-button>

    <el-card class="write-article-card">
      <template #header>
        <ArticleHeader v-model="article.title" @save="handleSave" @publish="handlePublish" />
      </template>

      <!-- 文章设置面板 -->
      <el-collapse v-model="activeNames" style="margin-bottom: 20px">
        <el-collapse-item title="文章设置" name="1">
          <el-form :model="articleSettings" label-width="80px">
            <el-form-item label="分类">
              <el-select 
                v-model="article.category" 
                placeholder="请选择分类" 
                style="width: 100%"
                clearable
                :loading="!article.categories.length"
                :disabled="!article.categories.length"
              >
                <el-option
                  v-for="cat in article.categories"
                  :key="cat.id"
                  :label="cat.name"
                  :value="cat.name"
                />
                <template v-if="!article.categories.length" #empty>
                  <div style="padding: 10px; text-align: center; color: #909399;">
                    {{ article.categories.length === 0 ? '暂无分类' : '分类加载失败' }}
                  </div>
                </template>
              </el-select>
              <el-button size="small" @click="testLoadCategories" style="margin-left: 10px;">测试加载分类</el-button>
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
                <img v-if="article.coverImage" :src="article.coverImage" class="cover-image" />
                <el-icon v-else class="cover-upload-icon"><Plus /></el-icon>
              </el-upload>
            </el-form-item>
          </el-form>
        </el-collapse-item>
      </el-collapse>

      <RichTextEditor
        ref="richTextEditor"
        v-model="article.content"
        placeholder="请输入文章内容..."
        @insert-image="showImageDialog = true"
      />
    </el-card>

    <ImageUploadDialog v-model="showImageDialog" @confirm="handleImageInsert" />
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useArticleStore } from '@/stores/article.ts'
import { useAuthStore } from '@/stores/auth'
import { ElMessage } from 'element-plus'
import ArticleHeader from './writeArticle/ArticleHeader.vue'
import RichTextEditor from './RichTextEditor.vue'
import ImageUploadDialog from './ImageUploadDialog.vue'
import { ref, onMounted, nextTick } from 'vue'
import { Plus } from '@element-plus/icons-vue'
import { uploadImage } from '@/utils/upload-config'

const router = useRouter()
const article = useArticleStore()
const authStore = useAuthStore()
const showImageDialog = ref(false)
const richTextEditor = ref()
const activeNames = ref(['1'])
const inputVisible = ref(false)
const inputValue = ref('')
const saveTagInput = ref()

// 加载分类数据
onMounted(async () => {
  console.log('WriteArticle组件挂载，开始加载分类数据...')
  
  try {
    await article.loadCategories()
    console.log('分类数据加载完成，数量:', article.categories.length)
  } catch (error) {
    console.error('分类数据加载失败:', error)
    ElMessage.error('分类数据加载失败')
  }
})

const handleImageInsert = (imageUrl: string) => {
  console.log('WriteArticle: ', imageUrl)
  // 调用子组件的插入图片方法
  richTextEditor.value?.insertImage(imageUrl)
}

// 保存草稿
const handleSave = async () => {
  try {
    await article.saveArticles(false)
    ElMessage.success('草稿保存成功')
  } catch (error) {
    ElMessage.error((error as Error).message)
  }
}

// 发布文章
const handlePublish = async () => {
  try {
    await article.saveArticles(true)
    ElMessage.success('文章发布成功')
    router.push('/articles')
  } catch (error) {
    ElMessage.error((error as Error).message)
  }
}

// 标签管理
const removeTag = (tag: string) => {
  article.tags = article.tags.filter(t => t !== tag)
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
    article.coverImage = imageUrl
    ElMessage.success('封面图上传成功')
  } catch (error) {
    ElMessage.error('封面图上传失败: ' + ((error as Error)?.message || '未知错误'))
    console.error('封面图上传失败:', error)
  }
}

// 测试加载分类的手动函数
const testLoadCategories = async () => {
  console.log('手动测试加载分类...')
  try {
    await article.loadCategories()
    console.log('手动加载成功，分类数量:', article.categories.length)
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
