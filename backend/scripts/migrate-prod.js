import sequelize from '../src/config/database.js'

const queries = [
  "ALTER TABLE casos ADD COLUMN IF NOT EXISTS reporte_ia TEXT NULL",
  "ALTER TABLE casos ADD COLUMN IF NOT EXISTS reporte_ia_at DATETIME NULL",
  "ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS origen VARCHAR(50) NULL DEFAULT NULL",
]

try {
  for (const q of queries) {
    await sequelize.query(q)
    console.log('OK:', q)
  }
  console.log('\n✅ Migraciones completadas.')
  process.exit(0)
} catch (err) {
  console.error('❌ Error:', err.message)
  process.exit(1)
}
