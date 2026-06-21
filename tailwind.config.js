/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Backgrounds
        'sm-root':     '#131920',
        'sm-surface':  '#1C2530',
        'sm-elevated': '#222E3C',
        'sm-sidebar':  '#0F1520',
        // Borders
        'sm-border':   '#2E3A47',
        'sm-subtle':   '#243040',
        'sm-focus':    '#4A5E72',
        // Text
        'sm-primary':  '#F0F4F8',
        'sm-secondary':'#8D9BAA',
        'sm-muted':    '#5E7080',
        // Accent
        'amber':       '#F5A623',
        'amber-hover': '#E09410',
        // Semantic
        'profit':      '#4ADE80',
        'debt':        '#FC6B6B',
        'info':        '#60A5FA',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        'card':  '12px',
        'modal': '14px',
      },
      fontSize: {
        'label': ['11px', { letterSpacing: '0.06em', fontWeight: '600' }],
      },
    },
  },
  plugins: [],
}