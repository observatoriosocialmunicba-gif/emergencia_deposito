import {
  AlertCircle,
  Building2,
  Check,
  CheckCircle2,
  Edit2,
  Package,
  Plus,
  Power,
  RefreshCw,
  Users,
} from 'lucide-react'
import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import Spinner from '../../components/Spinner'
import {
  ModalConfirmarEstadoArea,
  ModalEditarArea,
} from '../../components/areas'
import { useAuth } from '../../context/AuthContext'
import {
  useAreasAdmin,
  useCambiarEstadoArea,
  useCrearArea,
  useRenombrarArea,
} from '../../hooks/useAreas'
import type { Area, AreaConConteo } from '../../lib/types'

export default function AreasPage() {
  const { usuario: adminActual, usuarioLoading } = useAuth()

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

  if (usuarioLoading) return <Spinner />

  // Control de Acceso: Redirigir a no administradores
  if (adminActual?.rol !== 'Administrador') {
    return <Navigate to="/estado-pedidos" replace />
  }

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
    <div className="space-y-space-lg p-margin md:p-margin-desktop">
      {/* Cabecera */}
      <div className="flex flex-col justify-between gap-4 rounded-xl border border-line bg-white p-space-lg shadow-[0px_2px_8px_rgba(0,5,141,0.04)] sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2 text-primary">
            <Building2 size={24} />
            <h1 className="font-headline-lg-mobile text-headline-lg-mobile font-bold tracking-tight text-ink md:font-headline-lg md:text-headline-lg">
              Gestión de Áreas
            </h1>
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

      {/* Contenido: Tabla en lg, Tarjetas en móvil */}
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
            <p className="mt-1 text-sm">
              Creá una nueva área para comenzar a asignar usuarios y solicitudes.
            </p>
          </div>
        ) : (
          <>
            {/* Tabla en pantallas grandes (hidden en móvil) */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-left font-body-md text-sm">
                <thead>
                  <tr className="border-b border-line bg-panel text-ink-soft">
                    <th scope="col" className="px-5 py-3.5 font-bold text-ink">
                      Nombre del Área
                    </th>
                    <th scope="col" className="px-5 py-3.5 font-bold text-ink">
                      Estado
                    </th>
                    <th scope="col" className="px-5 py-3.5 text-center font-bold text-ink">
                      Usuarios
                    </th>
                    <th scope="col" className="px-5 py-3.5 text-center font-bold text-ink">
                      Pedidos
                    </th>
                    <th scope="col" className="px-5 py-3.5 text-right font-bold text-ink">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {areas.map((a, i) => {
                    const esInactiva = !a.activa
                    const tieneSolicitantes = a.solicitantesActivosCount > 0

                    return (
                      <tr
                        key={a.id}
                        className={`transition-colors ${
                          esInactiva
                            ? 'bg-page/40 text-on-surface-variant hover:bg-page/70'
                            : i % 2 === 0
                              ? 'bg-white hover:bg-page'
                              : 'bg-panel/40 hover:bg-page'
                        }`}
                      >
                        <th
                          scope="row"
                          className="px-5 py-4 font-body-md-bold text-base font-semibold text-ink"
                        >
                          <span className={esInactiva ? 'text-on-surface-variant' : 'text-ink'}>
                            {a.nombre}
                          </span>
                        </th>
                        <td className="px-5 py-4">
                          {a.activa ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-secondary/15 px-2.5 py-0.5 text-xs font-semibold text-secondary">
                              <Check size={12} /> Activa
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-error-container/40 px-2.5 py-0.5 text-xs font-semibold text-error">
                              <Power size={12} /> Inactiva
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-4 text-center font-semibold text-ink">
                          <span className="inline-flex items-center gap-1 text-sm">
                            <Users size={15} className="text-outline" />
                            {a.usuariosCount}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-center font-semibold text-ink">
                          <span className="inline-flex items-center gap-1 text-sm">
                            <Package size={15} className="text-outline" />
                            {a.pedidosCount}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => handleAbrirEditar(a)}
                              aria-label={`Editar área ${a.nombre}`}
                              className="inline-flex min-h-[44px] items-center gap-1 rounded-lg border border-line bg-white px-3 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-surface-container"
                            >
                              <Edit2 size={14} />
                              <span>Editar</span>
                            </button>

                            {esInactiva ? (
                              <button
                                type="button"
                                onClick={() => handleAbrirEstado(a)}
                                aria-label={`Activar área ${a.nombre}`}
                                className="inline-flex min-h-[44px] items-center gap-1 rounded-lg border border-secondary/30 bg-secondary/10 px-3 py-1.5 text-xs font-semibold text-secondary transition-colors hover:bg-secondary/20"
                              >
                                <Power size={14} />
                                <span>Activar</span>
                              </button>
                            ) : tieneSolicitantes ? (
                              <button
                                type="button"
                                disabled
                                title={`Reasigná primero a sus ${a.solicitantesActivosCount} solicitantes`}
                                aria-label={`Reasigná primero a sus ${a.solicitantesActivosCount} solicitantes`}
                                className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg border border-outline-variant/40 bg-surface-container px-3 py-1.5 text-xs font-semibold text-on-surface-variant/80 cursor-not-allowed"
                              >
                                Reasigná primero a sus {a.solicitantesActivosCount} solicitantes
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleAbrirEstado(a)}
                                aria-label={`Desactivar área ${a.nombre}`}
                                className="inline-flex min-h-[44px] items-center gap-1 rounded-lg border border-error/30 bg-error-container/20 px-3 py-1.5 text-xs font-semibold text-error transition-colors hover:bg-error-container/40"
                              >
                                <Power size={14} />
                                <span>Desactivar</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Vista Móvil: Tarjetas (lg:hidden) */}
            <div className="divide-y divide-line lg:hidden">
              {areas.map((a) => {
                const esInactiva = !a.activa
                const tieneSolicitantes = a.solicitantesActivosCount > 0

                return (
                  <div
                    key={a.id}
                    className={`space-y-3 p-4 ${
                      esInactiva ? 'bg-page/40 text-on-surface-variant' : 'bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h2 className="font-body-md-bold text-base font-bold text-ink">
                          {a.nombre}
                        </h2>
                      </div>
                      <div className="shrink-0">
                        {a.activa ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-secondary/15 px-2.5 py-0.5 text-xs font-semibold text-secondary">
                            <Check size={12} /> Activa
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-error-container/40 px-2.5 py-0.5 text-xs font-semibold text-error">
                            <Power size={12} /> Inactiva
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 rounded-lg border border-line bg-panel p-2.5 text-xs font-medium text-ink">
                      <div className="flex items-center gap-1.5">
                        <Users size={16} className="text-secondary" />
                        <span>
                          <strong>{a.usuariosCount}</strong> usuarios
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Package size={16} className="text-primary" />
                        <span>
                          <strong>{a.pedidosCount}</strong> pedidos
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 pt-1 sm:flex-row">
                      <button
                        type="button"
                        onClick={() => handleAbrirEditar(a)}
                        aria-label={`Editar área ${a.nombre}`}
                        className="flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-lg border border-line bg-white px-3 py-2 font-label-md text-xs font-semibold text-primary transition-colors hover:bg-surface-container"
                      >
                        <Edit2 size={14} />
                        <span>Editar</span>
                      </button>

                      {esInactiva ? (
                        <button
                          type="button"
                          onClick={() => handleAbrirEstado(a)}
                          aria-label={`Activar área ${a.nombre}`}
                          className="flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-lg border border-secondary/30 bg-secondary/10 px-3 py-2 font-label-md text-xs font-semibold text-secondary transition-colors hover:bg-secondary/20"
                        >
                          <Power size={14} />
                          <span>Activar</span>
                        </button>
                      ) : tieneSolicitantes ? (
                        <button
                          type="button"
                          disabled
                          title={`Reasigná primero a sus ${a.solicitantesActivosCount} solicitantes`}
                          aria-label={`Reasigná primero a sus ${a.solicitantesActivosCount} solicitantes`}
                          className="flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-lg border border-outline-variant/40 bg-surface-container px-3 py-2 text-xs font-semibold text-on-surface-variant/80 cursor-not-allowed text-center"
                        >
                          Reasigná primero a sus {a.solicitantesActivosCount} solicitantes
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleAbrirEstado(a)}
                          aria-label={`Desactivar área ${a.nombre}`}
                          className="flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-lg border border-error/30 bg-error-container/20 px-3 py-2 font-label-md text-xs font-semibold text-error transition-colors hover:bg-error-container/40"
                        >
                          <Power size={14} />
                          <span>Desactivar</span>
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>

      {/* Modales */}
      <ModalEditarArea
        area={areaEditar}
        areasExistentes={areas}
        isOpen={modalEditarOpen}
        onCerrar={() => {
          setModalEditarOpen(false)
          setAreaEditar(null)
        }}
        onGuardar={handleGuardarArea}
      />

      <ModalConfirmarEstadoArea
        area={areaEstado}
        isOpen={modalEstadoOpen}
        confirmando={confirmandoEstado}
        onCerrar={() => {
          setModalEstadoOpen(false)
          setAreaEstado(null)
        }}
        onConfirmar={handleConfirmarCambioEstado}
      />
    </div>
  )
}
