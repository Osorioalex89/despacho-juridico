import { encryptIfPresent, tryDecrypt } from '../services/crypto.service.js'

// Registra cifrado at-rest AES-256-GCM en los campos indicados de un modelo.
// - Escritura: beforeCreate / beforeUpdate (solo campos cambiados) / beforeBulkCreate
// - Lectura:   afterFind → tryDecrypt (datos legacy en claro pasan sin tocar)
// NUNCA cifrar campos usados en WHERE/LIKE (rompe búsquedas). Ver SECURITY-PLAN F1.1.
export function applyFieldEncryption(model, fields) {
  const encryptOne = (instance) => {
    for (const f of fields) {
      const v = instance.getDataValue(f)
      if (v === null || v === undefined || v === '') continue
      if (typeof v === 'string' && v.startsWith('v1:')) continue // ya cifrado
      instance.setDataValue(f, encryptIfPresent(v))
    }
  }

  const decryptOne = (row) => {
    if (!row) return
    for (const f of fields) {
      if (typeof row.getDataValue === 'function') {
        const v = row.getDataValue(f)
        if (typeof v === 'string') row.setDataValue(f, tryDecrypt(v))
      } else if (typeof row[f] === 'string') {
        row[f] = tryDecrypt(row[f]) // resultados raw:true
      }
    }
  }

  model.addHook('beforeCreate', encryptOne)

  model.addHook('beforeUpdate', (instance) => {
    for (const f of fields) {
      if (!instance.changed(f)) continue
      const v = instance.getDataValue(f)
      if (v === null || v === undefined || v === '') continue
      if (typeof v === 'string' && v.startsWith('v1:')) continue
      instance.setDataValue(f, encryptIfPresent(v))
    }
  })

  model.addHook('beforeBulkCreate', (instances) => {
    instances.forEach(encryptOne)
  })

  model.addHook('afterFind', (result) => {
    if (!result) return
    if (Array.isArray(result)) result.forEach(decryptOne)
    else decryptOne(result)
  })
}
