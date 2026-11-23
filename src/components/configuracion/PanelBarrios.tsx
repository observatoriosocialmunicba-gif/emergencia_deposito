import {
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Edit2,
  MapPin,
  Plus,
  Power,
  RefreshCw,
  Search,
  X,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import Spinner from '../Spinner'
import { ModalConfirmarEstadoBarrio } from './ModalConfirmarEstadoBarrio'
import { ModalEditarBarrio } from './ModalEditarBarrio'
import {
  useActualizarBarrio,
  useBarriosAdmin,
  useCambiarEstadoBarrio,
  useCrearBarrio,
} from '../../hooks/useBarrios'
import { normalizar } from '../../lib/texto'
import type { Barrio } from '../../lib/types'

const POR_PAGINA = 50

export default function PanelBarrios() {
  const barriosQuery = useBarriosAdmin()
  const crearMutation = useCrearBarrio()
  const actualizarMutation = useActualizarBarrio()
  const cambiarEstadoMutation = useCambiarEstadoBarrio()

  // Filtros
  const [busqueda, setBusqueda] = useState('')
  const [mostrarInactivos, setMostrarInactivos] = useState(true)
  const [paginaActual, setPaginaActual] = useState(1)

  // Modales
  const [modalEditarOpen, setModalEditarOpen] = useState(false)
  const [barrioEditar, setBarrioEditar] = useState<Barrio | null>(null)

  const [modalEstadoOpen, setModalEstadoOpen] = useState(false)
  const [barrioEstado, setBarrioEstado] = useState<Barrio | null>(null)
  const [confirmandoEstado, setConfirmandoEstado] = useState(false)

  // Feedback
  const [mensajeExito, setMensajeExito] = useState<string | null>(null)
  const [mensajeError, setMensajeError] = useState<string | null>(null)

  const todosBarrios = barriosQuery.data ?? []

  // Filtrado
  const barriosFiltrados = useMemo(() => {
    const qNorm = normalizar(busqueda)
    const palabras = qNorm.split(/\s+/).filter(Boolean)

    const filtrados = todosBarrios.filter((b) => {
      const estaActivo = b.activo !== false
      if (!mostrarInactivos && !estaActivo) return false
      if (palabras.length === 0) return true

      const nombreNorm = normalizar(b.NombreBarrio ?? '')
      return palabras.every((p) => nombreNorm.includes(p))
    })

    // Ordenar: primero los que empiezan con la búsqueda, luego alfabéticamente
    filtrados.sort((a, b) => {
      const nomA = a.NombreBarrio ?? ''
      const nomB = b.NombreBarrio ?? ''
      const normA = normalizar(nomA)
      const normB = normalizar(nomB)

      if (qNorm) {
        const aEmpieza = normA.startsWith(qNorm)
        const bEmpieza = normB.startsWith(qNorm)
        if (aEmpieza && !bEmpieza) return -1
        if (!aEmpieza && bEmpieza) return 1
      }
      return nomA.localeCompare(nomB, 'es')
    })

    return filtrados
  }, [todosBarrios, busqueda, mostrarInactivos])

  // Paginación
  const totalPaginas = Math.ceil(barriosFiltrados.length / POR_PAGINA) || 1
  const paginaAjustada = Math.min(paginaActual, totalPaginas)
  const inicio = (paginaAjustada - 1) * POR_PAGINA
  const barriosPaginados = barriosFiltrados.slice(inicio, inicio + POR_PAGINA)

  function handleCambioBusqueda(val: string) {
    setBusqueda(val)
    setPaginaActual(1)
  }

  function handleAbrirCrear() {
    setBarrioEditar(null)
    setMensajeExito(null)
    setMensajeError(null)
    setModalEditarOpen(true)
  }

  function handleAbrirEditar(b: Barrio) {
    setBarrioEditar(b)
    setMensajeExito(null)
    setMensajeError(null)
    setModalEditarOpen(true)
  }

  function handleAbrirEstado(b: Barrio) {
    setBarrioEstado(b)
    setMensajeExito(null)
    setMensajeError(null)
    setModalEstadoOpen(true)
  }

  async function handleGuardarBarrio(datos: {
    nombre: string
    lat?: string | null
    long?: string | null
  }) {
    setMensajeExito(null)
    setMensajeError(null)
    if (barrioEditar) {
      await actualizarMutation.mutateAsync({
        id: barrioEditar.id,
        nombre: datos.nombre,
        lat: datos.lat,
        long: datos.long,
      })
      setMensajeExito(`Barrio "${datos.nombre}" actualizado con éxito.`)
    } else {
      await crearMutation.mutateAsync(datos)
      setMensajeExito(`Barrio "${datos.nombre}" creado con éxito.`)
    }
  }

  async function handleConfirmarCambioEstado() {
    if (!barrioEstado) return
    setConfirmandoEstado(true)
    setMensajeExito(null)
    setMensajeError(null)
    try {
      const nuevoEstado = !(barrioEstado.activo !== false)
      await cambiarEstadoMutation.mutateAsync({
        id: barrioEstado.id,
        activo: nuevoEstado,
      })
      setMensajeExito(
        nuevoEstado
          ? `Barrio "${barrioEstado.NombreBarrio}" activado correctamente.`
          : `Barrio "${barrioEstado.NombreBarrio}" desactivado correctamente.`,
      )
      setModalEstadoOpen(false)
      setBarrioEstado(null)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al cambiar estado del barrio.'
      setMensajeError(msg)
    } finally {
      setConfirmandoEstado(false)
    }
  }

  return (
    <div className="space-y-space-lg">
      {/* Cabecera */}
      <div className="flex flex-col justify-between gap-4 rounded-xl border border-line bg-white p-space-lg shadow-[0px_2px_8px_rgba(0,5,141,0.04)] sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2 text-primary">
            <MapPin size={22} />
            <h2 className="font-headline-sm text-lg font-bold text-ink">
              Catálogo de Barrios
            </h2>
          </div>
          <p className="mt-1 font-body-md text-sm text-ink-soft">
            Administrá los barrios de la ciudad utilizados para la localización de solicitudes.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleAbrirCrear}
            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg bg-primary-container px-4 py-2 font-label-md text-sm font-bold text-white shadow-xs transition-all hover:bg-primary-container/90 active:scale-[0.98]"
          >
            <Plus size={18} />
            <span>Nuevo Barrio</span>
          </button>

          <button
            type="button"
            onClick={() => void barriosQuery.refetch()}
            title="Actualizar listado"
            aria-label="Actualizar listado de barrios"
            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center gap-1.5 rounded-lg border border-line bg-panel px-3 py-1.5 font-label-md text-label-md text-ink transition-colors hover:bg-page"
          >
            <RefreshCw
              size={16}
              className={`text-secondary ${barriosQuery.isFetching ? 'animate-spin' : ''}`}
            />
            <span className="hidden sm:inline">Actualizar</span>
          </button>
        </div>
      </div>

      {/* Banner de Éxito */}
      {mensajeExito && (
        <div
          role="status"
          className="flex items-center gap-2.5 rounded-xl border border-secondary bg-surface-container p-4 text-sm font-semibold text-secondary"
        >
          <CheckCircle2 size={20} className="shrink-0" />
          <span>{mensajeExito}</span>
        </div>
      )}

      {/* Banner de Error */}
      {mensajeError && (
        <div
          role="alert"
          className="flex items-center gap-2.5 rounded-xl border border-error bg-error-container/40 p-4 text-sm font-semibold text-error"
        >
          <AlertCircle size={20} className="shrink-0" />
          <span>{mensajeError}</span>
        </div>
      )}

      {/* Barra de Búsqueda, Filtro y Contador */}
      <div className="flex flex-col gap-3 rounded-xl border border-line bg-white p-4 shadow-[0px_2px_8px_rgba(0,5,141,0.04)] sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-outline" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => handleCambioBusqueda(e.target.value)}
            placeholder="Buscar barrio (ej: cañitas, güemes, villa belgrano)..."
            aria-label="Buscar barrios"
            className="min-h-[44px] w-full rounded-lg border border-field bg-white pl-10 pr-10 font-body-md text-sm text-ink focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/20"
          />
          {busqueda && (
            <button
              type="button"
              onClick={() => handleCambioBusqueda('')}
              aria-label="Limpiar búsqueda"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 flex min-h-[32px] min-w-[32px] items-center justify-center text-outline hover:text-ink"
            >
              <X size={16} />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 sm:justify-end">
          <span className="font-body-md text-sm text-ink-soft">
            <strong className="text-ink">{barriosFiltrados.length}</strong> {barriosFiltrados.length === 1 ? 'barrio' : 'barrios'}
          </span>

          <label className="flex min-h-[44px] cursor-pointer items-center gap-2.5 select-none font-body-md text-sm text-ink">
            <input
              type="checkbox"
              checked={mostrarInactivos}
              onChange={(e) => {
                setMostrarInactivos(e.target.checked)
                setPaginaActual(1)
              }}
              className="h-4 w-4 rounded border-field text-secondary focus:ring-secondary"
            />
            <span>Mostrar inactivos</span>
          </label>
        </div>
      </div>

      {/* Contenido: Tabla en desktop, Tarjetas en móvil */}
      <div className="overflow-hidden rounded-xl border border-line bg-white shadow-[0px_2px_8px_rgba(0,5,141,0.04)]">
        {barriosQuery.isLoading ? (
          <div className="p-12 text-center text-ink-soft">
            <Spinner />
            <p className="mt-2 text-sm">Cargando catálogo de barrios...</p>
          </div>
        ) : barriosQuery.isError ? (
          <div className="p-8 text-center text-error">
            <AlertCircle className="mx-auto h-8 w-8" />
            <p className="mt-2 font-body-md text-body-md font-semibold">
              Error al consultar los barrios.
            </p>
          </div>
        ) : barriosFiltrados.length === 0 ? (
          <div className="p-12 text-center text-ink-soft">
            <MapPin className="mx-auto h-12 w-12 text-outline/50" />
            <p className="mt-2 font-headline-sm text-headline-sm font-bold text-ink">
              No se encontraron barrios
            </p>
            <p className="mt-1 font-body-md text-sm">
              {busqueda
                ? 'No hay barrios que coincidan con la búsqueda.'
                : 'Creá el primer barrio usando el botón "Nuevo Barrio".'}
            </p>
          </div>
        ) : (
          <>
            {/* Tabla desktop */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-left font-body-md text-sm">
                <thead className="border-b border-line bg-panel font-label-md text-xs uppercase tracking-wider text-ink-soft">
                  <tr>
                    <th scope="col" className="px-6 py-3.5">
                      Nombre del Barrio
                    </th>
                    <th scope="col" className="px-6 py-3.5">
                      Coordenadas (Lat / Long)
                    </th>
                    <th scope="col" className="px-6 py-3.5 text-center">
                      Estado
                    </th>
                    <th scope="col" className="px-6 py-3.5 text-right">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {barriosPaginados.map((b) => {
                    const estaActivo = b.activo !== false

                    return (
                      <tr
                        key={b.id}
                        className={`transition-colors hover:bg-page/50 ${
                          !estaActivo ? 'bg-surface-container/30 text-ink-soft' : ''
                        }`}
                      >
                        <th
                          scope="row"
                          className="px-6 py-3.5 font-body-md-bold text-sm text-ink"
                        >
                          <div className="flex items-center gap-2">
                            <span className={!estaActivo ? 'text-ink-soft' : ''}>
                              {b.NombreBarrio}
                            </span>
                            {!estaActivo && (
                              <span className="rounded bg-line px-1.5 py-0.5 text-xs text-ink-soft">
                                Inactivo
                              </span>
                            )}
                          </div>
                        </th>
                        <td className="px-6 py-3.5 font-mono text-xs text-ink-soft">
                          {b.Lat && b.Long ? `${b.Lat}, ${b.Long}` : '—'}
                        </td>
                        <td className="px-6 py-3.5 text-center">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                              estaActivo
                                ? 'bg-secondary/15 text-secondary'
                                : 'bg-line text-ink-soft'
                            }`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${
                                estaActivo ? 'bg-secondary' : 'bg-outline'
                              }`}
                            />
                            {estaActivo ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>
                        <td className="px-6 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => handleAbrirEditar(b)}
                              aria-label={`Editar barrio ${b.NombreBarrio}`}
                              className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg px-2.5 py-1.5 font-label-md text-xs font-semibold text-secondary transition-colors hover:bg-secondary/10"
                            >
                              <Edit2 size={15} />
                              <span>Editar</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleAbrirEstado(b)}
                              aria-label={`${estaActivo ? 'Desactivar' : 'Activar'} barrio ${b.NombreBarrio}`}
                              className={`inline-flex min-h-[44px] items-center gap-1.5 rounded-lg px-2.5 py-1.5 font-label-md text-xs font-semibold transition-colors ${
                                estaActivo
                                  ? 'text-error hover:bg-error-container/20'
                                  : 'text-secondary hover:bg-secondary/10'
                              }`}
                            >
                              <Power size={15} />
                              <span>{estaActivo ? 'Desactivar' : 'Activar'}</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Tarjetas móvil (< md) */}
            <div className="divide-y divide-line md:hidden">
              {barriosPaginados.map((b) => {
                const estaActivo = b.activo !== false

                return (
                  <div
                    key={b.id}
                    className={`p-4 space-y-2.5 ${
                      !estaActivo ? 'bg-surface-container/30 text-ink-soft' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-body-md-bold text-base text-ink">
                          {b.NombreBarrio}
                        </h3>
                        <div className="mt-1 flex items-center gap-2">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
                              estaActivo
                                ? 'bg-secondary/15 text-secondary'
                                : 'bg-line text-ink-soft'
                            }`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${
                                estaActivo ? 'bg-secondary' : 'bg-outline'
                              }`}
                            />
                            {estaActivo ? 'Activo' : 'Inactivo'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {b.Lat && b.Long && (
                      <p className="font-mono text-xs text-ink-soft">
                        Coord: {b.Lat}, {b.Long}
                      </p>
                    )}

                    <div className="flex items-center justify-end gap-2 border-t border-line/60 pt-2">
                      <button
                        type="button"
                        onClick={() => handleAbrirEditar(b)}
                        aria-label={`Editar barrio ${b.NombreBarrio}`}
                        className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg border border-line px-3 py-2 font-label-md text-xs font-semibold text-secondary hover:bg-secondary/10"
                      >
                        <Edit2 size={16} />
                        <span>Editar</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleAbrirEstado(b)}
                        aria-label={`${estaActivo ? 'Desactivar' : 'Activar'} barrio ${b.NombreBarrio}`}
                        className={`inline-flex min-h-[44px] items-center gap-1.5 rounded-lg border border-line px-3 py-2 font-label-md text-xs font-semibold ${
                          estaActivo
                            ? 'text-error hover:bg-error-container/20'
                            : 'text-secondary hover:bg-secondary/10'
                        }`}
                      >
                        <Power size={16} />
                        <span>{estaActivo ? 'Desactivar' : 'Activar'}</span>
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Paginación */}
            {totalPaginas > 1 && (
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line bg-panel px-6 py-3 text-sm">
                <span className="font-body-md text-ink-soft">
                  Página <strong>{paginaAjustada}</strong> de <strong>{totalPaginas}</strong> ({barriosFiltrados.length} barrios)
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPaginaActual((p) => Math.max(1, p - 1))}
                    disabled={paginaAjustada <= 1}
                    aria-label="Página anterior de barrios"
                    className="inline-flex min-h-[44px] items-center gap-1 rounded-lg border border-line bg-white px-3 py-1.5 font-label-md text-xs font-semibold text-ink transition-colors hover:bg-page disabled:opacity-40"
                  >
                    <ChevronLeft size={16} />
                    <span>Anterior</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaginaActual((p) => Math.min(totalPaginas, p + 1))}
                    disabled={paginaAjustada >= totalPaginas}
                    aria-label="Página siguiente de barrios"
                    className="inline-flex min-h-[44px] items-center gap-1 rounded-lg border border-line bg-white px-3 py-1.5 font-label-md text-xs font-semibold text-ink transition-colors hover:bg-page disabled:opacity-40"
                  >
                    <span>Siguiente</span>
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal Editar / Crear Barrio */}
      <ModalEditarBarrio
        isOpen={modalEditarOpen}
        onClose={() => setModalEditarOpen(false)}
        barrio={barrioEditar}
        onGuardar={handleGuardarBarrio}
        barriosExistentes={todosBarrios}
      />

      {/* Modal Confirmar Estado Barrio */}
      <ModalConfirmarEstadoBarrio
        isOpen={modalEstadoOpen}
        onClose={() => setModalEstadoOpen(false)}
        barrio={barrioEstado}
        onConfirmar={handleConfirmarCambioEstado}
        cargando={confirmandoEstado}
      />
    </div>
  )
}
