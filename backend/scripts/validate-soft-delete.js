// Validación E2E del soft delete (F1.2) contra la BD real.
// Crea un caso de prueba, lo elimina (soft), verifica que findByPk lo oculta
// pero { paranoid:false } lo encuentra con deletedAt, lo restaura, y al final
// borra físicamente con force:true para no dejar basura.
//   Uso:  cd backend && node scripts/validate-soft-delete.js
import sequelize  from '../src/config/database.js'
import Case       from '../src/models/Case.js'
import Comment    from '../src/models/Comment.js'
import Movimiento from '../src/models/Movimiento.js'
import Client     from '../src/models/Client.js'
import Document   from '../src/models/Document.js'
import Appointment from '../src/models/Appointment.js'

let passed = 0, failed = 0
const ok  = (m) => { console.log(`  ✅ ${m}`); passed++ }
const bad = (m) => { console.log(`  ❌ ${m}`); failed++ }

let caso
try {
  await sequelize.authenticate()
  console.log('\n🗑  Validación E2E soft delete (F1.2)\n')

  // Confirmar que los 6 modelos están en modo paranoid
  for (const [name, model] of Object.entries({ Case, Client, Document, Comment, Movimiento, Appointment })) {
    if (model.options.paranoid) ok(`${name} tiene paranoid:true`)
    else bad(`${name} NO tiene paranoid:true`)
  }

  // ── Crear caso de prueba ────────────────────────────────────────
  caso = await Case.create({
    folio:          `T-${Date.now() % 100000000}`,
    asunto:         'PRUEBA SOFT DELETE (borrar)',
    tipo:           'Civil',
    estado:         'activo',
    fecha_apertura: '2026-06-01',
  })
  ok(`Caso creado id=${caso.id_caso}`)

  // ── Soft delete ─────────────────────────────────────────────────
  await caso.destroy()
  const visible = await Case.findByPk(caso.id_caso)
  if (visible === null) ok('Tras destroy(), findByPk lo oculta (paranoid funciona)')
  else bad('findByPk aún lo encuentra después de destroy()')

  const conDeleted = await Case.findByPk(caso.id_caso, { paranoid: false })
  if (conDeleted && conDeleted.deletedAt) ok(`paranoid:false lo recupera con deletedAt=${conDeleted.deletedAt.toISOString()}`)
  else bad('paranoid:false NO encuentra el caso soft-deleted')

  // ── Restaurar ──────────────────────────────────────────────────
  if (conDeleted) await conDeleted.restore()
  const restored = await Case.findByPk(caso.id_caso)
  if (restored && !restored.deletedAt) ok('Tras restore(), findByPk lo vuelve a ver')
  else bad('restore() no funcionó')

} catch (err) {
  bad(`Error: ${err.message}`)
} finally {
  // Limpieza: borrado físico para no dejar el caso de prueba en BD
  try {
    if (caso) await Case.destroy({ where: { id_caso: caso.id_caso }, force: true })
    console.log('\n🧹 Caso de prueba purgado físicamente.')
  } catch (e) {
    console.log(`\n⚠ Error limpiando: ${e.message}`)
  }
  await sequelize.close()
  console.log(`\nResultado: ${passed} pasaron, ${failed} fallaron\n`)
  process.exit(failed === 0 ? 0 : 1)
}
