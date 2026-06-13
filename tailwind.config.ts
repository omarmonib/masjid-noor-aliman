import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#1B6B4A",
          dark: "#0D3D28",
          foreground: "#FAF6F0",
        },
        gold: {
          DEFAULT: "#C9A84C",
          light: "#E2C77A",
        },
        surface: "#FAF6F0",
      },
      fontFamily: {
        arabic: ["var(--font-cairo)", "serif"],
        quran:  ["var(--font-amiri)", "serif"],
        latin:  ["var(--font-inter)", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
