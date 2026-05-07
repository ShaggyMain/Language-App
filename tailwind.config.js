/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Theme-driven tokens — driven by CSS variables set on the root
        // view. See lib/theme.ts for the dark/light palettes.
        bg: "rgb(var(--color-bg) / <alpha-value>)",
        surface: "rgb(var(--color-surface) / <alpha-value>)",
        border: "rgb(var(--color-border) / <alpha-value>)",
        text: "rgb(var(--color-text) / <alpha-value>)",
        muted: "rgb(var(--color-muted) / <alpha-value>)",
        // Brand + semantic stay constant across themes.
        en: "#3b82f6",
        de: "#f59e0b",
        es: "#ef4444",
        success: "#22c55e",
        warning: "#eab308",
        error: "#f43f5e",
      },
    },
  },
  plugins: [],
};
