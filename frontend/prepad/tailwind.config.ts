import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
         satoshi: ['Satoshi', 'sans-serif'],
         sans: ['Satoshi', 'sans-serif']
      },
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        gray: {
          900: '#0F0F0F',
          800: '#1A1A1A', 
          700: '#141414',
          600: '#1F1F1F',
          500: '#2A2A2A',
          400: '#767676',
          300: '#A0A0A0',
        },
        neutral: {
          800: '#141414',
          700: '#202020',
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
