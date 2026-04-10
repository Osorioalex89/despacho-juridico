import { DataTypes } from 'sequelize'
import sequelize     from '../config/database.js'

const Movimiento = sequelize.define('Movimiento', {
  id_movimiento: {
    type:          DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey:    true,
  },
  id_caso: {
    type:      DataTypes.INTEGER,
    allowNull: false,
  },
  tipo: {
    type:      DataTypes.ENUM('auto', 'sentencia', 'audiencia', 'oficio', 'otro'),
    allowNull: false,
  },
  descripcion: {
    type:      DataTypes.TEXT,
    allowNull: false,
  },
  fecha_movimiento: {
    type:      DataTypes.DATEONLY,
    allowNull: false,
  },
}, {
  tableName:  'movimientos',
  timestamps: true,
})

export default Movimiento