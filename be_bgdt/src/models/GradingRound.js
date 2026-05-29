const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const GradingRound = sequelize.define('GradingRound', {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    course_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    round_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    council_type: {
      type: DataTypes.STRING(20),
      allowNull: false,
      // 'evaluator' | 'secretary'
    },
    criteria_template_id: {
      type: DataTypes.UUID,
      allowNull: false,
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
