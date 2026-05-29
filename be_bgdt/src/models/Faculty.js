const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Faculty = sequelize.define('Faculty', {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    faculty_name: {
      type: DataTypes.STRING(200),
      allowNull: false,
      unique: true,
    },
  }, {
    tableName: 'faculties',
    timestamps: false,
  });

  return Faculty;
};
