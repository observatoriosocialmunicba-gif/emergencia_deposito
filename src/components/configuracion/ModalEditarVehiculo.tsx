import { AlertCircle, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { normalizar } from '../../lib/texto'
import type { Vehiculo } from '../../lib/types'

interface ModalEditarVehiculoProps {
  isOpen: boolean
  onClose: () => void
  vehiculo: Vehiculo | null
  onGuardar: (datos: {
    nombre: string
    tipoVehiculo?: string | null
    patente?: string | null
  }) => Promise<void>
  vehiculosExistentes: Vehiculo[]
}

export function ModalEditarVehiculo({
  isOpen,
  onClose,
  vehiculo,
  onGuardar,
  vehiculosExistentes,
}: ModalEditarVehiculoProps) {
  const [nombre, setNombre] = useState('')
  const [tipoVehiculo, setTipoVehiculo] = useState('')
  const [patente, setPatente] = useState('')
  const [errorLocal, setErrorLocal] = useState<string | null>(null)
  const [guardando, setGuardando] = useState(false)

  const esEdicion = Boolean(vehiculo)

  useEffect(() => {
    if (isOpen) {
      setErrorLocal(null)
      setGuardando(false)
      if (vehiculo) {
        setNombre(vehiculo.Nombre ?? '')
        setTipoVehiculo(vehiculo.tipoVehiculo ?? '')
        setPatente(vehiculo.patente ?? '')
      } else {
        setNombre('')
        setTipoVehiculo('')
        setPatente('')
      }
    }
  }, [isOpen, vehiculo])

  if (!isOpen) return null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrorLocal(null)

    const nombreLimpio = nombre.trim()
    if (!nombreLimpio) {
      setErrorLocal('El nombre o identificación del vehículo es obligatorio.')
      return
    }

    if (nombreLimpio.length > 100) {
      setErrorLocal('El nombre del vehículo no puede superar los 100 caracteres.')
      return
    }

    // Validación preventiva de duplicados
    const normNuevo = normalizar(nombreLimpio)
    const duplicado = vehiculosExistentes.some((v) => {
      if (esEdicion && v.idVehiculo === vehiculo?.idVehiculo) return false
      return normalizar(v.Nombre ?? '') === normNuevo
    })

    if (duplicado) {
      setErrorLocal('Ya existe un vehículo con ese nombre.')
      return
    }

    try {
      setGuardando(true)
      await onGuardar({
        nombre: nombreLimpio,
        tipoVehiculo: tipoVehiculo.trim() || null,
        patente: patente.trim() || null,
      })
      onClose()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al guardar el vehículo.'
      setErrorLocal(msg)
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-vehiculo-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
    >
      <div className="w-full max-w-md rounded-xl border border-line bg-white shadow-xl">
        {/* Cabecera */}
        <div className="flex items-center justify-between border-b border-line px-6 py-4">
          <h2 id="modal-vehiculo-title" className="font-headline-sm text-lg font-bold text-ink">
            {esEdicion ? 'Editar Vehículo' : 'Nuevo Vehículo'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar modal de vehículo"
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

          {/* Campo Nombre */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="nombre_vehiculo_input" className="block font-body-md-bold text-xs text-ink">
                Nombre o Identificación <span className="text-error">*</span>
              </label>
              <span className="font-body-md text-xs text-ink-soft">
                {nombre.trim().length}/100
              </span>
            </div>
            <input
              id="nombre_vehiculo_input"
              type="text"
              required
              maxLength={100}
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Camión 1, Kangoo Logística"
              className="min-h-[46px] w-full rounded-lg border border-field bg-white px-3.5 font-body-md text-sm text-ink focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/20"
              autoFocus
            />
          </div>

          {/* Tipo de Vehículo */}
          <div className="space-y-1.5">
            <label htmlFor="tipo_vehiculo_input" className="block font-body-md-bold text-xs text-ink">
              Tipo de Vehículo (opcional)
            </label>
            <input
              id="tipo_vehiculo_input"
              type="text"
              value={tipoVehiculo}
              onChange={(e) => setTipoVehiculo(e.target.value)}
              placeholder="Ej: Camión, Utilitario, Furgón"
              className="min-h-[46px] w-full rounded-lg border border-field bg-white px-3.5 font-body-md text-sm text-ink focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/20"
            />
          </div>

          {/* Patente */}
          <div className="space-y-1.5">
            <label htmlFor="patente_input" className="block font-body-md-bold text-xs text-ink">
              Patente / Dominio (opcional)
            </label>
            <input
              id="patente_input"
              type="text"
              value={patente}
              onChange={(e) => setPatente(e.target.value)}
              placeholder="Ej: AE 123 CD"
              className="min-h-[46px] w-full rounded-lg border border-field bg-white px-3.5 font-mono text-sm text-ink uppercase focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/20"
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
              disabled={guardando || !nombre.trim()}
              className="inline-flex min-h-[44px] items-center justify-center rounded-lg bg-primary-container px-5 py-2 font-label-md text-sm font-bold text-white shadow-xs transition-colors hover:bg-primary-container/90 disabled:opacity-50"
            >
              {guardando ? 'Guardando...' : esEdicion ? 'Guardar Cambios' : 'Crear Vehículo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
