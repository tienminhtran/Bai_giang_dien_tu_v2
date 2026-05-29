const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const AcademicDegree = sequelize.define('AcademicDegree', {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    degree_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },
  }, {
    tableName: 'academic_degrees',
    timestamps: false,
  });

  return AcademicDegree;
};
