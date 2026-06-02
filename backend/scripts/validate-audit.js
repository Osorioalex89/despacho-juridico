// Validación E2E de F5 (auditoría).
//   1. Crea la tabla audit_log si no existe.
//   2. logAction() inserta filas correctamente.
//   3. El modelo expone los campos según el esquema.
//   4. Las filas insertadas son consultables con findAll/findAndCountAll.
//   5. Limpia las filas de prueba al final.
import sequelize from '../src/config/database.js'
import AuditLog  from '../src/models/AuditLog.js'
import { logAction, ACTIONS } from '../src/services/auditLogger.js'

let passed = 0, failed = 0
const ok  = (m) => { console.log(`  ✅ ${m}`); passed++ }
const bad = (m) => { console.log(`  ❌ ${m}`); failed++ }

let creados = []
try {
  await sequelize.authenticate()

  // Asegurar tabla
  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS audit_log (
      id BIGINT NOT NULL AUTO_INCREMENT, user_id INT NULL, ip VARCHAR(45) NULL,
      action VARCHAR(50) NOT NULL, resource_type VARCHAR(30) NULL,
      resource_id INT NULL, metadata_json JSON NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      INDEX idx_audit_user_action (user_id, action),
      INDEX idx_audit_created (created_at),
      INDEX idx_audit_action (action)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `)

  console.log('\n🧾 Validación E2E auditoría (F5)\n')

  // 1) logAction inserta y persiste metadata JSON
  const fakeReq = { user: { id: 99999 }, ip: '203.0.113.42' }
  logAction(fakeReq, ACTIONS.LOGIN, { metadata: { correo: 'demo@audit.test', rol: 'cliente' } })
  logAction(fakeReq, ACTIONS.DOC_DOWNLOAD, { resourceType: 'documento', resourceId: 77777, metadata: { canal: 'admin' } })
  logAction(null, ACTIONS.LOGIN_FAILED, { userId: 99998, metadata: { motivo: 'password_invalido' } })
  await new Promise(r => setTimeout(r, 300)) // fire-and-forget → esperar inserts

  // 2) recuperar y verificar
  const rows = await AuditLog.findAll({
    where: { user_id: [99999, 99998] },
    order: [['id', 'ASC']],
  })
  creados = rows.map(r => r.id)
  if (rows.length === 3) ok(`3 filas insertadas (${rows.length} encontradas)`)
  else bad(`Se esperaban 3 filas, se encontraron ${rows.length}`)

  const login = rows.find(r => r.action === 'login')
  if (login?.metadata_json?.correo === 'demo@audit.test') ok('metadata_json se persiste y se lee como objeto')
  else bad(`metadata corrupta: ${JSON.stringify(login?.metadata_json)}`)

  const dl = rows.find(r => r.action === 'doc_download')
  if (dl?.resource_type === 'documento' && dl?.resource_id === 77777) ok('resource_type/id correctos')
  else bad('resource_type/id incorrectos')

  const failedLogin = rows.find(r => r.action === 'login_failed')
  if (failedLogin?.user_id === 99998) ok('userId puede pasarse explícitamente cuando req es null')
  else bad('userId explícito no se aplicó')

  // 3) findAndCountAll funciona (la usa /api/audit)
  const { count, rows: page } = await AuditLog.findAndCountAll({
    where:  { user_id: 99999 },
    limit:  10,
    offset: 0,
    order:  [['created_at', 'DESC']],
  })
  if (count === 2 && page.length === 2) ok('findAndCountAll funciona como en /api/audit')
  else bad(`findAndCountAll count=${count} rows=${page.length}`)

} catch (err) {
  bad(`Error: ${err.message}`)
} finally {
  if (creados.length) {
    await AuditLog.destroy({ where: { id: creados } }).catch(() => {})
    console.log(`\n🧹 ${creados.length} filas de prueba purgadas.`)
  }
  await sequelize.close()
  console.log(`\nResultado: ${passed} pasaron, ${failed} fallaron\n`)
  process.exit(failed === 0 ? 0 : 1)
}
