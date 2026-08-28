/**
 * Loads the running container in a real browser and asserts the map actually
 * draws. `curl` can only prove the HTML shell is served; everything that makes
 * this app an app happens after Leaflet boots on the client.
 */
import { chromium } from "playwright";

const base = process.argv[2] ?? "http://localhost:8080";
const errors = [];
const warnings = [];

const isTile = (url) => url.includes("tile.openstreetmap.org");

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

page.on("console", (msg) => {
  if (msg.type() === "error") errors.push(`console: ${msg.text()}`);
});
page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));
page.on("requestfailed", (request) => {
  const line = `${request.url()} (${request.failure()?.errorText})`;
  // OpenStreetMap throttles datacentre IPs; that is not this app's bug.
  (isTile(request.url()) ? warnings : errors).push(`requestfailed: ${line}`);
});

await page.goto(base, { waitUntil: "load", timeout: 60_000 });

await page.waitForSelector(".leaflet-container", { timeout: 30_000 });
// The overlay only unmounts once the map reports itself ready.
await page.waitForSelector(".map-loading", { state: "detached", timeout: 30_000 });

const routes = await page.locator(".leaflet-overlay-pane path").count();
const cards = await page.locator(".fact-card").count();
const chips = await page.locator(".drive-box").count();
const tiles = await page.locator("img.leaflet-tile-loaded").count();

const flights = page.getByRole("button", { name: "Vuelos" });
await flights.click();
await page.waitForTimeout(1500);
const pressed = await flights.getAttribute("aria-pressed");

await page.screenshot({ path: process.env.SHOT ?? "map.png" });

await page.setViewportSize({ width: 390, height: 844 });
await page.waitForTimeout(1200);
await page.screenshot({ path: process.env.SHOT_MOBILE ?? "map-mobile.png" });

await browser.close();

if (tiles === 0) warnings.push("no se cargó ningún tile de OpenStreetMap");

const checks = [
  ["4 tramos dibujados", routes >= 4, `${routes} paths`],
  ["4 fichas de parada", cards === 4, `${cards} fichas`],
  ["4 etiquetas de distancia", chips === 4, `${chips} etiquetas`],
  ["el botón Vuelos queda activo", pressed === "true", `aria-pressed=${pressed}`],
];

for (const [name, ok, detail] of checks) {
  console.log(`${ok ? "OK  " : "FALLA"} ${name} — ${detail}`);
  if (!ok) errors.push(`check: ${name} (${detail})`);
}
console.log(`INFO tiles cargados: ${tiles}`);
for (const warning of warnings) console.log(`AVISO ${warning}`);

if (errors.length > 0) {
  console.error("\nErrores:");
  for (const error of errors) console.error(`  - ${error}`);
  process.exit(1);
}
console.log("\nEl mapa se dibuja correctamente.");
