import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getCasoById, createCaso, updateCaso } from './casesService'
import { getClientes } from '../clients/clientsService'
import { Save, X, FolderOpen, Scale, User, Calendar, MapPin, FileText, AlertCircle } from 'lucide-react'

const TIPOS = [
  'Penal','Civil','Amparo','Sucesorio',
  'Contratos','Trámite de escrituras',
  'Inscripción de posesión','Asesoría legal',
]

const ESTADOS = [
  { value:'activo',      label:'Activo'      },
  { value:'urgente',     label:'Urgente'     },
  { value:'pendiente',   label:'Pendiente'   },
  { value:'en_revision', label:'En revisión' },
  { value:'cerrado',     label:'Cerrado'     },
]

const FORM_INICIAL = {
  asunto:'', tipo:'', estado:'activo', descripcion:'',
  id_cliente:'', juzgado:'', exp_externo:'',
  contraparte:'', fecha_apertura:'', fecha_limite:'', notas:'',
}

export default function CaseForm() {
  const { id }   = useParams()
  const navigate = useNavigate()
  const isEdit   = Boolean(id)

  const [form,     setForm]     = useState(FORM_INICIAL)
  const [clientes, setClientes] = useState([])
  const [loading,  setLoading]  = useState(false)
  const [saving,   setSaving]   = useState(false)
  const [error,    setError]    = useState('')

  useEffect(() => {
    getClientes({ limit: 100 })
      .then(res => setClientes(res.data.clientes))
      .catch(() => {})

    if (isEdit) {
      setLoading(true)
      getCasoById(id)
        .then(res => {
          const c = res.data.caso
          setForm({
            asunto:         c.asunto                                        || '',
            tipo:           c.tipo                                          || '',
            estado:         c.estado                                        || 'activo',
            descripcion:    c.descripcion                                   || '',
            id_cliente:     c.id_cliente     ? String(c.id_cliente)         : '',
            juzgado:        c.juzgado                                       || '',
            exp_externo:    c.exp_externo                                   || '',
            contraparte:    c.contraparte                                   || '',
            fecha_apertura: c.fecha_apertura ? c.fecha_apertura.slice(0,10) : '',
            fecha_limite:   c.fecha_limite   ? c.fecha_limite.slice(0,10)   : '',
            notas:          c.notas                                         || '',
          })
        })
        .catch(() => setError('Error al cargar el caso'))
        .finally(() => setLoading(false))
    }
  }, [id])

  const handleChange = e => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))

  const handleSubmit = async e => {
    e.preventDefault(); setError(''); setSaving(true)
    try {
      if (isEdit) { await updateCaso(id, form) }
      else        { await createCaso(form) }
      navigate('/panel/casos')
    } catch (err) {
      setError(err.response?.data?.message ?? 'Error al guardar el caso')
    } finally { setSaving(false) }
  }

  if (loading) return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet"/>
      <div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',minHeight:'100vh',background:'linear-gradient(160deg,#020818,#040d20)'}}>
        <div style={{width:'32px',height:'32px',borderRadius:'50%',border:'2px solid rgba(201,168,76,0.3)',borderTopColor:'#C9A84C',animation:'spin 0.8s linear infinite'}}/>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </>
  )

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet"/>
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        .cf-fade { animation: fadeUp 0.4s ease both; }

        .cf-input {
          width:100%; padding:11px 14px; border-radius:10px;
          border:1px solid rgba(255,255,255,0.1);
          background:rgba(255,255,255,0.05);
          color:rgba(255,255,255,0.9);
          font-family:'Inter',sans-serif; font-size:13px;
          outline:none; box-sizing:border-box;
          transition:all 0.15s ease; colorScheme:dark;
        }
        .cf-input::placeholder { color:rgba(255,255,255,0.2); }
        .cf-input:hover { border-color:rgba(255,255,255,0.18); background:rgba(255,255,255,0.07); }
        .cf-input:focus { border-color:rgba(201,168,76,0.5); background:rgba(201,168,76,0.05); box-shadow:0 0 0 3px rgba(201,168,76,0.1); }

        .cf-select {
          width:100%; padding:11px 14px; border-radius:10px;
          border:1px solid rgba(255,255,255,0.1);
          background:rgba(255,255,255,0.05);
          color:rgba(255,255,255,0.85);
          font-family:'Inter',sans-serif; font-size:13px;
          outline:none; cursor:pointer; box-sizing:border-box;
          transition:all 0.15s ease; colorScheme:dark;
          appearance:none; -webkit-appearance:none;
          background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='rgba(201,168,76,0.7)' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
          background-repeat:no-repeat; background-position:right 14px center;
          padding-right:38px;
        }
        .cf-select:focus { border-color:rgba(201,168,76,0.5); background-color:rgba(201,168,76,0.05); box-shadow:0 0 0 3px rgba(201,168,76,0.1); color:rgba(255,255,255,0.95); }
        .cf-select option { background:#040d20; color:rgba(255,255,255,0.85); }

        .cf-label {
          display:block; font-family:'Inter',sans-serif;
          font-size:10px; font-weight:700;
          letter-spacing:1.8px; text-transform:uppercase;
          color:rgba(255,255,255,0.45); margin-bottom:7px;
        }
        .cf-label .req { color:#FCA5A5; margin-left:3px; }

        .cf-section-title {
          font-family:'Playfair Display',serif;
          font-size:14px; font-weight:700;
          color:rgba(255,255,255,0.9); margin:0;
        }

        .cf-btn-save {
          display:inline-flex; align-items:center; gap:7px;
          padding:11px 22px; border-radius:9px; border:none;
          background:linear-gradient(135deg,#C9A84C 0%,#9A7A32 100%);
          color:#020818; font-family:'Inter',sans-serif;
          font-size:13px; font-weight:700;
          cursor:pointer; transition:all 0.18s ease;
          box-shadow:0 4px 16px rgba(201,168,76,0.25);
        }
        .cf-btn-save:hover:not(:disabled) { background:linear-gradient(135deg,#E8C97A 0%,#C9A84C 100%); transform:translateY(-1px); box-shadow:0 6px 20px rgba(201,168,76,0.35); }
        .cf-btn-save:disabled { opacity:0.5; cursor:not-allowed; }

        .cf-btn-cancel {
          display:inline-flex; align-items:center; gap:7px;
          padding:11px 18px; border-radius:9px;
          border:1px solid rgba(255,255,255,0.1);
          background:rgba(255,255,255,0.04);
          color:rgba(255,255,255,0.55);
          font-family:'Inter',sans-serif; font-size:13px; font-weight:500;
          cursor:pointer; transition:all 0.15s ease;
        }
        .cf-btn-cancel:hover { background:rgba(255,255,255,0.07); border-color:rgba(255,255,255,0.18); color:rgba(255,255,255,0.85); }
      `}</style>

      <div style={{
        flex:1, overflowY:'auto', minHeight:'100vh',
        background:`
          radial-gradient(ellipse at 10% 20%,rgba(201,168,76,0.05) 0%,transparent 48%),
          radial-gradient(ellipse at 90% 80%,rgba(59,130,246,0.04) 0%,transparent 48%),
          linear-gradient(160deg,#020818 0%,#040d20 50%,#02050f 100%)
        `,
      }}>

        {/* ── Page header ─────────────────────────────────────── */}
        <div className="cf-fade" style={{
          background:'linear-gradient(135deg,rgba(6,16,40,0.97) 0%,rgba(12,26,56,0.9) 100%)',
          borderBottom:'1px solid rgba(201,168,76,0.14)',
          padding:'22px 36px 18px', position:'relative', overflow:'hidden',
        }}>
          {[160,110].map((s,i)=>(
            <div key={i} style={{position:'absolute',top:-s*0.4,right:-s*0.4,width:s,height:s,borderRadius:'50%',border:`1px solid rgba(201,168,76,${0.06-i*0.02})`,pointerEvents:'none'}}/>
          ))}
          <div style={{position:'relative',zIndex:1}}>
            <p style={{fontFamily:"'Inter',sans-serif",fontSize:'10px',fontWeight:'700',letterSpacing:'3px',textTransform:'uppercase',color:'rgba(201,168,76,0.85)',margin:'0 0 6px'}}>
              {isEdit ? 'Editar expediente' : 'Nuevo expediente'}
            </p>
            <h1 style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:'22px',fontWeight:'700',color:'rgba(255,255,255,0.96)',margin:'0 0 3px',textShadow:'0 2px 6px rgba(0,0,0,0.35)'}}>
              {isEdit ? 'Editar caso' : 'Nuevo caso'}
            </h1>
            <p style={{fontFamily:"'Inter',sans-serif",fontSize:'12px',color:'rgba(255,255,255,0.35)',margin:0}}>
              {isEdit ? 'Modifica los datos del expediente' : 'Registra un nuevo expediente jurídico'}
            </p>
          </div>
          <div style={{position:'absolute',bottom:0,left:'36px',width:'44px',height:'1px',background:'linear-gradient(90deg,rgba(201,168,76,0.55),transparent)'}}/>
        </div>

        <div style={{padding:'26px 36px',maxWidth:'820px'}}>

          {/* Error */}
          {error && (
            <div className="cf-fade" style={{
              display:'flex',alignItems:'flex-start',gap:'10px',
              background:'rgba(239,68,68,0.1)',border:'1px solid rgba(239,68,68,0.25)',
              borderRadius:'10px',padding:'12px 16px',marginBottom:'18px',
            }}>
              <AlertCircle size={14} style={{color:'#FCA5A5',flexShrink:0,marginTop:'1px'}}/>
              <p style={{fontFamily:"'Inter',sans-serif",fontSize:'13px',color:'#FCA5A5',margin:0,lineHeight:1.5}}>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit}>

            {/* ── Sección 1: Información principal ─────────────── */}
            <div className="cf-fade" style={{
              background:'rgba(8,20,48,0.75)', backdropFilter:'blur(16px)',
              border:'1px solid rgba(201,168,76,0.14)', borderRadius:'16px',
              overflow:'hidden', boxShadow:'0 8px 32px rgba(0,0,0,0.35)',
              marginBottom:'16px', animationDelay:'0.06s',
            }}>
              <div style={{padding:'15px 22px',borderBottom:'1px solid rgba(201,168,76,0.1)',display:'flex',alignItems:'center',gap:'10px'}}>
                <div style={{width:'30px',height:'30px',borderRadius:'8px',background:'rgba(201,168,76,0.1)',border:'1px solid rgba(201,168,76,0.2)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                  <FolderOpen size={14} style={{color:'rgba(201,168,76,0.8)'}}/>
                </div>
                <p className="cf-section-title">Información principal</p>
              </div>
              <div style={{padding:'20px 22px',display:'flex',flexDirection:'column',gap:'16px'}}>

                {/* Asunto */}
                <div>
                  <label className="cf-label">Asunto / título <span className="req">*</span></label>
                  <input className="cf-input" name="asunto" value={form.asunto}
                    onChange={handleChange} required
                    placeholder="Ej. Homicidio culposo — García vs Estado"/>
                </div>

                {/* Tipo y Estado */}
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'14px'}}>
                  <div>
                    <label className="cf-label">Tipo de caso <span className="req">*</span></label>
                    <select className="cf-select" name="tipo" value={form.tipo}
                      onChange={handleChange} required>
                      <option value="">Seleccionar…</option>
                      {TIPOS.map(t=><option key={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="cf-label">Estado</label>
                    <select className="cf-select" name="estado" value={form.estado}
                      onChange={handleChange}>
                      {ESTADOS.map(e=><option key={e.value} value={e.value}>{e.label}</option>)}
                    </select>
                  </div>
                </div>

                {/* Descripción */}
                <div>
                  <label className="cf-label">Descripción / antecedentes</label>
                  <textarea className="cf-input" name="descripcion" value={form.descripcion}
                    onChange={handleChange} rows={3}
                    placeholder="Breve descripción del caso y antecedentes relevantes…"
                    style={{resize:'none',lineHeight:1.65}}/>
                </div>
              </div>
            </div>

            {/* ── Sección 2: Cliente y fechas ───────────────────── */}
            <div className="cf-fade" style={{
              background:'rgba(8,20,48,0.75)', backdropFilter:'blur(16px)',
              border:'1px solid rgba(201,168,76,0.14)', borderRadius:'16px',
              overflow:'hidden', boxShadow:'0 8px 32px rgba(0,0,0,0.35)',
              marginBottom:'16px', animationDelay:'0.1s',
            }}>
              <div style={{padding:'15px 22px',borderBottom:'1px solid rgba(201,168,76,0.1)',display:'flex',alignItems:'center',gap:'10px'}}>
                <div style={{width:'30px',height:'30px',borderRadius:'8px',background:'rgba(201,168,76,0.1)',border:'1px solid rgba(201,168,76,0.2)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                  <User size={14} style={{color:'rgba(201,168,76,0.8)'}}/>
                </div>
                <p className="cf-section-title">Cliente y fechas</p>
              </div>
              <div style={{padding:'20px 22px',display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'14px'}}>
                <div>
                  <label className="cf-label">Cliente</label>
                  <select className="cf-select" name="id_cliente" value={form.id_cliente}
                    onChange={handleChange}>
                    <option value="">Sin asignar</option>
                    {clientes.map(c=>(
                      <option key={c.id_cliente} value={c.id_cliente}>{c.nombre}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="cf-label">Fecha apertura <span className="req">*</span></label>
                  <input className="cf-input" name="fecha_apertura" type="date"
                    value={form.fecha_apertura} onChange={handleChange} required/>
                </div>
                <div>
                  <label className="cf-label">Fecha límite</label>
                  <input className="cf-input" name="fecha_limite" type="date"
                    value={form.fecha_limite} onChange={handleChange}/>
                </div>
              </div>
            </div>

            {/* ── Sección 3: Datos judiciales ───────────────────── */}
            <div className="cf-fade" style={{
              background:'rgba(8,20,48,0.75)', backdropFilter:'blur(16px)',
              border:'1px solid rgba(201,168,76,0.14)', borderRadius:'16px',
              overflow:'hidden', boxShadow:'0 8px 32px rgba(0,0,0,0.35)',
              marginBottom:'16px', animationDelay:'0.14s',
            }}>
              <div style={{padding:'15px 22px',borderBottom:'1px solid rgba(201,168,76,0.1)',display:'flex',alignItems:'center',gap:'10px'}}>
                <div style={{width:'30px',height:'30px',borderRadius:'8px',background:'rgba(201,168,76,0.1)',border:'1px solid rgba(201,168,76,0.2)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                  <Scale size={14} style={{color:'rgba(201,168,76,0.8)'}}/>
                </div>
                <p className="cf-section-title">Datos judiciales</p>
              </div>
              <div style={{padding:'20px 22px',display:'flex',flexDirection:'column',gap:'14px'}}>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'14px'}}>
                  <div>
                    <label className="cf-label">Juzgado / instancia</label>
                    <input className="cf-input" name="juzgado" value={form.juzgado}
                      onChange={handleChange} placeholder="Ej. Juzgado 3o. Civil, Centla"/>
                  </div>
                  <div>
                    <label className="cf-label">No. expediente tribunal</label>
                    <input className="cf-input" name="exp_externo" value={form.exp_externo}
                      onChange={handleChange} placeholder="Ej. 1234/2025"/>
                  </div>
                </div>
                <div>
                  <label className="cf-label">Contraparte</label>
                  <input className="cf-input" name="contraparte" value={form.contraparte}
                    onChange={handleChange} placeholder="Nombre de la contraparte"/>
                </div>
              </div>
            </div>

            {/* ── Sección 4: Notas internas ─────────────────────── */}
            <div className="cf-fade" style={{
              background:'rgba(245,158,11,0.05)',
              border:'1px solid rgba(245,158,11,0.18)',
              borderRadius:'16px', overflow:'hidden',
              marginBottom:'24px', animationDelay:'0.18s',
            }}>
              <div style={{padding:'15px 22px',borderBottom:'1px solid rgba(245,158,11,0.12)',display:'flex',alignItems:'center',gap:'10px'}}>
                <AlertCircle size={14} style={{color:'#FCD34D',flexShrink:0}}/>
                <p style={{fontFamily:"'Playfair Display',serif",fontSize:'14px',fontWeight:'700',color:'#FCD34D',margin:0}}>
                  Notas internas
                </p>
              </div>
              <div style={{padding:'18px 22px'}}>
                <textarea className="cf-input" name="notas" value={form.notas}
                  onChange={handleChange} rows={2}
                  placeholder="Notas internas del despacho (no visibles al cliente)…"
                  style={{
                    resize:'none', lineHeight:1.65,
                    borderColor:'rgba(245,158,11,0.2)',
                    background:'rgba(245,158,11,0.04)',
                    color:'rgba(253,211,77,0.8)',
                  }}/>
              </div>
            </div>

            {/* Botones */}
            <div className="cf-fade" style={{display:'flex',justifyContent:'flex-end',gap:'10px',animationDelay:'0.22s'}}>
              <button type="button" className="cf-btn-cancel"
                onClick={()=>navigate('/panel/casos')}>
                <X size={14}/> Cancelar
              </button>
              <button type="submit" disabled={saving} className="cf-btn-save">
                <Save size={14}/>
                {saving ? 'Guardando…' : isEdit ? 'Actualizar caso' : 'Guardar caso'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}