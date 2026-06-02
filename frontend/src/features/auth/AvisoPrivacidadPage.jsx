import { useNavigate } from 'react-router-dom'
import { ShieldCheck, ArrowLeft } from 'lucide-react'
import logoSC from '../../assets/logos/logo-sc.png'

// F6.1 — Página pública del Aviso de Privacidad LFPDPPP.
// El contenido replica AVISO-PRIVACIDAD.md en formato leíble.
export default function AvisoPrivacidadPage() {
  const navigate = useNavigate()
  const version  = '1.0'
  const fecha    = '2 de junio de 2026'

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet"/>
      <style>{`
        body { background:#020818; }
        .ap-h2 { font-family:'Playfair Display',serif; color:#E8C97A; font-size:20px; margin:32px 0 8px; }
        .ap-h3 { font-family:'Inter',sans-serif; font-weight:700; font-size:13px; letter-spacing:1.8px; text-transform:uppercase; color:rgba(201,168,76,0.7); margin:20px 0 6px; }
        .ap-p  { font-family:'Inter',sans-serif; color:rgba(255,255,255,0.78); font-size:14px; line-height:1.75; margin:0 0 12px; }
        .ap-li { font-family:'Inter',sans-serif; color:rgba(255,255,255,0.78); font-size:14px; line-height:1.75; margin:4px 0; }
        .ap-table { width:100%; border-collapse:collapse; margin:12px 0 18px; font-family:'Inter',sans-serif; font-size:13px; }
        .ap-table th, .ap-table td { text-align:left; padding:10px 12px; border-bottom:1px solid rgba(201,168,76,0.15); color:rgba(255,255,255,0.78); }
        .ap-table th { color:rgba(201,168,76,0.85); font-weight:600; letter-spacing:0.5px; }
        a.ap-link { color:#E8C97A; text-decoration:none; border-bottom:1px solid rgba(232,201,122,0.35); }
      `}</style>

      <div style={{ minHeight:'100vh', background:'linear-gradient(180deg,#020818 0%,#040c20 100%)', padding:'40px 20px' }}>
        <div style={{ maxWidth:'820px', margin:'0 auto' }}>

          {/* Botón volver */}
          <button onClick={() => navigate(-1)} style={{
            display:'inline-flex', alignItems:'center', gap:'8px',
            background:'transparent', border:'1px solid rgba(201,168,76,0.22)',
            color:'rgba(201,168,76,0.85)', padding:'8px 14px', borderRadius:'10px',
            cursor:'pointer', fontFamily:"'Inter',sans-serif", fontSize:'13px',
            marginBottom:'24px',
          }}>
            <ArrowLeft size={14}/> Volver
          </button>

          {/* Header */}
          <div style={{
            background:'rgba(8,20,48,0.75)', borderRadius:'20px',
            border:'1px solid rgba(201,168,76,0.22)', padding:'34px 38px',
            boxShadow:'0 20px 60px rgba(0,0,0,0.5)',
          }}>
            <div style={{ display:'flex', alignItems:'center', gap:'16px', marginBottom:'18px' }}>
              <img src={logoSC} alt="SC" style={{ width:56, height:56, objectFit:'contain' }}/>
              <div>
                <h1 style={{ fontFamily:"'Playfair Display',serif", color:'rgba(255,255,255,0.97)', fontSize:'26px', margin:0 }}>
                  Aviso de Privacidad
                </h1>
                <p style={{ fontFamily:"'Inter',sans-serif", color:'rgba(255,255,255,0.5)', fontSize:'13px', margin:'4px 0 0' }}>
                  Despacho Sánchez Cerino · Versión {version} · {fecha}
                </p>
              </div>
            </div>

            <div style={{
              display:'flex', alignItems:'center', gap:'10px',
              padding:'10px 14px', background:'rgba(201,168,76,0.08)',
              border:'1px solid rgba(201,168,76,0.18)', borderRadius:'10px',
              marginBottom:'12px',
            }}>
              <ShieldCheck size={18} style={{ color:'#E8C97A' }}/>
              <span style={{ fontFamily:"'Inter',sans-serif", color:'rgba(255,255,255,0.85)', fontSize:'13px' }}>
                Tratamiento conforme a la <b>LFPDPPP</b> y su Reglamento.
              </span>
            </div>

            <h2 className="ap-h2">1. Identidad y domicilio del responsable</h2>
            <p className="ap-p">
              <b>Despacho Jurídico Lic. Horacio Sánchez Cerino</b> ("el Despacho"), con domicilio en Centla, Tabasco,
              es el <b>Responsable</b> del tratamiento de tus datos personales. Contacto del Departamento de Datos
              Personales: <a className="ap-link" href="mailto:abogadoadmin89@gmail.com">abogadoadmin89@gmail.com</a>.
            </p>

            <h2 className="ap-h2">2. Datos personales que recabamos</h2>
            <ul>
              <li className="ap-li"><b>Identificación:</b> nombre, RFC, dirección, teléfono, correo.</li>
              <li className="ap-li"><b>Expediente:</b> asunto, juzgado, contraparte, movimientos, documentos.</li>
              <li className="ap-li"><b>Técnicos:</b> IP, fecha/hora de acceso, navegador (seguridad y auditoría).</li>
            </ul>
            <p className="ap-p">No recabamos datos personales sensibles salvo los estrictamente necesarios para tu defensa jurídica.</p>

            <h2 className="ap-h2">3. Finalidades</h2>
            <h3 className="ap-h3">Primarias</h3>
            <ul>
              <li className="ap-li">Atender tu asesoría, juicio o trámite.</li>
              <li className="ap-li">Gestionar expediente, citas, documentos y movimientos procesales.</li>
              <li className="ap-li">Generar reportes y análisis con asistencia de inteligencia artificial.</li>
              <li className="ap-li">Cumplir obligaciones fiscales (retención SAT de expedientes cerrados).</li>
              <li className="ap-li">Auditar accesos al sistema por motivos de seguridad.</li>
            </ul>
            <h3 className="ap-h3">Secundarias (requieren tu consentimiento)</h3>
            <ul>
              <li className="ap-li">Comunicaciones sobre nuevos servicios del despacho.</li>
            </ul>

            <h2 className="ap-h2">4. Transferencias de datos</h2>
            <p className="ap-p">Operadores que procesan tus datos bajo nuestras instrucciones (LFPDPPP art. 36):</p>
            <table className="ap-table">
              <thead><tr><th>Proveedor</th><th>Servicio</th><th>País</th></tr></thead>
              <tbody>
                <tr><td>Railway</td><td>Hosting de base de datos</td><td>EE.UU.</td></tr>
                <tr><td>Cloudinary</td><td>Almacenamiento de PDFs cifrados</td><td>EE.UU. / Global</td></tr>
                <tr><td>SendGrid</td><td>Notificaciones por email</td><td>EE.UU.</td></tr>
                <tr><td>Groq</td><td>Análisis con IA</td><td>EE.UU.</td></tr>
                <tr><td>Cloudflare</td><td>Protección anti-bots</td><td>Global</td></tr>
              </tbody>
            </table>

            <h2 className="ap-h2">5. Medidas de seguridad</h2>
            <ul>
              <li className="ap-li">Cifrado AES-256-GCM en reposo de campos sensibles del expediente.</li>
              <li className="ap-li">Cifrado TLS en tránsito.</li>
              <li className="ap-li">2FA por correo en cada inicio de sesión.</li>
              <li className="ap-li">Control de acceso por roles (abogado, secretario, cliente).</li>
              <li className="ap-li">Auditoría inmutable de accesos, descargas y cambios.</li>
              <li className="ap-li">Alertas automáticas ante intentos anómalos.</li>
            </ul>

            <h2 className="ap-h2">6. Derechos ARCO</h2>
            <p className="ap-p">Tienes derecho a <b>Acceder</b>, <b>Rectificar</b>, <b>Cancelar</b> u <b>Oponerte</b>:</p>
            <ul>
              <li className="ap-li"><b>Acceso:</b> portal cliente → "Mis datos" → "Exportar".</li>
              <li className="ap-li"><b>Rectificación:</b> edita tus datos desde tu perfil.</li>
              <li className="ap-li"><b>Cancelación / Oposición:</b> solicítala desde el portal o por correo a <a className="ap-link" href="mailto:abogadoadmin89@gmail.com">abogadoadmin89@gmail.com</a>.</li>
            </ul>
            <p className="ap-p"><b>Plazo de respuesta:</b> 20 días hábiles (art. 32 LFPDPPP). La cancelación reemplaza tu PII por marcadores anónimos; los registros derivados se conservan 5 años por requisito fiscal.</p>

            <h2 className="ap-h2">7. Cookies / seguimiento</h2>
            <p className="ap-p">El sistema solo guarda un token JWT en <code>localStorage</code> para mantener tu sesión. No hay cookies publicitarias ni compartición con terceros con fines de marketing.</p>

            <h2 className="ap-h2">8. Cambios al Aviso</h2>
            <p className="ap-p">Cualquier cambio relevante se notificará en el portal. Si afecta finalidades primarias, se pedirá nueva aceptación expresa.</p>

            <h2 className="ap-h2">9. Aceptación</h2>
            <p className="ap-p">Al marcar la casilla "Acepto el Aviso de Privacidad" durante el registro o el formulario de asesoría manifiestas tu consentimiento expreso al tratamiento descrito.</p>
          </div>

          <p style={{ textAlign:'center', marginTop:'24px', fontFamily:"'Inter',sans-serif", color:'rgba(255,255,255,0.3)', fontSize:'12px' }}>
            Cédula Prof. 2762890 · Sistema de Gestión Jurídica
          </p>
        </div>
      </div>
    </>
  )
}
