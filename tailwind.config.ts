import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./data/**/*.{js,ts,jsx,tsx,mdx}",
    "./state/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        blipBlue: "#006CFF",
        blipBlueDark: "#004EBD",
        blipBlueLight: "#2F8CFF",
        blipPink: "#F36CB5"
      },
      fontFamily: {
        sans: [
          "Arial",
          "Helvetica",
          "ui-sans-serif",
          "system-ui",
          "sans-serif"
        ],
        mono: [
          "Courier New",
          "ui-monospace",
          "SFMono-Regular",
          "monospace"
        ]
      }
    }
  },
  plugins: []
};

export default config;
