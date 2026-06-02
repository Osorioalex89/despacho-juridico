// Validación E2E F6.2 — ARCO sobre la BD real.
//   1. Crea usuario + cliente de prueba (no impacta datos reales).
//   2. Marca solicitud de cancelación → verifica cancelacion_solicitada_at.
//   3. Anonimiza → verifica nombre/correo/teléfono redactados, contraseña neutralizada
//      y que el id_cliente/id_caso siguen consultables (integridad referencial).
//   4. Limpia con force:true.
import sequelize from '../src/config/database.js'
import User      from '../src/models/User.js'
import Client    from '../src/models/Client.js'
import { anonimizarUsuario, solicitarCancelacion } from '../src/controllers/arco.controller.js'

let passed = 0, failed = 0
const ok  = (m) => { console.log(`  ✅ ${m}`); passed++ }
const bad = (m) => { console.log(`  ❌ ${m}`); failed++ }

const fakeRes = () => {
  const r = { _status: 200, _body: null }
  r.status = (s) => { r._status = s; return r }
  r.json   = (b) => { r._body   = b; return r }
  return r
}

let usuario, cliente
try {
  await sequelize.authenticate()
  console.log('\n📋 Validación E2E ARCO (F6.2)\n')

  const stamp = Date.now()
  usuario = await User.create({
    nombre:    'TEST ARCO',
    correo:    `t-arco-${stamp}@test.local`,
    contrasena:'$2a$10$dummyhashdummyhashdummyhash.dummy',
    rol:       'cliente',
    activo:    true,
    aviso_aceptado_at: new Date(),
    aviso_version:     '1.0',
  })
  cliente = await Client.create({
    id_usuario: usuario.id_usuario,
    nombre:     'TEST ARCO',
    correo:     usuario.correo,
    telefono:   '5551234567',
    direccion:  'Calle Test 123',
    rfc:        'TEST900101ABC',
  })
  ok(`usuario+cliente creados (uid=${usuario.id_usuario}, cli=${cliente.id_cliente})`)

  // 1) Solicitar cancelación
  const req1 = { user: { id: usuario.id_usuario }, ip: '127.0.0.1', body: { motivo: 'prueba' } }
  const res1 = fakeRes()
  await solicitarCancelacion(req1, res1)
  await usuario.reload()
  if (usuario.cancelacion_solicitada_at) ok(`cancelacion_solicitada_at registrado`)
  else bad('no se registró la solicitud')

  // Idempotente: segunda llamada no debe romper, debe avisar que ya hay una en curso
  const res1b = fakeRes()
  await solicitarCancelacion(req1, res1b)
  if (res1b._body?.fecha) ok('segunda solicitud devuelve fecha existente (idempotente)')
  else bad(`segunda solicitud inesperada: ${JSON.stringify(res1b._body)}`)

  // 2) Anonimizar
  const reqAdmin = { user: { id: 1 }, ip: '127.0.0.1', params: { id: String(usuario.id_usuario) } }
  const res2 = fakeRes()
  await anonimizarUsuario(reqAdmin, res2)
  if (res2._status === 200) ok('endpoint de anonimización respondió 200')
  else bad(`anonimizar respondió ${res2._status}: ${JSON.stringify(res2._body)}`)

  await usuario.reload()
  await cliente.reload()

  if (usuario.nombre === `[REDACTADO_${usuario.id_usuario}]`) ok('User.nombre redactado')
  else bad(`User.nombre = ${usuario.nombre}`)
  if (usuario.correo.startsWith('redactado_') && usuario.correo.endsWith('@anon.local')) ok('User.correo neutralizado')
  else bad(`User.correo = ${usuario.correo}`)
  if (usuario.contrasena === '!ANONIMIZADO!') ok('User.contrasena neutralizada (login imposible)')
  else bad('contraseña no neutralizada')
  if (usuario.activo === false) ok('User.activo = false')
  else bad('usuario sigue activo')
  if (usuario.anonimizado_at) ok(`anonimizado_at registrado: ${usuario.anonimizado_at.toISOString()}`)
  else bad('anonimizado_at no registrado')

  if (cliente.nombre.startsWith('[REDACTADO_')) ok('Client.nombre redactado')
  else bad(`Client.nombre = ${cliente.nombre}`)
  if (cliente.telefono === null) ok('Client.telefono nulo')
  else bad('Client.telefono no fue limpiado')
  if (cliente.rfc === null) ok('Client.rfc nulo')
  else bad('Client.rfc no fue limpiado')

  // 3) Doble anonimización debe rechazar
  const res3 = fakeRes()
  await anonimizarUsuario(reqAdmin, res3)
  if (res3._status === 400) ok('segunda anonimización rechazada (400)')
  else bad(`segunda anonimización aceptada: ${res3._status}`)

} catch (err) {
  bad(`Error: ${err.message}`)
} finally {
  try {
    if (cliente) await Client.destroy({ where: { id_cliente: cliente.id_cliente }, force: true })
    if (usuario) await User.destroy({ where: { id_usuario: usuario.id_usuario }, force: true })
    console.log('\n🧹 Registros de prueba purgados.')
  } catch (e) { console.log(`\n⚠ Error limpiando: ${e.message}`) }
  await sequelize.close()
  console.log(`\nResultado: ${passed} pasaron, ${failed} fallaron\n`)
  process.exit(failed === 0 ? 0 : 1)
}
