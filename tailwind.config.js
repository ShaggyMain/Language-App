/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        bg: "#0b1220",
        surface: "#111a2e",
        border: "#1f2a44",
        text: "#e6ecf5",
        muted: "#8aa0c2",
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
