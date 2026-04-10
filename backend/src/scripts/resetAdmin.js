/**
 * Script para restaurar / verificar el usuario abogado de prueba.
 * Ejecución:  node src/scripts/resetAdmin.js
 */
import dotenv from 'dotenv'
import bcrypt  from 'bcryptjs'
import { fileURLToPath } from 'url'
import { dirname, join }  from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: join(__dirname, '../../.env') })

// Importar después de cargar dotenv
const { default: sequelize } = await import('../config/database.js')
const { default: User }      = await import('../models/User.js')

await sequelize.authenticate()
console.log('✅ Conexión a MySQL exitosa\n')

const CORREO    = 'abogado@despacho.com'
const PASSWORD  = 'Admin123'
const NOMBRE    = 'Abogado Admin'

const hash = await bcrypt.hash(PASSWORD, 10)

const [user, created] = await User.findOrCreate({
  where: { correo: CORREO },
  defaults: {
    nombre:     NOMBRE,
    correo:     CORREO,
    contrasena: hash,
    rol:        'abogado',
    estado:     'aprobado',
    activo:     true,
  },
})

if (!created) {
  // El usuario ya existe — corregir campos críticos
  await user.update({
    contrasena: hash,
    rol:        'abogado',
    estado:     'aprobado',
    activo:     true,
  })
  console.log('🔄 Usuario abogado actualizado:')
} else {
  console.log('🆕 Usuario abogado creado:')
}

console.log(`   Email:    ${CORREO}`)
console.log(`   Password: ${PASSWORD}`)
console.log(`   Rol:      abogado`)
console.log(`   Estado:   aprobado`)
console.log(`   Activo:   true`)

await sequelize.close()
