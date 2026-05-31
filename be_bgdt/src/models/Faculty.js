const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Faculty = sequelize.define('Faculty', {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    faculty_name: {
      type: DataTypes.STRING(200),
      allowNull: false,
      unique: true,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: true,
      // không có defaultValue → Sequelize không gửi giá trị khi INSERT
      // SQL Server tự điền qua DEFAULT GETDATE() trên cột
    },
  }, {
    tableName: 'faculties',
    timestamps: false,  // tắt auto-timestamp để Sequelize không inject string ngày
  });

  return Faculty;
};
