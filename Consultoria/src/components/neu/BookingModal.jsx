import { useEffect, useState } from 'react'
import { DIAS_ES_LARGO, MESES_ES, parseISODate } from '../../lib/calendar'
import { NEGOCIO } from '../../lib/config'
import { crearCliente } from '../../lib/api'

export default function BookingModal({
  open, onClose, fechaISO, events = [], clients = [], clienteId, setClienteId,
  onClienteCreado, hora, setHora, form, setForm, reservar, enviando, okMsg,
}) {
  const [quickOpen, setQuickOpen] = useState(false)
  const [quick, setQuick] = useState({ nombre: '', apellido: '', telefono: '', dni: '' })
  const [quickError, setQuickError] = useState('')
  const [quickSaving, setQuickSaving] = useState(false)
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

  useEffect(() => {
    if (!open) {
      setQuickOpen(false)
      setQuick({ nombre: '', apellido: '', telefono: '', dni: '' })
      setQuickError('')
    }
  }, [open])

  if (!open || !fechaISO) return null

  const dt = parseISODate(fechaISO)
  const titulo = `${DIAS_ES_LARGO[dt.getDay()]} ${dt.getDate()} de ${MESES_ES[dt.getMonth()]}`
  const eventos = events || []
  const clienteSel = clients.find((c) => c.id === clienteId)
  const nombreMostrado = clienteSel
    ? `${clienteSel.apellido ? `${clienteSel.apellido}, ` : ''}${clienteSel.nombre}`
    : form.nombre

  const setQuickField = (campo, valor) => setQuick((q) => ({ ...q, [campo]: valor }))

  const guardarQuick = async () => {
    if (quick.nombre.trim().length < 2) return setQuickError('Ingresá el nombre (mínimo 2 letras).')
    const dni = quick.dni.replace(/\D/g, '')
    if (dni && (dni.length < 7 || dni.length > 8)) return setQuickError('El DNI debe tener 7 u 8 dígitos.')
    setQuickError('')
    setQuickSaving(true)
    try {
      const nuevo = await crearCliente({
        nombre: quick.nombre.trim(),
        apellido: quick.apellido.trim(),
        telefono: quick.telefono.trim(),
        dni,
        direccion: '',
        obra_social: '',
        notas: '',
      })
      setQuick({ nombre: '', apellido: '', telefono: '', dni: '' })
      setQuickOpen(false)
      onClienteCreado?.(nuevo)
    } catch (e) {
      setQuickError(e.message)
    } finally {
      setQuickSaving(false)
    }
  }

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

          <label className="neu-label">Cliente
            <select className="neu-select neu-full" value={clienteId} onChange={(e) => setClienteId(e.target.value)}>
              <option value="">Otro / sin registrar</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {`${c.apellido ? `${c.apellido}, ` : ''}${c.nombre}${c.dni ? ` — DNI ${c.dni}` : ''}`}
                </option>
              ))}
            </select>
          </label>

          {!clienteId && !quickOpen && (
            <button type="button" className="neu-link-btn" onClick={() => { setQuickOpen(true); setQuickError('') }}>
              ＋ Nuevo cliente
            </button>
          )}

          {!clienteId && quickOpen && (
            <div className="neu-quick-client">
              <p className="neu-quick-title">Alta rápida de cliente</p>
              <div className="neu-form-row">
                <label className="neu-label">Nombre *
                  <input className="neu-input" value={quick.nombre} onChange={(e) => setQuickField('nombre', e.target.value)} />
                </label>
                <label className="neu-label">Apellido
                  <input className="neu-input" value={quick.apellido} onChange={(e) => setQuickField('apellido', e.target.value)} />
                </label>
              </div>
              <div className="neu-form-row">
                <label className="neu-label">Teléfono
                  <input className="neu-input" value={quick.telefono} onChange={(e) => setQuickField('telefono', e.target.value)} />
                </label>
                <label className="neu-label">DNI
                  <input className="neu-input" inputMode="numeric" value={quick.dni} onChange={(e) => setQuickField('dni', e.target.value)} placeholder="7 u 8 dígitos" />
                </label>
              </div>
              <div className="neu-quick-actions">
                <button type="button" className="neu-pill-btn" onClick={() => { setQuickOpen(false); setQuickError('') }}>Cancelar</button>
                <button type="button" className="neu-pill-btn neu-primary" onClick={guardarQuick} disabled={quickSaving}>
                  {quickSaving ? 'Guardando…' : 'Guardar y seleccionar'}
                </button>
              </div>
              {quickError && <p className="neu-error">{quickError}</p>}
            </div>
          )}

          {!clienteId && (
            <input
              className="neu-input"
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              placeholder="Nombre del cliente*"
              required
            />
          )}

          <input
            className="neu-input"
            value={form.descripcion}
            onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
            placeholder="Descripción (procedencia, notas)"
          />

          <div className="neu-resumen">
            Turno · {fechaISO} · {hora || '--:--'} hs · {NEGOCIO.duracionMin} min
            {nombreMostrado ? ` · ${nombreMostrado}` : ''}
          </div>

          <button className="neu-pill-btn neu-primary" disabled={enviando}>
            {enviando ? 'Reservando…' : 'Confirmar reserva'}
          </button>
          {okMsg && <p className="neu-ok">{okMsg}</p>}
        </form>
      </div>
    </div>
  )
}
