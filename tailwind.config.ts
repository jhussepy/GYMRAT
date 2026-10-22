import type { Config } from "tailwindcss";

/** Los colores salen de variables CSS (ver globals.css) para soportar modo claro y oscuro. */
const token = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: token("ink"),
        panel: token("panel"),
        raised: token("raised"),
        line: token("line"),
        chalk: token("chalk"),
        muted: token("muted"),
        flame: token("flame"),
        amber: token("amber"),
        rose: token("rose"),
        sky: token("sky"),
        dusk: token("dusk"),
        steel: token("steel"),
      },
      fontFamily: {
        display: ["'Oswald Variable'", "Oswald", "'Arial Narrow'", "sans-serif"],
        sans: ["'Inter Variable'", "Inter", "ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
