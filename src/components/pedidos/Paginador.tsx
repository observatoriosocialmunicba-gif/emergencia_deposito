import { ChevronLeft, ChevronRight } from 'lucide-react'

interface Props {
  /** índice de página actual, empezando en 0 */
  pagina: number
  ultimaPagina: number
  desde: number
  hasta: number
  total: number
  onCambiar: (pagina: number) => void
}

// 1 … 4 5 6 … 33: primera, última y la ventana alrededor de la actual.
function paginasVisibles(actual: number, ultima: number): Array<number | '…'> {
  const set = new Set([0, ultima, actual - 1, actual, actual + 1])
  const orden = [...set].filter((p) => p >= 0 && p <= ultima).sort((a, b) => a - b)
  const salida: Array<number | '…'> = []
  orden.forEach((p, i) => {
    if (i > 0 && p - orden[i - 1] > 1) salida.push('…')
    salida.push(p)
  })
  return salida
}

const boton =
  'flex min-h-[44px] items-center justify-center rounded-lg border font-label-md text-label-md transition-colors disabled:cursor-not-allowed disabled:opacity-40'
const botonNormal = 'border-field bg-white hover:bg-page'
const botonActivo = 'border-primary-container bg-primary-container text-white shadow-sm'

export default function Paginador({ pagina, ultimaPagina, desde, hasta, total, onCambiar }: Props) {
  return (
    <div className="flex flex-col items-center justify-between gap-3 border-t border-line bg-panel p-space-md sm:flex-row">
      <p className="text-body-md text-ink-soft">
        Mostrando{' '}
        <span className="font-semibold text-ink">
          {desde}–{hasta}
        </span>{' '}
        de <span className="font-semibold text-ink">{total} pedidos</span>
      </p>

      <div className="flex flex-wrap items-center justify-center gap-1">
        <button
          type="button"
          disabled={pagina === 0}
          onClick={() => onCambiar(pagina - 1)}
          className={`${boton} ${botonNormal} gap-1 px-3 py-1.5 text-ink-soft`}
        >
          <ChevronLeft size={16} />
          Anterior
        </button>

        {paginasVisibles(pagina, ultimaPagina).map((p, i) =>
          p === '…' ? (
            <span key={`gap-${i}`} className="px-2 text-outline">
              …
            </span>
          ) : (
            <button
              key={p}
              type="button"
              aria-current={p === pagina ? 'page' : undefined}
              onClick={() => onCambiar(p)}
              className={`${boton} min-w-[44px] ${
                p === pagina ? botonActivo : `${botonNormal} text-ink`
              }`}
            >
              {p + 1}
            </button>
          ),
        )}

        <button
          type="button"
          disabled={pagina >= ultimaPagina}
          onClick={() => onCambiar(pagina + 1)}
          className={`${boton} ${botonNormal} gap-1 px-3 py-1.5 text-ink`}
        >
          Siguiente
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  )
}
