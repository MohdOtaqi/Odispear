// Modern Design System for Unity Platform

export const theme = {
  // Color Palette - Modern Dark Theme
  colors: {
    // Primary Brand Colors
    primary: {
      50: '#f0f4ff',
      100: '#e0eaff',
      200: '#c7d7ff',
      300: '#a5bbff',
      400: '#8098ff',
      500: '#6366f1', // Main brand color
      600: '#4f46e5',
      700: '#4338ca',
      800: '#3730a3',
      900: '#312e81',
    },
    
    // Accent Colors
    accent: {
      purple: '#a855f7',
      blue: '#3b82f6',
      cyan: '#06b6d4',
      green: '#10b981',
      yellow: '#f59e0b',
      red: '#ef4444',
      pink: '#ec4899',
    },
    
    // Semantic Colors
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
    
    // Background Colors (Discord-inspired dark theme)
    background: {
      primary: '#1e1f22',      // Main background
      secondary: '#2b2d31',    // Cards, elevated surfaces
      tertiary: '#313338',     // Modals, popups
      hover: '#3f4147',        // Hover states
      active: '#4e5058',       // Active/pressed states
    },
    
    // Text Colors
    text: {
      primary: '#f2f3f5',      // Main text
      secondary: '#b5bac1',    // Secondary text
      tertiary: '#80848e',     // Muted text
      disabled: '#4e5058',     // Disabled text
      link: '#00a8fc',         // Links
      linkHover: '#00c0fc',    // Link hover
    },
    
    // Border Colors
    border: {
      default: '#3f4147',
      hover: '#4e5058',
      focus: '#6366f1',
    },
    
    // Status Colors
    status: {
      online: '#23a559',
      idle: '#f0b232',
      dnd: '#f23f43',
      offline: '#80848e',
      streaming: '#593695',
    },
    
    // Voice Colors
    voice: {
      speaking: '#23a559',
      muted: '#f23f43',
      deafened: '#ed4245',
    },
  },
  
  // Typography
  typography: {
    fonts: {
      primary: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      display: "'Poppins', 'Inter', sans-serif",
      mono: "'JetBrains Mono', 'Fira Code', 'Courier New', monospace",
    },
    sizes: {
      xs: '0.75rem',      // 12px
      sm: '0.875rem',     // 14px
      base: '1rem',       // 16px
      lg: '1.125rem',     // 18px
      xl: '1.25rem',      // 20px
      '2xl': '1.5rem',    // 24px
      '3xl': '1.875rem',  // 30px
      '4xl': '2.25rem',   // 36px
      '5xl': '3rem',      // 48px
    },
    weights: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
  },
  
  // Spacing Scale
  spacing: {
    0: '0',
    1: '0.25rem',   // 4px
    2: '0.5rem',    // 8px
    3: '0.75rem',   // 12px
    4: '1rem',      // 16px
    5: '1.25rem',   // 20px
    6: '1.5rem',    // 24px
    8: '2rem',      // 32px
    10: '2.5rem',   // 40px
    12: '3rem',     // 48px
    16: '4rem',     // 64px
    20: '5rem',     // 80px
    24: '6rem',     // 96px
  },
  
  // Border Radius
  radius: {
    none: '0',
    sm: '0.25rem',    // 4px
    base: '0.5rem',   // 8px
    md: '0.75rem',    // 12px
    lg: '1rem',       // 16px
    xl: '1.5rem',     // 24px
    '2xl': '2rem',    // 32px
    full: '9999px',
  },
  
  // Shadows
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.3)',
    base: '0 1px 3px 0 rgba(0, 0, 0, 0.4), 0 1px 2px -1px rgba(0, 0, 0, 0.4)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.4), 0 2px 4px -2px rgba(0, 0, 0, 0.4)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.5), 0 4px 6px -4px rgba(0, 0, 0, 0.5)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5)',
    '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.6)',
    glow: '0 0 20px rgba(99, 102, 241, 0.3)',
    glowLg: '0 0 40px rgba(99, 102, 241, 0.4)',
  },
  
  // Transitions
  transitions: {
    fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
    base: '200ms cubic-bezier(0.4, 0, 0.2, 1)',
    slow: '300ms cubic-bezier(0.4, 0, 0.2, 1)',
    bounce: '500ms cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  },
  
  // Z-index layers
  zIndex: {
    base: 0,
    dropdown: 1000,
    sticky: 1100,
    modal: 1200,
    popover: 1300,
    tooltip: 1400,
    notification: 1500,
  },
  
  // Breakpoints
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },
} as const;

export type Theme = typeof theme;
