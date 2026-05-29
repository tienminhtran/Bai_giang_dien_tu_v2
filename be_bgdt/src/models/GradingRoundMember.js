const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const GradingRoundMember = sequelize.define('GradingRoundMember', {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    round_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    lecturer_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    member_role: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'member',
      // 'chair' | 'member' | 'secretary'
    },
    assigned_by: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    assigned_at: {
      type: DataTypes.DATE,
    },
  }, {
    tableName: 'grading_round_members',
    timestamps: false,
  });

  return GradingRoundMember;
};
