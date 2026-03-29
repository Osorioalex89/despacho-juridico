# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Full-stack legal case management system ("Despacho Jurídico") — monorepo con frontend React y backend Express.js conectado a MySQL.

Repo: github.com/Osorioalex89/despacho-juridico
Puertos: Frontend `:5173` · Backend `:3001`

## Comandos de desarrollo

### Backend (desde `backend/`)
```bash
npm run dev    # nodemon src/app.js → :3001
npm start      # producción
```

### Frontend (desde `frontend/`)
```bash
npm run dev    # Vite → :5173
npm run build  # dist/
npm run lint   # ESLint
```

No hay orquestador raíz — iniciar cada uno por separado.

## Arquitectura

### Frontend (`frontend/src/`)
- **`router/AppRouter.jsx`** — React Router v7, rutas protegidas por rol: `/panel/*` (abogado/secretario), `/cliente/*` (cliente), `/pendiente` (usuario)
- **`context/AuthContext.jsx`** — estado de auth; token en localStorage
- **`context/axios.config.js`** — instancia Axios con base `http://localhost:3001/api`, inyecta Bearer token, maneja 401 con logout automático
- **`features/`** — módulos: `auth/`, `dashboard/`, `clients/`, `cases/`, `appointments/`, `documents/`, `users/`, `clientPortal/`
- **`services/`** — helpers de llamadas API por feature

### Backend (`backend/src/`)
- **`app.js`** — entry Express: monta rutas, CORS, JSON parser, archivos estáticos `/uploads`
- **`middlewares/auth.middleware.js`** — verificación JWT + control de acceso por rol
- **`models/`** — 5 modelos Sequelize: `User`, `Client`, `Case`, `Appointment`, `Document`
- **`config/database.js`** — Sequelize + MySQL2, `sync({ alter: false })`
- **`config/multer.js`** — uploads almacenados en `uploads/`

### Base de datos
MySQL `despacho_juridico`. Esquema principal:
```
usuarios    → id_usuario, nombre, correo, contrasena[bcrypt], rol, estado, activo
clientes    → id_cliente, id_usuario[FK nullable], nombre, telefono, correo, direccion, rfc, notas
casos       → id_caso, folio[unique], asunto, tipo, estado, descripcion, id_cliente, id_abogado,
              juzgado, exp_externo, contraparte, fecha_apertura, fecha_limite, notas
citas       → id_cita, id_cliente, id_caso, id_abogado, fecha, hora, motivo, estado, notas, mensaje, id_solicitante
documentos  → id_documento, id_caso, id_usuario, nombre, nombre_original, tipo, tamanio, categoria, descripcion
```

**Tipos de caso:** Penal, Civil, Amparo, Sucesorio, Contratos, Trámite de escrituras, Inscripción de posesión, Asesoría legal
**Estados de caso:** `activo` · `urgente` · `pendiente` · `en_revision` · `cerrado`
**Estados de cita:** `pendiente` · `confirmada` · `cancelada`
**Categorías de doc:** `general` · `confidencial`

### Rutas API (backend :3001)
```
POST   /api/auth/login
POST   /api/auth/registro
GET/POST/PUT/DELETE       /api/clientes
GET/POST/PUT/DELETE       /api/casos
GET    /api/casos/mis-casos              ← declarar ANTES de /:id
GET/POST/PUT/PATCH/DELETE /api/citas
POST   /api/citas/solicitar
GET    /api/citas/mis-citas              ← declarar ANTES de /:id
GET/POST/DELETE           /api/documentos
GET    /api/documentos/:id/descargar
GET    /api/documentos/mis-documentos
GET    /api/documentos/mis-documentos/:id/descargar
GET/PATCH/DELETE          /api/usuarios
```

### Auth & Roles
JWT (8h), contraseñas con bcryptjs. Cuatro roles:
- **abogado** — acceso total: casos, docs confidenciales, gestión de usuarios
- **secretario** — panel: clientes, agenda, aprobar usuarios (NO crear/editar casos)
- **cliente** — portal: mis casos, mis citas, solicitar cita
- **usuario** — página de espera (`/pendiente`) hasta ser aprobado

**Flujo de aprobación:**
1. Registro → estado `pendiente`, rol `usuario`
2. Login → redirige a `/pendiente`
3. Secretario/Abogado aprueba con rol en el panel
4. Al aprobar: se crea registro en `clientes` con `id_usuario` vinculado
5. Usuario puede ingresar normalmente según su rol

## Design System — Legal Premium

```css
--bg-base:        #020818
--bg-card:        rgba(8,20,48,0.75)    /* Glassmorphism L2 */
--bg-card-deep:   rgba(6,16,40,0.97)    /* Glassmorphism L3 */
--gold-primary:   #C9A84C
--gold-light:     #E8C97A
--gold-dark:      #9A7A32
--gold-border:    rgba(201,168,76,0.2)
--text-primary:   rgba(255,255,255,0.95)
--text-secondary: rgba(255,255,255,0.55)
```

**Fuentes:** Playfair Display (títulos/nombres) · Inter (UI/datos)
**Logo:** SVG balanza + monograma "SC" con gradiente gold

**Badges de estado:**
- `activo` → azul `#93BBFC` | `urgente` → rojo `#FCA5A5`
- `pendiente` → amber `#FCD34D` | `en_revision` → morado `#C4B5FD` | `cerrado` → gris `#9CA3AF`

## Convenciones clave

- **Estilos:** Tailwind CSS v4 + PostCSS. Glassmorphism + tema gold/navy. Los estilos inline con `style={{}}` son válidos para variables CSS custom.
- **Formularios:** React Hook Form + Zod para validación.
- **API calls:** Siempre usar la instancia Axios de `axios.config.js`, nunca `fetch` directo.
- **Dropdowns custom:** Usar `<select>` nativo en lugar de dropdowns custom para evitar conflictos de z-index con glassmorphism.
- **Sin TypeScript** — JavaScript puro en todo el proyecto.

## Estado del rediseño

### ✅ Completado
| Archivo | Notas |
|---------|-------|
| `auth/LoginPage.jsx` | |
| `auth/RegisterPage.jsx` | |
| `auth/PendientePage.jsx` | Stepper + servicios interactivos + sello SSL |
| `dashboard/DashboardPage.jsx` | |
| `clients/ClientsPage.jsx` | |
| `cases/CasesPage.jsx` | |
| `cases/CaseDetail.jsx` | |
| `cases/CaseForm.jsx` | |
| `appointments/AgendaPage.jsx` | Split 30/70, mini stats, cards con hora pill |
| `documents/DocumentosPage.jsx` | Select nativo, drop zone, stats |
| `users/UsuariosPendientesPage.jsx` | Stepper aprobación con selección de rol |
| `clientPortal/MisCasosPage.jsx` | |
| `clientPortal/MisCitasPage.jsx` | Split calendario + detalle día |
| `clientPortal/SolicitarCitaPage.jsx` | |
| `components/layout/Sidebar.jsx` | Logo SC, glassmorphism, badges |
| `clients/ClientDetail.jsx` | Avatar, 3 cards glassmorphism, InfoRow/Card/CardHeader components |
| `clients/ClientForm.jsx` | 3 secciones, toggle acceso portal, backend bug fix (contraseña + usuario vinculado) |

### ⏳ Pendiente de rediseño
| Archivo | Prioridad |
|---------|-----------|
| `components/layout/ClientNavbar.jsx` | Media |

## Bugs conocidos

- **Avatar de cliente muestra fuente incorrecta:** En `ClientsPage.jsx` la inicial del avatar puede renderizarse con fuente de sistema en lugar de Playfair Display si Google Fonts no carga a tiempo (o se abre sin conexión). Se añadió el `<link>` de Google Fonts en `index.html` globalmente pero el comportamiento puede persistir en algunos casos.

## Usuarios de prueba

| Email | Password | Rol |
|-------|----------|-----|
| abogado@despacho.com | Admin123 | abogado |
| cliente@despacho.com | Cliente123 | cliente |
| usuario@test.com | Test123 | usuario (pendiente) |

## Variables de entorno

`backend/.env`:
```
PORT=3001
DB_HOST=localhost
DB_PORT=3306
DB_NAME=despacho_juridico
DB_USER=root
DB_PASSWORD=custom32
JWT_SECRET=despacho_juridico_secret_2024
JWT_EXPIRES_IN=8h
```
