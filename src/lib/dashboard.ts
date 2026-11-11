import { hoyISO } from './estados'
import type { DiaDashboard } from './types'

// Cálculos del dashboard. Las fechas son 'YYYY-MM-DD' y se operan en UTC para que la zona
// horaria del navegador no corra un día.

export type Granularidad = 'dia' | 'semana' | 'mes'
export type Periodo = '30d' | '90d' | '6m' | '12m' | 'todo'

export interface PuntoSerie {
  /** fecha ISO del inicio del período (el día, el lunes de la semana o el día 1 del mes) */
  clave: string
  /** texto para el eje: "21 sept", "sept 26" */
  etiqueta: string
  /** texto completo para el tooltip y la tabla: "21/9/2026", "Semana del 21/9 al 27/9", "Septiembre de 2026" */
  rango: string
  pedidos: number
  entregas: number
  /** true si es el período en curso (semana o mes todavía sin terminar): conviene dibujarlo distinto */
  parcial: boolean
}

const DIA_MS = 86_400_000
const aFecha = (iso: string) => new Date(`${iso}T00:00:00Z`)
const aISO = (d: Date) => d.toISOString().slice(0, 10)
const sumarDias = (iso: string, n: number) => aISO(new Date(aFecha(iso).getTime() + n * DIA_MS))
const lunesDe = (iso: string) => sumarDias(iso, -((aFecha(iso).getUTCDay() + 6) % 7))
const primeroDelMes = (iso: string) => `${iso.slice(0, 7)}-01`
const siguienteMes = (iso: string) => {
  const d = aFecha(iso)
  return aISO(new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1)))
}

function claveDe(iso: string, g: Granularidad): string {
  return g === 'dia' ? iso : g === 'semana' ? lunesDe(iso) : primeroDelMes(iso)
}

function siguiente(clave: string, g: Granularidad): string {
  return g === 'dia' ? sumarDias(clave, 1) : g === 'semana' ? sumarDias(clave, 7) : siguienteMes(clave)
}

const formatoMes = new Intl.DateTimeFormat('es-AR', { month: 'short', year: '2-digit', timeZone: 'UTC' })
const formatoDia = new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'short', timeZone: 'UTC' })

function etiquetaDe(clave: string, g: Granularidad): string {
  return (g === 'mes' ? formatoMes : formatoDia).format(aFecha(clave))
}

const formatoDiaCompleto = new Intl.DateTimeFormat('es-AR', {
  day: 'numeric',
  month: 'numeric',
  year: 'numeric',
  timeZone: 'UTC',
})
const formatoDiaMes = new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'numeric', timeZone: 'UTC' })
const formatoMesLargo = new Intl.DateTimeFormat('es-AR', { month: 'long', year: 'numeric', timeZone: 'UTC' })

function rangoDe(clave: string, g: Granularidad): string {
  if (g === 'dia') return formatoDiaCompleto.format(aFecha(clave))
  if (g === 'semana') {
    return `Semana del ${formatoDiaMes.format(aFecha(clave))} al ${formatoDiaMes.format(aFecha(sumarDias(clave, 6)))}`
  }
  const mes = formatoMesLargo.format(aFecha(clave))
  return mes.charAt(0).toUpperCase() + mes.slice(1)
}

/** Fecha de inicio del período elegido (incluida), o undefined para "todo". */
export function fechaDesdePeriodo(periodo: Periodo, hoy: string = hoyISO()): string | undefined {
  switch (periodo) {
    case '30d':
      return sumarDias(hoy, -29)
    case '90d':
      return sumarDias(hoy, -89)
    case '6m':
    case '12m': {
      const d = aFecha(hoy)
      const meses = periodo === '6m' ? 6 : 12
      return aISO(new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() - meses, d.getUTCDate() + 1)))
    }
    default:
      return undefined
  }
}

/**
 * Agrupa la serie diaria por día, semana (lunes a domingo) o mes, y completa con ceros los
 * períodos sin actividad para que la línea no "salte" fechas. `desde` es inclusivo.
 */
export function agruparSerie(
  dias: DiaDashboard[],
  granularidad: Granularidad,
  desde?: string,
  hasta: string = hoyISO(),
): PuntoSerie[] {
  const acumulado = new Map<string, { pedidos: number; entregas: number }>()
  for (const d of dias) {
    if ((desde && d.fecha < desde) || d.fecha > hasta) continue
    const clave = claveDe(d.fecha, granularidad)
    const previo = acumulado.get(clave) ?? { pedidos: 0, entregas: 0 }
    acumulado.set(clave, { pedidos: previo.pedidos + d.pedidos, entregas: previo.entregas + d.entregas })
  }
  if (acumulado.size === 0) return []

  const inicio = desde ? claveDe(desde, granularidad) : [...acumulado.keys()].sort()[0]
  const fin = claveDe(hasta, granularidad)
  const actual = claveDe(hoyISO(), granularidad)
  const puntos: PuntoSerie[] = []
  for (let c = inicio; c <= fin; c = siguiente(c, granularidad)) {
    const v = acumulado.get(c)
    puntos.push({
      clave: c,
      etiqueta: etiquetaDe(c, granularidad),
      rango: rangoDe(c, granularidad),
      pedidos: v?.pedidos ?? 0,
      entregas: v?.entregas ?? 0,
      parcial: granularidad !== 'dia' && c === actual,
    })
  }
  return puntos
}

export interface Comparacion {
  actual: number
  anterior: number
  /** variación porcentual entera; null si el período anterior fue 0 (no se puede calcular) */
  variacionPct: number | null
}

/** Compara los últimos `n` días (incluido hoy) contra los `n` días anteriores. */
export function compararPeriodos(
  dias: DiaDashboard[],
  n: number,
  hoy: string = hoyISO(),
): { pedidos: Comparacion; entregas: Comparacion } {
  const desdeActual = sumarDias(hoy, -(n - 1))
  const hastaAnterior = sumarDias(desdeActual, -1)
  const desdeAnterior = sumarDias(desdeActual, -n)
  const t = { pedidos: [0, 0], entregas: [0, 0] }
  for (const d of dias) {
    const i = d.fecha >= desdeActual && d.fecha <= hoy ? 0 : d.fecha >= desdeAnterior && d.fecha <= hastaAnterior ? 1 : -1
    if (i < 0) continue
    t.pedidos[i] += d.pedidos
    t.entregas[i] += d.entregas
  }
  const armar = ([actual, anterior]: number[]): Comparacion => ({
    actual,
    anterior,
    variacionPct: anterior === 0 ? null : Math.round(((actual - anterior) / anterior) * 100),
  })
  return { pedidos: armar(t.pedidos), entregas: armar(t.entregas) }
}
