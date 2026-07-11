import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'te-red': '#E3120B',
        'te-fg': '#0A0A0A',
        'te-muted': '#F5F5F5',
        'te-muted-fg': '#525252',
        'te-border': '#E5E5E5',
      },
      fontFamily: {
        heading: ['Public Sans', 'sans-serif'],
        body: ['Source Serif 4', 'Georgia', 'serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      maxWidth: {
        'content': '1200px',
      },
      typography: {
        DEFAULT: {
          css: {
            maxWidth: 'none',
          },
        },
      },
    },
  },
  plugins: [],
}

export default config
