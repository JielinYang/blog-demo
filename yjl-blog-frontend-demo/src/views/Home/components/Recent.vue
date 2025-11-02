<template>
  <el-container class="recent-container">
    <el-container class="text-container">
      <el-text>最近文章</el-text>
    </el-container>
    <el-container class="table-container">
      <el-table
        :data="tableData"
        size="large"
        row-class-name="custom-row"
        :show-header="false"
        :fit="false"
        style="width: 700px"
      >
        <el-table-column prop="date" label="日期" width="100">
          <template #default="scope">
            <div class="time-column-container">
              <div>
                {{ misc.getMonthWith0(scope.row.date) }}.{{ misc.getDayWith0(scope.row.date) }}
              </div>
              <div>{{ misc.getYear(scope.row.date) }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="title" label="标题" width="600">
          <template #default="{ row }">
            <!-- 新增 inline-block 包裹层 -->
            <span class="hover-underline-text">{{ row.title }}</span>
          </template>
        </el-table-column>
      </el-table>
    </el-container>
  </el-container>
</template>

<script lang="ts" setup>
import misc from '@/utils/misc'

const tableData = [
  {
    id: 1,
    title: '天龙八试测试天龙',
    date: '2020-07-08',
  },
  {
    id: 2,
    title: '射雕英雄传测试测试测试天龙八部测试测试测试八部测试测试测试八部测试测试测试',
    date: '2016-05-03',
  },
  {
    id: 3,
    title: '天龙八部测试测试测试天龙八部测试测试测试',
    date: '2021-08-18',
  },
  {
    id: 4,
    title: '天龙八部测试测试测试天龙八部测试测试测试',
    date: '2023-11-11',
  },
  {
    id: 5,
    title: '天龙八部测试测试测试天龙八部测试测试测试',
    date: '2022-02-26',
  },
]
</script>

<style scoped>
.recent-container {
  width: 100%;
  position: relative;
  display: flex;
  flex-direction: column;
}

.text-container {
  width: 100%;
  height: 10vh;
  position: relative;
}

.table-container {
  width: 100%;
  height: 30vh;
  position: relative;
  display: flex;
  justify-content: center;
}

.el-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: var(--title-font-size);
  font-weight: bold;
}

:deep(.el-table__row td) {
  border-bottom: none !important;
}

:deep(.el-table__inner-wrapper::before) {
  height: 0 !important;
}

:deep(.custom-row) {
  font-size: 16px !important;
  transition: transform 0.3s !important;
}

:deep(.custom-row:hover) {
  transform: translateY(-3px) !important;
  transition: transform 0.3s !important;
}

:deep(.el-table .cell) {
  overflow: visible !important;
  .hover-underline-text {
    display: inline-block;
    position: relative;

    &::after {
      content: '';
      position: absolute;
      bottom: -6px;
      left: 0;
      width: 100%;
      height: 1px;
      background-color: var(--el-text-color-primary);
      transform: scaleX(0);
      transform-origin: right;
      transition: transform 0.3s ease;
    }

    &:hover::after {
      transform: scaleX(1);
      transform-origin: left;
    }
  }
}

.time-column-container div {
  text-align: center;
}

.time-column-container div:first-child {
  font-size: 16px;
}

.time-column-container div:last-child {
  font-size: 16px;
  color: grey;
}
</style>
