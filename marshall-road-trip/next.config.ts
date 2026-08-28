import type { NextConfig } from "next";

// GitHub Pages sirve ficheros estáticos desde una subcarpeta, así que ese
// destino necesita `output: "export"` y un basePath. Railway sirve el mismo
// código como contenedor con `output: "standalone"`. Un único interruptor.
const isStaticExport = process.env.PAGES_EXPORT === "1";
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

// El mapa solo habla consigo mismo y con los tiles de OpenStreetMap, así que la
// política puede ser estrecha. `unsafe-inline` sigue haciendo falta para los
// scripts (Next inyecta su arranque en línea) y para los estilos (Leaflet
// escribe atributos `style` en cada panel y cada tile al desplazar el mapa).
const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'self'",
  "object-src 'none'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://tile.openstreetmap.org https://*.tile.openstreetmap.org",
  "connect-src 'self'",
  "font-src 'self' data:",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains",
  },
];

const nextConfig: NextConfig = isStaticExport
  ? {
      // Un hosting estático no ejecuta nada nuestro: no hay servidor que ponga
      // cabeceras, así que aquí no se declaran (Next las rechazaría).
      output: "export",
      basePath,
      trailingSlash: true,
      images: { unoptimized: true },
      reactStrictMode: true,
      poweredByHeader: false,
    }
  : {
      // Railway arranca un contenedor: `standalone` emite un servidor
      // autónomo con solo las dependencias que Next traza.
      output: "standalone",
      reactStrictMode: true,
      poweredByHeader: false,
      async headers() {
        return [{ source: "/:path*", headers: securityHeaders }];
      },
    };

export default nextConfig;
