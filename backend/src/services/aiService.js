import Groq from 'groq-sdk'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

const TEXT_MODEL   = 'llama-3.3-70b-versatile'
const VISION_MODEL = 'llama-3.2-11b-vision-preview'

/**
 * Extrae texto de un buffer PDF usando pdf-parse.
 * Retorna cadena vacía si falla (PDF escaneado, corrupto, etc.)
 */
const extractPdfText = async (buffer) => {
  try {
    // Importar solo la librería core para evitar el bug de test-files en producción
    const { default: pdfParse } = await import('pdf-parse/lib/pdf-parse.js')
    const data = await pdfParse(buffer)
    return data.text?.slice(0, 8000) || ''
  } catch {
    return ''
  }
}

/**
 * Analiza un documento legal con Groq/Llama.
 * Acepta buffer (Cloudinary/memoryStorage) o rutaArchivo (legacy disco).
 * @returns {{ tipo, partes, fechasClave, puntosPrincipales, urgencia }}
 */
export const analizarDocumento = async ({ buffer, rutaArchivo, nombreArchivo, tipoArchivo }) => {
  let fileBuffer = buffer
  if (!fileBuffer && rutaArchivo) {
    if (rutaArchivo.startsWith('http')) {
      const res  = await fetch(rutaArchivo)
      fileBuffer = Buffer.from(await res.arrayBuffer())
    } else {
      const { default: fs } = await import('fs')
      fileBuffer = fs.readFileSync(rutaArchivo)
    }
  }

  const PROMPT_JSON = `Eres un asistente jurídico experto. Analiza el documento y responde ÚNICAMENTE con JSON válido (sin markdown ni explicaciones) con esta estructura exacta:
{
  "tipo": "tipo de documento (ej: contrato, demanda, acuerdo, escritura, poder notarial, etc.)",
  "partes": ["nombre o rol parte 1", "nombre o rol parte 2"],
  "fechasClave": ["fecha 1", "fecha 2"],
  "puntosPrincipales": ["punto 1", "punto 2", "punto 3"],
  "urgencia": "baja|media|alta"
}
Reglas: máximo 3 fechas y 5 puntos principales. Si el documento no está en español, traduce el resumen. Determina urgencia: alta si hay plazos inmediatos o acciones legales urgentes, media si hay plazos futuros, baja si es informativo.`

  let messages
  let model = TEXT_MODEL

  if (tipoArchivo?.startsWith('image/')) {
    // Imágenes → modelo de visión con base64
    const mimeType = tipoArchivo.includes('png')  ? 'image/png'
                   : tipoArchivo.includes('gif')  ? 'image/gif'
                   : tipoArchivo.includes('webp') ? 'image/webp'
                   : 'image/jpeg'
    const base64 = fileBuffer.toString('base64')
    model = VISION_MODEL
    messages = [{
      role: 'user',
      content: [
        { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64}` } },
        { type: 'text', text: PROMPT_JSON },
      ],
    }]
  } else if (tipoArchivo?.includes('pdf')) {
    // PDF → extraer texto primero
    const texto = await extractPdfText(fileBuffer)
    const cuerpo = texto
      ? `Contenido del PDF "${nombreArchivo}":\n\n${texto}`
      : `Archivo PDF: "${nombreArchivo}". No se pudo extraer texto (posiblemente escaneado); infiere el tipo de documento por el nombre.`
    messages = [{ role: 'user', content: `${cuerpo}\n\n${PROMPT_JSON}` }]
  } else {
    // Otros archivos de texto
    let texto = ''
    try { texto = fileBuffer.toString('utf-8').slice(0, 8000) } catch { /* binario */ }
    const cuerpo = texto
      ? `Contenido del archivo "${nombreArchivo}":\n\n${texto}`
      : `Archivo: "${nombreArchivo}" (tipo: ${tipoArchivo || 'desconocido'}). No se pudo leer el contenido.`
    messages = [{ role: 'user', content: `${cuerpo}\n\n${PROMPT_JSON}` }]
  }

  const config = {
    model,
    messages,
    temperature: 0.1,
    max_tokens:  1024,
  }
  // JSON mode solo en modelos de texto (no siempre disponible en vision)
  if (model === TEXT_MODEL) {
    config.response_format = { type: 'json_object' }
  }

  const completion = await groq.chat.completions.create(config)
  const raw = completion.choices[0].message.content
  const match = raw.match(/\{[\s\S]*\}/)
  if (!match) throw new Error(`IA no devolvió JSON válido: ${raw.slice(0, 200)}`)
  return JSON.parse(match[0])
}

/**
 * Asistente de chat sobre un caso jurídico específico.
 * @param {{ caso, movimientos, documentos, historial, pregunta }} params
 *   historial: Array de { role:'user'|'assistant', content:string }
 *   pregunta:  string — mensaje actual del usuario
 * @returns {string} — respuesta en texto del asistente
 */
export const chatConCaso = async ({ caso, movimientos = [], documentos = [], historial = [], pregunta }) => {
  const movText = movimientos.length
    ? movimientos.map(m => `- [${m.tipo}] ${m.descripcion} (${m.fecha_movimiento})`).join('\n')
    : 'Sin movimientos registrados.'

  const docText = documentos.length
    ? documentos.map(d => {
        const ia = d.analisis ? (() => { try { return JSON.parse(d.analisis) } catch { return null } })() : null
        return ia
          ? `- "${d.nombre_original}" (${d.categoria}): ${ia.tipo}, urgencia=${ia.urgencia}`
          : `- "${d.nombre_original}" (${d.categoria})`
      }).join('\n')
    : 'Sin documentos.'

  const systemPrompt = `Eres un asistente jurídico especializado en legislación mexicana, asignado al expediente siguiente. Responde en español, de forma clara y profesional. No inventes datos que no estén en el expediente.

EXPEDIENTE:
Folio: ${caso.folio}
Asunto: ${caso.asunto}
Tipo: ${caso.tipo}
Estado: ${caso.estado}
Fecha apertura: ${caso.fecha_apertura}
Fecha límite: ${caso.fecha_limite || 'No definida'}

MOVIMIENTOS:
${movText}

DOCUMENTOS:
${docText}`

  const messages = [
    { role: 'system', content: systemPrompt },
    ...historial.map(h => ({ role: h.role, content: h.content })),
    { role: 'user', content: pregunta },
  ]

  const completion = await groq.chat.completions.create({
    model:       TEXT_MODEL,
    messages,
    temperature: 0.3,
    max_tokens:  2048,
  })

  return completion.choices[0].message.content || 'Sin respuesta.'
}

/**
 * Analiza el estado integral de un caso jurídico.
 * @param {{ caso, movimientos, documentos, citas }} data
 * @returns {{ riesgo, resumen, accionesRecomendadas, alertas, proximaAccion }}
 */
export const analizarCaso = async ({ caso, movimientos = [], documentos = [], citas = [] }) => {
  const movText = movimientos.length
    ? movimientos.map(m => `- [${m.tipo}] ${m.descripcion} (${m.fecha_movimiento})`).join('\n')
    : 'Sin movimientos registrados.'

  const docText = documentos.length
    ? documentos.map(d => {
        const ia = d.analisis ? (() => { try { return JSON.parse(d.analisis) } catch { return null } })() : null
        return ia
          ? `- "${d.nombre_original}" (${d.categoria}): tipo=${ia.tipo}, urgencia=${ia.urgencia}, puntos=${ia.puntosPrincipales?.slice(0,2).join('; ')}`
          : `- "${d.nombre_original}" (${d.categoria}): sin análisis IA`
      }).join('\n')
    : 'Sin documentos.'

  const citaText = citas.length
    ? citas.map(c => `- ${c.fecha} ${c.hora ? c.hora.slice(0,5) : ''} — ${c.motivo} [${c.estado}]`).join('\n')
    : 'Sin citas próximas.'

  const prompt = `Eres un agente jurídico especializado en legislación mexicana.
Analiza el siguiente expediente y responde ÚNICAMENTE con JSON válido (sin markdown):

CASO:
Folio: ${caso.folio}
Asunto: ${caso.asunto}
Tipo: ${caso.tipo}
Estado: ${caso.estado}
Fecha apertura: ${caso.fecha_apertura}
Fecha límite: ${caso.fecha_limite || 'No definida'}
Juzgado: ${caso.juzgado || 'No especificado'}
Contraparte: ${caso.contraparte || 'No especificada'}

MOVIMIENTOS RECIENTES:
${movText}

DOCUMENTOS:
${docText}

CITAS:
${citaText}

Responde con este JSON:
{
  "riesgo": "alto|medio|bajo",
  "resumen": "Resumen ejecutivo del estado actual en 2-3 oraciones.",
  "accionesRecomendadas": ["acción 1", "acción 2", "acción 3"],
  "alertas": ["alerta urgente si la hay"],
  "proximaAccion": "La acción más urgente e inmediata a tomar."
}

Reglas: máximo 4 acciones recomendadas, máximo 3 alertas (array vacío si no hay). Riesgo alto si hay plazos próximos, contraparte activa o documentos urgentes.`

  const completion = await groq.chat.completions.create({
    model:           TEXT_MODEL,
    messages:        [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
    temperature:     0.1,
    max_tokens:      1024,
  })

  const raw   = completion.choices[0].message.content
  const match = raw.match(/\{[\s\S]*\}/)
  if (!match) throw new Error(`IA no devolvió JSON válido: ${raw.slice(0, 200)}`)
  return JSON.parse(match[0])
}
