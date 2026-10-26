import type { Metadata, Viewport } from "next";
import { ClerkProvider } from "@clerk/nextjs";
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
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f2ee" },
    { media: "(prefers-color-scheme: dark)", color: "#1e1a22" },
  ],
};

/** Aplica el tema antes de pintar para evitar un destello de color al cargar. */
const themeScript = `(function(){try{var t=localStorage.getItem("coach_theme");if(t!=="light"&&t!=="dark"){t=window.matchMedia("(prefers-color-scheme: light)").matches?"light":"dark";}document.documentElement.setAttribute("data-theme",t);}catch(e){document.documentElement.setAttribute("data-theme","dark");}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" data-theme="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-screen font-sans antialiased"><ClerkProvider>{children}</ClerkProvider></body>
    </html>
  );
}
