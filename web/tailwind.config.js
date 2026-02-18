/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"] ,
  theme: {
    extend: {
      fontFamily: {
        display: ["'Space Grotesk'", "sans-serif"],
        body: ["'IBM Plex Sans'", "sans-serif"]
      },
      colors: {
        ink: "#0c0f14",
        fog: "#f6f6f2",
        accent: "#ff8a3d",
        sea: "#1c4cff",
        moss: "#1f9d63",
        sand: "#f1e9dc"
      },
      boxShadow: {
        soft: "0 20px 60px rgba(12, 15, 20, 0.15)"
      }
    }
  },
  plugins: []
};
