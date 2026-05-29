const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const VideoComment = sequelize.define('VideoComment', {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    video_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    parent_comment_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    comment_text: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    commented_at: {
      type: DataTypes.DATE,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  }, {
    tableName: 'video_comments',
    timestamps: false,
  });

  return VideoComment;
};
