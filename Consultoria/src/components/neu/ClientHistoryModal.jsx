import { useEffect, useState } from 'react'
import { fetchTurnosDeCliente } from '../../lib/api'
import { colorEstado, labelEstado } from '../../lib/config'

function fechaCorta(iso) {
  const [y, m, d] = String(iso).split('-')
  return `${d}/${m}/${y}`
}

export default function ClientHistoryModal({ cliente, onClose }) {
  const [turnos, setTurnos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let alive = true
    fetchTurnosDeCliente(cliente.id)
      .then((data) => { if (alive) setTurnos(data) })
      .catch((e) => { if (alive) setError(e.message) })
      .finally(() => { if (alive) setLoading(false) })
    return () => { alive = false }
  }, [cliente.id])

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  const titulo = cliente.apellido ? `${cliente.apellido}, ${cliente.nombre}` : cliente.nombre

  return (
    <div className="neu-modal-overlay" onClick={onClose} role="presentation">
      <div
        className="neu-raised neu-modal"
        role="dialog"
        aria-modal="true"
        aria-label={`Historial de ${titulo}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="neu-modal-head">
          <div>
            <h2>{titulo}</h2>
            <p className="neu-muted">
              {[cliente.dni && `DNI ${cliente.dni}`, cliente.telefono, cliente.obra_social].filter(Boolean).join(' · ') || 'Sin datos de contacto'}
            </p>
          </div>
          <button className="neu-circle-btn" onClick={onClose} aria-label="Cerrar">×</button>
        </div>

        <h3>Historial de reservas</h3>
        {loading ? (
          <p className="neu-muted">Cargando historial…</p>
        ) : error ? (
          <p className="neu-error">{error}</p>
        ) : turnos.length === 0 ? (
          <p className="neu-muted">Este cliente todavía no tiene reservas.</p>
        ) : (
          <ul className="neu-history">
            {turnos.map((t) => (
              <li key={t.id}>
                <div className="neu-history-info">
                  <strong>{fechaCorta(t.fecha)} · {String(t.hora_inicio).slice(0, 5)} hs</strong>
                  {t.descripcion && <span>{t.descripcion}</span>}
                </div>
                <span className="neu-reserva-estado" style={{ background: colorEstado(t.estado) }}>
                  {labelEstado(t.estado)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
