const success = (res, data = null, message = 'Thành công', statusCode = 200) => {
  return res.status(statusCode).json({ success: true, message, data });
};

const error = (res, message = 'Lỗi server', statusCode = 500, errors = null) => {
  return res.status(statusCode).json({ success: false, message, ...(errors && { errors }) });
};

module.exports = { success, error };
