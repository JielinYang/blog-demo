import { faker } from "@faker-js/faker/locale/zh_CN";

// 生成单条假数据
export function generateFakeArticles(generateNum) {
  const articles = [];
  for (let i = 0; i < generateNum; i++) {
    const article = {
      title: faker.commerce.productName(), // 随机生成一句中文标题
      content: faker.lorem.paragraph(5), // 生成 5 段随机中文内容（模拟富文本）
      authorId: faker.number.int({ min: 1, max: 100 }), // 假设作者 ID 在 1~100 之间
      categoryId: faker.number.int({ min: 1, max: 5 }) || null, // 分类 ID 可能为 null（30% 概率）
      views: faker.number.int({ min: 0, max: 10000 }), // 访问次数 0~10000
      likeCount: faker.number.int({ min: 0, max: 5000 }), // 点赞量 0~5000
      commentCount: faker.number.int({ min: 0, max: 200 }), // 评论数 0~200
      status: faker.number.int({ min: 0, max: 2 }), // 状态 0（草稿）、1（已发布）、2（已下架）
      coverUrl: faker.image.url({ width: 800, height: 400 }), // 封面图 URL（30% 概率不生成）
      description: faker.lorem.sentence(), // 文章摘要（随机句子）
      createTime: faker.date
        .past()
        .toISOString()
        .slice(0, 19)
        .replace("T", " "), // 创建时间（过去随机时间）
      updateTime: faker.date
        .between({ from: faker.date.past(), to: new Date() })
        .toISOString()
        .slice(0, 19)
        .replace("T", " "), // 更新时间（在创建时间之后）
    };

    articles.push(article);
  }
  return articles;
}
