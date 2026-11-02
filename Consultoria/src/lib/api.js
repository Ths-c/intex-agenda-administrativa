import { supabase, supabaseConfigured } from './supabaseClient'
import { NEGOCIO } from './config'

function errMsg(e, fallback) {
  return e?.message || fallback || 'Ocurrió un error. Probá de nuevo.'
}

function isoOffset(days) {
  const n = new Date()
  n.setDate(n.getDate() + days)
  const y = n.getFullYear()
  const m = String(n.getMonth() + 1).padStart(2, '0')
  const d = String(n.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

// Datos mock para trabajar sin Supabase configurado
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
  turnos: [
    { id: 'mock-t1', fecha: isoOffset(0), hora_inicio: '10:00', hora_fin: '10:30', cliente_nombre: 'María López', descripcion: 'Limpieza dental', estado: 'pendiente', created_at: new Date().toISOString() },
    { id: 'mock-t2', fecha: isoOffset(1), hora_inicio: '11:30', hora_fin: '12:00', cliente_nombre: 'Carlos Gómez', descripcion: 'Ortodoncia', estado: 'completado', created_at: new Date().toISOString() },
    { id: 'mock-t3', fecha: isoOffset(2), hora_inicio: '09:00', hora_fin: '09:30', cliente_nombre: 'Ana Torres', descripcion: 'Dolor post-extracción', estado: 'cancelado', created_at: new Date().toISOString() },
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

export async function crearTurno({ fecha, hora, nombre, descripcion }) {
  if (!supabaseConfigured) {
    await new Promise((r) => setTimeout(r, 600))
    const [h, m] = hora.split(':').map(Number)
    const total = h * 60 + (m || 0) + NEGOCIO.duracionMin
    const fin = `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
    const nuevo = {
      id: 'mock-' + Date.now(),
      fecha,
      hora_inicio: hora,
      hora_fin: fin,
      cliente_nombre: nombre,
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
    p_nombre: nombre,
    p_descripcion: descripcion,
    p_email: '',
    p_telefono: '',
    p_notas: '',
    p_duracion_min: NEGOCIO.duracionMin,
  })
  if (error) throw new Error(errMsg(error))
  return data
}

export async function updateEstadoTurno(id, estado) {
  const { error } = await supabase.from('appointments').update({ estado }).eq('id', id)
  if (error) throw new Error(errMsg(error))
}
