import { getArticles, deleteArticleById } from "./articleController.js";

export async function myTest() {
  console.log(
    "=======================================================开始测试:",
    new Date(),
    "======"
  );
  // 查询测试
  // await getArticles(1, 5).then((articles) => {
  //   console.log("articles:", articles);
  // });

  // 删除测试
  // await deleteArticleById(3).then((article) => {
  //   console.log("删除文章article:", article);
  // });
  console.log(
    "=======================================================结束测试:",
    new Date(),
    "======"
  );
}
