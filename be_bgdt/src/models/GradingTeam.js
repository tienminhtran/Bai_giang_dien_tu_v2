const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const GradingTeam = sequelize.define('GradingTeam', {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    round_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    team_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    note: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    created_by: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    created_at: {
      type: DataTypes.DATE,
    },
  }, {
    tableName: 'grading_teams',
    timestamps: false,
  });

  return GradingTeam;
};
