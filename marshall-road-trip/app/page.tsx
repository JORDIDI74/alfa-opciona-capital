import { CarFront, Plane } from "lucide-react";
import TripMap from "@/components/trip-map";
import {
  PLAN_STAMP,
  STOPS,
  TOTAL_KM,
  TOTAL_MINUTES,
  formatKm,
  formatRoundedDuration,
} from "@/lib/trip";

const driveTotal =
  `${formatKm(TOTAL_KM)} · ${formatRoundedDuration(TOTAL_MINUTES)}`.toUpperCase();

export default function Home() {
  return (
    <main className="map-app">
      <TripMap />

      <header className="map-title">
        <span>ROAD TRIP · OCTUBRE 2026</span>
        <h1>
          MARSHALL <em>×</em> TWO
        </h1>
        <p>Toca cualquier ficha para ver el detalle y abrir su ruta.</p>
      </header>

      <aside className="trip-stats" aria-label="Resumen del viaje">
        <div>
          <CarFront size={17} aria-hidden="true" />
          <span>TODO EN COCHE</span>
          <strong>{driveTotal}</strong>
        </div>
        <div>
          <Plane size={16} aria-hidden="true" />
          <span>MAD ⇄ CLT</span>
          <strong>01–12 OCT</strong>
        </div>
      </aside>

      <div className="map-legend" role="group" aria-label="Leyenda de rutas">
        <span>
          <i className="legend-one" /> Al 3 OCT
        </span>
        <span>
          <i className="legend-base" /> Enlace
        </span>
        <span>
          <i className="legend-open" /> Al 10 OCT
        </span>
        <span>
          <i className="legend-return" /> Regreso
        </span>
      </div>

      <div className="update-stamp">{PLAN_STAMP}</div>

      {/* The map itself is a canvas of pins; this is the same plan as text, for
          screen readers and for the day the tiles fail to load. */}
      <section className="sr-only" aria-labelledby="itinerario">
        <h2 id="itinerario">Itinerario</h2>
        <p>{`Todo en coche: ${formatKm(TOTAL_KM)}, ${formatRoundedDuration(TOTAL_MINUTES)}. Vuelos MAD ⇄ CLT, del 1 al 12 de octubre de 2026.`}</p>
        <ol>
          {STOPS.map((stop) => (
            <li key={stop.key}>
              <h3>{stop.title}</h3>
              <p>{stop.popupKicker ?? stop.kicker}</p>
              <ul>
                {stop.lines.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
              <p>{stop.popupNote ?? stop.note}</p>
              <a href={stop.href} target="_blank" rel="noopener noreferrer">
                {stop.linkLabel}
              </a>
            </li>
          ))}
        </ol>
      </section>
    </main>
  );
}
