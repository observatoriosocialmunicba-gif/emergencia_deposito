import { etiquetaCorta, paletaEstado } from '../../lib/estados'
import type { ConteoEstado } from '../../lib/types'

interface Props {
  conteo: ConteoEstado
  activo: boolean
  /** ocupa las dos columnas en celular (cuando queda una tarjeta sola) */
  ancha?: boolean
  onSeleccionar: (estado: string | null) => void
}

export default function TarjetaEstado({ conteo, activo, ancha = false, onSeleccionar }: Props) {
  const paleta = paletaEstado(conteo.estado)

  return (
    <button
      type="button"
      aria-pressed={activo}
      onClick={() => onSeleccionar(conteo.estado)}
      className={`group relative flex min-h-[44px] flex-col justify-between overflow-hidden rounded-xl bg-white p-3 text-left transition-all active:scale-[0.98] md:p-4 ${
        ancha ? 'col-span-2 sm:col-span-1' : ''
      } ${
        activo
          ? 'border-2 border-success shadow-md ring-2 ring-success/20 md:border-[3px]'
          : 'border hover:shadow-md'
      }`}
      style={activo ? undefined : { borderColor: paleta.borde }}
    >
      {activo && (
        <span className="absolute right-0 top-0 rounded-bl bg-success px-2 py-0.5 text-[10px] font-bold text-white">
          ACTIVO
        </span>
      )}
      <div className="flex w-full items-center justify-between">
        <span
          className="rounded border px-2 py-0.5 font-label-sm text-label-sm"
          style={{ color: paleta.texto, backgroundColor: paleta.fondo, borderColor: paleta.borde }}
        >
          {etiquetaCorta(conteo.estado)}
        </span>
        {!activo && (
          <span className="size-3 rounded-full" style={{ backgroundColor: paleta.punto }} />
        )}
      </div>
      <div className="mt-3">
        <span
          className={`block font-headline-xl text-headline-xl leading-none ${
            activo ? 'text-primary-container' : 'text-ink'
          }`}
        >
          {conteo.cantidad ?? 0}
        </span>
        <span
          className={`mt-1 line-clamp-1 text-[13px] ${
            activo ? 'font-bold text-primary-container' : 'font-medium text-ink-soft'
          }`}
        >
          {conteo.estado}
        </span>
      </div>
    </button>
  )
}
