import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabaseConfigured = Boolean(url && anonKey)

if (!supabaseConfigured) {
  console.warn(
    '[Intex] Faltan VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY. Copiá .env.example a .env y completalo.'
  )
}

// Usamos valores placeholder para no romper la app en modo sin configurar (usa datos mock)
export const supabase = createClient(
  url || 'https://placeholder.supabase.co',
  anonKey || 'placeholder-anon-key'
)
