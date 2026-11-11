import { CircleHelp, Inbox, RefreshCw, Search } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ListaPedidosMovil, Paginador, TablaPedidos, TarjetaEstado } from '../../components/pedidos'
import Spinner from '../../components/Spinner'
import { useAuth } from '../../context/AuthContext'
import { useConteos, usePedidos } from '../../hooks/usePedidos'
import { useAhora, useDebounce } from '../../hooks/useTiempo'
import { ESTADO_INICIAL, haceCuanto, paletaEstado } from '../../lib/estados'
import { POR_PAGINA } from '../../services/pedidosService'

function Esqueleto() {
  return (
    <div className="animate-pulse space-y-3 p-space-md" role="status" aria-label="Cargando pedidos">
      <div className="h-4 w-3/4 rounded bg-line" />
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="flex h-10 items-center justify-between rounded-lg bg-page px-3">
          <div className="h-3 w-1/3 rounded bg-line" />
          <div className="h-3 w-1/4 rounded bg-line" />
        </div>
      ))}
    </div>
  )
}

export default function EstadoPedidosPage() {
  const { usuario, usuarioLoading } = useAuth()
  const [estado, setEstado] = useState(ESTADO_INICIAL)
  const [pagina, setPagina] = useState(0)
  const [texto, setTexto] = useState('')
  const busqueda = useDebounce(texto, 300)
  const ahora = useAhora()

  const conteos = useConteos()
  const pedidos = usePedidos({ estado, busqueda, pagina })

  if (usuarioLoading) return <Spinner />

  const titulo = (
    <div className="flex flex-col justify-between gap-3 rounded-xl border border-line bg-white p-space-lg shadow-[0px_2px_8px_rgba(0,5,141,0.04)] sm:flex-row sm:items-center">
      <div className="flex items-center gap-2.5">
        <h1 className="font-headline-lg-mobile text-headline-lg-mobile font-bold tracking-tight text-ink md:font-headline-lg md:text-headline-lg">
          Estado de Pedidos
        </h1>
        <Link
          to="/ayuda"
          aria-label="Ayuda"
          className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full text-ink-soft transition-colors hover:bg-page hover:text-primary-container focus:outline-none focus:ring-2 focus:ring-success"
        >
          <CircleHelp size={26} />
        </Link>
      </div>
      {(usuario?.rol ?? 'No Asignado') !== 'No Asignado' && (
        <button
          type="button"
          onClick={() => {
            void conteos.refetch()
            void pedidos.refetch()
          }}
          title="Actualizar"
          className="inline-flex min-h-[44px] items-center gap-1.5 self-start rounded-lg border border-line bg-panel px-3 py-1.5 font-label-md text-label-md text-ink transition-colors hover:bg-page sm:self-auto"
        >
          <RefreshCw
            size={16}
            className={`text-success ${pedidos.isFetching || conteos.isFetching ? 'animate-spin' : ''}`}
          />
          Actualizado {haceCuanto(pedidos.dataUpdatedAt, ahora)}
        </button>
      )}
    </div>
  )

  if ((usuario?.rol ?? 'No Asignado') === 'No Asignado') {
    return (
      <div className="space-y-space-lg p-margin md:p-margin-desktop">
        {titulo}
        <p className="rounded-xl border border-line bg-white p-space-lg text-ink-soft">
          Tu usuario todavía no tiene un rol asignado. Pedile a un administrador que te habilite.
        </p>
      </div>
    )
  }

  const filas = pedidos.data?.filas ?? []
  const total = pedidos.data?.total ?? 0
  const ultimaPagina = Math.max(0, Math.ceil(total / POR_PAGINA) - 1)
  const desde = total === 0 ? 0 : pagina * POR_PAGINA + 1
  const hasta = Math.min(total, (pagina + 1) * POR_PAGINA)
  const paleta = paletaEstado(estado)
  const hayBusqueda = texto.trim() !== ''

  function elegirEstado(nuevo: string | null) {
    if (!nuevo) return
    setEstado(nuevo)
    setPagina(0)
  }

  function cambiarTexto(valor: string) {
    setTexto(valor)
    setPagina(0)
  }

  return (
    <div className="space-y-space-lg p-margin md:p-margin-desktop">
      {titulo}

      <section
        aria-label="Cantidad de pedidos por estado"
        className="rounded-xl border border-teal/40 bg-teal-soft p-3 shadow-sm md:p-4"
      >
        {conteos.isLoading ? (
          <Spinner />
        ) : conteos.isError ? (
          <p className="text-error">No se pudieron cargar los conteos.</p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {conteos.data?.map((c, i, todos) => (
              <TarjetaEstado
                key={c.estado}
                conteo={c}
                activo={c.estado === estado}
                ancha={i === todos.length - 1 && todos.length % 2 === 1}
                onSeleccionar={elegirEstado}
              />
            ))}
          </div>
        )}
      </section>

      <section className="space-y-4 rounded-xl border border-line bg-white p-space-md shadow-sm md:p-space-lg">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-headline-sm text-headline-sm text-ink">Estado de pedido:</span>
          <span
            className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-label-lg text-label-lg"
            style={{
              color: paleta.texto,
              backgroundColor: paleta.fondo,
              borderColor: paleta.borde,
            }}
          >
            <span className="size-2 rounded-full" style={{ backgroundColor: paleta.texto }} />
            {estado}
            {pedidos.data && ` (${total} ${total === 1 ? 'pedido' : 'pedidos'})`}
          </span>
        </div>

        <div className="relative">
          <label htmlFor="busqueda" className="sr-only">
            Buscar por DNI, apellido o barrio
          </label>
          <Search
            size={20}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-soft"
          />
          <input
            id="busqueda"
            type="search"
            value={texto}
            onChange={(e) => cambiarTexto(e.target.value)}
            placeholder="Buscar por DNI, Apellido o Barrio..."
            className="min-h-[48px] w-full rounded-lg border-[1.5px] border-field bg-white pl-10 pr-4 text-ink placeholder-ink-soft transition-colors focus:border-success focus:outline-none focus:ring-2 focus:ring-success/20"
          />
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border border-line bg-white shadow-[0px_2px_8px_rgba(0,5,141,0.04)] max-lg:border-0 max-lg:bg-transparent max-lg:shadow-none">
        {pedidos.isError ? (
          <p className="p-space-lg text-error">No se pudieron cargar los pedidos.</p>
        ) : pedidos.isLoading ? (
          <Esqueleto />
        ) : filas.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl bg-white p-6 text-center">
            <div className="mb-3 flex size-14 items-center justify-center rounded-full bg-surface-container text-primary-container">
              <Inbox size={28} />
            </div>
            <h2 className="font-headline-sm text-headline-sm text-ink">
              No hay pedidos en este estado
            </h2>
            <p className="mt-1 max-w-sm text-ink-soft">
              {hayBusqueda
                ? 'No hay resultados para la búsqueda en este estado.'
                : 'No se registran pedidos con este estado.'}
            </p>
            {hayBusqueda && (
              <button
                type="button"
                onClick={() => cambiarTexto('')}
                className="mt-4 inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-primary-container px-4 py-2 font-label-lg text-label-lg text-primary-container transition-all hover:bg-primary-container/5"
              >
                <RefreshCw size={18} />
                Limpiar búsqueda
              </button>
            )}
          </div>
        ) : (
          <div className={pedidos.isPlaceholderData ? 'opacity-60 transition-opacity' : undefined}>
            <TablaPedidos filas={filas} />
            <ListaPedidosMovil filas={filas} />
            <div className="max-lg:mt-3 max-lg:overflow-hidden max-lg:rounded-xl max-lg:border max-lg:border-line">
              <Paginador
                pagina={pagina}
                ultimaPagina={ultimaPagina}
                desde={desde}
                hasta={hasta}
                total={total}
                onCambiar={setPagina}
              />
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
