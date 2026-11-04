import { useEffect, useState } from 'react'
import { crearCliente, actualizarCliente } from '../../lib/api'

const VACIO = { nombre: '', apellido: '', telefono: '', dni: '', direccion: '', obra_social: '', notas: '' }

export default function ClientFormModal({ cliente, onClose, onSaved }) {
  const [form, setForm] = useState(VACIO)
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setForm(cliente ? { ...VACIO, ...cliente } : VACIO)
    setError('')
  }, [cliente])

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  const set = (campo, valor) => setForm((f) => ({ ...f, [campo]: valor }))

  const guardar = async (e) => {
    e.preventDefault()
    if (form.nombre.trim().length < 2) return setError('Ingresá el nombre (mínimo 2 letras).')
    const dni = form.dni.replace(/\D/g, '')
    if (dni && (dni.length < 7 || dni.length > 8)) return setError('El DNI debe tener 7 u 8 dígitos.')

    setError('')
    setEnviando(true)
    try {
      const datos = {
        nombre: form.nombre.trim(),
        apellido: form.apellido.trim(),
        telefono: form.telefono.trim(),
        dni,
        direccion: form.direccion.trim(),
        obra_social: form.obra_social.trim(),
        notas: form.notas.trim(),
      }
      if (cliente) await actualizarCliente(cliente.id, datos)
      else await crearCliente(datos)
      onSaved()
    } catch (e2) {
      setError(e2.message)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="neu-modal-overlay" onClick={onClose} role="presentation">
      <div
        className="neu-raised neu-modal"
        role="dialog"
        aria-modal="true"
        aria-label={cliente ? 'Editar cliente' : 'Nuevo cliente'}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="neu-modal-head">
          <div>
            <h2>{cliente ? 'Editar cliente' : 'Nuevo cliente'}</h2>
            <p className="neu-muted">Los campos con * son obligatorios.</p>
          </div>
          <button className="neu-circle-btn" onClick={onClose} aria-label="Cerrar">×</button>
        </div>

        <form onSubmit={guardar} className="neu-form">
          <div className="neu-form-row">
            <label className="neu-label">Nombre *
              <input className="neu-input" value={form.nombre} onChange={(e) => set('nombre', e.target.value)} required />
            </label>
            <label className="neu-label">Apellido
              <input className="neu-input" value={form.apellido} onChange={(e) => set('apellido', e.target.value)} />
            </label>
          </div>

          <div className="neu-form-row">
            <label className="neu-label">Teléfono
              <input className="neu-input" value={form.telefono} onChange={(e) => set('telefono', e.target.value)} />
            </label>
            <label className="neu-label">DNI
              <input className="neu-input" inputMode="numeric" value={form.dni} onChange={(e) => set('dni', e.target.value)} placeholder="7 u 8 dígitos" />
            </label>
          </div>

          <label className="neu-label">Dirección
            <input className="neu-input" value={form.direccion} onChange={(e) => set('direccion', e.target.value)} />
          </label>

          <label className="neu-label">Obra social
            <input className="neu-input" value={form.obra_social} onChange={(e) => set('obra_social', e.target.value)} />
          </label>

          <label className="neu-label">Notas / descripción
            <textarea className="neu-input" rows={3} value={form.notas} onChange={(e) => set('notas', e.target.value)} />
          </label>

          <button className="neu-pill-btn neu-primary" disabled={enviando}>
            {enviando ? 'Guardando…' : 'Guardar'}
          </button>
          {error && <p className="neu-error">{error}</p>}
        </form>
      </div>
    </div>
  )
}
