import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#1B6B4A",
        "primary-dark": "#0D3D28",
        gold: "#C9A84C",
        surface: "#FAF6F0",
      },
      fontFamily: {
        arabic: ["var(--font-cairo)", "sans-serif"],
        amiri: ["var(--font-amiri)", "serif"],
        quran: ["var(--font-amiri)", "'UthmanicHafs1Ver18'", "serif"],
        inter: ["var(--font-inter)", "sans-serif"],
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
      },
    },
  },
  plugins: [],
};

export default config;
