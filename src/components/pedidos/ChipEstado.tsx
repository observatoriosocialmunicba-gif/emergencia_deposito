import {
  Ban,
  CheckCircle2,
  CircleHelp,
  Clock,
  ClipboardList,
  PackageX,
  Truck,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { paletaEstado } from '../../lib/estados'

const ICONOS: Record<string, LucideIcon> = {
  'Pendiente de Autorización': Clock,
  'Para Asignar': ClipboardList,
  Asignado: Truck,
  Entregado: CheckCircle2,
  'No Entregado': PackageX,
  Rechazado: Ban,
}

/** Chip con ícono y color según el estado del pedido. */
export default function ChipEstado({
  estado,
  etiqueta,
}: {
  estado: string | null
  /** texto a mostrar si es distinto del estado (por ejemplo "Asignado a Camión 3") */
  etiqueta?: string
}) {
  const paleta = paletaEstado(estado)
  const Icono = ICONOS[estado ?? ''] ?? CircleHelp
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold"
      style={{
        color: paleta.texto,
        backgroundColor: paleta.fondo,
        borderColor: paleta.borde,
      }}
    >
      <Icono size={14} aria-hidden="true" className="shrink-0" />
      {etiqueta ?? estado ?? '-'}
    </span>
  )
}
