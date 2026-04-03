import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    // Full breakpoint system — mobile-first architecture
    screens: {
      xs: '375px',   // Modern phones
      sm: '640px',   // Large phones / phablets
      md: '768px',   // Tablets (portrait)
      lg: '1024px',  // Tablets (landscape) / small laptops
      xl: '1280px',  // Desktop
      '2xl': '1440px', // Wide desktop / goldmine zone
    },
    extend: {
      fontFamily: {
        geist: ['var(--font-geist)', 'system-ui', 'sans-serif'],
        'dm-sans': ['var(--font-dm-sans)', 'system-ui', 'sans-serif'],
        'geist-mono': ['var(--font-geist-mono)', 'monospace'],
      },
      borderRadius: {
        lg: '8px',
        md: '6px',
        sm: '4px',
        xl: '12px',
        '2xl': '16px',
        '3xl': '24px',
      },
      maxWidth: {
        conduit: '1120px',
      },
      // Named z-index layers — every future page uses these
      zIndex: {
        base: '0',
        raised: '10',
        sticky: '30',
        'sticky-bar': '40',
        nav: '50',
        'drawer-backdrop': '59',
        drawer: '60',
        modal: '70',
        toast: '80',
      },
      // Spring / smooth easing
      transitionTimingFunction: {
        spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
        'ease-out-expo': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
      keyframes: {
        'slide-in-right': {
          from: { transform: 'translateX(100%)' },
          to: { transform: 'translateX(0)' },
        },
        'slide-out-right': {
          from: { transform: 'translateX(0)' },
          to: { transform: 'translateX(100%)' },
        },
        'slide-up': {
          from: { transform: 'translateY(100%)', opacity: '0.8' },
          to: { transform: 'translateY(0)', opacity: '1' },
        },
        'slide-down': {
          from: { transform: 'translateY(-8px)', opacity: '0' },
          to: { transform: 'translateY(0)', opacity: '1' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          from: { opacity: '0', transform: 'scale(0.95)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'count-up': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'backdrop-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
      },
      animation: {
        'slide-in-right': 'slide-in-right 0.32s cubic-bezier(0.4, 0, 0.2, 1) both',
        'slide-out-right': 'slide-out-right 0.28s cubic-bezier(0.4, 0, 0.2, 1) both',
        'slide-up': 'slide-up 0.35s cubic-bezier(0.4, 0, 0.2, 1) both',
        'slide-down': 'slide-down 0.2s cubic-bezier(0.4, 0, 0.2, 1) both',
        'fade-in': 'fade-in 0.2s ease both',
        'fade-up': 'fade-up 0.35s cubic-bezier(0.4, 0, 0.2, 1) both',
        'scale-in': 'scale-in 0.2s cubic-bezier(0.4, 0, 0.2, 1) both',
        shimmer: 'shimmer 1.6s ease-in-out infinite',
        'count-up': 'count-up 0.4s ease both',
        'backdrop-in': 'backdrop-in 0.2s ease both',
      },
      spacing: {
        'nav': '56px',       // Height of top nav
        'safe-bottom': 'env(safe-area-inset-bottom, 0px)',
        'safe-top': 'env(safe-area-inset-top, 0px)',
      },
    },
  },
  plugins: [],
}

export default config
