const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const LectureVideoVersion = sequelize.define('LectureVideoVersion', {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    video_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    version_number: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    version_type: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'initial',
      // 'initial' | 'revision' | 'update'
    },
    video_url: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    video_url_backup: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    duration: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    file_size: {
      type: DataTypes.BIGINT,
      allowNull: true,
    },
    change_note: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    uploaded_by: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    uploaded_at: {
      type: DataTypes.DATE,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  }, {
    tableName: 'lecture_video_versions',
    timestamps: false,
  });

  return LectureVideoVersion;
};
