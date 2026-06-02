import { DataTypes }          from 'sequelize'
import sequelize              from '../config/database.js'
import { applyFieldEncryption } from './encryptedFields.js'

const Comment = sequelize.define('Comentario', {
  id_comentario: {
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
  contenido: {
    type:      DataTypes.TEXT,
    allowNull: false,
  },
}, {
  tableName:  'comentarios',
  timestamps: true,
  paranoid:   true,   // F1.2 — soft delete
})

applyFieldEncryption(Comment, ['contenido'])

export default Comment
