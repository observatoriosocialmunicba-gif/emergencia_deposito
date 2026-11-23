import {
  AlertCircle,
  Building2,
  CheckCircle2,
  Edit2,
  Package,
  Plus,
  Power,
  RefreshCw,
  Users,
} from 'lucide-react'
import { useState } from 'react'
import Spinner from '../Spinner'
import {
  ModalConfirmarEstadoArea,
  ModalEditarArea,
} from '../areas'
import {
  useAreasAdmin,
  useCambiarEstadoArea,
  useCrearArea,
  useRenombrarArea,
} from '../../hooks/useAreas'
import type { Area, AreaConConteo } from '../../lib/types'

export default function PanelAreas() {
  const areasQuery = useAreasAdmin()
  const crearMutation = useCrearArea()
  const renombrarMutation = useRenombrarArea()
  const cambiarEstadoMutation = useCambiarEstadoArea()

  // Modales
  const [modalEditarOpen, setModalEditarOpen] = useState(false)
  const [areaEditar, setAreaEditar] = useState<Area | null>(null)

  const [modalEstadoOpen, setModalEstadoOpen] = useState(false)
  const [areaEstado, setAreaEstado] = useState<AreaConConteo | null>(null)
  const [confirmandoEstado, setConfirmandoEstado] = useState(false)

  // Feedback de éxito y error
  const [mensajeExito, setMensajeExito] = useState<string | null>(null)
  const [mensajeError, setMensajeError] = useState<string | null>(null)

  const areas = areasQuery.data ?? []

  function handleAbrirCrear() {
    setAreaEditar(null)
    setMensajeExito(null)
    setMensajeError(null)
    setModalEditarOpen(true)
  }

  function handleAbrirEditar(a: AreaConConteo) {
    setAreaEditar(a)
    setMensajeExito(null)
    setMensajeError(null)
    setModalEditarOpen(true)
  }

  function handleAbrirEstado(a: AreaConConteo) {
    setAreaEstado(a)
    setMensajeExito(null)
    setMensajeError(null)
    setModalEstadoOpen(true)
  }

  async function handleGuardarArea(nombre: string) {
    setMensajeExito(null)
    setMensajeError(null)
    if (areaEditar) {
      await renombrarMutation.mutateAsync({ id: areaEditar.id, nombre })
      setMensajeExito(`Área renombrada a "${nombre}" con éxito.`)
    } else {
      await crearMutation.mutateAsync(nombre)
      setMensajeExito(`Área "${nombre}" creada con éxito.`)
    }
  }

  async function handleConfirmarCambioEstado() {
    if (!areaEstado) return
    setConfirmandoEstado(true)
    setMensajeExito(null)
    setMensajeError(null)
    try {
      const nuevoEstado = !areaEstado.activa
      await cambiarEstadoMutation.mutateAsync({
        id: areaEstado.id,
        activa: nuevoEstado,
      })
      setMensajeExito(
        nuevoEstado
          ? `Área "${areaEstado.nombre}" activada correctamente.`
          : `Área "${areaEstado.nombre}" desactivada correctamente.`,
      )
      setModalEstadoOpen(false)
      setAreaEstado(null)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al cambiar el estado del área.'
      setMensajeError(msg)
    } finally {
      setConfirmandoEstado(false)
    }
  }

  return (
    <div className="space-y-space-lg">
      {/* Cabecera del panel */}
      <div className="flex flex-col justify-between gap-4 rounded-xl border border-line bg-white p-space-lg shadow-[0px_2px_8px_rgba(0,5,141,0.04)] sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2 text-primary">
            <Building2 size={22} />
            <h2 className="font-headline-sm text-lg font-bold text-ink">
              Áreas y Dependencias
            </h2>
          </div>
          <p className="mt-1 font-body-md text-sm text-ink-soft">
            Administrá las dependencias y secretarías municipales habilitadas en el sistema.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleAbrirCrear}
            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg bg-primary-container px-4 py-2 font-label-md text-sm font-bold text-white shadow-xs transition-all hover:bg-primary-container/90 active:scale-[0.98]"
          >
            <Plus size={18} />
            <span>Nueva Área</span>
          </button>

          <button
            type="button"
            onClick={() => void areasQuery.refetch()}
            title="Actualizar listado"
            aria-label="Actualizar listado de áreas"
            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center gap-1.5 rounded-lg border border-line bg-panel px-3 py-1.5 font-label-md text-label-md text-ink transition-colors hover:bg-page"
          >
            <RefreshCw
              size={16}
              className={`text-secondary ${areasQuery.isFetching ? 'animate-spin' : ''}`}
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

      {/* Contenido: Tabla en escritorio, Tarjetas en móvil */}
      <div className="overflow-hidden rounded-xl border border-line bg-white shadow-[0px_2px_8px_rgba(0,5,141,0.04)]">
        {areasQuery.isLoading ? (
          <div className="p-12 text-center text-ink-soft">
            <Spinner />
            <p className="mt-2 text-sm">Cargando áreas...</p>
          </div>
        ) : areasQuery.isError ? (
          <div className="p-8 text-center text-error">
            <AlertCircle className="mx-auto h-8 w-8" />
            <p className="mt-2 font-body-md text-body-md font-semibold">
              Error al consultar las áreas.
            </p>
          </div>
        ) : areas.length === 0 ? (
          <div className="p-12 text-center text-ink-soft">
            <Building2 className="mx-auto h-12 w-12 text-outline/50" />
            <p className="mt-2 font-headline-sm text-headline-sm font-bold text-ink">
              No hay áreas registradas
            </p>
            <p className="mt-1 font-body-md text-sm">
              Creá la primera área municipal usando el botón &quot;Nueva Área&quot;.
            </p>
          </div>
        ) : (
          <>
            {/* Tabla para desktop */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-left font-body-md text-sm">
                <thead className="border-b border-line bg-panel font-label-md text-xs uppercase tracking-wider text-ink-soft">
                  <tr>
                    <th scope="col" className="px-6 py-3.5">
                      Nombre del Área
                    </th>
                    <th scope="col" className="px-6 py-3.5 text-center">
                      Estado
                    </th>
                    <th scope="col" className="px-6 py-3.5 text-center">
                      Usuarios
                    </th>
                    <th scope="col" className="px-6 py-3.5 text-center">
                      Pedidos
                    </th>
                    <th scope="col" className="px-6 py-3.5 text-right">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {areas.map((a) => {
                    const tieneSolicitantes = a.solicitantesActivosCount > 0
                    const deshabilitarDesactivar = a.activa && tieneSolicitantes

                    return (
                      <tr
                        key={a.id}
                        className={`transition-colors hover:bg-page/50 ${
                          !a.activa ? 'bg-surface-container/30 text-ink-soft' : ''
                        }`}
                      >
                        <th
                          scope="row"
                          className="px-6 py-4 font-body-md-bold text-sm text-ink"
                        >
                          <div className="flex items-center gap-2">
                            <span className={!a.activa ? 'text-ink-soft' : ''}>
                              {a.nombre}
                            </span>
                            {!a.activa && (
                              <span className="rounded bg-line px-1.5 py-0.5 text-xs text-ink-soft">
                                Inactiva
                              </span>
                            )}
                          </div>
                        </th>
                        <td className="px-6 py-4 text-center">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                              a.activa
                                ? 'bg-secondary/15 text-secondary'
                                : 'bg-line text-ink-soft'
                            }`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${
                                a.activa ? 'bg-secondary' : 'bg-outline'
                              }`}
                            />
                            {a.activa ? 'Activa' : 'Inactiva'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="inline-flex items-center gap-1.5 font-body-md text-sm">
                            <Users size={16} className="text-outline" />
                            <span>{a.usuariosCount}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="inline-flex items-center gap-1.5 font-body-md text-sm">
                            <Package size={16} className="text-outline" />
                            <span>{a.pedidosCount}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => handleAbrirEditar(a)}
                              aria-label={`Editar área ${a.nombre}`}
                              className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg px-3 py-1.5 font-label-md text-xs font-semibold text-secondary transition-colors hover:bg-secondary/10"
                            >
                              <Edit2 size={15} />
                              <span>Editar</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleAbrirEstado(a)}
                              disabled={deshabilitarDesactivar}
                              title={
                                deshabilitarDesactivar
                                  ? `Reasigná primero a sus ${a.solicitantesActivosCount} solicitantes`
                                  : a.activa
                                    ? 'Desactivar área'
                                    : 'Activar área'
                              }
                              aria-label={
                                deshabilitarDesactivar
                                  ? `Reasigná primero a sus ${a.solicitantesActivosCount} solicitantes`
                                  : `${a.activa ? 'Desactivar' : 'Activar'} área ${a.nombre}`
                              }
                              className={`inline-flex min-h-[44px] items-center gap-1.5 rounded-lg px-3 py-1.5 font-label-md text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                                a.activa
                                  ? 'text-error hover:bg-error-container/20'
                                  : 'text-secondary hover:bg-secondary/10'
                              }`}
                            >
                              <Power size={15} />
                              <span>
                                {deshabilitarDesactivar
                                  ? `Reasigná primero a sus ${a.solicitantesActivosCount} solicitantes`
                                  : a.activa
                                    ? 'Desactivar'
                                    : 'Activar'}
                              </span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Tarjetas para celular y tablet (< md) */}
            <div className="divide-y divide-line md:hidden">
              {areas.map((a) => {
                const tieneSolicitantes = a.solicitantesActivosCount > 0
                const deshabilitarDesactivar = a.activa && tieneSolicitantes

                return (
                  <div
                    key={a.id}
                    className={`p-4 space-y-3 ${
                      !a.activa ? 'bg-surface-container/30 text-ink-soft' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-body-md-bold text-base text-ink">
                          {a.nombre}
                        </h3>
                        <div className="mt-1 flex items-center gap-2">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
                              a.activa
                                ? 'bg-secondary/15 text-secondary'
                                : 'bg-line text-ink-soft'
                            }`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${
                                a.activa ? 'bg-secondary' : 'bg-outline'
                              }`}
                            />
                            {a.activa ? 'Activa' : 'Inactiva'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 rounded-lg bg-panel p-2.5 text-xs">
                      <div>
                        <span className="font-label-sm text-ink-soft">Usuarios vinculados:</span>
                        <p className="mt-0.5 font-body-md-bold text-sm text-ink">
                          {a.usuariosCount}
                          {a.solicitantesActivosCount > 0 && (
                            <span className="ml-1 text-xs font-normal text-secondary">
                              ({a.solicitantesActivosCount} solicitantes)
                            </span>
                          )}
                        </p>
                      </div>
                      <div>
                        <span className="font-label-sm text-ink-soft">Pedidos asociados:</span>
                        <p className="mt-0.5 font-body-md-bold text-sm text-ink">
                          {a.pedidosCount}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-end gap-2 border-t border-line/60 pt-2">
                      <button
                        type="button"
                        onClick={() => handleAbrirEditar(a)}
                        aria-label={`Editar área ${a.nombre}`}
                        className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg border border-line px-3 py-2 font-label-md text-xs font-semibold text-secondary hover:bg-secondary/10"
                      >
                        <Edit2 size={16} />
                        <span>Editar</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleAbrirEstado(a)}
                        disabled={deshabilitarDesactivar}
                        title={
                          deshabilitarDesactivar
                            ? `Reasigná primero a sus ${a.solicitantesActivosCount} solicitantes`
                            : a.activa
                              ? 'Desactivar área'
                              : 'Activar área'
                        }
                        aria-label={
                          deshabilitarDesactivar
                            ? `Reasigná primero a sus ${a.solicitantesActivosCount} solicitantes`
                            : `${a.activa ? 'Desactivar' : 'Activar'} área ${a.nombre}`
                        }
                        className={`inline-flex min-h-[44px] items-center gap-1.5 rounded-lg border border-line px-3 py-2 font-label-md text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-50 ${
                          a.activa
                            ? 'text-error hover:bg-error-container/20'
                            : 'text-secondary hover:bg-secondary/10'
                        }`}
                      >
                        <Power size={16} />
                        <span>
                          {deshabilitarDesactivar
                            ? `Reasigná a ${a.solicitantesActivosCount} solicitantes`
                            : a.activa
                              ? 'Desactivar'
                              : 'Activar'}
                        </span>
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>

      {/* Modal para Crear y Editar Área */}
      <ModalEditarArea
        isOpen={modalEditarOpen}
        onCerrar={() => setModalEditarOpen(false)}
        area={areaEditar}
        onGuardar={handleGuardarArea}
        areasExistentes={areas}
      />

      {/* Modal para Confirmar Cambio de Estado */}
      <ModalConfirmarEstadoArea
        isOpen={modalEstadoOpen}
        onCerrar={() => setModalEstadoOpen(false)}
        area={areaEstado}
        onConfirmar={handleConfirmarCambioEstado}
        confirmando={confirmandoEstado}
      />
    </div>
  )
}
