import { todayISO } from '../../lib/calendar'

export default function DayCell({ cell, selectedISO, events = [], disabled, onSelect }) {
  const dayNum = cell.date.getDate()
  const isToday = cell.iso === todayISO()
  const isSelected = cell.iso === selectedISO
  const cls = [
    'neu-day',
    cell.inMonth ? '' : 'outside',
    isToday ? 'today' : '',
    isSelected ? 'selected' : '',
    disabled ? 'disabled' : '',
  ].join(' ')

  return (
    <button className={cls} disabled={disabled} onClick={() => onSelect?.(cell.iso)} aria-pressed={isSelected}>
      <span className="neu-day-num">{dayNum}</span>
      {events.length > 0 && (
        <span className="neu-dots">
          {events.slice(0, 3).map((e) => (
            <span key={e.id} className="neu-dot" style={{ background: e.color || '#9aa3b2' }} />
          ))}
          {events.length > 3 && <span className="neu-more">+{events.length - 3}</span>}
        </span>
      )}
    </button>
  )
}
