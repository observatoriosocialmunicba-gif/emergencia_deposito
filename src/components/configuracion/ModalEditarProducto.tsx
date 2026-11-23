import { AlertCircle, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { normalizar } from '../../lib/texto'
import type { Producto } from '../../lib/types'

interface ModalEditarProductoProps {
  isOpen: boolean
  onClose: () => void
  producto: Producto | null
  rubrosExistentes: string[]
  onGuardar: (rubro: string, necesidad: string) => Promise<void>
  productosExistentes: Producto[]
}

export function ModalEditarProducto({
  isOpen,
  onClose,
  producto,
  rubrosExistentes,
  onGuardar,
  productosExistentes,
}: ModalEditarProductoProps) {
  const [rubroSeleccionado, setRubroSeleccionado] = useState('')
  const [nuevoRubroTexto, setNuevoRubroTexto] = useState('')
  const [esNuevoRubro, setEsNuevoRubro] = useState(false)
  const [necesidad, setNecesidad] = useState('')
  const [errorLocal, setErrorLocal] = useState<string | null>(null)
  const [guardando, setGuardando] = useState(false)

  const esEdicion = Boolean(producto)

  useEffect(() => {
    if (isOpen) {
      setErrorLocal(null)
      setGuardando(false)
      if (producto) {
        const r = producto.rubro ?? ''
        setNecesidad(producto.necesidad ?? '')
        if (rubrosExistentes.includes(r)) {
          setRubroSeleccionado(r)
          setEsNuevoRubro(false)
          setNuevoRubroTexto('')
        } else {
          setRubroSeleccionado('__nuevo__')
          setEsNuevoRubro(true)
          setNuevoRubroTexto(r)
        }
      } else {
        setNecesidad('')
        if (rubrosExistentes.length > 0) {
          setRubroSeleccionado(rubrosExistentes[0])
          setEsNuevoRubro(false)
          setNuevoRubroTexto('')
        } else {
          setRubroSeleccionado('__nuevo__')
          setEsNuevoRubro(true)
          setNuevoRubroTexto('')
        }
      }
    }
  }, [isOpen, producto, rubrosExistentes])

  if (!isOpen) return null

  function handleCambioRubro(val: string) {
    if (val === '__nuevo__') {
      setRubroSeleccionado('__nuevo__')
      setEsNuevoRubro(true)
    } else {
      setRubroSeleccionado(val)
      setEsNuevoRubro(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrorLocal(null)

    const rubroFinal = esNuevoRubro ? nuevoRubroTexto.trim() : rubroSeleccionado.trim()
    const necesidadFinal = necesidad.trim()

    if (!rubroFinal) {
      setErrorLocal('El rubro es obligatorio.')
      return
    }
    if (!necesidadFinal) {
      setErrorLocal('La necesidad o producto es obligatoria.')
      return
    }

    if (rubroFinal.length > 100 || necesidadFinal.length > 100) {
      setErrorLocal('Los campos no pueden superar los 100 caracteres.')
      return
    }

    // Validación preventiva de duplicado (case-insensitive y sin acentos)
    const normRubro = normalizar(rubroFinal)
    const normNec = normalizar(necesidadFinal)

    const duplicado = productosExistentes.some((p) => {
      if (esEdicion && p.id === producto?.id) return false
      return normalizar(p.rubro ?? '') === normRubro && normalizar(p.necesidad ?? '') === normNec
    })

    if (duplicado) {
      setErrorLocal('Ya existe un producto con ese rubro y necesidad.')
      return
    }

    try {
      setGuardando(true)
      await onGuardar(rubroFinal, necesidadFinal)
      onClose()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al guardar el producto.'
      setErrorLocal(msg)
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-producto-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
    >
      <div className="w-full max-w-md rounded-xl border border-line bg-white shadow-xl">
        {/* Cabecera */}
        <div className="flex items-center justify-between border-b border-line px-6 py-4">
          <h2 id="modal-producto-title" className="font-headline-sm text-lg font-bold text-ink">
            {esEdicion ? 'Editar Producto / Necesidad' : 'Nuevo Producto / Necesidad'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar modal de producto"
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

          {/* Campo Rubro */}
          <div className="space-y-1.5">
            <label htmlFor="rubro_select" className="block font-body-md-bold text-xs text-ink">
              Rubro <span className="text-error">*</span>
            </label>
            <select
              id="rubro_select"
              value={rubroSeleccionado}
              onChange={(e) => handleCambioRubro(e.target.value)}
              className="min-h-[46px] w-full rounded-lg border border-field bg-white px-3.5 font-body-md text-sm text-ink focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/20"
            >
              {rubrosExistentes.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
              <option value="__nuevo__">+ Nuevo rubro...</option>
            </select>
          </div>

          {/* Campo Nuevo Rubro si corresponde */}
          {esNuevoRubro && (
            <div className="space-y-1.5">
              <label htmlFor="nuevo_rubro_input" className="block font-body-md-bold text-xs text-ink">
                Nombre del nuevo rubro <span className="text-error">*</span>
              </label>
              <input
                id="nuevo_rubro_input"
                type="text"
                required
                maxLength={100}
                value={nuevoRubroTexto}
                onChange={(e) => setNuevoRubroTexto(e.target.value)}
                placeholder="Ej: Electrodomésticos"
                className="min-h-[46px] w-full rounded-lg border border-field bg-white px-3.5 font-body-md text-sm text-ink focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/20"
                autoFocus
              />
            </div>
          )}

          {/* Campo Necesidad / Producto */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="necesidad_input" className="block font-body-md-bold text-xs text-ink">
                Necesidad / Artículo <span className="text-error">*</span>
              </label>
              <span className="font-body-md text-xs text-ink-soft">
                {necesidad.trim().length}/100
              </span>
            </div>
            <input
              id="necesidad_input"
              type="text"
              required
              maxLength={100}
              value={necesidad}
              onChange={(e) => setNecesidad(e.target.value)}
              placeholder="Ej: Frazadas 2 plazas"
              className="min-h-[46px] w-full rounded-lg border border-field bg-white px-3.5 font-body-md text-sm text-ink focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/20"
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
              disabled={
                guardando ||
                !necesidad.trim() ||
                (esNuevoRubro && !nuevoRubroTexto.trim())
              }
              className="inline-flex min-h-[44px] items-center justify-center rounded-lg bg-primary-container px-5 py-2 font-label-md text-sm font-bold text-white shadow-xs transition-colors hover:bg-primary-container/90 disabled:opacity-50"
            >
              {guardando ? 'Guardando...' : esEdicion ? 'Guardar Cambios' : 'Crear Producto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
