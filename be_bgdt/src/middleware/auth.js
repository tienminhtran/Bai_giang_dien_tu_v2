const jwt = require('jsonwebtoken');
const jwtConfig = require('../config/jwt');

const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Không có token xác thực' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, jwtConfig.secret);
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ success: false, message: 'Token không hợp lệ hoặc đã hết hạn' });
  }
};

const authorize = (...roles) => (req, res, next) => {
  const userRoles = req.user?.roles || [];
  if (!roles.some((r) => userRoles.includes(r))) {
    return res.status(403).json({ success: false, message: 'Không có quyền truy cập' });
  }
  next();
};

module.exports = { authenticate, authorize };
