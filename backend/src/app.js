import express    from 'express'
import cors       from 'cors'
import dotenv     from 'dotenv'
import sequelize  from './config/database.js'
import { fileURLToPath } from 'url'
import { dirname, join }  from 'path'

// Rutas
import authRoutes      from './routes/auth.routes.js'
import clientRoutes    from './routes/clients.routes.js'
import caseRoutes      from './routes/cases.routes.js'
import appointmentRoutes from './routes/appointments.routes.js'
import userRoutes      from './routes/users.routes.js'
import documentRoutes  from './routes/documents.routes.js'

dotenv.config()

const app  = express()
const PORT = process.env.PORT || 3001
const __dirname = dirname(fileURLToPath(import.meta.url))

// Middlewares globales
app.use(cors())
app.use(express.json())

// Rutas de la API
app.use('/api/auth',       authRoutes)
app.use('/api/clientes',   clientRoutes)
app.use('/api/casos',      caseRoutes)
app.use('/api/citas',      appointmentRoutes)
app.use('/api/usuarios',   userRoutes)
app.use('/api/documentos', documentRoutes)

// Archivos estáticos
app.use('/uploads', express.static(join(__dirname, '../../uploads')))

// Ruta de prueba
app.get('/', (req, res) => {
  res.json({ message: 'API Despacho Jurídico funcionando ✅' })
})

// Conectar BD e iniciar servidor
sequelize.authenticate()
  .then(() => {
    console.log('✅ Conexión a MySQL exitosa')
    return sequelize.sync({ alter: false })
  })
  .then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`)
    })
  })
  .catch((err) => {
    console.error('❌ Error al conectar la BD:', err.message)
  })