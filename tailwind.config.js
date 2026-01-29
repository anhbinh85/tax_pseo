/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        "brand-navy": "#0f172a",
        "brand-gold": "#fbbf24",
        "brand-red": "#dc2626"
      }
    }
  },
  plugins: []
};
