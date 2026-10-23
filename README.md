# Mototaxi — "Alquiler Motos C.V"

App web instalable (PWA), publicada como **Alquiler Motos C.V** en https://mototaxi-66v.pages.dev, para que el dueño de motos alquiladas por día registre desde su iPhone los pagos de cada encargado y los gastos, confirme cada pago por WhatsApp y vea cuánto le genera cada moto.

> Este README es **bitácora viva del proyecto**. Cada iteración suma una sección al final con lo que se hizo, las decisiones tomadas, problemas encontrados y pendientes. Está pensado para que cualquiera (incluyendo Claude en sesiones futuras) pueda recuperar contexto rápido.

## Funcionalidades

- **Varias motos**, cada una con placa, tarifa diaria y encargado (nombre y celular). Las motos que ya no trabajan se archivan sin perder su historial.
- **Pagos de alquiler**, incluso **adelantados de varios días**: el monto dice cuántos días cubre y se marcan en un calendario. Los domingos se descansa uno sí y otro no, y el de descanso no se puede marcar.
- **Cambio de contraseña** desde la app.
- **Confirmación por WhatsApp** al encargado, con el mensaje listo.
- **Gastos** con categorías que crea cada usuario.
- **Caja:** saldo actual (dinero agregado + lo que dejan las motos) y **préstamos a encargados** con abonos y saldo pendiente.
- **Ganancia neta** (ingresos − gastos) general y por moto, por período (este mes, mes anterior, todo).
- **Instalable en iPhone** desde Safari (PWA), sin App Store. Usable con mala señal: guardar dos veces no duplica pagos.
- **Datos aislados por usuario** con Row Level Security de Postgres, verificados con pruebas de integración.

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

## Operación — qué cuidar para que no se caiga

| Riesgo | Qué pasa | Cómo evitarlo / arreglarlo |
|---|---|---|
| **Supabase gratis se pausa** tras 7 días sin uso | La app abre pero no carga datos | El uso diario lo evita. El workflow [keepalive.yml](.github/workflows/keepalive.yml) consulta la base cada 3 días (necesita los secrets `SUPABASE_URL` y `SUPABASE_ANON_KEY`). Si se pausa: panel de Supabase → **Restore project**. Los datos no se pierden, pero **después de 90 días pausado ya no se puede reactivar desde el panel** |
| **GitHub apaga los cron** de un repo con 60 días sin commits | El keep-alive deja de correr | GitHub → Actions → "Mantener Supabase activo" → **Enable workflow**, o hacer cualquier commit |
| **Migración aplicada sin publicar el código** (o al revés) | La app falla porque busca columnas que ya no existen | Primero `npx supabase db push` y enseguida integrar a `main`, cuando el cliente no esté registrando. Nunca borrar ni renombrar columnas desde el panel |
| **Variables de Cloudflare** mal cargadas | Pantalla en blanco | No tocar `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` ni `NODE_VERSION`. Si cambian: tipo Text, sin comillas, y **Retry deployment** |
| **Push a `main` sin probar** | Se publica solo | Antes de integrar: `npm run typecheck && npm test && npm run build`. Trabajar en ramas. Un build fallido no tumba la app: queda la última versión buena |
| **Perder acceso** a GitHub, Cloudflare o Supabase | Se pierde el control de esa parte | Verificación en dos pasos en las tres cuentas. No borrar el proyecto de Cloudflare, porque la URL podría cambiar |
| **Node 22 sin soporte** (el log de Cloudflare ya lo advierte) | Algún día el build podría fallar | Subir `NODE_VERSION` en Cloudflare y `engines` en [package.json](package.json) a la siguiente LTS |

**Editar datos a mano:** en Supabase → Table Editor. Una fila nueva debe llevar el `user_id` de su dueño (está en Authentication → Users). Para cambiar la contraseña de un usuario (los correos no son reales, así que la recuperación por correo no llega), usar el SQL Editor:
`update auth.users set encrypted_password = crypt('ClaveNueva', gen_salt('bf')) where email = '...';`

**Actualizaciones en el iPhone:** el código nuevo llega solo al abrir la app con internet (a veces tarda una apertura extra). Solo el **nombre bajo el ícono** exige borrar el ícono y volver a hacer "Agregar a inicio".

## Iteraciones planificadas

| # | Objetivo | Estado |
|---|---|---|
| 0 | Diseño y spec | ✅ Completada |
| 1 | Implementación v1 (motos, pagos, gastos, totales, WhatsApp, PWA) y despliegue | ✅ Desplegada (2026-10-16) |
| 2 | Pedidos del cliente: nombre "Alquiler Motos C.V", categorías de gasto propias, pago de varios días | ✅ Desplegada (2026-10-16) — falta verificar RLS de categorías |
| 3 | Guía de operación y repo público para portafolio | ✅ Completada (2026-10-16) |
| 4 | Caja: saldo inicial/agregado y préstamos a encargados con abonos | ✅ Desplegada (2026-10-16) |
| 5 | Domingos de descanso intercalados y cambio de contraseña | ✅ Publicada (2026-10-23) |
| 6 | Menú lateral para navegar entre secciones | ✅ Publicada (2026-10-23) |

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
| **Estado** | ✅ Desplegada (2026-10-16): migración aplicada y `main` publicado. Falta correr `npm run test:rls` completo |
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
- ~~⏳ **Aplicar la migración y publicar**~~ → hecho el 2026-10-16. Migración verificada con el usuario de prueba A: 5 categorías sembradas, columna `categoria` eliminada y sus 2 gastos con `categoria_id`.
- ~~⏳ **Correr `npm run test:rls` completo**~~ → hecho el 2026-10-16. `.env.test.local` usa ahora dos usuarios solo de prueba (`@mototaxi.test`): ni la cuenta del cliente ni la de Santiago. 9/9.
- ~~⏳ **Pantalla "Mi cuenta" para cambiar la contraseña**~~ → hecho en la iteración 5 (Motos → "Cambiar contraseña"). Los correos de los usuarios no son reales, así que la recuperación por correo no funciona. Hoy se cambia desde el SQL Editor de Supabase. Retomar si los cambios de contraseña se vuelven frecuentes.
- ⏳ **Variables de Cloudflare para Preview** — solo se cargaron las de Production, así que las URLs de vista previa de ramas no tienen Supabase. Retomar si se quieren usar las previews para probar.
- ⏳ **Pago de varios días con fechas de hace más de 14 días** — el calendario no las ofrece. Se puede registrar el pago y luego editar su fecha. Retomar si hace falta.

#### Tests
Suite: **84 tests** unitarios (baseline 65 + 19 nuevos). RLS: 7 (5 + 2 de categorías). Los 2 nuevos fallan hasta aplicar la migración, como es de esperar.

---

### Iteración 3 — Guía de operación y repo público para portafolio

| | |
|---|---|
| **Fecha** | 2026-10-16 |
| **Estado** | ✅ Completada |
| **Objetivo** | Dejar escrito qué cuidar para que el despliegue no se caiga (`keepalive.yml` remitía a una sección "Operación" que no existía) y publicar el repo en el portafolio de Santiago. |

#### Qué se hizo
- README: secciones **Funcionalidades** (resumen para el portafolio) y **Operación** (tabla de riesgos, edición manual de datos, actualizaciones en el iPhone).
- Antes de abrir el repo se revisó todo el historial: no hay `.env`, claves, identificador del proyecto de Supabase ni correos.
- Repo `santivillarreal19/mototaxi` cambiado a **público**, con descripción, URL y temas.

#### Decisiones tomadas (con el usuario)
- **Santiago:** repo público para el portafolio.
- **Santiago:** el README conserva el nombre del negocio ("Alquiler Motos C.V") y la URL de producción, que igual pide iniciar sesión.

#### ⏳ Diferido — NO perder
- ⏳ **Cerrar el registro público en Supabase** — hallazgo del 2026-10-16: en el proyecto real `disable_signup` está en `false`, aunque la spec pedía deshabilitarlo. La URL y la clave anon viajan en la app publicada, así que cualquiera puede crear una cuenta. RLS impide que vea los datos del cliente, pero tendría cuenta en el proyecto. Arreglo: Supabase → Authentication → Sign In / Providers → desactivar **Allow new users to sign up**. Hacerlo desde el panel y **no** con `supabase config push`, porque el `config.toml` local tiene `enable_signup = true` y `site_url` de localhost y pisaría la configuración remota. Prioridad alta.
- ⏳ **Sin licencia** en el repo. Por defecto, todos los derechos quedan reservados: se puede ver el código, pero no reutilizarlo. Agregar una licencia solo si se quiere permitir su uso.

---

### Iteración 4 — Caja: saldo y préstamos a encargados

| | |
|---|---|
| **Fecha** | 2026-10-16 |
| **Estado** | ✅ Desplegada (2026-10-16): migraciones aplicadas, RLS 9/9 y `main` publicado |
| **Objetivo** | El cliente ya tenía $628.000 antes de usar la app y quiere verlos como saldo. Además, a veces los encargados le piden préstamos, y quiere que quede registro de ellos. |

#### Qué se hizo
- **Migración** [20261016130000_caja.sql](supabase/migrations/20261016130000_caja.sql): tabla `caja` con tres tipos de entrada. `saldo` (dinero agregado), `prestamo` (con `moto_id` y el `encargado_nombre` de ese momento) y `abono` (con `prestamo_id`). Un CHECK define qué campos lleva cada tipo. RLS por dueño, que exige además que la moto y el préstamo sean del mismo dueño. FKs `on delete restrict`: no se borra un préstamo con abonos. **Solo agrega una tabla**, así que la versión publicada antes de la migración sigue funcionando.
- **Reglas** en [caja.ts](src/lib/caja.ts): saldo actual, estado de cada préstamo (abonado y pendiente) y validaciones (un abono no puede pasar de lo pendiente; un préstamo no puede quedar por debajo de lo ya abonado).
- **Pantallas:**
  - [Caja.tsx](src/pantallas/Caja.tsx): saldo actual, préstamos pendientes, historial y botones "+ Agregar saldo" y "+ Préstamo".
  - [EntradaCaja.tsx](src/pantallas/EntradaCaja.tsx): crear y editar entradas, y el detalle del préstamo con sus abonos.
  - [FormCaja.tsx](src/componentes/FormCaja.tsx): el formulario.
  - En el **inicio**, la tarjeta "Saldo actual" y el acceso a la Caja. En el **detalle de moto**, "Préstamos pendientes: debe $X".

#### Decisiones tomadas (con el usuario)
- **Santiago (por el cliente):** dos acciones, **"Agregar saldo"** (para los $628.000 y aportes futuros) y **"Préstamo"** (registro de lo prestado a encargados).
- **Santiago:** el préstamo **resta** del saldo actual y los **abonos** suman. La devolución se registra con abonos parciales y se ve cuánto falta.
- **Santiago:** el préstamo se asocia a **la moto**, y se guarda el nombre del encargado de ese momento.
- **Santiago:** los $628.000 son el saldo **de hoy**. Saldo actual = saldos − préstamos + abonos + (pagos − gastos **registrados** desde el primer saldo). Se usa `created_at` y no la fecha del movimiento: lo registrado antes ya está incluido en los $628.000, y un pago adelantado cuenta cuando se recibió la plata.
- Saldo, préstamos y abonos **no** entran en la ganancia por moto ni en los totales por período.

#### ⏳ Diferido — NO perder
- ~~⏳ **Aplicar y publicar**~~ → hecho el 2026-10-16 (migraciones 20261016130000 y 20261016140000, `npm run test:rls` 9/9).
- ⏳ **Cargar los $628.000** en la cuenta del cliente: Caja → "+ Agregar saldo", con fecha de hoy.
- ⏳ **WhatsApp al encargado por préstamos o abonos** — no se pidió. Retomar si el cliente quiere constancia para el encargado.
- ⏳ **Intereses de préstamos** — no se pidió; hoy un préstamo es solo capital.
- ⏳ **Validación de abonos en la base** — que un abono no supere lo pendiente se valida solo en la app. Retomar si se editan datos a mano con frecuencia.

#### Problemas encontrados y solución
- **`infinite recursion detected in policy for relation "caja"`** al registrar en Caja. Lo detectó `npm run test:rls` antes de publicar. Causa: el WITH CHECK de la política de `caja` consultaba la misma tabla `caja` (para validar el préstamo de un abono), y eso vuelve a evaluar la política. Solución: migración [20261016140000_caja_politica_sin_recursion.sql](supabase/migrations/20261016140000_caja_politica_sin_recursion.sql), que hace la verificación en la función `security definer` `es_prestamo_propio`. **Lección:** una política RLS nunca debe consultar su propia tabla directamente.

#### Tests
Suite: **93 tests** unitarios (84 + 9 de caja). RLS: 9 (7 + 2 de caja: aislamiento, y abono propio sí / ajeno no). Se corren después de aplicar las migraciones.

---

### Iteración 5 — Domingos intercalados y cambio de contraseña

| | |
|---|---|
| **Fecha** | 2026-10-23 |
| **Estado** | ✅ Publicada (2026-10-23) |
| **Objetivo** | El cliente descansa un domingo sí y otro no: esos domingos no deben poder marcarse como pagados. Además, que cada usuario pueda cambiar su contraseña sin pasar por el SQL Editor. |

#### Qué se hizo
- **Domingos de descanso** en [adelantos.ts](src/lib/adelantos.ts): `domingoBloqueado` toma como referencia el domingo **2026-10-25** (bloqueado) y desde ahí alterna cada 7 días (01/11 libre, 08/11 bloqueado…). En el calendario de [FormPagoNuevo.tsx](src/componentes/FormPagoNuevo.tsx) esos domingos salen tachados y deshabilitados; `validarDiasPago` y la edición de un pago ([FormMovimiento.tsx](src/componentes/FormMovimiento.tsx)) tampoco los aceptan. Los gastos sí se pueden registrar en domingo.
- **Cambiar contraseña** en [CambiarClave.tsx](src/pantallas/CambiarClave.tsx) (`/cuenta/clave`, botón en la pantalla Motos): pide la contraseña actual (se verifica volviendo a iniciar sesión), la nueva (mínimo 6 caracteres, distinta a la actual) y su confirmación, y la cambia con `supabase.auth.updateUser`.

#### Decisiones tomadas
- **Cliente (vía Santiago):** "este domingo se bloquea, el siguiente no". "Este domingo" = 2026-10-25.
- La regla aplica también a domingos pasados del calendario (14 días atrás), para que el patrón sea uno solo.
- La regla vive solo en la app, sin cambio en la base: los pagos ya registrados en domingos de descanso no se tocan.

#### ⏳ Diferido — NO perder
- ⏳ **Cambiar el domingo de referencia** — si el cliente corre el turno (p. ej. trabaja dos domingos seguidos), cambiar `DOMINGO_BLOQUEADO_BASE` en [adelantos.ts](src/lib/adelantos.ts). Retomar si lo pide seguido: entonces convendría configurarlo desde la app.

#### Tests
Suite: 93 + 7 nuevos (domingos de descanso y validación de contraseña). Verificados en GitHub Actions: en esta máquina no hay Node instalado.

---

### Iteración 6 — Menú lateral

| | |
|---|---|
| **Fecha** | 2026-10-23 |
| **Estado** | ✅ Publicada (2026-10-23) |
| **Objetivo** | Al cliente le costaba llegar a algunas pantallas (Categorías, Caja, cerrar sesión): estaban escondidas al final de otras pantallas. |

#### Qué se hizo
- [Menu.tsx](src/componentes/Menu.tsx): botón ☰ a la derecha del encabezado en todas las pantallas con sesión. Abre un panel desde la derecha con Inicio, Motos, Caja y Categorías de gasto (la sección actual sale resaltada) y, al fondo, Cambiar contraseña y Cerrar sesión. Usa `<dialog>` con `showModal`: Escape, foco y fondo bloqueado los maneja el navegador; tocar el fondo oscuro lo cierra.
- Se quitaron los accesos repetidos: "Motos" del encabezado del Inicio y, de la pantalla Motos, los botones de Categorías, Cambiar contraseña y Cerrar sesión. Categorías y Cambiar contraseña vuelven ahora al Inicio.

#### Decisiones tomadas (con el usuario)
- **Santiago:** navegación con menú lateral; revisado en el navegador antes de publicar.
