export const ESTADO_INICIAL = 'Pendiente de Autorización'

// Orden en que se muestran las tarjetas de conteo.
const ORDEN = [
  'Pendiente de Autorización',
  'Para Asignar',
  'Asignado',
  'Entregado',
  'No Entregado',
  'Rechazado',
]

export function ordenEstado(estado: string | null): number {
  const i = ORDEN.indexOf(estado ?? '')
  return i === -1 ? ORDEN.length : i
}

export interface PaletaEstado {
  /** color sólido (punto indicador) */
  punto: string
  /** texto del chip */
  texto: string
  /** fondo del chip */
  fondo: string
  /** borde del chip */
  borde: string
}

// Colores por estado: los sólidos son los de la app Flutter; los tonos
// del chip (texto/fondo) vienen del diseño de Stitch.
const PALETAS: Record<string, PaletaEstado> = {
  'Pendiente de Autorización': {
    punto: '#F9CF58',
    texto: '#4A3800',
    fondo: 'rgba(249,207,88,0.25)',
    borde: '#F9CF58',
  },
  'Para Asignar': {
    punto: '#0050FF',
    texto: '#001A66',
    fondo: 'rgba(0,80,255,0.12)',
    borde: '#0050FF',
  },
  Asignado: {
    punto: '#81F47A',
    texto: '#0E470A',
    fondo: 'rgba(129,244,122,0.25)',
    borde: '#81F47A',
  },
  Entregado: {
    punto: '#39D2C0',
    texto: '#0A423C',
    fondo: 'rgba(57,210,192,0.20)',
    borde: '#39D2C0',
  },
  'No Entregado': {
    punto: '#FF5963',
    texto: '#7A0C12',
    fondo: 'rgba(255,89,99,0.20)',
    borde: '#FF5963',
  },
  Rechazado: {
    punto: '#FF0000',
    texto: '#7A0000',
    fondo: 'rgba(255,0,0,0.15)',
    borde: '#FF0000',
  },
}

const NEUTRA: PaletaEstado = {
  punto: '#767685',
  texto: '#454653',
  fondo: 'rgba(118,118,133,0.15)',
  borde: '#C6C5D5',
}

export function paletaEstado(estado: string | null): PaletaEstado {
  return PALETAS[estado ?? ''] ?? NEUTRA
}

/** Nombre corto para el chip de las tarjetas de conteo. */
export function etiquetaCorta(estado: string | null): string {
  return estado === 'Pendiente de Autorización' ? 'Pendiente' : (estado ?? '-')
}

// "2025-03-05" -> "5/3/2025" (equivale al formato "d/M/y" de la app original).
// Se parsea a mano para evitar corrimientos por zona horaria.
export function formatFecha(fecha: string | null): string {
  if (!fecha) return '-'
  const [y, m, d] = fecha.split('-').map(Number)
  if (!y || !m || !d) return fecha
  return `${d}/${m}/${y}`
}

/** Fecha de hoy en hora local como "YYYY-MM-DD" (toISOString usa UTC y de noche da el día siguiente). */
export function hoyISO(): string {
  const d = new Date()
  const mes = String(d.getMonth() + 1).padStart(2, '0')
  const dia = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${mes}-${dia}`
}

/** "hace 5 min", "hace 2 h"... a partir de un timestamp en ms. */
export function haceCuanto(desde: number, ahora: number): string {
  if (!desde) return 'sin datos'
  const min = Math.floor((ahora - desde) / 60_000)
  if (min < 1) return 'recién'
  if (min < 60) return `hace ${min} min`
  return `hace ${Math.floor(min / 60)} h`
}

/** Iniciales para el avatar: "Martín Bustos" -> "MB". */
export function iniciales(nombre: string | null | undefined, email?: string): string {
  const fuente = nombre?.trim() || email?.split('@')[0] || '?'
  const partes = fuente.split(/[\s._-]+/).filter(Boolean)
  const letras = partes.length > 1 ? partes[0][0] + partes[1][0] : fuente.slice(0, 2)
  return letras.toUpperCase()
}
