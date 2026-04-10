/**
 * emailTemplate.js — Agente 2: Inyector de diseño HTML
 *
 * Builders reutilizables para construir el contenido de cualquier correo
 * con el diseño Legal Premium (Navy/Gold) sin escribir HTML crudo.
 *
 * Uso:
 *   import { t } from './emailTemplate.js'
 *
 *   const contenido = [
 *     t.greeting('María'),
 *     t.intro('Tu cita ha sido confirmada.'),
 *     t.infoBox('Detalles', [
 *       t.row('Fecha', '10 de abril'),
 *       t.row('Hora', '10:00 hrs'),
 *     ]),
 *     t.button('Ver mis citas', 'https://...'),
 *     t.note('Si tienes dudas, contáctanos.'),
 *   ].join('')
 */

// ── Bloques atómicos ───────────────────────────────────────────────

/** Saludo principal (h2 Playfair Display) */
const greeting = (texto) =>
  `<h2 class="greeting">${texto}</h2>`

/** Párrafo introductorio */
const intro = (html) =>
  `<p class="intro">${html}</p>`

/**
 * Caja de información (el recuadro gold/glass)
 * @param {string} label   — título en mayúsculas sobre la caja
 * @param {string} content — HTML interno (rows, párrafos, etc.)
 * @param {object} opts    — { accentColor, bg, border } para acentos de color
 */
const infoBox = (label, content, opts = {}) => {
  const {
    accentColor = 'rgba(201,168,76,0.6)',
    bg          = 'rgba(201,168,76,0.06)',
    border      = 'rgba(201,168,76,0.22)',
    align       = 'left',
  } = opts
  return `
    <div class="otp-box" style="text-align:${align};background:${bg};border-color:${border};">
      <p class="otp-label" style="color:${accentColor};">${label}</p>
      ${content}
    </div>`
}

/**
 * Fila de bullet point dentro de un infoBox
 * @param {string} label — etiqueta en negrita (puede ser vacía)
 * @param {string} value — valor (acepta HTML)
 */
const row = (label, value) =>
  `<div class="info-row" style="margin-bottom:10px;">
    <span class="info-dot">&#9679;</span>
    <p class="info-text">${label ? `<strong>${label}:</strong> ` : ''}${value}</p>
  </div>`

/** Última fila (sin margin-bottom) */
const rowLast = (label, value) =>
  `<div class="info-row">
    <span class="info-dot">&#9679;</span>
    <p class="info-text">${label ? `<strong>${label}:</strong> ` : ''}${value}</p>
  </div>`

/**
 * Botón CTA dorado (o del color que se pase)
 * @param {string} texto
 * @param {string} url
 * @param {object} opts — { bg, color, shadow }
 */
const button = (texto, url, opts = {}) => {
  const {
    bg     = 'linear-gradient(135deg,#C9A84C 0%,#9A7A32 100%)',
    color  = '#020818',
    shadow = '0 6px 24px rgba(201,168,76,0.35)',
  } = opts
  return `
    <a href="${url}"
       class="verify-btn"
       style="background:${bg};color:${color} !important;box-shadow:${shadow};">
      ${texto}
    </a>`
}

/**
 * Nota/pie de bloque (texto gris pequeño)
 */
const note = (html) =>
  `<p style="font-size:13px;color:rgba(255,255,255,0.3);margin:0 0 20px;line-height:1.6;">${html}</p>`

/**
 * Separador visual (línea gold tenue)
 */
const divider = () =>
  `<div style="height:1px;background:linear-gradient(90deg,transparent,rgba(201,168,76,0.2),transparent);margin:20px 0;"></div>`

/**
 * Ícono circular tipo OTP (texto centrado en círculo gold)
 * @param {string} icono — texto/símbolo dentro del círculo (ej: '&#10003;', 'OTP')
 */
const circleIcon = (icono) =>
  `<table border="0" cellpadding="0" cellspacing="0" width="60" style="margin:0 auto 24px;">
    <tr>
      <td width="60" height="60" align="center" valign="middle"
          style="border-radius:30px;background:rgba(201,168,76,0.07);border:1px solid rgba(201,168,76,0.22);
                 font-family:Arial,sans-serif;font-size:26px;font-weight:700;color:#C9A84C;">
        ${icono}
      </td>
    </tr>
  </table>`

/**
 * Badge de estado (para mostrar estado de una cita, caso, etc.)
 * @param {string} texto
 * @param {string} color — color del texto y borde
 */
const badge = (texto, color = '#C9A84C') =>
  `<span style="display:inline-block;padding:3px 12px;border-radius:20px;
               font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;
               color:${color};border:1px solid ${color}33;background:${color}11;">
    ${texto}
  </span>`

// ── Helpers de formato de fecha ────────────────────────────────────

/**
 * Formatea "2025-04-10" + "10:00" en "miércoles, 10 de abril de 2025"
 * Usa hora local para evitar el bug de zona horaria.
 */
const formatFecha = (fecha, hora = '12:00') => {
  const [y, m, d] = fecha.split('-').map(Number)
  const [hh, mm]  = hora.split(':').map(Number)
  return new Date(y, m - 1, d, hh, mm).toLocaleDateString('es-MX', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })
}

// ── Export agrupado ────────────────────────────────────────────────

export const t = {
  greeting,
  intro,
  infoBox,
  row,
  rowLast,
  button,
  note,
  divider,
  circleIcon,
  badge,
  formatFecha,
}
