import { DataTypes } from 'sequelize'
import sequelize     from '../config/database.js'

const Document = sequelize.define('Documento', {
  id_documento: {
    type:          DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey:    true,
  },
  id_caso: {
    type:      DataTypes.INTEGER,
    allowNull: false,
  },
  id_usuario: {
    type:      DataTypes.INTEGER,
    allowNull: false,
  },
  nombre:        { type: DataTypes.STRING(255), allowNull: false },
  nombre_original:{ type: DataTypes.STRING(255), allowNull: false },
  tipo:          { type: DataTypes.STRING(100), allowNull: true  },
  tamanio:       { type: DataTypes.INTEGER,     allowNull: true  },
  categoria: {
    type:         DataTypes.ENUM('general', 'confidencial'),
    defaultValue: 'general',
  },
  descripcion:   { type: DataTypes.STRING(255), allowNull: true },
  analisis:      { type: DataTypes.TEXT,        allowNull: true },
  bloqueado:     { type: DataTypes.BOOLEAN,     defaultValue: true },
}, {
  tableName:  'documentos',
  timestamps: true,
})

export default Document