/**
 * Lấy message lỗi từ axios error response hoặc Error thường
 * @param {unknown} err
 * @param {string}  fallback  - message mặc định khi không lấy được
 */
export const getApiError = (err, fallback = 'Lỗi server') =>
  err?.response?.data?.message || err?.message || fallback

/** Lấy HTTP status code từ axios error (0 nếu không có response) */
export const getApiStatus = (err) => err?.response?.status ?? 0
