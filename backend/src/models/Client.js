import { DataTypes } from 'sequelize'
import sequelize     from '../config/database.js'

const Client = sequelize.define('Cliente', {
  id_cliente: {
    type:          DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey:    true,
  },
  id_usuario: {
    type:      DataTypes.INTEGER,
    allowNull: true,
  },
  nombre: {
    type:      DataTypes.STRING(100),
    allowNull: false,
  },
  telefono: {
    type:      DataTypes.STRING(20),
    allowNull: true,
  },
  correo: {
    type:      DataTypes.STRING(100),
    allowNull: true,
  },
  direccion: {
    type:      DataTypes.STRING(255),
    allowNull: true,
  },
  rfc: {
    type:      DataTypes.STRING(20),
    allowNull: true,
  },
  notas: {
    type:      DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName:  'clientes',
  timestamps: true,
})

export default Client