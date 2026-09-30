# Marshall Road Trip · Octubre 2026

Mapa interactivo a pantalla completa del viaje en coche para ver a Marshall el
3 y el 10 de octubre de 2026: dos partidos, cuatro tramos y los vuelos MAD ⇄ CLT.

Next.js 16 (App Router) + Leaflet. Sin base de datos, sin backend y sin estado:
todo el plan vive en `lib/trip.ts`.

## Desarrollo

```bash
npm install
npm run dev      # http://localhost:3000
npm run lint
npm run typecheck
npm run build && npm start
```

## Editar el viaje

`lib/trip.ts` es la única fuente de verdad:

- `LEGS` — los cuatro tramos en coche: kilómetros, minutos, trazado y color.
  Los totales de la cabecera (`≈1.560 km · ≈17 h`) y los textos de las fichas se
  calculan a partir de estos números, así que **no hay cifras duplicadas que
  puedan descuadrarse**: cambia un tramo y todo lo demás se actualiza solo.
- `STOPS` — las cuatro paradas: pin, ficha, popup y enlace a Google Maps.
- `FOCUS_VIEWS` — los botones de enfoque (Todo, 3 OCT, 4–9 OCT, 10 OCT, Vuelos).
- `PLAN_STAMP` — el sello de abajo a la derecha. Se actualiza a mano a
  propósito: fecha el plan, no la última compilación.

Los kilómetros y las horas son aproximados y las horas de los partidos siguen
sin confirmarse (`TBA`).

## Estructura

```
app/layout.tsx          metadatos, viewport, manifest, CSS global
app/page.tsx            Server Component: rótulos, leyenda e itinerario en texto
app/api/health/route.ts healthcheck que consulta Railway tras cada despliegue
components/trip-map.tsx Client Component: Leaflet, tramos, fichas y enfoques
lib/trip.ts             datos del viaje y formateadores
```

El itinerario en texto (`.sr-only` en `app/page.tsx`) no es decoración: es la
alternativa accesible al mapa y lo que queda si los tiles no cargan.

## Despliegue

Se despliega desde la raíz del repositorio con el `Dockerfile` y el
`railway.json` que hay allí. Consulta [`../DEPLOY.md`](../DEPLOY.md).

## Privacidad

La página lleva `noindex` y un `robots.txt` que lo prohíbe todo: contiene
números de vuelo y fechas personales, y no está pensada para aparecer en
buscadores. Quítalo si algún día deja de ser cierto.
