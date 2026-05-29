class ApiError extends Error {
  constructor(statusCode, message, errorType = null) {
    super(message)
    this.name       = 'ApiError'
    this.statusCode = statusCode
    if (errorType) this.errorType = errorType
  }

  static badRequest(message, errorType)              { return new ApiError(400, message, errorType) }
  static unauthorized(message = 'Chưa xác thực')    { return new ApiError(401, message) }
  static forbidden(message = 'Không có quyền')      { return new ApiError(403, message) }
  static notFound(message = 'Không tìm thấy')       { return new ApiError(404, message) }
  static conflict(message, errorType)                { return new ApiError(409, message, errorType) }
  static internal(message = 'Lỗi server nội bộ')   { return new ApiError(500, message) }
}

module.exports = ApiError
