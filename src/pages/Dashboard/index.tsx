import {
  Accessibility,
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Building,
  Calendar,
  CheckCircle2,
  Clock,
  FolderSync,
  Layers,
  LayoutDashboard,
  Lock,
  MapPin,
  Package,
  RefreshCw,
  Table as TableIcon,
  TrendingUp,
  Users,
  WifiOff,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useAuth } from '../../context/AuthContext'
import {
  useDimensionDashboard,
  useKpisDashboard,
  useRubrosDashboard,
  useSerieDiaria,
} from '../../hooks/useDashboard'
import { useConteos } from '../../hooks/usePedidos'
import { agruparSerie, compararPeriodos, fechaDesdePeriodo } from '../../lib/dashboard'
import type { Granularidad, Periodo } from '../../lib/dashboard'
import { formatFecha, paletaEstado } from '../../lib/estados'

type Agrupacion = Granularidad

// Colores de las dos líneas: validados para daltonismo con el validador de la guía de visualización
// (no usar otros para estas series). El aqua tiene poco contraste sobre blanco: por eso hay leyenda,
// tooltip y vista en tabla.
const COLOR_SOLICITUDES = '#2a78d6'
const COLOR_ENTREGAS = '#1baf7a'

interface PuntoGrafico {
  etiqueta: string
  fechaCompleta: string
  pedidos: number
  entregas: number
  parcial: boolean
}

function TooltipEvolucion({
  active,
  payload,
}: {
  active?: boolean
  payload?: Array<{ payload: PuntoGrafico }>
}) {
  if (!active || !payload?.length) return null
  const p = payload[0].payload
  return (
    <div className="rounded-lg border border-outline bg-white p-3 text-xs shadow-lg">
      <div className="mb-1 border-b border-surface-container pb-1 font-bold text-on-surface">
        {p.fechaCompleta}
        {p.parcial && ' · en curso'}
      </div>
      {[
        ['Solicitudes', COLOR_SOLICITUDES, p.pedidos],
        ['Entregas', COLOR_ENTREGAS, p.entregas],
      ].map(([nombre, color, valor]) => (
        <div key={nombre as string} className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5 text-on-surface">
            <span className="size-2 rounded-full" style={{ backgroundColor: color as string }} />
            {nombre}
          </span>
          <span className="font-bold text-on-surface">{valor}</span>
        </div>
      ))}
    </div>
  )
}

/** Variación contra el período anterior. null = no se puede calcular (el anterior fue 0). */
function VariacionChip({ valor, neutral = false }: { valor: number | null; neutral?: boolean }) {
  if (valor === null) {
    return (
      <span
        className="inline-flex items-center rounded border border-outline-variant bg-surface-container px-2 py-0.5 text-xs font-bold text-on-surface-variant"
        title="El período anterior no tuvo registros: no se puede calcular"
      >
        —
      </span>
    )
  }
  const sube = valor >= 0
  const clases = neutral
    ? 'border-outline-variant bg-surface-container text-on-surface'
    : sube
      ? 'border-[#39D2C0] bg-[#39D2C0]/25 text-[#0A423C]'
      : 'border-[#FF5963] bg-[#FF5963]/25 text-[#7A0C12]'
  return (
    <span className={`inline-flex items-center rounded border px-2 py-0.5 text-xs font-bold ${clases}`}>
      {sube ? <ArrowUp size={14} className="mr-0.5" /> : <ArrowDown size={14} className="mr-0.5" />}
      {sube ? `+${valor}%` : `${valor}%`}
    </span>
  )
}

export default function DashboardPage() {
  const { usuario, usuarioLoading } = useAuth()

  const [periodo, setPeriodo] = useState<Periodo>('30d')
  const [agrupacion, setAgrupacion] = useState<Agrupacion>('semana')
  const [verTabla, setVerTabla] = useState(false)

  const kpisQuery = useKpisDashboard()
  const serieQuery = useSerieDiaria()
  const conteoQuery = useConteos()
  const procedenciaQuery = useDimensionDashboard('procedencia')
  const subsecretariaQuery = useDimensionDashboard('subsecretaria')
  const barrioQuery = useDimensionDashboard('barrio', 10)
  const rubrosQuery = useRubrosDashboard()

  const cargando =
    kpisQuery.isLoading ||
    serieQuery.isLoading ||
    conteoQuery.isLoading ||
    procedenciaQuery.isLoading ||
    subsecretariaQuery.isLoading ||
    barrioQuery.isLoading ||
    rubrosQuery.isLoading

  const hayError =
    kpisQuery.isError ||
    serieQuery.isError ||
    conteoQuery.isError ||
    procedenciaQuery.isError ||
    subsecretariaQuery.isError ||
    barrioQuery.isError ||
    rubrosQuery.isError

  // Serie del gráfico: agrupa por día, semana (lunes a domingo) o mes y completa con ceros los
  // períodos sin actividad (lib/dashboard.ts, con pruebas).
  const puntosGrafico = useMemo<PuntoGrafico[]>(
    () =>
      agruparSerie(serieQuery.data ?? [], agrupacion, fechaDesdePeriodo(periodo)).map((p) => ({
        etiqueta: p.etiqueta,
        fechaCompleta: p.rango,
        pedidos: p.pedidos,
        entregas: p.entregas,
        parcial: p.parcial,
      })),
    [serieQuery.data, agrupacion, periodo],
  )

  // Últimos 30 días (incluido hoy) contra los 30 anteriores.
  const metricas30d = useMemo(() => {
    const c = compararPeriodos(serieQuery.data ?? [], 30)
    return {
      pedidosUlt30: c.pedidos.actual,
      varPedidos: c.pedidos.variacionPct,
      entregasUlt30: c.entregas.actual,
      varEntregas: c.entregas.variacionPct,
    }
  }, [serieQuery.data])

  // Control de Acceso: Solo Administrador
  if (usuarioLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-8">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (usuario?.rol !== 'Administrador') {
    return (
      <div className="space-y-space-lg p-margin md:p-margin-desktop">
        <h1 className="font-headline-xl text-headline-xl font-bold tracking-tight text-primary">
          Dashboard
        </h1>
        <div className="flex items-start gap-3 rounded-xl border border-line bg-white p-space-lg text-ink-soft shadow-sm">
          <Lock className="mt-0.5 h-6 w-6 shrink-0 text-outline" />
          <div>
            <h2 className="font-body-md-bold text-body-md-bold text-ink">Acceso Restringido</h2>
            <p className="mt-1 text-sm">
              El Dashboard está reservado para usuarios con rol <strong>Administrador</strong>.
            </p>
          </div>
        </div>
      </div>
    )
  }
  const kpis = kpisQuery.data
  const conteos = conteoQuery.data ?? []
  const totalPedidos = kpis?.pedidos_total ?? conteos.reduce((s, c) => s + (c.cantidad ?? 0), 0)
  const pendientesAutorizacion =
    conteos.find((c) => c.estado === 'Pendiente de Autorización')?.cantidad ?? 0

  const porcentajeCompletado =
    kpis && kpis.unidades_solicitadas > 0
      ? Math.round((kpis.unidades_entregadas / kpis.unidades_solicitadas) * 100)
      : 0

  const porcentajeDiscapacidad =
    kpis && totalPedidos > 0
      ? Math.round((kpis.pedidos_con_discapacidad / totalPedidos) * 100)
      : 0

  const recargarTodo = () => {
    void kpisQuery.refetch()
    void serieQuery.refetch()
    void conteoQuery.refetch()
    void procedenciaQuery.refetch()
    void subsecretariaQuery.refetch()
    void barrioQuery.refetch()
    void rubrosQuery.refetch()
  }

  return (
    <div className="space-y-6 p-margin md:p-margin-desktop">
      {/* 1. ENCABEZADO Y CONTROLES DE VISTA */}
      <div className="flex flex-col justify-between gap-4 rounded-xl border border-outline-variant bg-surface-container-lowest p-5 shadow-sm lg:flex-row lg:items-center">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-headline-xl text-headline-xl text-primary">Dashboard</h1>
          </div>
          <div className="mt-1 flex items-center gap-2 font-body-md text-body-md text-on-surface-variant">
            <TrendingUp size={18} className="text-secondary shrink-0" />
            <span>
              {kpis?.ultimo_pedido
                ? `Último pedido registrado: ${formatFecha(kpis.ultimo_pedido)}`
                : 'Indicadores de pedidos'}
            </span>
          </div>
        </div>

        <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
          {/* Chips Selector de Período */}
          <div
            aria-label="Rango de días"
            className="inline-flex rounded-lg border border-outline-variant/60 bg-surface-container p-1"
            role="group"
          >
            {(
              [
                ['30d', '30 días'],
                ['90d', '90 días'],
                ['6m', '6 meses'],
                ['12m', '12 meses'],
                ['todo', 'Todo'],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setPeriodo(key)}
                className={`rounded-md px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                  periodo === key
                    ? 'bg-primary text-on-primary shadow-sm'
                    : 'text-on-surface-variant hover:text-primary'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODO SKELETON */}
      {/* ========================================================================= */}
      {cargando && (
        <div className="space-y-6 animate-pulse">
          <div className="grid grid-cols-1 gap-gutter-desktop sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div
                key={i}
                className="flex h-32 flex-col justify-between rounded-xl border border-outline-variant bg-surface-container-lowest p-5"
              >
                <div className="h-4 w-1/2 rounded bg-surface-container-high" />
                <div className="h-8 w-3/4 rounded bg-surface-container-high" />
                <div className="h-3 w-full rounded bg-surface-container" />
              </div>
            ))}
          </div>
          <div className="flex h-80 flex-col justify-between rounded-xl border border-outline-variant bg-surface-container-lowest p-6">
            <div className="h-6 w-1/4 rounded bg-surface-container-high" />
            <div className="h-48 w-full rounded-lg bg-surface-container" />
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODO ERROR */}
      {/* ========================================================================= */}
      {hayError && !cargando && (
        <div className="rounded-xl border-2 border-error/50 bg-surface-container-lowest p-12 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-error-container text-error">
            <WifiOff size={36} />
          </div>
          <h2 className="font-headline-md text-headline-md text-error">
            No se pudieron cargar los datos
          </h2>
          <p className="mx-auto mt-2 max-w-lg font-body-md text-body-md text-on-surface-variant">
            Verificá tu conexión e intentá de nuevo.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <button
              type="button"
              onClick={recargarTodo}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-primary px-5 py-2.5 font-body-md-bold text-body-md-bold text-on-primary shadow-sm hover:bg-primary-container"
            >
              <RefreshCw size={18} />
              <span>Reintentar</span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODO VACÍO */}
      {/* ========================================================================= */}
      {!cargando && !hayError && totalPedidos === 0 && (
        <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-12 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-surface-container text-outline">
            <FolderSync size={36} />
          </div>
          <h2 className="font-headline-md text-headline-md text-primary">
            Todavía no hay pedidos cargados
          </h2>
          <p className="mx-auto mt-2 max-w-md font-body-md text-body-md text-on-surface-variant">
            Cuando se registren pedidos, los indicadores van a aparecer acá.
          </p>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VISTA NORMAL (CONTENIDO PRINCIPAL) */}
      {/* ========================================================================= */}
      {!cargando && !hayError && totalPedidos > 0 && (
        <div className="space-y-6">
          {/* 2. GRID DE 8 TARJETAS DE INDICADORES (4x2 en Desktop) */}
          <section className="grid grid-cols-1 gap-gutter-desktop sm:grid-cols-2 lg:grid-cols-4">
            {/* Card 1: Total de pedidos */}
            <div className="flex flex-col justify-between rounded-xl border border-outline-variant bg-surface-container-lowest p-5 shadow-sm">
              <div className="flex items-center justify-between text-on-surface-variant">
                <span className="font-label-md text-label-md uppercase tracking-wider text-outline">
                  Total de Pedidos
                </span>
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-container text-primary">
                  <Package size={20} />
                </span>
              </div>
              <div className="mt-3">
                <div className="font-headline-xl text-headline-xl font-bold text-primary">
                  {totalPedidos.toLocaleString('es-AR')}
                </div>
                <p className="mt-1 font-label-md text-label-md text-on-surface-variant">
                  Total de pedidos registrados
                </p>
              </div>
            </div>

            {/* Card 2: Pedidos últimos 30 días */}
            <div className="flex flex-col justify-between rounded-xl border border-outline-variant bg-surface-container-lowest p-5 shadow-sm">
              <div className="flex items-center justify-between text-on-surface-variant">
                <span className="font-label-md text-label-md uppercase tracking-wider text-outline">
                  Últimos 30 Días
                </span>
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-container text-primary">
                  <Calendar size={20} />
                </span>
              </div>
              <div className="mt-3">
                <div className="flex items-baseline gap-2">
                  <div className="font-headline-xl text-headline-xl font-bold text-primary">
                    {metricas30d.pedidosUlt30.toLocaleString('es-AR')}
                  </div>
                  <VariacionChip valor={metricas30d.varPedidos} neutral />
                </div>
                <p className="mt-1 font-label-md text-label-md text-on-surface-variant">
                  vs. 30 días previos
                </p>
              </div>
            </div>

            {/* Card 3: Entregas últimos 30 días */}
            <div className="flex flex-col justify-between rounded-xl border border-outline-variant bg-surface-container-lowest p-5 shadow-sm">
              <div className="flex items-center justify-between text-on-surface-variant">
                <span className="font-label-md text-label-md uppercase tracking-wider text-outline">
                  Entregas 30 Días
                </span>
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-container text-secondary">
                  <CheckCircle2 size={20} />
                </span>
              </div>
              <div className="mt-3">
                <div className="flex items-baseline gap-2">
                  <div className="font-headline-xl text-headline-xl font-bold text-primary">
                    {metricas30d.entregasUlt30.toLocaleString('es-AR')}
                  </div>
                  <VariacionChip valor={metricas30d.varEntregas} />
                </div>
                <p className="mt-1 font-label-md text-label-md text-on-surface-variant">
                  vs. 30 días previos
                </p>
              </div>
            </div>

            {/* Card 4: Pendientes de autorización */}
            <div className="relative flex flex-col justify-between overflow-hidden rounded-xl border-2 border-[#F9CF58] bg-amber-50/20 p-5 shadow-sm">
              <div className="flex items-center justify-between text-[#4A3800]">
                <span className="font-label-md text-label-md font-bold uppercase tracking-wider">
                  Pendientes Autorización
                </span>
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#F9CF58]/40 text-[#4A3800]">
                  <AlertTriangle size={20} />
                </span>
              </div>
              <div className="mt-2">
                <div className="font-headline-xl text-headline-xl font-bold text-[#4A3800]">
                  {pendientesAutorizacion}
                </div>
                <div className="mt-1 flex items-center justify-between">
                  <span className="font-label-md text-label-md text-on-surface-variant">
                    Esperan autorización
                  </span>
                  <Link
                    to="/autorizar-pedidos"
                    className="flex items-center gap-0.5 text-xs font-bold text-primary underline hover:text-secondary"
                  >
                    Ver en Autorizar →
                  </Link>
                </div>
              </div>
            </div>

            {/* Card 5: Personas atendidas */}
            <div className="flex flex-col justify-between rounded-xl border border-outline-variant bg-surface-container-lowest p-5 shadow-sm">
              <div className="flex items-center justify-between text-on-surface-variant">
                <span className="font-label-md text-label-md uppercase tracking-wider text-outline">
                  Personas Asistidas
                </span>
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-container text-primary">
                  <Users size={20} />
                </span>
              </div>
              <div className="mt-3">
                <div className="font-headline-xl text-headline-xl font-bold text-primary">
                  {(kpis?.personas_atendidas ?? 0).toLocaleString('es-AR')}
                </div>
                <p className="mt-1 font-label-md text-label-md text-on-surface-variant">
                  Personas distintas con pedidos
                </p>
              </div>
            </div>

            {/* Card 6: Unidades solicitadas / entregadas */}
            <div className="flex flex-col justify-between rounded-xl border border-outline-variant bg-surface-container-lowest p-5 shadow-sm">
              <div className="flex items-center justify-between text-on-surface-variant">
                <span className="font-label-md text-label-md uppercase tracking-wider text-outline">
                  Unidades / Despacho
                </span>
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-container text-primary">
                  <Layers size={20} />
                </span>
              </div>
              <div className="mt-2">
                <div className="flex items-baseline justify-between">
                  <span className="font-body-lg-bold text-body-lg-bold text-primary">
                    {(kpis?.unidades_entregadas ?? 0).toLocaleString('es-AR')}{' '}
                    <span className="text-xs font-normal text-outline">entregadas</span>
                  </span>
                  <span className="text-xs font-semibold text-outline">
                    {(kpis?.unidades_solicitadas ?? 0).toLocaleString('es-AR')} sol.
                  </span>
                </div>
                <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-surface-container-high">
                  <div
                    className="h-full rounded-full bg-secondary transition-all duration-500"
                    style={{ width: `${Math.min(100, porcentajeCompletado)}%` }}
                  />
                </div>
                <div className="mt-1 flex justify-between text-xs text-on-surface-variant">
                  <span>{porcentajeCompletado}% completado</span>
                  <span>
                    Faltan{' '}
                    {Math.max(
                      0,
                      (kpis?.unidades_solicitadas ?? 0) - (kpis?.unidades_entregadas ?? 0),
                    ).toLocaleString('es-AR')}
                  </span>
                </div>
              </div>
            </div>

            {/* Card 7: Días promedio hasta la entrega */}
            <div className="flex flex-col justify-between rounded-xl border border-outline-variant bg-surface-container-lowest p-5 shadow-sm">
              <div className="flex items-center justify-between text-on-surface-variant">
                <span className="font-label-md text-label-md uppercase tracking-wider text-outline">
                  Tiempo de Entrega
                </span>
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-container text-primary">
                  <Clock size={20} />
                </span>
              </div>
              <div className="mt-3">
                <div className="font-headline-xl text-headline-xl font-bold text-primary">
                  {kpis?.dias_promedio_entrega != null
                    ? `${Math.round(kpis.dias_promedio_entrega)} días`
                    : '—'}
                </div>
                <p className="mt-1 font-label-md text-label-md text-on-surface-variant">
                  Promedio desde la solicitud hasta la entrega
                </p>
              </div>
            </div>

            {/* Card 8: Pedidos con discapacidad */}
            <div className="flex flex-col justify-between rounded-xl border border-outline-variant bg-surface-container-lowest p-5 shadow-sm">
              <div className="flex items-center justify-between text-on-surface-variant">
                <span className="font-label-md text-label-md uppercase tracking-wider text-outline">
                  Pedidos con discapacidad
                </span>
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-container text-primary">
                  <Accessibility size={20} />
                </span>
              </div>
              <div className="mt-3">
                <div className="flex items-baseline gap-2">
                  <div className="font-headline-xl text-headline-xl font-bold text-primary">
                    {(kpis?.pedidos_con_discapacidad ?? 0).toLocaleString('es-AR')}
                  </div>
                  <span className="inline-flex items-center rounded border border-primary-fixed-dim bg-primary-fixed px-2 py-0.5 text-xs font-bold text-primary">
                    {porcentajeDiscapacidad}% del total
                  </span>
                </div>
                <p className="mt-1 font-label-md text-label-md text-on-surface-variant">
                  De personas con discapacidad
                </p>
              </div>
            </div>
          </section>

          {/* ========================================================================= */}
          {/* 3. GRÁFICO PRINCIPAL: EVOLUCIÓN DE PEDIDOS */}
          {/* ========================================================================= */}
          <section className="rounded-xl border border-outline-variant bg-surface-container-lowest p-6 shadow-sm">
            <div className="flex flex-col justify-between gap-4 border-b border-surface-container pb-4 md:flex-row md:items-center">
              <div>
                <h2 className="font-headline-md text-headline-md text-primary">
                  Evolución de pedidos
                </h2>
                <p className="mt-0.5 font-body-md text-body-md text-on-surface-variant">
                  Solicitudes registradas y entregas realizadas por período
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-4">
                {/* Selector Día / Semana / Mes */}
                <div
                  className="inline-flex rounded-lg border border-outline-variant/60 bg-surface-container p-1"
                  role="group"
                >
                  {(
                    [
                      ['dia', 'Día'],
                      ['semana', 'Semana'],
                      ['mes', 'Mes'],
                    ] as const
                  ).map(([agr, label]) => (
                    <button
                      key={agr}
                      type="button"
                      onClick={() => setAgrupacion(agr)}
                      className={`rounded px-3 py-1 text-xs font-semibold transition-colors ${
                        agrupacion === agr
                          ? 'bg-primary text-on-primary shadow-sm'
                          : 'text-on-surface-variant hover:text-primary'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                {/* Leyendas */}
                <div className="flex items-center gap-4 text-xs font-bold">
                  <div className="flex items-center gap-1.5">
                    <span className="h-3.5 w-3.5 rounded-full" style={{ backgroundColor: COLOR_SOLICITUDES }} />
                    <span className="text-on-surface">Solicitudes</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-3.5 w-3.5 rounded-full" style={{ backgroundColor: COLOR_ENTREGAS }} />
                    <span className="text-on-surface">Entregas</span>
                  </div>
                </div>

                {/* Botón Ver como tabla */}
                <button
                  type="button"
                  onClick={() => setVerTabla(!verTabla)}
                  className="flex min-h-[40px] items-center gap-1.5 rounded-lg border border-outline-variant px-3 py-2 text-xs font-bold text-primary transition-colors hover:bg-surface-container"
                >
                  <TableIcon size={16} />
                  <span>{verTabla ? 'Ver Gráfico' : 'Ver como tabla'}</span>
                </button>
              </div>
            </div>

            {/* Vista Tabla o Gráfico */}
            {verTabla ? (
              <div className="mt-6 overflow-x-auto">
                <table className="w-full border-collapse text-left font-body-md text-sm">
                  <thead>
                    <tr className="border-b border-outline-variant bg-surface-container-low font-bold text-primary">
                      <th className="px-4 py-3">Período / Fecha</th>
                      <th className="px-4 py-3 text-right">Solicitudes</th>
                      <th className="px-4 py-3 text-right">Entregas</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/30">
                    {puntosGrafico.map((p, idx) => {
                      return (
                        <tr key={idx} className="hover:bg-surface-container-low/40">
                          <td className="px-4 py-3 font-semibold text-on-surface">
                            {p.fechaCompleta}
                            {p.parcial && ' · en curso'}
                          </td>
                          <td className="px-4 py-3 text-right font-mono font-bold text-on-surface">
                            {p.pedidos}
                          </td>
                          <td className="px-4 py-3 text-right font-mono font-bold text-on-surface">
                            {p.entregas}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div
                className="mt-6 h-[320px] w-full"
                role="img"
                aria-label="Gráfico de líneas con las solicitudes y las entregas por período. Hay una vista en tabla con los mismos datos."
              >
                {puntosGrafico.length === 0 ? (
                  <p className="flex h-full items-center justify-center text-sm text-on-surface-variant">
                    No hay pedidos en este período.
                  </p>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={puntosGrafico} margin={{ top: 12, right: 16, bottom: 4, left: 0 }}>
                      <defs>
                        {/* Degradé suave bajo cada curva: de un tono visible arriba a casi transparente abajo */}
                        <linearGradient id="degradeSolicitudes" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={COLOR_SOLICITUDES} stopOpacity={0.3} />
                          <stop offset="100%" stopColor={COLOR_SOLICITUDES} stopOpacity={0.02} />
                        </linearGradient>
                        <linearGradient id="degradeEntregas" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={COLOR_ENTREGAS} stopOpacity={0.3} />
                          <stop offset="100%" stopColor={COLOR_ENTREGAS} stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke="#CBD5E1" strokeDasharray="2 4" vertical={false} />
                      <XAxis
                        dataKey="etiqueta"
                        tick={{ fontSize: 10, fill: '#64748B' }}
                        tickLine={{ stroke: '#94A3B8' }}
                        axisLine={{ stroke: '#94A3B8' }}
                        minTickGap={16}
                      />
                      <YAxis
                        allowDecimals={false}
                        tick={{ fontSize: 10, fill: '#64748B' }}
                        tickLine={{ stroke: '#94A3B8' }}
                        axisLine={{ stroke: '#94A3B8' }}
                        width={36}
                      />
                      <Tooltip content={<TooltipEvolucion />} cursor={{ stroke: '#94A3B8', strokeDasharray: '3 3' }} />
                      {/* "monotone" suaviza sin pasarse de los datos: la curva nunca baja de 0 entre dos puntos */}
                      <Area
                        type="monotone"
                        dataKey="pedidos"
                        name="Solicitudes"
                        stroke={COLOR_SOLICITUDES}
                        strokeWidth={2}
                        fill="url(#degradeSolicitudes)"
                        dot={false}
                        activeDot={{ r: 4, stroke: '#fff', strokeWidth: 2 }}
                        isAnimationActive={false}
                      />
                      <Area
                        type="monotone"
                        dataKey="entregas"
                        name="Entregas"
                        stroke={COLOR_ENTREGAS}
                        strokeWidth={2}
                        fill="url(#degradeEntregas)"
                        dot={false}
                        activeDot={{ r: 4, stroke: '#fff', strokeWidth: 2 }}
                        isAnimationActive={false}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            )}
          </section>

          {/* ========================================================================= */}
          {/* 4. DISTRIBUCIÓN DE PEDIDOS POR ESTADO (BARRAS HORIZONTALES) */}
          {/* ========================================================================= */}
          <section className="rounded-xl border border-outline-variant bg-surface-container-lowest p-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-surface-container pb-4">
              <div>
                <h2 className="font-headline-md text-headline-md text-primary">
                  Distribución de Pedidos por Estado
                </h2>
                <p className="mt-0.5 font-body-md text-body-md text-on-surface-variant">
                  Estado actual de todos los pedidos
                </p>
              </div>
              <span className="text-xs font-semibold text-outline">
                Base total: {totalPedidos.toLocaleString('es-AR')} pedidos
              </span>
            </div>

            <div className="mt-6 space-y-4">
              {conteos.map((item) => {
                const nombreEstado = item.estado ?? 'Sin Estado'
                const cant = item.cantidad ?? 0
                const pct = totalPedidos > 0 ? ((cant / totalPedidos) * 100).toFixed(1) : '0.0'
                const colores = paletaEstado(nombreEstado)

                return (
                  <div key={nombreEstado}>
                    <div className="mb-1 flex items-center justify-between text-xs font-bold">
                      <span className="flex items-center gap-1.5 text-on-surface">
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: colores.punto }}
                        />{' '}
                        {nombreEstado}
                      </span>
                      <span className="text-on-surface">
                        {cant.toLocaleString('es-AR')} pedidos ·{' '}
                        <span style={{ color: colores.texto }}>{pct}%</span>
                      </span>
                    </div>
                    <div className="h-4 w-full overflow-hidden rounded-full bg-surface-container-high">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: colores.punto,
                        }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </section>

          {/* ========================================================================= */}
          {/* 5. PANELES COMPLEMENTARIOS (GRID DE 2 COLUMNAS) */}
          {/* ========================================================================= */}
          <section className="grid grid-cols-1 gap-gutter-desktop lg:grid-cols-2">
            {/* PANEL A: Pedidos por Procedencia */}
            <div className="flex flex-col justify-between rounded-xl border border-outline-variant bg-surface-container-lowest p-6 shadow-sm">
              <div>
                <div className="flex items-center justify-between border-b border-surface-container pb-3">
                  <h3 className="font-headline-sm text-headline-sm text-primary">
                    Pedidos por Procedencia
                  </h3>
                  <LayoutDashboard size={20} className="text-outline" />
                </div>
                <p className="mb-4 mt-1 text-xs text-on-surface-variant">
                  Canal inicial de ingreso de la solicitud ciudadana
                </p>
                <div className="space-y-3.5">
                  {procedenciaQuery.data?.top.map((item) => {
                    const pct =
                      (procedenciaQuery.data?.total ?? 0) > 0
                        ? Math.round((item.pedidos / procedenciaQuery.data!.total) * 100)
                        : 0
                    return (
                      <div key={item.valor}>
                        <div className="mb-1 flex justify-between text-xs font-semibold">
                          <span>{item.valor || 'Sin especificar'}</span>
                          <span className="font-bold text-primary">
                            {pct}% ({item.pedidos})
                          </span>
                        </div>
                        <div className="h-3 w-full overflow-hidden rounded-full bg-surface-container">
                          <div
                            className="h-full rounded-full bg-primary"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                  {(procedenciaQuery.data?.otros.pedidos ?? 0) > 0 && (
                    <div>
                      <div className="mb-1 flex justify-between text-xs font-semibold">
                        <span className="text-outline">Otros Canales</span>
                        <span className="font-bold text-outline">
                          {Math.round(
                            (procedenciaQuery.data!.otros.pedidos /
                              procedenciaQuery.data!.total) *
                              100,
                          )}
                          % ({procedenciaQuery.data!.otros.pedidos})
                        </span>
                      </div>
                      <div className="h-3 w-full overflow-hidden rounded-full bg-surface-container">
                        <div
                          className="h-full rounded-full bg-outline"
                          style={{
                            width: `${Math.round(
                              (procedenciaQuery.data!.otros.pedidos /
                                procedenciaQuery.data!.total) *
                                100,
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="mt-4 border-t border-surface-container pt-4 text-right">
                <span className="text-xs text-outline">
                  Total clasificado: {(procedenciaQuery.data?.total ?? 0).toLocaleString('es-AR')}{' '}
                  pedidos
                </span>
              </div>
            </div>

            {/* PANEL B: Pedidos por Subsecretaría */}
            <div className="flex flex-col justify-between rounded-xl border border-outline-variant bg-surface-container-lowest p-6 shadow-sm">
              <div>
                <div className="flex items-center justify-between border-b border-surface-container pb-3">
                  <h3 className="font-headline-sm text-headline-sm text-primary">
                    Pedidos por Subsecretaría
                  </h3>
                  <Building size={20} className="text-outline" />
                </div>
                <p className="mb-4 mt-1 text-xs text-on-surface-variant">
                  Dependencias gestoras y ejecutoras del despacho
                </p>
                <div className="space-y-3.5">
                  {subsecretariaQuery.data?.top.map((item) => {
                    const pct =
                      (subsecretariaQuery.data?.total ?? 0) > 0
                        ? Math.round((item.pedidos / subsecretariaQuery.data!.total) * 100)
                        : 0
                    return (
                      <div key={item.valor}>
                        <div className="mb-1 flex justify-between text-xs font-semibold">
                          <span>{item.valor || 'Sin asignar'}</span>
                          <span className="font-bold text-secondary">
                            {pct}% ({item.pedidos})
                          </span>
                        </div>
                        <div className="h-3 w-full overflow-hidden rounded-full bg-surface-container">
                          <div
                            className="h-full rounded-full bg-secondary"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                  {(subsecretariaQuery.data?.otros.pedidos ?? 0) > 0 && (
                    <div>
                      <div className="mb-1 flex justify-between text-xs font-semibold">
                        <span className="text-outline">Otras Áreas</span>
                        <span className="font-bold text-outline">
                          {Math.round(
                            (subsecretariaQuery.data!.otros.pedidos /
                              subsecretariaQuery.data!.total) *
                              100,
                          )}
                          % ({subsecretariaQuery.data!.otros.pedidos})
                        </span>
                      </div>
                      <div className="h-3 w-full overflow-hidden rounded-full bg-surface-container">
                        <div
                          className="h-full rounded-full bg-outline"
                          style={{
                            width: `${Math.round(
                              (subsecretariaQuery.data!.otros.pedidos /
                                subsecretariaQuery.data!.total) *
                                100,
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="mt-4 border-t border-surface-container pt-4 text-right">
                <span className="text-xs text-outline">
                  {subsecretariaQuery.data?.top.length ?? 0} dependencias asignadas
                </span>
              </div>
            </div>

            {/* PANEL C: Top 10 Barrios */}
            <div className="flex flex-col justify-between rounded-xl border border-outline-variant bg-surface-container-lowest p-6 shadow-sm">
              <div>
                <div className="flex items-center justify-between border-b border-surface-container pb-3">
                  <h3 className="font-headline-sm text-headline-sm text-primary">
                    Top 10 Barrios de Córdoba
                  </h3>
                  <MapPin size={20} className="text-outline" />
                </div>
                <p className="mb-4 mt-1 text-xs text-on-surface-variant">
                  Zonas con mayor demanda de auxilio inmediato
                </p>
                <div className="space-y-2.5">
                  {barrioQuery.data?.top.map((item, index) => {
                    const maxBarrio = barrioQuery.data!.top[0]?.pedidos || 1
                    const widthPct = Math.round((item.pedidos / maxBarrio) * 100)
                    return (
                      <div key={item.valor} className="flex items-center gap-3 text-xs">
                        <span className="w-32 truncate font-semibold">
                          {index + 1}. {item.valor || 'Sin barrio'}
                        </span>
                        <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-surface-container">
                          <div
                            className="h-full rounded-full bg-primary-container"
                            style={{ width: `${widthPct}%` }}
                          />
                        </div>
                        <span className="w-16 text-right font-bold text-primary">
                          {item.pedidos} ped.
                        </span>
                      </div>
                    )
                  })}
                  {(barrioQuery.data?.otros.pedidos ?? 0) > 0 && (
                    <div className="flex items-center gap-3 border-t border-surface-container pt-2 text-xs">
                      <span className="w-32 truncate font-semibold text-outline">
                        Otros Barrios
                      </span>
                      <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-surface-container">
                        <div className="h-full rounded-full bg-outline" style={{ width: '60%' }} />
                      </div>
                      <span className="w-16 text-right font-bold text-outline">
                        {barrioQuery.data!.otros.pedidos} ped.
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <div className="mt-4 border-t border-surface-container pt-4 text-right">
                <span className="text-xs text-outline">
                  {(
                    (barrioQuery.data?.top.length ?? 0) + (barrioQuery.data?.otros.valores ?? 0)
                  ).toLocaleString('es-AR')}{' '}
                  barrios relevados en total
                </span>
              </div>
            </div>

            {/* PANEL D: Productos Solicitados por Rubro */}
            <div className="flex flex-col justify-between rounded-xl border border-outline-variant bg-surface-container-lowest p-6 shadow-sm">
              <div>
                <div className="flex items-center justify-between border-b border-surface-container pb-3">
                  <h3 className="font-headline-sm text-headline-sm text-primary">
                    Productos por Rubro
                  </h3>
                  <Package size={20} className="text-outline" />
                </div>
                <p className="mb-4 mt-1 text-xs text-on-surface-variant">
                  Comparativa de unidades solicitadas vs. despachadas
                </p>
                <div className="space-y-4">
                  {rubrosQuery.data?.map((rubro) => {
                    const pct =
                      rubro.unidades > 0
                        ? Math.round((rubro.unidades_entregadas / rubro.unidades) * 100)
                        : 0
                    return (
                      <div key={rubro.rubro}>
                        <div className="mb-1 flex items-center justify-between text-xs">
                          <span className="font-bold text-on-surface">
                            {rubro.rubro || 'Sin rubro'}
                          </span>
                          <span className="text-xs text-on-surface-variant">
                            <strong className="text-secondary">
                              {rubro.unidades_entregadas.toLocaleString('es-AR')}
                            </strong>{' '}
                            de {rubro.unidades.toLocaleString('es-AR')} un. ({pct}%)
                          </span>
                        </div>
                        <div className="flex h-3.5 w-full overflow-hidden rounded-full bg-surface-container">
                          <div
                            className="h-full rounded-l-full bg-secondary"
                            style={{ width: `${Math.min(100, pct)}%` }}
                            title="Entregado"
                          />
                          <div
                            className="h-full bg-surface-variant"
                            style={{ width: `${Math.max(0, 100 - pct)}%` }}
                            title="Pendiente"
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
              <div className="mt-4 flex items-center justify-end gap-4 border-t border-surface-container pt-4 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded-full bg-secondary" />
                  <span className="text-on-surface-variant">Unidades Entregadas</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded-full bg-surface-variant" />
                  <span className="text-on-surface-variant">Pendientes</span>
                </div>
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  )
}
