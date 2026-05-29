const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const CourseSection = sequelize.define('CourseSection', {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    course_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    section_title: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    section_order: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    created_by: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    created_at: {
      type: DataTypes.DATE,
    },
  }, {
    tableName: 'course_sections',
    timestamps: false,
  });

  return CourseSection;
};
