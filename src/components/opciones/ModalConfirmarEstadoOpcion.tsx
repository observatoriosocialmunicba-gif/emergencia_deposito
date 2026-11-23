import { AlertCircle, AlertTriangle, CheckCircle2, X } from 'lucide-react'
import type { Opcion } from '../../lib/types'

interface ModalConfirmarEstadoOpcionProps {
  isOpen: boolean
  onClose: () => void
  opcion: Opcion | null
  onConfirmar: () => Promise<void>
  cargando: boolean
}

export function ModalConfirmarEstadoOpcion({
  isOpen,
  onClose,
  opcion,
  onConfirmar,
  cargando,
}: ModalConfirmarEstadoOpcionProps) {
  if (!isOpen || !opcion) return null

  const esDesactivar = opcion.activa
  const categoriaTexto = opcion.categoria === 'genero' ? 'género' : 'procedencia'

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-confirmar-estado-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
    >
      <div className="w-full max-w-md rounded-xl border border-line bg-white shadow-xl">
        {/* Cabecera */}
        <div className="flex items-center justify-between border-b border-line px-6 py-4">
          <div className="flex items-center gap-2">
            {esDesactivar ? (
              <AlertTriangle className="text-secondary" size={20} />
            ) : (
              <CheckCircle2 className="text-secondary" size={20} />
            )}
            <h2 id="modal-confirmar-estado-title" className="font-headline-sm text-lg font-bold text-ink">
              {esDesactivar ? `Desactivar opción de ${categoriaTexto}` : `Activar opción de ${categoriaTexto}`}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar confirmación"
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-ink-soft transition-colors hover:bg-page hover:text-ink focus:outline-none focus:ring-2 focus:ring-secondary"
          >
            <X size={20} />
          </button>
        </div>

        {/* Contenido */}
        <div className="p-6 space-y-4">
          <p className="font-body-md text-sm text-ink">
            {esDesactivar ? (
              <>
                ¿Estás seguro de que querés desactivar la opción{' '}
                <strong className="text-primary">{opcion.valor}</strong>?
              </>
            ) : (
              <>
                ¿Estás seguro de que querés activar la opción{' '}
                <strong className="text-primary">{opcion.valor}</strong>?
              </>
            )}
          </p>

          <div className="rounded-lg border border-line bg-surface-container/60 p-3.5 text-xs text-ink-soft space-y-1.5">
            <div className="flex items-center gap-1.5 font-body-md-bold text-ink">
              <AlertCircle size={15} className="shrink-0 text-secondary" />
              <span>Consecuencia de esta acción:</span>
            </div>
            {esDesactivar ? (
              <p>
                Los pedidos y personas que ya tengan asignada esta opción conservarán el dato histórico, pero dejará de ofrecerse para nuevas cargas o modificaciones.
              </p>
            ) : (
              <p>
                La opción volverá a estar disponible inmediatamente en los selectores de los formularios para todos los usuarios.
              </p>
            )}
          </div>

          {/* Acciones */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={cargando}
              className="inline-flex min-h-[44px] items-center justify-center rounded-lg border border-line px-4 py-2 font-label-md text-sm font-semibold text-ink transition-colors hover:bg-page disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={onConfirmar}
              disabled={cargando}
              className={`inline-flex min-h-[44px] items-center justify-center rounded-lg px-5 py-2 font-label-md text-sm font-bold text-white shadow-xs transition-colors disabled:opacity-50 ${
                esDesactivar
                  ? 'bg-secondary hover:bg-secondary/90'
                  : 'bg-primary-container hover:bg-primary-container/90'
              }`}
            >
              {cargando ? 'Procesando...' : esDesactivar ? 'Desactivar Opción' : 'Activar Opción'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
