import type { Metadata, Viewport } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import "@fontsource-variable/oswald";
import "@fontsource-variable/inter";
import "./globals.css";

const siteUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000";
const description = "GYMRAT reúne tus entrenamientos, medidas corporales, nutrición y hábitos para ayudarte a seguir tu progreso.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "GYMRAT · Entrena, registra y evoluciona",
  description,
  openGraph: {
    type: "website",
    locale: "es_ES",
    siteName: "GYMRAT",
    title: "GYMRAT · La fuerza viene de Dios",
    description,
    images: [{ url: "/images/gymrat-og.jpg", width: 1200, height: 630, alt: "GYMRAT: la fuerza viene de Dios" }],
  },
  twitter: { card: "summary_large_image", title: "GYMRAT · La fuerza viene de Dios", description, images: ["/images/gymrat-og.jpg"] },
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
  const clerkPublishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

  return (
    <html lang="es" data-theme="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-screen font-sans antialiased">
        {clerkPublishableKey ? (
          <ClerkProvider publishableKey={clerkPublishableKey}>{children}</ClerkProvider>
        ) : children}
      </body>
    </html>
  );
}
