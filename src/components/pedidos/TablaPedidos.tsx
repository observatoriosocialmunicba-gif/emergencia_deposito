import { Eye } from 'lucide-react'
import { Link } from 'react-router-dom'
import { formatFecha, paletaEstado } from '../../lib/estados'
import type { Pedido } from '../../lib/types'

const COLUMNAS = [
  'Fecha',
  'Apellido y Nombre',
  'DNI',
  'Ref. Ubicación',
  'Procedencia',
  'Observaciones',
  'Últ. Edición',
  'Acciones',
]

export function BotonVerPedido({ id, grande = false }: { id: number; grande?: boolean }) {
  return (
    <Link
      to={`/ver-pedido/${id}`}
      className={`inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary-container font-label-md text-label-md text-white shadow-sm transition-all hover:bg-primary-container/90 active:scale-[0.98] ${
        grande ? 'min-h-[48px] w-full gap-2 font-label-lg text-label-lg' : 'min-h-[44px] px-3.5 py-1.5'
      }`}
    >
      <Eye size={grande ? 20 : 16} />
      Ver Pedido
    </Link>
  )
}

/** Tabla de escritorio (desde el breakpoint lg). */
export default function TablaPedidos({
  filas,
  mostrarEstado = false,
}: {
  filas: Pedido[]
  mostrarEstado?: boolean
}) {
  const columnas = mostrarEstado
    ? [
        'Fecha',
        'Apellido y Nombre',
        'DNI',
        'Estado',
        'Ref. Ubicación',
        'Procedencia',
        'Observaciones',
        'Últ. Edición',
        'Acciones',
      ]
    : COLUMNAS

  return (
    <div className="custom-scrollbar hidden overflow-x-auto lg:block">
      <table className="w-full border-collapse text-left">
        <thead>
          <tr className="bg-primary-container font-headline-sm text-[13px] uppercase tracking-wider text-white">
            {columnas.map((c, i) => (
              <th
                key={c}
                scope="col"
                className={`px-4 py-3.5 font-bold ${i >= columnas.length - 2 ? 'text-center' : ''}`}
              >
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-line text-ink">
          {filas.map((p, i) => {
            const paleta = paletaEstado(p.estado)
            return (
              <tr
                key={p.id}
                className={`transition-colors hover:bg-page ${i % 2 === 0 ? 'bg-white' : 'bg-panel'}`}
              >
                <td className="whitespace-nowrap px-4 py-3.5 font-body-md-bold text-body-md-bold">
                  {formatFecha(p.fecha)}
                </td>
                <td className="px-4 py-3.5 font-body-md-bold text-body-md-bold">
                  {p.nombreCompleto ?? '-'}
                </td>
                <td className="whitespace-nowrap px-4 py-3.5 font-mono text-sm">{p.dni ?? '-'}</td>
                {mostrarEstado && (
                  <td className="whitespace-nowrap px-4 py-3.5">
                    <span
                      className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-label-sm text-label-sm"
                      style={{
                        color: paleta.texto,
                        backgroundColor: paleta.fondo,
                        borderColor: paleta.borde,
                      }}
                    >
                      <span
                        className="size-1.5 rounded-full"
                        style={{ backgroundColor: paleta.punto }}
                      />
                      {p.estado ?? '-'}
                    </span>
                  </td>
                )}
                <td className="px-4 py-3.5">
                  <div className="font-medium">{p.barrio ?? '-'}</div>
                  {p.direccion && <span className="block text-xs text-ink-soft">{p.direccion}</span>}
                </td>
                <td className="px-4 py-3.5">
                  {p.procedencia ? (
                    <span className="inline-flex rounded border border-outline-variant bg-surface-container px-2 py-0.5 text-xs font-semibold text-primary-container">
                      {p.procedencia}
                    </span>
                  ) : (
                    '-'
                  )}
                </td>
                <td className="max-w-xs px-4 py-3.5">
                  <p className="line-clamp-2 text-xs">{p.observaciones || '-'}</p>
                </td>
                <td className="whitespace-nowrap px-4 py-3.5 text-center text-xs text-ink-soft">
                  {p.ultModificacion ?? '-'}
                </td>
                <td className="whitespace-nowrap px-4 py-3.5 text-center">
                  <BotonVerPedido id={p.id} />
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
