// F5.1 — Modelo AuditLog (registro inmutable de eventos de seguridad).
// Reglas:
//   - Inserción única vía services/auditLogger.js; nunca se actualiza ni borra desde la app.
//   - Sin paranoid (no soft-delete); el cron de purga F1.2 NO toca esta tabla.
//   - Sin cifrado at-rest: el log es exactamente lo que el auditor debe leer.
//   - Campos pequeños y agnósticos al dominio: action, resource_type/id, metadata JSON.
import { DataTypes } from 'sequelize'
import sequelize     from '../config/database.js'

const AuditLog = sequelize.define('AuditLog', {
  id: {
    type:          DataTypes.BIGINT,
    autoIncrement: true,
    primaryKey:    true,
  },
  user_id:       { type: DataTypes.INTEGER, allowNull: true  },
  ip:            { type: DataTypes.STRING(45), allowNull: true },
  action:        { type: DataTypes.STRING(50), allowNull: false },
  resource_type: { type: DataTypes.STRING(30), allowNull: true  },
  resource_id:   { type: DataTypes.INTEGER,    allowNull: true  },
  metadata_json: { type: DataTypes.JSON,       allowNull: true  },
  created_at:    { type: DataTypes.DATE,       defaultValue: DataTypes.NOW },
}, {
  tableName:  'audit_log',
  timestamps: false,   // usamos created_at propio para encajar con el esquema F5.1
})

export default AuditLog
