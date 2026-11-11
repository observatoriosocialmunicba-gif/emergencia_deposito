import { CircleAlert, FilterX, Inbox, Layers, Lock, Plus, RefreshCw, Search } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ListaPedidosMovil, Paginador, TablaPedidos } from '../../components/pedidos'
import Spinner from '../../components/Spinner'
import { useAuth } from '../../context/AuthContext'
import { useConteos, usePedidos } from '../../hooks/usePedidos'
import { useAhora, useDebounce } from '../../hooks/useTiempo'
import { haceCuanto, paletaEstado } from '../../lib/estados'

const ESTADOS_DISPONIBLES = [
  'Pendiente de Autorización',
  'Para Asignar',
  'Asignado',
  'Entregado',
  'No Entregado',
  'Rechazado',
] as const

function Esqueleto() {
  return (
    <div
      className="animate-pulse space-y-3 p-space-md"
      role="status"
      aria-label="Cargando solicitudes"
    >
      <div className="h-4 w-3/4 rounded bg-line" />
      {[0, 1, 2, 3, 4].map((i) => (
        <div key={i} className="flex h-10 items-center justify-between rounded-lg bg-page px-3">
          <div className="h-3 w-1/3 rounded bg-line" />
          <div className="h-3 w-1/4 rounded bg-line" />
        </div>
      ))}
    </div>
  )
}

export default function SolicitudesPage() {
  const { usuario, usuarioLoading } = useAuth()
  const [estado, setEstado] = useState<string>('todos')
  const [pagina, setPagina] = useState(0)
  const [porPagina, setPorPagina] = useState(10)
  const [texto, setTexto] = useState('')
  const busqueda = useDebounce(texto, 300)
  const ahora = useAhora()

  const conteos = useConteos()
  const pedidos = usePedidos({ estado, busqueda, pagina, porPagina })

  if (usuarioLoading) return <Spinner />

  const totalGlobal = conteos.data?.reduce((acc, c) => acc + (c.cantidad ?? 0), 0) ?? 0

  if ((usuario?.rol ?? 'No Asignado') === 'No Asignado') {
    return (
      <div className="space-y-space-lg p-margin md:p-margin-desktop">
        <h1 className="font-headline-lg-mobile font-bold tracking-tight text-ink md:font-headline-lg md:text-headline-lg">
          Solicitudes
        </h1>
        <p className="rounded-xl border border-line bg-white p-space-lg text-ink-soft">
          Tu usuario todavía no tiene un rol asignado. Pedile a un administrador que te habilite.
        </p>
      </div>
    )
  }

  if (
    usuario?.rol === 'Asignador' ||
    (usuario?.rol !== 'Administrador' && usuario?.rol !== 'Solicitante')
  ) {
    return (
      <div className="space-y-space-lg p-margin md:p-margin-desktop">
        <h1 className="font-headline-lg-mobile font-bold tracking-tight text-ink md:font-headline-lg md:text-headline-lg">
          Solicitudes
        </h1>
        <div className="flex items-start gap-3 rounded-xl border border-line bg-white p-space-lg text-ink-soft shadow-sm">
          <Lock className="mt-0.5 h-6 w-6 shrink-0 text-outline" />
          <div>
            <h2 className="font-body-md-bold text-body-md-bold text-ink">
              Acceso Restringido
            </h2>
            <p className="mt-1 text-sm">
              La consulta y creación de solicitudes está reservada para usuarios con
              rol <strong>Solicitante</strong> o <strong>Administrador</strong>.
            </p>
          </div>
        </div>
      </div>
    )
  }

  const filas = pedidos.data?.filas ?? []
  const total = pedidos.data?.total ?? 0
  const ultimaPagina = Math.max(0, Math.ceil(total / porPagina) - 1)
  const desde = total === 0 ? 0 : pagina * porPagina + 1
  const hasta = Math.min(total, (pagina + 1) * porPagina)
  const hayBusqueda = texto.trim() !== '' || estado !== 'todos'

  function handleSeleccionarEstado(nuevoEstado: string) {
    setEstado((actual) => (actual === nuevoEstado ? 'todos' : nuevoEstado))
    setPagina(0)
  }

  function handleResetFiltros() {
    setTexto('')
    setEstado('todos')
    setPagina(0)
  }

  return (
    <div className="space-y-space-lg p-margin md:p-margin-desktop">
      {/* Header Zone */}
      <div className="space-y-3 border-b border-line pb-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <h1 className="font-headline-xl text-headline-xl-mobile font-bold tracking-tight text-primary md:text-headline-xl">
            Solicitudes
          </h1>

          <div className="flex flex-wrap items-center gap-3">
            {/* Métricas Globales */}
            <div className="flex items-center gap-3 rounded-xl border border-line bg-white px-4 py-2 shadow-xs">
              <div className="flex size-9 items-center justify-center rounded-lg bg-surface-container text-primary">
                <Layers size={20} />
              </div>
              <div>
                <div className="font-label-sm text-[11px] font-semibold text-on-surface-variant">
                  Total de Solicitudes
                </div>
                <div className="font-headline-sm text-headline-sm font-bold text-primary">
                  {conteos.isLoading ? '...' : totalGlobal.toLocaleString('es-AR')}
                </div>
              </div>
            </div>

            {/* Botón Refrescar */}
            <button
              type="button"
              onClick={() => {
                void conteos.refetch()
                void pedidos.refetch()
              }}
              title="Actualizar datos"
              className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-line bg-white px-3 py-2 font-label-md text-label-md text-ink shadow-xs transition-colors hover:bg-page"
            >
              <RefreshCw
                size={16}
                className={`text-success ${pedidos.isFetching || conteos.isFetching ? 'animate-spin' : ''}`}
              />
              <span className="hidden sm:inline">
                {haceCuanto(pedidos.dataUpdatedAt, ahora)}
              </span>
            </button>

            {/* CTA Nueva Solicitud */}
            <Link
              to="/solicitudes/nueva"
              className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-primary-container px-4 py-2.5 font-label-lg text-label-lg font-semibold text-white shadow-sm transition-all hover:bg-primary-container/90 active:scale-[0.98]"
            >
              <Plus size={18} />
              <span>Nueva solicitud</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Fila de Tarjetas de Estado Rápidas */}
      <section aria-label="Filtro rápido por estado">
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
          {ESTADOS_DISPONIBLES.map((est) => {
            const c = conteos.data?.find((item) => item.estado === est)
            const cantidad = c?.cantidad ?? 0
            const paleta = paletaEstado(est)
            const activo = estado === est

            return (
              <button
                key={est}
                type="button"
                onClick={() => handleSeleccionarEstado(est)}
                className={`flex flex-col justify-between rounded-xl border p-3 text-left shadow-xs transition-all ${
                  activo
                    ? 'border-primary ring-2 ring-primary/20 bg-white'
                    : 'border-line bg-white hover:border-outline hover:bg-panel'
                }`}
              >
                <div className="flex items-center justify-between text-xs text-on-surface-variant">
                  <span className="font-semibold truncate">{est}</span>
                  <span
                    className="size-2 shrink-0 rounded-full"
                    style={{ backgroundColor: paleta.punto }}
                  />
                </div>
                <div className="mt-1 font-headline-sm text-headline-sm font-bold text-primary">
                  {conteos.isLoading ? '...' : cantidad}
                </div>
                <span
                  className="mt-1 self-start rounded px-1.5 py-0.5 font-label-sm text-[11px] font-semibold"
                  style={{
                    color: paleta.texto,
                    backgroundColor: paleta.fondo,
                  }}
                >
                  {activo ? 'Filtrado' : 'Filtrar'}
                </span>
              </button>
            )
          })}
        </div>
      </section>

      {/* Barra de Filtros y Búsqueda */}
      <section className="flex flex-col justify-between gap-3 rounded-xl border border-line bg-white p-space-md shadow-xs lg:flex-row lg:items-center">
        {/* Campo de Búsqueda */}
        <div className="relative min-w-[260px] flex-1">
          <label htmlFor="buscarSolicitud" className="sr-only">
            Buscar por DNI, apellido o barrio
          </label>
          <Search
            size={18}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-soft"
          />
          <input
            id="buscarSolicitud"
            type="search"
            value={texto}
            onChange={(e) => {
              setTexto(e.target.value)
              setPagina(0)
            }}
            placeholder="Buscar por DNI, Apellido, Barrio..."
            className="min-h-[46px] w-full rounded-lg border border-field bg-white pl-10 pr-4 font-body-md text-body-md text-ink placeholder-ink-soft transition-colors focus:border-success focus:outline-none focus:ring-2 focus:ring-success/20"
          />
        </div>

        {/* Selectores de Filtro */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <label
              htmlFor="filtroEstado"
              className="font-label-sm text-xs font-bold text-on-surface uppercase"
            >
              Estado:
            </label>
            <select
              id="filtroEstado"
              value={estado}
              onChange={(e) => {
                setEstado(e.target.value)
                setPagina(0)
              }}
              className="min-h-[44px] rounded-lg border border-field bg-white px-3 font-body-md text-sm text-ink transition-colors focus:border-success focus:outline-none focus:ring-2 focus:ring-success/20"
            >
              <option value="todos">Todos los Estados</option>
              {ESTADOS_DISPONIBLES.map((est) => (
                <option key={est} value={est}>
                  {est}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label
              htmlFor="filtroPorPagina"
              className="font-label-sm text-xs font-bold text-on-surface uppercase"
            >
              Por pág:
            </label>
            <select
              id="filtroPorPagina"
              value={porPagina}
              onChange={(e) => {
                setPorPagina(Number(e.target.value))
                setPagina(0)
              }}
              className="min-h-[44px] rounded-lg border border-field bg-white px-3 font-body-md text-sm text-ink transition-colors focus:border-success focus:outline-none focus:ring-2 focus:ring-success/20"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </div>

          {hayBusqueda && (
            <button
              type="button"
              onClick={handleResetFiltros}
              title="Limpiar filtros"
              className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg border border-line px-3 py-2 font-label-md text-label-md text-ink-soft transition-colors hover:bg-page hover:text-ink"
            >
              <FilterX size={16} />
              <span>Limpiar</span>
            </button>
          )}
        </div>
      </section>

      {/* Resumen de Resultados */}
      <div className="flex items-center justify-between text-xs text-on-surface-variant">
        <span>
          Mostrando <strong>{total === 0 ? 0 : `${desde}–${hasta}`}</strong> de{' '}
          <strong>{total}</strong> registros encontrados
        </span>
        {estado !== 'todos' && (
          <span className="font-semibold text-primary">
            Filtrado por: <u>{estado}</u>
          </span>
        )}
      </div>

      {/* Tabla Principal y Lista Móvil */}
      <section className="overflow-hidden rounded-xl border border-line bg-white shadow-[0px_2px_8px_rgba(0,5,141,0.04)] max-lg:border-0 max-lg:bg-transparent max-lg:shadow-none">
        {pedidos.isError ? (
          <div className="flex items-center gap-3 rounded-xl border border-danger bg-error-container/30 p-6 text-on-error-container">
            <CircleAlert size={24} className="shrink-0 text-danger" />
            <div>
              <h3 className="font-bold">Error al cargar solicitudes</h3>
              <p className="text-xs">No se pudieron recuperar los datos de la base municipal.</p>
            </div>
          </div>
        ) : pedidos.isLoading ? (
          <Esqueleto />
        ) : filas.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl bg-white p-12 text-center">
            <div className="mb-3 flex size-14 items-center justify-center rounded-full bg-surface-container text-primary-container">
              <Inbox size={28} />
            </div>
            <h2 className="font-headline-sm text-headline-sm font-bold text-ink">
              No hay solicitudes registradas
            </h2>
            <p className="mt-1 max-w-sm text-sm text-ink-soft">
              {hayBusqueda
                ? 'No se encontraron registros que coincidan con los filtros aplicados.'
                : 'No se registran solicitudes en el sistema.'}
            </p>
            {hayBusqueda && (
              <button
                type="button"
                onClick={handleResetFiltros}
                className="mt-4 inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-primary-container px-4 py-2 font-label-lg text-label-lg text-primary-container transition-all hover:bg-primary-container/5"
              >
                <RefreshCw size={16} />
                Restablecer vista
              </button>
            )}
          </div>
        ) : (
          <div className={pedidos.isPlaceholderData ? 'opacity-60 transition-opacity' : undefined}>
            <TablaPedidos filas={filas} mostrarEstado={estado === 'todos'} />
            <ListaPedidosMovil filas={filas} />
            <div className="max-lg:mt-3 max-lg:overflow-hidden max-lg:rounded-xl max-lg:border max-lg:border-line">
              <Paginador
                pagina={pagina}
                ultimaPagina={ultimaPagina}
                desde={desde}
                hasta={hasta}
                total={total}
                onCambiar={setPagina}
              />
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
