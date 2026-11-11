import type { Ref } from 'react'
import logo from '../../assets/logo.png'
import { formatFecha } from '../../lib/estados'
import type { PedidoCompleto } from '../../lib/types'

// Hoja de impresión del pedido: compacta, en blanco y negro, pensada para entrar en una
// sola hoja A4. En pantalla no se ve (`hidden`); solo aparece al imprimir o dentro del modal de vista previa.

/** Los pedidos viejos traen basura como "." o "-" en vez de dato: se trata como vacío. */
function limpio(valor: string | null | undefined): string {
  const v = (valor ?? '').trim()
  return /^[\s.,\-_]*$/.test(v) ? '' : v
}

function Dato({ etiqueta, valor }: { etiqueta: string; valor: string | null | undefined }) {
  return (
    <div className="min-w-0">
      <dt className="text-[8px] font-semibold uppercase tracking-wide text-gray-500">{etiqueta}</dt>
      <dd className="break-words text-[11px] font-medium leading-tight text-black">
        {limpio(valor) || '—'}
      </dd>
    </div>
  )
}

function Titulo({ children }: { children: string }) {
  return (
    <h2 className="mb-1 border-b border-black pb-0.5 text-[9px] font-bold uppercase tracking-wider text-black">
      {children}
    </h2>
  )
}

export default function HojaPedido({
  pedido,
  enModal = false,
  hojaRef,
}: {
  pedido: PedidoCompleto
  enModal?: boolean
  hojaRef?: Ref<HTMLElement>
}) {
  const detalles = pedido.detalles
  const hayEntrega = [pedido.entregador, pedido.nombreVehiculo, pedido.fechaEntrega, pedido.obsEntrerga].some(
    (v) => limpio(v),
  )

  return (
    <article
      ref={hojaRef}
      className={`break-inside-avoid text-black bg-white ${
        enModal ? 'block' : 'hidden print:block'
      }`}
    >
      {/* Encabezado */}
      <header className="flex items-center justify-between gap-4 border-b-2 border-black pb-2">
        <div className="flex items-center gap-3">
          <img src={logo} alt="" className="size-11 object-contain" />
          <div>
            <h1 className="text-[18px] font-bold leading-none">Pedido Nº {pedido.id}</h1>
            <p className="mt-1 text-[10px] text-gray-700">
              Secretaría de Políticas Sociales y Desarrollo Humano
            </p>
          </div>
        </div>
        <dl className="grid grid-cols-2 gap-x-5 text-right">
          <Dato etiqueta="Estado" valor={pedido.estado} />
          <Dato etiqueta="Fecha de solicitud" valor={formatFecha(pedido.fecha)} />
        </dl>
      </header>

      {/* Beneficiario y ubicación */}
      <section className="mt-3 grid grid-cols-2 gap-x-6">
        <div>
          <Titulo>Beneficiario</Titulo>
          <dl className="grid grid-cols-2 gap-x-3 gap-y-1.5">
            <div className="col-span-2">
              <Dato etiqueta="Nombre y apellido" valor={pedido.nombreCompleto} />
            </div>
            <Dato etiqueta="DNI" valor={pedido.dni} />
            <Dato etiqueta="Teléfono" valor={pedido.telefono} />
            <Dato
              etiqueta="Persona con discapacidad"
              valor={pedido.discapacidad == null ? null : pedido.discapacidad ? 'Sí' : 'No'}
            />
          </dl>
        </div>
        <div>
          <Titulo>Ubicación</Titulo>
          <dl className="grid grid-cols-2 gap-x-3 gap-y-1.5">
            <Dato etiqueta="Barrio" valor={pedido.barrio} />
            <Dato etiqueta="Dirección" valor={pedido.direccion} />
            <div className="col-span-2">
              <Dato etiqueta="Coordenadas" valor={pedido.coordenadas} />
            </div>
          </dl>
        </div>
      </section>

      {/* Origen del pedido */}
      <section className="mt-3">
        <Titulo>Solicitud</Titulo>
        <dl className="grid grid-cols-3 gap-x-3 gap-y-1.5">
          <Dato etiqueta="Procedencia" valor={pedido.procedencia} />
          <Dato etiqueta="Subsecretaría" valor={pedido.subsecretaria} />
          <Dato etiqueta="Cargado por" valor={pedido.creador?.nombreCompleto ?? pedido.Responsable} />
        </dl>
        {limpio(pedido.observaciones) && (
          <p className="mt-1.5 whitespace-pre-line rounded border border-gray-400 px-2 py-1 text-[10px] leading-snug">
            <span className="font-semibold">Observaciones: </span>
            {pedido.observaciones}
          </p>
        )}
      </section>

      {/* Entrega (solo si ya fue asignado / entregado) */}
      {hayEntrega && (
        <section className="mt-3">
          <Titulo>Entrega</Titulo>
          <dl className="grid grid-cols-4 gap-x-3 gap-y-1.5">
            <Dato etiqueta="Entregador" valor={pedido.entregador} />
            <Dato etiqueta="Vehículo" valor={pedido.nombreVehiculo} />
            <Dato
              etiqueta="Fecha de entrega"
              valor={pedido.fechaEntrega ? formatFecha(pedido.fechaEntrega) : null}
            />
            <Dato etiqueta="Observaciones de entrega" valor={pedido.obsEntrerga} />
          </dl>
        </section>
      )}

      {/* Productos */}
      <section className="mt-3">
        <Titulo>{`Productos solicitados (${detalles.length})`}</Titulo>
        {detalles.length === 0 ? (
          <p className="text-[10px] text-gray-600">No hay productos cargados para este pedido.</p>
        ) : (
          <table className="w-full border-collapse text-[10px] leading-tight">
            <thead>
              <tr className="border-b border-black text-left">
                <th className="w-[18%] py-0.5 pr-2 font-semibold">Rubro</th>
                <th className="py-0.5 pr-2 font-semibold">Necesidad</th>
                <th className="w-[8%] py-0.5 pr-2 text-right font-semibold">Cant.</th>
                <th className="w-[30%] py-0.5 font-semibold">Observaciones</th>
              </tr>
            </thead>
            <tbody>
              {detalles.map((d) => (
                <tr key={d.id} className="break-inside-avoid border-b border-gray-300">
                  <td className="py-[3px] pr-2">{limpio(d.rubro) || '—'}</td>
                  <td className="py-[3px] pr-2">{limpio(d.necesidad) || '—'}</td>
                  <td className="py-[3px] pr-2 text-right font-semibold">{d.cantidad ?? '—'}</td>
                  <td className="py-[3px]">{limpio(d.observaciones)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* Recepción */}
      <footer className="mt-6 grid grid-cols-3 gap-x-6 break-inside-avoid text-[9px] text-gray-700">
        <div className="border-t border-black pt-1">Firma de quien recibe</div>
        <div className="border-t border-black pt-1">Aclaración y DNI</div>
        <div className="border-t border-black pt-1">Fecha de recepción</div>
      </footer>
      <p className="mt-2 text-right text-[8px] text-gray-500">
        Impreso el {new Date().toLocaleString('es-AR')}
      </p>
    </article>
  )
}
