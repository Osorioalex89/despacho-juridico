/**
 * Script para crear usuarios abogado y secretario directamente en la BD.
 * Uso: node backend/scripts/crearUsuarios.js
 *      (ejecutar desde la raíz del proyecto)
 */

import bcrypt    from 'bcryptjs'
import dotenv    from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join }  from 'path'
import { Sequelize, DataTypes } from 'sequelize'

// Cargar .env desde backend/
const __dirname = dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: join(__dirname, '../.env') })

// Conexión directa (no importamos el módulo principal para evitar efectos secundarios)
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  { host: process.env.DB_HOST, port: process.env.DB_PORT, dialect: 'mysql', logging: false }
)

// ── Usuarios a crear ──────────────────────────────────────────────
const USUARIOS = [
  {
    nombre:    'Lic. Horacio Sánchez Cerino',
    correo:    'abogadoadmin89@gmail.com',
    password:  'Horacio@SC2024',
    rol:       'abogado',
  },
  {
    nombre:    'Secretario Despacho',
    correo:    'secretario867@gmail.com',
    password:  'SecDesp@2024',
    rol:       'secretario',
  },
]

async function main() {
  try {
    await sequelize.authenticate()
    console.log('✓ Conexión a BD establecida\n')

    for (const u of USUARIOS) {
      const hash = await bcrypt.hash(u.password, 12)

      const [usuario, creado] = await sequelize.query(
        `INSERT INTO usuarios (nombre, correo, contrasena, rol, estado, activo, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, 'aprobado', true, NOW(), NOW())
         ON DUPLICATE KEY UPDATE
           nombre     = VALUES(nombre),
           rol        = VALUES(rol),
           estado     = 'aprobado',
           activo     = true,
           updatedAt  = NOW()`,
        { replacements: [u.nombre, u.correo, hash, u.rol] }
      )

      const accion = creado.affectedRows === 1 ? 'CREADO' : 'ACTUALIZADO'
      console.log(`[${accion}] ${u.rol.toUpperCase()} → ${u.correo}`)
      console.log(`         Contraseña: ${u.password}\n`)
    }

    console.log('✓ Listo. Ya puedes iniciar sesión con esos correos.')
  } catch (err) {
    console.error('✗ Error:', err.message)
    process.exit(1)
  } finally {
    await sequelize.close()
  }
}

main()
