import { Check, ChevronDown, MapPin, X } from 'lucide-react'
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import { normalizar } from '../../lib/texto'
import type { Barrio } from '../../lib/types'

export interface BarrioComboboxProps {
  id?: string
  value: string
  onChange: (nombreBarrio: string) => void
  barrios: Barrio[]
  disabled?: boolean
  required?: boolean
  placeholder?: string
  className?: string
}

export default function BarrioCombobox({
  id: idProp,
  value,
  onChange,
  barrios,
  disabled = false,
  required = false,
  placeholder = 'Buscar o seleccionar barrio...',
  className = '',
}: BarrioComboboxProps) {
  const generatedId = useId()
  const comboboxId = idProp ?? `barrio-combobox-${generatedId}`
  const listboxId = `${comboboxId}-listbox`

  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const listboxRef = useRef<HTMLUListElement>(null)

  const [textoBusqueda, setTextoBusqueda] = useState(value)
  const [abierto, setAbierto] = useState(false)
  const [indiceResaltado, setIndiceResaltado] = useState(-1)

  // Sincronizar el texto del input si `value` cambia externamente (ej: al cargar datos de edición)
  useEffect(() => {
    setTextoBusqueda(value)
  }, [value])

  // Filtrado y ordenamiento de barrios
  const resultados = useMemo(() => {
    const qNorm = normalizar(textoBusqueda)
    const palabras = qNorm.split(/\s+/).filter(Boolean)

    const filtrados = barrios.filter((b) => {
      const nombre = b.NombreBarrio
      if (!nombre) return false
      if (palabras.length === 0) return true
      const nombreNorm = normalizar(nombre)
      return palabras.every((p) => nombreNorm.includes(p))
    })

    filtrados.sort((a, b) => {
      const nomA = a.NombreBarrio ?? ''
      const nomB = b.NombreBarrio ?? ''
      const normA = normalizar(nomA)
      const normB = normalizar(nomB)

      if (qNorm) {
        const aEmpieza = normA.startsWith(qNorm)
        const bEmpieza = normB.startsWith(qNorm)
        if (aEmpieza && !bEmpieza) return -1
        if (!aEmpieza && bEmpieza) return 1
      }
      return nomA.localeCompare(nomB, 'es')
    })

    return filtrados.slice(0, 50)
  }, [barrios, textoBusqueda])

  // Scroll automático cuando cambia el índice resaltado con teclado
  useEffect(() => {
    if (abierto && indiceResaltado >= 0 && listboxRef.current) {
      const opcionEl = listboxRef.current.children[indiceResaltado] as HTMLElement | undefined
      opcionEl?.scrollIntoView({ block: 'nearest' })
    }
  }, [abierto, indiceResaltado])

  const seleccionar = useCallback((nombreExacto: string) => {
    onChange(nombreExacto)
    setTextoBusqueda(nombreExacto)
    setAbierto(false)
    setIndiceResaltado(-1)
  }, [onChange])

  const cerrarYReconciliar = useCallback(() => {
    setAbierto(false)
    setIndiceResaltado(-1)

    const busquedaNorm = normalizar(textoBusqueda)

    if (!busquedaNorm) {
      // Si borró todo, se limpia el valor
      onChange('')
      setTextoBusqueda('')
      return
    }

    // Si coincide exactamente (normalizado) con algún barrio existente, asignamos ese
    const coincidenciaExacta = barrios.find(
      (b) => b.NombreBarrio && normalizar(b.NombreBarrio) === busquedaNorm,
    )
    if (coincidenciaExacta?.NombreBarrio) {
      seleccionar(coincidenciaExacta.NombreBarrio)
      return
    }

    // Si el valor actual coincidía con un barrio existente o con un valor histórico previo,
    // pero el texto escrito no coincide con nada, revertir al valor actual para no guardar texto inválido.
    setTextoBusqueda(value)
  }, [barrios, onChange, seleccionar, textoBusqueda, value])

  // Cerrar al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        cerrarYReconciliar()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [cerrarYReconciliar])

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (disabled) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (!abierto) {
        setAbierto(true)
        setIndiceResaltado(0)
      } else {
        setIndiceResaltado((prev) => (prev < resultados.length - 1 ? prev + 1 : 0))
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (!abierto) {
        setAbierto(true)
        setIndiceResaltado(resultados.length - 1)
      } else {
        setIndiceResaltado((prev) => (prev > 0 ? prev - 1 : resultados.length - 1))
      }
    } else if (e.key === 'Enter') {
      if (abierto && indiceResaltado >= 0 && resultados[indiceResaltado]) {
        e.preventDefault()
        const seleccionado = resultados[indiceResaltado]?.NombreBarrio
        if (seleccionado) {
          seleccionar(seleccionado)
        }
      }
    } else if (e.key === 'Escape') {
      if (abierto) {
        e.preventDefault()
        setAbierto(false)
        setIndiceResaltado(-1)
        setTextoBusqueda(value)
      }
    } else if (e.key === 'Tab') {
      if (abierto) {
        cerrarYReconciliar()
      }
    }
  }

  function handleLimpiar() {
    onChange('')
    setTextoBusqueda('')
    setAbierto(true)
    setIndiceResaltado(-1)
    inputRef.current?.focus()
  }

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      <div className="relative flex items-center">
        <input
          ref={inputRef}
          id={comboboxId}
          type="text"
          role="combobox"
          aria-expanded={abierto}
          aria-autocomplete="list"
          aria-controls={listboxId}
          aria-activedescendant={
            abierto && indiceResaltado >= 0 ? `${comboboxId}-opt-${indiceResaltado}` : undefined
          }
          required={required && !value}
          disabled={disabled}
          value={textoBusqueda}
          placeholder={placeholder}
          autoComplete="off"
          onChange={(e) => {
            setTextoBusqueda(e.target.value)
            setAbierto(true)
            setIndiceResaltado(0)
          }}
          onFocus={() => {
            if (!disabled) {
              setAbierto(true)
            }
          }}
          onKeyDown={handleKeyDown}
          className="min-h-[46px] w-full rounded-lg border border-field bg-white pl-3.5 pr-24 font-body-md text-sm text-on-surface focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/20 disabled:bg-page disabled:text-outline"
        />

        {/* Acciones a la derecha del input */}
        <div className="absolute right-2 flex items-center gap-1">
          {textoBusqueda && !disabled && (
            <button
              type="button"
              onClick={handleLimpiar}
              aria-label="Borrar búsqueda de barrio"
              className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-md text-outline transition-colors hover:bg-page hover:text-ink focus:outline-none focus:ring-1 focus:ring-secondary"
            >
              <X size={16} />
            </button>
          )}

          <button
            type="button"
            tabIndex={-1}
            disabled={disabled}
            aria-label={abierto ? 'Cerrar lista de barrios' : 'Abrir lista de barrios'}
            onClick={() => {
              if (disabled) return
              if (abierto) {
                cerrarYReconciliar()
              } else {
                setAbierto(true)
                inputRef.current?.focus()
              }
            }}
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-md text-outline transition-colors hover:text-ink focus:outline-none"
          >
            <ChevronDown
              size={18}
              className={`transition-transform duration-200 ${abierto ? 'rotate-180 text-secondary' : ''}`}
            />
          </button>
        </div>
      </div>

      {/* Lista desplegable */}
      {abierto && !disabled && (
        <ul
          ref={listboxRef}
          id={listboxId}
          role="listbox"
          aria-label="Barrios disponibles"
          className="absolute z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-lg border border-line bg-white py-1 shadow-lg focus:outline-none"
        >
          {resultados.length === 0 ? (
            <li
              role="status"
              className="px-3.5 py-3 text-center font-body-md text-sm text-ink-soft"
            >
              No hay barrios que coincidan
            </li>
          ) : (
            resultados.map((b, idx) => {
              const nombre = b.NombreBarrio ?? ''
              const estaSeleccionado = nombre === value
              const estaResaltado = idx === indiceResaltado

              return (
                <li
                  key={b.id ?? idx}
                  id={`${comboboxId}-opt-${idx}`}
                  role="option"
                  aria-selected={estaSeleccionado}
                  onMouseEnter={() => setIndiceResaltado(idx)}
                  onMouseDown={(e) => {
                    // Prevenir el blur del input antes de registrar el clic
                    e.preventDefault()
                    seleccionar(nombre)
                  }}
                  className={`flex min-h-[44px] cursor-pointer items-center justify-between px-3.5 py-2.5 font-body-md text-sm transition-colors ${
                    estaResaltado
                      ? 'bg-secondary/10 font-semibold text-secondary'
                      : estaSeleccionado
                        ? 'bg-page font-semibold text-primary'
                        : 'text-on-surface hover:bg-page'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <MapPin size={16} className="shrink-0 text-outline" />
                    <span>{nombre}</span>
                  </div>
                  {estaSeleccionado && (
                    <Check size={16} className="shrink-0 text-secondary" />
                  )}
                </li>
              )
            })
          )}
        </ul>
      )}
    </div>
  )
}
