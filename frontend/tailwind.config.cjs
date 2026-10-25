module.exports = {
  content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"],
  theme: {
    extend: {
      colors: {
        primary: '#007A3D',
        'primary-dark': '#005f32',
        'primary-light': '#E8F5EE',
        secondary: '#F3F4F6',
        accent: '#E8590C',
        'accent-light': '#FFF4E6',
        bg: '#F6F7F5',
        border: '#E5E7EB',
        text: '#1F2937'
      },
      borderRadius: {
        lg: '12px',
        xl: '16px',
        '2xl': '20px'
      },
      fontFamily: {
        sans: ['"Be Vietnam Pro"', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif']
      },
      boxShadow: {
        card: '0 1px 2px rgba(16,24,40,.04), 0 1px 3px rgba(16,24,40,.06)',
        lift: '0 12px 24px -8px rgba(16,24,40,.15)'
      },
      keyframes: {
        'slide-in': { from: { transform: 'translateY(16px)', opacity: 0 }, to: { transform: 'translateY(0)', opacity: 1 } },
        marquee: { from: { transform: 'translateX(0)' }, to: { transform: 'translateX(-50%)' } }
      },
      animation: {
        'slide-in': 'slide-in .25s ease-out',
        marquee: 'marquee 40s linear infinite'
      },
      container: {
        center: true,
        padding: '1rem',
        screens: {
          '2xl': '1320px'
        }
      }
    }
  },
  plugins: []
}
