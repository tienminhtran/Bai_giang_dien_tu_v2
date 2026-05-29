const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const LectureVideo = sequelize.define('LectureVideo', {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    section_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    video_order: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    uploaded_by: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    uploaded_at: {
      type: DataTypes.DATE,
    },
    status: {
      type: DataTypes.STRING(30),
      allowNull: false,
      defaultValue: 'registered',
      // 'registered' | 'under_review' | 'revision' | 'secretary_review' | 'published' | 'rejected'
    },
    current_published_version_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  }, {
    tableName: 'lecture_videos',
    timestamps: false,
  });

  return LectureVideo;
};
