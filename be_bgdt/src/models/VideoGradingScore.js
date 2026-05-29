const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const VideoGradingScore = sequelize.define('VideoGradingScore', {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    round_video_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    grader_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    criteria_scores: {
      type: DataTypes.TEXT,
      allowNull: false,
      // JSON: [{"criteria_id","criteria_name","max_score","score","note"},...]
      get() {
        const val = this.getDataValue('criteria_scores');
        return val ? JSON.parse(val) : [];
      },
      set(val) {
        this.setDataValue('criteria_scores', JSON.stringify(val));
      },
    },
    total_score: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
    },
    result: {
      type: DataTypes.STRING(10),
      allowNull: true,
      // 'pass' | 'fail'
    },
    comment: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    graded_at: {
      type: DataTypes.DATE,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  }, {
    tableName: 'video_grading_scores',
    timestamps: false,
  });

  return VideoGradingScore;
};
