import type { Metadata, Viewport } from "next";
import "@fontsource-variable/oswald";
import "@fontsource-variable/inter";
import "./globals.css";

export const metadata: Metadata = {
  title: "Coach Pro · Gym, nutrición y progreso",
  description: "Tu día de 02:30 a 22:00 en un solo lugar: rutina de Smart Fit, tápers, agua, estudio de trading y peso.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#1e1a22",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="min-h-screen font-sans antialiased">{children}</body>
    </html>
  );
}
