// Utilidades puras del calendario mensual (Dom -> Sáb).
export const DIAS_ES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
export const DIAS_ES_LARGO = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
export const MESES_ES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

export function toISODateLocal(y, m, d) {
  const mm = String(m + 1).padStart(2, '0')
  const dd = String(d).padStart(2, '0')
  return `${y}-${mm}-${dd}`
}

export function parseISODate(iso) {
  const [y, m, d] = String(iso).split('-').map(Number)
  return new Date(y, (m || 1) - 1, d || 1, 12, 0, 0)
}

export function isSameDayISO(aISO, bISO) {
  return aISO === bISO
}

export function todayISO() {
  const n = new Date()
  return toISODateLocal(n.getFullYear(), n.getMonth(), n.getDate())
}

// Devuelve array de 35 o 42 celdas: { iso, date, inMonth, weekday }
export function buildMonthGrid(year, month) {
  const first = new Date(year, month, 1)
  const startWeekday = first.getDay() // 0 = Dom
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const daysInPrev = new Date(year, month, 0).getDate()

  const cells = []
  for (let i = startWeekday - 1; i >= 0; i--) {
    const d = daysInPrev - i
    const dt = new Date(year, month - 1, d, 12)
    cells.push({
      iso: toISODateLocal(dt.getFullYear(), dt.getMonth(), dt.getDate()),
      date: dt,
      inMonth: false,
    })
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const dt = new Date(year, month, d, 12)
    cells.push({ iso: toISODateLocal(year, month, d), date: dt, inMonth: true })
  }
  // Completar hasta múltiplo de 7 (5 o 6 filas)
  let next = 1
  while (cells.length % 7 !== 0) {
    const dt = new Date(year, month + 1, next, 12)
    cells.push({
      iso: toISODateLocal(dt.getFullYear(), dt.getMonth(), dt.getDate()),
      date: dt,
      inMonth: false,
    })
    next++
  }
  return cells
}

export function addMonths(year, month, delta) {
  const d = new Date(year, month + delta, 1)
  return { year: d.getFullYear(), month: d.getMonth() }
}

export function yearsRange(center, span = 6) {
  const out = []
  for (let y = center - span; y <= center + span; y++) out.push(y)
  return out
}
