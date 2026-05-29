const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Lecturer = sequelize.define('Lecturer', {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
    },
    lecturer_code: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true,
    },
    full_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    faculty_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    academic_degree: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    phone: {
      type: DataTypes.STRING(15),
      allowNull: true,
    },
    avatar_url: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  }, {
    tableName: 'lecturers',
    timestamps: false,
  });

  return Lecturer;
};
