import express    from 'express'
import cors       from 'cors'
import helmet     from 'helmet'
import dotenv     from 'dotenv'
import sequelize  from './config/database.js'
import { fileURLToPath } from 'url'
import { dirname, join }  from 'path'

// Rutas
import authRoutes        from './routes/auth.routes.js'
import clientRoutes      from './routes/clients.routes.js'
import caseRoutes        from './routes/cases.routes.js'
import appointmentRoutes from './routes/appointments.routes.js'
import userRoutes        from './routes/users.routes.js'
import documentRoutes    from './routes/documents.routes.js'
import statsRoutes       from './routes/stats.routes.js'
import landingRoutes     from './routes/landing.routes.js'
import { startReminderWorker } from './workers/reminderWorker.js'

dotenv.config()

const app  = express()
const PORT = process.env.PORT || 3001
const __dirname = dirname(fileURLToPath(import.meta.url))

// ── Confiar en proxy de Railway/Heroku para rate-limit e IPs reales ──
app.set('trust proxy', 1)

// ── Seguridad de cabeceras ─────────────────────────────────────────
app.use(helmet())

// ── Middlewares globales ───────────────────────────────────────────
app.use(cors({
  origin: process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',')
    : ['http://localhost:5173', 'http://localhost:5174'],
  credentials: true,
}))
app.use(express.json())

// ── Rutas de la API ────────────────────────────────────────────────
app.use('/api/auth',       authRoutes)
app.use('/api/clientes',   clientRoutes)
app.use('/api/casos',      caseRoutes)
app.use('/api/citas',      appointmentRoutes)
app.use('/api/usuarios',   userRoutes)
app.use('/api/documentos', documentRoutes)
app.use('/api/stats',      statsRoutes)
app.use('/api/landing',    landingRoutes)

// NOTA: /uploads NO se sirve como estático para forzar auth en cada descarga.
// Toda descarga pasa por /api/documentos/:id/descargar o /api/documentos/mis-documentos/:id/descargar

// Ruta de prueba
app.get('/', (req, res) => {
  res.json({ message: 'API Despacho Jurídico funcionando' })
})

// ── Middleware global de errores ───────────────────────────────────
// Captura cualquier error no manejado. En producción nunca expone
// el stack trace ni mensajes internos de MySQL/Sequelize al cliente.
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('[Error no controlado]', err)

  if (process.env.NODE_ENV === 'production') {
    return res.status(500).json({ message: 'Error interno del servidor' })
  }

  // En desarrollo, devuelve el mensaje real para facilitar el debug
  res.status(err.status || 500).json({
    message: err.message,
    stack:   err.stack,
  })
})

// ── Migraciones seguras (idempotentes) ────────────────────────────
// Usa ALTER TABLE sin IF NOT EXISTS (compatible con MySQL 5.7+)
// Ignora error 1060 = columna ya existe
async function runMigrations() {
  const migrations = [
    "ALTER TABLE casos ADD COLUMN reporte_ia TEXT NULL",
    "ALTER TABLE casos ADD COLUMN reporte_ia_at DATETIME NULL",
    "ALTER TABLE usuarios ADD COLUMN origen VARCHAR(50) NULL DEFAULT NULL",
  ]
  for (const q of migrations) {
    try {
      await sequelize.query(q)
    } catch (err) {
      const isDuplicateColumn = err.original?.errno === 1060
      if (!isDuplicateColumn) throw err
    }
  }

  // Tabla historial chat IA (idempotente)
  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS chat_mensajes (
      id_mensaje   INT           NOT NULL AUTO_INCREMENT,
      id_caso      INT           NOT NULL,
      id_usuario   INT           NULL,
      role         ENUM('user','assistant') NOT NULL,
      content      TEXT          NOT NULL,
      createdAt    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id_mensaje),
      INDEX idx_chat_caso (id_caso),
      INDEX idx_chat_usuario (id_usuario)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `)

  // Agregar id_usuario a chat_mensajes si no existe (tablas ya creadas)
  try {
    await sequelize.query(`ALTER TABLE chat_mensajes ADD COLUMN id_usuario INT NULL AFTER id_caso`)
    await sequelize.query(`ALTER TABLE chat_mensajes ADD INDEX idx_chat_usuario (id_usuario)`)
  } catch (err) {
    const isDuplicateColumn = err.original?.errno === 1060
    if (!isDuplicateColumn) throw err
  }

  console.log('[Migrations] Columnas y tablas verificadas.')
}

// ── Conectar BD e iniciar servidor ────────────────────────────────
sequelize.authenticate()
  .then(() => {
    console.log('Conexión a MySQL exitosa')
    return sequelize.sync({ alter: false })
  })
  .then(() => runMigrations())
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Servidor corriendo en http://localhost:${PORT}`)
    })
    startReminderWorker()
  })
  .catch((err) => {
    console.error('Error al conectar la BD:', err.message)
  })
