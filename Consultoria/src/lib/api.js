import { supabase, supabaseConfigured } from './supabaseClient'
import { NEGOCIO } from './config'

function errMsg(e, fallback) {
  return e?.message || fallback || 'Ocurrió un error. Probá de nuevo.'
}

function isDniDuplicate(e) {
  return e?.code === '23505' && String(e?.message || '').includes('clients_dni_unique')
}

function isoOffset(days) {
  const n = new Date()
  n.setDate(n.getDate() + days)
  const y = n.getFullYear()
  const m = String(n.getMonth() + 1).padStart(2, '0')
  const d = String(n.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function nombreCompleto(c) {
  return `${c.nombre || ''} ${c.apellido || ''}`.trim()
}

// Datos mock para trabajar sin Supabase configurado
const MOCK_CLIENTS = [
  { id: 'mock-c1', nombre: 'María', apellido: 'López', telefono: '2921 421616', dni: '30111222', direccion: 'Av. San Martín 123', obra_social: 'OSDE', notas: 'Alergia a la penicilina', activo: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'mock-c2', nombre: 'Carlos', apellido: 'Gómez', telefono: '2921 555444', dni: '28444555', direccion: 'Belgrano 456', obra_social: 'Swiss Medical', notas: '', activo: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'mock-c3', nombre: 'Ana', apellido: 'Torres', telefono: '2921 777888', dni: '33666777', direccion: 'Rivadavia 789', obra_social: 'IOMA', notas: 'Paciente con ortodoncia', activo: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
]

export const MOCK = {
  business_hours: [
    { dia_semana: 0, abre: '09:00', cierra: '13:00', activo: false },
    { dia_semana: 1, abre: '09:00', cierra: '18:00', activo: true },
    { dia_semana: 2, abre: '09:00', cierra: '18:00', activo: true },
    { dia_semana: 3, abre: '09:00', cierra: '18:00', activo: true },
    { dia_semana: 4, abre: '09:00', cierra: '18:00', activo: true },
    { dia_semana: 5, abre: '09:00', cierra: '18:00', activo: true },
    { dia_semana: 6, abre: '09:00', cierra: '13:00', activo: true },
  ],
  blocked_dates: [],
  clients: MOCK_CLIENTS,
  turnos: [
    { id: 'mock-t1', fecha: isoOffset(0), hora_inicio: '10:00', hora_fin: '10:30', cliente_nombre: 'María López', client_id: 'mock-c1', descripcion: 'Limpieza dental', estado: 'pendiente', created_at: new Date().toISOString() },
    { id: 'mock-t2', fecha: isoOffset(1), hora_inicio: '11:30', hora_fin: '12:00', cliente_nombre: 'Carlos Gómez', client_id: 'mock-c2', descripcion: 'Ortodoncia', estado: 'completado', created_at: new Date().toISOString() },
    { id: 'mock-t3', fecha: isoOffset(2), hora_inicio: '09:00', hora_fin: '09:30', cliente_nombre: 'Ana Torres', client_id: 'mock-c3', descripcion: 'Dolor post-extracción', estado: 'cancelado', created_at: new Date().toISOString() },
  ],
}

export async function fetchBusinessHours() {
  if (!supabaseConfigured) return MOCK.business_hours
  const { data, error } = await supabase.from('business_hours').select('*').order('dia_semana')
  if (error) throw new Error(errMsg(error, 'No se pudieron cargar los horarios.'))
  return data.length ? data : MOCK.business_hours
}

export async function fetchBlockedDates() {
  if (!supabaseConfigured) return []
  const { data, error } = await supabase.from('blocked_dates').select('*').order('fecha')
  if (error) throw new Error(errMsg(error, 'No se pudieron cargar los días bloqueados.'))
  return data
}

export async function fetchOcupados(fechaISO) {
  if (!supabaseConfigured) return []
  const rpc = await supabase.rpc('get_ocupados', { p_fecha: fechaISO })
  if (!rpc.error) return rpc.data || []
  const { data, error } = await supabase
    .from('appointments')
    .select('hora_inicio, hora_fin')
    .eq('fecha', fechaISO)
    .in('estado', ['pendiente', 'completado'])
  if (error) return []
  return data
}

export async function fetchTurnos() {
  if (!supabaseConfigured) return MOCK.turnos
  const { data, error } = await supabase
    .from('appointments')
    .select('*')
    .order('fecha', { ascending: true })
    .order('hora_inicio', { ascending: true })
  if (error) throw new Error(errMsg(error, 'No se pudieron cargar los turnos.'))
  return data || []
}

export async function fetchClients() {
  if (!supabaseConfigured) return MOCK.clients.filter((c) => c.activo)
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('activo', true)
    .order('apellido', { ascending: true })
    .order('nombre', { ascending: true })
  if (error) throw new Error(errMsg(error, 'No se pudieron cargar los clientes.'))
  return data || []
}

export async function crearCliente({ nombre, apellido, telefono, dni, direccion, obra_social, notas }) {
  const payload = {
    nombre: (nombre || '').trim(),
    apellido: (apellido || '').trim(),
    telefono: (telefono || '').trim(),
    dni: (dni || '').trim(),
    direccion: (direccion || '').trim(),
    obra_social: (obra_social || '').trim(),
    notas: (notas || '').trim(),
  }

  if (!supabaseConfigured) {
    if (payload.dni && MOCK.clients.some((c) => c.activo && c.dni === payload.dni)) {
      throw new Error('Ya existe un cliente con ese DNI.')
    }
    const nuevo = {
      id: 'mock-c' + Date.now(),
      ...payload,
      activo: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    MOCK.clients = [nuevo, ...MOCK.clients]
    return nuevo
  }

  const { data, error } = await supabase.from('clients').insert(payload).select().single()
  if (error) {
    if (isDniDuplicate(error)) throw new Error('Ya existe un cliente con ese DNI.')
    throw new Error(errMsg(error, 'No se pudo crear el cliente.'))
  }
  return data
}

export async function actualizarCliente(id, datos) {
  const payload = {
    nombre: (datos.nombre || '').trim(),
    apellido: (datos.apellido || '').trim(),
    telefono: (datos.telefono || '').trim(),
    dni: (datos.dni || '').trim(),
    direccion: (datos.direccion || '').trim(),
    obra_social: (datos.obra_social || '').trim(),
    notas: (datos.notas || '').trim(),
    updated_at: new Date().toISOString(),
  }

  if (!supabaseConfigured) {
    if (payload.dni && MOCK.clients.some((c) => c.activo && c.id !== id && c.dni === payload.dni)) {
      throw new Error('Ya existe un cliente con ese DNI.')
    }
    MOCK.clients = MOCK.clients.map((c) => (c.id === id ? { ...c, ...payload } : c))
    return MOCK.clients.find((c) => c.id === id)
  }

  const { data, error } = await supabase.from('clients').update(payload).eq('id', id).select().single()
  if (error) {
    if (isDniDuplicate(error)) throw new Error('Ya existe un cliente con ese DNI.')
    throw new Error(errMsg(error, 'No se pudo actualizar el cliente.'))
  }
  return data
}

export async function archivarCliente(id) {
  if (!supabaseConfigured) {
    MOCK.clients = MOCK.clients.map((c) => (c.id === id ? { ...c, activo: false } : c))
    return
  }
  const { error } = await supabase
    .from('clients')
    .update({ activo: false, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw new Error(errMsg(error, 'No se pudo archivar el cliente.'))
}

export async function fetchTurnosDeCliente(clientId) {
  if (!supabaseConfigured) {
    return MOCK.turnos
      .filter((t) => t.client_id === clientId)
      .sort((a, b) => `${b.fecha} ${b.hora_inicio}`.localeCompare(`${a.fecha} ${a.hora_inicio}`))
  }
  const { data, error } = await supabase
    .from('appointments')
    .select('*')
    .eq('client_id', clientId)
    .order('fecha', { ascending: false })
    .order('hora_inicio', { ascending: false })
  if (error) throw new Error(errMsg(error, 'No se pudo cargar el historial.'))
  return data || []
}

export async function crearTurno({ fecha, hora, clientId = null, nombre, descripcion }) {
  if (!supabaseConfigured) {
    await new Promise((r) => setTimeout(r, 600))
    const cliente = clientId ? MOCK.clients.find((c) => c.id === clientId) : null
    const nombreFinal = cliente ? nombreCompleto(cliente) : (nombre || '').trim()
    const [h, m] = hora.split(':').map(Number)
    const total = h * 60 + (m || 0) + NEGOCIO.duracionMin
    const fin = `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
    const nuevo = {
      id: 'mock-' + Date.now(),
      fecha,
      hora_inicio: hora,
      hora_fin: fin,
      cliente_nombre: nombreFinal,
      client_id: clientId || null,
      descripcion: descripcion || '',
      estado: 'pendiente',
      created_at: new Date().toISOString(),
    }
    MOCK.turnos = [nuevo, ...MOCK.turnos]
    return nuevo
  }

  const { data, error } = await supabase.rpc('crear_turno', {
    p_fecha: fecha,
    p_hora: hora,
    p_client_id: clientId || null,
    p_nombre: nombre || '',
    p_descripcion: descripcion || '',
    p_duracion_min: NEGOCIO.duracionMin,
  })
  if (error) throw new Error(errMsg(error))
  return data
}

export async function actualizarTurno(id, { fecha, hora, clientId = null, nombre, descripcion }) {
  if (!supabaseConfigured) {
    await new Promise((r) => setTimeout(r, 400))
    const cliente = clientId ? MOCK.clients.find((c) => c.id === clientId) : null
    const nombreFinal = cliente ? nombreCompleto(cliente) : (nombre || '').trim()
    const [h, m] = hora.split(':').map(Number)
    const total = h * 60 + (m || 0) + NEGOCIO.duracionMin
    const fin = `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
    MOCK.turnos = MOCK.turnos.map((t) =>
      t.id === id
        ? { ...t, fecha, hora_inicio: hora, hora_fin: fin, cliente_nombre: nombreFinal, client_id: clientId || null, descripcion: descripcion || '' }
        : t
    )
    return MOCK.turnos.find((t) => t.id === id)
  }

  const { data, error } = await supabase.rpc('actualizar_turno', {
    p_id: id,
    p_fecha: fecha,
    p_hora: hora,
    p_client_id: clientId || null,
    p_nombre: nombre || '',
    p_descripcion: descripcion || '',
    p_duracion_min: NEGOCIO.duracionMin,
  })
  if (error) throw new Error(errMsg(error))
  return data
}

export async function updateEstadoTurno(id, estado) {
  const { error } = await supabase.from('appointments').update({ estado }).eq('id', id)
  if (error) throw new Error(errMsg(error))
}
