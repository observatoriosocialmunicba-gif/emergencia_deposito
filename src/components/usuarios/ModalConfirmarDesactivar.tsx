import { AlertTriangle, X } from 'lucide-react'
import type { Usuario } from '../../lib/types'

interface Props {
  usuario: Usuario | null
  isOpen: boolean
  confirmando: boolean
  onCerrar: () => void
  onConfirmar: () => Promise<void>
}

export default function ModalConfirmarDesactivar({
  usuario,
  isOpen,
  confirmando,
  onCerrar,
  onConfirmar,
}: Props) {
  if (!isOpen || !usuario) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-desactivar-titulo"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div
        className="fixed inset-0 bg-black/50 transition-opacity"
        onClick={onCerrar}
      />

      <div className="relative z-10 w-full max-w-md overflow-hidden rounded-xl border border-line bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-line bg-error-container/30 px-6 py-4">
          <div className="flex items-center gap-2 text-error">
            <AlertTriangle size={20} />
            <h2
              id="modal-desactivar-titulo"
              className="font-headline-sm text-headline-sm font-bold text-ink"
            >
              Desactivar Usuario
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

        <div className="space-y-4 p-6">
          <p className="font-body-md text-body-md text-ink">
            ¿Seguro que querés desactivar al usuario{' '}
            <strong className="text-ink">
              {usuario.nombreCompleto || 'este usuario'}
            </strong>
            ?
          </p>
          <p className="text-sm text-ink-soft">
            La persona no podrá ingresar a la aplicación hasta que sea habilitada
            nuevamente por un administrador.
          </p>

          <div className="mt-6 flex flex-col-reverse justify-end gap-3 pt-2 sm:flex-row">
            <button
              type="button"
              onClick={onCerrar}
              disabled={confirmando}
              className="flex min-h-[44px] items-center justify-center rounded-lg border border-line px-5 font-label-md text-label-md text-ink transition-colors hover:bg-page"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={onConfirmar}
              disabled={confirmando}
              className="flex min-h-[44px] items-center justify-center rounded-lg bg-danger px-6 font-label-md text-label-md font-bold text-white shadow-sm transition-all hover:bg-danger/90 active:scale-[0.98] disabled:opacity-50"
            >
              {confirmando ? 'Desactivando...' : 'Sí, desactivar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

