import { AlertTriangle, Power, X } from 'lucide-react'
import type { AreaConConteo } from '../../lib/types'

interface Props {
  area: AreaConConteo | null
  isOpen: boolean
  confirmando: boolean
  onCerrar: () => void
  onConfirmar: () => Promise<void>
}

export default function ModalConfirmarEstadoArea({
  area,
  isOpen,
  confirmando,
  onCerrar,
  onConfirmar,
}: Props) {
  if (!isOpen || !area) return null

  const esDesactivar = area.activa

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-estado-area-titulo"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div
        className="fixed inset-0 bg-black/50 transition-opacity"
        onClick={onCerrar}
      />

      <div className="relative z-10 w-full max-w-md overflow-hidden rounded-xl border border-line bg-white shadow-xl">
        <div
          className={`flex items-center justify-between border-b border-line px-6 py-4 ${
            esDesactivar ? 'bg-error-container/30' : 'bg-surface-container'
          }`}
        >
          <div
            className={`flex items-center gap-2 ${
              esDesactivar ? 'text-error' : 'text-primary'
            }`}
          >
            {esDesactivar ? <AlertTriangle size={20} /> : <Power size={20} />}
            <h2
              id="modal-estado-area-titulo"
              className="font-headline-sm text-headline-sm font-bold text-ink"
            >
              {esDesactivar ? 'Desactivar Área' : 'Activar Área'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onCerrar}
            aria-label="Cerrar modal"
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-ink-soft hover:bg-page hover:text-ink focus:outline-none focus:ring-2 focus:ring-secondary"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4 p-6">
          <p className="font-body-md text-body-md text-ink">
            {esDesactivar ? (
              <>
                ¿Seguro que querés desactivar el área{' '}
                <strong className="text-ink">"{area.nombre}"</strong>?
              </>
            ) : (
              <>
                ¿Querés volver a activar el área{' '}
                <strong className="text-ink">"{area.nombre}"</strong>?
              </>
            )}
          </p>

          <p className="text-sm text-ink-soft">
            {esDesactivar
              ? 'Los usuarios y pedidos asociados se conservarán intactos en la base de datos. El área dejará de aparecer en los selectores de Solicitudes, Usuarios y Perfil.'
              : 'El área volverá a aparecer en los selectores de Solicitudes, Usuarios y Perfil para registrar pedidos y asignar personal.'}
          </p>

          <div className="mt-6 flex flex-col-reverse justify-end gap-3 pt-2 sm:flex-row">
            <button
              type="button"
              onClick={onCerrar}
              disabled={confirmando}
              className="flex min-h-[44px] items-center justify-center rounded-lg border border-line bg-white px-4 py-2 font-label-md text-sm font-semibold text-ink transition-colors hover:bg-page disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={onConfirmar}
              disabled={confirmando}
              className={`flex min-h-[44px] items-center justify-center rounded-lg px-5 py-2 font-label-md text-sm font-bold text-white shadow-xs transition-colors disabled:opacity-50 ${
                esDesactivar
                  ? 'bg-error hover:bg-error/90'
                  : 'bg-secondary hover:bg-secondary/90'
              }`}
            >
              {confirmando
                ? 'Procesando...'
                : esDesactivar
                  ? 'Desactivar Área'
                  : 'Activar Área'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
