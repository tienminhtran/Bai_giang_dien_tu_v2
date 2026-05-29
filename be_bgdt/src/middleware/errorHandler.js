const notFound = (req, res, next) => {
  const err = new Error(`Không tìm thấy: ${req.originalUrl}`);
  err.statusCode = 404;
  next(err);
};

const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Lỗi server',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = { notFound, errorHandler };
