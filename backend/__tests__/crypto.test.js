import crypto from 'crypto';

process.env.MASTER_KEY = crypto.randomBytes(32).toString('base64');

const {
  encrypt,
  decrypt,
  encryptIfPresent,
  tryDecrypt,
  isEncrypted,
} = await import('../src/services/crypto.service.js');

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

console.log('\n🔐 crypto.service.js — tests\n');

test('round-trip: texto simple', () => {
  const plain = 'Confidencial: cliente Juan Pérez';
  const enc = encrypt(plain);
  assert(enc !== plain, 'no debe ser igual al plano');
  assert(enc.startsWith('v1:'), 'debe llevar prefijo v1:');
  assert(decrypt(enc) === plain, 'round-trip falla');
});

test('round-trip: texto con UTF-8 (acentos, ñ, emojis)', () => {
  const plain = 'México: Año 2026 — Sentencia ⚖️';
  assert(decrypt(encrypt(plain)) === plain);
});

test('round-trip: texto largo (10 KB)', () => {
  const plain = 'A'.repeat(10_000);
  assert(decrypt(encrypt(plain)) === plain);
});

test('cada encrypt() produce IV/ciphertext distinto', () => {
  const plain = 'mismo texto';
  const a = encrypt(plain);
  const b = encrypt(plain);
  assert(a !== b, 'dos cifrados del mismo plano deben diferir (IV aleatorio)');
  assert(decrypt(a) === plain && decrypt(b) === plain);
});

test('ciphertext alterado: GCM tag detecta tampering', () => {
  const enc = encrypt('original');
  const parts = enc.split(':');
  const ctBuf = Buffer.from(parts[3], 'base64');
  ctBuf[0] = ctBuf[0] ^ 0x01;
  parts[3] = ctBuf.toString('base64');
  const tampered = parts.join(':');
  let threw = false;
  try { decrypt(tampered); } catch { threw = true; }
  assert(threw, 'decrypt debe lanzar al detectar tampering');
});

test('tag alterado: GCM rechaza', () => {
  const enc = encrypt('original');
  const parts = enc.split(':');
  const tagBuf = Buffer.from(parts[2], 'base64');
  tagBuf[0] = tagBuf[0] ^ 0x01;
  parts[2] = tagBuf.toString('base64');
  let threw = false;
  try { decrypt(parts.join(':')); } catch { threw = true; }
  assert(threw, 'decrypt debe lanzar con tag corrupto');
});

test('encryptIfPresent: NULL/undefined/"" pasan sin tocar', () => {
  assert(encryptIfPresent(null) === null);
  assert(encryptIfPresent(undefined) === undefined);
  assert(encryptIfPresent('') === '');
});

test('encryptIfPresent: string normal se cifra', () => {
  const enc = encryptIfPresent('valor');
  assert(typeof enc === 'string' && enc.startsWith('v1:'));
  assert(decrypt(enc) === 'valor');
});

test('tryDecrypt: texto legado en plano se devuelve igual', () => {
  assert(tryDecrypt('texto en plano legacy') === 'texto en plano legacy');
  assert(tryDecrypt('') === '');
  assert(tryDecrypt(null) === null);
});

test('tryDecrypt: texto cifrado se desencripta', () => {
  const enc = encrypt('secreto');
  assert(tryDecrypt(enc) === 'secreto');
});

test('tryDecrypt: cifrado corrupto se devuelve original (no lanza)', () => {
  const enc = encrypt('original');
  const parts = enc.split(':');
  const ctBuf = Buffer.from(parts[3], 'base64');
  ctBuf[0] = ctBuf[0] ^ 0x01;
  parts[3] = ctBuf.toString('base64');
  const tampered = parts.join(':');
  const result = tryDecrypt(tampered);
  assert(result === tampered, 'debe devolver el blob original sin lanzar');
});

test('isEncrypted detecta prefijo de versión', () => {
  assert(isEncrypted(encrypt('x')) === true);
  assert(isEncrypted('texto plano') === false);
  assert(isEncrypted(null) === false);
  assert(isEncrypted(42) === false);
});

test('encrypt(null) lanza con mensaje claro', () => {
  let msg = '';
  try { encrypt(null); } catch (e) { msg = e.message; }
  assert(msg.includes('encryptIfPresent'), `mensaje debe sugerir encryptIfPresent — recibido: ${msg}`);
});

test('decrypt rechaza versión desconocida', () => {
  const enc = encrypt('x');
  const tampered = 'v99' + enc.slice(2);
  let threw = false;
  try { decrypt(tampered); } catch { threw = true; }
  assert(threw, 'versión v99 debe ser rechazada');
});

console.log(`\nResultado: ${passed} pasaron, ${failed} fallaron\n`);
process.exit(failed === 0 ? 0 : 1);
