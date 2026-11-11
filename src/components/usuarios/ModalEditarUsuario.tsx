import { AlertCircle, ShieldCheck, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import type { Area, Rol, Usuario } from '../../lib/types'

const ROLES: Rol[] = ['Administrador', 'Asignador', 'Solicitante', 'No Asignado']

interface Props {
  usuario: Usuario | null
  areas: Area[]
  adminActualId?: string
  isOpen: boolean
  onCerrar: () => void
  onGuardar: (datos: {
    rol: Rol
    area_id: number | null
    activo?: boolean
  }) => Promise<void>
}

export default function ModalEditarUsuario({
  usuario,
  areas,
  adminActualId,
  isOpen,
  onCerrar,
  onGuardar,
}: Props) {
  const [rol, setRol] = useState<Rol>('No Asignado')
  const [areaId, setAreaId] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [guardando, setGuardando] = useState(false)

  const esPropioAdmin = usuario?.id === adminActualId
  const esPendiente = usuario?.rol === 'No Asignado'

  useEffect(() => {
    if (usuario) {
      setRol(usuario.rol ?? 'No Asignado')
      setAreaId(usuario.area_id ?? null)
      setError(null)
    }
  }, [usuario])

  if (!isOpen || !usuario) return null

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    if (esPropioAdmin && rol !== 'Administrador') {
      setError('No podés quitarte tu propio rol de Administrador.')
      return
    }

    if (rol === 'Solicitante' && !areaId) {
      setError('Un Solicitante requiere un área asignada.')
      return
    }

    setGuardando(true)
    try {
      const payload: { rol: Rol; area_id: number | null; activo?: boolean } = {
        rol,
        area_id: rol === 'Solicitante' ? areaId : (areaId ?? null),
      }

      // Si la cuenta estaba pendiente (No Asignado) y se le asigna un rol activo,
      // se habilita automáticamente.
      if (esPendiente && rol !== 'No Asignado') {
        payload.activo = true
      }

      await onGuardar(payload)
      onCerrar()
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : 'Error al actualizar el usuario.',
      )
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-usuario-titulo"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div
        className="fixed inset-0 bg-black/50 transition-opacity"
        onClick={onCerrar}
      />

      <div className="relative z-10 w-full max-w-lg overflow-hidden rounded-xl border border-line bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-line bg-panel px-6 py-4">
          <div className="flex items-center gap-2">
            <ShieldCheck size={20} className="text-secondary" />
            <h2
              id="modal-usuario-titulo"
              className="font-headline-sm text-headline-sm font-bold text-ink"
            >
              {esPendiente ? 'Habilitar y Asignar Usuario' : 'Editar Usuario'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onCerrar}
            aria-label="Cerrar ventana"
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-ink-soft hover:bg-page hover:text-ink"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          {error && (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-lg border border-error bg-error-container/30 p-3 text-sm text-on-error-container"
            >
              <AlertCircle size={18} className="mt-0.5 shrink-0 text-error" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <p className="font-label-sm text-label-sm uppercase tracking-wider text-ink-soft">
              Usuario
            </p>
            <p className="font-body-md-bold text-body-md-bold text-ink">
              {usuario.nombreCompleto || 'Sin nombre'}
            </p>
            {usuario.dni && (
              <p className="text-xs text-ink-soft">DNI: {usuario.dni}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="select-rol"
              className="block font-body-md-bold text-xs text-on-surface"
            >
              Rol <span className="text-error">*</span>
            </label>
            <select
              id="select-rol"
              value={rol}
              disabled={esPropioAdmin}
              onChange={(e) => setRol(e.target.value as Rol)}
              className="min-h-[46px] w-full rounded-lg border border-field bg-white px-3.5 font-body-md text-sm text-on-surface focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/20 disabled:cursor-not-allowed disabled:bg-surface-container-high/60"
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
            {esPropioAdmin && (
              <p className="text-xs text-outline">
                No podés modificar tu propio rol de Administrador.
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="select-area"
              className="block font-body-md-bold text-xs text-on-surface"
            >
              Área {rol === 'Solicitante' && <span className="text-error">* (Requerida para Solicitante)</span>}
            </label>
            <select
              id="select-area"
              value={areaId ?? ''}
              onChange={(e) =>
                setAreaId(e.target.value ? Number(e.target.value) : null)
              }
              className="min-h-[46px] w-full rounded-lg border border-field bg-white px-3.5 font-body-md text-sm text-on-surface focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/20"
            >
              <option value="">Sin área asignada</option>
              {areas.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-6 flex flex-col-reverse justify-end gap-3 pt-4 sm:flex-row">
            <button
              type="button"
              onClick={onCerrar}
              disabled={guardando}
              className="flex min-h-[44px] items-center justify-center rounded-lg border border-line px-5 font-label-md text-label-md text-ink transition-colors hover:bg-page"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={guardando}
              className="flex min-h-[44px] items-center justify-center rounded-lg bg-primary-container px-6 font-label-md text-label-md font-bold text-white shadow-sm transition-all hover:bg-primary-container/90 active:scale-[0.98] disabled:opacity-50"
            >
              {guardando
                ? 'Guardando...'
                : esPendiente && rol !== 'No Asignado'
                  ? 'Habilitar y Guardar'
                  : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

