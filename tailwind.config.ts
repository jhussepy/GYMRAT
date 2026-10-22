import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#1E1A22",
        panel: "#2A252F",
        raised: "#34303A",
        line: "#51495A",
        chalk: "#F4F1EE",
        muted: "#B3ABB8",
        flame: "#F76A50",
        amber: "#F5B14C",
        rose: "#FF6B8A",
        sky: "#7FB6E0",
        dusk: "#A58BD9",
        steel: "#6C7FA6",
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
