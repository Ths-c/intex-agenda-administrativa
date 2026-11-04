import { useEffect, useState } from 'react'
import { formatFechaCorta } from '../../lib/calendar'
import { colorEstado, labelEstado } from '../../lib/config'
import { actualizarTurno } from '../../lib/api'

export default function TurnoModal({ turno, clients = [], onClose, onSaved }) {
  const [actual, setActual] = useState(turno)
  const [editando, setEditando] = useState(false)
  const [form, setForm] = useState(null)
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)

  useEffect(() => {
    setActual(turno)
    setEditando(false)
    setError('')
  }, [turno])

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  if (!turno) return null

  const iniciarEdicion = () => {
    const clienteExiste = clients.some((c) => c.id === actual.client_id)
    setForm({
      fecha: actual.fecha,
      hora: String(actual.hora_inicio).slice(0, 5),
      clienteId: clienteExiste ? actual.client_id : '',
      nombre: clienteExiste ? '' : (actual.cliente_nombre || ''),
      descripcion: actual.descripcion || '',
    })
    setError('')
    setEditando(true)
  }

  const set = (campo, valor) => setForm((f) => ({ ...f, [campo]: valor }))

  const guardar = async (e) => {
    e.preventDefault()
    if (!form.fecha || !form.hora) return setError('Completá fecha y hora.')
    const clienteSel = clients.find((c) => c.id === form.clienteId)
    const nombre = clienteSel
      ? `${clienteSel.nombre} ${clienteSel.apellido}`.trim()
      : form.nombre.trim()
    if (!clienteSel && nombre.length < 2) return setError('Ingresá el nombre del cliente.')

    setError('')
    setGuardando(true)
    try {
      const data = await actualizarTurno(turno.id, {
        fecha: form.fecha,
        hora: form.hora,
        clientId: form.clienteId || null,
        nombre,
        descripcion: form.descripcion.trim(),
      })
      setActual(data || {
        ...actual,
        fecha: form.fecha,
        hora_inicio: form.hora,
        cliente_nombre: nombre,
        client_id: form.clienteId || null,
        descripcion: form.descripcion.trim(),
      })
      setEditando(false)
      onSaved?.()
    } catch (e2) {
      setError(e2.message)
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="neu-modal-overlay" onClick={onClose} role="presentation">
      <div
        className="neu-raised neu-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Detalle del turno"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="neu-modal-head">
          <div>
            <h2>{editando ? 'Modificar turno' : 'Detalle del turno'}</h2>
            <p className="neu-muted">
              {formatFechaCorta(actual.fecha)} · {String(actual.hora_inicio).slice(0, 5)} hs
            </p>
          </div>
          <button className="neu-circle-btn" onClick={onClose} aria-label="Cerrar">×</button>
        </div>

        {!editando ? (
          <>
            <dl className="neu-detail-list">
              <div><dt>Fecha</dt><dd>{formatFechaCorta(actual.fecha)}</dd></div>
              <div><dt>Hora</dt><dd>{String(actual.hora_inicio).slice(0, 5)} hs</dd></div>
              <div><dt>Cliente</dt><dd>{actual.cliente_nombre}</dd></div>
              <div><dt>Descripción</dt><dd>{actual.descripcion || '—'}</dd></div>
              <div>
                <dt>Estado</dt>
                <dd>
                  <span className="neu-reserva-estado" style={{ background: colorEstado(actual.estado) }}>
                    {labelEstado(actual.estado)}
                  </span>
                </dd>
              </div>
            </dl>
            <div className="neu-modal-actions">
              <button type="button" className="neu-pill-btn" onClick={onClose}>Cerrar</button>
              <button type="button" className="neu-pill-btn neu-primary" onClick={iniciarEdicion}>Modificar</button>
            </div>
          </>
        ) : (
          <form onSubmit={guardar} className="neu-form">
            <div className="neu-form-row">
              <label className="neu-label">Fecha
                <input className="neu-input" type="date" value={form.fecha} onChange={(e) => set('fecha', e.target.value)} required />
              </label>
              <label className="neu-label">Hora
                <input className="neu-input" type="time" value={form.hora} onChange={(e) => set('hora', e.target.value)} required />
              </label>
            </div>

            <label className="neu-label">Cliente
              <select className="neu-select neu-full" value={form.clienteId} onChange={(e) => set('clienteId', e.target.value)}>
                <option value="">Otro / sin registrar</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {`${c.apellido ? `${c.apellido}, ` : ''}${c.nombre}${c.dni ? ` — DNI ${c.dni}` : ''}`}
                  </option>
                ))}
              </select>
            </label>

            {!form.clienteId && (
              <input
                className="neu-input"
                value={form.nombre}
                onChange={(e) => set('nombre', e.target.value)}
                placeholder="Nombre del cliente*"
                required
              />
            )}

            <input
              className="neu-input"
              value={form.descripcion}
              onChange={(e) => set('descripcion', e.target.value)}
              placeholder="Descripción (procedencia, notas)"
            />

            <div className="neu-modal-actions">
              <button type="button" className="neu-pill-btn" onClick={() => { setEditando(false); setError('') }}>Cancelar</button>
              <button type="submit" className="neu-pill-btn neu-primary" disabled={guardando}>
                {guardando ? 'Guardando…' : 'Guardar cambios'}
              </button>
            </div>
            {error && <p className="neu-error">{error}</p>}
          </form>
        )}
      </div>
    </div>
  )
}
