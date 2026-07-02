import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#F4F7F2",
        surface: "#FFFFFF",
        ink: "#111827",
        forge: "#245C4A",
        amber: "#D97706",
        blue: "#2563EB",
        danger: "#B91C1C",
        line: "#D7DED3",
        muted: "#667085",
        forgeSoft: "#245C4A14",
      },
      fontFamily: {
        sans: ["ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Roboto", "Helvetica Neue", "Arial", "sans-serif"],
        mono: ["ui-monospace", "Cascadia Code", "SFMono-Regular", "Menlo", "Consolas", "monospace"],
      },
      borderRadius: { DEFAULT: "6px", md: "6px", lg: "8px" },
      boxShadow: { panel: "0 1px 2px rgba(17,24,39,0.05)", pop: "0 10px 30px -12px rgba(17,24,39,0.22)" },
      keyframes: { fadeUp: { from: { opacity: "0", transform: "translateY(5px)" }, to: { opacity: "1", transform: "translateY(0)" } } },
      animation: { fadeUp: "fadeUp 0.25s ease-out" },
    },
  },
  plugins: [],
};
export default config;
