const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const PasswordResetToken = sequelize.define('PasswordResetToken', {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    token_hash: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    used: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    created_at: {
      type: DataTypes.DATE,
    },
  }, {
    tableName: 'password_reset_tokens',
    timestamps: false,
  });

  return PasswordResetToken;
};
