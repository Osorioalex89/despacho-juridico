import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY)

/**
 * Analiza un documento legal con Gemini Flash.
 * Acepta buffer (Cloudinary/memoryStorage) o rutaArchivo (legacy disco).
 * @returns {{ tipo, partes, fechasClave, puntosPrincipales, urgencia }}
 */
export const analizarDocumento = async ({ buffer, rutaArchivo, nombreArchivo, tipoArchivo }) => {
  // Obtener buffer: desde parámetro directo o descargando desde URL de Cloudinary
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

  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

  const parts = []

  if (tipoArchivo?.includes('pdf')) {
    parts.push({
      inlineData: {
        data:     fileBuffer.toString('base64'),
        mimeType: 'application/pdf',
      },
    })
  } else if (tipoArchivo?.startsWith('image/')) {
    const mimeType = tipoArchivo.includes('png')  ? 'image/png'
                   : tipoArchivo.includes('gif')  ? 'image/gif'
                   : tipoArchivo.includes('webp') ? 'image/webp'
                   : 'image/jpeg'
    parts.push({
      inlineData: {
        data: fileBuffer.toString('base64'),
        mimeType,
      },
    })
  } else {
    let texto = ''
    try { texto = fileBuffer.toString('utf-8').slice(0, 8000) } catch { /* binario — ignorar */ }
    const cuerpo = texto
      ? `Contenido del archivo "${nombreArchivo}":\n\n${texto}`
      : `Archivo: "${nombreArchivo}" (tipo: ${tipoArchivo || 'desconocido'}). No se pudo leer el contenido binario; infiere del nombre.`
    parts.push({ text: cuerpo })
  }

  parts.push({
    text: `Eres un asistente jurídico experto. Analiza el documento y responde ÚNICAMENTE con JSON válido (sin markdown ni explicaciones) con esta estructura:
{
  "tipo": "tipo de documento (ej: contrato, demanda, acuerdo, escritura, poder notarial, etc.)",
  "partes": ["nombre o rol parte 1", "nombre o rol parte 2"],
  "fechasClave": ["fecha 1", "fecha 2"],
  "puntosPrincipales": ["punto 1", "punto 2", "punto 3"],
  "urgencia": "baja|media|alta"
}
Reglas: máximo 3 fechas y 5 puntos principales. Si el documento no está en español, traduce el resumen. Determina urgencia: alta si hay plazos inmediatos o acciones legales urgentes, media si hay plazos futuros, baja si es informativo.`,
  })

  const result = await model.generateContent(parts)
  const raw    = result.response.text()
  const match  = raw.match(/\{[\s\S]*\}/)
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

  const systemInstruction = `Eres un asistente jurídico especializado en legislación mexicana, asignado al expediente siguiente. Responde en español, de forma clara y profesional. No inventes datos que no estén en el expediente.

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

  const model = genAI.getGenerativeModel({
    model:             'gemini-2.0-flash',
    systemInstruction,
  })

  // Convertir historial al formato de Gemini (role: 'user'|'model')
  const history = historial.map(h => ({
    role:  h.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: h.content }],
  }))

  const chat   = model.startChat({ history })
  const result = await chat.sendMessage(pregunta)
  return result.response.text() || 'Sin respuesta.'
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

  const model  = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })
  const result = await model.generateContent(prompt)
  const raw    = result.response.text()
  const match  = raw.match(/\{[\s\S]*\}/)
  if (!match) throw new Error(`IA no devolvió JSON válido: ${raw.slice(0, 200)}`)
  return JSON.parse(match[0])
}
