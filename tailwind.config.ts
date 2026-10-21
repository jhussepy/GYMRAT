import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0E1624",
        panel: "#152238",
        raised: "#1B2D48",
        line: "#2A3F5F",
        chalk: "#EFE9DC",
        muted: "#9AA8BD",
        mint: "#2FB58C",
        amber: "#F2B544",
        coral: "#E8735A",
        sky: "#6EB5E8",
        dusk: "#A48BE0",
        steel: "#5D7BA8",
      },
      fontFamily: {
        sans: ["ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
        serif: ["ui-serif", "Georgia", "Cambria", "Times New Roman", "serif"],
      },
    },
  },
  plugins: [],
};
export default config;
