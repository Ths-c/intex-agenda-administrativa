import { Link, NavLink } from 'react-router-dom'
import { NEGOCIO } from '../../lib/config'

export default function NeuHeader() {
  return (
    <header className="neu-header neu-raised">
      <Link to="/" className="neu-brand">
        <span className="neu-logo neu-logo-tooth" aria-hidden="true">🦷</span>
        <span className="neu-brand-text">
          <strong>{NEGOCIO.nombre}</strong>
          <small>Agenda odontológica</small>
        </span>
      </Link>
      <div className="neu-header-right">
        <nav className="neu-nav" aria-label="Secciones">
          <NavLink to="/" end>Agenda</NavLink>
          <NavLink to="/clientes">Clientes</NavLink>
        </nav>
      </div>
    </header>
  )
}
