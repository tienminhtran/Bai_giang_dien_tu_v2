const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const CourseLecturer = sequelize.define('CourseLecturer', {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    course_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    lecturer_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    course_role_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    assigned_by: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    assigned_at: {
      type: DataTypes.DATE,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  }, {
    tableName: 'course_lecturers',
    timestamps: false,
  });

  return CourseLecturer;
};
