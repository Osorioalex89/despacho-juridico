# CLAUDE.md

## Project Overview
Full-stack legal case management ("Despacho Jurídico") — monorepo React + Express.js + MySQL.
Repo: github.com/Osorioalex89/despacho-juridico · Frontend `:5173` · Backend `:3001` · Landing `:5174`

## Comandos
```bash
# Backend (desde backend/)     npm run dev  → :3001
# Frontend (desde frontend/)   npm run dev  → :5173 · npm run build
# Landing (desde Landig-page/) npm run dev  → :5174 · npm run build
```
Sin orquestador raíz. Nodemon no recarga `.env` — reiniciar manualmente al cambiar variables.

## Arquitectura
**Frontend** `frontend/src/`: Router v7 · `context/AuthContext.jsx` · `services/axios.config.js` (base `VITE_API_URL`, Bearer token, logout en 401, excluye `/auth/verify-otp` y `/auth/login`)
**Backend** `backend/src/`: Express · helmet · express-rate-limit · JWT · Sequelize + MySQL2 (`sync alter:false`) · multer uploads en `/uploads` (solo accesible vía endpoints auth)
**Landing** `Landig-page/src/`: Vite + React · proxy `/api → :3001` · `organisms/` · framer-motion

### Dependencias
`framer-motion` · `lucide-react` · `react-hook-form` + `zod` · `@turnstile/react` · `react-markdown`
**Backend IA:** `groq-sdk` · `pdf-parse` (extracción texto PDF para enviar a Groq)

### Base de datos — `despacho_juridico`
```
usuarios    → id_usuario, nombre, correo, contrasena[bcrypt], rol, estado, activo
              + verification_token, otp_code, otp_expires, otp_intentos, reset_solicitado,
                reset_solicitado_at, origen[nullable]
clientes    → id_cliente, id_usuario[FK nullable], nombre, telefono, correo, direccion, rfc, notas
casos       → id_caso, folio[unique], asunto, tipo, estado, id_cliente, id_abogado,
              fecha_apertura, fecha_limite, reporte_ia[TEXT], reporte_ia_at[DATETIME]
citas       → id_cita, id_cliente, id_caso, id_abogado, fecha, hora, motivo, estado, mensaje, id_solicitante
documentos  → id_documento, id_caso, id_usuario, nombre, nombre_original, tipo, tamanio,
              categoria, descripcion, analisis[TEXT], bloqueado[BOOL default:true]
comentarios → id_comentario, id_caso[FK→CASCADE], id_usuario[FK], contenido[TEXT], createdAt, updatedAt
movimientos → id_movimiento, id_caso[FK→CASCADE], tipo[ENUM], descripcion[TEXT], fecha_movimiento[DATE]
```
**Estados caso:** `activo` · `urgente` · `pendiente` · `en_revision` · `cerrado`
**Estados cita:** `pendiente` · `confirmada` · `cancelada`
**Tipos movimiento:** `auto` · `sentencia` · `audiencia` · `oficio` · `otro`

### Rutas API principales
```
GET  /api/notificaciones/stream     → ?token=JWT → text/event-stream SSE; heartbeat `:ping` cada 25s; token en query param (EventSource no soporta headers)
POST /api/auth/registro              → usuario inactivo + email verificación
GET  /api/auth/verificar-email       → ?token=xxx → activo:true (idempotente)
POST /api/auth/login                 → Paso 1 OTP → { requiresOtp, tempToken, maskedEmail }
POST /api/auth/verify-otp            → Paso 2 OTP → { token, user }
POST /api/auth/solicitar-reset       → público; notifica admins
POST /api/auth/admin-reset-password  → protegido (abogado/secretario); genera reset_token (2h) y envía link al cliente [Flujo B]
POST /api/auth/reset-password        → público; valida reset_token, actualiza contraseña, limpia token
CRUD /api/clientes · /api/casos · /api/citas · /api/documentos · /api/usuarios
PATCH /api/documentos/:id/toggle-bloqueo
GET  /api/documentos/mis-documentos/:id/preview  → cliente; inline si desbloqueado
GET  /api/documentos/mis-documentos/:id/descargar → cliente; path.resolve (absoluta)
GET  /api/casos/mis-casos · /api/citas/mis-citas  ← declarar ANTES de /:id
GET  /api/casos/:id/timeline         → apertura, documentos, citas, comentarios, movimientos
POST /api/casos/:id/comentarios      → abogado/secretario; fire-and-forget email
GET|POST /api/casos/:id/movimientos  → GET todos los roles · POST abogado/secretario + email
POST /api/casos/:id/chat             → chat IA (todos los roles autenticados)
PATCH /api/citas/:id/estado          → { estado, fecha?, hora? }
PATCH /api/citas/:id/rechazar        → estado='cancelada' + email al cliente
GET  /api/stats/dashboard            → { totalClientes, casosActivos, citasHoy, pendientes }
POST /api/landing/asesoria           → PÚBLICO; crea cliente + cita + email admin
PATCH /api/clientes/:id/completar-asesoria → desactiva usuario temporal
```

### Roles
- **abogado** — acceso total · **secretario** — panel sin crear/editar casos
- **cliente** — portal: mis casos, citas, solicitar cita · **usuario** — espera en `/pendiente`

## Design System — Legal Premium
```
bg-base: #020818 · card: rgba(8,20,48,0.75) · card-deep: rgba(6,16,40,0.97)
gold-primary: #C9A84C · gold-light: #E8C97A · gold-dark: #9A7A32
text-primary: rgba(255,255,255,0.95) · text-secondary: rgba(255,255,255,0.55)
```
**Fuentes:** Playfair Display (títulos) · Inter (UI) · **Logo:** `logo-sc.png` (sin fondo, creado en nanobanana) — usado en todas las páginas auth (92×92 en card, 80×80 en registro) y en el sidebar (48×48). Contenedor: `borderRadius:12-22` + borde gold + glow gold. `objectFit:'contain'` (nunca `cover`). PWA: `public/manifest.json` con `theme_color:#C9A84C`. Sidebar: PNG reemplazó al SVG LogoMark.
**Badges estado:** activo=`#93BBFC` · urgente=`#FCA5A5` · pendiente=`#FCD34D` · en_revision=`#C4B5FD` · cerrado=`#9CA3AF`
**Timeline íconos:** apertura→`Scale` `#C9A84C` · documento→`FileText` `#93BBFC` · cita→`CalendarDays` `#86EFAC` · comentario→`MessageSquare` `#C4B5FD` · movimiento→`Gavel` `#FB923C`
**Chat IA — diseño "Avatar & Estructura":** tarjetas en lugar de burbujas · IA: borde izquierdo `3px solid rgba(201,168,76,0.5)` + glass blur + avatar `Scale` · Usuario: borde derecho `3px solid rgba(147,187,252,0.45)` + avatar con iniciales en azul · Portal cliente: modal fullscreen 680px (`zIndex:1100`) con botón "Consultar Asistente IA" en tarjeta del caso · Contenedor `height:520px` fijo (no `minHeight`) + scrollbar custom gold 5px · Historial aislado por `id_usuario` — abogado y cliente tienen conversaciones separadas

## Convenciones
- Tailwind CSS v4 + PostCSS. Estilos inline `style={{}}` para CSS custom vars.
- Axios desde `services/axios.config.js` — **nunca** `context/axios.config.js` ni `fetch` directo. Excepción: descargas de archivos usan `fetch` con `VITE_API_URL` + Bearer token.
- Rutas de archivo: siempre `path.resolve('./uploads', nombre)` — nunca `path.join` (Express 4 requiere ruta absoluta en `res.download` / `res.sendFile`).
- `<select>` nativo. Sin TypeScript. `translate="no"` en texto de UI.
- Fechas: `getFullYear/Month/Date` locales — nunca `toISOString()`.
- Responsive: `≤700px` portal cliente · `≤767px` panel admin.
- **z-index + backdropFilter:** contenedor padre necesita `position:relative; zIndex` explícito.
- React Hook Form + Zod en formularios. `getCasoById` retorna `{ caso, cliente, citas }` — usar `res.data.caso`.

## Seguridad — 2FA por correo
1. Registro: Turnstile (solo `NODE_ENV=production`) → usuario `activo:false` + token → email
2. Login paso 1: credenciales → OTP 6 dígitos **10 min** → `{ requiresOtp, tempToken, maskedEmail }`
3. Login paso 2: `tempToken` + OTP → JWT **2h** · 3 intentos · `expired:true` redirige al login
4. `verificarEmail` idempotente (tolera doble petición React StrictMode)

### Email — `emailService.js` (SendGrid SDK `@sendgrid/mail`)
Plantilla Navy/Gold. Todas las notificaciones son **fire-and-forget**.
**Estado actual:** SendGrid con sender `abogadoadmin89@gmail.com`. Correos llegan a spam por DMARC de Gmail — se resuelve al comprar dominio. Si falla entrega el día del demo: aplicar bypass de desarrollo (ver abajo).
```
sendOtpEmail · sendVerificationEmail · sendResetRequestToAdmin · sendNewPasswordToClient
notifyAdminNewUser · notifyNewCaseComment · notifyNuevoCasoAsignado · notifyDocumentoAdjunto
notifyNewAppointment(creadaPorAbogado) · notifyAppointmentRescheduled · updateAppointmentStatus
notifyAdminNuevaAsesoria · notifyAsesoriaRechazada · notifyMovimientoProcesal · notifyReporteIACaso
```

| Evento cita | Función | Receptor |
|-------------|---------|----------|
| Cliente solicita | `notifyNewAppointment(false)` | Admins + cliente |
| Abogado crea | `notifyNewAppointment(true)` | Abogado + cliente |
| Abogado reagenda | `notifyAppointmentRescheduled` | Cliente |
| Confirma/cancela | `updateAppointmentStatus` | Cliente |
| Movimiento procesal | `notifyMovimientoProcesal` | Cliente |

**Turnstile:** dev `1x00000000000000000000AA` · producción: `VITE_TURNSTILE_SITE_KEY` real

## Variables de entorno

### `backend/.env`
```
PORT=3001  DB_HOST=localhost  DB_PORT=3306  DB_NAME=despacho_juridico
DB_USER=root  DB_PASSWORD=custom32
JWT_SECRET=despacho_juridico_secret_2024
NODE_ENV=development
APP_URL=http://localhost:5173
CORS_ORIGIN=http://localhost:5173,http://localhost:5174
TURNSTILE_SECRET=<secret_cloudflare>
ADMIN_EMAIL=osorioalexander640@gmail.com
GROQ_API_KEY=gsk_...             # opcional; sin key la IA no aparece · modelo: llama-3.3-70b-versatile (Groq)
SENDGRID_API_KEY=SG....          # SendGrid SDK · sender: abogadoadmin89@gmail.com (Single Sender verificado)
SENDGRID_FROM_EMAIL=abogadoadmin89@gmail.com
                                # ⚠ Correos van a spam por DMARC de Gmail. Solución permanente: dominio sanchezcerino.mx
                                # Si la entrega falla: en auth.controller.js registro(), activar bypass dev (activo:true sin email)
```

### `frontend/.env`
```
VITE_API_URL=http://localhost:3001/api
VITE_TURNSTILE_SITE_KEY=1x00000000000000000000AA
```
Producción: `frontend/.env.production` con URLs reales (Vite lo aplica en `npm run build`).

## Usuarios
| Email | Rol | Entorno |
|-------|-----|---------|
| osorioalexander640@gmail.com | abogado | dev |
| abogadoadmin89@gmail.com | abogado | producción |
| secretario867@gmail.com | secretario | producción |

## Features implementadas

| Feature | Archivos clave |
|---------|----------------|
| **Notificaciones SSE en tiempo real** campana con badge + panel dropdown glassmorphism; reconexión auto 5s; eventos: comentario, movimiento, cita, documento, caso | `notificationService.js` · `GET /api/notificaciones/stream?token=` · `NotificationsContext.jsx` · `NotificationBell.jsx` · `NotificationPanel.jsx` |
| **Themis — Agente Jurídico IA** nombre + personalidad de abogado senior; medallón SVG Navy/Gold con "S" + red neuronal + arco de texto; sistema prompt con `userName` dinámico; Biblioteca del Despacho inyecta casos cerrados del mismo tipo | `ThemisAvatar.jsx` · `aiService.js` (`chatConCaso`) · `CaseDetail.jsx` · `MisCasosPage.jsx` |
| **Auth 2FA** OTP 10min · JWT 2h · 3 intentos | `auth.controller.js` · `OtpPage.jsx` |
| **Análisis Documental IA** auto al subir + botón "Resumen IA" | `aiService.js` · `DocumentosPage.jsx` · `MisCasosPage.jsx` |
| **Timeline visual** apertura/docs/citas/comentarios/movimientos | `GET /api/casos/:id/timeline` · `CaseTimeline.jsx` |
| **Historial en portal cliente** timeline por caso, sin comentarios internos | `MisCasosPage.jsx` · `toggleHistorial()` |
| **Escalamiento urgencias** cron diario email abogados | `reminderWorker.js` |
| **Movimientos procesales** abogado registra → email cliente | `Movimiento.js` · `CaseDetail.jsx` |
| **Agente Monitoreo IA** job 07:00 MX → reporte BD + email | `jobMonitoreoIA` en `reminderWorker.js` |
| **Chat IA por caso** Groq/Llama 3.3 70B con contexto del caso; respuestas con `react-markdown`; historial persistido en BD `chat_mensajes` **por usuario** (`id_usuario`); ventana de 10 mensajes a Groq; altura fija 520px con scroll interno; scrollbar custom gold | `POST /:id/chat` · `GET /:id/chat-history` · `CaseDetail.jsx` · `MisCasosPage.jsx` |
| **Candado Digital** docs bloqueados por defecto → abogado libera | `PATCH /:id/toggle-bloqueo` · `DocumentosPage.jsx` |
| **Preview Documentos** bloqueado=modal difuminado · libre=PDF/imagen inline | `documents.routes.js` · `MisCasosPage.jsx` |
| **Semáforo de Caso** rojo/amarillo/verde por urgencia y vencimiento | `calcularSemaforo()` en `MisCasosPage.jsx` |
| **Solicitudes Landing** leads → tabla dashboard | `SolicitudesLandingPage.jsx` |
| **Integración Landing** asesoria → cliente + cita pendiente + email admin | `landing.routes.js` |

**SQL aplicado en producción (idempotente en `app.js` startup):**
```sql
ALTER TABLE casos ADD COLUMN reporte_ia TEXT NULL;
ALTER TABLE casos ADD COLUMN reporte_ia_at DATETIME NULL;
ALTER TABLE usuarios ADD COLUMN origen VARCHAR(50) NULL DEFAULT NULL;
-- chat_mensajes: CREATE TABLE IF NOT EXISTS + ALTER ADD COLUMN id_usuario INT NULL (se aplica en runMigrations())
```

## Despliegue — Producción ✅

| Plataforma | Proyecto | URL |
|------------|----------|-----|
| Railway (backend + MySQL) | `compassionate-creativity` · cuenta `abogadoadmin89@gmail.com` | `despacho-juridico-production-1df7.up.railway.app` |
| Vercel (frontend) | `despacho-juridico` · cuenta `abogadoadmin89@gmail.com` | `despacho-juridico-plum.vercel.app` |
| Vercel (landing) | `despacho-landing` · cuenta `abogadoadmin89@gmail.com` | `despacho-landing-olive.vercel.app` |

### Dominio pendiente — finales de abril 2026
- Dominio elegido: **`sanchezcerino.mx`** · Registrador: Neubox (~$139 MXN/año)
- Al comprarlo: verificar dominio en SendGrid → configurar SPF + DKIM + DMARC → cambiar `SENDGRID_FROM_EMAIL` a `notificaciones@sanchezcerino.mx` en Railway

**Notas Railway:**
- Root Directory: `backend/` · Start: `npm start`
- `trust proxy 1` en `app.js` para rate-limit correcto
- Email: SendGrid SDK (`@sendgrid/mail`). Sender: `abogadoadmin89@gmail.com`. Env vars: `SENDGRID_API_KEY` + `SENDGRID_FROM_EMAIL`
- CORS_ORIGIN incluye frontend + landing
- **IMPORTANTE:** Railway usa `npm ci` — al cambiar dependencias en `package.json` siempre ejecutar `npm install --package-lock-only` en `backend/` y commitear el `package-lock.json` actualizado. Si no, el build falla silenciosamente y Railway sigue corriendo el código antiguo.

**Notas Vercel:**
- Frontend: `vercel.json` con rewrites SPA · `VITE_API_URL` y `VITE_TURNSTILE_SITE_KEY` configuradas
- Landing: `vercel.json` SPA · `VITE_APP_BASE` apunta al frontend de producción
- Imágenes (`fondo-clinica.jpg`) importadas como módulo en `LoginPage`, `RegisterPage`, `OtpPage`

### Cloudinary — Migración completada ✅
Los documentos se almacenan en Cloudinary (no en disco — Railway filesystem es efímero).
- `multer.memoryStorage()` → buffer en RAM → upload a Cloudinary (`resource_type:'raw'`)
- `nombre` en BD almacena el `public_id` de Cloudinary (`despacho-juridico/xxxxx`)
- Preview/descarga: el backend hace proxy (fetch Cloudinary URL → pipe a cliente)
- `aiService.js`: acepta `buffer` directamente (no lee disco); soporta legacy URL para reanalizar
- **Env vars requeridas en Railway:** `CLOUDINARY_CLOUD_NAME` · `CLOUDINARY_API_KEY` · `CLOUDINARY_API_SECRET` · `GROQ_API_KEY`

## Iconografía
- **Frontend:** `lucide-react`. Dashboard: `Scale/CalendarDays/Users`. Auth: `ShieldCheck/ShieldAlert`.
- **Dashboard cards:** `rgba(8,20,48,0.55)` + borde `rgba(197,160,89,0.22)` + icono `#c5a059` → `CARD_ICON_STYLE`.
- **Correos:** íconos circulares `<table valign="middle">`. Puntos `&#9679;` dorado.

## Integración Landing → Dashboard
1. `POST /api/landing/asesoria` → busca/crea cliente → cita `pendiente` → email admin
2. Dashboard `/panel/solicitudes-landing`: badge "Nueva" (<24h) · sidebar `Globe` badge rojo
3. Confirmar → `PATCH /:id/estado` · Rechazar → `PATCH /:id/rechazar` + email
4. Contactar → dropdown framer-motion: WhatsApp `wa.me/52...` · Gmail `mailto:`
5. `appLinks.js` — usa `VITE_APP_BASE` (env var); botones usan `window.location.href`

## Notas de entrega
- **Versión escuela (este repo):** IA completa — análisis documental, monitoreo, chat, semáforo, preview.
- **Versión tío (fork sin IA):** sin `GROQ_API_KEY`, sin botones IA, sin job monitoreo.

## Agentes especializados (`.claude/agents/`)
| Agente | Responsabilidad |
|--------|-----------------|
| `legal-backend-specialist` | Node.js/Sequelize, emailService, endpoints REST |
| `ui-gold-architect` | Identidad visual Navy/Gold/Glassmorphism |
| `security-officer` | OTP, Turnstile, JWT, bcrypt |

## Pendientes técnicos

### Recuperación de contraseña — Flujo B implementado ✅
- **Flujo B actual ✅:** cliente solicita reset → admin aprueba en panel → sistema genera `reset_token` (64 hex) con expiración **2 horas** → email con link al cliente → cliente establece su propia contraseña en `/reset-password?token=xxx`
  - **Backend:** columnas `reset_token VARCHAR(64)` + `reset_token_expires DATETIME` en `usuarios` (migración idempotente en `app.js`) · `POST /api/auth/admin-reset-password` genera token y envía link · `POST /api/auth/reset-password` (público) valida token y actualiza contraseña
  - **Frontend:** `ResetPasswordPage.jsx` en `/reset-password?token=xxx` · ruta registrada en `AppRouter.jsx`
  - **Email:** `sendResetLinkToClient` en `emailService.js` — plantilla Navy/Gold con botón y fallback URL
- **Flujo A legacy** (`sendNewPasswordToClient`) se conserva en `emailService.js` pero ya no se usa en el flujo activo

### Persistencia del historial del Chat IA ✅
Historial persistido en BD, aislado por usuario. El chat sobrevive refresco y es auditable por caso.
- **BD:** `chat_mensajes` — `id_caso` + `id_usuario` + `role` + `content`; migración idempotente en `app.js`
- **Backend:** `GET /:id/chat-history` filtra `{ id_caso, id_usuario }` · `chatCaso` guarda con `id_usuario: req.user.id`
- **Frontend:** `getChatHistory` en `casesService.js` · carga al activar tab chat en `CaseDetail.jsx`
- **Control de tokens:** solo los últimos 10 mensajes se envían a Groq; BD guarda el historial completo

### Layout panel admin ✅
Sidebar fijo — solo el área de contenido central hace scroll.
- `PanelLayout.jsx`: contenedor externo `height:100vh` + `overflow:hidden`; área de contenido `overflowY:auto`
- `Sidebar.jsx`: `height:100%` en lugar de `minHeight:100vh`

### Stat cards Gestión de Casos ✅
Los conteos en las cards (Activos/Urgentes/Pendientes/etc.) son siempre globales, independientes del filtro activo.
- `getCasos` en backend devuelve `statsPorEstado` — query paralela `GROUP BY estado` sin filtros
- `CasesPage.jsx`: `countByEstado` lee `statsPorEstado` del API en lugar de filtrar la lista paginada

## Roadmap comercial
**Versión actual — $55,000–$65,000 MXN:** sistema base + 2FA + IA + timeline + movimientos + landing + semáforo + preview

| Mejora | Descripción | Estimado |
|--------|-------------|----------|
| Centro de Notificaciones | Campana navbar cliente — doc subido, estado, movimiento, comentario | +$8,000–$12,000 |
| Comentarios desde portal cliente | Comunicación bidireccional en el expediente | +$6,000–$9,000 |
| Solicitud de documentos | Cliente pide doc → registro como movimiento + email abogado | +$4,000–$6,000 |

**Enterprise — hasta $120,000 MXN:** CFDI/SAT · App móvil · Firma electrónica · SCJN/PJF · Multi-despacho · Soporte 12 meses
