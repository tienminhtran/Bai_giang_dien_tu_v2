const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const AcademicTerm = sequelize.define('AcademicTerm', {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    academic_year: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    semester: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    start_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    end_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  }, {
    tableName: 'academic_terms',
    timestamps: false,
  });

  return AcademicTerm;
};
