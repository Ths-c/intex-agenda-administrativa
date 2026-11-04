import { useCallback, useEffect, useMemo, useState } from 'react'
import { fetchClients, archivarCliente } from '../lib/api'
import ClientFormModal from '../components/neu/ClientFormModal'
import ClientHistoryModal from '../components/neu/ClientHistoryModal'

export default function Clientes() {
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busqueda, setBusqueda] = useState('')

  const [formOpen, setFormOpen] = useState(false)
  const [editando, setEditando] = useState(null)
  const [historial, setHistorial] = useState(null)
  const [confirmarBaja, setConfirmarBaja] = useState(null)
  const [archivando, setArchivando] = useState(false)

  const cargar = useCallback(async () => {
    setLoading(true)
    try {
      const data = await fetchClients()
      setClients(data)
      setError('')
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    cargar()
  }, [cargar])

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    if (!q) return clients
    return clients.filter((c) =>
      [c.nombre, c.apellido, `${c.apellido} ${c.nombre}`, c.dni, c.telefono, c.obra_social]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    )
  }, [clients, busqueda])

  const abrirNuevo = () => {
    setEditando(null)
    setFormOpen(true)
  }

  const abrirEdicion = (c) => {
    setEditando(c)
    setFormOpen(true)
  }

  const cerrarForm = () => {
    setFormOpen(false)
    setEditando(null)
  }

  const guardado = () => {
    cerrarForm()
    cargar()
  }

  const archivar = async () => {
    if (!confirmarBaja) return
    setArchivando(true)
    setError('')
    try {
      await archivarCliente(confirmarBaja.id)
      setConfirmarBaja(null)
      await cargar()
    } catch (e) {
      setError(e.message)
    } finally {
      setArchivando(false)
    }
  }

  return (
    <div className="neu-page">
      {error && <div className="neu-banner-error">{error}</div>}

      <section className="neu-raised neu-reservas">
        <div className="neu-reservas-head">
          <h2>Clientes</h2>
          <div className="neu-reservas-filtros">
            <input
              className="neu-input neu-full"
              placeholder="Buscar por nombre, DNI, teléfono u obra social…"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
            <button className="neu-pill-btn neu-primary" onClick={abrirNuevo}>Nuevo cliente</button>
          </div>
        </div>

        {loading ? (
          <p className="neu-muted">Cargando clientes…</p>
        ) : filtrados.length === 0 ? (
          <p className="neu-muted">
            {busqueda ? 'No hay clientes que coincidan con la búsqueda.' : 'Todavía no hay clientes cargados.'}
          </p>
        ) : (
          <div className="neu-client-list">
            {filtrados.map((c) => (
              <div key={c.id} className="neu-client">
                <div className="neu-client-info">
                  <strong>{c.apellido ? `${c.apellido}, ${c.nombre}` : c.nombre}</strong>
                  <span className="neu-muted">
                    {[c.dni && `DNI ${c.dni}`, c.telefono, c.obra_social].filter(Boolean).join(' · ') || 'Sin datos de contacto'}
                  </span>
                  {c.direccion && <span>{c.direccion}</span>}
                  {c.notas && <span className="neu-muted">{c.notas}</span>}
                </div>
                <div className="neu-reserva-actions">
                  <button type="button" className="neu-pill-btn" onClick={() => setHistorial(c)}>Historial</button>
                  <button type="button" className="neu-pill-btn" onClick={() => abrirEdicion(c)}>Editar</button>
                  <button type="button" className="neu-pill-btn neu-btn-cancelar" onClick={() => setConfirmarBaja(c)}>Archivar</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {formOpen && (
        <ClientFormModal cliente={editando} onClose={cerrarForm} onSaved={guardado} />
      )}

      {historial && (
        <ClientHistoryModal cliente={historial} onClose={() => setHistorial(null)} />
      )}

      {confirmarBaja && (
        <div className="neu-modal-overlay" onClick={() => setConfirmarBaja(null)} role="presentation">
          <div
            className="neu-raised neu-modal neu-modal-sm"
            role="dialog"
            aria-modal="true"
            aria-label="Archivar cliente"
            onClick={(e) => e.stopPropagation()}
          >
            <h2>Archivar cliente</h2>
            <p className="neu-muted">
              ¿Querés archivar a {confirmarBaja.nombre} {confirmarBaja.apellido}? Sus turnos se conservan en el historial.
            </p>
            <div className="neu-reserva-actions">
              <button type="button" className="neu-pill-btn" onClick={() => setConfirmarBaja(null)}>Cancelar</button>
              <button type="button" className="neu-pill-btn neu-btn-cancelar" onClick={archivar} disabled={archivando}>
                {archivando ? 'Archivando…' : 'Archivar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
