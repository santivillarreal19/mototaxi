# Mototaxi

App web instalable (PWA) para que el dueño de motos alquiladas por día registre desde su iPhone los pagos de cada encargado y los gastos, confirme cada pago por WhatsApp y vea cuánto le genera cada moto.

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
| 1 | Implementación v1 (motos, pagos, gastos, totales, WhatsApp, PWA) | Pendiente |

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
