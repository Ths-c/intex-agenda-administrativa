import { useEffect } from 'react'
import { DIAS_ES_LARGO, MESES_ES, parseISODate } from '../../lib/calendar'
import { NEGOCIO } from '../../lib/config'

export default function BookingModal({
  open, onClose, fechaISO, events = [], slots, loadingSlots, hora, setHora,
  form, setForm, reservar, enviando, okMsg,
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open || !fechaISO) return null

  const dt = parseISODate(fechaISO)
  const titulo = `${DIAS_ES_LARGO[dt.getDay()]} ${dt.getDate()} de ${MESES_ES[dt.getMonth()]}`
  const eventos = events || []
  const horaParts = String(hora || '00:00').split(':')
  const horaHour = Number(horaParts[0]) || 0
  const horaMin = Number(horaParts[1]) || 0

  return (
    <div className="neu-modal-overlay" onClick={onClose} role="presentation">
      <div
        className="neu-raised neu-modal"
        role="dialog"
        aria-modal="true"
        aria-label={`Reservar turno el ${titulo}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="neu-modal-head">
          <div>
            <h2>{titulo}</h2>
            <p className="neu-muted">{fechaISO}</p>
          </div>
          <button className="neu-circle-btn" onClick={onClose} aria-label="Cerrar">×</button>
        </div>

        {eventos.length > 0 && (
          <ul className="neu-detail-events">
            {eventos.map((e) => (
              <li key={e.id}>
                <span className="neu-event-dot" style={{ background: e.color || '#9aa3b2' }} />
                <strong>{e.hora}</strong> — {e.titulo}
              </li>
            ))}
          </ul>
        )}

        <h3>Reservar turno</h3>
        {loadingSlots ? <p className="neu-muted">Cargando horarios…</p> : (
          <>
            <div className="neu-slots">
              {slots.filter((s) => s.disponible).length === 0 && (
                <p className="neu-muted">Sin horarios libres. Probá otro día.</p>
              )}
              {slots.map((s) => (
                <button
                  key={s.inicio}
                  disabled={!s.disponible}
                  className={`neu-slot ${hora === s.inicio ? 'sel' : ''}`}
                  onClick={() => setHora(s.inicio)}
                >
                  {s.inicio}
                </button>
              ))}
            </div>
            <div className="neu-slots-legend">
              <span><span className="neu-dot" style={{ background: '#7fb98a' }} /> Disponible</span>
              <span><span className="neu-dot" style={{ background: 'var(--neu-dark)' }} /> Ocupado</span>
            </div>
          </>
        )}

        {!loadingSlots && (
          <div className="neu-slider-row">
            <label className="neu-label" htmlFor="hora-slider">Hora</label>
            <input id="hora-slider" type="range" className="neu-range" min={0} max={23} step={1} value={horaHour} onChange={(e) => setHora(`${String(Number(e.target.value)).padStart(2, '0')}:${String(horaMin).padStart(2, '0')}`)} />
            <label className="neu-label" htmlFor="min-slider">Minutos</label>
            <input id="min-slider" type="range" className="neu-range" min={0} max={59} step={1} value={horaMin} onChange={(e) => setHora(`${String(horaHour).padStart(2, '0')}:${String(Number(e.target.value)).padStart(2, '0')}`)} />
          </div>
        )}

        {hora && (
          <form onSubmit={reservar} className="neu-form">
            <div className="neu-resumen">Turno · {fechaISO} · {hora} hs · {NEGOCIO.duracionMin} min</div>
            <input className="neu-input" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} placeholder="Nombre del cliente*" required />
            <input className="neu-input" value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} placeholder="Descripción (procedencia, notas)" />
            <button className="neu-pill-btn neu-primary" disabled={enviando}>{enviando ? 'Reservando…' : 'Confirmar reserva'}</button>
            {okMsg && <p className="neu-ok">{okMsg}</p>}
          </form>
        )}
      </div>
    </div>
  )
}
