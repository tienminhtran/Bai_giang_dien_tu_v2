const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const GradingCriteriaTemplate = sequelize.define('GradingCriteriaTemplate', {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    template_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    criteria: {
      type: DataTypes.TEXT,
      allowNull: false,
      // JSON: [{"id","name","description","min_score","max_score","weight"},...]
      get() {
        const val = this.getDataValue('criteria');
        return val ? JSON.parse(val) : [];
      },
      set(val) {
        this.setDataValue('criteria', JSON.stringify(val));
      },
    },
    total_max_score: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 100,
    },
    pass_score: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 70,
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
    updated_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  }, {
    tableName: 'grading_criteria_templates',
    timestamps: false,
  });

  return GradingCriteriaTemplate;
};
