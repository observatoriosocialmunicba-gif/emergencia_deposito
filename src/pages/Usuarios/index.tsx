import {
  Check,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  Edit2,
  Lock,
  Power,
  RefreshCw,
  Search,
  ShieldCheck,
  UserX,
  Users,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import Spinner from '../../components/Spinner'
import {
  ModalConfirmarDesactivar,
  ModalEditarUsuario,
} from '../../components/usuarios'
import { useAuth } from '../../context/AuthContext'
import { useAreas } from '../../hooks/useAreas'
import { useDebounce } from '../../hooks/useTiempo'
import { useActualizarUsuarioAdmin, useUsuarios } from '../../hooks/useUsuarios'
import type { Area, Rol, Usuario } from '../../lib/types'
import { POR_PAGINA_USUARIOS } from '../../services/usuariosService'

function paginasVisibles(actual: number, ultima: number): Array<number | '…'> {
  const set = new Set([0, ultima, actual - 1, actual, actual + 1])
  const orden = [...set].filter((p) => p >= 0 && p <= ultima).sort((a, b) => a - b)
  const salida: Array<number | '…'> = []
  orden.forEach((p, i) => {
    if (i > 0 && p - orden[i - 1] > 1) salida.push('…')
    salida.push(p)
  })
  return salida
}

export default function UsuariosPage() {
  const { usuario: adminActual, usuarioLoading } = useAuth()
  const areasQuery = useAreas()
  const actualizarMutation = useActualizarUsuarioAdmin()

  const [texto, setTexto] = useState('')
  const busqueda = useDebounce(texto, 300)
  const [rolFiltro, setRolFiltro] = useState<Rol | 'todos'>('todos')
  const [areaFiltro, setAreaFiltro] = useState<number | 'todas'>('todas')
  const [estadoFiltro, setEstadoFiltro] = useState<
    'todos' | 'activos' | 'inactivos' | 'pendientes'
  >('todos')
  const [pagina, setPagina] = useState(0)

  // Modales
  const [usuarioEditar, setUsuarioEditar] = useState<Usuario | null>(null)
  const [usuarioDesactivar, setUsuarioDesactivar] = useState<Usuario | null>(
    null,
  )
  const [desactivando, setDesactivando] = useState(false)

  const usuariosQuery = useUsuarios({
    busqueda,
    rol: rolFiltro,
    areaId: areaFiltro,
    estado: estadoFiltro,
    pagina,
    porPagina: POR_PAGINA_USUARIOS,
  })

  const areasMap = useMemo(() => {
    const map = new Map<number, Area>()
    ;(areasQuery.data ?? []).forEach((a) => map.set(a.id, a))
    return map
  }, [areasQuery.data])

  if (usuarioLoading) return <Spinner />

  // Control de Acceso: Solo Administrador
  if (adminActual?.rol !== 'Administrador') {
    return (
      <div className="space-y-space-lg p-margin md:p-margin-desktop">
        <h1 className="font-headline-xl text-headline-xl font-bold tracking-tight text-primary">
          Gestión de Usuarios
        </h1>
        <div className="flex items-start gap-3 rounded-xl border border-line bg-white p-space-lg text-ink-soft shadow-sm">
          <Lock className="mt-0.5 h-6 w-6 shrink-0 text-outline" />
          <div>
            <h2 className="font-body-md-bold text-body-md-bold text-ink">
              Acceso Restringido
            </h2>
            <p className="mt-1 text-sm">
              La administración de usuarios, roles y permisos está reservada para
              usuarios con rol <strong>Administrador</strong>.
            </p>
          </div>
        </div>
      </div>
    )
  }

  const filas = usuariosQuery.data?.filas ?? []
  const total = usuariosQuery.data?.total ?? 0
  const ultimaPagina = Math.max(0, Math.ceil(total / POR_PAGINA_USUARIOS) - 1)
  const desde = total === 0 ? 0 : pagina * POR_PAGINA_USUARIOS + 1
  const hasta = Math.min(total, (pagina + 1) * POR_PAGINA_USUARIOS)

  async function handleGuardarUsuario(datos: {
    rol: Rol
    area_id: number | null
    activo?: boolean
  }) {
    if (!usuarioEditar) return
    await actualizarMutation.mutateAsync({
      id: usuarioEditar.id,
      datos,
    })
  }

  async function handleToggleActivo(u: Usuario) {
    if (u.id === adminActual?.id) return

    if (u.activo) {
      // Pedir confirmación para desactivar
      setUsuarioDesactivar(u)
    } else {
      // Activar directamente
      await actualizarMutation.mutateAsync({
        id: u.id,
        datos: { activo: true },
      })
    }
  }

  async function handleConfirmarDesactivar() {
    if (!usuarioDesactivar) return
    setDesactivando(true)
    try {
      await actualizarMutation.mutateAsync({
        id: usuarioDesactivar.id,
        datos: { activo: false },
      })
      setUsuarioDesactivar(null)
    } finally {
      setDesactivando(false)
    }
  }

  return (
    <div className="space-y-space-lg p-margin md:p-margin-desktop">
      {/* Cabecera */}
      <div className="flex flex-col justify-between gap-4 rounded-xl border border-line bg-white p-space-lg shadow-[0px_2px_8px_rgba(0,5,141,0.04)] sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2 text-primary">
            <Users size={24} />
            <h1 className="font-headline-lg-mobile text-headline-lg-mobile font-bold tracking-tight text-ink md:font-headline-lg md:text-headline-lg">
              Gestión de Usuarios
            </h1>
          </div>
          <p className="mt-1 font-body-md text-sm text-ink-soft">
            Administrá roles, áreas asignadas y habilitación de cuentas del
            sistema.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void usuariosQuery.refetch()}
          title="Actualizar listado"
          className="inline-flex min-h-[44px] items-center gap-1.5 self-start rounded-lg border border-line bg-panel px-3 py-1.5 font-label-md text-label-md text-ink transition-colors hover:bg-page sm:self-auto"
        >
          <RefreshCw
            size={16}
            className={`text-secondary ${
              usuariosQuery.isFetching ? 'animate-spin' : ''
            }`}
          />
          <span>Actualizar</span>
        </button>
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <div className="space-y-3 rounded-xl border border-line bg-white p-space-md shadow-xs">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          {/* Búsqueda */}
          <div className="relative md:col-span-1">
            <Search
              size={18}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-outline"
            />
            <input
              type="search"
              value={texto}
              onChange={(e) => {
                setTexto(e.target.value)
                setPagina(0)
              }}
              placeholder="Nombre o DNI completo"
              aria-label="Buscar usuarios por nombre o DNI"
              className="min-h-[44px] w-full rounded-lg border border-field bg-white pl-9 pr-3 font-body-md text-sm text-ink focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/20"
            />
          </div>

          {/* Filtro Rol */}
          <div>
            <select
              value={rolFiltro}
              onChange={(e) => {
                setRolFiltro(e.target.value as Rol | 'todos')
                setPagina(0)
              }}
              aria-label="Filtrar por rol"
              className="min-h-[44px] w-full rounded-lg border border-field bg-white px-3 font-body-md text-sm text-ink focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/20"
            >
              <option value="todos">Todos los roles</option>
              <option value="Administrador">Administrador</option>
              <option value="Asignador">Asignador</option>
              <option value="Solicitante">Solicitante</option>
              <option value="No Asignado">No Asignado</option>
            </select>
          </div>

          {/* Filtro Área */}
          <div>
            <select
              value={areaFiltro}
              onChange={(e) => {
                const val = e.target.value
                setAreaFiltro(val === 'todas' ? 'todas' : Number(val))
                setPagina(0)
              }}
              aria-label="Filtrar por área"
              className="min-h-[44px] w-full rounded-lg border border-field bg-white px-3 font-body-md text-sm text-ink focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/20"
            >
              <option value="todas">Todas las áreas</option>
              {areasQuery.data?.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro Estado */}
          <div>
            <select
              value={estadoFiltro}
              onChange={(e) => {
                setEstadoFiltro(
                  e.target.value as
                    | 'todos'
                    | 'activos'
                    | 'inactivos'
                    | 'pendientes',
                )
                setPagina(0)
              }}
              aria-label="Filtrar por estado"
              className="min-h-[44px] w-full rounded-lg border border-field bg-white px-3 font-body-md text-sm text-ink focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/20"
            >
              <option value="todos">Todos los estados</option>
              <option value="activos">Activos</option>
              <option value="inactivos">Inactivos</option>
              <option value="pendientes">Pendientes de habilitación</option>
            </select>
          </div>
        </div>
      </div>

      {/* Contenido: Tabla en lg, Tarjetas en móvil */}
      <div className="overflow-hidden rounded-xl border border-line bg-white shadow-[0px_2px_8px_rgba(0,5,141,0.04)]">
        {usuariosQuery.isLoading ? (
          <div className="p-12 text-center text-ink-soft">
            <Spinner />
            <p className="mt-2 text-sm">Cargando usuarios...</p>
          </div>
        ) : usuariosQuery.isError ? (
          <div className="p-8 text-center text-error">
            <CircleAlert className="mx-auto h-8 w-8" />
            <p className="mt-2 font-body-md text-body-md">
              Error al consultar los usuarios.
            </p>
          </div>
        ) : filas.length === 0 ? (
          <div className="p-12 text-center text-ink-soft">
            <Users className="mx-auto h-12 w-12 text-outline/50" />
            <p className="mt-2 font-headline-sm text-headline-sm font-bold text-ink">
              No se encontraron usuarios
            </p>
            <p className="mt-1 font-body-md text-sm">
              No hay registros que coincidan con los filtros aplicados.
            </p>
          </div>
        ) : (
          <div>
            {/* Vista Desktop (lg y superior) */}
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="bg-primary-container text-white font-label-md text-label-md uppercase tracking-wider">
                    <th className="px-5 py-3.5 font-bold">Nombre Completo</th>
                    <th className="px-5 py-3.5 font-bold">DNI</th>
                    <th className="px-5 py-3.5 font-bold">Teléfono</th>
                    <th className="px-5 py-3.5 font-bold">Rol</th>
                    <th className="px-5 py-3.5 font-bold">Área</th>
                    <th className="px-5 py-3.5 font-bold">Estado</th>
                    <th className="px-5 py-3.5 text-right font-bold">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line font-body-md text-body-md">
                  {filas.map((u, i) => {
                    const esPropio = u.id === adminActual?.id
                    const nombreArea = u.area_id
                      ? areasMap.get(u.area_id)?.nombre ?? 'Área desconocida'
                      : '—'
                    const esPendiente = u.rol === 'No Asignado'

                    return (
                      <tr
                        key={u.id}
                        className={`transition-colors hover:bg-page ${
                          i % 2 === 0 ? 'bg-white' : 'bg-panel/40'
                        }`}
                      >
                        <td className="px-5 py-3.5 font-body-md-bold text-ink">
                          <div className="flex items-center gap-2">
                            <span>{u.nombreCompleto || 'Sin nombre'}</span>
                            {esPropio && (
                              <span className="rounded bg-primary-container/10 px-1.5 py-0.5 text-[11px] font-bold text-primary-container">
                                Vos
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-3.5 font-mono text-ink">
                          {u.dni ?? '—'}
                        </td>
                        <td className="px-5 py-3.5 text-ink-soft">
                          {u.telefono || '—'}
                        </td>
                        <td className="px-5 py-3.5">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 font-label-sm text-xs font-semibold ${
                              u.rol === 'Administrador'
                                ? 'bg-primary-container/15 text-primary-container'
                                : u.rol === 'Asignador'
                                  ? 'bg-secondary/15 text-secondary'
                                  : u.rol === 'Solicitante'
                                    ? 'bg-teal-soft text-[#0A423C]'
                                    : 'bg-outline-variant/30 text-ink-soft'
                            }`}
                          >
                            <ShieldCheck size={14} />
                            {u.rol ?? 'Sin rol'}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-ink-soft">
                          {nombreArea}
                        </td>
                        <td className="px-5 py-3.5">
                          {esPendiente ? (
                            <span className="inline-flex items-center rounded border border-[#F9CF58] bg-[#F9CF58]/25 px-2 py-0.5 font-label-sm text-xs font-semibold text-[#4A3800]">
                              Pendiente de habilitación
                            </span>
                          ) : u.activo ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-secondary/15 px-2 py-0.5 font-label-sm text-xs font-semibold text-secondary">
                              <Check size={12} />
                              Activo
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-error-container/40 px-2 py-0.5 font-label-sm text-xs font-semibold text-error">
                              <UserX size={12} />
                              Inactivo
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => setUsuarioEditar(u)}
                              title={
                                esPendiente
                                  ? 'Habilitar usuario'
                                  : 'Editar rol y área'
                              }
                              className="inline-flex min-h-[36px] items-center gap-1 rounded-lg border border-line bg-white px-3 py-1 font-label-md text-xs text-primary transition-colors hover:bg-page"
                            >
                              <Edit2 size={13} />
                              <span>{esPendiente ? 'Habilitar' : 'Editar'}</span>
                            </button>

                            {!esPropio && !esPendiente && (
                              <button
                                type="button"
                                onClick={() => void handleToggleActivo(u)}
                                title={
                                  u.activo
                                    ? 'Desactivar cuenta'
                                    : 'Activar cuenta'
                                }
                                aria-label={
                                  u.activo
                                    ? `Desactivar usuario ${u.nombreCompleto}`
                                    : `Activar usuario ${u.nombreCompleto}`
                                }
                                className={`inline-flex min-h-[36px] items-center gap-1 rounded-lg px-2.5 py-1 font-label-md text-xs transition-colors ${
                                  u.activo
                                    ? 'border border-error/40 text-error hover:bg-error-container/20'
                                    : 'border border-secondary/40 text-secondary hover:bg-secondary/10'
                                }`}
                              >
                                <Power size={13} />
                                <span>{u.activo ? 'Desactivar' : 'Activar'}</span>
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

            {/* Vista Mobile (tarjetas en < lg) */}
            <div className="divide-y divide-line lg:hidden">
              {filas.map((u) => {
                const esPropio = u.id === adminActual?.id
                const nombreArea = u.area_id
                  ? areasMap.get(u.area_id)?.nombre ?? 'Área desconocida'
                  : 'Sin área'
                const esPendiente = u.rol === 'No Asignado'

                return (
                  <div key={u.id} className="space-y-3 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-body-md-bold text-body-md-bold text-ink">
                            {u.nombreCompleto || 'Sin nombre'}
                          </p>
                          {esPropio && (
                            <span className="rounded bg-primary-container/10 px-1.5 py-0.5 text-[10px] font-bold text-primary-container">
                              Vos
                            </span>
                          )}
                        </div>
                        <p className="font-mono text-xs text-ink-soft">
                          DNI: {u.dni ?? '—'}
                        </p>
                        {u.telefono && (
                          <p className="text-xs text-ink-soft">
                            Tel: {u.telefono}
                          </p>
                        )}
                      </div>

                      <div>
                        {esPendiente ? (
                          <span className="inline-block rounded border border-[#F9CF58] bg-[#F9CF58]/25 px-2 py-0.5 font-label-sm text-[11px] font-semibold text-[#4A3800]">
                            Pendiente
                          </span>
                        ) : u.activo ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-secondary/15 px-2 py-0.5 font-label-sm text-[11px] font-semibold text-secondary">
                            <Check size={11} /> Activo
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-error-container/40 px-2 py-0.5 font-label-sm text-[11px] font-semibold text-error">
                            <UserX size={11} /> Inactivo
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs text-ink-soft">
                      <span className="inline-flex items-center gap-1 rounded bg-surface-container px-2 py-0.5 font-semibold text-ink">
                        <ShieldCheck size={13} className="text-secondary" />
                        {u.rol ?? 'Sin rol'}
                      </span>
                      <span>·</span>
                      <span className="truncate">{nombreArea}</span>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setUsuarioEditar(u)}
                        className="flex min-h-[44px] flex-1 items-center justify-center gap-1 rounded-lg border border-line bg-white py-2 font-label-md text-xs font-semibold text-primary"
                      >
                        <Edit2 size={14} />
                        <span>{esPendiente ? 'Habilitar' : 'Editar Rol/Área'}</span>
                      </button>

                      {!esPropio && !esPendiente && (
                        <button
                          type="button"
                          onClick={() => void handleToggleActivo(u)}
                          className={`flex min-h-[44px] flex-1 items-center justify-center gap-1 rounded-lg py-2 font-label-md text-xs font-semibold transition-colors ${
                            u.activo
                              ? 'border border-error/40 text-error hover:bg-error-container/20'
                              : 'border border-secondary/40 text-secondary hover:bg-secondary/10'
                          }`}
                        >
                          <Power size={14} />
                          <span>{u.activo ? 'Desactivar' : 'Activar'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Paginador */}
            <div className="flex flex-col items-center justify-between gap-3 border-t border-line bg-panel p-space-md sm:flex-row">
              <p className="text-body-md text-ink-soft">
                Mostrando{' '}
                <span className="font-semibold text-ink">
                  {desde}–{hasta}
                </span>{' '}
                de <span className="font-semibold text-ink">{total} usuarios</span>
              </p>

              <div className="flex flex-wrap items-center justify-center gap-1">
                <button
                  type="button"
                  disabled={pagina === 0}
                  onClick={() => setPagina((p) => Math.max(0, p - 1))}
                  className="flex min-h-[44px] items-center justify-center gap-1 rounded-lg border border-field bg-white px-3 py-1.5 font-label-md text-label-md text-ink-soft transition-colors hover:bg-page disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft size={16} />
                  Anterior
                </button>

                {paginasVisibles(pagina, ultimaPagina).map((p, i) =>
                  p === '…' ? (
                    <span key={`gap-${i}`} className="px-2 text-outline">
                      …
                    </span>
                  ) : (
                    <button
                      key={p}
                      type="button"
                      aria-current={p === pagina ? 'page' : undefined}
                      onClick={() => setPagina(p)}
                      className={`flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border font-label-md text-label-md transition-colors ${
                        p === pagina
                          ? 'border-primary-container bg-primary-container text-white shadow-sm'
                          : 'border-field bg-white text-ink hover:bg-page'
                      }`}
                    >
                      {p + 1}
                    </button>
                  ),
                )}

                <button
                  type="button"
                  disabled={pagina >= ultimaPagina}
                  onClick={() => setPagina((p) => p + 1)}
                  className="flex min-h-[44px] items-center justify-center gap-1 rounded-lg border border-field bg-white px-3 py-1.5 font-label-md text-label-md text-ink transition-colors hover:bg-page disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Siguiente
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modales */}
      <ModalEditarUsuario
        isOpen={Boolean(usuarioEditar)}
        usuario={usuarioEditar}
        areas={areasQuery.data ?? []}
        adminActualId={adminActual?.id}
        onCerrar={() => setUsuarioEditar(null)}
        onGuardar={handleGuardarUsuario}
      />

      <ModalConfirmarDesactivar
        isOpen={Boolean(usuarioDesactivar)}
        usuario={usuarioDesactivar}
        confirmando={desactivando}
        onCerrar={() => setUsuarioDesactivar(null)}
        onConfirmar={handleConfirmarDesactivar}
      />
    </div>
  )
}
