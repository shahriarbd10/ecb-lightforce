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
          50: "#eef4ff",
          100: "#dbe7ff",
          200: "#b8ceff",
          300: "#8db1ff",
          400: "#5f8dff",
          500: "#3d6ff5",
          600: "#2f56cc",
          700: "#24439f",
          800: "#20387c",
          900: "#1a2f64"
        }
      }
    }
  },
  plugins: []
};

export default config;
