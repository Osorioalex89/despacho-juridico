import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const KEY_LENGTH = 32;
const CURRENT_VERSION = 'v1';

let cachedKey = null;

function getKey() {
  if (cachedKey) return cachedKey;
  const raw = process.env.MASTER_KEY;
  if (!raw) {
    throw new Error('MASTER_KEY no está definida en variables de entorno');
  }
  const key = Buffer.from(raw, 'base64');
  if (key.length !== KEY_LENGTH) {
    throw new Error(`MASTER_KEY debe ser de ${KEY_LENGTH} bytes (base64). Recibida: ${key.length} bytes`);
  }
  cachedKey = key;
  return key;
}

export function encrypt(plaintext) {
  if (plaintext === null || plaintext === undefined) {
    throw new Error('encrypt(): valor null/undefined no permitido. Usa encryptIfPresent().');
  }
  const text = String(plaintext);
  const key = getKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const ciphertext = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${CURRENT_VERSION}:${iv.toString('base64')}:${tag.toString('base64')}:${ciphertext.toString('base64')}`;
}

export function decrypt(blob) {
  if (typeof blob !== 'string') {
    throw new Error('decrypt(): se esperaba string');
  }
  const parts = blob.split(':');
  if (parts.length !== 4) {
    throw new Error('decrypt(): formato inválido (se esperaba version:iv:tag:ciphertext)');
  }
  const [version, ivB64, tagB64, ctB64] = parts;
  if (version !== 'v1') {
    throw new Error(`decrypt(): versión "${version}" no soportada`);
  }
  const key = getKey();
  const iv = Buffer.from(ivB64, 'base64');
  const tag = Buffer.from(tagB64, 'base64');
  const ciphertext = Buffer.from(ctB64, 'base64');
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return plaintext.toString('utf8');
}

export function encryptIfPresent(value) {
  if (value === null || value === undefined || value === '') return value;
  return encrypt(value);
}

export function tryDecrypt(blob) {
  if (blob === null || blob === undefined || blob === '') return blob;
  if (typeof blob !== 'string') return blob;
  if (!blob.startsWith('v1:')) return blob;
  try {
    return decrypt(blob);
  } catch {
    return blob;
  }
}

export function isEncrypted(value) {
  return typeof value === 'string' && /^v\d+:/.test(value);
}
