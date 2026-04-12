import { DataTypes } from 'sequelize'
import sequelize     from '../config/database.js'

const ChatMensaje = sequelize.define('ChatMensaje', {
  id_mensaje: {
    type:          DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey:    true,
  },
  id_caso: {
    type:      DataTypes.INTEGER,
    allowNull: false,
  },
  role: {
    type:      DataTypes.ENUM('user', 'assistant'),
    allowNull: false,
  },
  content: {
    type:      DataTypes.TEXT,
    allowNull: false,
  },
}, {
  tableName:  'chat_mensajes',
  timestamps: true,
  updatedAt:  false,
})

export default ChatMensaje
