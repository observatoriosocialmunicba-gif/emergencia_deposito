// Tokens del design system de Stitch, tipados para usarlos desde TS
// (gráficos, estilos inline, etc.). Tailwind lee los mismos valores desde
// el bloque @theme de src/index.css: si cambia uno, cambiar el otro.
export const colors = {
  primary: '#000251',
  primaryContainer: '#00058d',
  secondary: '#006a60',
  secondaryContainer: '#6af9e6',
  tertiary: '#270900',
  error: '#ba1a1a',
  errorContainer: '#ffdad6',
  background: '#f5faff',
  surface: '#f5faff',
  surfaceContainer: '#e3effa',
  onSurface: '#111d25',
  onSurfaceVariant: '#454653',
  outline: '#767685',
  outlineVariant: '#c6c5d5',
  ink: '#14181b',
  inkSoft: '#57636c',
  line: '#e2e8f0',
  page: '#f1f4f8',
  teal: '#39d2c0',
  success: '#249689',
  danger: '#ff5963',
} as const

export const spacing = {
  xs: '0.25rem',
  sm: '0.5rem',
  md: '1rem',
  lg: '1.5rem',
  xl: '2rem',
  margin: '1rem',
  marginTablet: '1.5rem',
  marginDesktop: '2.5rem',
  gutter: '1rem',
  gutterDesktop: '1.5rem',
} as const
