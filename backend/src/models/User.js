import { DataTypes } from 'sequelize'
import sequelize     from '../config/database.js'

const User = sequelize.define('Usuario', {
  id_usuario: {
    type:          DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey:    true,
  },
  nombre: {
    type:      DataTypes.STRING(100),
    allowNull: false,
  },
  correo: {
    type:      DataTypes.STRING(100),
    allowNull: false,
    unique:    true,
  },
  contrasena: {
    type:      DataTypes.STRING(255),
    allowNull: false,
  },
  rol: {
    type:         DataTypes.ENUM('abogado', 'secretario', 'cliente', 'usuario'),
    allowNull:    false,
    defaultValue: 'usuario',
  },
  estado: {
    type:         DataTypes.ENUM('pendiente', 'aprobado', 'rechazado'),
    allowNull:    false,
    defaultValue: 'pendiente',
  },
  activo: {
    type:         DataTypes.BOOLEAN,
    defaultValue: false,
  },
  verification_token: {
    type:      DataTypes.STRING(64),
    allowNull: true,
  },
  otp_code: {
    type:      DataTypes.STRING(6),
    allowNull: true,
  },
  otp_expires: {
    type:      DataTypes.DATE,
    allowNull: true,
  },
  otp_intentos: {
    type:         DataTypes.TINYINT,
    defaultValue: 0,
  },
  reset_solicitado: {
    type:         DataTypes.BOOLEAN,
    defaultValue: false,
  },
  reset_solicitado_at: {
    type:      DataTypes.DATE,
    allowNull: true,
  },
  reset_token: {
    type:      DataTypes.STRING(64),
    allowNull: true,
  },
  reset_token_expires: {
    type:      DataTypes.DATE,
    allowNull: true,
  },
  origen: {
    type:         DataTypes.STRING(50),
    allowNull:    true,
    defaultValue: null,
  },
  // F6.1 — Consentimiento LFPDPPP
  aviso_aceptado_at: { type: DataTypes.DATE,       allowNull: true },
  aviso_version:     { type: DataTypes.STRING(10), allowNull: true },
  // F6.2 — Solicitud y materialización de derecho de cancelación (ARCO)
  cancelacion_solicitada_at: { type: DataTypes.DATE, allowNull: true },
  anonimizado_at:            { type: DataTypes.DATE, allowNull: true },
}, {
  tableName:  'usuarios',
  timestamps: true,
})

export default User