import { AlertCircle, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { normalizar } from '../../lib/texto'
import type { CategoriaOpcion, Opcion } from '../../lib/types'

interface ModalEditarOpcionProps {
  isOpen: boolean
  onClose: () => void
  opcion: Opcion | null
  categoria: CategoriaOpcion
  onGuardar: (valor: string) => Promise<void>
  opcionesExistentes: Opcion[]
}

export function ModalEditarOpcion({
  isOpen,
  onClose,
  opcion,
  categoria,
  onGuardar,
  opcionesExistentes,
}: ModalEditarOpcionProps) {
  const [valor, setValor] = useState('')
  const [errorLocal, setErrorLocal] = useState<string | null>(null)
  const [guardando, setGuardando] = useState(false)

  const esEdicion = Boolean(opcion)
  const categoriaTexto = categoria === 'genero' ? 'Género' : 'Procedencia'

  useEffect(() => {
    if (isOpen) {
      setValor(opcion?.valor ?? '')
      setErrorLocal(null)
      setGuardando(false)
    }
  }, [isOpen, opcion])

  if (!isOpen) return null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrorLocal(null)

    const valorLimpio = valor.trim()
    if (!valorLimpio) {
      setErrorLocal('El valor de la opción no puede estar vacío.')
      return
    }

    if (valorLimpio.length > 100) {
      setErrorLocal('El valor de la opción no puede superar los 100 caracteres.')
      return
    }

    // Validación de duplicados (insensible a mayúsculas y acentos)
    const normNuevo = normalizar(valorLimpio)
    const duplicado = opcionesExistentes.some((o) => {
      if (esEdicion && o.id === opcion?.id) return false
      return normalizar(o.valor) === normNuevo
    })

    if (duplicado) {
      setErrorLocal('Ya existe una opción con ese nombre.')
      return
    }

    try {
      setGuardando(true)
      await onGuardar(valorLimpio)
      onClose()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al guardar la opción.'
      setErrorLocal(msg)
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-opcion-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
    >
      <div className="w-full max-w-md rounded-xl border border-line bg-white shadow-xl">
        {/* Cabecera del modal */}
        <div className="flex items-center justify-between border-b border-line px-6 py-4">
          <h2 id="modal-opcion-title" className="font-headline-sm text-lg font-bold text-ink">
            {esEdicion ? `Editar Opción de ${categoriaTexto}` : `Nueva Opción de ${categoriaTexto}`}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar modal de opción"
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-ink-soft transition-colors hover:bg-page hover:text-ink focus:outline-none focus:ring-2 focus:ring-secondary"
          >
            <X size={20} />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorLocal && (
            <div
              role="alert"
              className="flex items-start gap-2.5 rounded-lg border border-error bg-error-container/40 p-3 text-sm font-semibold text-error"
            >
              <AlertCircle size={18} className="mt-0.5 shrink-0" />
              <span>{errorLocal}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label
                htmlFor="nombre_opcion_input"
                className="block font-body-md-bold text-xs text-ink"
              >
                Nombre / Valor de la opción <span className="text-error">*</span>
              </label>
              <span className="font-body-md text-xs text-ink-soft">
                {valor.trim().length}/100
              </span>
            </div>
            <input
              id="nombre_opcion_input"
              type="text"
              required
              maxLength={100}
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              placeholder={`Ej: ${categoria === 'genero' ? 'No binario' : 'Defensoría'}`}
              className="min-h-[46px] w-full rounded-lg border border-field bg-white px-3.5 font-body-md text-sm text-ink focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/20"
              autoFocus
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              disabled={guardando}
              className="inline-flex min-h-[44px] items-center justify-center rounded-lg border border-line px-4 py-2 font-label-md text-sm font-semibold text-ink transition-colors hover:bg-page disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={guardando || !valor.trim()}
              className="inline-flex min-h-[44px] items-center justify-center rounded-lg bg-primary-container px-5 py-2 font-label-md text-sm font-bold text-white shadow-xs transition-colors hover:bg-primary-container/90 disabled:opacity-50"
            >
              {guardando ? 'Guardando...' : esEdicion ? 'Guardar Cambios' : 'Crear Opción'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
