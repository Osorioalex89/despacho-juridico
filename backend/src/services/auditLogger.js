// F5.1 — Logger de auditoría.
//   logAction(req, action, { resourceType, resourceId, metadata })
//   - Fire-and-forget: nunca rompe la respuesta del controller si la BD falla.
//   - Llena user_id e ip desde req cuando están disponibles.
//   - metadata se pasa como objeto plano; Sequelize lo guarda como JSON.
import AuditLog from '../models/AuditLog.js'

// Vocabulario controlado para el campo action (no enum en DB para flexibilidad).
export const ACTIONS = Object.freeze({
  LOGIN:               'login',
  LOGIN_FAILED:        'login_failed',
  OTP_FAILED:          'otp_failed',
  OTP_SUCCESS:         'otp_success',
  DOC_DOWNLOAD:        'doc_download',
  DOC_PREVIEW:         'doc_preview',
  DOC_UNLOCK:          'doc_unlock',
  DOC_LOCK:            'doc_lock',
  DELETE_CASO:         'delete_caso',
  RESTORE_CASO:        'restore_caso',
  RESET_REQUEST:       'reset_request',
  RESET_ISSUED:        'reset_issued',
  RESET_CONSUMED:      'reset_consumed',
  ROLE_CHANGE:         'role_change',
})

/**
 * @param {object} req  — request de Express (puede ser null para acciones internas)
 * @param {string} action — una de ACTIONS (string libre, pero usa el vocabulario)
 * @param {object} opts
 *   - resourceType?: 'caso' | 'documento' | 'cliente' | 'usuario' | ...
 *   - resourceId?:   number
 *   - metadata?:     object plano (correo, motivo, antes/después en role_change, etc.)
 *   - userId?:       fuerza un user_id (para cuando aún no hay req.user, ej. login_failed)
 */
export const logAction = (req, action, opts = {}) => {
  const { resourceType = null, resourceId = null, metadata = null, userId = null } = opts
  const data = {
    user_id:       userId ?? req?.user?.id ?? null,
    ip:            req?.ip ?? null,
    action,
    resource_type: resourceType,
    resource_id:   resourceId,
    metadata_json: metadata,
  }
  // Fire-and-forget: nunca esperamos ni propagamos errores al request.
  AuditLog.create(data).catch(err =>
    console.error('[Audit] fallo registrando', action, '-', err.message)
  )
}
