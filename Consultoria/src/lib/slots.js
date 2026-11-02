// Generación de slots disponibles. Puro y testeable.
export function timeToMin(t) {
  const [h, m] = String(t).split(':').map(Number)
  return h * 60 + (m || 0)
}
export function minToTime(min) {
  const h = String(Math.floor(min / 60)).padStart(2, '0')
  const m = String(min % 60).padStart(2, '0')
  return `${h}:${m}`
}
export function addMin(timeStr, mins) {
  return minToTime(timeToMin(timeStr) + mins)
}

// ocupados: [{hora_inicio:'10:00', hora_fin:'10:30'}]
export function solapa(inicio, fin, ocupados) {
  const s = timeToMin(inicio)
  const e = timeToMin(fin)
  return ocupados.some((o) => {
    const os = timeToMin(o.hora_inicio)
    const oe = timeToMin(o.hora_fin)
    return s < oe && os < e
  })
}

export function generarSlots({ abre, cierra, duracionMin, ocupados = [], fechaISO = null, pasoMin = null }) {
  const paso = pasoMin || duracionMin
  const slots = []
  let cur = timeToMin(abre)
  const end = timeToMin(cierra)
  while (cur + duracionMin <= end) {
    const inicio = minToTime(cur)
    const fin = minToTime(cur + duracionMin)
    const ocupado = solapa(inicio, fin, ocupados)
    // No mostrar horarios pasados si es hoy
    let pasado = false
    if (fechaISO) {
      const ahora = new Date()
      const [y, mo, d] = fechaISO.split('-').map(Number)
      const slotDate = new Date(y, mo - 1, d, Math.floor(cur / 60), cur % 60)
      pasado = slotDate <= ahora
    }
    slots.push({ inicio, fin, ocupado, pasado, disponible: !ocupado && !pasado })
    cur += paso
  }
  return slots
}

export function toISODate(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function proximosDias(n = 30) {
  const dias = []
  const hoy = new Date()
  for (let i = 0; i < n; i++) {
    const d = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + i)
    dias.push(d)
  }
  return dias
}

const DIAS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
export function etiquetaDia(d) {
  return `${DIAS[d.getDay()]} ${d.getDate()} ${MESES[d.getMonth()]}`
}
