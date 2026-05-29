require('dotenv').config();
const app = require('./app');
const { connectDB } = require('./config/database');

// Khởi tạo models (đăng ký associations)
require('./models');

const PORT = process.env.PORT || 5000;

const start = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT} [${process.env.NODE_ENV}]`);
  });
};

start();
