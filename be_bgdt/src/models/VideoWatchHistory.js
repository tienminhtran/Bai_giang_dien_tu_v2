const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const VideoWatchHistory = sequelize.define('VideoWatchHistory', {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    video_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    student_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    watched_at: {
      type: DataTypes.DATE,
    },
    watch_duration: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  }, {
    tableName: 'video_watch_history',
    timestamps: false,
  });

  return VideoWatchHistory;
};
