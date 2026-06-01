const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const GradingGroup = sequelize.define('GradingGroup', {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    round_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    group_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    group_code: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    faculty_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'forming',
      // 'forming' | 'active' | 'closed'
    },
    created_by: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    created_at: {
      type: DataTypes.DATE,
    },
    note: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  }, {
    tableName: 'grading_groups',
    timestamps: false,
  });

  return GradingGroup;
};
