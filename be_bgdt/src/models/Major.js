const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Major = sequelize.define('Major', {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    major_name: {
      type: DataTypes.STRING(200),
      allowNull: false,
      unique: true,
    },
    faculty_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    is_lock: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  }, {
    tableName: 'majors',
    timestamps: false,
  });

  return Major;
};
