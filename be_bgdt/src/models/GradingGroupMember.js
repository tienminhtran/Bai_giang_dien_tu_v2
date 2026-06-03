const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const GradingGroupMember = sequelize.define('GradingGroupMember', {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    group_id: {
      type: DataTypes.UUID,
      allowNull: true, // null = member của nhóm (team) chưa được gán vào hội đồng
    },
    team_id: {
      type: DataTypes.UUID,
      allowNull: true, // gom member vào 1 nhóm chấm trước khi gán hội đồng
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
    position_title: {
      type: DataTypes.STRING(100),
      allowNull: true,
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
    tableName: 'grading_group_members',
    timestamps: false,
  });

  return GradingGroupMember;
};
