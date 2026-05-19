import dotenv from 'dotenv'
dotenv.config()

import sequelize from '../config/database.js'

const fixNombres = async () => {
  const [docs] = await sequelize.query(
    'SELECT id_documento, nombre_original FROM documentos WHERE nombre_original IS NOT NULL'
  )

  let fixed = 0
  let skipped = 0

  for (const doc of docs) {
    const original = doc.nombre_original
    const converted = Buffer.from(original, 'latin1').toString('utf8')

    // Solo actualizar si el resultado difiere (tenía caracteres corruptos)
    if (converted !== original) {
      await sequelize.query(
        'UPDATE documentos SET nombre_original = ? WHERE id_documento = ?',
        { replacements: [converted, doc.id_documento] }
      )
      console.log(`[FIX] ${original} → ${converted}`)
      fixed++
    } else {
      skipped++
    }
  }

  console.log(`\nListo: ${fixed} corregidos, ${skipped} sin cambios.`)
  await sequelize.close()
}

fixNombres().catch(err => {
  console.error('Error:', err.message)
  process.exit(1)
})
