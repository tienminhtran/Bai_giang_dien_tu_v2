const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const CourseRole = sequelize.define('CourseRole', {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    role_name: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      // 'subject_owner' | 'lecturer'
    },
    description: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
  }, {
    tableName: 'course_roles',
    timestamps: false,
  });

  return CourseRole;
};
