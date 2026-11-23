import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  Edit2,
  Info,
  Plus,
  Power,
  RefreshCw,
  SlidersHorizontal,
} from 'lucide-react'
import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import Spinner from '../../components/Spinner'
import {
  ModalConfirmarEstadoOpcion,
  ModalEditarOpcion,
} from '../../components/opciones'
import { useAuth } from '../../context/AuthContext'
import {
  useCambiarEstadoOpcion,
  useCrearOpcion,
  useOpcionesAdmin,
  useRenombrarOpcion,
  useReordenarOpciones,
} from '../../hooks/useOpciones'
import type { CategoriaOpcion, Opcion } from '../../lib/types'

export default function OpcionesPage() {
  const { usuario: adminActual, usuarioLoading } = useAuth()
  const [tabActual, setTabActual] = useState<CategoriaOpcion>('genero')

  const opcionesQuery = useOpcionesAdmin(tabActual)
  const crearMutation = useCrearOpcion()
  const renombrarMutation = useRenombrarOpcion()
  const cambiarEstadoMutation = useCambiarEstadoOpcion()
  const reordenarMutation = useReordenarOpciones()

  // Modales
  const [modalEditarOpen, setModalEditarOpen] = useState(false)
  const [opcionEditar, setOpcionEditar] = useState<Opcion | null>(null)

  const [modalEstadoOpen, setModalEstadoOpen] = useState(false)
  const [opcionEstado, setOpcionEstado] = useState<Opcion | null>(null)
  const [confirmandoEstado, setConfirmandoEstado] = useState(false)

  // Mensajes de feedback
  const [mensajeExito, setMensajeExito] = useState<string | null>(null)
  const [mensajeError, setMensajeError] = useState<string | null>(null)

  if (usuarioLoading) return <Spinner />

  // Control de Acceso: Redirigir a usuarios no administradores
  if (adminActual?.rol !== 'Administrador') {
    return <Navigate to="/estado-pedidos" replace />
  }

  const opciones = opcionesQuery.data ?? []
  const activas = opciones.filter((o) => o.activa)
  const inactivas = opciones.filter((o) => !o.activa)
  const categoriaLabel = tabActual === 'genero' ? 'Género' : 'Procedencia'

  function handleCambiarTab(tab: CategoriaOpcion) {
    setTabActual(tab)
    setMensajeExito(null)
    setMensajeError(null)
  }

  function handleAbrirCrear() {
    setOpcionEditar(null)
    setMensajeExito(null)
    setMensajeError(null)
    setModalEditarOpen(true)
  }

  function handleAbrirEditar(op: Opcion) {
    setOpcionEditar(op)
    setMensajeExito(null)
    setMensajeError(null)
    setModalEditarOpen(true)
  }

  function handleAbrirEstado(op: Opcion) {
    setOpcionEstado(op)
    setMensajeExito(null)
    setMensajeError(null)
    setModalEstadoOpen(true)
  }

  async function handleGuardarOpcion(valor: string) {
    setMensajeExito(null)
    setMensajeError(null)
    if (opcionEditar) {
      await renombrarMutation.mutateAsync({
        id: opcionEditar.id,
        valor,
        categoria: tabActual,
      })
      setMensajeExito(`Opción de ${categoriaLabel} renombrada a "${valor}" con éxito.`)
    } else {
      await crearMutation.mutateAsync({
        categoria: tabActual,
        valor,
      })
      setMensajeExito(`Opción "${valor}" agregada a ${categoriaLabel} con éxito.`)
    }
  }

  async function handleConfirmarCambioEstado() {
    if (!opcionEstado) return
    setConfirmandoEstado(true)
    setMensajeExito(null)
    setMensajeError(null)
    try {
      const nuevoEstado = !opcionEstado.activa
      await cambiarEstadoMutation.mutateAsync({
        id: opcionEstado.id,
        activa: nuevoEstado,
        categoria: tabActual,
      })
      setMensajeExito(
        nuevoEstado
          ? `Opción "${opcionEstado.valor}" activada correctamente.`
          : `Opción "${opcionEstado.valor}" desactivada correctamente.`,
      )
      setModalEstadoOpen(false)
      setOpcionEstado(null)
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Error al cambiar el estado de la opción.'
      setMensajeError(msg)
    } finally {
      setConfirmandoEstado(false)
    }
  }

  async function handleSubir(opcion: Opcion) {
    const idx = activas.findIndex((o) => o.id === opcion.id)
    if (idx <= 0) return
    const nuevasActivas = [...activas]
    const temp = nuevasActivas[idx - 1]
    nuevasActivas[idx - 1] = nuevasActivas[idx]
    nuevasActivas[idx] = temp

    const todosIds = [...nuevasActivas, ...inactivas].map((o) => o.id)
    try {
      await reordenarMutation.mutateAsync({ categoria: tabActual, ids: todosIds })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al reordenar las opciones.'
      setMensajeError(msg)
    }
  }

  async function handleBajar(opcion: Opcion) {
    const idx = activas.findIndex((o) => o.id === opcion.id)
    if (idx < 0 || idx >= activas.length - 1) return
    const nuevasActivas = [...activas]
    const temp = nuevasActivas[idx + 1]
    nuevasActivas[idx + 1] = nuevasActivas[idx]
    nuevasActivas[idx] = temp

    const todosIds = [...nuevasActivas, ...inactivas].map((o) => o.id)
    try {
      await reordenarMutation.mutateAsync({ categoria: tabActual, ids: todosIds })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al reordenar las opciones.'
      setMensajeError(msg)
    }
  }

  return (
    <div className="space-y-space-lg p-margin md:p-margin-desktop">
      {/* Cabecera */}
      <div className="flex flex-col justify-between gap-4 rounded-xl border border-line bg-white p-space-lg shadow-[0px_2px_8px_rgba(0,5,141,0.04)] sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2 text-primary">
            <SlidersHorizontal size={24} />
            <h1 className="font-headline-lg-mobile text-headline-lg-mobile font-bold tracking-tight text-ink md:font-headline-lg md:text-headline-lg">
              Opciones del Sistema
            </h1>
          </div>
          <p className="mt-1 font-body-md text-sm text-ink-soft">
            Configurá las opciones disponibles en los selectores de Género y Procedencia.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleAbrirCrear}
            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg bg-primary-container px-4 py-2 font-label-md text-sm font-bold text-white shadow-xs transition-all hover:bg-primary-container/90 active:scale-[0.98]"
          >
            <Plus size={18} />
            <span>Nueva Opción</span>
          </button>

          <button
            type="button"
            onClick={() => void opcionesQuery.refetch()}
            title="Actualizar listado"
            aria-label="Actualizar listado de opciones"
            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center gap-1.5 rounded-lg border border-line bg-panel px-3 py-1.5 font-label-md text-label-md text-ink transition-colors hover:bg-page"
          >
            <RefreshCw
              size={16}
              className={`text-secondary ${opcionesQuery.isFetching ? 'animate-spin' : ''}`}
            />
            <span className="hidden sm:inline">Actualizar</span>
          </button>
        </div>
      </div>

      {/* Aviso informativo de negocio */}
      <div className="flex items-start gap-3 rounded-xl border border-secondary/30 bg-secondary/5 p-4 text-ink">
        <Info size={20} className="mt-0.5 shrink-0 text-secondary" />
        <p className="font-body-md text-sm">
          <strong>Aviso:</strong> Renombrar una opción no cambia los registros ya cargados con el nombre anterior.
        </p>
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

      {/* Pestañas (Género y Procedencia) */}
      <div className="flex border-b border-line" role="tablist" aria-label="Categorías de opciones">
        <button
          type="button"
          role="tab"
          aria-selected={tabActual === 'genero'}
          aria-controls="panel-opciones"
          onClick={() => handleCambiarTab('genero')}
          className={`flex min-h-[44px] items-center gap-2 border-b-2 px-6 py-2.5 font-label-md text-sm font-bold transition-colors ${
            tabActual === 'genero'
              ? 'border-secondary text-secondary'
              : 'border-transparent text-ink-soft hover:border-line hover:text-ink'
          }`}
        >
          <span>Género</span>
          <span className="rounded-full bg-surface-container px-2 py-0.5 text-xs font-semibold text-ink">
            {tabActual === 'genero' ? opciones.length : ''}
          </span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={tabActual === 'procedencia'}
          aria-controls="panel-opciones"
          onClick={() => handleCambiarTab('procedencia')}
          className={`flex min-h-[44px] items-center gap-2 border-b-2 px-6 py-2.5 font-label-md text-sm font-bold transition-colors ${
            tabActual === 'procedencia'
              ? 'border-secondary text-secondary'
              : 'border-transparent text-ink-soft hover:border-line hover:text-ink'
          }`}
        >
          <span>Procedencia</span>
          <span className="rounded-full bg-surface-container px-2 py-0.5 text-xs font-semibold text-ink">
            {tabActual === 'procedencia' ? opciones.length : ''}
          </span>
        </button>
      </div>

      {/* Contenido: Tabla en desktop, Tarjetas en móvil */}
      <div
        id="panel-opciones"
        role="tabpanel"
        className="overflow-hidden rounded-xl border border-line bg-white shadow-[0px_2px_8px_rgba(0,5,141,0.04)]"
      >
        {opcionesQuery.isLoading ? (
          <div className="p-12 text-center text-ink-soft">
            <Spinner />
            <p className="mt-2 text-sm">Cargando opciones...</p>
          </div>
        ) : opcionesQuery.isError ? (
          <div className="p-8 text-center text-error">
            <AlertCircle className="mx-auto h-8 w-8" />
            <p className="mt-2 font-body-md text-body-md font-semibold">
              Error al consultar las opciones.
            </p>
          </div>
        ) : opciones.length === 0 ? (
          <div className="p-12 text-center text-ink-soft">
            <SlidersHorizontal className="mx-auto h-12 w-12 text-outline/50" />
            <p className="mt-2 font-headline-sm text-headline-sm font-bold text-ink">
              No hay opciones registradas
            </p>
            <p className="mt-1 font-body-md text-sm">
              Creá la primera opción de {categoriaLabel} usando el botón &quot;Nueva Opción&quot;.
            </p>
          </div>
        ) : (
          <>
            {/* Tabla para pantallas medianas y grandes */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-left font-body-md text-sm">
                <thead className="border-b border-line bg-panel font-label-md text-xs uppercase tracking-wider text-ink-soft">
                  <tr>
                    <th scope="col" className="w-16 px-4 py-3.5 text-center">
                      Orden
                    </th>
                    <th scope="col" className="px-6 py-3.5">
                      Opción / Valor
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
                  {opciones.map((op) => {
                    const idxActiva = activas.findIndex((a) => a.id === op.id)
                    const esPrimeraActiva = idxActiva === 0
                    const esUltimaActiva = idxActiva === activas.length - 1

                    return (
                      <tr
                        key={op.id}
                        className={`transition-colors hover:bg-page/50 ${
                          !op.activa ? 'bg-surface-container/30 text-ink-soft' : ''
                        }`}
                      >
                        <td className="px-4 py-4 text-center font-body-md-bold text-sm text-outline">
                          {op.activa ? idxActiva + 1 : '—'}
                        </td>
                        <th
                          scope="row"
                          className="px-6 py-4 font-body-md-bold text-sm text-ink"
                        >
                          <div className="flex items-center gap-2">
                            <span className={!op.activa ? 'text-ink-soft' : ''}>
                              {op.valor}
                            </span>
                            {!op.activa && (
                              <span className="rounded bg-line px-1.5 py-0.5 text-xs text-ink-soft">
                                Inactiva
                              </span>
                            )}
                          </div>
                        </th>
                        <td className="px-6 py-4 text-center">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                              op.activa
                                ? 'bg-secondary/15 text-secondary'
                                : 'bg-line text-ink-soft'
                            }`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${
                                op.activa ? 'bg-secondary' : 'bg-outline'
                              }`}
                            />
                            {op.activa ? 'Activa' : 'Inactiva'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {/* Reordenar (solo opciones activas) */}
                            {op.activa && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => void handleSubir(op)}
                                  disabled={esPrimeraActiva || reordenarMutation.isPending}
                                  title="Subir posición"
                                  aria-label={`Subir opción ${op.valor}`}
                                  className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-ink-soft transition-colors hover:bg-page hover:text-ink disabled:opacity-30 disabled:hover:bg-transparent"
                                >
                                  <ArrowUp size={16} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => void handleBajar(op)}
                                  disabled={esUltimaActiva || reordenarMutation.isPending}
                                  title="Bajar posición"
                                  aria-label={`Bajar opción ${op.valor}`}
                                  className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-ink-soft transition-colors hover:bg-page hover:text-ink disabled:opacity-30 disabled:hover:bg-transparent"
                                >
                                  <ArrowDown size={16} />
                                </button>
                              </>
                            )}

                            {/* Editar */}
                            <button
                              type="button"
                              onClick={() => handleAbrirEditar(op)}
                              aria-label={`Editar opción ${op.valor}`}
                              className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg px-2.5 py-1.5 font-label-md text-xs font-semibold text-secondary transition-colors hover:bg-secondary/10"
                            >
                              <Edit2 size={15} />
                              <span>Editar</span>
                            </button>

                            {/* Activar / Desactivar */}
                            <button
                              type="button"
                              onClick={() => handleAbrirEstado(op)}
                              aria-label={`${op.activa ? 'Desactivar' : 'Activar'} opción ${op.valor}`}
                              className={`inline-flex min-h-[44px] items-center gap-1.5 rounded-lg px-2.5 py-1.5 font-label-md text-xs font-semibold transition-colors ${
                                op.activa
                                  ? 'text-error hover:bg-error-container/20'
                                  : 'text-secondary hover:bg-secondary/10'
                              }`}
                            >
                              <Power size={15} />
                              <span>{op.activa ? 'Desactivar' : 'Activar'}</span>
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
              {opciones.map((op) => {
                const idxActiva = activas.findIndex((a) => a.id === op.id)
                const esPrimeraActiva = idxActiva === 0
                const esUltimaActiva = idxActiva === activas.length - 1

                return (
                  <div
                    key={op.id}
                    className={`p-4 space-y-3 ${
                      !op.activa ? 'bg-surface-container/30 text-ink-soft' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h2 className="font-body-md-bold text-base text-ink">
                          {op.valor}
                        </h2>
                        <div className="mt-1 flex items-center gap-2">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
                              op.activa
                                ? 'bg-secondary/15 text-secondary'
                                : 'bg-line text-ink-soft'
                            }`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${
                                op.activa ? 'bg-secondary' : 'bg-outline'
                              }`}
                            />
                            {op.activa ? `Activa (#${idxActiva + 1})` : 'Inactiva'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-end gap-2 border-t border-line/60 pt-2">
                      {op.activa && (
                        <div className="flex items-center mr-auto">
                          <button
                            type="button"
                            onClick={() => void handleSubir(op)}
                            disabled={esPrimeraActiva || reordenarMutation.isPending}
                            aria-label={`Subir opción ${op.valor}`}
                            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-ink-soft transition-colors hover:bg-page hover:text-ink disabled:opacity-30"
                          >
                            <ArrowUp size={18} />
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleBajar(op)}
                            disabled={esUltimaActiva || reordenarMutation.isPending}
                            aria-label={`Bajar opción ${op.valor}`}
                            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-ink-soft transition-colors hover:bg-page hover:text-ink disabled:opacity-30"
                          >
                            <ArrowDown size={18} />
                          </button>
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={() => handleAbrirEditar(op)}
                        aria-label={`Editar opción ${op.valor}`}
                        className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg border border-line px-3 py-2 font-label-md text-xs font-semibold text-secondary hover:bg-secondary/10"
                      >
                        <Edit2 size={16} />
                        <span>Editar</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleAbrirEstado(op)}
                        aria-label={`${op.activa ? 'Desactivar' : 'Activar'} opción ${op.valor}`}
                        className={`inline-flex min-h-[44px] items-center gap-1.5 rounded-lg border border-line px-3 py-2 font-label-md text-xs font-semibold ${
                          op.activa
                            ? 'text-error hover:bg-error-container/20'
                            : 'text-secondary hover:bg-secondary/10'
                        }`}
                      >
                        <Power size={16} />
                        <span>{op.activa ? 'Desactivar' : 'Activar'}</span>
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>

      {/* Modal para Crear y Editar Opción */}
      <ModalEditarOpcion
        isOpen={modalEditarOpen}
        onClose={() => setModalEditarOpen(false)}
        opcion={opcionEditar}
        categoria={tabActual}
        onGuardar={handleGuardarOpcion}
        opcionesExistentes={opciones}
      />

      {/* Modal para Confirmar Cambio de Estado */}
      <ModalConfirmarEstadoOpcion
        isOpen={modalEstadoOpen}
        onClose={() => setModalEstadoOpen(false)}
        opcion={opcionEstado}
        onConfirmar={handleConfirmarCambioEstado}
        cargando={confirmandoEstado}
      />
    </div>
  )
}
