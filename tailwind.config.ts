import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
       extend: {
         colors: {
           base: "#0A0A0A",
           panel: "#111113",
           edge: "#26262A",
           fg: "#FAFAFA",
           muted: "#A1A1AA",
           primary: "#FF8A1F",
           accent: "#FF8A1F",
         },
         fontFamily: { sans: ["var(--font-inter)", "Inter", "sans-serif"] },
         borderRadius: { md: "10px", xl: "20px" },
         boxShadow: {
           glow: "0 20px 60px -30px #FF8A1F80",
           soft: "0 10px 30px -20px #00000080",
         },
       },
     },
     plugins: [require("tailwindcss-animate")],
}
export default config
