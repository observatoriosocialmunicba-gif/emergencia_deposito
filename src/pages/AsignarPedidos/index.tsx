import {
  ChevronRight,
  CircleAlert,
  FilterX,
  Inbox,
  Lock,
  Printer,
  RefreshCw,
  Search,
  Truck,
  X,
} from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Paginador } from '../../components/pedidos'
import Spinner from '../../components/Spinner'
import { useAuth } from '../../context/AuthContext'
import { useConteos, usePedidos } from '../../hooks/usePedidos'
import { useAhora, useDebounce } from '../../hooks/useTiempo'
import { formatFecha, haceCuanto } from '../../lib/estados'
import type { Pedido } from '../../lib/types'

const ESTADO_PARA_ASIGNAR = 'Para Asignar'

function Esqueleto() {
  return (
    <div
      className="animate-pulse space-y-3 p-space-md"
      role="status"
      aria-label="Cargando pedidos para asignar"
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

export default function AsignarPedidosPage() {
  const { usuario, usuarioLoading } = useAuth()
  const [pagina, setPagina] = useState(0)
  const [texto, setTexto] = useState('')
  const busqueda = useDebounce(texto, 300)
  const ahora = useAhora()

  const conteos = useConteos()
  const pedidos = usePedidos({ estado: ESTADO_PARA_ASIGNAR, busqueda, pagina })

  const [memoPedido, setMemoPedido] = useState<Pedido | null>(null)

  if (usuarioLoading) return <Spinner />

  if ((usuario?.rol ?? 'No Asignado') === 'No Asignado') {
    return (
      <div className="space-y-space-lg p-margin md:p-margin-desktop">
        <h1 className="font-headline-lg-mobile font-bold tracking-tight text-ink md:font-headline-lg md:text-headline-lg">
          Asignar Pedidos
        </h1>
        <p className="rounded-xl border border-line bg-white p-space-lg text-ink-soft">
          Tu usuario todavía no tiene un rol asignado. Pedile a un administrador que te habilite.
        </p>
      </div>
    )
  }

  if (usuario?.rol !== 'Administrador' && usuario?.rol !== 'Asignador') {
    return (
      <div className="space-y-space-lg p-margin md:p-margin-desktop">
        <h1 className="font-headline-lg-mobile font-bold tracking-tight text-ink md:font-headline-lg md:text-headline-lg">
          Asignar Pedidos
        </h1>
        <div className="flex items-start gap-3 rounded-xl border border-line bg-white p-space-lg text-ink-soft shadow-sm">
          <Lock className="mt-0.5 h-6 w-6 shrink-0 text-outline" />
          <div>
            <h2 className="font-body-md-bold text-body-md-bold text-ink">
              Acceso Restringido
            </h2>
            <p className="mt-1 text-sm">
              La asignación de pedidos está reservada para usuarios con rol{' '}
              <strong>Asignador</strong> o <strong>Administrador</strong>.
            </p>
          </div>
        </div>
      </div>
    )
  }

  const conteoParaAsignar =
    conteos.data?.find((c) => c.estado === ESTADO_PARA_ASIGNAR)?.cantidad ?? 0
  const filas = pedidos.data?.filas ?? []
  const total = pedidos.data?.total ?? 0
  const ultimaPagina = Math.max(0, Math.ceil(total / 10) - 1)
  const desde = total === 0 ? 0 : pagina * 10 + 1
  const hasta = Math.min(total, (pagina + 1) * 10)
  const hayBusqueda = texto.trim() !== ''

  function handleImprimirMemo(pedido: Pedido) {
    setMemoPedido(pedido)
  }

  return (
    <div className="space-y-space-lg p-margin md:p-margin-desktop">
      {/* Breadcrumbs Navigation */}
      <nav
        aria-label="Breadcrumb"
        className="flex items-center gap-1.5 font-label-md text-label-md text-on-surface-variant"
      >
        <span>Inicio</span>
        <ChevronRight size={14} />
        <span>Logística y Cuadrillas</span>
        <ChevronRight size={14} />
        <span className="font-bold text-primary">Asignar Pedidos</span>
      </nav>

      {/* Header Section & KPI Counter */}
      <div className="flex flex-col justify-between gap-4 rounded-xl border border-surface-variant bg-white p-6 shadow-xs lg:flex-row lg:items-center">
        <div>
          <h1 className="font-headline-xl text-headline-xl-mobile font-bold tracking-tight text-primary md:text-headline-xl">
            Asignar Pedidos
          </h1>
          <p className="mt-1 font-body-md text-body-md text-on-surface-variant">
            Gestión y distribución de pedidos autorizados para asignación de unidades de transporte
            y cuadrillas.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start rounded-xl border border-[#0050FF]/30 bg-[#0050FF]/10 px-5 py-3.5 shadow-xs lg:self-auto">
          <div className="flex size-10 items-center justify-center rounded-lg bg-[#0050FF] text-white">
            <Truck size={22} />
          </div>
          <div>
            <div className="font-label-sm text-[11px] font-bold tracking-wider text-[#0036B3] uppercase">
              Estado de Despacho
            </div>
            <div className="font-headline-sm text-headline-sm font-bold text-[#00058D]">
              Pedidos Para Asignar: {conteos.isLoading ? '...' : conteoParaAsignar}
            </div>
          </div>
        </div>
      </div>

      {/* Toolbar: Búsqueda y Acciones */}
      <div className="flex flex-col items-stretch justify-between gap-3 rounded-xl border border-line bg-white p-4 shadow-xs md:flex-row md:items-center">
        <div className="relative min-w-[260px] flex-1">
          <label htmlFor="buscarParaAsignar" className="sr-only">
            Buscar por DNI, apellido o barrio
          </label>
          <Search
            size={18}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-soft"
          />
          <input
            id="buscarParaAsignar"
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

      {/* Tabla y Lista de Pedidos Para Asignar */}
      <div className="overflow-hidden rounded-xl border border-line bg-white shadow-[0px_2px_8px_rgba(0,5,141,0.04)] max-lg:border-0 max-lg:bg-transparent max-lg:shadow-none">
        {pedidos.isError ? (
          <div className="flex items-center gap-3 rounded-xl border border-danger bg-error-container/30 p-6 text-on-error-container">
            <CircleAlert size={24} className="shrink-0 text-danger" />
            <div>
              <h3 className="font-bold">Error al cargar pedidos para asignar</h3>
              <p className="text-xs">No se pudieron recuperar los registros de la base de datos.</p>
            </div>
          </div>
        ) : pedidos.isLoading ? (
          <Esqueleto />
        ) : filas.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl bg-white p-12 text-center">
            <div className="mb-3 flex size-14 items-center justify-center rounded-full bg-[#0050FF]/15 text-[#00058D]">
              <Inbox size={28} />
            </div>
            <h2 className="font-headline-sm text-headline-sm font-bold text-ink">
              No hay pedidos pendientes de asignación
            </h2>
            <p className="mt-1 max-w-md text-sm text-ink-soft">
              {hayBusqueda
                ? 'No se encontraron pedidos en estado "Para Asignar" con el criterio de búsqueda.'
                : 'Todos los pedidos autorizados ya cuentan con cuadrilla y vehículo asignado.'}
            </p>
          </div>
        ) : (
          <div>
            {/* Tabla Escritorio */}
            <div className="custom-scrollbar hidden overflow-x-auto lg:block">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="bg-primary-container font-headline-sm text-[13px] uppercase tracking-wider text-white">
                    <th scope="col" className="px-4 py-3.5 font-bold">
                      Fecha
                    </th>
                    <th scope="col" className="px-4 py-3.5 font-bold">
                      Apellido y Nombre
                    </th>
                    <th scope="col" className="px-4 py-3.5 font-bold">
                      Ref. Ubicación
                    </th>
                    <th scope="col" className="px-4 py-3.5 font-bold">
                      Procedencia
                    </th>
                    <th scope="col" className="px-4 py-3.5 font-bold">
                      Observaciones
                    </th>
                    <th scope="col" className="px-4 py-3.5 font-bold text-center">
                      Ult. Edición
                    </th>
                    <th scope="col" className="px-4 py-3.5 font-bold text-center">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line text-ink">
                  {filas.map((p, i) => (
                    <tr
                      key={p.id}
                      className={`transition-colors hover:bg-page ${i % 2 === 0 ? 'bg-white' : 'bg-panel'}`}
                    >
                      <td className="whitespace-nowrap px-4 py-3.5 font-body-md-bold text-body-md-bold">
                        {formatFecha(p.fecha)}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="font-body-md-bold text-primary">
                          {p.nombreCompleto ?? '-'}
                        </span>
                        <div className="font-mono text-xs text-ink-soft">DNI: {p.dni ?? '-'}</div>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="font-medium">{p.barrio ?? '-'}</div>
                        {p.direccion && (
                          <span className="block text-xs text-ink-soft">{p.direccion}</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        {p.procedencia ? (
                          <span className="inline-flex rounded border border-outline-variant bg-surface-container px-2 py-0.5 text-xs font-semibold text-primary-container">
                            {p.procedencia}
                          </span>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="max-w-xs px-4 py-3.5">
                        <p className="line-clamp-2 text-xs">{p.observaciones || '-'}</p>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5 text-center text-xs text-ink-soft">
                        {p.ultModificacion ?? '-'}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleImprimirMemo(p)}
                            title="Imprimir Memo"
                            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg border border-outline-variant px-3 py-1.5 font-label-md text-label-md text-primary transition-colors hover:bg-surface-container active:scale-[0.98]"
                          >
                            <Printer size={16} />
                            <span>Memo</span>
                          </button>
                          <Link
                            to={`/ver-pedido/${p.id}`}
                            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg bg-primary-container px-3.5 py-1.5 font-label-md text-label-md font-semibold text-white shadow-xs transition-all hover:bg-primary-container/90 active:scale-[0.98]"
                          >
                            <Truck size={16} />
                            <span>Asignar</span>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Lista Móvil */}
            <div className="space-y-3 lg:hidden">
              {filas.map((p) => (
                <div
                  key={p.id}
                  className="space-y-3 rounded-xl border border-line bg-white p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="rounded-full border border-[#0050FF]/30 bg-[#0050FF]/15 px-2.5 py-0.5 font-label-sm text-xs font-bold text-[#002B8A]">
                        Para Asignar
                      </span>
                      <h3 className="mt-1 font-body-lg-bold text-body-lg-bold text-primary">
                        {p.nombreCompleto ?? '-'}
                      </h3>
                      <p className="font-mono text-xs text-ink-soft">DNI: {p.dni ?? '-'}</p>
                    </div>
                    <span className="rounded bg-page px-2 py-1 text-xs font-medium text-ink-soft">
                      {formatFecha(p.fecha)}
                    </span>
                  </div>

                  <div className="space-y-1 rounded-lg border border-line bg-panel p-2.5 text-xs text-ink">
                    <p>
                      <strong className="text-primary-container">Ubicación:</strong>{' '}
                      {[p.barrio, p.direccion].filter(Boolean).join(' — ') || '-'}
                    </p>
                    <p>
                      <strong className="text-primary-container">Procedencia:</strong>{' '}
                      {p.procedencia ?? '-'}
                    </p>
                    <p>
                      <strong className="text-primary-container">Observaciones:</strong>{' '}
                      {p.observaciones || '-'}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => handleImprimirMemo(p)}
                      className="flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-lg border border-outline-variant py-2 font-label-md text-label-md text-primary hover:bg-surface-container"
                    >
                      <Printer size={16} />
                      <span>Imprimir Memo</span>
                    </button>
                    <Link
                      to={`/ver-pedido/${p.id}`}
                      className="flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary-container py-2 font-label-md text-label-md font-semibold text-white shadow-xs hover:bg-primary-container/90"
                    >
                      <Truck size={16} />
                      <span>Asignar</span>
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            {/* Paginador */}
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
      </div>

      {/* Modal: Vista de Memo Imprimible */}
      {memoPedido && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-primary/40 p-4 backdrop-blur-xs"
        >
          <div className="w-full max-w-lg rounded-2xl border border-white/80 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-page pb-3">
              <div className="flex items-center gap-2 text-primary">
                <Printer size={22} className="text-secondary" />
                <h3 className="font-headline-sm text-headline-sm font-bold">
                  Memo de Despacho #{memoPedido.id}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setMemoPedido(null)}
                className="rounded-lg p-1 text-ink-soft hover:bg-page hover:text-ink"
              >
                <X size={20} />
              </button>
            </div>

            <div className="my-4 space-y-3 rounded-lg border border-line bg-page p-4 text-xs text-ink font-mono">
              <div className="border-b border-line pb-2 text-center">
                <p className="font-bold text-sm">MUNICIPALIDAD DE CÓRDOBA</p>
                <p className="text-[11px] text-ink-soft">
                  Dirección General de Emergencias Sociales y Logística
                </p>
              </div>
              <div>
                <p><strong>PEDIDO:</strong> #{memoPedido.id}</p>
                <p><strong>FECHA SOLICITUD:</strong> {formatFecha(memoPedido.fecha)}</p>
                <p><strong>BENEFICIARIO:</strong> {memoPedido.nombreCompleto}</p>
                <p><strong>DNI:</strong> {memoPedido.dni ?? 'S/D'}</p>
                <p><strong>BARRIO:</strong> {memoPedido.barrio}</p>
                <p><strong>DIRECCIÓN:</strong> {memoPedido.direccion ?? '-'}</p>
                <p><strong>PROCEDENCIA:</strong> {memoPedido.procedencia ?? '-'}</p>
                <p><strong>OBSERVACIONES:</strong> {memoPedido.observaciones || '-'}</p>
              </div>
              <div className="border-t border-line pt-2">
                <p><strong>ESTADO:</strong> {memoPedido.estado}</p>
                <p><strong>FIRMA RESPONSABLE:</strong> _______________________</p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setMemoPedido(null)}
                className="min-h-[44px] rounded-lg border border-line px-4 py-2 font-label-md text-sm text-ink hover:bg-page"
              >
                Cerrar
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-primary-container px-5 py-2 font-label-md text-sm font-semibold text-white shadow-xs hover:bg-primary-container/90"
              >
                <Printer size={16} />
                Imprimir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
