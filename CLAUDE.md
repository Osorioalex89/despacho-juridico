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
POST /api/auth/registro              → usuario inactivo + email verificación
GET  /api/auth/verificar-email       → ?token=xxx → activo:true (idempotente)
POST /api/auth/login                 → Paso 1 OTP → { requiresOtp, tempToken, maskedEmail }
POST /api/auth/verify-otp            → Paso 2 OTP → { token, user }
POST /api/auth/solicitar-reset       → público; notifica admins
POST /api/auth/admin-reset-password  → protegido (abogado/secretario)
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
**Fuentes:** Playfair Display (títulos) · Inter (UI) · **Logo:** SVG balanza + monograma "SC" gold
**Badges estado:** activo=`#93BBFC` · urgente=`#FCA5A5` · pendiente=`#FCD34D` · en_revision=`#C4B5FD` · cerrado=`#9CA3AF`
**Timeline íconos:** apertura→`Scale` `#C9A84C` · documento→`FileText` `#93BBFC` · cita→`CalendarDays` `#86EFAC` · comentario→`MessageSquare` `#C4B5FD` · movimiento→`Gavel` `#FB923C`

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

### Email — `emailService.js` (SendGrid HTTP API)
Plantilla Navy/Gold. Todas las notificaciones son **fire-and-forget**.
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
ANTHROPIC_API_KEY=sk-ant-...    # opcional; sin key la IA no aparece
SENDGRID_API_KEY=<key>          # producción usa SendGrid
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
| **Auth 2FA** OTP 10min · JWT 2h · 3 intentos | `auth.controller.js` · `OtpPage.jsx` |
| **Análisis Documental IA** auto al subir + botón "Resumen IA" | `aiService.js` · `DocumentosPage.jsx` · `MisCasosPage.jsx` |
| **Timeline visual** apertura/docs/citas/comentarios/movimientos | `GET /api/casos/:id/timeline` · `CaseTimeline.jsx` |
| **Historial en portal cliente** timeline por caso, sin comentarios internos | `MisCasosPage.jsx` · `toggleHistorial()` |
| **Escalamiento urgencias** cron diario email abogados | `reminderWorker.js` |
| **Movimientos procesales** abogado registra → email cliente | `Movimiento.js` · `CaseDetail.jsx` |
| **Agente Monitoreo IA** job 07:00 MX → reporte BD + email | `jobMonitoreoIA` en `reminderWorker.js` |
| **Chat IA por caso** Claude Haiku con contexto del caso; respuestas con `react-markdown` (negritas, listas, encabezados gold) | `POST /:id/chat` · `CaseDetail.jsx` |
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
```

## Despliegue — Producción ✅

| Plataforma | Proyecto | URL |
|------------|----------|-----|
| Railway (backend + MySQL) | `compassionate-creativity` · cuenta `abogadoadmin89@gmail.com` | `despacho-juridico-production-1df7.up.railway.app` |
| Vercel (frontend) | `despacho-juridico` · cuenta `abogadoadmin89@gmail.com` | `despacho-juridico-plum.vercel.app` |
| Vercel (landing) | `despacho-landing` · cuenta `abogadoadmin89@gmail.com` | `despacho-landing-olive.vercel.app` |

**Notas Railway:**
- Root Directory: `backend/` · Start: `npm start`
- `trust proxy 1` en `app.js` para rate-limit correcto
- Email: SendGrid HTTP API (Gmail SMTP bloqueado en Railway). Sender verificado: `abogadoadmin89@gmail.com`
- CORS_ORIGIN incluye frontend + landing

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
- **Env vars requeridas en Railway:** `CLOUDINARY_CLOUD_NAME` · `CLOUDINARY_API_KEY` · `CLOUDINARY_API_SECRET`

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
- **Versión tío (fork sin IA):** sin `ANTHROPIC_API_KEY`, sin botones IA, sin job monitoreo.

## Agentes especializados (`.claude/agents/`)
| Agente | Responsabilidad |
|--------|-----------------|
| `legal-backend-specialist` | Node.js/Sequelize, emailService, endpoints REST |
| `ui-gold-architect` | Identidad visual Navy/Gold/Glassmorphism |
| `security-officer` | OTP, Turnstile, JWT, bcrypt |

## Pendientes técnicos

### Persistencia del historial del Chat IA ⏳
El historial del chat se pierde al refrescar — vive solo en estado React.
```
TODO: persistir chat IA en BD (Opción B — correcta)
  BD: nueva tabla chat_mensajes → id_mensaje, id_caso, role[ENUM user|assistant], content[TEXT], createdAt
  Backend: GET /api/casos/:id/chat-history · POST guarda cada mensaje al enviar/recibir
  Frontend: cargar historial al montar CaseDetail, append en cada intercambio
  Ventaja: accesible desde cualquier dispositivo, auditable, parte del expediente
```

## Roadmap comercial
**Versión actual — $55,000–$65,000 MXN:** sistema base + 2FA + IA + timeline + movimientos + landing + semáforo + preview

| Mejora | Descripción | Estimado |
|--------|-------------|----------|
| Centro de Notificaciones | Campana navbar cliente — doc subido, estado, movimiento, comentario | +$8,000–$12,000 |
| Comentarios desde portal cliente | Comunicación bidireccional en el expediente | +$6,000–$9,000 |
| Solicitud de documentos | Cliente pide doc → registro como movimiento + email abogado | +$4,000–$6,000 |

**Enterprise — hasta $120,000 MXN:** CFDI/SAT · App móvil · Firma electrónica · SCJN/PJF · Multi-despacho · Soporte 12 meses
