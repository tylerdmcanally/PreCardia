/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Original CV Risk Calculator colors
        primary: {
          teal: '#5AA7A7',
          mint: '#96D7C6',
          lime: '#BAC94A',
          yellow: '#E2D36B',
          blue: '#6C8CBF',
        },
        // Unified CardioTools color system
        cardio: {
          primary: '#2c3e50',      // Dark blue-gray (PreCardia primary)
          secondary: '#3498db',     // Bright blue (PreCardia secondary)
          accent: '#e74c3c',        // Red accent
          success: '#27ae60',       // Green
          bg: '#f8f9fa',           // Light gray background
          card: '#ffffff',          // White cards
          text: '#333333',          // Dark text
          border: '#dee2e6',        // Light border
        },
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'cardio': '0 2px 4px rgba(0, 0, 0, 0.1)',
        'cardio-lg': '0 4px 6px rgba(0, 0, 0, 0.1)',
      },
    },
  },
  plugins: [],
}
