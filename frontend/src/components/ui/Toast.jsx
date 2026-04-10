import { useState, useCallback, useEffect } from 'react'

// ── Hook ──────────────────────────────────────────────────────────
export function useToast() {
  const [toast, setToast] = useState(null)

  const showToast = useCallback((message, type = 'error') => {
    setToast({ message, type, id: Date.now() })
  }, [])

  // Auto-dismiss
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 3500)
    return () => clearTimeout(t)
  }, [toast])

  return { toast, showToast }
}

// ── Componente ────────────────────────────────────────────────────
export function Toast({ toast }) {
  if (!toast) return null

  const isError   = toast.type === 'error'
  const isSuccess = toast.type === 'success'
  const isWarn    = toast.type === 'warn'

  const borderColor = isError   ? 'rgba(239,68,68,0.4)'
                    : isSuccess ? 'rgba(16,185,129,0.4)'
                    :             'rgba(201,168,76,0.45)'

  const textColor   = isError   ? '#FCA5A5'
                    : isSuccess ? '#6EE7B7'
                    :             '#E8C97A'

  const icon        = isError   ? '✕'
                    : isSuccess ? '✓'
                    :             '!'

  return (
    <div
      key={toast.id}
      style={{
        position:        'fixed',
        top:             '20px',
        right:           '20px',
        zIndex:          99999,
        display:         'flex',
        alignItems:      'center',
        gap:             '10px',
        background:      'rgba(6,16,40,0.97)',
        border:          `1px solid ${borderColor}`,
        borderRadius:    '10px',
        padding:         '12px 18px',
        boxShadow:       '0 8px 32px rgba(0,0,0,0.65)',
        backdropFilter:  'blur(16px)',
        maxWidth:        '340px',
        fontFamily:      "'Inter',sans-serif",
        fontSize:        '13px',
        color:           textColor,
        lineHeight:      1.5,
        animation:       'toastIn 0.22s ease',
        pointerEvents:   'none',
      }}
    >
      <style>{`@keyframes toastIn{from{opacity:0;transform:translateX(16px)}to{opacity:1;transform:translateX(0)}}`}</style>
      <span style={{ fontWeight: '700', flexShrink: 0 }}>{icon}</span>
      <span>{toast.message}</span>
    </div>
  )
}
