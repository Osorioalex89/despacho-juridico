import { useState, useEffect, Children, cloneElement } from 'react'
import { createCita, updateCita } from './appointmentsService'
import { getCasos } from '../cases/casesService'
import { X, Save, Calendar, Clock, User, Briefcase, Tag, FileText, MessageSquare } from 'lucide-react'

const FORM_INICIAL = {
  id_cliente: '', id_caso: '', fecha: '',
  hora: '', motivo: '', estado: 'pendiente', notas: '',
}

// ── Estilos reutilizables ─────────────────────────────────────────
const S = {
  label: {
    display: 'block',
    fontFamily: "'Inter', sans-serif",
    fontSize: '11px',
    fontWeight: '600',
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    color: 'rgba(201,168,76,0.75)',
    marginBottom: '6px',
  },
  input: {
    width: '100%',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(201,168,76,0.18)',
    borderRadius: '8px',
    padding: '9px 12px',
    fontFamily: "'Inter', sans-serif",
    fontSize: '13px',
    color: 'rgba(255,255,255,0.9)',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s',
  },
  inputFocus: {
    borderColor: 'rgba(201,168,76,0.5)',
    background: 'rgba(255,255,255,0.06)',
  },
}

function Field({ label, icon: Icon, children }) {
  return (
    <div>
      <label style={S.label}>
        {Icon && <Icon size={10} style={{ display: 'inline', marginRight: '5px', opacity: 0.7 }}/>}
        {label}
      </label>
      {children}
    </div>
  )
}

function StyledInput({ style, ...props }) {
  const [focused, setFocused] = useState(false)
  return (
    <input
      {...props}
      style={{ ...S.input, ...(focused ? S.inputFocus : {}), ...style }}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    />
  )
}

const OPTION_STYLE = { background: '#0d1e3a', color: 'rgba(255,255,255,0.9)' }

function StyledSelect({ style, children, ...props }) {
  const [focused, setFocused] = useState(false)
  const styledOptions = Children.map(children, child =>
    child ? cloneElement(child, { style: { ...OPTION_STYLE, ...child.props.style } }) : child
  )
  return (
    <select
      {...props}
      style={{
        ...S.input,
        background: focused ? 'rgba(255,255,255,0.06)' : 'rgba(8,20,48,0.9)',
        borderColor: focused ? 'rgba(201,168,76,0.5)' : 'rgba(201,168,76,0.18)',
        cursor: 'pointer',
        ...style,
      }}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    >
      {styledOptions}
    </select>
  )
}

export default function CitaModal({ cita, fechaInicial, clientes, onClose, onGuardado }) {
  const isEdit = Boolean(cita)
  const [form,   setForm]   = useState(FORM_INICIAL)
  const [casos,  setCasos]  = useState([])
  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState('')

  useEffect(() => {
    getCasos({ limit: 100 }).then(r => setCasos(r.data.casos)).catch(() => {})

    if (isEdit) {
      setForm({
        id_cliente: cita.id_cliente || '',
        id_caso:    cita.id_caso    || '',
        fecha:      cita.fecha      || '',
        hora:       cita.hora?.slice(0, 5) || '',
        motivo:     cita.motivo     || '',
        estado:     cita.estado     || 'pendiente',
        notas:      cita.notas      || '',
      })
    } else {
      setForm(prev => ({ ...prev, fecha: fechaInicial || '' }))
    }
  }, [])

  const handleChange = e => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async e => {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      if (isEdit) {
        await updateCita(cita.id_cita, form)
      } else {
        await createCita(form)
      }
      onGuardado()
    } catch (err) {
      setError(err.response?.data?.message ?? 'Error al guardar la cita')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(2,8,24,0.72)', backdropFilter: 'blur(4px)' }}
    >
      <div style={{
        background: 'rgba(6,16,40,0.97)',
        border: '1px solid rgba(201,168,76,0.22)',
        borderRadius: '16px',
        boxShadow: '0 24px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(201,168,76,0.08) inset',
        width: '100%',
        maxWidth: '460px',
        margin: '0 16px',
        overflow: 'hidden',
      }}>

        {/* ── Header ── */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '18px 22px 16px',
          borderBottom: '1px solid rgba(201,168,76,0.12)',
          background: 'rgba(201,168,76,0.04)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: '8px',
              background: 'rgba(201,168,76,0.12)',
              border: '1px solid rgba(201,168,76,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Calendar size={15} color="#C9A84C"/>
            </div>
            <div>
              <p style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: '15px', fontWeight: '600',
                color: 'rgba(255,255,255,0.95)',
                lineHeight: 1.2,
              }}>
                {isEdit ? 'Editar cita' : 'Nueva cita'}
              </p>
              <p style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: '11px',
                color: 'rgba(201,168,76,0.65)',
                marginTop: '1px',
              }}>
                {isEdit ? 'Modifica los datos de la cita' : 'Registra una nueva cita en la agenda'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: '28px', height: '28px', borderRadius: '7px',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', transition: 'all 0.15s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(239,68,68,0.12)'
              e.currentTarget.style.borderColor = 'rgba(239,68,68,0.3)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'
            }}
          >
            <X size={14} color="rgba(255,255,255,0.5)"/>
          </button>
        </div>

        {/* ── Form ── */}
        <form onSubmit={handleSubmit} style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: '14px' }}>

          {/* Mensaje del cliente */}
          {cita?.mensaje && (
            <div style={{
              background: 'rgba(201,168,76,0.06)',
              border: '1px solid rgba(201,168,76,0.2)',
              borderRadius: '10px',
              padding: '12px 14px',
              display: 'flex', gap: '10px', alignItems: 'flex-start',
            }}>
              <MessageSquare size={14} color="#C9A84C" style={{ marginTop: '1px', flexShrink: 0 }}/>
              <div>
                <p style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '10px', fontWeight: '700',
                  letterSpacing: '0.06em', textTransform: 'uppercase',
                  color: 'rgba(201,168,76,0.8)', marginBottom: '4px',
                }}>
                  Mensaje del cliente
                </p>
                <p style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '13px', color: 'rgba(255,255,255,0.75)',
                  lineHeight: 1.5,
                }}>
                  {cita.mensaje}
                </p>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div style={{
              background: 'rgba(239,68,68,0.08)',
              border: '1px solid rgba(239,68,68,0.25)',
              borderRadius: '8px', padding: '9px 12px',
              fontFamily: "'Inter', sans-serif",
              fontSize: '12px', color: '#FCA5A5',
            }}>
              {error}
            </div>
          )}

          {/* Motivo */}
          <Field label="Motivo *" icon={Tag}>
            <StyledInput
              name="motivo" value={form.motivo} onChange={handleChange}
              required placeholder="Ej. Consulta inicial, firma de documentos..."
            />
          </Field>

          {/* Fecha y Hora */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <Field label="Fecha *" icon={Calendar}>
              <StyledInput
                name="fecha" type="date" value={form.fecha}
                onChange={handleChange} required
              />
            </Field>
            <Field label="Hora *" icon={Clock}>
              <StyledInput
                name="hora" type="time" value={form.hora}
                onChange={handleChange} required
              />
            </Field>
          </div>

          {/* Cliente */}
          <Field label="Cliente" icon={User}>
            <StyledSelect name="id_cliente" value={form.id_cliente} onChange={handleChange}>
              <option value="">Sin asignar</option>
              {clientes.map(c => (
                <option key={c.id_cliente} value={c.id_cliente}>{c.nombre}</option>
              ))}
            </StyledSelect>
          </Field>

          {/* Caso vinculado */}
          <Field label="Caso vinculado" icon={Briefcase}>
            <StyledSelect name="id_caso" value={form.id_caso} onChange={handleChange}>
              <option value="">Sin vincular</option>
              {casos.map(c => (
                <option key={c.id_caso} value={c.id_caso}>{c.folio} — {c.asunto}</option>
              ))}
            </StyledSelect>
          </Field>

          {/* Estado */}
          <Field label="Estado" icon={Tag}>
            <StyledSelect name="estado" value={form.estado} onChange={handleChange}>
              <option value="pendiente">Pendiente</option>
              <option value="confirmada">Confirmada</option>
              <option value="cancelada">Cancelada</option>
            </StyledSelect>
          </Field>

          {/* Notas */}
          <Field label="Notas" icon={FileText}>
            <textarea
              name="notas" value={form.notas} onChange={handleChange}
              rows={2} placeholder="Observaciones adicionales..."
              style={{
                ...S.input,
                resize: 'none',
                fontFamily: "'Inter', sans-serif",
              }}
              onFocus={e => {
                e.target.style.borderColor = 'rgba(201,168,76,0.5)'
                e.target.style.background  = 'rgba(255,255,255,0.06)'
              }}
              onBlur={e => {
                e.target.style.borderColor = 'rgba(201,168,76,0.18)'
                e.target.style.background  = 'rgba(255,255,255,0.04)'
              }}
            />
          </Field>

          {/* Divisor */}
          <div style={{ height: '1px', background: 'rgba(201,168,76,0.1)', margin: '2px 0' }}/>

          {/* Botones */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button
              type="button" onClick={onClose}
              style={{
                padding: '9px 18px',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                fontFamily: "'Inter', sans-serif",
                fontSize: '13px', fontWeight: '500',
                color: 'rgba(255,255,255,0.55)',
                cursor: 'pointer', transition: 'all 0.15s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.07)'
                e.currentTarget.style.color = 'rgba(255,255,255,0.8)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
                e.currentTarget.style.color = 'rgba(255,255,255,0.55)'
              }}
            >
              Cancelar
            </button>
            <button
              type="submit" disabled={saving}
              style={{
                display: 'flex', alignItems: 'center', gap: '7px',
                padding: '9px 20px',
                background: saving
                  ? 'rgba(201,168,76,0.3)'
                  : 'linear-gradient(135deg, #C9A84C 0%, #9A7A32 100%)',
                border: '1px solid rgba(201,168,76,0.4)',
                borderRadius: '8px',
                fontFamily: "'Inter', sans-serif",
                fontSize: '13px', fontWeight: '600',
                color: saving ? 'rgba(255,255,255,0.5)' : '#020818',
                cursor: saving ? 'not-allowed' : 'pointer',
                transition: 'all 0.15s',
                boxShadow: saving ? 'none' : '0 2px 12px rgba(201,168,76,0.25)',
              }}
            >
              <Save size={14}/>
              {saving ? 'Guardando...' : isEdit ? 'Actualizar' : 'Agendar cita'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
