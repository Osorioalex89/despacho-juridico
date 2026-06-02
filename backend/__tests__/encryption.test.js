import crypto from 'crypto';

process.env.MASTER_KEY = crypto.randomBytes(32).toString('base64');

const { applyFieldEncryption } = await import('../src/models/encryptedFields.js');
const { isEncrypted, decrypt } = await import('../src/services/crypto.service.js');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✅ ${name}`);
    passed++;
  } catch (err) {
    console.log(`  ❌ ${name}`);
    console.log(`     ${err.message}`);
    failed++;
  }
}
function assert(cond, msg) {
  if (!cond) throw new Error(msg || 'assertion failed');
}

// ── Modelo y instancia falsos (sin BD) ───────────────────────────
function fakeModel() {
  const hooks = {};
  return {
    hooks,
    addHook: (name, fn) => { hooks[name] = fn; },
    fire: (name, arg) => hooks[name] && hooks[name](arg),
  };
}

function fakeInstance(initial = {}) {
  const store = { ...initial };
  const changedSet = new Set(Object.keys(initial));
  return {
    store,
    getDataValue: (k) => store[k],
    setDataValue: (k, v) => { store[k] = v; },
    changed: (k) => changedSet.has(k),
    markChanged: (k) => changedSet.add(k),
  };
}

console.log('\n🔐 encryptedFields.js — hooks de cifrado\n');

test('beforeCreate cifra el campo configurado', () => {
  const m = fakeModel();
  applyFieldEncryption(m, ['reporte_ia']);
  const inst = fakeInstance({ reporte_ia: 'Sentencia favorable' });
  m.fire('beforeCreate', inst);
  assert(isEncrypted(inst.store.reporte_ia), 'debe quedar cifrado');
  assert(decrypt(inst.store.reporte_ia) === 'Sentencia favorable', 'round-trip falla');
});

test('beforeCreate ignora null/""', () => {
  const m = fakeModel();
  applyFieldEncryption(m, ['analisis', 'descripcion']);
  const inst = fakeInstance({ analisis: null, descripcion: '' });
  m.fire('beforeCreate', inst);
  assert(inst.store.analisis === null && inst.store.descripcion === '', 'no debe tocar vacíos');
});

test('beforeCreate no re-cifra valor ya cifrado', () => {
  const m = fakeModel();
  applyFieldEncryption(m, ['content']);
  const inst = fakeInstance({ content: 'hola' });
  m.fire('beforeCreate', inst);
  const once = inst.store.content;
  m.fire('beforeCreate', inst); // segundo pase
  assert(inst.store.content === once, 'no debe cifrar dos veces');
  assert(decrypt(inst.store.content) === 'hola');
});

test('beforeUpdate solo cifra campos cambiados', () => {
  const m = fakeModel();
  applyFieldEncryption(m, ['analisis', 'descripcion']);
  const inst = fakeInstance({ analisis: 'nuevo', descripcion: 'sin cambio' });
  // descripcion NO cambió en esta operación: viene del afterFind en claro
  inst.changed = (k) => k === 'analisis';
  m.fire('beforeUpdate', inst);
  assert(isEncrypted(inst.store.analisis), 'analisis cambiado debe cifrarse');
  assert(inst.store.descripcion === 'sin cambio', 'descripcion no cambiada NO debe cifrarse');
});

test('beforeBulkCreate cifra cada instancia (caso ChatMensaje)', () => {
  const m = fakeModel();
  applyFieldEncryption(m, ['content']);
  const a = fakeInstance({ content: 'pregunta' });
  const b = fakeInstance({ content: 'respuesta' });
  m.fire('beforeBulkCreate', [a, b]);
  assert(isEncrypted(a.store.content) && isEncrypted(b.store.content), 'ambos cifrados');
  assert(decrypt(a.store.content) === 'pregunta' && decrypt(b.store.content) === 'respuesta');
});

test('afterFind desencripta instancia y array', () => {
  const m = fakeModel();
  applyFieldEncryption(m, ['contenido']);
  const enc = fakeInstance({ contenido: 'plano' });
  m.fire('beforeCreate', enc);
  // simula leer: instancia única
  m.fire('afterFind', enc);
  assert(enc.store.contenido === 'plano', 'instancia única desencriptada');
  // array
  const enc2 = fakeInstance({ contenido: 'otro' });
  m.fire('beforeCreate', enc2);
  m.fire('afterFind', [enc2]);
  assert(enc2.store.contenido === 'otro', 'array desencriptado');
});

test('afterFind: dato legacy en claro pasa sin romper', () => {
  const m = fakeModel();
  applyFieldEncryption(m, ['reporte_ia']);
  const legacy = fakeInstance({ reporte_ia: 'texto viejo sin cifrar' });
  m.fire('afterFind', legacy);
  assert(legacy.store.reporte_ia === 'texto viejo sin cifrar', 'legacy intacto');
});

test('afterFind: resultado raw (objeto plano) también desencripta', () => {
  const m = fakeModel();
  applyFieldEncryption(m, ['content']);
  const inst = fakeInstance({ content: 'secreto' });
  m.fire('beforeCreate', inst);
  const raw = { content: inst.store.content }; // sin getDataValue
  m.fire('afterFind', raw);
  assert(raw.content === 'secreto', 'raw desencriptado vía acceso directo');
});

test('afterFind tolera null', () => {
  const m = fakeModel();
  applyFieldEncryption(m, ['content']);
  let threw = false;
  try { m.fire('afterFind', null); } catch { threw = true; }
  assert(!threw, 'no debe lanzar con resultado null');
});

console.log(`\nResultado: ${passed} pasaron, ${failed} fallaron\n`);
process.exit(failed === 0 ? 0 : 1);
