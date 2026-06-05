/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class", // 🔥 REQUIRED for global theme system

  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}", // 🔥 include components
  ],

  theme: {
    extend: {
      colors: {
        background: {
          light: "#ffffff",
          dark: "#000000",
        },
        foreground: {
          light: "#000000",
          dark: "#ffffff",
        },
        primary: "#ef4444", // 🔥 Nexusply red
      },

      boxShadow: {
        neon: "0 0 20px rgba(239,68,68,0.6)",
        "neon-strong": "0 0 40px rgba(239,68,68,0.9)",
      },

      backdropBlur: {
        xs: "2px",
      },

      borderColor: {
        glass: "rgba(255,255,255,0.1)",
      },
    },
  },

  plugins: [],
};