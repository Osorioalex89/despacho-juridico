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
**Frontend** `frontend/src/`: Router v7 · `context/AuthContext.jsx` · `services/axios.config.js` (base `VITE_API_URL`, Bearer token, logout en 401, excluye `/auth/verify-otp` y `/auth/login`) · `features/` · `services/`
**Backend** `backend/src/`: Express · helmet · express-rate-limit · JWT · Sequelize + MySQL2 (`sync alter:false`) · multer uploads en `/uploads` (solo accesible vía endpoints auth)
**Landing** `Landig-page/src/`: Vite + React · proxy `/api → :3001` · `organisms/` · framer-motion

### Dependencias destacadas
`framer-motion` · `lucide-react` · `react-hook-form` + `zod` · `@turnstile/react`

### Base de datos — `despacho_juridico`
```
usuarios    → id_usuario, nombre, correo, contrasena[bcrypt], rol, estado, activo
              + verification_token, otp_code, otp_expires, otp_intentos, reset_solicitado, reset_solicitado_at, origen[nullable]
clientes    → id_cliente, id_usuario[FK nullable], nombre, telefono, correo, direccion, rfc, notas
casos       → id_caso, folio[unique], asunto, tipo, estado, id_cliente, id_abogado, fecha_apertura, fecha_limite, reporte_ia[TEXT], reporte_ia_at[DATETIME]
citas       → id_cita, id_cliente, id_caso, id_abogado, fecha, hora, motivo, estado, mensaje, id_solicitante
documentos  → id_documento, id_caso, id_usuario, nombre, nombre_original, tipo, tamanio, categoria, descripcion, analisis[TEXT], bloqueado[BOOL default:true]
comentarios → id_comentario, id_caso[FK→CASCADE], id_usuario[FK], contenido[TEXT], createdAt, updatedAt
movimientos → id_movimiento, id_caso[FK→CASCADE], tipo[ENUM], descripcion[TEXT], fecha_movimiento[DATE], createdAt, updatedAt
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
PATCH /api/documentos/:id/toggle-bloqueo       → abogado/secretario
GET  /api/documentos/mis-documentos/:id/preview → cliente; inline si desbloqueado, 403 si bloqueado/confidencial
GET  /api/casos/mis-casos · /api/citas/mis-citas   ← declarar ANTES de /:id
GET  /api/casos/:id/timeline         → apertura, documentos, citas, comentarios, movimientos
POST /api/casos/:id/comentarios      → abogado/secretario; fire-and-forget email
GET|POST /api/casos/:id/movimientos  → GET: todos los roles · POST: abogado/secretario + email
POST /api/casos/:id/chat             → chat IA (abogado/secretario/cliente)
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
- React Hook Form + Zod para formularios. Axios desde `services/axios.config.js`, **nunca** `context/axios.config.js` ni `fetch` directo (excepción: descarga de archivos usa fetch con `VITE_API_URL`).
- `<select>` nativo — excepción: dropdowns framer-motion con `position:relative; zIndex` explícito.
- Sin TypeScript. `translate="no"` en elementos con texto de UI.
- Fechas: `getFullYear/Month/Date` locales, nunca `toISOString()`.
- Responsive: `≤700px` portal cliente · `≤767px` panel admin.
- **z-index + backdropFilter:** nuevo stacking context → contenedor padre necesita `position:relative; zIndex` mayor que overlays.

## Responsive
**`ClientNavbar.jsx`** — Mobile: logo + avatar + hamburguesa. Header 56px.
**`MisCitasPage.jsx`** — Desktop: calendario 280px + panel. Mobile: vertical. Clases `.mc-layout/.mc-cal/.mc-detail/.mc-hdr`.

## Seguridad — 2FA por correo

### Flujo registro → login
1. Registro: Turnstile (solo en `NODE_ENV=production`) → usuario `activo:false` + token → email verificación
2. Login paso 1: credenciales + `activo:true` → OTP 6 dígitos **10 min** → `{ requiresOtp, tempToken, maskedEmail }`
3. Login paso 2: `tempToken` + OTP → JWT **2h** · 3 intentos · `expired:true` redirige al login
4. `verificarEmail` idempotente (tolera doble petición React StrictMode)

### Funciones email — `emailService.js`
Plantilla Navy/Gold. Todas las notificaciones son **fire-and-forget** (nunca bloquean HTTP).
```
sendOtpEmail · sendVerificationEmail · sendResetRequestToAdmin · sendNewPasswordToClient
notifyAdminNewUser · notifyNewCaseComment · notifyNuevoCasoAsignado · notifyDocumentoAdjunto
notifyNewAppointment(creadaPorAbogado) · notifyAppointmentRescheduled · updateAppointmentStatus
notifyAdminNuevaAsesoria · notifyAsesoriaRechazada · notifyMovimientoProcesal · notifyReporteIACaso
```

### Flujos notificación de citas
| Evento | Función | Receptor |
|--------|---------|----------|
| Cliente solicita cita | `notifyNewAppointment(false)` | Admins + cliente |
| Abogado crea cita | `notifyNewAppointment(true)` | Abogado + cliente |
| Abogado reagenda | `notifyAppointmentRescheduled` | Cliente |
| Confirma / cancela | `updateAppointmentStatus` | Cliente |
| Rechaza landing | `notifyAsesoriaRechazada` | Cliente |
| Nueva desde landing | `notifyAdminNuevaAsesoria` | ADMIN_EMAIL |
| Movimiento procesal | `notifyMovimientoProcesal` | Cliente |

### Cloudflare Turnstile
- **Test/dev:** site key `1x00000000000000000000AA` — captcha solo activo en `NODE_ENV=production`
- **Producción:** `VITE_TURNSTILE_SITE_KEY` real (sin fallback al valor de test)

## Variables de entorno

### `backend/.env`
```
PORT=3001  DB_HOST=localhost  DB_PORT=3306  DB_NAME=despacho_juridico
DB_USER=root  DB_PASSWORD=custom32
JWT_SECRET=despacho_juridico_secret_2024
NODE_ENV=development
GMAIL_USER=osorioalexander640@gmail.com    GMAIL_PASS=<app_password>
APP_URL=http://localhost:5173
CORS_ORIGIN=http://localhost:5173,http://localhost:5174   # separados por coma
TURNSTILE_SECRET=<secret_cloudflare>
ADMIN_EMAIL=osorioalexander640@gmail.com
ANTHROPIC_API_KEY=sk-ant-...    # opcional; sin key IA no aparece
```

### `frontend/.env` (desarrollo — ya creado)
```
VITE_API_URL=http://localhost:3001/api
VITE_TURNSTILE_SITE_KEY=1x00000000000000000000AA
```

### `frontend/.env.production` (crear al desplegar)
```
VITE_API_URL=https://TU-DOMINIO-BACKEND.com/api
VITE_TURNSTILE_SITE_KEY=TU_CLAVE_REAL_DE_CLOUDFLARE
```
> Vite usa `.env.production` automáticamente al hacer `npm run build`.

## Usuarios de prueba
| Email | Rol | Estado |
|-------|-----|--------|
| osorioalexander640@gmail.com | abogado | activo=1 |
| alexa@gmail.com · alchw675@gmail.com | — | activo=1 |

## Usuarios de producción (despacho)
Creados con `node backend/scripts/crearUsuarios.js` — contraseñas gestionadas fuera del repo.
| Email | Rol | Nombre |
|-------|-----|--------|
| abogadoadmin89@gmail.com | abogado | Lic. Horacio Sánchez Cerino |
| secretario867@gmail.com | secretario | Secretario Despacho |

## Agentes especializados (`.claude/agents/`)
| Agente | Responsabilidad |
|--------|-----------------|
| `legal-backend-specialist` | Node.js/Sequelize, emailService, endpoints REST |
| `ui-gold-architect` | Identidad visual Navy/Gold/Glassmorphism |
| `security-officer` | OTP, Turnstile, JWT, bcrypt |

## Iconografía
- **Frontend:** `lucide-react`. Dashboard: `Scale/CalendarDays/Users`. Auth: `ShieldCheck/ShieldAlert`.
- **Dashboard cards:** `rgba(8,20,48,0.55)` + borde `rgba(197,160,89,0.22)` + icono `#c5a059` → constante `CARD_ICON_STYLE`.
- **Correos:** íconos circulares con `<table valign="middle">`. Puntos `&#9679;` dorado.

## Integración Landing Page → Dashboard
1. Formulario Landing → `POST /api/landing/asesoria` → busca/crea cliente → cita `pendiente` → email admin
2. Dashboard `/panel/solicitudes-landing`: badge "Nueva" (<24h) · sidebar `Globe` badge rojo
3. **Confirmar** → `ConfirmarModal` → `PATCH /:id/estado` · **Rechazar** → `PATCH /:id/rechazar` + email
4. **Contactar** → dropdown framer-motion: WhatsApp `wa.me/52...` · Gmail `mailto:`

### Archivos clave Landing
| Archivo | Descripción |
|---------|-------------|
| `backend/src/routes/landing.routes.js` | POST /api/landing/asesoria |
| `backend/src/models/Appointment.js` | `belongsTo(Client, { as:'Cliente' })` — JOIN |
| `frontend/src/features/landing/SolicitudesLandingPage.jsx` | Tabla + ConfirmarModal + Contactar |
| `Landig-page/src/utils/appLinks.js` | URLs: `APP_REGISTRO`, `APP_LOGIN`, `APP_BASE` |
| `Landig-page/vite.config.js` | Proxy `/api → :3001` · `strictPort:true` |

### Navegación Landing → App
- `appLinks.js` — fuente única; cambiar `APP_BASE` al desplegar
- Botones usan `window.location.href` (puertos distintos, no react-router)
- Spinner dorado si navegación tarda >300ms

## Features implementadas

| Feature | Descripción | Archivos clave |
|---------|-------------|----------------|
| **Auth 2FA** | Registro+verificación email → Login OTP 6 dígitos 10min · 3 intentos · JWT 2h | `auth.controller.js` · `OtpPage.jsx` |
| **Análisis Documental IA** | Auto al subir (fire-and-forget). Botón "Resumen IA" en admin y portal cliente. Requiere `ANTHROPIC_API_KEY` | `aiService.js` · `DocumentosPage.jsx` · `MisCasosPage.jsx` |
| **Timeline visual** | Tab "Historial" en CaseDetail — apertura, docs, citas, comentarios, movimientos | `GET /api/casos/:id/timeline` · `CaseTimeline.jsx` |
| **Escalamiento urgencias** | Cron diario → email ⚠️ a abogados/secretarios por casos con fecha límite próxima | `reminderWorker.js` |
| **Movimientos procesales** | Abogado registra → email instantáneo al cliente · visible en portal | `Movimiento.js` · tab "Movimientos" en `CaseDetail.jsx` |
| **Agente Monitoreo IA** | Job 07:00 MX → analiza casos activos con Claude Haiku → reporte en BD + email abogado | `jobMonitoreoIA` en `reminderWorker.js` · tab "Análisis IA" |
| **Chat IA por caso** | Pregunta libre → Claude Haiku responde con contexto del caso | `POST /:id/chat` · tab "Chat IA" en `CaseDetail.jsx` |
| **Candado Digital** | Docs suben bloqueados por defecto → abogado libera → cliente descarga | `PATCH /:id/toggle-bloqueo` · botón candado en `DocumentosPage.jsx` |
| **Preview Documentos** | Bloqueados: botón "Vista previa" → modal con contenido difuminado + candado + "Documento en revisión". Desbloqueados: botón "Ver" (inline PDF/imagen) + "Descargar" | `GET /mis-documentos/:id/preview` en `documents.routes.js` · `MisCasosPage.jsx` |
| **Semáforo de Caso** | Indicador visual 🔴🟡🟢 en cada tarjeta del portal cliente. Rojo: urgente/vencido/≤3 días · Amarillo: 4-14 días o docs bloqueados · Verde: todo al día | `calcularSemaforo()` en `MisCasosPage.jsx` |
| **Solicitudes Landing** | Leads desde landing → tabla de gestión en dashboard | `SolicitudesLandingPage.jsx` |
| **Ciclo vida cliente** | Temporal (sin usuario) o permanente. `completarAsesoria` desactiva usuario al cerrar | `PATCH /:id/completar-asesoria` |
| **Tracking origen** | `?source=landing` → campo `origen` en usuarios | `RegisterPage.jsx` · `auth.controller.js` |

**SQL requerido en producción (ejecutar manualmente):**
```sql
ALTER TABLE casos ADD COLUMN reporte_ia TEXT NULL;
ALTER TABLE casos ADD COLUMN reporte_ia_at DATETIME NULL;
ALTER TABLE usuarios ADD COLUMN origen VARCHAR(50) NULL DEFAULT NULL;
```

## Checklist de Despliegue

### Backend `.env` producción
- [ ] `DB_*` → producción · `JWT_SECRET` ≥32 chars · `GMAIL_PASS` real · `APP_URL` real
- [ ] `TURNSTILE_SECRET` prod · `ADMIN_EMAIL` real · `NODE_ENV=production`
- [ ] `CORS_ORIGIN=https://tudominio.com,https://landing.tudominio.com`
- [ ] `ANTHROPIC_API_KEY` → opcional; sin key la IA no aparece

### Frontend/Landing
- [ ] `VITE_API_URL=https://api.tudominio.com/api` en `frontend/.env.production`
- [ ] `VITE_TURNSTILE_SITE_KEY` real (prod) en `frontend/.env.production`
- [ ] `APP_BASE` en `Landig-page/src/utils/appLinks.js` al dominio real

### BD y build
- [x] Tablas `comentarios` y `movimientos` — creadas
- [x] Campo `origen` en `usuarios` — implementado (SQL pendiente en producción)
- [ ] `ALTER TABLE casos ADD COLUMN reporte_ia TEXT NULL;` + `reporte_ia_at DATETIME NULL;`
- [ ] `ALTER TABLE usuarios ADD COLUMN origen VARCHAR(50) NULL DEFAULT NULL;`
- [ ] `npm run build` en `frontend/` y `Landig-page/`
- [ ] CORS configurado para URL de producción
- [ ] Uploads: ruta pública o S3/Cloudinary (actualmente local)

### Nota IA
~$0.002/doc análisis · ~$0.001/caso/día monitoreo. Sin `ANTHROPIC_API_KEY` el sistema funciona igual, botones IA no aparecen.

---

## Auditoría Pre-Despliegue ✓ (2026-04-09)

Auditoria completada con agentes especializados. Hallazgos corregidos en esta sesión:

### Correcciones aplicadas — Backend

| Severidad | Archivo | Fix |
|-----------|---------|-----|
| CRITICAL | `app.js` | CORS restringido a `CORS_ORIGIN` (antes `*`) |
| CRITICAL | `app.js` | `/uploads` eliminado como static — toda descarga requiere auth |
| CRITICAL | `cases.controller.js` | Folio generado con `sequelize.transaction + LOCK.UPDATE`, 4 dígitos (`EXP-2025-0001`) |
| HIGH | `auth.routes.js` | Rate-limit en `/registro` (10/15min) y `/verify-otp` (10/15min) |
| HIGH | `auth.controller.js` | Turnstile solo activo en `NODE_ENV=production` (antes `!== 'test'`) |
| HIGH | `auth.controller.js` | OTP update consolidado en 1 sola operación (antes 2 updates) |
| HIGH | `auth.controller.js` | `adminResetPassword`: contraseña mínima 8 chars; email no incluye la contraseña |
| HIGH | `appointments.controller.js` | `notifyNewAppointment` y `notifyAppointmentRescheduled` → fire-and-forget |
| HIGH | `cases.controller.js` | `notifyNewCaseComment` → fire-and-forget |
| MEDIUM | `emailService.js` | Subject OTP sin el código visible; "10 minutos" corregido (antes "15") |

### Correcciones aplicadas — Frontend

| Severidad | Archivo | Fix |
|-----------|---------|-----|
| CRITICAL | `context/axios.config.js` | Archivo duplicado redirigido al correcto con interceptores |
| CRITICAL | `utils/constants.js` | `API_BASE_URL` usa `VITE_API_URL` (antes hardcodeado a localhost) |
| CRITICAL | `DocumentosPage.jsx` | Descarga usa `VITE_API_URL`; maneja 401/403/error de red |
| CRITICAL | `MisCasosPage.jsx` | Descarga usa `VITE_API_URL`; maneja 401/403/error de red |
| HIGH | `AuthContext.jsx` | `JSON.parse` de localStorage protegido con try-catch |
| HIGH | `AppRouter.jsx` | `ProtectedRoute` retorna pantalla oscura en lugar de `null` durante loading |

### Pendientes menores (no bloquean despliegue)
- ✅ `clients.controller.js` — `createCliente`: `activo:true` añadido al `User.create` — **corregido 2026-04-09**
- ✅ `reminderWorker.js` — limpieza OTP migrada a `User.update` ORM; import `sequelize` eliminado — **corregido 2026-04-09**
- ✅ `cases.controller.js` — paginación `getCasos` con cota máxima `Math.min(limit, 100)` — **corregido 2026-04-09**
- ✅ `scripts/resetAdmin.js` — archivo no existía (eliminado previamente) — **verificado 2026-04-09**
- ✅ `CaseDetail.jsx` — `.catch(() => {})` silenciado → `setMovimientos([])` — **corregido 2026-04-09**
- ✅ Frontend: 14 `alert()` reemplazados por `Toast.jsx` (`AgendaPage`, `ClientsPage`, `CasesPage`, `DocumentosPage`, `MisCasosPage`, `UsuariosPendientesPage`) — **corregido 2026-04-09**
- ✅ Google Fonts en `frontend/index.html` (Playfair Display + Inter) — **ya estaban correctamente ubicados**
- ✅ `OtpPage.jsx` — botón "Reenviar OTP" implementado con cooldown 60s + endpoint `POST /api/auth/resend-otp` — **corregido 2026-04-09**
- ✅ `VerificarEmailPage.jsx` — `useEffect` deps `[searchParams]` — **corregido 2026-04-09**

## Notas de entrega

### Versión escuela (este repo — original completo)
Incluye toda la IA: análisis documental, monitoreo, chat por caso, semáforo, preview de docs.

### Versión tío (fork sin IA)
Copia del proyecto con la IA desactivada: sin `ANTHROPIC_API_KEY`, sin botones de análisis/chat IA, sin job de monitoreo. Todo lo demás igual. Mantener en repositorio separado.

---

## Roadmap comercial

### Versión actual — $55,000–$65,000 MXN
Sistema base · 2FA · IA documental + monitoreo + chat · Timeline · Movimientos procesales · Landing integrada · Semáforo de caso · Preview de documentos

### Mejoras propuestas (costo adicional)
Funcionalidades identificadas para una versión más completa — requieren desarrollo adicional:

| Propuesta | Descripción | Estimado |
|-----------|-------------|----------|
| **Centro de Notificaciones in-app** | Campana en navbar del cliente con badge de no leídas. Eventos: doc subido, estado cambiado, movimiento registrado, comentario nuevo. Actualmente solo llegan por email | +$8,000–$12,000 MXN |
| **Comentarios desde portal cliente** | El cliente puede escribir mensajes en su caso (hoy solo abogado/secretario). El abogado recibe email fire-and-forget. Comunicación bidireccional dentro del expediente | +$6,000–$9,000 MXN |
| **Solicitud de documentos** | El cliente pide un doc específico desde el portal ("necesito el contrato firmado"). Queda registrado como movimiento y llega email al abogado | +$4,000–$6,000 MXN |

### Enterprise — hasta $120,000 MXN
Facturación CFDI/SAT · App móvil nativa · Firma electrónica · Integración SCJN/PJF · Multi-despacho · Soporte 12 meses
