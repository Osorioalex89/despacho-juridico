# 🗂 MEMORY.MD — Despacho Jurídico
> Actualizar cada vez que se complete, corrija o agregue algo nuevo.
> Última actualización: Marzo 2026

---

## 🏗 Stack
| Capa | Tecnología |
|------|-----------|
| Frontend | React + Vite + Tailwind CSS |
| Backend | Node.js + Express + MySQL + Sequelize |
| Auth | JWT + bcryptjs |
| Upload | Multer |
| Repo | github.com/Osorioalex89/despacho-juridico |

**Puertos:** Frontend `5173` · Backend `3001`  
**DB:** `despacho_juridico` (MySQL)

---

## 👤 Roles y accesos
| Rol | Acceso |
|-----|--------|
| `abogado` | Todo: casos, documentos confidenciales, usuarios |
| `secretario` | Panel: clientes, agenda, solicitudes (no crear/editar casos) |
| `cliente` | Portal: mis casos, mis citas, solicitar cita |
| `usuario` | Página de espera (`/pendiente`) |

**Estados de usuario:** `pendiente` → `aprobado` / `rechazado`

---

## 🗄 Base de datos — Tablas principales
```
usuarios      → id_usuario, nombre, correo, contrasena[bcrypt], rol, estado, activo
clientes      → id_cliente, id_usuario[FK nullable], nombre, telefono, correo, direccion, rfc, notas
casos         → id_caso, folio[unique], asunto, tipo, estado, descripcion, id_cliente, id_abogado,
                juzgado, exp_externo, contraparte, fecha_apertura, fecha_limite, notas
citas         → id_cita, id_cliente, id_caso, id_abogado, fecha, hora, motivo, estado, notas, mensaje, id_solicitante
documentos    → id_documento, id_caso, id_usuario, nombre, nombre_original, tipo, tamanio, categoria, descripcion
```

**Tipos de caso:** Penal, Civil, Amparo, Sucesorio, Contratos, Trámite de escrituras, Inscripción de posesión, Asesoría legal  
**Estados de caso:** activo, urgente, pendiente, en_revision, cerrado  
**Estados de cita:** pendiente, confirmada, cancelada  
**Categorías de doc:** general, confidencial

---

## 🔗 Rutas API (backend :3001)
```
POST   /api/auth/login
POST   /api/auth/registro
GET/POST/PUT/DELETE  /api/clientes
GET/POST/PUT/DELETE  /api/casos
GET    /api/casos/mis-casos          ← ANTES de /:id
GET/POST/PUT/PATCH/DELETE /api/citas
POST   /api/citas/solicitar
GET    /api/citas/mis-citas          ← ANTES de /:id
GET/POST/DELETE      /api/documentos
GET    /api/documentos/:id/descargar
GET    /api/documentos/mis-documentos
GET    /api/documentos/mis-documentos/:id/descargar
GET/PATCH/DELETE     /api/usuarios
```

---

## 🎨 Design System — Legal Premium
```css
--bg-base:        #020818
--bg-card:        rgba(8,20,48,0.75)   /* Glassmorphism L2 */
--bg-card-deep:   rgba(6,16,40,0.97)   /* Glassmorphism L3 */
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
- activo → azul `#93BBFC` | urgente → rojo `#FCA5A5`
- pendiente → amber `#FCD34D` | en_revision → morado `#C4B5FD` | cerrado → gris `#9CA3AF`

---

## 📁 Estructura frontend relevante
```
frontend/src/features/
├── auth/
│   ├── LoginPage.jsx          ✅ rediseñado
│   ├── RegisterPage.jsx       ✅ rediseñado
│   └── PendientePage.jsx      ✅ rediseñado (stepper + servicios interactivos + sello SSL)
├── dashboard/DashboardPage.jsx ✅ rediseñado
├── clients/
│   ├── ClientsPage.jsx        ✅ rediseñado
│   ├── ClientForm.jsx         ⏳ pendiente de rediseño
│   └── ClientDetail.jsx       ⏳ pendiente de rediseño
├── cases/
│   ├── CasesPage.jsx          ✅ rediseñado
│   ├── CaseDetail.jsx         ✅ rediseñado
│   └── CaseForm.jsx           ✅ rediseñado
├── appointments/
│   └── AgendaPage.jsx         ✅ rediseñado (split 30/70, mini stats, cards con hora pill)
├── documents/
│   └── DocumentosPage.jsx     ✅ rediseñado (select nativo, drop zone, stats)
├── users/
│   └── UsuariosPendientesPage.jsx ✅ rediseñado (stepper aprobación con selección de rol)
└── clientPortal/
    ├── MisCasosPage.jsx       ✅ rediseñado
    ├── MisCitasPage.jsx       ✅ rediseñado (split calendario + detalle día)
    └── SolicitarCitaPage.jsx  ✅ rediseñado
components/layout/
├── Sidebar.jsx                ✅ rediseñado (logo SC, glassmorphism, badges)
├── PanelLayout.jsx            — sin cambios
├── PageHeader.jsx             — sin cambios (reemplazado inline en cada page)
└── ClientNavbar.jsx           ⏳ pendiente de rediseño
```

---

## ✅ Completado
- Sistema de autenticación JWT completo (login, registro, roles, redirección por estado)
- CRUD completo: Clientes, Casos, Citas, Documentos, Usuarios
- Portal del cliente (mis citas, mis casos + docs, solicitar cita)
- Aprobación de usuarios con selección de rol (crea registro en `clientes` automáticamente)
- Descarga de documentos con token JWT
- Rediseño visual completo con legal-premium-design en todos los módulos listados arriba
- Stats de usuarios pendientes/aprobados/rechazados corregidas (fetch doble: filtrado + totales)

---

## ⏳ Pendiente
| Tarea | Prioridad |
|-------|-----------|
| `ClientDetail.jsx` — rediseño | Alta |
| `ClientForm.jsx` — rediseño | Alta |
| `ClientNavbar.jsx` — rediseño portal cliente | Media |
| `PageHeader.jsx` — evaluar si se necesita | Baja |
| Campo de contraseña al crear cliente nuevo desde el panel | ⚠️ Bug/feature pendiente |

---

## ⚠️ Bugs / detalles pendientes
- **Crear cliente desde panel (ClientForm):** Al crear un cliente manualmente desde el panel de administración, no hay campo para asignarle contraseña. Si ese cliente quiere acceder al portal del cliente, no tiene credenciales. Solución pendiente: agregar campos opcionales `correo` + `contrasena` en `ClientForm` para crear automáticamente un `usuario` vinculado con rol `cliente`.
- **Dropdown de expediente en Documentos:** Se resolvió usando `<select>` nativo en lugar de dropdown custom (evita conflictos de z-index con glassmorphism).
- **Rutas de citas y casos:** `/mis-citas`, `/solicitar` y `/mis-casos` deben declararse ANTES de `/:id` en Express, de lo contrario se interpretan como IDs.

---

## 🚀 Comandos
```powershell
# Backend
cd backend && npm run dev   # nodemon → :3001

# Frontend  
cd frontend && npm run dev  # vite → :5173

# Git
git add . && git commit -m "mensaje" && git push
```

---

## 📝 Flujo de aprobación de usuario
1. Usuario se registra → estado `pendiente`, rol `usuario`
2. Login → redirige a `/pendiente` (PendientePage)
3. Secretario/Abogado ve solicitud en panel → aprueba con rol (cliente/secretario/abogado)
4. Al aprobar: se crea registro en tabla `clientes` con `id_usuario` vinculado
5. Usuario puede hacer login normalmente → redirige según su rol

---

## 🔑 Usuarios de prueba
| Email | Password | Rol | Estado |
|-------|----------|-----|--------|
| abogado@despacho.com | Admin123 | abogado | aprobado |
| cliente@despacho.com | Cliente123 | cliente | aprobado |
| usuario@test.com | Test123 | usuario | pendiente |
