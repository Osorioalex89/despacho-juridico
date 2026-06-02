# Política de Retención y Backups

**Versión:** 1.0 · **Última actualización:** 2026-06-02
*Documento interno operativo. Referenciado desde el Aviso de Privacidad.*

---

## 1. Periodos de retención

| Tipo de dato | Retención mínima | Justificación |
|--------------|------------------|---------------|
| Expedientes de casos **cerrados** | 5 años desde el cierre | SAT (deducibilidad), defensa frente a reclamaciones posteriores |
| Expedientes de casos **activos** | Indefinida mientras el caso siga abierto | Necesidad operativa |
| Documentos de expediente | Misma retención que el caso | Integridad del expediente |
| `audit_log` | 2 años | LFPDPPP art. 33 y trazabilidad de seguridad |
| Registros soft-deleted (`paranoid:true`) | Purga física automática a los **90 días** (`SOFT_DELETE_PURGE_DAYS`) | Margen razonable para revertir errores |
| OTP expirados | Limpieza horaria | No tienen utilidad post-vencimiento |
| Tokens de reset expirados | Limpieza al primer uso o expiración | Seguridad |
| Solicitudes de cancelación ARCO | Hasta materializarse | LFPDPPP art. 32 (20 días hábiles para responder) |
| Datos anonimizados (`[REDACTADO]`) | Permanente con marcador | Conservar integridad referencial sin PII |

## 2. Backups

- **MySQL Railway:** backups diarios cifrados en reposo (responsabilidad del proveedor).
- **Cloudinary:** redundancia administrada por el proveedor; recursos `type:'authenticated'`, accesibles únicamente por URL firmada con TTL ≤ 60 s.
- **Restauración:** procedimiento documentado en `OPS-RUNBOOK.md` (pendiente de crear).

## 3. Purga programada

- **Job `jobPurgaSoftDeleted`** corre todos los días a las 03:00 (México) y borra físicamente registros soft-deleted con `deletedAt < now() - SOFT_DELETE_PURGE_DAYS`.
- **Job `jobLimpiezaOtp`** corre cada hora y limpia OTP expirados.

## 4. Acceso a backups

Solo el titular técnico del proyecto (administrador Railway) puede acceder a los backups. Cualquier restauración parcial relacionada con un caso debe quedar registrada en `audit_log` con `action='backup_restore'`.

## 5. Cifrado de respaldo

Los archivos de respaldo manuales (mysqldump) realizados antes de migraciones críticas o ejecuciones de `scripts/backfill-encrypt.js` en producción deben:

1. Generarse con `mysqldump ... | gzip | openssl enc -aes-256-cbc -salt -pbkdf2 -out backup-YYYYMMDD.sql.gz.enc`.
2. Almacenarse fuera del entorno productivo (almacenamiento personal cifrado).
3. Eliminarse a los 30 días si la migración fue exitosa.
