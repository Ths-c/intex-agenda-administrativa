# 📋 Análisis del Proyecto — Intex · Agenda de Turnos

> Peluquería **Intex** — agenda mensual de turnos con reserva pública + panel admin.
> React 19 + Vite 8 + Supabase (Auth + Postgres + RPCs) · En español (Argentina).

---

## 1. Resumen general

Aplicación web para gestionar la agenda de turnos de un establecimiento de peluquería.
Los clientes reservan turnos online desde un calendario neumórfico; los administradores
gestionan servicios, horarios y días libres, y consultan el dashboard de actividad.

- **Propósito:** permitir reserva online de cortes (precio base: $20.000 ARS) y centralizar
  la operación del local en un panel privado.
- **Contexto de negocio:** moneda en pesos argentinos (ARS), zona horaria
  `America/Argentina/Buenos_Aires`.

---

## 2. Stack tecnológico

| Capa | Tecnología |
|---|---|
| UI | React 19 + ReactDOM 19 |
| Build | Vite 8 + @vitejs/plugin-react |
| Routing | react-router-dom 7 |
| Backend / DB | Supabase (PostgreSQL, Auth, RPCs `security definer`) |
| Cliente Supabase | `@supabase/supabase-js` ^2.117 |
| Estilos | CSS puro (clases custom, neumorfismo) |
| Linting | ESLint 10 + react-hooks + react-refresh |

Scripts (`package.json`):
- `npm run dev` → Vite dev server
- `npm run build` → build de producción
- `npm run lint` → ESLint
- `npm run preview` → preview del build

---

## 3. Funcionalidades detectadas

### Público
- **Reserva (`/`)** — `src/pages/Agenda.jsx`:
  - Calendario mensual (grid 5/6 semanas, días del mes anterior/posterior).
  - Días bloqueados (`blocked_dates`) y días inactivos (`business_hours`) deshabilitados.
  - Generación de slots por duración del servicio + solape con ocupados.
  - Slots pasados (hoy) marcados como no disponibles.
  - Modal de booking con selección de servicio, hora, datos del cliente.
  - Confirmación + link de WhatsApp.

- **Mis turnos (`/mis-turnos`)** — `src/pages/MisTurnos.jsx`:
  - Búsqueda por email → RPC `get_mis_turnos`.
  - Cancelación delegada por WhatsApp (no se cancela desde la web).

### Admin (protegido por `Protected` + `AuthContext`)
- **Login** (`/admin/login`) — Supabase Auth con email/password.
- **Dashboard** (`/admin`) — heatmap de actividad + stat cards + lista de turnos del día.
- **Servicios** (`/admin/servicios`) — CRUD de servicios (nombre, descripción, duración, precio, activo).
- **Horarios** (`/admin/horarios`) — edición de `business_hours` por día de semana.
- **Días libres** (`/admin/dias-libres`) — alta/baja de `blocked_dates`.

---

## 4. Arquitectura de carpetas

```
Consultoria/
├── index.html
├── vite.config.js
├── package.json
├── supabase/
│   └── schema.sql            # Schema + RLS + RPCs
├── public/
├── src/
│   ├── main.jsx, App.jsx, App.css, index.css, admin-dark.css
│   ├── context/
│   │   └── AuthContext.jsx
│   ├── lib/                   # Logica y acceso a datos
│   ├── components/
│   │   ├── Layout.jsx
│   │   ├── neu/               # Calendario neumorfico + BookingModal + SocialFooter
│   │   └── admin/
│   └── pages/
│       ├── Agenda.jsx
│       ├── Reserva.jsx
│       ├── MisTurnos.jsx
│       └── admin/
└── dist/
```

---

## 5. Base de datos — `supabase/schema.sql`

Tablas: `services`, `business_hours`, `blocked_dates`, `appointments`.

Seguridad / concurrencia:
- RLS: lectura publica de services / business_hours / blocked_dates;
  appointments solo via RPC + politica `authenticated` para admin.
- Anti-doble-reserva: indice unico parcial
  `appointments_no_dup ON (fecha, hora_inicio) WHERE estado IN ('pendiente','confirmado')`
  + validacion de solape transaccional en RPC `crear_turno`.
- RPCs (`security definer`):
  - `get_ocupados(p_fecha)` -> horas ocupadas (sin PII).
  - `get_mis_turnos(p_email)` -> turnos por email (sin exponer otros clientes).
  - `crear_turno(...)` -> validaciones + insert transaccional.

---

## 6. Observaciones y posibles deudas tecnicas

1. Ruta `/reserva` no registrada en `App.jsx` (el wizard existe en `src/pages/Reserva.jsx` pero no se usa).
2. Dashboard admin usa datos mock (`generateActivity`, `getAdminStats`) aunque exista backend.
3. Agenda no consume appointments reales para los eventos del calendario (usa `mockEvents`).
4. Header publico (`NeuHeader`) muestra usuario mock, no el usuario real de Supabase.
5. Dos sistemas de navegacion conviven en `Layout.jsx` (NeuHeader + top-legacy-nav/footer-legacy).
6. `fetchMisTurnos` devuelve `[]` sin manejo de error si falla el RPC.

---

## 7. Puesta en marcha (resumen)

1. Crear proyecto Supabase -> copiar Project URL + anon key.
2. Completar `.env` (ver `.env.example`).
3. Ejecutar `supabase/schema.sql` en el SQL Editor.
4. Crear usuario admin en Supabase Auth -> deshabilitar sign-ups publicos.
5. `npm install` -> `npm run dev`.

---

## 8. Conclusion

Proyecto bien estructurado con separacion de capas (pages / components / lib / context),
logica de slots desacoplada y segura en el backend (RPC transaccional con anti-solape).
Los puntos debiles identificados estan relacionados principalmente con la persistencia visual
de eventos y la migracion de datos mock -> real en el panel admin.

---

*Analisis generado a partir de la lectura del codigo fuente en `Consultoria/`.
Fecha: 2026-10-30*
