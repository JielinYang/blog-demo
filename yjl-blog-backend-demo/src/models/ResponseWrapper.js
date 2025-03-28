// 封装响应体
class ResponseWrapper {
  static success(data, message = "Success") {
    return { success: true, message, data };
  }
  static error(message = "Server Error") {
    return { success: false, message };
  }
}

export default ResponseWrapper;
