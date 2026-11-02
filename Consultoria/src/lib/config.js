// Config central de la agenda dental. Todo editable por env, con defaults del negocio.
export const NEGOCIO = {
  nombre: import.meta.env.VITE_NEGOCIO_NOMBRE || 'Dentista',
  duracionMin: Number(import.meta.env.VITE_DURACION_TURNO) || 30,
  moneda: 'ARS',
}

export const WHATSAPP = {
  // Solo dígitos para wa.me
  number: (import.meta.env.VITE_WHATSAPP_NUMBER || '542921421616').replace(/\D/g, ''),
  display: import.meta.env.VITE_WHATSAPP_DISPLAY || '+54 2921 42-1616',
}

export const ESTADOS_RESERVA = [
  { valor: 'pendiente', label: 'Pendiente', color: '#d9b96a' },
  { valor: 'completado', label: 'Completado', color: '#7fb98a' },
  { valor: 'cancelado', label: 'Cancelado', color: '#d97a7a' },
]

export function colorEstado(estado) {
  const e = ESTADOS_RESERVA.find((x) => x.valor === estado)
  return e ? e.color : '#9aa3b2'
}

export function labelEstado(estado) {
  const e = ESTADOS_RESERVA.find((x) => x.valor === estado)
  return e ? e.label : estado
}

export function whatsappLink(mensaje) {
  const texto = encodeURIComponent(mensaje || `Hola ${NEGOCIO.nombre}, quiero consultar por mi turno.`)
  return `https://wa.me/${WHATSAPP.number}?text=${texto}`
}

export function formatoPrecio(valor) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(valor ?? 0)
}
