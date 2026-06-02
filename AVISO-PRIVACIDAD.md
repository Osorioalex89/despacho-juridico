# Aviso de Privacidad — Despacho Sánchez Cerino

**Versión:** 1.0 · **Última actualización:** 2026-06-02

---

## 1. Identidad y domicilio del responsable

**Despacho Jurídico Lic. Horacio Sánchez Cerino** (en adelante, "el Despacho"), con domicilio para oír y recibir notificaciones en el estado donde opera, es el **Responsable** del tratamiento de tus datos personales conforme a la **Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP)** y su Reglamento.

Contacto del Departamento de Datos Personales: **abogadoadmin89@gmail.com**.

## 2. Datos personales que recabamos

Para prestar nuestros servicios jurídicos recabamos:

- **Datos de identificación:** nombre completo, RFC, dirección, teléfono, correo electrónico.
- **Datos del expediente:** asunto, juzgado, contraparte, movimientos procesales, documentos que tú o terceros aporten.
- **Datos técnicos:** dirección IP, fecha y hora de acceso, navegador (con fines de seguridad y auditoría).

**No** recabamos datos personales sensibles salvo los estrictamente necesarios para la defensa de tu asunto (p. ej. datos patrimoniales o familiares en sucesiones).

## 3. Finalidades del tratamiento

**Primarias (necesarias para la relación jurídica):**

- Atender tu asesoría, juicio o trámite.
- Gestionar tu expediente, citas, documentos y movimientos procesales.
- Generar reportes y análisis con asistencia de inteligencia artificial para apoyar la estrategia jurídica.
- Cumplir obligaciones fiscales (SAT, retención mínima 5 años de expedientes cerrados).
- Auditar accesos al sistema por motivos de seguridad.

**Secundarias (requieren tu consentimiento expreso):**

- Enviarte comunicaciones sobre nuevos servicios del despacho.

Puedes oponerte a las finalidades secundarias en cualquier momento ejerciendo tu derecho de Oposición (ver sección 6).

## 4. Transferencias de datos

Para operar el sistema usamos los siguientes proveedores ("Encargados"), quienes procesan tus datos **únicamente bajo nuestras instrucciones**:

| Proveedor    | Servicio                          | País |
|--------------|-----------------------------------|------|
| Railway      | Hosting de base de datos MySQL    | EE.UU. |
| Cloudinary   | Almacenamiento de PDFs cifrados   | EE.UU. / Global |
| SendGrid     | Envío de notificaciones por email | EE.UU. |
| Groq         | Análisis con inteligencia artificial | EE.UU. |
| Cloudflare   | Protección contra bots (Turnstile) | Global |

Estas transferencias se realizan al amparo del artículo 36 de la LFPDPPP. Todos los proveedores cuentan con cláusulas contractuales que garantizan un nivel de protección equivalente al exigido en México.

## 5. Medidas de seguridad

- Cifrado **AES-256-GCM** en reposo para campos sensibles del expediente (reporte IA, comentarios, descripciones, análisis de documentos y conversaciones de chat).
- Cifrado en tránsito (TLS) para toda comunicación con el sistema.
- Autenticación de dos factores (2FA) por correo en cada inicio de sesión.
- Control de acceso por roles: abogado, secretario, cliente.
- Auditoría inmutable de accesos, descargas, cambios de rol y eliminaciones.
- Backups cifrados administrados por Railway.

## 6. Derechos ARCO

Tienes derecho a **Acceder**, **Rectificar**, **Cancelar** u **Oponerte** al tratamiento de tus datos:

- **Acceso:** descarga la totalidad de tus datos desde el portal cliente → "Mis datos" → "Exportar". (Endpoint: `GET /api/yo/exportar-datos`).
- **Rectificación:** edita tus datos de contacto desde tu perfil en el portal cliente.
- **Cancelación / Oposición:** solicita la cancelación de tu cuenta desde el portal cliente o enviando un correo a **abogadoadmin89@gmail.com**.

**Plazo de respuesta:** 20 días hábiles desde la recepción de tu solicitud (art. 32 LFPDPPP).

Materializada la cancelación, tu información personal será reemplazada por marcadores anónimos (`[REDACTADO]`). Conservamos los registros derivados (folios de caso, fechas, movimientos procesales) por integridad referencial y para cumplir la obligación fiscal de retención de 5 años.

## 7. Uso de cookies / tecnologías de seguimiento

El sistema utiliza un único token JWT almacenado en `localStorage` para mantener tu sesión activa. **No** se utilizan cookies de seguimiento publicitario ni se comparten datos con terceros con fines de marketing.

## 8. Cambios al Aviso de Privacidad

Cualquier modificación material a este Aviso se notificará en el portal del cliente. Si los cambios afectan finalidades primarias se solicitará nueva aceptación expresa antes de continuar usando el sistema.

## 9. Aceptación

Al marcar la casilla "Acepto el Aviso de Privacidad" durante el registro o el formulario de asesoría manifiestas tu consentimiento expreso al tratamiento descrito.
