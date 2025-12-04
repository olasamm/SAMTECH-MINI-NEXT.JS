import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f3f4ff",
          100: "#e5e7ff",
          200: "#c3c8ff",
          300: "#9fa6ff",
          400: "#6b75ff",
          500: "#3b46ff",
          600: "#262fdb",
          700: "#1d25aa",
          800: "#171d82",
          900: "#121761"
        }
      },
      boxShadow: {
        soft: "0 18px 40px rgba(15, 23, 42, 0.22)"
      }
    }
  },
  plugins: []
};

export default config;


