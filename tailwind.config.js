import colors from 'tailwindcss/colors'
import plugin from 'tailwindcss/plugin'

// Paletas usadas no app viram variáveis CSS: no modo escuro (classe .dark no <html>)
// os tons são espelhados, então `bg-white`, `text-slate-900`, `bg-indigo-100`... se
// adaptam sozinhos, sem precisar de `dark:` em cada classe.
const PALETTES = ['slate', 'indigo', 'blue', 'sky', 'cyan', 'teal', 'emerald', 'amber', 'orange', 'rose', 'fuchsia', 'violet']
const SHADES = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950]

// Tom usado no escuro para cada tom do claro. Fundos claros viram escuros e textos
// escuros viram claros; os tons médios (botões, swatches) quase não mudam — 600 vai
// só para 500 para o texto branco dos botões manter contraste.
const DARK_SHADE = { 50: 950, 100: 900, 200: 800, 300: 700, 400: 400, 500: 500, 600: 500, 700: 300, 800: 200, 900: 100, 950: 50 }
// Cinza tem mapa próprio: cards (`white`) ficam em slate-900, a página em slate-950
// e hovers/bordas (100/200) em slate-800, para continuarem visíveis sobre o card.
const DARK_SLATE = { 50: 950, 100: 800, 200: 800, 300: 700, 400: 500, 500: 400, 600: 300, 700: 200, 800: 100, 900: 50, 950: 'white' }

const channels = (hex) => {
  const n = parseInt(hex.slice(1), 16)
  return `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`
}
const shadeHex = (palette, shade) => (shade === 'white' ? '#ffffff' : colors[palette][shade])

const lightVars = { '--c-white': channels('#ffffff') }
const darkVars = { '--c-white': channels(colors.slate[900]) }
const themeColors = { white: 'rgb(var(--c-white) / <alpha-value>)' }

for (const palette of PALETTES) {
  themeColors[palette] = {}
  for (const shade of SHADES) {
    const name = `--c-${palette}-${shade}`
    const darkShade = palette === 'slate' ? DARK_SLATE[shade] : DARK_SHADE[shade]
    lightVars[name] = channels(colors[palette][shade])
    darkVars[name] = channels(shadeHex(palette, darkShade))
    themeColors[palette][shade] = `rgb(var(${name}) / <alpha-value>)`
  }
}

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        ...themeColors,
        pure: '#ffffff', // branco fixo (texto sobre botões coloridos, spinner)
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        cocogoose: ['Cocogoose', 'sans-serif'],
      }
    },
  },
  plugins: [
    plugin(({ addBase }) => {
      addBase({
        ':root': lightVars,
        '.dark': { ...darkVars, colorScheme: 'dark' },
        '.dark *, .dark ::before, .dark ::after': { '--tw-ring-offset-color': colors.slate[900] },
      })
    }),
  ],
}
