import sgMail from '@sendgrid/mail'

// ── Cliente SendGrid (HTTP API — sin SMTP, funciona en Railway) ───
sgMail.setApiKey(process.env.SENDGRID_API_KEY)

const FROM_EMAIL = {
  email: process.env.SENDGRID_FROM_EMAIL || 'abogadoadmin89@gmail.com',
  name:  'Despacho Jurídico Sánchez Cerino',
}

// Wrapper compatible con todas las llamadas existentes a transporter.sendMail
const transporter = {
  sendMail: ({ to, subject, html }) =>
    sgMail.send({ from: FROM_EMAIL, to, subject, html }),
}

// ── Plantilla base Legal Premium (Navy/Gold) ───────────────────────
// Nota: SVG no soportado en Gmail — se usan caracteres Unicode compatibles
// opts.showSecurityNote = false → oculta la caja "Si no solicitaste esto..."
//   útil para correos de recordatorio/citas donde esa nota no aplica.
const emailBase = (titulo, contenido, { showSecurityNote = true } = {}) => `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>${titulo}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Inter:wght@400;500;600;700&display=swap');
    body { margin:0; padding:0; background:#020818; font-family:'Inter',Arial,sans-serif; }
    .wrapper { background:#020818; padding:40px 20px; min-height:100vh; }
    .card {
      max-width:560px; margin:0 auto;
      background:linear-gradient(160deg,rgba(8,20,48,0.97) 0%,rgba(6,14,36,0.99) 100%);
      border:1px solid rgba(201,168,76,0.25);
      border-radius:20px;
      box-shadow:0 24px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(201,168,76,0.08);
      overflow:hidden;
    }
    .header {
      background:linear-gradient(135deg,#0a1628 0%,#0e2040 50%,#0a1628 100%);
      border-bottom:1px solid rgba(201,168,76,0.2);
      padding:32px 40px 28px;
      text-align:center;
      position:relative;
    }
    .header::after {
      content:'';
      position:absolute;
      bottom:0; left:0; right:0; height:1px;
      background:linear-gradient(90deg,transparent,rgba(201,168,76,0.5),transparent);
    }
    .logo-ring {
      width:72px; height:72px; border-radius:50%;
      background:rgba(201,168,76,0.06);
      border:1px solid rgba(201,168,76,0.25);
      margin:0 auto 16px;
      text-align:center;
      line-height:72px;
    }
    .firm-name {
      font-family:'Playfair Display',Georgia,serif;
      font-size:20px; font-weight:700;
      color:rgba(255,255,255,0.97);
      margin:0 0 5px; line-height:1.2;
    }
    .firm-name span { color:#C9A84C; }
    .firm-sub {
      font-family:'Inter',sans-serif;
      font-size:10px; font-weight:700;
      color:rgba(201,168,76,0.55);
      letter-spacing:3px; text-transform:uppercase;
      margin:0;
    }
    .gold-line {
      width:36px; height:2px; margin:14px auto 0;
      background:linear-gradient(90deg,transparent,#C9A84C,transparent);
      border-radius:2px;
    }
    .body { padding:36px 40px; }
    .greeting {
      font-family:'Playfair Display',serif;
      font-size:22px; font-weight:700;
      color:rgba(255,255,255,0.97);
      margin:0 0 10px;
    }
    .intro {
      font-size:14px; color:rgba(255,255,255,0.5);
      line-height:1.7; margin:0 0 28px;
    }
    .otp-box {
      background:rgba(201,168,76,0.06);
      border:1px solid rgba(201,168,76,0.22);
      border-radius:14px;
      padding:28px;
      text-align:center;
      margin-bottom:28px;
    }
    .otp-label {
      font-size:10px; font-weight:700;
      letter-spacing:2.5px; text-transform:uppercase;
      color:rgba(201,168,76,0.6);
      margin:0 0 14px;
    }
    .otp-code {
      font-family:'Playfair Display',serif;
      font-size:46px; font-weight:700;
      color:#E8C97A;
      letter-spacing:12px;
      text-shadow:0 4px 20px rgba(201,168,76,0.4);
      margin:0 0 14px;
    }
    .otp-expires {
      font-size:12px; color:rgba(255,255,255,0.3);
      margin:0;
    }
    .verify-btn {
      display:block;
      background:linear-gradient(135deg,#C9A84C 0%,#9A7A32 100%);
      color:#020818 !important;
      font-family:'Inter',sans-serif;
      font-size:15px; font-weight:700;
      text-decoration:none;
      padding:15px 32px;
      border-radius:10px;
      text-align:center;
      margin-bottom:28px;
      box-shadow:0 6px 24px rgba(201,168,76,0.35);
    }
    .info-box {
      background:rgba(255,255,255,0.03);
      border:1px solid rgba(255,255,255,0.07);
      border-radius:10px;
      padding:16px 20px;
      margin-bottom:24px;
    }
    .info-row {
      display:flex; gap:12px;
      align-items:flex-start;
      margin-bottom:10px;
    }
    .info-row:last-child { margin-bottom:0; }
    .info-dot {
      font-size:9px; color:rgba(201,168,76,0.6);
      flex-shrink:0; margin-top:4px; line-height:1;
      font-family:Arial,sans-serif;
    }
    .info-text { font-size:12.5px; color:rgba(255,255,255,0.45); line-height:1.6; }
    .info-text strong { color:rgba(255,255,255,0.65); }
    .footer {
      background:rgba(0,0,0,0.2);
      border-top:1px solid rgba(255,255,255,0.05);
      padding:20px 40px;
      text-align:center;
    }
    .footer-name {
      font-family:'Inter',sans-serif;
      font-size:11px; font-weight:600;
      color:rgba(255,255,255,0.35);
      margin:0 0 4px;
    }
    .footer-detail {
      font-size:10px; color:rgba(255,255,255,0.18);
      letter-spacing:0.4px; margin:0;
    }
  </style>
</head>
<body>
<div class="wrapper">
  <div class="card">

    <!-- Header -->
    <div class="header">
      <div class="logo-ring">
        <span style="font-family:Georgia,serif;font-size:22px;font-weight:700;color:#C9A84C;letter-spacing:1px;">SC</span>
      </div>
      <p class="firm-name">
        Lic. Horacio <span>S&#225;nchez Cerino</span>
      </p>
      <p class="firm-sub">Asesor&#237;a Jur&#237;dica Profesional</p>
      <div class="gold-line"></div>
    </div>

    <!-- Body -->
    <div class="body">
      ${contenido}

      <!-- Info de seguridad (solo cuando aplica) -->
      ${showSecurityNote ? `
      <div class="info-box">
        <div class="info-row">
          <span class="info-dot">&#9679;</span>
          <p class="info-text">Si no solicitaste esto, <strong>ignora este correo</strong>. Nadie m&#225;s tiene acceso a tu cuenta.</p>
        </div>
        <div class="info-row">
          <span class="info-dot">&#9679;</span>
          <p class="info-text">Francisco Javier Mina #25, Centla, Tabasco &nbsp;&middot;&nbsp; <strong>913-100-44-13</strong></p>
        </div>
      </div>` : `
      <div class="info-box">
        <div class="info-row">
          <span class="info-dot">&#9679;</span>
          <p class="info-text">Francisco Javier Mina #25, Centla, Tabasco &nbsp;&middot;&nbsp; <strong>913-100-44-13</strong></p>
        </div>
      </div>`}
    </div>

    <!-- Footer -->
    <div class="footer">
      <p class="footer-name">Lic. Horacio S&#225;nchez Cerino</p>
      <p class="footer-detail">C&#233;dula Profesional 2762890 &middot; Sistema de Gesti&#243;n Jur&#237;dica &middot; ${new Date().getFullYear()}</p>
    </div>

  </div>
</div>
</body>
</html>
`

// ── Notificar al admin que un cliente solicita reset de contraseña ──
export const sendResetRequestToAdmin = async ({ toAdmins, clienteNombre, clienteCorreo }) => {
  const contenido = `
    <h2 class="greeting">Solicitud de restablecimiento</h2>
    <p class="intro">
      Un usuario del sistema ha solicitado que se restablezca su contrase&#241;a.
      Revisa la solicitud en el panel de administraci&#243;n y asigna una contrase&#241;a temporal.
    </p>

    <div class="otp-box" style="text-align:left;">
      <p class="otp-label">Datos del solicitante</p>
      <p style="font-size:15px;font-family:'Inter',sans-serif;font-weight:600;color:rgba(255,255,255,0.9);margin:0 0 6px;">
        ${clienteNombre}
      </p>
      <p style="font-size:13px;font-family:'Inter',sans-serif;color:rgba(201,168,76,0.75);margin:0;">
        ${clienteCorreo}
      </p>
    </div>

    <p style="font-size:13px;color:rgba(255,255,255,0.3);margin:0 0 20px;line-height:1.6;">
      Ve al panel de administraci&#243;n &#8594; Gesti&#243;n de Usuarios y busca al usuario para asignarle una contrase&#241;a temporal.
    </p>
  `

  for (const to of toAdmins) {
    try {
      await transporter.sendMail({
        from: `"Despacho Jurídico · Lic. Sánchez" <${process.env.GMAIL_USER}>`,
        to,
        subject: `Solicitud de contraseña: ${clienteNombre}`,
        html: emailBase('Solicitud de restablecimiento', contenido),
      })
    } catch (err) {
      console.error(`Error enviando notificaci&#243;n de reset a ${to}:`, err.message)
    }
  }
}

// ── Enviar contraseña temporal al cliente ─────────────────────────
export const sendNewPasswordToClient = async ({ to, nombre, contrasena }) => {
  const contenido = `
    <h2 class="greeting">Hola, ${nombre}</h2>
    <p class="intro">
      El equipo del despacho ha restablecido tu contrase&#241;a de acceso.
      Usa la contrase&#241;a temporal que aparece a continuaci&#243;n para iniciar sesi&#243;n.
      Por seguridad, c&#225;mbiala desde tu perfil en cuanto puedas.
    </p>

    <div class="otp-box">
      <p class="otp-label" style="font-size:13px;margin:0 0 10px;">Tu contrase&#241;a temporal</p>
      <p style="font-family:'Courier New',monospace;font-size:22px;font-weight:700;letter-spacing:3px;color:#E8C97A;margin:0 0 10px;">${contrasena}</p>
      <p class="otp-expires">&#9888;&#65039; Ingresa y c&#225;mbiala lo antes posible</p>
    </div>

    <p style="font-size:13px;color:rgba(255,255,255,0.3);margin:0 0 20px;line-height:1.6;">
      Si no solicitaste este cambio, contacta al despacho de inmediato.
    </p>
  `

  await transporter.sendMail({
    from: `"Despacho Jurídico · Lic. Sánchez" <${process.env.GMAIL_USER}>`,
    to,
    subject: 'Tu nueva contraseña temporal — Despacho Jurídico',
    html: emailBase('Nueva contrase&#241;a temporal', contenido),
  })
}

// ── Enviar OTP de login ────────────────────────────────────────────
export const sendOtpEmail = async ({ to, nombre, otp }) => {
  const contenido = `
    <h2 class="greeting">Hola, ${nombre}</h2>
    <p class="intro">
      Recibimos una solicitud de acceso a tu cuenta en el sistema del despacho.
      Usa el c&#243;digo de verificaci&#243;n de abajo para completar tu inicio de sesi&#243;n.
    </p>

    <div class="otp-box">
      <table border="0" cellpadding="0" cellspacing="0" width="56" style="margin:0 auto 16px;">
        <tr>
          <td width="56" height="56" align="center" valign="middle"
              style="border-radius:28px;background:rgba(201,168,76,0.10);border:1px solid rgba(201,168,76,0.28);font-family:Georgia,serif;font-size:16px;font-weight:700;color:#C9A84C;letter-spacing:1px;">
            OTP
          </td>
        </tr>
      </table>
      <p class="otp-label">C&#243;digo de verificaci&#243;n</p>
      <p class="otp-code">${otp}</p>
      <p class="otp-expires">
        V&#225;lido por <strong style="color:rgba(255,255,255,0.5)">10 minutos</strong>
      </p>
    </div>

    <p style="font-size:13px;color:rgba(255,255,255,0.3);margin:0 0 20px;line-height:1.6;">
      Por seguridad, este c&#243;digo solo puede usarse una vez. No lo compartas con nadie.
    </p>
  `

  await transporter.sendMail({
    from: `"Despacho Jurídico · Lic. Sánchez" <${process.env.GMAIL_USER}>`,
    to,
    subject: `Tu código de verificación — Despacho Jurídico`,
    html: emailBase('Código de verificación', contenido),
  })
}

// ── Notificar nueva cita agendada ─────────────────────────────────
export const notifyNewAppointment = async ({
  toAbogado,
  toCliente,
  nombreAbogado,
  nombreCliente,
  fecha,
  hora,
  motivo,
  folio = null,
  asunto = null,
  creadaPorAbogado = false,
}) => {
  const fechaFmt = new Date(fecha + 'T' + hora).toLocaleDateString('es-MX', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })

  const casoInfo = folio
    ? `<div class="info-row">
        <span class="info-dot">&#9679;</span>
        <p class="info-text"><strong>Caso:</strong> ${folio}${asunto ? ' &#8212; ' + asunto : ''}</p>
       </div>`
    : ''

  const buildContenido = (esAbogado) => `
    <h2 class="greeting">
      ${esAbogado
        ? `Nueva cita: ${nombreCliente}`
        : creadaPorAbogado
          ? `Nueva cita agendada, ${nombreCliente}`
          : `Solicitud recibida, ${nombreCliente}`
      }
    </h2>
    <p class="intro">
      ${esAbogado
        ? `Se ha agendado una nueva cita con el cliente <strong style="color:rgba(255,255,255,0.75)">${nombreCliente}</strong>.`
        : creadaPorAbogado
          ? `El Lic. <strong style="color:rgba(255,255,255,0.75)">${nombreAbogado}</strong> ha programado una nueva sesi&#243;n para el seguimiento de tu caso. Hemos reservado este espacio en la agenda para atender tu asunto con prioridad.`
          : `Tu solicitud de cita con el Lic. <strong style="color:rgba(255,255,255,0.75)">${nombreAbogado}</strong> ha sido recibida exitosamente.`
      }
      Revisa los detalles a continuaci&#243;n.
    </p>

    <div class="otp-box" style="text-align:left;">
      <p class="otp-label">Detalles de la cita</p>
      <div class="info-row" style="margin-bottom:10px;">
        <span class="info-dot">&#9679;</span>
        <p class="info-text"><strong>${fechaFmt}</strong></p>
      </div>
      <div class="info-row" style="margin-bottom:10px;">
        <span class="info-dot">&#9679;</span>
        <p class="info-text"><strong>${hora} hrs</strong></p>
      </div>
      <div class="info-row" style="margin-bottom:10px;">
        <span class="info-dot">&#9679;</span>
        <p class="info-text"><strong>Motivo:</strong> ${motivo}</p>
      </div>
      ${casoInfo}
    </div>

    <p style="font-size:13px;color:rgba(255,255,255,0.3);margin:0 0 20px;line-height:1.6;">
      ${esAbogado
        ? 'Puedes confirmar o cancelar esta cita desde el panel de administraci&#243;n.'
        : creadaPorAbogado
          ? 'Ante cualquier duda, cont&#225;ctanos directamente al despacho.'
          : 'Recibir&#225;s una notificaci&#243;n cuando el despacho confirme tu cita. Ante cualquier duda, cont&#225;ctanos.'
      }
    </p>
  `

  const jobs = []
  if (toAbogado) {
    jobs.push(
      transporter.sendMail({
        from: `"Despacho Jurídico · Lic. Sánchez" <${process.env.GMAIL_USER}>`,
        to: toAbogado,
        subject: `Nueva cita agendada: ${nombreCliente} — ${fechaFmt}`,
        html: emailBase('Nueva cita agendada', buildContenido(true)),
      }).catch(err => console.error(`Error notificando cita a abogado ${toAbogado}:`, err.message))
    )
  }
  if (toCliente) {
    jobs.push(
      transporter.sendMail({
        from: `"Despacho Jurídico · Lic. Sánchez" <${process.env.GMAIL_USER}>`,
        to: toCliente,
        subject: creadaPorAbogado
          ? `Notificación de Agenda — Despacho Jurídico Sánchez`
          : `Tu solicitud de cita fue recibida — ${fechaFmt}`,
        html: emailBase(
          creadaPorAbogado ? 'Nueva cita agendada' : 'Solicitud de cita recibida',
          buildContenido(false)
        ),
      }).catch(err => console.error(`Error notificando cita a cliente ${toCliente}:`, err.message))
    )
  }
  await Promise.all(jobs)
}

// ── Notificar reagendamiento de cita ─────────────────────────────
export const notifyAppointmentRescheduled = async ({
  toCliente,
  nombreCliente,
  nombreAbogado,
  fechaAnterior,
  horaAnterior,
  fechaNueva,
  horaNueva,
  motivo,
}) => {
  const fmt = (f, h) => new Date(f + 'T' + h).toLocaleDateString('es-MX', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })

  const fechaAnteriorFmt = fmt(fechaAnterior, horaAnterior)
  const fechaNuevaFmt    = fmt(fechaNueva,    horaNueva)

  const contenido = `
    <h2 class="greeting">Hola, ${nombreCliente}</h2>
    <p class="intro">
      Te informamos que ha habido un cambio en la programaci&#243;n de tu cita con el
      Lic. <strong style="color:rgba(255,255,255,0.75)">${nombreAbogado}</strong>
      para el seguimiento de tu caso. Los nuevos detalles son los siguientes.
    </p>

    <div class="otp-box" style="text-align:left;background:rgba(201,168,76,0.05);border-color:rgba(201,168,76,0.22);">
      <p class="otp-label">Nueva programaci&#243;n</p>
      <div class="info-row" style="margin-bottom:10px;">
        <span class="info-dot">&#9679;</span>
        <p class="info-text">
          <strong>${fechaNuevaFmt}</strong>
        </p>
      </div>
      <div class="info-row" style="margin-bottom:10px;">
        <span class="info-dot">&#9679;</span>
        <p class="info-text"><strong>${horaNueva} hrs</strong></p>
      </div>
      <div class="info-row">
        <span class="info-dot">&#9679;</span>
        <p class="info-text"><strong>Motivo:</strong> ${motivo}</p>
      </div>
    </div>

    <div class="info-box" style="margin-top:4px;">
      <div class="info-row">
        <span class="info-dot">&#9679;</span>
        <p class="info-text">
          <strong>Fecha anterior:</strong> ${fechaAnteriorFmt} &#8212; ${horaAnterior} hrs
        </p>
      </div>
    </div>

    <p style="font-size:13px;color:rgba(255,255,255,0.3);margin:16px 0 20px;line-height:1.6;">
      Si tienes alguna duda sobre este cambio, cont&#225;ctanos directamente al despacho.
    </p>
  `

  await transporter.sendMail({
    from: `"Despacho Jurídico · Lic. Sánchez" <${process.env.GMAIL_USER}>`,
    to: toCliente,
    subject: `Actualización de tu cita — Despacho Jurídico Sánchez`,
    html: emailBase('Tu cita ha sido reprogramada', contenido),
  })
}

// ── Notificar cambio de estado de cita ───────────────────────────
export const updateAppointmentStatus = async ({
  toCliente,
  nombreCliente,
  nombreAbogado,
  fecha,
  hora,
  motivo,
  estado,
  mensajeCancelacion = null,
}) => {
  const STATUS_CONFIG = {
    confirmada: {
      color: '#93BBFC',
      bg: 'rgba(147,187,252,0.08)',
      border: 'rgba(147,187,252,0.25)',
      label: 'CONFIRMADA',
      icon: '<span style="font-family:Arial,sans-serif;font-size:13px;color:#93BBFC;font-weight:700;">&#10003;</span>',
      titulo: 'Cita confirmada',
      intro: `Tu cita con el Lic. <strong style="color:rgba(255,255,255,0.75)">${nombreAbogado}</strong> ha sido <strong style="color:#93BBFC">confirmada</strong>. Te esperamos puntualmente.`,
    },
    cancelada: {
      color: '#FCA5A5',
      bg: 'rgba(252,165,165,0.08)',
      border: 'rgba(252,165,165,0.25)',
      label: 'CANCELADA',
      icon: '<span style="font-family:Arial,sans-serif;font-size:13px;color:#FCA5A5;font-weight:700;">&#10005;</span>',
      titulo: 'Cita cancelada',
      intro: `Lamentamos informarte que tu cita con el Lic. <strong style="color:rgba(255,255,255,0.75)">${nombreAbogado}</strong> ha sido <strong style="color:#FCA5A5">cancelada</strong>.`,
    },
  }

  const cfg = STATUS_CONFIG[estado] || STATUS_CONFIG.cancelada
  const fechaFmt = new Date(fecha + 'T' + hora).toLocaleDateString('es-MX', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })

  const mensajeExtra = mensajeCancelacion
    ? `<div class="info-box" style="border-color:rgba(252,165,165,0.2);margin-top:16px;">
        <div class="info-row">
          <span class="info-dot">&#9679;</span>
          <p class="info-text"><strong>Motivo de cancelaci&#243;n:</strong><br>${mensajeCancelacion}</p>
        </div>
       </div>`
    : ''

  const contenido = `
    <h2 class="greeting">Hola, ${nombreCliente}</h2>
    <p class="intro">${cfg.intro}</p>

    <div class="otp-box" style="text-align:left;background:${cfg.bg};border-color:${cfg.border};">
      <p class="otp-label" style="color:${cfg.color};">Estado actualizado</p>
      <div class="info-row" style="margin-bottom:10px;">
        <span class="info-dot">&#9679;</span>
        <p class="info-text"><strong>${fechaFmt}</strong></p>
      </div>
      <div class="info-row" style="margin-bottom:10px;">
        <span class="info-dot">&#9679;</span>
        <p class="info-text"><strong>${hora} hrs</strong></p>
      </div>
      <div class="info-row">
        <span class="info-dot">&#9679;</span>
        <p class="info-text"><strong>Motivo original:</strong> ${motivo}</p>
      </div>
    </div>

    ${mensajeExtra}

    <p style="font-size:13px;color:rgba(255,255,255,0.3);margin:16px 0 20px;line-height:1.6;">
      ${estado === 'confirmada'
        ? 'Si necesitas reprogramar o tienes dudas, cont&#225;ctanos con anticipaci&#243;n.'
        : 'Si deseas agendar una nueva cita, puedes hacerlo desde tu portal de cliente o contactar al despacho.'
      }
    </p>
  `

  await transporter.sendMail({
    from: `"Despacho Jurídico · Lic. Sánchez" <${process.env.GMAIL_USER}>`,
    to: toCliente,
    subject: `Tu cita fue ${cfg.label.toLowerCase()} — Despacho Jurídico`,
    html: emailBase(cfg.titulo, contenido),
  })
}

// ── Notificar nuevo comentario en un caso ─────────────────────────
export const notifyNewCaseComment = async ({
  recipients,
  autorNombre,
  folio,
  asunto,
  comentarioPrev,
  baseUrl,
  idCaso,
}) => {
  const preview = comentarioPrev.length > 180
    ? comentarioPrev.slice(0, 180) + '&#8230;'
    : comentarioPrev

  const link = `${baseUrl}/casos/${idCaso}`

  for (const { email, nombre } of recipients) {
    const contenido = `
      <h2 class="greeting">Hola, ${nombre}</h2>
      <p style="font-family:'Playfair Display',serif;font-size:16px;color:rgba(255,255,255,0.7);margin:0 0 18px;">Nuevo comentario en tu caso</p>
      <p class="intro">
        <strong style="color:rgba(255,255,255,0.75)">${autorNombre}</strong> ha agregado un comentario
        en el expediente <strong style="color:#C9A84C">${folio}</strong>.
      </p>

      <div class="otp-box" style="text-align:left;">
        <p class="otp-label">Detalles del caso</p>
        <div class="info-row" style="margin-bottom:10px;">
          <span class="info-dot">&#9679;</span>
          <p class="info-text"><strong>Folio:</strong> ${folio}</p>
        </div>
        <div class="info-row" style="margin-bottom:10px;">
          <span class="info-dot">&#9679;</span>
          <p class="info-text"><strong>Asunto:</strong> ${asunto}</p>
        </div>
        <div class="info-row">
          <span class="info-dot">&#9679;</span>
          <p class="info-text"><strong>Comentario:</strong><br>
            <em style="color:rgba(255,255,255,0.55);">"${preview}"</em>
          </p>
        </div>
      </div>

      <a href="${link}" class="verify-btn">Ver caso completo</a>

      <p style="font-size:13px;color:rgba(255,255,255,0.3);margin:0 0 20px;line-height:1.6;">
        Accede al sistema para leer el comentario completo y responder si es necesario.
      </p>
    `

    await transporter.sendMail({
      from: `"Despacho Jurídico · Lic. Sánchez" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: `Nuevo comentario en caso ${folio} — Despacho Jurídico`,
      html: emailBase('Nuevo comentario en caso', contenido),
    }).catch(err => console.error(`Error notificando comentario a ${email}:`, err.message))
  }
}

// ── Notificar al admin que un nuevo usuario verificó su cuenta ───────
export const notifyAdminNewUser = async ({ nombre, correo, baseUrl }) => {
  const adminEmail = process.env.ADMIN_EMAIL || process.env.GMAIL_USER
  if (!adminEmail) return

  const link = `${baseUrl}/panel/usuarios-pendientes`

  const contenido = `
    <h2 class="greeting">Nuevo usuario pendiente</h2>
    <p class="intro">
      Un usuario acaba de verificar su correo electr&#243;nico y est&#225; esperando aprobaci&#243;n
      para acceder al sistema del despacho.
    </p>

    <div class="otp-box" style="text-align:left;">
      <p class="otp-label">Datos del solicitante</p>
      <div class="info-row" style="margin-bottom:10px;">
        <span class="info-dot" style="color:rgba(201,168,76,0.7);">&#9679;</span>
        <p class="info-text"><strong>${nombre}</strong></p>
      </div>
      <div class="info-row">
        <span class="info-dot" style="color:rgba(201,168,76,0.7);">&#9679;</span>
        <p class="info-text" style="color:rgba(201,168,76,0.75);">${correo}</p>
      </div>
    </div>

    <a href="${link}" class="verify-btn">Gestionar usuarios pendientes</a>

    <p style="font-size:13px;color:rgba(255,255,255,0.3);margin:0 0 20px;line-height:1.6;">
      Ve al panel de administraci&#243;n &#8594; Usuarios Pendientes para aprobar o rechazar la cuenta.
    </p>
  `

  try {
    await transporter.sendMail({
      from: `"Despacho Jurídico · Lic. Sánchez" <${process.env.GMAIL_USER}>`,
      to: adminEmail,
      subject: `Nuevo usuario pendiente de aprobación: ${nombre}`,
      html: emailBase('Nuevo usuario pendiente', contenido),
    })
  } catch (err) {
    console.error('Error notificando admin de nuevo usuario:', err.message)
  }
}

// ── Notificar al Lic. Sánchez de nueva solicitud desde la Landing ────
export const notifyAdminNuevaAsesoria = async ({ nombre, correo, telefono, mensaje }) => {
  const adminEmail = process.env.ADMIN_EMAIL || process.env.GMAIL_USER
  if (!adminEmail) return

  const contenido = `
    <h2 class="greeting">Nueva solicitud de asesor&#237;a</h2>
    <p class="intro">
      Alguien ha completado el formulario de contacto en la <strong style="color:#C9A84C">Landing Page</strong>
      y solicita una asesor&#237;a gratuita. Revisa los datos a continuaci&#243;n y cont&#225;ctale a la brevedad.
    </p>

    <div class="otp-box" style="text-align:left;">
      <p class="otp-label">Datos del solicitante</p>

      <div class="info-row" style="margin-bottom:10px;">
        <span class="info-dot" style="color:rgba(201,168,76,0.7);">&#9679;</span>
        <p class="info-text"><strong>Nombre:</strong> ${nombre}</p>
      </div>

      <div class="info-row" style="margin-bottom:10px;">
        <span class="info-dot" style="color:rgba(201,168,76,0.7);">&#9679;</span>
        <p class="info-text">
          <strong>Correo:</strong>
          <a href="mailto:${correo}" style="color:#C9A84C;text-decoration:none;">${correo}</a>
        </p>
      </div>

      <div class="info-row" style="margin-bottom:10px;">
        <span class="info-dot" style="color:rgba(201,168,76,0.7);">&#9679;</span>
        <p class="info-text">
          <strong>Tel&#233;fono:</strong>
          ${telefono
            ? `<a href="tel:${telefono}" style="color:#C9A84C;text-decoration:none;">${telefono}</a>`
            : '<span style="color:rgba(255,255,255,0.3)">No proporcionado</span>'
          }
        </p>
      </div>

      <div class="info-row">
        <span class="info-dot" style="color:rgba(201,168,76,0.7);">&#9679;</span>
        <p class="info-text">
          <strong>Mensaje / Asunto:</strong><br>
          <em style="color:rgba(255,255,255,0.55);">"${mensaje}"</em>
        </p>
      </div>
    </div>

    <p style="font-size:13px;color:rgba(255,255,255,0.3);margin:0 0 20px;line-height:1.6;">
      La solicitud ya fue registrada como cita <strong style="color:rgba(201,168,76,0.65)">pendiente</strong>
      en el sistema. Puedes gestionarla desde el panel &#8594; <strong style="color:rgba(255,255,255,0.45)">Solicitudes de la Landing</strong>.
    </p>
  `

  await transporter.sendMail({
    from: `"Despacho Jurídico · Lic. Sánchez" <${process.env.GMAIL_USER}>`,
    to: adminEmail,
    subject: `Nueva Solicitud de Asesoría: ${nombre}`,
    html: emailBase('Nueva solicitud de asesoría', contenido),
  })
}

// ── Enviar correo de verificación de cuenta (registro) ─────────────
export const sendVerificationEmail = async ({ to, nombre, token, baseUrl }) => {
  const link = `${baseUrl}/verificar-email?token=${token}`

  const contenido = `
    <h2 class="greeting">Bienvenido, ${nombre}</h2>
    <p class="intro">
      Tu cuenta en el sistema del despacho ha sido creada exitosamente.
      Confirma tu direcci&#243;n de correo haciendo clic en el bot&#243;n de abajo para activarla.
    </p>

    <table border="0" cellpadding="0" cellspacing="0" width="60" style="margin:0 auto 24px;">
      <tr>
        <td width="60" height="60" align="center" valign="middle"
            style="border-radius:30px;background:rgba(201,168,76,0.07);border:1px solid rgba(201,168,76,0.22);font-family:Arial,sans-serif;font-size:26px;font-weight:700;color:#C9A84C;">
          &#10003;
        </td>
      </tr>
    </table>

    <a href="${link}" class="verify-btn">Verificar mi correo electr&#243;nico</a>

    <div class="otp-box" style="margin-bottom:20px;">
      <p class="otp-label">O copia este enlace en tu navegador</p>
      <p style="font-size:11px;color:rgba(201,168,76,0.7);word-break:break-all;margin:0;line-height:1.6;">${link}</p>
    </div>

    <p style="font-size:13px;color:rgba(255,255,255,0.3);margin:0 0 20px;line-height:1.6;">
      Tras verificar tu correo, el despacho revisar&#225; tu solicitud y te asignar&#225; acceso al sistema.
    </p>
  `

  await transporter.sendMail({
    from: `"Despacho Jurídico · Lic. Sánchez" <${process.env.GMAIL_USER}>`,
    to,
    subject: 'Confirma tu cuenta — Despacho Jurídico',
    html: emailBase('Verifica tu cuenta', contenido),
  })
}

// ── Recordatorio de cita (disparado por el cron worker) ──────────
// Usa { showSecurityNote: false } — la nota "Si no solicitaste..." no aplica
// a un recordatorio de una cita que el propio cliente ya confirmó.
export const sendReminderCita = async ({
  to,
  nombreCliente,
  nombreAbogado,
  fecha,
  hora,
  motivo,
  baseUrl,
}) => {
  const { t } = await import('./emailTemplate.js')
  const fechaFmt = t.formatFecha(fecha, hora)

  const contenido = [
    t.greeting(`Recordatorio de cita, ${nombreCliente}`),
    t.intro(
      `Te recordamos que ma&#241;ana tienes una cita con el Lic. ` +
      `<strong style="color:rgba(255,255,255,0.75)">${nombreAbogado}</strong>. ` +
      `Te esperamos puntualmente.`
    ),
    t.infoBox('Detalles de tu cita', [
      t.row('Fecha', `<strong>${fechaFmt}</strong>`),
      t.row('Hora', `<strong>${hora} hrs</strong>`),
      t.rowLast('Motivo', motivo),
    ].join('')),
    baseUrl ? t.button('Ver mis citas', `${baseUrl}/mis-citas`) : '',
    t.note('Si necesitas reprogramar, cont&#225;ctanos con la mayor anticipaci&#243;n posible.'),
  ].join('')

  await transporter.sendMail({
    from: `"Despacho Jurídico · Lic. Sánchez" <${process.env.GMAIL_USER}>`,
    to,
    subject: `Recordatorio: tu cita es mañana — Despacho Jurídico`,
    html: emailBase('Recordatorio de cita', contenido, { showSecurityNote: false }),
  })
}

// ── Notificar caso vencido al abogado (disparado por el cron worker) ─
export const notifyVencimientoCaso = async ({
  to,
  nombreAbogado,
  folio,
  asunto,
  tipo,
  estado,
  fechaLimite,
  baseUrl,
  subjectOverride,
}) => {
  const { t } = await import('./emailTemplate.js')
  const fechaFmt = t.formatFecha(fechaLimite)

  const STATUS_COLOR = {
    activo:   '#93BBFC',
    urgente:  '#FCA5A5',
    pendiente:'#FCD34D',
  }
  const accentColor = STATUS_COLOR[estado] || '#C9A84C'

  const contenido = [
    t.greeting(`Caso vencido — ${folio}`),
    t.intro(
      `El expediente <strong style="color:#C9A84C">${folio}</strong> ha superado su fecha l&#237;mite ` +
      `y requiere atenci&#243;n inmediata.`
    ),
    t.infoBox('Datos del expediente', [
      t.row('Folio', `<strong style="color:#C9A84C">${folio}</strong>`),
      t.row('Asunto', asunto),
      t.row('Tipo', tipo),
      t.row('Estado', t.badge(estado, accentColor)),
      t.rowLast('Fecha l&#237;mite', `<strong style="color:#FCA5A5">${fechaFmt}</strong>`),
    ].join(''), { accentColor, bg: 'rgba(252,165,165,0.06)', border: 'rgba(252,165,165,0.2)' }),
    baseUrl ? t.button('Ver caso', `${baseUrl}/casos`, {
      bg: 'linear-gradient(135deg,#7B1E1E 0%,#5a1515 100%)',
      color: '#fff',
      shadow: '0 6px 24px rgba(252,165,165,0.2)',
    }) : '',
    t.note('Revisa el caso y actualiza su estado desde el panel de administraci&#243;n.'),
  ].join('')

  await transporter.sendMail({
    from: `"Despacho Jurídico · Lic. Sánchez" <${process.env.GMAIL_USER}>`,
    to,
    subject: subjectOverride ?? `Caso vencido: ${folio} — ${asunto}`,
    html: emailBase('Caso vencido', contenido, { showSecurityNote: false }),
  })
}

// ── Notificar rechazo formal de solicitud de asesoría (Landing) ───
export const notifyAsesoriaRechazada = async ({ to, nombre, motivo }) => {
  const contenido = `
    <h2 class="greeting">Estimado/a ${nombre}</h2>
    <p class="intro">
      Agradecemos su inter&#233;s en los servicios del
      <strong style="color:#C9A84C">Despacho Jur&#237;dico S&#225;nchez</strong>.
      Tras revisar su solicitud, lamentamos informarle que en este momento
      no nos es posible atender su caso.
    </p>

    <div class="otp-box" style="text-align:left;background:rgba(252,165,165,0.05);border-color:rgba(252,165,165,0.18);">
      <p class="otp-label" style="color:rgba(252,165,165,0.80);">Solicitud revisada</p>
      <div class="info-row">
        <span class="info-dot">&#9679;</span>
        <p class="info-text"><strong>Asunto de consulta:</strong> ${motivo}</p>
      </div>
    </div>

    <p style="font-size:13px;color:rgba(255,255,255,0.3);margin:16px 0 20px;line-height:1.6;">
      Si su situaci&#243;n requiere atenci&#243;n jur&#237;dica urgente, le recomendamos consultar
      a otro profesional del derecho especializado en su materia.
      Quedamos a su disposici&#243;n para cualquier consulta futura.
    </p>
  `

  await transporter.sendMail({
    from: `"Despacho Jurídico · Lic. Sánchez" <${process.env.GMAIL_USER}>`,
    to,
    subject: `Respuesta a su solicitud de asesoría — Despacho Jurídico Sánchez`,
    html: emailBase('Respuesta a su solicitud', contenido),
  }).catch(err => console.error(`Error enviando rechazo a ${to}:`, err.message))
}

// ── Notificar nuevo movimiento procesal al cliente ─────────────────
const TIPO_MOVIMIENTO_LABEL = {
  auto:      'Auto judicial',
  sentencia: 'Sentencia',
  audiencia: 'Audiencia',
  oficio:    'Oficio',
  otro:      'Notificación',
}

export const notifyMovimientoProcesal = async ({
  toCliente,
  nombreCliente,
  folio,
  asunto,
  tipo,
  descripcion,
  fechaMovimiento,
}) => {
  const tipoLabel = TIPO_MOVIMIENTO_LABEL[tipo] || 'Notificación'
  const fechaFmt  = new Date(fechaMovimiento + 'T12:00:00').toLocaleDateString('es-MX', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })

  const contenido = `
    <h2 class="greeting">Hola, ${nombreCliente}</h2>
    <p class="intro">
      Hay una actualizaci&#243;n procesal en tu expediente
      <strong style="color:#C9A84C">${folio}</strong>.
      El despacho ha registrado un movimiento en tu caso.
    </p>

    <div class="otp-box" style="text-align:left;background:rgba(201,168,76,0.05);border-color:rgba(201,168,76,0.22);">
      <p class="otp-label">Detalle del movimiento</p>
      <div class="info-row" style="margin-bottom:10px;">
        <span class="info-dot">&#9679;</span>
        <p class="info-text"><strong>Caso:</strong> ${folio} &#8212; ${asunto}</p>
      </div>
      <div class="info-row" style="margin-bottom:10px;">
        <span class="info-dot">&#9679;</span>
        <p class="info-text"><strong>Tipo:</strong> ${tipoLabel}</p>
      </div>
      <div class="info-row" style="margin-bottom:10px;">
        <span class="info-dot">&#9679;</span>
        <p class="info-text"><strong>Fecha:</strong> ${fechaFmt}</p>
      </div>
      <div class="info-row">
        <span class="info-dot">&#9679;</span>
        <p class="info-text"><strong>Descripci&#243;n:</strong><br>
          <em style="color:rgba(255,255,255,0.55);">"${descripcion}"</em>
        </p>
      </div>
    </div>

    <p style="font-size:13px;color:rgba(255,255,255,0.3);margin:0 0 20px;line-height:1.6;">
      Ingresa al portal para consultar el historial completo de tu expediente.
      Si tienes alguna duda, cont&#225;ctanos directamente al despacho.
    </p>
  `

  await transporter.sendMail({
    from: `"Despacho Jurídico · Lic. Sánchez" <${process.env.GMAIL_USER}>`,
    to: toCliente,
    subject: `Actualización procesal en tu caso ${folio} — ${tipoLabel}`,
    html: emailBase(`Nuevo ${tipoLabel}`, contenido, { showSecurityNote: false }),
  }).catch(err => console.error(`Error notificando movimiento a ${toCliente}:`, err.message))
}

// ── Reporte diario IA por caso ────────────────────────────────────
export const notifyReporteIACaso = async ({
  to,
  nombreAbogado,
  folio,
  asunto,
  tipo,
  reporte,   // { riesgo, resumen, accionesRecomendadas, alertas, proximaAccion }
  baseUrl,
}) => {
  const { t } = await import('./emailTemplate.js')

  const RIESGO_COLOR = {
    alto:  '#FCA5A5',
    medio: '#FCD34D',
    bajo:  '#86EFAC',
  }
  const riesgoColor = RIESGO_COLOR[reporte.riesgo] || '#C9A84C'
  const riesgoLabel = reporte.riesgo === 'alto' ? 'Riesgo ALTO'
                    : reporte.riesgo === 'medio' ? 'Riesgo MEDIO'
                    : 'Riesgo BAJO'

  const alertasHtml = reporte.alertas?.length
    ? `<div style="margin:16px 0;padding:12px 16px;background:rgba(252,165,165,0.06);border:1px solid rgba(252,165,165,0.25);border-radius:8px;">
        <p style="font-size:11px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;color:#FCA5A5;margin:0 0 8px;">&#9888; Alertas</p>
        ${reporte.alertas.map(a => `<p style="font-size:13px;color:rgba(255,255,255,0.7);margin:0 0 4px;">&#9679; ${a}</p>`).join('')}
      </div>`
    : ''

  const accionesHtml = reporte.accionesRecomendadas?.length
    ? reporte.accionesRecomendadas.map(a => `<p style="font-size:13px;color:rgba(255,255,255,0.7);margin:0 0 6px;">&#9679; ${a}</p>`).join('')
    : ''

  const contenido = [
    t.greeting(`Reporte IA — ${folio}`),
    t.intro(`El agente de monitoreo ha generado el an&#225;lisis diario del expediente <strong style="color:#C9A84C">${folio}</strong>.`),
    t.infoBox('Datos del expediente', [
      t.row('Folio', `<strong style="color:#C9A84C">${folio}</strong>`),
      t.row('Asunto', asunto),
      t.rowLast('Tipo', tipo),
    ].join(''), {}),
    `<div style="margin:20px 0;padding:14px 18px;background:rgba(8,20,48,0.6);border:1px solid rgba(201,168,76,0.18);border-radius:10px;">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;">
        <span style="padding:3px 10px;border-radius:4px;background:${riesgoColor}18;border:1px solid ${riesgoColor}40;font-size:11px;font-weight:700;color:${riesgoColor};text-transform:uppercase;letter-spacing:0.5px;">${riesgoLabel}</span>
      </div>
      <p style="font-size:13px;color:rgba(255,255,255,0.75);line-height:1.6;margin:0 0 16px;">${reporte.resumen}</p>
      ${alertasHtml}
      <p style="font-size:11px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;color:rgba(201,168,76,0.7);margin:14px 0 8px;">Pr&#243;xima acci&#243;n recomendada</p>
      <p style="font-size:13px;font-weight:600;color:rgba(255,255,255,0.9);margin:0 0 16px;">${reporte.proximaAccion}</p>
      <p style="font-size:11px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;color:rgba(201,168,76,0.7);margin:0 0 8px;">Acciones recomendadas</p>
      ${accionesHtml}
    </div>`,
    baseUrl ? t.button('Ver expediente', `${baseUrl}/casos`, {}) : '',
    t.note('Este an&#225;lisis fue generado autom&#225;ticamente por el agente IA del despacho. Verif&#237;calo con criterio profesional.'),
  ].join('')

  await transporter.sendMail({
    from: `"Agente IA · Despacho Sánchez" <${process.env.GMAIL_USER}>`,
    to,
    subject: `🤖 Reporte IA: ${folio} — ${riesgoLabel}`,
    html: emailBase('Reporte IA del expediente', contenido, { showSecurityNote: false }),
  })
}

// ── Bienvenida al portal (cliente sin cuenta) ─────────────────────
export const sendBienvenidaPortal = async ({ to, nombre, email, password, baseUrl }) => {
  const contenido = `
    <h2 style="font-family:'Playfair Display',Georgia,serif;font-size:22px;font-weight:700;color:rgba(255,255,255,0.95);margin:0 0 16px;">
      Bienvenido/a al portal, ${nombre}
    </h2>
    <p style="font-size:14px;color:rgba(255,255,255,0.65);line-height:1.7;margin:0 0 24px;">
      El despacho ha creado una cuenta para que puedas acceder a tu expediente y seguir el estado de tu caso en l&#237;nea.
    </p>

    <div style="background:rgba(8,20,48,0.6);border:1px solid rgba(201,168,76,0.22);border-radius:12px;padding:20px 24px;margin:0 0 24px;">
      <p style="font-size:11px;font-weight:700;letter-spacing:1.4px;text-transform:uppercase;color:rgba(201,168,76,0.70);margin:0 0 14px;">Tus credenciales de acceso</p>
      <div style="display:flex;align-items:baseline;gap:8px;margin-bottom:10px;">
        <span style="font-size:12px;color:rgba(255,255,255,0.40);min-width:80px;">Correo</span>
        <span style="font-size:14px;font-weight:600;color:rgba(255,255,255,0.88);">${email}</span>
      </div>
      <div style="display:flex;align-items:baseline;gap:8px;">
        <span style="font-size:12px;color:rgba(255,255,255,0.40);min-width:80px;">Contrase&#241;a</span>
        <span style="font-size:16px;font-weight:700;color:#E8C97A;letter-spacing:2px;">${password}</span>
      </div>
    </div>

    <p style="font-size:13px;color:rgba(255,255,255,0.40);line-height:1.6;margin:0 0 24px;">
      Por seguridad, te recomendamos cambiar tu contrase&#241;a la primera vez que inicies sesi&#243;n desde el men&#250; de tu perfil.
    </p>

    <div style="text-align:center;margin:0 0 8px;">
      <a href="${baseUrl}/login"
         style="display:inline-block;padding:13px 32px;border-radius:8px;
                background:linear-gradient(135deg,#C9A84C,#9A7A32);
                color:#020818;font-family:'Inter',Arial,sans-serif;
                font-size:14px;font-weight:700;text-decoration:none;letter-spacing:0.3px;">
        Acceder al portal
      </a>
    </div>
  `

  await transporter.sendMail({
    from: `"Despacho Jurídico · Lic. Sánchez" <${process.env.GMAIL_USER}>`,
    to,
    subject: `Acceso al portal — Despacho Jurídico Sánchez`,
    html: emailBase('Bienvenido al portal', contenido, { showSecurityNote: false }),
  })
}

// ── Notificar al cliente que se abri&#243; un expediente en su nombre ────
export const notifyNuevoCasoAsignado = async ({
  toCliente,
  nombreCliente,
  folio,
  asunto,
  tipo,
  fechaApertura,
  baseUrl,
  idCaso,
}) => {
  const link = `${baseUrl}/portal/mis-casos`

  const contenido = `
    <h2 class="greeting">Hola, ${nombreCliente}</h2>
    <p class="intro">
      Te informamos que el Lic. S&#225;nchez ha abierto un expediente en tu representaci&#243;n.
      A continuaci&#243;n los detalles de tu caso.
    </p>

    <div class="otp-box" style="text-align:left;">
      <p class="otp-label">Datos del expediente</p>
      <div class="info-row" style="margin-bottom:10px;">
        <span class="info-dot">&#9679;</span>
        <p class="info-text"><strong>Folio:</strong> <span style="color:#C9A84C;">${folio}</span></p>
      </div>
      <div class="info-row" style="margin-bottom:10px;">
        <span class="info-dot">&#9679;</span>
        <p class="info-text"><strong>Asunto:</strong> ${asunto}</p>
      </div>
      <div class="info-row" style="margin-bottom:10px;">
        <span class="info-dot">&#9679;</span>
        <p class="info-text"><strong>Tipo:</strong> ${tipo}</p>
      </div>
      <div class="info-row">
        <span class="info-dot">&#9679;</span>
        <p class="info-text"><strong>Fecha apertura:</strong> ${fechaApertura}</p>
      </div>
    </div>

    <a href="${link}" class="verify-btn">Ver mis casos</a>

    <p style="font-size:13px;color:rgba(255,255,255,0.3);margin:0 0 20px;line-height:1.6;">
      Puedes consultar el seguimiento de tu caso en cualquier momento desde tu portal de clientes.
    </p>
  `

  await transporter.sendMail({
    from: `"Despacho Jurídico · Lic. Sánchez" <${process.env.GMAIL_USER}>`,
    to: toCliente,
    subject: `Tu expediente ha sido abierto — Despacho Jur&#237;dico`,
    html: emailBase('Tu expediente ha sido abierto', contenido, { showSecurityNote: false }),
  }).catch(err => console.error(`Error notificando caso asignado a ${toCliente}:`, err.message))
}

// ── Notificar al cliente que se adjunt&#243; un documento a su expediente ─
export const notifyDocumentoAdjunto = async ({
  toCliente,
  nombreCliente,
  nombreArchivo,
  categoria,
  folio,
  asunto,
  baseUrl,
  idCaso,
}) => {
  const link = `${baseUrl}/portal/mis-casos`

  const contenido = `
    <h2 class="greeting">Hola, ${nombreCliente}</h2>
    <p class="intro">
      Se ha adjuntado un nuevo documento a tu expediente.
      Puedes consultarlo desde tu portal de clientes.
    </p>

    <div class="otp-box" style="text-align:left;">
      <p class="otp-label">Detalles del documento</p>
      <div class="info-row" style="margin-bottom:10px;">
        <span class="info-dot">&#9679;</span>
        <p class="info-text"><strong>Archivo:</strong> ${nombreArchivo}</p>
      </div>
      <div class="info-row" style="margin-bottom:10px;">
        <span class="info-dot">&#9679;</span>
        <p class="info-text"><strong>Categor&#237;a:</strong> ${categoria}</p>
      </div>
      <div class="info-row">
        <span class="info-dot">&#9679;</span>
        <p class="info-text"><strong>Caso:</strong> <span style="color:#C9A84C;">${folio}</span> &#8212; ${asunto}</p>
      </div>
    </div>

    <a href="${link}" class="verify-btn">Ver mis casos</a>

    <p style="font-size:13px;color:rgba(255,255,255,0.3);margin:0 0 20px;line-height:1.6;">
      Ingresa al portal para descargar o consultar el documento adjunto en cualquier momento.
    </p>
  `

  await transporter.sendMail({
    from: `"Despacho Jurídico · Lic. Sánchez" <${process.env.GMAIL_USER}>`,
    to: toCliente,
    subject: `Nuevo documento en tu expediente — ${folio}`,
    html: emailBase('Nuevo documento en tu expediente', contenido, { showSecurityNote: false }),
  }).catch(err => console.error(`Error notificando documento a ${toCliente}:`, err.message))
}
