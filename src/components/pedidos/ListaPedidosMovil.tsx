import { formatFecha, paletaEstado } from '../../lib/estados'
import type { Pedido } from '../../lib/types'
import ChipEstado from './ChipEstado'
import { BotonVerPedido } from './TablaPedidos'

/** Tarjetas para celular y tablet (debajo del breakpoint lg). */
export default function ListaPedidosMovil({ filas }: { filas: Pedido[] }) {
  return (
    <ul className="space-y-3 lg:hidden">
      {filas.map((p) => {
        const paleta = paletaEstado(p.estado)
        const etiqueta =
          p.estado === 'Asignado' && p.nombreVehiculo
            ? `Asignado a ${p.nombreVehiculo}`
            : (p.estado ?? '-')
        return (
          <li
            key={p.id}
            className="space-y-3 rounded-xl border border-l-[6px] border-line bg-white p-4 shadow-sm"
            style={{ borderLeftColor: paleta.punto }}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <ChipEstado estado={p.estado} etiqueta={etiqueta} />
                <h3 className="mt-1.5 font-body-lg-bold text-body-lg-bold text-ink">
                  {p.nombreCompleto ?? '-'}
                </h3>
                <p className="font-mono text-sm text-ink-soft">DNI: {p.dni ?? '-'}</p>
              </div>
              <span className="shrink-0 rounded bg-page px-2 py-1 text-sm font-medium text-ink-soft">
                {formatFecha(p.fecha)}
              </span>
            </div>

            <div className="space-y-1 rounded-lg border border-line bg-panel p-2.5 text-sm text-ink">
              <p>
                <strong className="text-primary-container">Ubicación:</strong>{' '}
                {[p.barrio, p.direccion].filter(Boolean).join(' — ') || '-'}
              </p>
              <p>
                <strong className="text-primary-container">Procedencia:</strong>{' '}
                {p.procedencia ?? '-'}
              </p>
              <p>
                <strong className="text-primary-container">Observaciones:</strong>{' '}
                {p.observaciones || '-'}
              </p>
            </div>

            <BotonVerPedido id={p.id} grande />
          </li>
        )
      })}
    </ul>
  )
}
