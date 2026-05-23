/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg: { 950: '#05060f', 900: '#0a0b1a', 800: '#10122a', 700: '#181a37' },
        neon: {
          cyan: '#22d3ee',
          purple: '#a855f7',
          pink: '#ec4899',
          violet: '#8b5cf6',
        },
        glass: 'rgba(255,255,255,0.06)',
        'glass-strong': 'rgba(255,255,255,0.1)',
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'grad-neon':
          'linear-gradient(135deg, #22d3ee 0%, #a855f7 50%, #ec4899 100%)',
        'grad-mesh':
          'radial-gradient(at 20% 30%, rgba(168,85,247,0.30) 0px, transparent 50%), radial-gradient(at 80% 70%, rgba(34,211,238,0.30) 0px, transparent 50%), radial-gradient(at 60% 20%, rgba(236,72,153,0.18) 0px, transparent 50%)',
        'grad-cyan-violet':
          'linear-gradient(135deg, #22d3ee 0%, #8b5cf6 100%)',
        'grad-purple-pink':
          'linear-gradient(135deg, #a855f7 0%, #ec4899 100%)',
      },
      boxShadow: {
        glow: '0 0 40px rgba(168, 85, 247, 0.35)',
        'glow-cyan': '0 0 40px rgba(34, 211, 238, 0.35)',
        'glow-pink': '0 0 40px rgba(236, 72, 153, 0.35)',
        'glow-strong': '0 0 80px rgba(168, 85, 247, 0.55)',
      },
      backdropBlur: { glass: '16px' },
      animation: {
        'gradient-shift': 'gradientShift 14s ease infinite',
        float: 'float 8s ease-in-out infinite',
        'float-slow': 'float 14s ease-in-out infinite',
        'pulse-glow': 'pulseGlow 3s ease-in-out infinite',
      },
      keyframes: {
        gradientShift: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: 0.5 },
          '50%': { opacity: 1 },
        },
      },
    },
  },
  plugins: [],
};
