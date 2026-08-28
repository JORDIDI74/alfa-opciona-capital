/**
 * Single source of truth for the trip: stops, driving legs and map focus
 * presets. Every distance and duration shown in the UI is derived from the
 * numbers in `LEGS`, so the totals in the header can never drift away from the
 * per-leg labels or the popup copy.
 *
 * Type-only Leaflet imports are erased at build time, so this module stays
 * safe to import from a Server Component.
 */
import type { LatLngTuple, PathOptions } from "leaflet";

export type LatLng = LatLngTuple;
export type LegKey = "to-game-one" | "base-link" | "open-corridor" | "return";
export type FocusKey =
  | "all"
  | "game-one"
  | "open-days"
  | "game-two"
  | "flights";

export const CLT: LatLng = [35.214, -80.9431];
export const BRIDGEFORTH: LatLng = [38.435265, -78.873085];
export const CHARLOTTESVILLE: LatLng = [38.0293, -78.4767];
export const HUNTINGTON: LatLng = [38.425, -82.4208];

export type Leg = {
  key: LegKey;
  from: string;
  to: string;
  /** Approximate driving distance, kilometres. */
  km: number;
  /** Approximate driving time, minutes. */
  minutes: number;
  /** Where the distance chip is dropped on the map. */
  labelAt: LatLng;
  path: LatLng[];
  style: PathOptions;
};

export const LEGS: Leg[] = [
  {
    key: "to-game-one",
    from: "CLT",
    to: "Harrisonburg",
    km: 480,
    minutes: 300,
    labelAt: [36.73, -80.75],
    path: [
      CLT,
      [35.7826, -80.8873],
      [36.2443, -80.8484],
      [36.6671, -80.6912],
      [36.9485, -81.0848],
      [37.1299, -80.4089],
      [37.2709, -79.9414],
      [37.784, -79.4428],
      [38.1496, -79.0717],
      BRIDGEFORTH,
    ],
    style: { color: "#f2c14e", weight: 5, opacity: 0.96 },
  },
  {
    key: "base-link",
    from: "Harrisonburg",
    to: "Charlottesville",
    km: 100,
    minutes: 70,
    labelAt: [38.18, -78.71],
    path: [BRIDGEFORTH, [38.1496, -79.0717], [38.0307, -78.8495], CHARLOTTESVILLE],
    style: { color: "#c3a5ff", weight: 4, opacity: 0.88, dashArray: "8 9" },
  },
  {
    key: "open-corridor",
    from: "Charlottesville",
    to: "Huntington",
    km: 470,
    minutes: 315,
    labelAt: [37.84, -80.46],
    path: [
      CHARLOTTESVILLE,
      [38.0307, -78.8495],
      [37.784, -79.4428],
      [37.7935, -79.9939],
      [37.8018, -80.4456],
      [37.7782, -81.1882],
      [38.3498, -81.6326],
      HUNTINGTON,
    ],
    style: { color: "#31d69b", weight: 5, opacity: 0.92, dashArray: "12 10" },
  },
  {
    key: "return",
    from: "Huntington",
    to: "CLT",
    km: 510,
    minutes: 330,
    labelAt: [37.15, -81.18],
    path: [
      HUNTINGTON,
      [38.3498, -81.6326],
      [37.7782, -81.1882],
      [37.3662, -81.1026],
      [37.1299, -80.4089],
      [36.6671, -80.6912],
      [35.7826, -80.8873],
      CLT,
    ],
    style: { color: "#ff7b6b", weight: 4, opacity: 0.86, dashArray: "5 10" },
  },
];

const LEG_BY_KEY = new Map(LEGS.map((leg) => [leg.key, leg]));

function leg(key: LegKey): Leg {
  const found = LEG_BY_KEY.get(key);
  if (!found) throw new Error(`Unknown leg: ${key}`);
  return found;
}

/** `1560` -> `≈1.560 km` (Spanish thousands separator, no locale data needed). */
export function formatKm(km: number): string {
  return `≈${km.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")} km`;
}

/** `315` -> `≈5 h 15`. */
export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `≈${hours} h` : `≈${hours} h ${rest}`;
}

/** Totals round to the hour: summing four approximations to the minute would
 * only invent precision the source numbers never had. */
export function formatRoundedDuration(minutes: number): string {
  return `≈${Math.round(minutes / 60)} h`;
}

export function legRoute(key: LegKey): string {
  const { from, to } = leg(key);
  return `${from} → ${to}`;
}

export function legDistance(key: LegKey): string {
  return formatKm(leg(key).km);
}

export function legTime(key: LegKey): string {
  return formatDuration(leg(key).minutes);
}

/** `≈480 km · ≈5 h` — used by the chips, the cards and the popups alike. */
export function legSummary(key: LegKey): string {
  return `${legDistance(key)} · ${legTime(key)}`;
}

export const TOTAL_KM = LEGS.reduce((sum, item) => sum + item.km, 0);
export const TOTAL_MINUTES = LEGS.reduce((sum, item) => sum + item.minutes, 0);

export type Stop = {
  key: string;
  coordinates: LatLng;
  /** Drives the pin colour and the card accent. */
  variant: "airport" | "game-one" | "open-stop" | "game-two";
  /** Which corner the card hangs from, so cards never cover their own pin. */
  card: "ne" | "nw" | "se" | "sw";
  pin: string;
  kicker: string;
  popupKicker?: string;
  /** Truncated to one line inside the card. */
  shortTitle: string;
  title: string;
  lines: string[];
  /** Replaces `lines` in the popup when the stop needs prose instead of facts. */
  blurb?: string;
  note: string;
  popupNote?: string;
  linkLabel: string;
  href: string;
  /** Announced by screen readers and shown as the marker tooltip. */
  a11yTitle: string;
};

export const STOPS: Stop[] = [
  {
    key: "clt",
    coordinates: CLT,
    variant: "airport",
    card: "ne",
    pin: "CLT",
    kicker: "01 + 12 OCT · VUELOS",
    shortTitle: "Charlotte · CLT",
    title: "Charlotte Douglas · CLT",
    lines: [
      "AA749 · MAD 10:25 → CLT 13:40",
      "AA748 · CLT 15:40 → MAD 05:30 +1",
    ],
    note: "Inicio y final del coche",
    linkLabel: "Abrir aeropuerto ↗",
    href: "https://www.google.com/maps/search/?api=1&query=Charlotte+Douglas+International+Airport",
    a11yTitle: "Charlotte Douglas International Airport",
  },
  {
    key: "jmu",
    coordinates: BRIDGEFORTH,
    variant: "game-one",
    card: "nw",
    pin: "03",
    kicker: "03 OCT · PARTIDO 1",
    popupKicker: "SÁBADO 03 OCT · PARTIDO 1",
    shortTitle: "Marshall @ JMU",
    title: "Marshall @ James Madison",
    lines: [
      "Bridgeforth Stadium · Hora TBA",
      "Family Weekend · 250 Champions Dr.",
    ],
    blurb:
      "Bridgeforth Stadium · Hora por confirmar. Family Weekend · 250 Champions Drive.",
    note: `Desde CLT · ${legSummary("to-game-one")}`,
    popupNote: `En coche desde CLT · ${legSummary("to-game-one")}`,
    linkLabel: "Abrir ruta al estadio ↗",
    href: "https://www.google.com/maps/dir/?api=1&origin=Charlotte+Douglas+International+Airport&destination=Bridgeforth+Stadium,+250+Champions+Drive,+Harrisonburg,+VA+22807",
    a11yTitle: "3 de octubre · Marshall en Bridgeforth Stadium",
  },
  {
    key: "cho",
    coordinates: CHARLOTTESVILLE,
    variant: "open-stop",
    card: "se",
    pin: "04–09",
    kicker: "04–09 OCT · POR DISEÑAR",
    popupKicker: "04–09 OCT · TRAMO ABIERTO",
    shortTitle: "Base candidata",
    title: "Charlottesville · base candidata",
    lines: [
      "Charlottesville · corredor I-64 West",
      `Desde Harrisonburg · ${legSummary("base-link")}`,
    ],
    blurb:
      "Seis días para completar el road trip hacia Huntington por el corredor I-64 West.",
    note: `Hasta Huntington · ${legSummary("open-corridor")}`,
    popupNote: `Harrisonburg → aquí · ${legSummary("base-link")} · Aquí → Huntington · ${legSummary("open-corridor")}`,
    linkLabel: "Explorar corredor ↗",
    href: "https://www.google.com/maps/dir/?api=1&origin=Charlottesville,+VA&destination=Joan+C.+Edwards+Stadium,+Huntington,+WV",
    a11yTitle: "4 al 9 de octubre · tramo abierto desde Charlottesville",
  },
  {
    key: "marshall",
    coordinates: HUNTINGTON,
    variant: "game-two",
    card: "sw",
    pin: "10",
    kicker: "10 OCT · PARTIDO 2",
    popupKicker: "SÁBADO 10 OCT · PARTIDO 2",
    shortTitle: "Marshall vs Coastal",
    title: "Marshall vs Coastal Carolina",
    lines: [
      "Joan C. Edwards Stadium · Hora TBA",
      "“We Are… Herd Strong” · 2001 3rd Ave.",
    ],
    blurb:
      "Joan C. Edwards Stadium · Hora por confirmar. “We Are… Herd Strong” · 2001 3rd Avenue.",
    note: `Regreso a CLT · ${legSummary("return")}`,
    popupNote: `Regreso en coche a CLT · ${legSummary("return")}`,
    linkLabel: "Abrir estadio ↗",
    href: "https://www.google.com/maps/dir/?api=1&destination=Joan+C.+Edwards+Stadium,+2001+3rd+Avenue,+Huntington,+WV+25703",
    a11yTitle: "10 de octubre · Marshall en Joan C. Edwards Stadium",
  },
];

export const FOCUS_VIEWS: Record<
  FocusKey,
  { label: string; bounds: LatLng[]; activeLegs: LegKey[]; maxZoom: number }
> = {
  all: {
    label: "Todo",
    bounds: [
      ...leg("to-game-one").path,
      ...leg("open-corridor").path,
      ...leg("return").path,
    ],
    activeLegs: ["to-game-one", "base-link", "open-corridor", "return"],
    maxZoom: 7,
  },
  "game-one": {
    label: "3 OCT · JMU",
    bounds: [
      [38.12, -79.18],
      [38.7, -78.55],
    ],
    activeLegs: ["to-game-one", "base-link"],
    maxZoom: 11,
  },
  "open-days": {
    label: "4–9 OCT",
    bounds: leg("open-corridor").path,
    activeLegs: ["base-link", "open-corridor"],
    maxZoom: 7,
  },
  "game-two": {
    label: "10 OCT · Coastal",
    bounds: [
      [38.13, -82.75],
      [38.67, -82.08],
    ],
    activeLegs: ["open-corridor", "return"],
    maxZoom: 11,
  },
  flights: {
    label: "Vuelos",
    bounds: [
      [34.9, -81.32],
      [35.52, -80.55],
    ],
    activeLegs: ["to-game-one", "return"],
    maxZoom: 11,
  },
};

export const FOCUS_KEYS = Object.keys(FOCUS_VIEWS) as FocusKey[];

/**
 * Leaflet injects `divIcon` and popup content as raw HTML, so every value that
 * ends up inside those templates goes through here first. The copy is static
 * today; escaping keeps it safe the day it stops being.
 */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function stopCardHtml(stop: Stop): string {
  const lines = stop.lines
    .map((line) => `<span class="fact-line">${escapeHtml(line)}</span>`)
    .join("");
  return [
    `<span class="place-pin">${escapeHtml(stop.pin)}</span>`,
    `<article class="fact-card">`,
    `<span class="fact-kicker">${escapeHtml(stop.kicker)}</span>`,
    `<strong>${escapeHtml(stop.shortTitle)}</strong>`,
    lines,
    `<b>${escapeHtml(stop.note)}</b>`,
    `</article>`,
  ].join("");
}

export function stopPopupHtml(stop: Stop): string {
  const body = stop.blurb
    ? escapeHtml(stop.blurb)
    : stop.lines.map(escapeHtml).join("<br>");
  return [
    `<span class="popup-kicker">${escapeHtml(stop.popupKicker ?? stop.kicker)}</span>`,
    `<strong>${escapeHtml(stop.title)}</strong>`,
    `<p>${body}</p>`,
    `<b>${escapeHtml(stop.popupNote ?? stop.note)}</b>`,
    `<a href="${escapeHtml(stop.href)}" target="_blank" rel="noopener noreferrer">${escapeHtml(stop.linkLabel)}</a>`,
  ].join("");
}

export function legChipHtml(key: LegKey): string {
  return [
    `<span class="drive-box">`,
    `<span class="drive-route">${escapeHtml(legRoute(key))}</span>`,
    `<b>${escapeHtml(legSummary(key))}</b>`,
    `</span>`,
  ].join("");
}

/** Shown bottom-right. Hand-maintained on purpose: it stamps the plan, not the
 * build. */
export const PLAN_STAMP = "PLAN BASE · 28 AGO 2026 · HORAS TBA";
