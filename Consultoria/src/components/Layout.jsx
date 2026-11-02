import { NEGOCIO, WHATSAPP } from '../lib/config'
import { supabaseConfigured } from '../lib/supabaseClient'
import NeuHeader from './neu/NeuHeader'

export default function Layout({ children }) {
  return (
    <div className="shell">
      <NeuHeader />

      {!supabaseConfigured && (
        <div className="banner warn" style={{ margin: '0 20px' }}>
          ⚠ Supabase sin configurar — la app usa datos de ejemplo. Completá el
          archivo <code>.env</code> (ver <code>.env.example</code> y <code>supabase/schema.sql</code>).
        </div>
      )}

      <main className="main">{children}</main>

      <div className="footer-legacy">
        {NEGOCIO.nombre} · Para cancelar o reprogramar escribinos por WhatsApp al {WHATSAPP.display}
      </div>
    </div>
  )
}
