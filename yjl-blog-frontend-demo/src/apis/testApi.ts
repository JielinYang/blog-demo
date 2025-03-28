import request from '@/utils/request'

// GET请求
export function getTest() {
  return request
    .get('/', {})
    .then((res) => console.log(res))
    .catch((err) => console.error(err))
}

// POST请求
export function postTest() {
  return request
    .post('home/category/create', { name: 'test', sort: 1 })
    .then((res) => console.log(res))
    .catch((err) => console.error(err))
}
