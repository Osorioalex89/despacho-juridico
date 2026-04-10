import { DataTypes } from 'sequelize'
import sequelize     from '../config/database.js'
import Client        from './Client.js'

const Appointment = sequelize.define('Cita', {
  id_cita: {
    type:          DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey:    true,
  },
  id_cliente: {
    type:      DataTypes.INTEGER,
    allowNull: true,
  },
  id_caso: {
    type:      DataTypes.INTEGER,
    allowNull: true,
  },
  id_abogado: {
    type:      DataTypes.INTEGER,
    allowNull: true,
  },
  fecha: {
    type:      DataTypes.DATEONLY,
    allowNull: false,
  },
  hora: {
    type:      DataTypes.TIME,
    allowNull: false,
  },
  motivo: {
    type:      DataTypes.STRING(200),
    allowNull: false,
  },
  estado: {
    type:         DataTypes.ENUM('pendiente', 'confirmada', 'cancelada'),
    allowNull:    false,
    defaultValue: 'pendiente',
  },
  notas: {
    type:      DataTypes.TEXT,
    allowNull: true,
  },
  mensaje: {
  type:      DataTypes.TEXT,
  allowNull: true,
},
id_solicitante: {
  type:      DataTypes.INTEGER,
  allowNull: true,
},
}, {
  tableName:  'citas',
  timestamps: true,
})

Appointment.belongsTo(Client, { foreignKey: 'id_cliente', as: 'Cliente' })

export default Appointment