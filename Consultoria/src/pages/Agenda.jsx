import { useEffect, useMemo, useState } from 'react'
import Calendar from '../components/neu/Calendar'
import BookingModal from '../components/neu/BookingModal'
import { addMonths, todayISO } from '../lib/calendar'
import { fetchBusinessHours, fetchBlockedDates, fetchTurnos, fetchClients, crearTurno, updateEstadoTurno } from '../lib/api'
import { colorEstado, labelEstado } from '../lib/config'

const ESTADOS = ['todos', 'pendiente', 'completado', 'cancelado']

export default function Agenda() {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())
  const [selectedISO, setSelectedISO] = useState(todayISO())

  const [hours, setHours] = useState([])
  const [blocked, setBlocked] = useState([])
  const [turnos, setTurnos] = useState([])
  const [clients, setClients] = useState([])

  const [hora, setHora] = useState('')
  const [clienteId, setClienteId] = useState('')

  const [form, setForm] = useState({ nombre: '', descripcion: '' })
  const [enviando, setEnviando] = useState(false)
  const [okMsg, setOkMsg] = useState('')
  const [error, setError] = useState('')
  const [modalOpen, setModalOpen] = useState(false)

  const [busqueda, setBusqueda] = useState('')
  const [fEstado, setFEestado] = useState('todos')
  const [fDia, setFDia] = useState('')

  useEffect(() => {
    ;(async () => {
      try {
        const [h, b, t, c] = await Promise.all([fetchBusinessHours(), fetchBlockedDates(), fetchTurnos(), fetchClients()])
        setHours(h)
        setBlocked(b)
        setTurnos(t)
        setClients(c)
      } catch (e) {
        setError(e.message)
      }
    })()
  }, [])

  const eventsMap = useMemo(() => {
    const map = {}
    for (const t of turnos) {
      if (!map[t.fecha]) map[t.fecha] = []
      map[t.fecha].push({
        id: t.id,
        fechaISO: t.fecha,
        titulo: t.cliente_nombre,
        hora: String(t.hora_inicio).slice(0, 5),
        color: colorEstado(t.estado),
      })
    }
    return map
  }, [turnos])

  const blockedSet = useMemo(() => new Set(blocked.map((b) => b.fecha)), [blocked])

  const hoursByDow = useMemo(() => {
    const m = {}
    hours.forEach((h) => (m[h.dia_semana] = h))
    return m
  }, [hours])

  const handleMonthChange = (y, m, delta) => {
    if (typeof delta === 'number') {
      const r = addMonths(y, m, delta)
      setYear(r.year)
      setMonth(r.month)
    } else {
      setYear(y)
      setMonth(m)
    }
  }

  const handleSelectDate = (iso) => {
    setSelectedISO(iso)
    setHora('')
    setClienteId('')
    setOkMsg('')
    setModalOpen(true)
    const [y, m] = iso.split('-').map(Number)
    if (y !== year || m - 1 !== month) {
      setYear(y)
      setMonth(m - 1)
    }
    setFDia(iso)
  }

  const reservar = async (e) => {
    e.preventDefault()
    if (!selectedISO || !hora) return setError('Elegí una hora para el turno.')
    const clienteSel = clients.find((c) => c.id === clienteId)
    const nombre = clienteSel
      ? `${clienteSel.nombre} ${clienteSel.apellido}`.trim()
      : form.nombre.trim()
    if (!clienteSel && nombre.length < 2) return setError('Ingresá el nombre del cliente.')
    setError('')
    setEnviando(true)
    try {
      await crearTurno({
        fecha: selectedISO,
        hora,
        clientId: clienteId || null,
        nombre,
        descripcion: form.descripcion.trim(),
      })
      const data = await fetchTurnos()
      setTurnos(data)
      setOkMsg(`Turno reservado para ${nombre} · ${selectedISO} · ${hora}`)
      setForm({ nombre: '', descripcion: '' })
      setClienteId('')
    } catch (e2) {
      setError(e2.message)
    } finally {
      setEnviando(false)
    }
  }

  const clienteCreado = (nuevo) => {
    setClients((prev) => {
      const next = [...prev.filter((c) => c.id !== nuevo.id), nuevo]
      next.sort((a, b) => `${a.apellido} ${a.nombre}`.localeCompare(`${b.apellido} ${b.nombre}`))
      return next
    })
    setClienteId(nuevo.id)
  }

  const cambiarEstado = async (id, estado) => {
    setError('')
    try {
      await updateEstadoTurno(id, estado)
      const data = await fetchTurnos()
      setTurnos(data)
    } catch (e) {
      setError(e.message)
    }
  }

  const turnosFiltrados = useMemo(() => {
    let list = [...turnos]
    if (fEstado !== 'todos') list = list.filter((t) => t.estado === fEstado)
    if (fDia) list = list.filter((t) => t.fecha === fDia)
    const q = busqueda.trim().toLowerCase()
    if (q) {
      list = list.filter(
        (t) =>
          (t.cliente_nombre || '').toLowerCase().includes(q) ||
          (t.descripcion || '').toLowerCase().includes(q)
      )
    }
    return list.sort((a, b) => `${a.fecha} ${a.hora_inicio}`.localeCompare(`${b.fecha} ${b.hora_inicio}`))
  }, [turnos, fEstado, fDia, busqueda])

  const diasConTurnos = useMemo(() => {
    const set = new Set()
    turnos.forEach((t) => set.add(t.fecha))
    if (fDia) set.add(fDia)
    return Array.from(set).sort()
  }, [turnos, fDia])

  return (
    <div className="neu-page">
      {error && <div className="neu-banner-error">{error}</div>}
      <div className="neu-main">
        <Calendar
          year={year}
          month={month}
          selectedISO={selectedISO}
          eventsMap={eventsMap}
          blockedSet={blockedSet}
          hoursByDow={hoursByDow}
          onMonthChange={handleMonthChange}
          onSelectDate={handleSelectDate}
        />

        <section className="neu-raised neu-reservas">
          <div className="neu-reservas-head">
            <h2>Reservas {fDia ? `· ${fDia}` : ''}</h2>
            <div className="neu-reservas-filtros">
              <input
                className="neu-input neu-full"
                placeholder="Buscar cliente o descripción…"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
              <select className="neu-select" value={fDia} onChange={(e) => setFDia(e.target.value)} aria-label="Filtrar por día">
                <option value="">Todos los días</option>
                {diasConTurnos.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
              <select className="neu-select" value={fEstado} onChange={(e) => setFEestado(e.target.value)} aria-label="Filtrar por estado">
                {ESTADOS.map((s) => (
                  <option key={s} value={s}>{s === 'todos' ? 'Todos los estados' : labelEstado(s)}</option>
                ))}
              </select>
            </div>
          </div>
          {turnosFiltrados.length === 0 ? (
            <p className="neu-muted">No hay reservas para los filtros elegidos.</p>
          ) : (
            <div className="neu-reserva-list">
              {turnosFiltrados.map((t) => (
                <div key={t.id} className="neu-reserva">
                  <div className="neu-reserva-info">
                    <strong>{String(t.hora_inicio).slice(0, 5)} · {t.cliente_nombre}</strong>
                    {t.descripcion && <span>{t.descripcion}</span>}
                  </div>
                  <span className="neu-reserva-estado" style={{ background: colorEstado(t.estado) }}>{labelEstado(t.estado)}</span>
                  {t.estado === 'pendiente' && (
                    <div className="neu-reserva-actions">
                      <button type="button" className="neu-pill-btn neu-btn-completar" onClick={() => cambiarEstado(t.id, 'completado')}>Completar</button>
                      <button type="button" className="neu-pill-btn neu-btn-cancelar" onClick={() => cambiarEstado(t.id, 'cancelado')}>Cancelar</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <BookingModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        fechaISO={selectedISO}
        events={eventsMap[selectedISO] || []}
        clients={clients}
        clienteId={clienteId}
        setClienteId={setClienteId}
        onClienteCreado={clienteCreado}
        hora={hora}
        setHora={setHora}
        form={form}
        setForm={setForm}
        reservar={reservar}
        enviando={enviando}
        okMsg={okMsg}
      />
    </div>
  )
}
