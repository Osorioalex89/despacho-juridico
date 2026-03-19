
import caseRoutes from './routes/cases.routes.js'
import clientRoutes from './routes/clients.routes.js'
import express    from 'express'
import cors       from 'cors'
import dotenv     from 'dotenv'
import sequelize  from './config/database.js'

// Rutas
import authRoutes from './routes/auth.routes.js'

dotenv.config()

const app  = express()
const PORT = process.env.PORT || 3001

// Middlewares globales
app.use(cors())
app.use(express.json())
app.use('/api/casos', caseRoutes)


// Rutas de la API
app.use('/api/auth', authRoutes)
app.use('/api/clientes', clientRoutes)

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