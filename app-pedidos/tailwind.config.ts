module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      colors: {
        primary: '#1D4ED8', // Example primary color
        secondary: '#9333EA', // Example secondary color
        accent: '#FBBF24', // Example accent color
      },
      spacing: {
        '128': '32rem', // Custom spacing
        '144': '36rem', // Custom spacing
      },
    },
  },
  plugins: [],
}