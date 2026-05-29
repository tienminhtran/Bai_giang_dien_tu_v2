const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const EnrollmentRequest = sequelize.define('EnrollmentRequest', {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    course_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    student_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    academic_term_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    requested_by_lecturer_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'pending',
      // 'pending' | 'approved' | 'rejected' | 'cancelled'
    },
    note: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    requested_at: {
      type: DataTypes.DATE,
    },
    processed_by: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    processed_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  }, {
    tableName: 'enrollment_requests',
    timestamps: false,
  });

  return EnrollmentRequest;
};
