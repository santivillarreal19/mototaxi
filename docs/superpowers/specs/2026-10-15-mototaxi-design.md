# Mototaxi — Diseño (spec v1)

| | |
|---|---|
| **Fecha** | 2026-10-15 |
| **Autor** | Santiago Villarreal Maya (con Claude) |
| **Estado** | Aprobado en conversación; pendiente revisión de este documento |

## 1. Contexto y objetivo

Un cliente (dueño de motos) alquila cada moto **por día** a una persona encargada. Necesita:

- Registrar cada día cuánto le pagó el encargado por el alquiler.
- Registrar gastos de la moto los días en que ocurran.
- Avisar al encargado, al registrar su pago, que el pago de ese día quedó registrado.
- Saber en todo momento cuánto le ha generado cada moto y el total.

**Usuario único:** el dueño. El encargado no usa la app, solo recibe el mensaje.

**Criterio de éxito:** el dueño registra el pago del día en ~3 toques desde su iPhone, el encargado recibe la confirmación por WhatsApp, y el neto (ingresos − gastos) por moto y general está siempre a la vista.

## 2. Restricciones que definieron el diseño

| Restricción | Consecuencia |
|---|---|
| El celular del cliente es **iPhone** | Una app nativa exige Mac + Apple Developer (USD 99/año) |
| **Nadie paga** la cuenta de Apple | Se construye una **PWA** instalable desde Safari (sin App Store) |
| Los datos son de dinero y no deben perderse | Se guardan **en la nube** con inicio de sesión, no solo en el celular |
| Costo cero | Supabase free + hosting estático gratuito + GitHub Actions |

## 3. Decisiones (tomadas con Santiago, 2026-10-15)

| Decisión | Razón |
|---|---|
| PWA en lugar de Flutter nativo | iOS sin cuenta Apple no permite instalar de forma estable |
| **React + Vite + TypeScript** (no Flutter web) | Flutter web en Safari pesa 2–4 MB y los campos, el teclado y el scroll no se sienten nativos; la web nativa pesa ~200 KB y usa los controles reales de iOS |
| **Supabase** (Auth + Postgres) en lugar de Firebase | El modelo es relacional (motos → movimientos) y los totales salen con SQL simple |
| Mensaje por **WhatsApp con el texto listo** (`wa.me`) | Gratis y sin servidor. El SMS automático está prohibido en iOS y la API de WhatsApp Business es cara y compleja |
| El WhatsApp se abre con un **botón**, después de guardar | iOS bloquea abrir otra app si no viene de un toque directo del usuario |
| **Varias motos** desde la v1 | El cliente lo pidió a futuro y migrar los datos después sería más caro |
| Hosting en **Cloudflare Pages**, repo en **GitHub** | Gratis, HTTPS, publica solo con cada push |
| ~~Cálculo de días sin pago o deuda~~ — **descartado** | Si el encargado no trabaja un día, ese día simplemente queda vacío (decisión del cliente vía Santiago) |

## 4. Arquitectura

```
iPhone (Safari, ícono en pantalla de inicio)
   │  PWA: React + Vite + TypeScript
   │
   ├──► Supabase Auth       (correo + contraseña, sin registro público)
   ├──► Supabase Postgres   (motos, movimientos) protegido con RLS
   └──► WhatsApp            (enlace wa.me con el texto listo)

Cloudflare Pages  ◄── publica el build con cada push a main
GitHub Actions    ──► tests en cada push + cron cada 3 días que consulta a Supabase (evita la pausa del plan gratuito)
```

### Unidades del frontend

| Unidad | Responsabilidad | Depende de |
|---|---|---|
| `lib/dinero` | Formatear pesos colombianos (`$35.000`) y parsear lo que escribe el usuario | — |
| `lib/totales` | Calcular ingresos, gastos y neto a partir de una lista de movimientos | — |
| `lib/whatsapp` | Normalizar el teléfono (`57` + 10 dígitos), armar el mensaje y el enlace `wa.me` | — |
| `lib/validaciones` | Reglas de monto, placa, teléfono y fecha | — |
| `data/` | Acceso a Supabase (cliente, consultas de motos y movimientos) | Supabase JS |
| `pantallas/` | Login, Inicio, Detalle de moto, Pago, Gasto, Motos | `lib/`, `data/` |

La lógica de negocio (`lib/`) es pura y no conoce React ni Supabase, así que se puede probar sin red.

## 5. Modelo de datos

Esquema definido en migraciones versionadas: `supabase/migrations/`.

### `motos`
| campo | tipo | reglas |
|---|---|---|
| id | uuid PK | default `gen_random_uuid()` |
| user_id | uuid | FK `auth.users`, default `auth.uid()` |
| placa | text | not null, se guarda en mayúsculas, **única por user_id** |
| alias | text | opcional |
| tarifa_diaria | integer | not null, > 0 |
| encargado_nombre | text | not null |
| encargado_telefono | text | not null, formato `57` + 10 dígitos |
| archivada | boolean | default false |
| created_at | timestamptz | default now() |

### `movimientos`
| campo | tipo | reglas |
|---|---|---|
| id | uuid PK | |
| user_id | uuid | FK `auth.users`, default `auth.uid()` |
| moto_id | uuid | FK `motos`, not null |
| tipo | text | `'pago'` o `'gasto'` (check) |
| fecha | date | not null, no futura (se valida en el frontend) |
| monto | integer | not null, > 0 (check) — pesos, sin decimales |
| categoria | text | obligatoria si `tipo = 'gasto'`, null si es pago (check). Valores: `mantenimiento`, `repuestos`, `combustible`, `soat_impuestos`, `otro` |
| nota | text | opcional |
| created_at | timestamptz | default now() |

**Reglas:**
- **RLS** en ambas tablas: `user_id = auth.uid()` para select, insert, update y delete.
- Se permiten **varios pagos el mismo día** (por ejemplo, pagos parciales).
- Las motos **no se borran**, se archivan (para conservar el historial). Los movimientos sí se pueden editar o eliminar (corrección de errores de digitación).
- Los totales **no se guardan**: se calculan al consultar.
- Índice `(moto_id, fecha)` en `movimientos` para el listado por moto.

## 6. Pantallas y flujos

1. **Login** — correo y contraseña. La cuenta del cliente se crea una vez desde el panel de Supabase (registro público deshabilitado). La sesión persiste.
2. **Inicio** — neto general con ingresos y gastos, y una tarjeta por moto activa (placa, alias, encargado, neto). Filtro de período: **este mes** (por defecto), **mes anterior**, **todo**.
3. **Detalle de moto** — totales de la moto en el período y movimientos ordenados por fecha descendente. Botones fijos abajo: **+ Pago** y **+ Gasto**. Tocar un movimiento permite editarlo o eliminarlo (con confirmación).
4. **Registrar pago** — fecha (por defecto hoy), monto precargado con la `tarifa_diaria` (editable, teclado numérico) y nota opcional. Al guardar aparece una confirmación con el botón **"Enviar a [nombre] por WhatsApp"**, que abre:
   `https://wa.me/57XXXXXXXXXX?text=<mensaje codificado>`
   Mensaje: *"Hola [nombre], se registró tu pago de alquiler de la moto [placa] del día [fecha dd/mm/aaaa] por $[monto]. ¡Gracias!"*
   Editar un pago **no** reenvía el mensaje.
5. **Registrar gasto** — fecha, monto, categoría y descripción. No envía mensaje.
6. **Motos** — crear, editar y archivar motos: placa, alias, tarifa diaria, nombre y teléfono del encargado. Las archivadas se pueden ver y desarchivar.

**PWA:** `manifest.webmanifest` con nombre e íconos (incluido `apple-touch-icon`), `display: standalone` y un service worker para el cascarón de la app (la app carga rápido, pero guardar datos exige internet).

## 7. Manejo de errores

| Caso | Comportamiento |
|---|---|
| Sin internet al guardar | Mensaje "No hay conexión, no se guardó" y el formulario **conserva** lo que se escribió |
| Validaciones | Monto > 0, placa no repetida, teléfono de 10 dígitos colombiano, fecha no futura. Error junto al campo |
| Sesión vencida | Vuelve al login y luego regresa a la pantalla donde estaba |
| WhatsApp no abre | El pago ya quedó guardado. Se muestra el aviso y un botón **"Copiar mensaje"** |
| Error inesperado de Supabase | Mensaje genérico entendible y detalle en la consola; nunca falla en silencio |

## 8. Pruebas

- **Vitest (TDD)** para `lib/`: totales y neto, formato y parseo de pesos, normalización de teléfono, armado del mensaje y del enlace `wa.me`, validaciones.
- **RLS:** script de prueba que verifica que un segundo usuario no puede leer ni modificar datos del primero.
- **CI:** GitHub Actions corre lint, tests y build en cada push.
- **Verificación manual en iPhone real:** instalar desde Safari, iniciar sesión, crear una moto, registrar un pago, enviar el WhatsApp, registrar un gasto y revisar los totales.

## 9. Operación (nada manual sin versionar)

- **Variables:** `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` (públicas por diseño; la seguridad la da RLS). `.env.example` en el repo; `.env` ignorado.
- **Migraciones:** se aplican con Supabase CLI (`supabase db push`) desde el repo.
- **Keep-alive:** workflow programado de GitHub Actions cada 3 días que hace una consulta liviana a Supabase. El secreto vive en GitHub Secrets.
- **Deploy:** Cloudflare Pages conectado al repo; cada push a `main` publica.
- **Configuración inicial única** (documentada paso a paso en el README): crear el proyecto Supabase, deshabilitar el registro público, crear el usuario del cliente, conectar Cloudflare Pages y cargar los secretos.

## 10. Fuera de la v1 (⏳ Diferido)

- ⏳ **Historial de encargados por moto** — hoy, si cambia el encargado, se editan los datos de la moto y los pagos viejos quedan asociados a la moto, no a la persona. Retomar si el cliente necesita saber cuánto pagó cada encargado.
- ⏳ **Funcionamiento sin conexión** (guardar y sincronizar después) — suma complejidad de sincronización. Retomar si el cliente reporta problemas de señal.
- ⏳ **Exportar a Excel o CSV** — no lo pidió. Retomar si lo necesita para el contador.
- ⏳ **App nativa iOS/Android** — bloqueada por el costo de la cuenta Apple. Retomar si cambia esa condición.
- ~~Días sin pago o deuda del encargado~~ — **descartado**: los días sin pago quedan vacíos.
