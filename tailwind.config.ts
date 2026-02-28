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
          50: "#f4fbfb",
          100: "#daf4f2",
          200: "#afe9e3",
          300: "#7ad5cf",
          400: "#35a29f",
          500: "#088395",
          600: "#0a6677",
          700: "#0c5161",
          800: "#0d394d",
          900: "#071952"
        }
      }
    }
  },
  plugins: []
};

export default config;
