import { DIAS_ES, MESES_ES, buildMonthGrid, yearsRange } from '../../lib/calendar'
import DayCell from './DayCell'

export default function Calendar({ year, month, selectedISO, eventsMap, blockedSet, hoursByDow, onMonthChange, onSelectDate }) {
  const cells = buildMonthGrid(year, month)
  const years = yearsRange(new Date().getFullYear(), 5)

  const isDisabled = (iso, inMonth) => {
    if (!inMonth) return false
    if (blockedSet?.has(iso)) return true
    if (hoursByDow) {
      const [y, m, d] = iso.split('-').map(Number)
      const dow = new Date(y, m - 1, d, 12).getDay()
      if (hoursByDow[dow] && hoursByDow[dow].activo === false) return true
    }
    return false
  }

  return (
    <section className="neu-raised neu-calendar">
      <div className="neu-cal-head">
        <div className="neu-cal-selectors">
          <select
            className="neu-select"
            value={month}
            onChange={(e) => onMonthChange(year, Number(e.target.value))}
            aria-label="Mes"
          >
            {MESES_ES.map((m, i) => (
              <option key={m} value={i}>{m}</option>
            ))}
          </select>
          <select
            className="neu-select"
            value={year}
            onChange={(e) => onMonthChange(Number(e.target.value), month)}
            aria-label="Año"
          >
            {years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
        <div className="neu-cal-nav">
          <button className="neu-circle-btn" onClick={() => onMonthChange(year, month, -1)} aria-label="Mes anterior">‹</button>
          <button
            className="neu-pill-btn"
            onClick={() => { const n = new Date(); onMonthChange(n.getFullYear(), n.getMonth()) }}
          >
            Hoy
          </button>
          <button className="neu-circle-btn" onClick={() => onMonthChange(year, month, 1)} aria-label="Mes siguiente">›</button>
        </div>
      </div>

      <div className="neu-weekdays">
        {DIAS_ES.map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>
      <div className="neu-grid">
        {cells.map((c) => (
          <DayCell
            key={c.iso + (c.inMonth ? '-m' : '-o')}
            cell={c}
            selectedISO={selectedISO}
            events={eventsMap[c.iso] || []}
            disabled={isDisabled(c.iso, c.inMonth)}
            onSelect={onSelectDate}
          />
        ))}
      </div>
      <p className="neu-cal-hint neu-muted">Tocá un día para ver horarios y reservar tu turno.</p>
    </section>
  )
}
