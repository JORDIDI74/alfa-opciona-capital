"use client";

import { useEffect, useRef, useState } from "react";
import type { Map as LeafletMap, Marker, Polyline } from "leaflet";
import {
  FOCUS_KEYS,
  FOCUS_VIEWS,
  LEGS,
  STOPS,
  legChipHtml,
  legRoute,
  legSummary,
  stopCardHtml,
  stopPopupHtml,
  type FocusKey,
  type LegKey,
} from "@/lib/trip";

type Status = "loading" | "ready" | "error";

/** Leaflet needs room for the floating chrome, but 96px eats a phone screen. */
function boundsPadding(): [number, number] {
  const tight =
    typeof window !== "undefined" &&
    window.matchMedia("(max-width: 680px)").matches;
  return tight ? [40, 40] : [96, 96];
}

export default function TripMap() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const routesRef = useRef<Partial<Record<LegKey, Polyline>>>({});
  const chipsRef = useRef<Partial<Record<LegKey, Marker>>>({});
  const [status, setStatus] = useState<Status>("loading");
  const [attempt, setAttempt] = useState(0);
  const [selected, setSelected] = useState<FocusKey>("all");

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let cancelled = false;
    setStatus("loading");

    void (async () => {
      try {
        // Leaflet touches `window` at module scope, so it can only be pulled in
        // once the component is actually mounted in a browser.
        const L = await import("leaflet");
        if (cancelled) return;

        const map = L.map(container, {
          zoomControl: true,
          scrollWheelZoom: true,
        });

        L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 19,
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a>',
        }).addTo(map);

        for (const leg of LEGS) {
          routesRef.current[leg.key] = L.polyline(leg.path, leg.style).addTo(map);
        }

        for (const stop of STOPS) {
          L.marker(stop.coordinates, {
            icon: L.divIcon({
              className: `place-marker ${stop.variant} card-${stop.card}`,
              html: stopCardHtml(stop),
              iconSize: [1, 1],
              iconAnchor: [0, 0],
            }),
            title: stop.a11yTitle,
            riseOnHover: true,
          })
            .addTo(map)
            .bindPopup(stopPopupHtml(stop));
        }

        for (const leg of LEGS) {
          chipsRef.current[leg.key] = L.marker(leg.labelAt, {
            icon: L.divIcon({
              className: `drive-label drive-${leg.key}`,
              html: legChipHtml(leg.key),
              // The chip sizes itself in CSS and self-centres, so Leaflet is
              // told to reserve nothing. Hard-coding a size here is what used
              // to push the chips off their road on narrow screens.
              iconSize: [0, 0],
              iconAnchor: [0, 0],
            }),
            // Decorative: the same figures are in the cards and the itinerary.
            interactive: false,
            keyboard: false,
          }).addTo(map);
        }

        mapRef.current = map;
        map.fitBounds(FOCUS_VIEWS.all.bounds, {
          padding: boundsPadding(),
          maxZoom: FOCUS_VIEWS.all.maxZoom,
        });
        setStatus("ready");
      } catch (error) {
        if (cancelled) return;
        console.error("No se pudo inicializar el mapa", error);
        setStatus("error");
      }
    })();

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      routesRef.current = {};
      chipsRef.current = {};
    };
  }, [attempt]);

  useEffect(() => {
    const map = mapRef.current;
    if (status !== "ready" || !map) return;

    const view = FOCUS_VIEWS[selected];
    const showAll = selected === "all";

    for (const leg of LEGS) {
      const route = routesRef.current[leg.key];
      if (!route) continue;
      const isActive = view.activeLegs.includes(leg.key);
      route.setStyle({
        ...leg.style,
        opacity: showAll || isActive ? leg.style.opacity : 0.1,
        weight:
          !showAll && isActive
            ? Number(leg.style.weight) + 2
            : leg.style.weight,
      });
      if (isActive) route.bringToFront();

      chipsRef.current[leg.key]?.setOpacity(showAll || isActive ? 1 : 0.1);
    }

    map.fitBounds(view.bounds, {
      padding: boundsPadding(),
      maxZoom: view.maxZoom,
    });
  }, [status, selected]);

  return (
    <>
      <div className="map-stage">
        <div
          ref={containerRef}
          id="route-map"
          role="region"
          aria-label="Mapa interactivo del viaje en coche"
        />
        {status !== "ready" && (
          <div className="map-loading" role="status" aria-live="polite">
            {status === "loading" ? (
              <span>Cargando mapa…</span>
            ) : (
              <div className="map-error">
                <p>No se ha podido cargar el mapa.</p>
                <button type="button" onClick={() => setAttempt((n) => n + 1)}>
                  Reintentar
                </button>
                <p className="map-error-hint">
                  El itinerario completo sigue disponible más abajo.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="map-tabs">
        <div className="segmented" role="group" aria-label="Enfocar el mapa">
          {FOCUS_KEYS.map((key) => (
            <button
              key={key}
              type="button"
              className="segment"
              aria-pressed={selected === key}
              data-state={selected === key ? "active" : "inactive"}
              onClick={() => setSelected(key)}
            >
              {FOCUS_VIEWS[key].label}
            </button>
          ))}
        </div>
      </div>

      {/* Text equivalent of the chips drawn on the map. */}
      <ul className="sr-only">
        {LEGS.map((leg) => (
          <li key={leg.key}>{`${legRoute(leg.key)}: ${legSummary(leg.key)}`}</li>
        ))}
      </ul>
    </>
  );
}
