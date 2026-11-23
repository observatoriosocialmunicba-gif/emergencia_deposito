import { AlertCircle, Building2, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import type { Area } from '../../lib/types'

interface Props {
  area: Area | null
  areasExistentes: Area[]
  isOpen: boolean
  onCerrar: () => void
  onGuardar: (nombre: string) => Promise<void>
}

export default function ModalEditarArea({
  area,
  areasExistentes,
  isOpen,
  onCerrar,
  onGuardar,
}: Props) {
  const [nombre, setNombre] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [guardando, setGuardando] = useState(false)

  const esEdicion = area !== null

  useEffect(() => {
    if (isOpen) {
      setNombre(area ? area.nombre : '')
      setError(null)
      setGuardando(false)
    }
  }, [isOpen, area])

  if (!isOpen) return null

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    const limpio = nombre.trim()
    if (!limpio) {
      setError('El nombre del área es obligatorio.')
      return
    }

    if (limpio.length > 100) {
      setError('El nombre no puede superar los 100 caracteres.')
      return
    }

    // Validación sin distinguir mayúsculas
    const yaExiste = areasExistentes.some(
      (a) =>
        a.id !== area?.id &&
        a.nombre.trim().toLowerCase() === limpio.toLowerCase(),
    )

    if (yaExiste) {
      setError('Ya existe un área con ese nombre.')
      return
    }

    setGuardando(true)
    try {
      await onGuardar(limpio)
      onCerrar()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al guardar el área.'
      if (msg.includes('23505') || msg.toLowerCase().includes('ya existe')) {
        setError('Ya existe un área con ese nombre.')
      } else {
        setError(msg)
      }
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-area-titulo"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div
        className="fixed inset-0 bg-black/50 transition-opacity"
        onClick={onCerrar}
      />

      <div className="relative z-10 w-full max-w-lg overflow-hidden rounded-xl border border-line bg-white shadow-xl">
        {/* Cabecera del Modal */}
        <div className="flex items-center justify-between border-b border-line bg-panel px-6 py-4">
          <div className="flex items-center gap-2 text-primary">
            <Building2 size={20} />
            <h2
              id="modal-area-titulo"
              className="font-headline-sm text-headline-sm font-bold text-ink"
            >
              {esEdicion ? 'Editar Área' : 'Nueva Área'}
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

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          {error && (
            <div
              role="alert"
              className="flex items-start gap-2.5 rounded-lg border border-error bg-error-container/40 p-3 text-xs font-semibold text-error"
            >
              <AlertCircle size={18} className="shrink-0 text-error" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between">
              <label
                htmlFor="area-nombre"
                className="block font-body-md-bold text-body-md-bold text-on-surface"
              >
                Nombre del Área <span className="text-error">*</span>
              </label>
              <span className="font-label-sm text-xs text-on-surface-variant">
                {nombre.trim().length}/100
              </span>
            </div>
            <input
              id="area-nombre"
              type="text"
              autoFocus
              required
              maxLength={100}
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Dirección de Defensa Civil"
              className="mt-1.5 min-h-[44px] w-full rounded-lg border border-field bg-white px-3 font-body-md text-sm text-ink focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/20"
            />
            <p className="mt-1 text-xs text-on-surface-variant">
              Sin espacios sobrantes al inicio o al final. Máximo 100 caracteres.
            </p>
          </div>

          <div className="mt-6 flex flex-col-reverse justify-end gap-3 pt-3 sm:flex-row">
            <button
              type="button"
              onClick={onCerrar}
              disabled={guardando}
              className="flex min-h-[44px] items-center justify-center rounded-lg border border-line bg-white px-4 py-2 font-label-md text-sm font-semibold text-ink transition-colors hover:bg-page disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={guardando}
              className="flex min-h-[44px] items-center justify-center rounded-lg bg-primary-container px-5 py-2 font-label-md text-sm font-bold text-white shadow-xs transition-colors hover:bg-primary-container/90 disabled:opacity-50"
            >
              {guardando ? 'Guardando...' : esEdicion ? 'Guardar Cambios' : 'Crear Área'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
