import {
  AlertCircle,
  CheckCircle2,
  Edit2,
  Package,
  Plus,
  Power,
  RefreshCw,
  Search,
  X,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import Spinner from '../Spinner'
import { ModalEditarProducto } from './ModalEditarProducto'
import { ModalConfirmarEstadoProducto } from './ModalConfirmarEstadoProducto'
import {
  useActualizarProducto,
  useCambiarEstadoProducto,
  useCrearProducto,
  useProductosAdmin,
} from '../../hooks/useProductos'
import { normalizar } from '../../lib/texto'
import type { Producto } from '../../lib/types'

export default function PanelProductos() {
  const productosQuery = useProductosAdmin()
  const crearMutation = useCrearProducto()
  const actualizarMutation = useActualizarProducto()
  const cambiarEstadoMutation = useCambiarEstadoProducto()

  // Filtros
  const [busqueda, setBusqueda] = useState('')
  const [mostrarInactivos, setMostrarInactivos] = useState(true)

  // Modales
  const [modalEditarOpen, setModalEditarOpen] = useState(false)
  const [productoEditar, setProductoEditar] = useState<Producto | null>(null)

  const [modalEstadoOpen, setModalEstadoOpen] = useState(false)
  const [productoEstado, setProductoEstado] = useState<Producto | null>(null)
  const [confirmandoEstado, setConfirmandoEstado] = useState(false)

  // Feedback
  const [mensajeExito, setMensajeExito] = useState<string | null>(null)
  const [mensajeError, setMensajeError] = useState<string | null>(null)

  const todosProductos = productosQuery.data ?? []

  // Lista de rubros existentes únicos
  const rubrosExistentes = useMemo(() => {
    const set = new Set<string>()
    todosProductos.forEach((p) => {
      if (p.rubro?.trim()) set.add(p.rubro.trim())
    })
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'es'))
  }, [todosProductos])

  // Filtrado de productos
  const productosFiltrados = useMemo(() => {
    const qNorm = normalizar(busqueda)
    const palabras = qNorm.split(/\s+/).filter(Boolean)

    return todosProductos.filter((p) => {
      if (!mostrarInactivos && !p.estado) return false
      if (palabras.length === 0) return true

      const rubroNorm = normalizar(p.rubro ?? '')
      const necNorm = normalizar(p.necesidad ?? '')
      const textoCompleto = `${rubroNorm} ${necNorm}`

      return palabras.every((palabra) => textoCompleto.includes(palabra))
    })
  }, [todosProductos, busqueda, mostrarInactivos])

  // Agrupamiento por Rubro
  const gruposRubro = useMemo(() => {
    const mapa = new Map<string, Producto[]>()
    productosFiltrados.forEach((p) => {
      const r = p.rubro?.trim() || 'Sin Rubro'
      const arr = mapa.get(r) ?? []
      arr.push(p)
      mapa.set(r, arr)
    })

    // Ordenar grupos alfabéticamente
    const resultado: Array<{ rubro: string; productos: Producto[] }> = []
    Array.from(mapa.keys())
      .sort((a, b) => a.localeCompare(b, 'es'))
      .forEach((rubro) => {
        // En cada rubro: activos primero, luego por necesidad
        const prods = (mapa.get(rubro) ?? []).sort((a, b) => {
          if (a.estado && !b.estado) return -1
          if (!a.estado && b.estado) return 1
          return (a.necesidad ?? '').localeCompare(b.necesidad ?? '', 'es')
        })
        resultado.push({ rubro, productos: prods })
      })

    return resultado
  }, [productosFiltrados])

  function handleAbrirCrear() {
    setProductoEditar(null)
    setMensajeExito(null)
    setMensajeError(null)
    setModalEditarOpen(true)
  }

  function handleAbrirEditar(p: Producto) {
    setProductoEditar(p)
    setMensajeExito(null)
    setMensajeError(null)
    setModalEditarOpen(true)
  }

  function handleAbrirEstado(p: Producto) {
    setProductoEstado(p)
    setMensajeExito(null)
    setMensajeError(null)
    setModalEstadoOpen(true)
  }

  async function handleGuardarProducto(rubro: string, necesidad: string) {
    setMensajeExito(null)
    setMensajeError(null)
    if (productoEditar) {
      await actualizarMutation.mutateAsync({
        id: productoEditar.id,
        rubro,
        necesidad,
      })
      setMensajeExito(`Producto "${necesidad}" actualizado con éxito.`)
    } else {
      await crearMutation.mutateAsync({ rubro, necesidad })
      setMensajeExito(`Producto "${necesidad}" creado en rubro "${rubro}" con éxito.`)
    }
  }

  async function handleConfirmarCambioEstado() {
    if (!productoEstado) return
    setConfirmandoEstado(true)
    setMensajeExito(null)
    setMensajeError(null)
    try {
      const nuevoEstado = !productoEstado.estado
      await cambiarEstadoMutation.mutateAsync({
        id: productoEstado.id,
        estado: nuevoEstado,
      })
      setMensajeExito(
        nuevoEstado
          ? `Producto "${productoEstado.necesidad}" activado correctamente.`
          : `Producto "${productoEstado.necesidad}" desactivado correctamente.`,
      )
      setModalEstadoOpen(false)
      setProductoEstado(null)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al cambiar estado del producto.'
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
            <Package size={22} />
            <h2 className="font-headline-sm text-lg font-bold text-ink">
              Catálogo de Productos y Necesidades
            </h2>
          </div>
          <p className="mt-1 font-body-md text-sm text-ink-soft">
            Administrá los rubros y artículos disponibles para las solicitudes de emergencia.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleAbrirCrear}
            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg bg-primary-container px-4 py-2 font-label-md text-sm font-bold text-white shadow-xs transition-all hover:bg-primary-container/90 active:scale-[0.98]"
          >
            <Plus size={18} />
            <span>Nuevo Producto</span>
          </button>

          <button
            type="button"
            onClick={() => void productosQuery.refetch()}
            title="Actualizar listado"
            aria-label="Actualizar listado de productos"
            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center gap-1.5 rounded-lg border border-line bg-panel px-3 py-1.5 font-label-md text-label-md text-ink transition-colors hover:bg-page"
          >
            <RefreshCw
              size={16}
              className={`text-secondary ${productosQuery.isFetching ? 'animate-spin' : ''}`}
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

      {/* Filtros: Búsqueda y Mostrar inactivos */}
      <div className="flex flex-col gap-3 rounded-xl border border-line bg-white p-4 shadow-[0px_2px_8px_rgba(0,5,141,0.04)] sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-outline" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por rubro o necesidad (ej: frazada, alimento)..."
            aria-label="Buscar productos por rubro o necesidad"
            className="min-h-[44px] w-full rounded-lg border border-field bg-white pl-10 pr-10 font-body-md text-sm text-ink focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/20"
          />
          {busqueda && (
            <button
              type="button"
              onClick={() => setBusqueda('')}
              aria-label="Limpiar búsqueda"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 flex min-h-[32px] min-w-[32px] items-center justify-center text-outline hover:text-ink"
            >
              <X size={16} />
            </button>
          )}
        </div>

        <label className="flex min-h-[44px] cursor-pointer items-center gap-2.5 select-none font-body-md text-sm text-ink">
          <input
            type="checkbox"
            checked={mostrarInactivos}
            onChange={(e) => setMostrarInactivos(e.target.checked)}
            className="h-4 w-4 rounded border-field text-secondary focus:ring-secondary"
          />
          <span>Mostrar inactivos</span>
        </label>
      </div>

      {/* Contenido: Secciones agrupadas por Rubro */}
      {productosQuery.isLoading ? (
        <div className="rounded-xl border border-line bg-white p-12 text-center text-ink-soft">
          <Spinner />
          <p className="mt-2 text-sm">Cargando productos...</p>
        </div>
      ) : productosQuery.isError ? (
        <div className="rounded-xl border border-line bg-white p-8 text-center text-error">
          <AlertCircle className="mx-auto h-8 w-8" />
          <p className="mt-2 font-body-md text-body-md font-semibold">
            Error al consultar los productos.
          </p>
        </div>
      ) : gruposRubro.length === 0 ? (
        <div className="rounded-xl border border-line bg-white p-12 text-center text-ink-soft">
          <Package className="mx-auto h-12 w-12 text-outline/50" />
          <p className="mt-2 font-headline-sm text-headline-sm font-bold text-ink">
            No se encontraron productos
          </p>
          <p className="mt-1 font-body-md text-sm">
            {busqueda
              ? 'Probá modificando los términos de búsqueda.'
              : 'Creá el primer producto usando el botón "Nuevo Producto".'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {gruposRubro.map(({ rubro, productos }) => (
            <div
              key={rubro}
              className="overflow-hidden rounded-xl border border-line bg-white shadow-[0px_2px_8px_rgba(0,5,141,0.04)]"
            >
              {/* Encabezado del Rubro */}
              <div className="flex items-center justify-between border-b border-line bg-panel px-6 py-3.5">
                <div className="flex items-center gap-2">
                  <h3 className="font-body-md-bold text-base text-ink">
                    {rubro}
                  </h3>
                  <span className="rounded-full bg-surface-container px-2.5 py-0.5 text-xs font-semibold text-secondary">
                    {productos.length} {productos.length === 1 ? 'ítem' : 'ítems'}
                  </span>
                </div>
              </div>

              {/* Lista desktop en tabla */}
              <div className="hidden md:block">
                <table className="w-full text-left font-body-md text-sm">
                  <tbody className="divide-y divide-line">
                    {productos.map((p) => (
                      <tr
                        key={p.id}
                        className={`transition-colors hover:bg-page/50 ${
                          !p.estado ? 'bg-surface-container/30 text-ink-soft' : ''
                        }`}
                      >
                        <td className="px-6 py-3.5 font-body-md-bold text-sm text-ink">
                          <div className="flex items-center gap-2">
                            <span className={!p.estado ? 'text-ink-soft' : ''}>
                              {p.necesidad}
                            </span>
                            {!p.estado && (
                              <span className="rounded bg-line px-1.5 py-0.5 text-xs text-ink-soft">
                                Inactivo
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="w-32 px-6 py-3.5 text-center">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                              p.estado
                                ? 'bg-secondary/15 text-secondary'
                                : 'bg-line text-ink-soft'
                            }`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${
                                p.estado ? 'bg-secondary' : 'bg-outline'
                              }`}
                            />
                            {p.estado ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>
                        <td className="w-48 px-6 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => handleAbrirEditar(p)}
                              aria-label={`Editar producto ${p.necesidad}`}
                              className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg px-2.5 py-1.5 font-label-md text-xs font-semibold text-secondary transition-colors hover:bg-secondary/10"
                            >
                              <Edit2 size={15} />
                              <span>Editar</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleAbrirEstado(p)}
                              aria-label={`${p.estado ? 'Desactivar' : 'Activar'} producto ${p.necesidad}`}
                              className={`inline-flex min-h-[44px] items-center gap-1.5 rounded-lg px-2.5 py-1.5 font-label-md text-xs font-semibold transition-colors ${
                                p.estado
                                  ? 'text-error hover:bg-error-container/20'
                                  : 'text-secondary hover:bg-secondary/10'
                              }`}
                            >
                              <Power size={15} />
                              <span>{p.estado ? 'Desactivar' : 'Activar'}</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Lista celular (< md) */}
              <div className="divide-y divide-line md:hidden">
                {productos.map((p) => (
                  <div
                    key={p.id}
                    className={`p-4 space-y-2.5 ${
                      !p.estado ? 'bg-surface-container/30 text-ink-soft' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-body-md-bold text-base text-ink">
                          {p.necesidad}
                        </p>
                        <div className="mt-1">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
                              p.estado
                                ? 'bg-secondary/15 text-secondary'
                                : 'bg-line text-ink-soft'
                            }`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${
                                p.estado ? 'bg-secondary' : 'bg-outline'
                              }`}
                            />
                            {p.estado ? 'Activo' : 'Inactivo'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 border-t border-line/60 pt-2">
                      <button
                        type="button"
                        onClick={() => handleAbrirEditar(p)}
                        aria-label={`Editar producto ${p.necesidad}`}
                        className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg border border-line px-3 py-2 font-label-md text-xs font-semibold text-secondary hover:bg-secondary/10"
                      >
                        <Edit2 size={16} />
                        <span>Editar</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleAbrirEstado(p)}
                        aria-label={`${p.estado ? 'Desactivar' : 'Activar'} producto ${p.necesidad}`}
                        className={`inline-flex min-h-[44px] items-center gap-1.5 rounded-lg border border-line px-3 py-2 font-label-md text-xs font-semibold ${
                          p.estado
                            ? 'text-error hover:bg-error-container/20'
                            : 'text-secondary hover:bg-secondary/10'
                        }`}
                      >
                        <Power size={16} />
                        <span>{p.estado ? 'Desactivar' : 'Activar'}</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Editar / Crear Producto */}
      <ModalEditarProducto
        isOpen={modalEditarOpen}
        onClose={() => setModalEditarOpen(false)}
        producto={productoEditar}
        rubrosExistentes={rubrosExistentes}
        onGuardar={handleGuardarProducto}
        productosExistentes={todosProductos}
      />

      {/* Modal Confirmar Estado */}
      <ModalConfirmarEstadoProducto
        isOpen={modalEstadoOpen}
        onClose={() => setModalEstadoOpen(false)}
        producto={productoEstado}
        onConfirmar={handleConfirmarCambioEstado}
        cargando={confirmandoEstado}
      />
    </div>
  )
}
