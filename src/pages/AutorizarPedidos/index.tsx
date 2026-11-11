import { CircleAlert, Clock, FilterX, Inbox, RefreshCw, Search, ShieldAlert } from 'lucide-react'
import { useState } from 'react'
import { ListaPedidosMovil, Paginador, TablaPedidos } from '../../components/pedidos'
import Spinner from '../../components/Spinner'
import { useAuth } from '../../context/AuthContext'
import { useConteos, usePedidos } from '../../hooks/usePedidos'
import { useAhora, useDebounce } from '../../hooks/useTiempo'
import { haceCuanto } from '../../lib/estados'
import { POR_PAGINA } from '../../services/pedidosService'

const ESTADO_AUTORIZAR = 'Pendiente de Autorización'

function Esqueleto() {
  return (
    <div
      className="animate-pulse space-y-3 p-space-md"
      role="status"
      aria-label="Cargando pedidos para autorizar"
    >
      <div className="h-4 w-3/4 rounded bg-line" />
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="flex h-10 items-center justify-between rounded-lg bg-page px-3">
          <div className="h-3 w-1/3 rounded bg-line" />
          <div className="h-3 w-1/4 rounded bg-line" />
        </div>
      ))}
    </div>
  )
}

export default function AutorizarPedidosPage() {
  const { usuario, usuarioLoading } = useAuth()
  const [pagina, setPagina] = useState(0)
  const [texto, setTexto] = useState('')
  const busqueda = useDebounce(texto, 300)
  const ahora = useAhora()

  const conteos = useConteos()
  const pedidos = usePedidos({ estado: ESTADO_AUTORIZAR, busqueda, pagina })

  if (usuarioLoading) return <Spinner />

  const esAdmin = usuario?.rol === 'Administrador'
  const conteoPendientes =
    conteos.data?.find((c) => c.estado === ESTADO_AUTORIZAR)?.cantidad ?? 0

  if (!esAdmin) {
    return (
      <div className="space-y-space-lg p-margin md:p-margin-desktop">
        <div className="flex flex-col gap-2 rounded-xl border border-line bg-white p-space-lg shadow-sm">
          <div className="flex items-center gap-2.5 text-danger">
            <ShieldAlert size={24} />
            <h1 className="font-headline-lg-mobile font-bold tracking-tight md:font-headline-lg md:text-headline-lg">
              Acceso Restringido
            </h1>
          </div>
          <p className="font-body-md text-ink-soft">
            La sección de <strong>Autorizar Pedidos</strong> es de uso exclusivo para usuarios con
            el rol de <strong>Administrador</strong>.
          </p>
        </div>
      </div>
    )
  }

  const filas = pedidos.data?.filas ?? []
  const total = pedidos.data?.total ?? 0
  const ultimaPagina = Math.max(0, Math.ceil(total / POR_PAGINA) - 1)
  const desde = total === 0 ? 0 : pagina * POR_PAGINA + 1
  const hasta = Math.min(total, (pagina + 1) * POR_PAGINA)
  const hayBusqueda = texto.trim() !== ''

  return (
    <div className="space-y-space-lg p-margin md:p-margin-desktop">
      {/* Header Section */}
      <div className="flex flex-col justify-between gap-space-md lg:flex-row lg:items-center">
        <h1 className="font-headline-xl text-headline-xl-mobile font-bold tracking-tight text-primary md:text-headline-xl">
          Autorizar Pedidos
        </h1>

        {/* Counter Banner (KPI Card) */}
        <div className="flex shrink-0 items-center gap-space-md rounded-xl border border-outline-variant/80 bg-white p-space-md shadow-xs">
          <div className="flex size-12 items-center justify-center rounded-lg border border-[#F9CF58] bg-[#F9CF58]/20 text-[#4A3800]">
            <Clock size={26} />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-headline-sm text-headline-sm font-bold text-primary">
              Pedidos Pendientes de Autorización:
            </span>
            <span className="rounded-full border border-[#F9CF58] bg-[#F9CF58]/30 px-2.5 py-0.5 text-base font-extrabold text-[#4A3800]">
              {conteos.isLoading ? '...' : conteoPendientes}
            </span>
          </div>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="flex flex-col items-stretch justify-between gap-space-md rounded-xl border border-line bg-white p-space-md shadow-xs md:flex-row md:items-center">
        {/* Search Input */}
        <div className="relative flex-1 max-w-lg">
          <label htmlFor="buscarAutorizar" className="sr-only">
            Buscar por DNI, apellido o barrio
          </label>
          <Search
            size={18}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-soft"
          />
          <input
            id="buscarAutorizar"
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

        {/* Quick Actions / Refresh */}
        <div className="flex items-center gap-2 self-end md:self-center">
          {hayBusqueda && (
            <button
              type="button"
              onClick={() => {
                setTexto('')
                setPagina(0)
              }}
              title="Limpiar búsqueda"
              className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg border border-line bg-panel px-3 py-2 font-label-md text-label-md text-ink transition-colors hover:bg-page"
            >
              <FilterX size={16} />
              <span>Limpiar</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              void conteos.refetch()
              void pedidos.refetch()
            }}
            title="Actualizar datos"
            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg border border-line bg-white px-3 py-2 font-label-md text-label-md text-ink shadow-xs transition-colors hover:bg-page"
          >
            <RefreshCw
              size={16}
              className={`text-success ${pedidos.isFetching || conteos.isFetching ? 'animate-spin' : ''}`}
            />
            <span className="hidden sm:inline">
              Actualizado {haceCuanto(pedidos.dataUpdatedAt, ahora)}
            </span>
          </button>
        </div>
      </div>

      {/* Results Header Summary */}
      <div className="flex items-center justify-between text-xs text-on-surface-variant">
        <span>
          Mostrando <strong>{total === 0 ? 0 : `${desde}–${hasta}`}</strong> de{' '}
          <strong>{total}</strong> pedidos pendientes
        </span>
      </div>

      {/* Main Table / Mobile Cards */}
      <section className="overflow-hidden rounded-xl border border-line bg-white shadow-[0px_2px_8px_rgba(0,5,141,0.04)] max-lg:border-0 max-lg:bg-transparent max-lg:shadow-none">
        {pedidos.isError ? (
          <div className="flex items-center gap-3 rounded-xl border border-danger bg-error-container/30 p-6 text-on-error-container">
            <CircleAlert size={24} className="shrink-0 text-danger" />
            <div>
              <h3 className="font-bold">Error al cargar solicitudes pendientes</h3>
              <p className="text-xs">No se pudieron recuperar los registros desde la base de datos.</p>
            </div>
          </div>
        ) : pedidos.isLoading ? (
          <Esqueleto />
        ) : filas.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl bg-white p-12 text-center">
            <div className="mb-3 flex size-14 items-center justify-center rounded-full bg-[#F9CF58]/20 text-[#4A3800]">
              <Inbox size={28} />
            </div>
            <h2 className="font-headline-sm text-headline-sm font-bold text-ink">
              No hay pedidos pendientes de autorización
            </h2>
            <p className="mt-1 max-w-md text-sm text-ink-soft">
              {hayBusqueda
                ? 'No se encontraron pedidos pendientes que coincidan con la búsqueda.'
                : 'No hay pedidos esperando autorización.'}
            </p>
            {hayBusqueda && (
              <button
                type="button"
                onClick={() => {
                  setTexto('')
                  setPagina(0)
                }}
                className="mt-4 inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-primary-container px-4 py-2 font-label-lg text-label-lg text-primary-container transition-all hover:bg-primary-container/5"
              >
                <RefreshCw size={16} />
                Restablecer vista
              </button>
            )}
          </div>
        ) : (
          <div className={pedidos.isPlaceholderData ? 'opacity-60 transition-opacity' : undefined}>
            <TablaPedidos filas={filas} mostrarEstado={false} />
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
