# Mototaxi — "Alquiler Motos C.V"

App web instalable (PWA), publicada como **Alquiler Motos C.V** en https://mototaxi-66v.pages.dev, para que el dueño de motos alquiladas por día registre desde su iPhone los pagos de cada encargado y los gastos, confirme cada pago por WhatsApp y vea cuánto le genera cada moto.

> Este README es **bitácora viva del proyecto**. Cada iteración suma una sección al final con lo que se hizo, las decisiones tomadas, problemas encontrados y pendientes. Está pensado para que cualquiera (incluyendo Claude en sesiones futuras) pueda recuperar contexto rápido.

## Arquitectura general

```
iPhone (Safari, ícono en pantalla de inicio)
   │  PWA: React + Vite + TypeScript
   ├──► Supabase Auth + Postgres (RLS)
   └──► WhatsApp (enlace wa.me con texto listo)

Cloudflare Pages  ◄── publica con cada push a main
GitHub Actions    ──► tests + keep-alive de Supabase (cron)
```

## Stack técnico

- **Frontend:** React + Vite + TypeScript, PWA
- **Backend:** Supabase (Auth + Postgres con Row Level Security)
- **Hosting:** Cloudflare Pages
- **CI:** GitHub Actions
- **Tests:** Vitest

## URLs y endpoints

| Servicio | URL |
|---|---|
| App (producción) | https://mototaxi-66v.pages.dev — **ojo:** `mototaxi.pages.dev` (sin sufijo) es de otra persona |
| Repositorio | https://github.com/santivillarreal19/mototaxi (privado) |
| Hosting | Cloudflare → Workers & Pages → proyecto `mototaxi` (tipo **Pages**, no Worker) |
| Base de datos y usuarios | Panel de Supabase del proyecto (vinculado con el CLI: `supabase/.temp/`) |

## Componentes desplegados

| Componente | Cómo se despliega |
|---|---|
| Frontend | Cloudflare Pages compila (`npm run build` → `dist`) y publica con cada push a `main`. Variables en Cloudflare (Production, tipo Text): `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `NODE_VERSION=22` |
| Esquema de la base | Migraciones en `supabase/migrations/`, aplicadas con `npx supabase db push` **antes** de publicar el código que las usa |
| CI y keep-alive | GitHub Actions (`.github/workflows/`). El keep-alive necesita los secrets `SUPABASE_URL` y `SUPABASE_ANON_KEY` |

## Decisiones de arquitectura clave

| Decisión | Razón |
|---|---|
| PWA en lugar de app nativa | El cliente usa iPhone y no se paga la cuenta Apple Developer (USD 99/año) |
| React en lugar de Flutter web | En Safari, Flutter web es pesado y no se siente nativo; la web nativa usa los controles de iOS |
| Supabase | Modelo relacional (motos → movimientos); plan gratuito |
| WhatsApp `wa.me` disparado por botón | Gratis y sin servidor; iOS exige un toque del usuario para abrir otra app |

Detalle completo: [spec de diseño](docs/superpowers/specs/2026-10-15-mototaxi-design.md).

## Iteraciones planificadas

| # | Objetivo | Estado |
|---|---|---|
| 0 | Diseño y spec | ✅ Completada |
| 1 | Implementación v1 (motos, pagos, gastos, totales, WhatsApp, PWA) y despliegue | ✅ Desplegada (2026-10-16) |
| 2 | Pedidos del cliente: nombre "Alquiler Motos C.V", categorías de gasto propias, pago de varios días | 🚧 Código completo, migración y deploy pendientes |

## Bitácora de iteraciones

### Iteración 0 — Diseño y spec

| | |
|---|---|
| **Fecha** | 2026-10-15 |
| **Estado** | ✅ Completada |
| **Objetivo** | Definir con el cliente cómo llevar las cuentas del alquiler diario de motos y avisar al encargado de cada pago. |

#### Qué se hizo
- Brainstorming del diseño y spec escrita en [docs/superpowers/specs/2026-10-15-mototaxi-design.md](docs/superpowers/specs/2026-10-15-mototaxi-design.md).
- Repo inicializado con `.gitignore` y este README.

#### Decisiones tomadas (con el usuario)
- **Santiago Villarreal Maya** eligió la PWA, porque el cliente tiene iPhone y no se pagará la cuenta Apple Developer.
- **Santiago** eligió React + Vite + TS sobre Flutter web.
- **Santiago** eligió guardar en la nube (Supabase) con inicio de sesión, en lugar de guardar solo en el celular.
- **Santiago** eligió el mensaje por WhatsApp con el texto listo (el cliente toca enviar).
- Varias motos desde la v1 (placa, tarifa diaria, encargado con nombre y teléfono).
- Proyecto de cliente propio (no AYNN-OROEXPRESS), con repo en GitHub.

#### ⏳ Diferido — NO perder
- ⏳ **Historial de encargados por moto** — por ahora el encargado se edita en la moto. Retomar si el cliente necesita saber cuánto pagó cada persona.
- ⏳ **Funcionamiento sin conexión** — guardar exige internet. Retomar si hay problemas de señal.
- ⏳ **Exportar a Excel o CSV** — no se pidió. Retomar si lo necesita el contador.
- ⏳ **App nativa iOS/Android** — bloqueada por el costo de la cuenta Apple.
- ~~Días sin pago o deuda del encargado~~ — **descartado** por decisión del cliente: los días sin pago quedan vacíos.

---

### Iteración 1 — Implementación v1 y despliegue

| | |
|---|---|
| **Fecha** | 2026-10-15 a 2026-10-16 |
| **Estado** | ✅ Desplegada (2026-10-16) en https://mototaxi-66v.pages.dev |
| **Objetivo** | Construir la v1 de la [spec](docs/superpowers/specs/2026-10-15-mototaxi-design.md) y publicarla para usarla desde el iPhone del cliente. |

#### Qué se hizo
- v1 completa (commits de la rama `feat/v1`): motos, pagos, gastos, totales por período, confirmación por WhatsApp, PWA instalable, CI y keep-alive en GitHub Actions. Probada en iPhone real.
- 2026-10-16: repo privado creado en GitHub (`santivillarreal19/mototaxi`), `feat/v1` integrada a `main` (fast-forward) y proyecto **Cloudflare Pages** conectado al repo: publica con cada push a `main`.

#### Decisiones tomadas (con el usuario)
- **Santiago** eligió Cloudflare Pages (gratis y sin límite de ancho de banda). Se descartó Vercel porque su plan gratuito no permite uso comercial, y GitHub Pages porque obliga a ajustar rutas y `base`.
- Repo **privado**.

#### Problemas encontrados y solución
- **El panel de Cloudflare lleva primero a crear un Worker** (pide `npx wrangler deploy`). Sin `wrangler.jsonc` ese camino no sirve la SPA. Solución: crear el proyecto como **Pages** (`/workers-and-pages/create/pages`, preset React (Vite)).
- **`mototaxi.pages.dev` ya era de otra persona**, así que Cloudflare asignó `mototaxi-66v.pages.dev`.
- **Pantalla en blanco tras el primer deploy:** las variables quedaron mal cargadas en Cloudflare (la URL con el valor `.env` y la clave vacía), y [supabase.ts](src/data/supabase.ts) lanza un error si faltan. Se diagnosticó leyendo el bundle publicado. Solución: corregir las variables (tipo Text, sin comillas) y hacer **Retry deployment**, porque las variables solo aplican a deploys nuevos.

#### ⏳ Diferido — NO perder
- ⏳ **Site URL y Redirect URLs de Supabase** → `https://mototaxi-66v.pages.dev` (y `/**`). Pendiente de Santiago, en el panel. Mientras tanto, los correos de Auth apuntan a localhost.
- ⏳ **Secrets del keep-alive en GitHub** (`SUPABASE_URL`, `SUPABASE_ANON_KEY`): pendiente con `gh secret set`. El permiso de Claude Code bloqueó cargarlos automáticamente.
- ⏳ **El CI no se disparó con el primer push** del repo (los workflows están activos). Verificar que corra con el siguiente push.

---

### Iteración 2 — Pedidos del cliente: nombre, categorías propias y pago de varios días

| | |
|---|---|
| **Fecha** | 2026-10-16 |
| **Estado** | 🚧 Código completo en la rama `feat/pedidos-cliente-2026-10-16`. Falta aplicar la migración y publicar |
| **Objetivo** | Tres pedidos del cliente: (1) llamar la app "Alquiler Motos C.V"; (2) que cada usuario pueda crear sus propias categorías de gasto; (3) registrar pagos adelantados de hasta 2 semanas, eligiendo qué días cubre el pago. |

#### Qué se hizo
- **Nombre:** título, login, inicio y manifest. Bajo el ícono del iPhone se lee "Alquiler Motos". **En el iPhone hay que borrar el ícono y volver a "Agregar a inicio"**, porque iOS guarda el nombre al instalar. Los datos no se pierden.
- **Migración** [20261016120000_categorias_y_pagos_varios_dias.sql](supabase/migrations/20261016120000_categorias_y_pagos_varios_dias.sql):
  - Tabla `categorias_gasto` con RLS por dueño y nombre único por usuario (sin distinguir mayúsculas). Cada usuario existente recibe las 5 categorías de la v1, y un trigger en `auth.users` se las da a los usuarios nuevos. Las funciones `security definer` quedan sin permiso de ejecución para la API.
  - `movimientos.categoria` (texto con CHECK) se reemplaza por `categoria_id` (FK `on delete restrict`). Los gastos existentes se migran a su categoría equivalente.
  - `movimientos.grupo_id`: une los días de un mismo pago.
  - La política RLS de movimientos ahora exige además que la categoría sea del mismo dueño.
- **Categorías:** pantalla [Categorias.tsx](src/pantallas/Categorias.tsx) (crear, renombrar, eliminar), con acceso desde "Motos". El formulario de gasto carga las categorías del usuario y trae la opción "+ Nueva categoría…". Nuevo tipo de error `en_uso` (FK 23503) en [errores.ts](src/data/errores.ts).
- **Pago de varios días:** [adelantos.ts](src/lib/adelantos.ts) (reglas), [FormPagoNuevo.tsx](src/componentes/FormPagoNuevo.tsx) (monto + calendario de lunes a domingo), `crearPagoVariosDias` en [movimientos.ts](src/data/movimientos.ts) (un solo INSERT, idempotente por `grupo_id`). La confirmación y el WhatsApp muestran el total y los días ("…por $84.000, que cubre los días lun 19/10, mié 21/10 y vie 23/10"). Editar un pago permite fechas hasta 14 días adelante. Los gastos siguen sin fechas futuras.

#### Decisiones tomadas (con el usuario)
- **Santiago:** cada usuario tiene sus propios datos y categorías; los dos usuarios **no** comparten motos.
- **Santiago:** días cubiertos = monto ÷ tarifa (máximo 14). Se marcan días sueltos (ej. lun, mié y vie), no solo seguidos. Se crea un pago por día, de una tarifa cada uno.
- **Santiago:** si el monto no da exacto, el **sobrante se suma al último día** marcado. El total registrado siempre es lo pagado.
- **Santiago:** los días se pueden marcar entre **14 días atrás y 14 adelante**. Un abono menor a la tarifa cubre un solo día.
- Todo pago nuevo lleva `grupo_id`, aunque sea de un día. Así el guardado, los reintentos y la confirmación siguen un solo camino. Los pagos anteriores quedan con `grupo_id` en null.
- Una categoría con gastos no se elimina, solo se renombra.

#### ⏳ Diferido — NO perder
- ⏳ **Aplicar la migración y publicar (en ese orden y seguidos):** `npx supabase db push` → `npm run test:rls` → integrar la rama a `main`. Entre la migración y el deploy, la versión publicada falla, porque busca la columna `categoria` que ya no existe. Hacerlo en un momento en que el cliente no esté registrando.
- ⏳ **Pantalla "Mi cuenta" para cambiar la contraseña** — los correos de los usuarios no son reales, así que la recuperación por correo no funciona. Hoy se cambia desde el SQL Editor de Supabase. Retomar si los cambios de contraseña se vuelven frecuentes.
- ⏳ **Variables de Cloudflare para Preview** — solo se cargaron las de Production, así que las URLs de vista previa de ramas no tienen Supabase. Retomar si se quieren usar las previews para probar.
- ⏳ **Pago de varios días con fechas de hace más de 14 días** — el calendario no las ofrece. Se puede registrar el pago y luego editar su fecha. Retomar si hace falta.

#### Tests
Suite: **84 tests** unitarios (baseline 65 + 19 nuevos). RLS: 7 (5 + 2 de categorías). Los 2 nuevos fallan hasta aplicar la migración, como es de esperar.

---
