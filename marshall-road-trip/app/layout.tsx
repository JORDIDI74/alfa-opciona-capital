import type { Metadata, Viewport } from "next";
// Leaflet first: `globals.css` overrides its map, popup and control styles and
// the cascade follows import order.
import "leaflet/dist/leaflet.css";
import "./globals.css";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.RAILWAY_PUBLIC_DOMAIN
    ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`
    : null);

// Vacío en Railway (el sitio cuelga de la raíz); "/alfa-opciona-capital/viaje"
// cuando se publica como export estático en GitHub Pages.
const prefix = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const title = "Marshall Road Trip · Octubre 2026";
const description =
  "Mapa interactivo a pantalla completa del viaje en coche para ver a Marshall el 3 y el 10 de octubre de 2026.";

export const metadata: Metadata = {
  ...(siteUrl ? { metadataBase: new URL(siteUrl) } : {}),
  title,
  description,
  applicationName: "Marshall Road Trip",
  manifest: `${prefix}/manifest.webmanifest`,
  icons: {
    icon: `${prefix}/favicon.svg`,
    shortcut: `${prefix}/favicon.svg`,
    apple: `${prefix}/favicon.svg`,
  },
  appleWebApp: {
    capable: true,
    title: "Marshall Road Trip",
    statusBarStyle: "black-translucent",
  },
  openGraph: {
    type: "website",
    locale: "es_ES",
    siteName: "Marshall Road Trip",
    title,
    description,
    ...(siteUrl ? { url: siteUrl } : {}),
  },
  twitter: { card: "summary", title, description },
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // The map fills the screen edge to edge, so it has to paint under the notch.
  viewportFit: "cover",
  themeColor: "#07100c",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="antialiased">{children}</body>
    </html>
  );
}
