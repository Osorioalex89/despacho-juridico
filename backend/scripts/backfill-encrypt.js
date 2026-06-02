// F0.2 — Backfill de cifrado at-rest para los 6 campos de Ola A.
// Lee registros con encrypted_version IS NULL, cifra los campos que estén
// en claro (deja intactos los que ya son v1:) y marca encrypted_version=1.
// Diseño anti-pitfalls (ver SECURITY-PLAN F0.2):
//   - paginación por PK ASC (no OFFSET → resistente a writes concurrentes)
//   - BATCH_SIZE configurable (default 50)
//   - --dry-run sin escrituras
//   - en producción exige --i-have-snapshot
//   - throttle 200ms entre lotes
//   - update directo con sequelize.query → NO dispara hooks → no doble-cifra
//   - reanudable: si muere, basta correrlo de nuevo (el WHERE filtra por NULL)
//
// Uso:
//   cd backend && node scripts/backfill-encrypt.js --dry-run
//   cd backend && node scripts/backfill-encrypt.js                # local
//   NODE_ENV=production node scripts/backfill-encrypt.js --i-have-snapshot
//   cd backend && node scripts/backfill-encrypt.js --table=casos  # una sola tabla
import sequelize           from '../src/config/database.js'
import { encryptIfPresent } from '../src/services/crypto.service.js'

const args      = new Set(process.argv.slice(2))
const dryRun    = args.has('--dry-run')
const hasSnap   = args.has('--i-have-snapshot')
const tableArg  = [...args].find(a => a.startsWith('--table='))?.split('=')[1]
const batchArg  = [...args].find(a => a.startsWith('--batch-size='))?.split('=')[1]
const BATCH     = Number(batchArg || process.env.ENCRYPTION_BACKFILL_BATCH_SIZE || 50)

if (process.env.NODE_ENV === 'production' && !hasSnap && !dryRun) {
  console.error('\n❌ ABORTADO: NODE_ENV=production requiere --i-have-snapshot (o --dry-run).')
  console.error('   Haz mysqldump o snapshot Railway ANTES de cifrar datos en producción.\n')
  process.exit(2)
}

const TABLES = [
  { table: 'casos',         pk: 'id_caso',       fields: ['reporte_ia'] },
  { table: 'comentarios',   pk: 'id_comentario', fields: ['contenido'] },
  { table: 'documentos',    pk: 'id_documento',  fields: ['analisis', 'descripcion'] },
  { table: 'movimientos',   pk: 'id_movimiento', fields: ['descripcion'] },
  { table: 'chat_mensajes', pk: 'id_mensaje',    fields: ['content'] },
]

const targets = tableArg ? TABLES.filter(t => t.table === tableArg) : TABLES
if (tableArg && targets.length === 0) {
  console.error(`❌ Tabla "${tableArg}" no es parte del set Ola A. Permitidas: ${TABLES.map(t => t.table).join(', ')}`)
  process.exit(2)
}

const sleep = (ms) => new Promise(r => setTimeout(r, ms))

async function backfillTable({ table, pk, fields }) {
  const fieldList = fields.join(', ')
  let lastId  = 0
  let scanned = 0
  let updated = 0
  let alreadyEncrypted = 0
  let batchNum = 0

  console.log(`\n── ${table} (campos: ${fields.join(', ')}) ──`)

  while (true) {
    const [rows] = await sequelize.query(
      `SELECT ${pk}, ${fieldList}
         FROM ${table}
        WHERE encrypted_version IS NULL AND ${pk} > ?
        ORDER BY ${pk} ASC
        LIMIT ?`,
      { replacements: [lastId, BATCH] }
    )
    if (rows.length === 0) break
    batchNum++

    for (const row of rows) {
      scanned++
      const updates = {}
      let rowHadPlaintext = false

      for (const f of fields) {
        const v = row[f]
        if (v === null || v === undefined || v === '') continue
        if (typeof v === 'string' && v.startsWith('v1:')) continue // ya cifrado
        updates[f] = encryptIfPresent(v)
        rowHadPlaintext = true
      }

      if (!rowHadPlaintext) alreadyEncrypted++

      if (!dryRun) {
        // Set encrypted_version=1 SIEMPRE (marca el row como procesado).
        // Si hay campos en claro, los cifra; si todos eran v1:, solo marca.
        const sets = Object.keys(updates).map(k => `${k} = ?`).concat(['encrypted_version = 1'])
        const vals = Object.values(updates).concat([row[pk]])
        await sequelize.query(
          `UPDATE ${table} SET ${sets.join(', ')} WHERE ${pk} = ?`,
          { replacements: vals }
        )
        updated++
      }
    }

    lastId = rows[rows.length - 1][pk]
    console.log(`  [batch ${batchNum}] scanned=${rows.length} lastId=${lastId}`)
    await sleep(200) // throttle al pool de conexiones
  }

  return { table, scanned, updated, alreadyEncrypted }
}

;(async () => {
  console.log(`\n🔐 Backfill cifrado (Ola A) — ${dryRun ? 'DRY-RUN' : 'ESCRIBIENDO'}`)
  console.log(`   BATCH_SIZE=${BATCH} · NODE_ENV=${process.env.NODE_ENV || 'undefined'}`)
  if (tableArg) console.log(`   Tabla limitada: ${tableArg}`)

  try {
    await sequelize.authenticate()
    const report = []
    for (const t of targets) report.push(await backfillTable(t))

    console.log('\n📊 Resumen:')
    for (const r of report) {
      console.log(`   ${r.table.padEnd(15)} scanned=${r.scanned}  updated=${r.updated}  ya_cifrados=${r.alreadyEncrypted}`)
    }
    if (dryRun) console.log('\n   ⚠ DRY-RUN: no se escribió nada. Quita --dry-run para aplicar.')
    else        console.log('\n   ✅ Backfill completado.')
  } catch (err) {
    console.error('\n❌ Error:', err.message)
    process.exit(1)
  } finally {
    await sequelize.close()
  }
})()
