const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const GradingRound = sequelize.define('GradingRound', {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    session_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    round_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    round_number: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    faculty_scope_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'forming',
      // 'forming' | 'active' | 'finalizing' | 'closed'
    },
    parent_round_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    created_by: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    created_at: {
      type: DataTypes.DATE,
    },
    started_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    closed_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    note: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  }, {
    tableName: 'grading_rounds',
    timestamps: false,
  });

  return GradingRound;
};
