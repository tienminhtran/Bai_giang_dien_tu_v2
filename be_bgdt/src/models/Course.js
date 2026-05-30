const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Course = sequelize.define('Course', {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    course_code: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true,
    },
    course_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    credits: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    count_manager: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    faculty_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    created_at: {
      type: DataTypes.DATE,
    },
  }, {
    tableName: 'courses',
    timestamps: false,
  });

  return Course;
};
