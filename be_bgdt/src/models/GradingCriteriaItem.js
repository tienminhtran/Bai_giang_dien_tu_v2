const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const GradingCriteriaItem = sequelize.define('GradingCriteriaItem', {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    template_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    code: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    criteria_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    max_score: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
    },
    weight: {
      type: DataTypes.DECIMAL(5, 4),
      allowNull: true,
    },
    display_order: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    is_required: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  }, {
    tableName: 'grading_criteria_items',
    timestamps: false,
  });

  return GradingCriteriaItem;
};
