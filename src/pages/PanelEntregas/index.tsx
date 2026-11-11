import {
  ChevronRight,
  CircleAlert,
  FilterX,
  Inbox,
  Lock,
  Printer,
  RefreshCw,
  Route as RouteIcon,
  Search,
  Truck,
  X,
} from 'lucide-react'
import { useState } from 'react'
import { BotonVerPedido, Paginador } from '../../components/pedidos'
import Spinner from '../../components/Spinner'
import { useAuth } from '../../context/AuthContext'
import { useConteos, usePedidos } from '../../hooks/usePedidos'
import { useAhora, useDebounce } from '../../hooks/useTiempo'
import { formatFecha, haceCuanto } from '../../lib/estados'
import type { Pedido } from '../../lib/types'

const ESTADO_ENTREGAS = 'Asignado'

function Esqueleto() {
  return (
    <div
      className="animate-pulse space-y-3 p-space-md"
      role="status"
      aria-label="Cargando panel de entregas"
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

export default function PanelEntregasPage() {
  const { usuario, usuarioLoading } = useAuth()
  const [pagina, setPagina] = useState(0)
  const [texto, setTexto] = useState('')
  const busqueda = useDebounce(texto, 300)
  const ahora = useAhora()

  const conteos = useConteos()
  const pedidos = usePedidos({ estado: ESTADO_ENTREGAS, busqueda, pagina })

  const [memoPedido, setMemoPedido] = useState<Pedido | null>(null)

  if (usuarioLoading) return <Spinner />

  if ((usuario?.rol ?? 'No Asignado') === 'No Asignado') {
    return (
      <div className="space-y-space-lg p-margin md:p-margin-desktop">
        <h1 className="font-headline-lg-mobile font-bold tracking-tight text-ink md:font-headline-lg md:text-headline-lg">
          Panel de Entregas
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
          Panel de Entregas
        </h1>
        <div className="flex items-start gap-3 rounded-xl border border-line bg-white p-space-lg text-ink-soft shadow-sm">
          <Lock className="mt-0.5 h-6 w-6 shrink-0 text-outline" />
          <div>
            <h2 className="font-body-md-bold text-body-md-bold text-ink">
              Acceso Restringido
            </h2>
            <p className="mt-1 text-sm">
              El registro y seguimiento de entregas está reservado para usuarios con
              rol <strong>Asignador</strong> o <strong>Administrador</strong>.
            </p>
          </div>
        </div>
      </div>
    )
  }

  const conteoAsignados =
    conteos.data?.find((c) => c.estado === ESTADO_ENTREGAS)?.cantidad ?? 0
  const filas = pedidos.data?.filas ?? []
  const total = pedidos.data?.total ?? 0
  const ultimaPagina = Math.max(0, Math.ceil(total / 10) - 1)
  const desde = total === 0 ? 0 : pagina * 10 + 1
  const hasta = Math.min(total, (pagina + 1) * 10)
  const hayBusqueda = texto.trim() !== ''

  function handleExportarRuta() {
    window.print()
  }

  return (
    <div className="space-y-space-lg p-margin md:p-margin-desktop">
      {/* Breadcrumb Navigation */}
      <nav
        aria-label="Breadcrumb"
        className="flex items-center gap-1.5 font-label-md text-label-md text-on-surface-variant"
      >
        <span>Inicio</span>
        <ChevronRight size={14} />
        <span>Monitoreo y Campo</span>
        <ChevronRight size={14} />
        <span className="font-bold text-primary">Panel de Entregas</span>
      </nav>

      {/* Page Header & Counter Banner */}
      <section className="flex flex-col justify-between gap-4 rounded-xl border border-line bg-white p-6 shadow-xs md:flex-row md:items-center">
        <div>
          <h1 className="font-headline-xl text-headline-xl-mobile font-bold tracking-tight text-primary md:text-headline-xl">
            Panel de Entregas
          </h1>
          <p className="mt-1 font-body-md text-body-md text-on-surface-variant">
            Monitoreo y seguimiento en territorio de pedidos despachados con cuadrillas en calle.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start rounded-xl border border-secondary/30 bg-surface-bright px-5 py-3.5 shadow-xs md:self-auto">
          <div className="flex size-10 items-center justify-center rounded-lg bg-secondary/15 text-secondary">
            <Truck size={24} />
          </div>
          <div>
            <div className="font-label-sm text-[11px] font-semibold tracking-wider text-on-surface-variant uppercase">
              Estado de Cuadrilla
            </div>
            <div className="mt-0.5 flex items-center gap-2">
              <span className="font-headline-sm text-headline-sm font-bold text-primary">
                Pedidos Asignados: {conteos.isLoading ? '...' : conteoAsignados}
              </span>
              <span className="inline-flex items-center rounded-full border border-[#81F47A] bg-[#81F47A]/30 px-2.5 py-0.5 text-xs font-bold text-[#0E470A]">
                En Calle
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Tactical Control / Filter Toolbar */}
      <section className="flex flex-col justify-between gap-3 rounded-xl border border-line bg-white p-4 shadow-xs lg:flex-row lg:items-center">
        {/* Search Input */}
        <div className="relative min-w-[280px] flex-1">
          <label htmlFor="buscarEntregas" className="sr-only">
            Buscar por DNI, apellido, barrio o chofer
          </label>
          <Search
            size={18}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-soft"
          />
          <input
            id="buscarEntregas"
            type="search"
            value={texto}
            onChange={(e) => {
              setTexto(e.target.value)
              setPagina(0)
            }}
            placeholder="Buscar por DNI, Apellido, Barrio o Móvil..."
            className="min-h-[46px] w-full rounded-lg border border-field bg-white pl-10 pr-4 font-body-md text-body-md text-ink placeholder-ink-soft transition-colors focus:border-success focus:outline-none focus:ring-2 focus:ring-success/20"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
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

          <button
            type="button"
            onClick={handleExportarRuta}
            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg border border-primary-container px-4 py-2 font-label-lg text-label-lg text-primary-container transition-colors duration-150 hover:bg-primary-container/5 active:scale-[0.98]"
          >
            <RouteIcon size={18} />
            <span>Exportar / Imprimir Ruta</span>
          </button>
        </div>
      </section>

      {/* Main Table / Mobile Cards */}
      <div className="overflow-hidden rounded-xl border border-line bg-white shadow-[0px_2px_8px_rgba(0,5,141,0.04)] max-lg:border-0 max-lg:bg-transparent max-lg:shadow-none">
        {pedidos.isError ? (
          <div className="flex items-center gap-3 rounded-xl border border-danger bg-error-container/30 p-6 text-on-error-container">
            <CircleAlert size={24} className="shrink-0 text-danger" />
            <div>
              <h3 className="font-bold">Error al cargar pedidos en calle</h3>
              <p className="text-xs">No se pudieron recuperar los registros desde la base de datos.</p>
            </div>
          </div>
        ) : pedidos.isLoading ? (
          <Esqueleto />
        ) : filas.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl bg-white p-12 text-center">
            <div className="mb-3 flex size-14 items-center justify-center rounded-full bg-surface-container text-secondary">
              <Inbox size={28} />
            </div>
            <h2 className="font-headline-sm text-headline-sm font-bold text-ink">
              No hay pedidos en calle en este momento
            </h2>
            <p className="mt-1 max-w-md text-sm text-ink-soft">
              {hayBusqueda
                ? 'No se encontraron entregas que coincidan con la búsqueda.'
                : 'No se registran despachos asignados pendientes de entrega.'}
            </p>
          </div>
        ) : (
          <div>
            {/* Table Section (Desktop View) */}
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
                      Móvil / Entregador
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
                      <td className="px-4 py-3.5 font-body-md-bold text-primary">
                        {p.nombreCompleto ?? '-'}
                        <div className="font-mono text-xs font-normal text-ink-soft">
                          DNI: {p.dni ?? '-'} • {p.barrio ?? '-'}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 font-semibold text-secondary">
                          <Truck size={15} />
                          <span>{p.nombreVehiculo || 'Móvil asignado'}</span>
                        </div>
                        {p.entregador && (
                          <div className="text-xs text-ink-soft">Chofer: {p.entregador}</div>
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
                            onClick={() => setMemoPedido(p)}
                            title="Reimprimir memo"
                            className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border border-primary-container px-3 py-1.5 font-label-md text-label-md text-primary-container transition-colors hover:bg-primary-container/10 active:scale-[0.98]"
                          >
                            <Printer size={16} />
                            <span>Reimprimir</span>
                          </button>
                          <BotonVerPedido id={p.id} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile/Tablet Card-Based List */}
            <div className="space-y-3 lg:hidden">
              {filas.map((p) => (
                <article
                  key={p.id}
                  className="space-y-3 rounded-xl border border-line bg-white p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between border-b border-line pb-2.5">
                    <div>
                      <span className="text-xs font-semibold text-ink-soft">
                        {formatFecha(p.fecha)}
                      </span>
                      <h2 className="font-body-lg-bold text-body-lg-bold text-primary">
                        {p.nombreCompleto ?? '-'}
                      </h2>
                      <span className="text-xs text-ink-soft">
                        DNI: {p.dni ?? '-'} • {p.barrio ?? '-'}
                      </span>
                    </div>
                    <span className="inline-flex items-center rounded-full border border-[#81F47A] bg-[#81F47A]/30 px-2.5 py-0.5 text-[11px] font-bold text-[#0E470A]">
                      En Calle
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-ink-soft">
                    <span className="flex items-center gap-1 font-semibold text-secondary">
                      <Truck size={14} />
                      {p.nombreVehiculo || 'Móvil asignado'}
                    </span>
                    <span>{p.ultModificacion ?? '-'}</span>
                  </div>

                  {p.observaciones && (
                    <p className="rounded-lg bg-panel p-2 text-xs text-ink line-clamp-2">
                      {p.observaciones}
                    </p>
                  )}

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setMemoPedido(p)}
                      className="flex min-h-[44px] items-center justify-center gap-1.5 rounded-lg border border-primary-container py-2 font-label-md text-label-md text-primary-container active:bg-primary-container/5"
                    >
                      <Printer size={16} />
                      <span>Reimprimir</span>
                    </button>
                    <BotonVerPedido id={p.id} grande />
                  </div>
                </article>
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

      {/* Modal: Vista de Reimpresión de Memo */}
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
                  Comprobante de Despacho #{memoPedido.id}
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

            <div className="my-4 space-y-3 rounded-lg border border-line bg-page p-4 text-xs font-mono text-ink">
              <div className="border-b border-line pb-2 text-center">
                <p className="font-bold text-sm">MUNICIPALIDAD DE CÓRDOBA</p>
                <p className="text-[11px] text-ink-soft">
                  Secretaría de Políticas Sociales y Desarrollo Humano
                </p>
              </div>
              <div>
                <p><strong>PEDIDO:</strong> #{memoPedido.id}</p>
                <p><strong>FECHA:</strong> {formatFecha(memoPedido.fecha)}</p>
                <p><strong>DESTINATARIO:</strong> {memoPedido.nombreCompleto}</p>
                <p><strong>DNI:</strong> {memoPedido.dni ?? 'S/D'}</p>
                <p><strong>BARRIO/DIRECCIÓN:</strong> {memoPedido.barrio} {memoPedido.direccion && `• ${memoPedido.direccion}`}</p>
                <p><strong>MÓVIL ASIGNADO:</strong> {memoPedido.nombreVehiculo ?? 'Asignado'}</p>
                <p><strong>ENTREGADOR:</strong> {memoPedido.entregador ?? 'Cuadrilla'}</p>
                <p><strong>OBSERVACIONES:</strong> {memoPedido.observaciones || '-'}</p>
              </div>
              <div className="border-t border-line pt-2">
                <p><strong>CONFORMIDAD DE RECEPCIÓN:</strong></p>
                <p className="mt-4">Firma: _______________________ Aclaración: _________________</p>
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
