import {
  AlertCircle,
  CheckCircle2,
  Edit2,
  Plus,
  Power,
  RefreshCw,
  Search,
  Truck,
  X,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import Spinner from '../Spinner'
import { ModalConfirmarEstadoVehiculo } from './ModalConfirmarEstadoVehiculo'
import { ModalEditarVehiculo } from './ModalEditarVehiculo'
import {
  useActualizarVehiculo,
  useCambiarEstadoVehiculo,
  useCrearVehiculo,
  useVehiculosAdmin,
} from '../../hooks/useVehiculos'
import { normalizar } from '../../lib/texto'
import type { Vehiculo } from '../../lib/types'

export default function PanelVehiculos() {
  const vehiculosQuery = useVehiculosAdmin()
  const crearMutation = useCrearVehiculo()
  const actualizarMutation = useActualizarVehiculo()
  const cambiarEstadoMutation = useCambiarEstadoVehiculo()

  // Filtros
  const [busqueda, setBusqueda] = useState('')
  const [mostrarInactivos, setMostrarInactivos] = useState(true)

  // Modales
  const [modalEditarOpen, setModalEditarOpen] = useState(false)
  const [vehiculoEditar, setVehiculoEditar] = useState<Vehiculo | null>(null)

  const [modalEstadoOpen, setModalEstadoOpen] = useState(false)
  const [vehiculoEstado, setVehiculoEstado] = useState<Vehiculo | null>(null)
  const [confirmandoEstado, setConfirmandoEstado] = useState(false)

  // Feedback
  const [mensajeExito, setMensajeExito] = useState<string | null>(null)
  const [mensajeError, setMensajeError] = useState<string | null>(null)

  const todosVehiculos = vehiculosQuery.data ?? []

  // Filtrado
  const vehiculosFiltrados = useMemo(() => {
    const qNorm = normalizar(busqueda)
    const palabras = qNorm.split(/\s+/).filter(Boolean)

    return todosVehiculos.filter((v) => {
      if (!mostrarInactivos && !v.estado) return false
      if (palabras.length === 0) return true

      const nomNorm = normalizar(v.Nombre ?? '')
      const tipoNorm = normalizar(v.tipoVehiculo ?? '')
      const patNorm = normalizar(v.patente ?? '')
      const textoCompleto = `${nomNorm} ${tipoNorm} ${patNorm}`

      return palabras.every((p) => textoCompleto.includes(p))
    })
  }, [todosVehiculos, busqueda, mostrarInactivos])

  function handleAbrirCrear() {
    setVehiculoEditar(null)
    setMensajeExito(null)
    setMensajeError(null)
    setModalEditarOpen(true)
  }

  function handleAbrirEditar(v: Vehiculo) {
    setVehiculoEditar(v)
    setMensajeExito(null)
    setMensajeError(null)
    setModalEditarOpen(true)
  }

  function handleAbrirEstado(v: Vehiculo) {
    setVehiculoEstado(v)
    setMensajeExito(null)
    setMensajeError(null)
    setModalEstadoOpen(true)
  }

  async function handleGuardarVehiculo(datos: {
    nombre: string
    tipoVehiculo?: string | null
    patente?: string | null
  }) {
    setMensajeExito(null)
    setMensajeError(null)
    if (vehiculoEditar) {
      await actualizarMutation.mutateAsync({
        id: vehiculoEditar.idVehiculo,
        ...datos,
      })
      setMensajeExito(`Vehículo "${datos.nombre}" actualizado con éxito.`)
    } else {
      await crearMutation.mutateAsync(datos)
      setMensajeExito(`Vehículo "${datos.nombre}" creado con éxito.`)
    }
  }

  async function handleConfirmarCambioEstado() {
    if (!vehiculoEstado) return
    setConfirmandoEstado(true)
    setMensajeExito(null)
    setMensajeError(null)
    try {
      const nuevoEstado = !vehiculoEstado.estado
      await cambiarEstadoMutation.mutateAsync({
        id: vehiculoEstado.idVehiculo,
        estado: nuevoEstado,
      })
      setMensajeExito(
        nuevoEstado
          ? `Vehículo "${vehiculoEstado.Nombre}" activado correctamente.`
          : `Vehículo "${vehiculoEstado.Nombre}" desactivado correctamente.`,
      )
      setModalEstadoOpen(false)
      setVehiculoEstado(null)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al cambiar estado del vehículo.'
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
            <Truck size={22} />
            <h2 className="font-headline-sm text-lg font-bold text-ink">
              Catálogo de Vehículos
            </h2>
          </div>
          <p className="mt-1 font-body-md text-sm text-ink-soft">
            Administrá la flota de vehículos disponibles para las entregas y repartos.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleAbrirCrear}
            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg bg-primary-container px-4 py-2 font-label-md text-sm font-bold text-white shadow-xs transition-all hover:bg-primary-container/90 active:scale-[0.98]"
          >
            <Plus size={18} />
            <span>Nuevo Vehículo</span>
          </button>

          <button
            type="button"
            onClick={() => void vehiculosQuery.refetch()}
            title="Actualizar listado"
            aria-label="Actualizar listado de vehículos"
            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center gap-1.5 rounded-lg border border-line bg-panel px-3 py-1.5 font-label-md text-label-md text-ink transition-colors hover:bg-page"
          >
            <RefreshCw
              size={16}
              className={`text-secondary ${vehiculosQuery.isFetching ? 'animate-spin' : ''}`}
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
            placeholder="Buscar por nombre, tipo o patente (ej: Camión 1)..."
            aria-label="Buscar vehículos"
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

        <div className="flex flex-wrap items-center justify-between gap-4 sm:justify-end">
          <span className="font-body-md text-sm text-ink-soft">
            <strong className="text-ink">{vehiculosFiltrados.length}</strong> {vehiculosFiltrados.length === 1 ? 'vehículo' : 'vehículos'}
          </span>

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
      </div>

      {/* Contenido: Tabla en desktop, Tarjetas en móvil */}
      <div className="overflow-hidden rounded-xl border border-line bg-white shadow-[0px_2px_8px_rgba(0,5,141,0.04)]">
        {vehiculosQuery.isLoading ? (
          <div className="p-12 text-center text-ink-soft">
            <Spinner />
            <p className="mt-2 text-sm">Cargando vehículos...</p>
          </div>
        ) : vehiculosQuery.isError ? (
          <div className="p-8 text-center text-error">
            <AlertCircle className="mx-auto h-8 w-8" />
            <p className="mt-2 font-body-md text-body-md font-semibold">
              Error al consultar los vehículos.
            </p>
          </div>
        ) : todosVehiculos.length === 0 ? (
          <div className="p-12 text-center text-ink-soft">
            <Truck className="mx-auto h-12 w-12 text-outline/50" />
            <p className="mt-2 font-headline-sm text-headline-sm font-bold text-ink">
              Todavía no hay vehículos cargados
            </p>
            <p className="mt-1 font-body-md text-sm">
              Creá el primer vehículo para la asignación de entregas usando el botón &quot;Nuevo Vehículo&quot;.
            </p>
          </div>
        ) : vehiculosFiltrados.length === 0 ? (
          <div className="p-12 text-center text-ink-soft">
            <Search className="mx-auto h-12 w-12 text-outline/50" />
            <p className="mt-2 font-headline-sm text-headline-sm font-bold text-ink">
              No se encontraron vehículos
            </p>
            <p className="mt-1 font-body-md text-sm">
              Probá modificando los términos de búsqueda o activando &quot;Mostrar inactivos&quot;.
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
                      Nombre / Identificación
                    </th>
                    <th scope="col" className="px-6 py-3.5">
                      Tipo de Vehículo
                    </th>
                    <th scope="col" className="px-6 py-3.5">
                      Patente
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
                  {vehiculosFiltrados.map((v) => (
                    <tr
                      key={v.idVehiculo}
                      className={`transition-colors hover:bg-page/50 ${
                        !v.estado ? 'bg-surface-container/30 text-ink-soft' : ''
                      }`}
                    >
                      <th
                        scope="row"
                        className="px-6 py-4 font-body-md-bold text-sm text-ink"
                      >
                        <div className="flex items-center gap-2">
                          <span className={!v.estado ? 'text-ink-soft' : ''}>
                            {v.Nombre}
                          </span>
                          {!v.estado && (
                            <span className="rounded bg-line px-1.5 py-0.5 text-xs text-ink-soft">
                              Inactivo
                            </span>
                          )}
                        </div>
                      </th>
                      <td className="px-6 py-4 text-ink-soft">
                        {v.tipoVehiculo || '—'}
                      </td>
                      <td className="px-6 py-4 font-mono text-xs uppercase text-ink-soft">
                        {v.patente || '—'}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                            v.estado
                              ? 'bg-secondary/15 text-secondary'
                              : 'bg-line text-ink-soft'
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              v.estado ? 'bg-secondary' : 'bg-outline'
                            }`}
                          />
                          {v.estado ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleAbrirEditar(v)}
                            aria-label={`Editar vehículo ${v.Nombre}`}
                            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg px-2.5 py-1.5 font-label-md text-xs font-semibold text-secondary transition-colors hover:bg-secondary/10"
                          >
                            <Edit2 size={15} />
                            <span>Editar</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleAbrirEstado(v)}
                            aria-label={`${v.estado ? 'Desactivar' : 'Activar'} vehículo ${v.Nombre}`}
                            className={`inline-flex min-h-[44px] items-center gap-1.5 rounded-lg px-2.5 py-1.5 font-label-md text-xs font-semibold transition-colors ${
                              v.estado
                                ? 'text-error hover:bg-error-container/20'
                                : 'text-secondary hover:bg-secondary/10'
                            }`}
                          >
                            <Power size={15} />
                            <span>{v.estado ? 'Desactivar' : 'Activar'}</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Tarjetas móvil (< md) */}
            <div className="divide-y divide-line md:hidden">
              {vehiculosFiltrados.map((v) => (
                <div
                  key={v.idVehiculo}
                  className={`p-4 space-y-2.5 ${
                    !v.estado ? 'bg-surface-container/30 text-ink-soft' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-body-md-bold text-base text-ink">
                        {v.Nombre}
                      </h3>
                      <div className="mt-1 flex items-center gap-2">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
                            v.estado
                              ? 'bg-secondary/15 text-secondary'
                              : 'bg-line text-ink-soft'
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              v.estado ? 'bg-secondary' : 'bg-outline'
                            }`}
                          />
                          {v.estado ? 'Activo' : 'Inactivo'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {(v.tipoVehiculo || v.patente) && (
                    <div className="flex flex-wrap gap-x-4 gap-y-1 font-body-md text-xs text-ink-soft">
                      {v.tipoVehiculo && (
                        <span>
                          Tipo: <strong className="text-ink">{v.tipoVehiculo}</strong>
                        </span>
                      )}
                      {v.patente && (
                        <span>
                          Patente: <strong className="font-mono text-ink uppercase">{v.patente}</strong>
                        </span>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-2 border-t border-line/60 pt-2">
                    <button
                      type="button"
                      onClick={() => handleAbrirEditar(v)}
                      aria-label={`Editar vehículo ${v.Nombre}`}
                      className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg border border-line px-3 py-2 font-label-md text-xs font-semibold text-secondary hover:bg-secondary/10"
                    >
                      <Edit2 size={16} />
                      <span>Editar</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleAbrirEstado(v)}
                      aria-label={`${v.estado ? 'Desactivar' : 'Activar'} vehículo ${v.Nombre}`}
                      className={`inline-flex min-h-[44px] items-center gap-1.5 rounded-lg border border-line px-3 py-2 font-label-md text-xs font-semibold ${
                        v.estado
                          ? 'text-error hover:bg-error-container/20'
                          : 'text-secondary hover:bg-secondary/10'
                      }`}
                    >
                      <Power size={16} />
                      <span>{v.estado ? 'Desactivar' : 'Activar'}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Modal Editar / Crear Vehículo */}
      <ModalEditarVehiculo
        isOpen={modalEditarOpen}
        onClose={() => setModalEditarOpen(false)}
        vehiculo={vehiculoEditar}
        onGuardar={handleGuardarVehiculo}
        vehiculosExistentes={todosVehiculos}
      />

      {/* Modal Confirmar Estado Vehículo */}
      <ModalConfirmarEstadoVehiculo
        isOpen={modalEstadoOpen}
        onClose={() => setModalEstadoOpen(false)}
        vehiculo={vehiculoEstado}
        onConfirmar={handleConfirmarCambioEstado}
        cargando={confirmandoEstado}
      />
    </div>
  )
}
