/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // MOT Design System - Luxury Dark Mode
        mot: {
          black: '#0A0A0B',
          surface: '#141416',
          'surface-subtle': '#1C1C1F',
          border: '#2A2A2E',
          'border-glow': '#3D3D42',
          gold: '#F5A623',
          'gold-light': '#FFD93D',
          'gold-deep': '#C4841D',
        },
        // Legacy Unity Platform colors
        primary: {
          50: '#e0f9ff',
          100: '#b3f0ff',
          200: '#80e7ff',
          300: '#4ddeff',
          400: '#26d5ff',
          500: '#00ccff',
          600: '#00b8e6',
          700: '#009fcc',
          800: '#0086b3',
          900: '#006d99',
        },
        accent: {
          50: '#ffe0f7',
          100: '#ffb3eb',
          200: '#ff80df',
          300: '#ff4dd3',
          400: '#ff26cb',
          500: '#ff00c3',
          600: '#e600b0',
          700: '#cc009d',
          800: '#b3008a',
          900: '#990077',
        },
        neutral: {
          50: '#f5f7fa',
          100: '#e8ecf1',
          200: '#d1d9e3',
          300: '#b4c1d3',
          400: '#8a9bb0',
          500: '#5d6d85',
          600: '#485666',
          700: '#353f4d',
          800: '#1f2630',
          850: '#181d26',
          900: '#0f1319',
        },
        success: '#00ff88',
        warning: '#ffaa00',
        error: '#ff3366',
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #00ccff 0%, #ff00c3 100%)',
        'gradient-secondary': 'linear-gradient(135deg, #009fcc 0%, #00ccff 100%)',
        'gradient-accent': 'linear-gradient(135deg, #e600b0 0%, #ff26cb 100%)',
        'gradient-success': 'linear-gradient(135deg, #00ff88 0%, #00cc99 100%)',
        'gradient-danger': 'linear-gradient(135deg, #ff3366 0%, #ff6699 100%)',
        'gradient-radial': 'radial-gradient(circle, var(--tw-gradient-stops))',
        'gradient-gold': 'linear-gradient(135deg, #FFD93D 0%, #F5A623 50%, #C4841D 100%)',
        'gradient-gold-subtle': 'linear-gradient(135deg, rgba(245,166,35,0.1) 0%, rgba(255,217,61,0.05) 100%)',
      },
      boxShadow: {
        'glow': '0 0 20px rgba(0, 204, 255, 0.4)',
        'glow-accent': '0 0 20px rgba(255, 0, 195, 0.4)',
        'glow-success': '0 0 20px rgba(0, 255, 136, 0.4)',
        'glass': '0 8px 32px rgba(0, 0, 0, 0.37)',
        'gold-glow': '0 0 30px rgba(245, 166, 35, 0.4)',
        'gold-glow-lg': '0 0 50px rgba(245, 166, 35, 0.5)',
        'gold-glow-sm': '0 4px 20px rgba(245, 166, 35, 0.3)',
      },
      animation: {
        'slide-in-up': 'slideInUp 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        'slide-in-right': 'slideInRight 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        'scale-in': 'scaleIn 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        'fade-in': 'fadeIn 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        'pulse-glow': 'pulseGlow 2s cubic-bezier(0.4, 0, 0.2, 1) infinite',
        'float': 'float 3s cubic-bezier(0.4, 0, 0.2, 1) infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'spin-slow': 'spin 3s linear infinite',
        'gold-pulse': 'goldPulse 2s ease-in-out infinite',
        'glow-float': 'glowFloat 6s ease-in-out infinite',
        'border-glow': 'borderGlow 3s ease-in-out infinite',
      },
      keyframes: {
        slideInUp: {
          from: { transform: 'translateY(10px)', opacity: '0' },
          to: { transform: 'translateY(0)', opacity: '1' },
        },
        slideInRight: {
          from: { transform: 'translateX(-10px)', opacity: '0' },
          to: { transform: 'translateX(0)', opacity: '1' },
        },
        scaleIn: {
          from: { transform: 'scale(0.95)', opacity: '0' },
          to: { transform: 'scale(1)', opacity: '1' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 8px rgba(0, 204, 255, 0.4)' },
          '50%': { boxShadow: '0 0 20px rgba(0, 204, 255, 0.8)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
        goldPulse: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(245, 166, 35, 0.4)' },
          '50%': { boxShadow: '0 0 40px rgba(245, 166, 35, 0.6)' },
        },
        glowFloat: {
          '0%, 100%': { transform: 'translateY(0)', filter: 'brightness(1)' },
          '50%': { transform: 'translateY(-10px)', filter: 'brightness(1.1)' },
        },
        borderGlow: {
          '0%, 100%': { borderColor: 'rgba(245, 166, 35, 0.3)' },
          '50%': { borderColor: 'rgba(245, 166, 35, 0.6)' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
      transitionTimingFunction: {
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
        'bounce': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        'spring': 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
      },
    },
  },
  plugins: [],
}
