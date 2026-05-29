const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Enrollment = sequelize.define('Enrollment', {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    student_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    course_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    academic_term_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    enrollment_type: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'new',
      // 'new' | 'retake' | 'improve'
    },
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'active',
      // 'active' | 'dropped' | 'completed'
    },
    enrolled_at: {
      type: DataTypes.DATE,
    },
    source_request_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },
  }, {
    tableName: 'enrollments',
    timestamps: false,
  });

  return Enrollment;
};
