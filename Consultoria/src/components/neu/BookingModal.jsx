import { useEffect } from 'react'
import { DIAS_ES_LARGO, MESES_ES, parseISODate } from '../../lib/calendar'
import { NEGOCIO } from '../../lib/config'

export default function BookingModal({
  open, onClose, fechaISO, events = [], hora, setHora,
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
        <form onSubmit={reservar} className="neu-form">
          <label className="neu-label">Hora del turno
            <input className="neu-input" type="time" value={hora} onChange={(e) => setHora(e.target.value)} required />
          </label>
          <input className="neu-input" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} placeholder="Nombre del cliente*" required />
          <input className="neu-input" value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} placeholder="Descripción (procedencia, notas)" />
          <div className="neu-resumen">Turno · {fechaISO} · {hora || '--:--'} hs · {NEGOCIO.duracionMin} min</div>
          <button className="neu-pill-btn neu-primary" disabled={enviando}>{enviando ? 'Reservando…' : 'Confirmar reserva'}</button>
          {okMsg && <p className="neu-ok">{okMsg}</p>}
        </form>
      </div>
    </div>
  )
}
