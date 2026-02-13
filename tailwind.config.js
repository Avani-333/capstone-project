export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: "#414BEA",
          primaryTint: "#D9E2FF",
          accent: "#F05537",
          surface: "#F6F5F5",
          white: "#FFFFFF",
          violet: "#7752FE",
          navy: "#190482",
          sky: "#DDF2FD",
          skyTint: "#C2D9FF",
          ink: "#3D3B40",
          primaryAlt: "#525CEB",
          slate: "#BFCFE7",
          lavender: "#F8EDFF",
        },
      },
      fontFamily: {
        sans: ["Poppins", "ui-sans-serif", "system-ui", "sans-serif"],
        secondary: ["Open Sans", "ui-sans-serif", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
}