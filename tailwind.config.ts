import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        pitch: {
          50: "#ebfff3",
          100: "#d2ffe4",
          200: "#a7ffc8",
          300: "#73f7a5",
          400: "#1adb65",
          500: "#08ba4f",
          600: "#00943f",
          700: "#006f32",
          800: "#06572b",
          900: "#064825"
        }
      }
    }
  },
  plugins: []
};

export default config;
