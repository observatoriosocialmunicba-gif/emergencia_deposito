import { AlertCircle, Info, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { normalizar } from '../../lib/texto'
import type { Barrio } from '../../lib/types'

interface ModalEditarBarrioProps {
  isOpen: boolean
  onClose: () => void
  barrio: Barrio | null
  onGuardar: (datos: {
    nombre: string
    lat?: string | null
    long?: string | null
  }) => Promise<void>
  barriosExistentes: Barrio[]
}

export function ModalEditarBarrio({
  isOpen,
  onClose,
  barrio,
  onGuardar,
  barriosExistentes,
}: ModalEditarBarrioProps) {
  const [nombre, setNombre] = useState('')
  const [lat, setLat] = useState('')
  const [long, setLong] = useState('')
  const [errorLocal, setErrorLocal] = useState<string | null>(null)
  const [guardando, setGuardando] = useState(false)

  const esEdicion = Boolean(barrio)

  useEffect(() => {
    if (isOpen) {
      setErrorLocal(null)
      setGuardando(false)
      if (barrio) {
        setNombre(barrio.NombreBarrio ?? '')
        setLat(barrio.Lat ?? '')
        setLong(barrio.Long ?? '')
      } else {
        setNombre('')
        setLat('')
        setLong('')
      }
    }
  }, [isOpen, barrio])

  if (!isOpen) return null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrorLocal(null)

    const nombreLimpio = nombre.trim()
    if (!nombreLimpio) {
      setErrorLocal('El nombre del barrio es obligatorio.')
      return
    }

    if (nombreLimpio.length > 100) {
      setErrorLocal('El nombre del barrio no puede superar los 100 caracteres.')
      return
    }

    // Validación preventiva de duplicados (insensible a mayúsculas y acentos)
    const normNuevo = normalizar(nombreLimpio)
    const duplicado = barriosExistentes.some((b) => {
      if (esEdicion && b.id === barrio?.id) return false
      return normalizar(b.NombreBarrio ?? '') === normNuevo
    })

    if (duplicado) {
      setErrorLocal('Ya existe un barrio con ese nombre.')
      return
    }

    try {
      setGuardando(true)
      await onGuardar({
        nombre: nombreLimpio,
        lat: lat.trim() || null,
        long: long.trim() || null,
      })
      onClose()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al guardar el barrio.'
      setErrorLocal(msg)
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-barrio-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
    >
      <div className="w-full max-w-md rounded-xl border border-line bg-white shadow-xl">
        {/* Cabecera */}
        <div className="flex items-center justify-between border-b border-line px-6 py-4">
          <h2 id="modal-barrio-title" className="font-headline-sm text-lg font-bold text-ink">
            {esEdicion ? 'Editar Barrio' : 'Nuevo Barrio'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar modal de barrio"
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

          {/* Aviso al renombrar */}
          {esEdicion && (
            <div className="flex items-start gap-2 rounded-lg border border-secondary/30 bg-secondary/5 p-3 text-xs text-ink">
              <Info size={16} className="mt-0.5 shrink-0 text-secondary" />
              <p>Los pedidos ya cargados conservan el nombre anterior.</p>
            </div>
          )}

          {/* Campo Nombre */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="nombre_barrio_input" className="block font-body-md-bold text-xs text-ink">
                Nombre del Barrio <span className="text-error">*</span>
              </label>
              <span className="font-body-md text-xs text-ink-soft">
                {nombre.trim().length}/100
              </span>
            </div>
            <input
              id="nombre_barrio_input"
              type="text"
              required
              maxLength={100}
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: ALBERDI"
              className="min-h-[46px] w-full rounded-lg border border-field bg-white px-3.5 font-body-md text-sm text-ink focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/20"
              autoFocus
            />
          </div>

          {/* Coordenadas opcionales */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label htmlFor="lat_input" className="block font-body-md-bold text-xs text-ink">
                Latitud (opcional)
              </label>
              <input
                id="lat_input"
                type="text"
                value={lat}
                onChange={(e) => setLat(e.target.value)}
                placeholder="Ej: -31.4201"
                className="min-h-[46px] w-full rounded-lg border border-field bg-white px-3.5 font-mono text-sm text-ink focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/20"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="long_input" className="block font-body-md-bold text-xs text-ink">
                Longitud (opcional)
              </label>
              <input
                id="long_input"
                type="text"
                value={long}
                onChange={(e) => setLong(e.target.value)}
                placeholder="Ej: -64.1888"
                className="min-h-[46px] w-full rounded-lg border border-field bg-white px-3.5 font-mono text-sm text-ink focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/20"
              />
            </div>
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
              disabled={guardando || !nombre.trim()}
              className="inline-flex min-h-[44px] items-center justify-center rounded-lg bg-primary-container px-5 py-2 font-label-md text-sm font-bold text-white shadow-xs transition-colors hover:bg-primary-container/90 disabled:opacity-50"
            >
              {guardando ? 'Guardando...' : esEdicion ? 'Guardar Cambios' : 'Crear Barrio'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
