# 🦷 Intex · Agenda Dental — Gestión de turnos

App interna de gestión de turnos para dentista. React 19 + Vite 8 + Supabase.

## Qué hace

- **Calendario mensual** de turnos (días bloqueados y horarios laborales configurables).
- **Click en un día** → se abre el formulario de reserva con **hora del turno**, **nombre del cliente** y **descripción**.
- **Debajo del calendario**: lista de **reservas**, con:
  - Buscador por **nombre del cliente** o **descripción**.
  - Filtro por **día**.
  - Filtro por **estado**.
- Desde la lista se pueden **completar** o **cancelar** una reserva; el **estado se ve en el color** de la reserva.

## Estados de reserva

- `pendiente` → color ámbar
- `completado` → color verde
- `cancelado` → color rojo

## Puesta en marcha

1. Crear proyecto Supabase → copiar **Project URL** y **anon public key**.
2. Copiar `.env.example` a `.env` y completar:
   ```
   VITE_SUPABASE_URL=https://xxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJ...
   ```
3. En Supabase → **SQL Editor** → pegar y ejecutar `supabase/schema.sql`.
4. `npm install` → `npm run dev`.

## Estructura

- `/` → calendario + reservas (única vista de la app).
