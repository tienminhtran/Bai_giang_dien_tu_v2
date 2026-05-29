const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_SERVER || 'localhost',
    port: parseInt(process.env.DB_PORT) || 1433,
    dialect: 'mssql',
    dialectOptions: {
      options: {
        encrypt: process.env.DB_ENCRYPT === 'true',
        trustServerCertificate: process.env.DB_TRUST_CERT !== 'false',
        enableArithAbort: true,
      },
    },
    pool: { max: 10, min: 0, idle: 30000 },
    logging: false,
  }
);

const connectDB = async () => {
  await sequelize.authenticate();
  console.log('Ket noi SQL Server thanh cong');
};

module.exports = { sequelize, connectDB };
