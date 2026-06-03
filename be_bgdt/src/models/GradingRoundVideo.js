const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const GradingRoundVideo = sequelize.define('GradingRoundVideo', {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    round_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    group_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    source_round_video_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    video_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    video_version_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'pending',
      // 'pending' | 'grading' | 'graded'
      // 'đang chờ xử lý' | 'chấm điểm' | 'đã chấm điểm'
    },
    grading_result: {
      type: DataTypes.STRING(20),
      allowNull: true,
      // 'passed' | 'needs_revision' | 'failed'
      // 'đã vượt qua - xuất bản' | 'cần xem xét lại' | 'thất bại'
    },
    is_published: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    published_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    published_by: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    note: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  }, {
    tableName: 'grading_round_videos',
    timestamps: false,
  });

  return GradingRoundVideo;
};
