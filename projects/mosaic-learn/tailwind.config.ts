import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./src/**/*.{ts,tsx}", "../../core/src/**/*.{ts,tsx}"],
  darkMode: ["class", '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        brand: { DEFAULT: "rgb(var(--brand) / <alpha-value>)", dark: "rgb(var(--brand-dark) / <alpha-value>)" },
        accent: { DEFAULT: "rgb(var(--accent) / <alpha-value>)" },
      },
    },
  },
  plugins: [],
};
export default config;
