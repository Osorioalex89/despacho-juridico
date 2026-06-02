// Validación E2E del cifrado at-rest (F1.1 Ola A) contra la BD real.
// Crea registros de prueba, verifica que en BD se guardan cifrados (v1:),
// que el modelo los lee en claro, y los borra al final. NO toca datos reales.
//   Uso:  cd backend && node scripts/validate-encryption.js
import sequelize   from '../src/config/database.js'
import Case        from '../src/models/Case.js'
import Comment     from '../src/models/Comment.js'
import Movimiento  from '../src/models/Movimiento.js'
import ChatMensaje from '../src/models/ChatMensaje.js'

let passed = 0, failed = 0
const ok  = (m) => { console.log(`  ✅ ${m}`); passed++ }
const bad = (m) => { console.log(`  ❌ ${m}`); failed++ }

// Lee el valor crudo en BD (sequelize.query NO dispara hooks → vemos lo almacenado)
async function raw(table, pk, id, col) {
  const [rows] = await sequelize.query(
    `SELECT ${col} AS v FROM ${table} WHERE ${pk} = ?`, { replacements: [id] }
  )
  return rows[0]?.v
}

function checkCifrado(label, rawVal, plainVal, original) {
  if (typeof rawVal === 'string' && rawVal.startsWith('v1:')) ok(`${label}: en BD está cifrado (v1:)`)
  else bad(`${label}: en BD NO está cifrado → "${String(rawVal).slice(0, 40)}"`)
  if (plainVal === original) ok(`${label}: el modelo lo lee en claro`)
  else bad(`${label}: el modelo NO lo descifra → "${String(plainVal).slice(0, 40)}"`)
}

let caso, comentario, movimiento, chat
try {
  await sequelize.authenticate()

  const [usuarios] = await sequelize.query('SELECT id_usuario FROM usuarios LIMIT 1')
  const idUsuario = usuarios[0]?.id_usuario
  if (!idUsuario) throw new Error('No hay usuarios en la BD para la prueba')

  console.log('\n🔐 Validación E2E cifrado at-rest (F1.1 Ola A)\n')

  // ── Case.reporte_ia (create + update) ──────────────────────────
  caso = await Case.create({
    folio:          `T-${Date.now() % 100000000}`,
    asunto:         'PRUEBA CIFRADO (borrar)',
    tipo:           'Civil',
    estado:         'activo',
    fecha_apertura: '2026-05-28',
    reporte_ia:     'REPORTE SECRETO CREATE',
  })
  checkCifrado('Case.reporte_ia (create)',
    await raw('casos', 'id_caso', caso.id_caso, 'reporte_ia'),
    (await Case.findByPk(caso.id_caso)).reporte_ia, 'REPORTE SECRETO CREATE')

  await caso.update({ reporte_ia: 'REPORTE SECRETO UPDATE' })
  checkCifrado('Case.reporte_ia (update)',
    await raw('casos', 'id_caso', caso.id_caso, 'reporte_ia'),
    (await Case.findByPk(caso.id_caso)).reporte_ia, 'REPORTE SECRETO UPDATE')

  // ── Comment.contenido ──────────────────────────────────────────
  comentario = await Comment.create({
    id_caso: caso.id_caso, id_usuario: idUsuario, contenido: 'COMENTARIO SECRETO',
  })
  checkCifrado('Comment.contenido',
    await raw('comentarios', 'id_comentario', comentario.id_comentario, 'contenido'),
    (await Comment.findByPk(comentario.id_comentario)).contenido, 'COMENTARIO SECRETO')

  // ── Movimiento.descripcion ─────────────────────────────────────
  movimiento = await Movimiento.create({
    id_caso: caso.id_caso, tipo: 'otro',
    descripcion: 'MOVIMIENTO SECRETO', fecha_movimiento: '2026-05-28',
  })
  checkCifrado('Movimiento.descripcion',
    await raw('movimientos', 'id_movimiento', movimiento.id_movimiento, 'descripcion'),
    (await Movimiento.findByPk(movimiento.id_movimiento)).descripcion, 'MOVIMIENTO SECRETO')

  // ── ChatMensaje.content (bulkCreate → beforeBulkCreate) ─────────
  const creados = await ChatMensaje.bulkCreate([
    { id_caso: caso.id_caso, id_usuario: idUsuario, role: 'user', content: 'CHAT SECRETO BULK' },
  ])
  chat = creados[0]
  checkCifrado('ChatMensaje.content (bulkCreate)',
    await raw('chat_mensajes', 'id_mensaje', chat.id_mensaje, 'content'),
    (await ChatMensaje.findByPk(chat.id_mensaje)).content, 'CHAT SECRETO BULK')

} catch (err) {
  bad(`Error de ejecución: ${err.message}`)
} finally {
  // Limpieza — borrar todo lo de prueba
  try {
    // force:true → bypass paranoid (F1.2) y borrado físico real para no dejar basura
    if (chat)       await ChatMensaje.destroy({ where: { id_mensaje: chat.id_mensaje }, force: true })
    if (movimiento) await Movimiento.destroy({ where: { id_movimiento: movimiento.id_movimiento }, force: true })
    if (comentario) await Comment.destroy({ where: { id_comentario: comentario.id_comentario }, force: true })
    if (caso)       await Case.destroy({ where: { id_caso: caso.id_caso }, force: true })
    console.log('\n🧹 Registros de prueba borrados.')
  } catch (e) {
    console.log(`\n⚠ Error limpiando registros de prueba: ${e.message}`)
  }
  await sequelize.close()
  console.log(`\nResultado: ${passed} pasaron, ${failed} fallaron\n`)
  process.exit(failed === 0 ? 0 : 1)
}
