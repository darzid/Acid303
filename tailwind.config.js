/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./*.html",
    "./js/**/*.js"
  ],
  safelist: [
    // Ensure dynamic theme colors used in jamconnect-app.js are preserved
    { pattern: /(bg|border|shadow)-(emerald|amber)-(300|400|500)/ },
    'scale-125'
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
