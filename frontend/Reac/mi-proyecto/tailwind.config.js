/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#00d2ff",      // Celeste principal
        secondary: "#3a7bd5",    // Azul secundario
        accent: "#ffd600",       // Amarillo acento
        dark: "#1a237e",         // Azul oscuro
        light: "#e3f2fd",        // Fondo claro
      },
    },
  },
  plugins: [],
}

