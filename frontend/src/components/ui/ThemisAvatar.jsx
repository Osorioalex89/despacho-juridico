/**
 * ThemisAvatar — Medallón SVG del Agente Jurídico IA.
 * Escala perfectamente a cualquier tamaño via prop `size`.
 * Con size >= 44 muestra el texto de anillo completo (THEMIS / AGENTE JURÍDICO ACTIVO).
 */
export default function ThemisAvatar({ size = 48, pulse = false }) {
  const showText = size >= 44

  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      aria-label="Themis — Agente Jurídico"
      style={{
        flexShrink: 0,
        display: 'block',
        filter: `drop-shadow(0 0 ${Math.round(size / 5)}px rgba(201,168,76,0.55))`,
        animation: pulse ? 'themis-pulse 2.5s ease-in-out infinite' : 'none',
      }}
    >
      <defs>
        <filter id="th-inner-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        {/* Top arc at r=43 — "THEMIS" */}
        <path id="th-top" d="M 7,50 A 43,43 0 0,1 93,50" fill="none" />
        {/* Bottom arc at r=43 — "AGENTE JURÍDICO ACTIVO" */}
        <path id="th-bot" d="M 93,50 A 43,43 0 0,1 7,50" fill="none" />

        {pulse && (
          <style>{`
            @keyframes themis-pulse {
              0%,100% { filter: drop-shadow(0 0 ${Math.round(size/5)}px rgba(201,168,76,0.55)); }
              50%      { filter: drop-shadow(0 0 ${Math.round(size/3.5)}px rgba(201,168,76,0.85)); }
            }
          `}</style>
        )}
      </defs>

      {/* ── Anillo exterior dorado ── */}
      <circle cx="50" cy="50" r="48" fill="#C9A84C" />
      {/* Groove interior del anillo */}
      <circle cx="50" cy="50" r="39" fill="#7A6028" />
      {/* Círculo navy interior */}
      <circle cx="50" cy="50" r="37.5" fill="#020818" />
      {/* Borde gold fino interior */}
      <circle cx="50" cy="50" r="37.5" fill="none" stroke="rgba(201,168,76,0.55)" strokeWidth="0.8" />

      {/* ── Texto de anillo ── */}
      {showText && (
        <text
          fontSize="7.5"
          fill="#020818"
          fontFamily="Georgia, 'Times New Roman', serif"
          fontWeight="700"
          letterSpacing="3.8"
        >
          <textPath href="#th-top" startOffset="50%" textAnchor="middle">
            THEMIS
          </textPath>
        </text>
      )}

      {showText && (
        <text
          fontSize="4.6"
          fill="#0a1428"
          fontFamily="Arial, sans-serif"
          fontWeight="600"
          letterSpacing="0.6"
        >
          <textPath href="#th-bot" startOffset="50%" textAnchor="middle">
            AGENTE JURÍDICO ACTIVO
          </textPath>
        </text>
      )}

      {/* ── Red neuronal — arco con 5 nodos ── */}
      <path
        d="M 27,46 Q 38,29 50,26.5 Q 62,29 73,46"
        fill="none"
        stroke="rgba(201,168,76,0.6)"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
      {/* Nodo central (vértice superior — fulcrum) */}
      <circle cx="50" cy="26.5" r="3.2" fill="#C9A84C" filter="url(#th-inner-glow)" />
      {/* Nodos extremos (brazos de la balanza) */}
      <circle cx="27" cy="46" r="2.5" fill="#C9A84C" />
      <circle cx="73" cy="46" r="2.5" fill="#C9A84C" />
      {/* Nodos intermedios */}
      <circle cx="38" cy="33" r="1.6" fill="rgba(201,168,76,0.8)" />
      <circle cx="62" cy="33" r="1.6" fill="rgba(201,168,76,0.8)" />

      {/* ── Viga de balanza ── */}
      <line x1="27" y1="46" x2="73" y2="46" stroke="rgba(201,168,76,0.9)" strokeWidth="1.8" strokeLinecap="round" />
      {/* Poste central (conecta viga con S) */}
      <line x1="50" y1="46" x2="50" y2="52" stroke="rgba(201,168,76,0.9)" strokeWidth="1.8" strokeLinecap="round" />

      {/* ── Monograma S ── */}
      <text
        x="50"
        y="68"
        fontSize="30"
        fill="#C9A84C"
        fontFamily="Georgia, 'Times New Roman', serif"
        fontWeight="700"
        textAnchor="middle"
        dominantBaseline="middle"
        filter="url(#th-inner-glow)"
      >
        S
      </text>
    </svg>
  )
}
