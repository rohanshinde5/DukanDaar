/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'sans-serif'],
      },
      colors: {
        brand: {
          bg: '#F8F9FA',
          surface: '#FFFFFF',
          text: '#334155',
          muted: '#64748B',
          green: {
            bg: '#E6F4EA',
            text: '#137333'
          },
          yellow: {
            bg: '#FEF7E0',
            text: '#B06000'
          },
          red: {
            bg: '#FCE8E6',
            text: '#C5221F'
          }
        }
      }
    },
  },
  plugins: [],
}
