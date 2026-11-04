# 🦷 Intex · Agenda Dental — Gestión de turnos

App interna de gestión de turnos para dentista. React 19 + Vite 8 + Supabase.

## Qué hace

- **Calendario mensual** de turnos (días bloqueados y horarios laborales configurables).
- **Click en un día** → se abre el formulario de reserva con **hora del turno**, **cliente** y **descripción**.
- **Pestaña Clientes**: ABM de clientes con historial de reservas.
- **Debajo del calendario**: lista de **reservas**, con:
  - Buscador por **nombre del cliente** o **descripción**.
  - Filtro por **día**.
  - Filtro por **estado**.
- Desde la lista se pueden **completar** o **cancelar** una reserva; el **estado se ve en el color** de la reserva.
- Las reservas son **clickeables**: abren un detalle con **Modificar** (fecha, hora, cliente y descripción).

## Clientes

- Datos atomizados: **nombre**, **apellido**, **teléfono**, **DNI**, **dirección**, **obra social** y **notas/descripción**.
- El DNI es opcional, pero **único** cuando se completa.
- ABM completo: alta, edición y **archivado** (baja lógica, conserva el historial).
- Buscador por nombre, DNI, teléfono u obra social.
- Cada cliente tiene su **historial de reservas** (todos los estados).
- Al reservar se puede elegir un cliente registrado o usar la opción **“Otro / sin registrar”** con nombre libre.
- **Alta rápida desde la reserva**: “＋ Nuevo cliente” permite crear nombre, apellido, teléfono y DNI sin salir del modal.

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
   - El script es re-ejecutable y hace **backfill**: crea clientes a partir de los
     turnos existentes (`cliente_nombre`) y los vincula.
4. `npm install` → `npm run dev`.

## Estructura

- `/` → calendario + reservas.
- `/clientes` → listado, ABM e historial de clientes.
