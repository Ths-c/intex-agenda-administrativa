// Colores suaves para los componentes del calendario (no saturados).
export const EVENT_COLORS = {
  blue: '#7aa7d9',
  green: '#7fb98a',
  pink: '#d99ab5',
  yellow: '#d9b96a',
  violet: '#a394d6',
}

export function eventsByDate(events) {
  const map = {}
  for (const e of events) {
    if (!map[e.fechaISO]) map[e.fechaISO] = []
    map[e.fechaISO].push(e)
  }
  return map
}
