const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const GradingFinalResult = sequelize.define('GradingFinalResult', {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    round_video_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    average_score: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
    },
    min_score: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
    },
    max_score: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
    },
    score_details: {
      type: DataTypes.TEXT,
      allowNull: true,
      // JSON: {"grader_scores":[...],"criteria_averages":[...]}
      get() {
        const val = this.getDataValue('score_details');
        return val ? JSON.parse(val) : null;
      },
      set(val) {
        this.setDataValue('score_details', val ? JSON.stringify(val) : null);
      },
    },
    final_result: {
      type: DataTypes.STRING(10),
      allowNull: false,
      // 'pass' | 'fail'
    },
    finalized_by: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    finalized_at: {
      type: DataTypes.DATE,
    },
    note: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  }, {
    tableName: 'grading_final_results',
    timestamps: false,
  });

  return GradingFinalResult;
};
