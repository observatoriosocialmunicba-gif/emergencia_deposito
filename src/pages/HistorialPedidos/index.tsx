import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  Eye,
  FolderSync,
  History,
  Inbox,
  Lock,
  MapPin,
  Phone,
  Search,
  User,
  Users,
} from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import Spinner from '../../components/Spinner'
import { useAuth } from '../../context/AuthContext'
import { useHistorialPersona } from '../../hooks/usePedidos'
import { usePersonas, usePersonasDni } from '../../hooks/usePersonas'
import { useDebounce } from '../../hooks/useTiempo'
import { esDniValido } from '../../lib/dni'
import { formatFecha, paletaEstado } from '../../lib/estados'
import type { Persona, PersonaDni } from '../../lib/types'

/** Cantidad de pedidos de una persona; avisa si su DNI está repetido en otros registros. */
function ConteoPedidos({ resumen, cargando }: { resumen?: PersonaDni; cargando: boolean }) {
  if (!resumen) return <span className="text-outline">{cargando ? '…' : '—'}</span>
  const repetido = resumen.registros_mismo_dni > 1
  return (
    <span
      className="inline-flex flex-col items-center gap-0.5"
      title={
        repetido
          ? `${resumen.registros_mismo_dni} registros comparten este DNI. Pedidos de este registro: ${resumen.pedidos_propios}. Entre todos: ${resumen.pedidos_total}.`
          : undefined
      }
    >
      <span className="font-headline-sm text-headline-sm font-bold leading-none text-primary">
        {resumen.pedidos_total}
      </span>
      {repetido && (
        <span className="rounded border border-[#F9CF58] bg-[#F9CF58]/25 px-1.5 py-px text-[10px] font-semibold text-[#4A3800]">
          DNI repetido ×{resumen.registros_mismo_dni}
        </span>
      )}
    </span>
  )
}

export default function HistorialPedidosPage() {
  const { usuario, usuarioLoading } = useAuth()

  const [personaSeleccionada, setPersonaSeleccionada] = useState<Persona | null>(null)
  const [busqueda, setBusqueda] = useState('')
  const [pagina, setPagina] = useState(0)
  const busquedaDebounced = useDebounce(busqueda, 300)

  const personasQuery = usePersonas({
    busqueda: busquedaDebounced,
    pagina,
    porPagina: 10,
  })

  const historialQuery = useHistorialPersona(
    personaSeleccionada?.id,
    personaSeleccionada?.dni,
  )

  // Cantidad de pedidos por persona (vista vista_personas_dni) para la página de la lista.
  const resumenQuery = usePersonasDni((personasQuery.data?.filas ?? []).map((p) => p.id))
  const resumenPorId = new Map((resumenQuery.data ?? []).map((r) => [r.id_persona, r]))

  if (usuarioLoading) return <Spinner />

  // Control de Acceso: Solo Administrador
  if (usuario?.rol !== 'Administrador') {
    return (
      <div className="space-y-space-lg p-margin md:p-margin-desktop">
        <h1 className="font-headline-xl text-headline-xl font-bold tracking-tight text-primary">
          Historial de Pedidos
        </h1>
        <div className="flex items-start gap-3 rounded-xl border border-line bg-white p-space-lg text-ink-soft shadow-sm">
          <Lock className="mt-0.5 h-6 w-6 shrink-0 text-outline" />
          <div>
            <h2 className="font-body-md-bold text-body-md-bold text-ink">Acceso Restringido</h2>
            <p className="mt-1 text-sm">
              La consulta de historial unificado por persona está reservada para usuarios con rol{' '}
              <strong>Administrador</strong>.
            </p>
          </div>
        </div>
      </div>
    )
  }

  const filas = personasQuery.data?.filas ?? []
  const total = personasQuery.data?.total ?? 0
  const totalPaginas = Math.max(1, Math.ceil(total / 10))

  const pedidosHistorial = historialQuery.data ?? []
  const ultimoPedido = pedidosHistorial[0]

  return (
    <div className="space-y-6 p-margin md:p-margin-desktop">
      {/* ========================================================================= */}
      {/* VISTA 1: BÚSQUEDA Y LISTADO DE PERSONAS (Paso 1) */}
      {/* ========================================================================= */}
      {!personaSeleccionada && (
        <div className="space-y-6">
          {/* Breadcrumb & Indicador de Progreso */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-surface-container-high pb-4">
            <nav
              aria-label="Miga de pan"
              className="flex items-center gap-2 font-label-md text-label-md text-on-surface-variant"
            >
              <Link to="/estado-pedidos" className="transition-colors hover:text-primary">
                Inicio
              </Link>
              <ChevronRight size={14} />
              <span className="font-bold text-primary">Historial Pedidos</span>
            </nav>

            <div className="inline-flex items-center gap-2 rounded-full border border-outline-variant/60 bg-surface-container px-3 py-1 text-xs">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary-container font-bold text-white">
                1
              </span>
              <span className="font-label-sm font-bold text-primary">
                Paso 1: Búsqueda de Persona
              </span>
            </div>
          </div>

          {/* Encabezado */}
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <h1 className="font-headline-xl text-headline-xl font-bold tracking-tight text-primary">
                Historial de Pedidos por Persona
              </h1>
              <p className="mt-1 max-w-3xl font-body-lg text-body-lg text-on-surface-variant">
                Buscá una persona para ver todos sus pedidos.
              </p>
            </div>

            {/* Contador Padrón Social */}
            <div className="flex items-center gap-4 rounded-xl border border-outline-variant/70 bg-surface-container-lowest px-5 py-3 shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-surface-container text-primary">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <p className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">
                  Total de Personas
                </p>
                <p className="font-headline-md text-headline-md font-bold leading-none text-primary-container">
                  {personasQuery.isLoading ? '...' : total.toLocaleString('es-AR')}
                </p>
              </div>
            </div>
          </div>

          {/* Panel de Búsqueda */}
          <div className="rounded-xl border border-outline-variant/70 bg-surface-container-lowest p-4 shadow-sm md:p-6">
            <div className="space-y-1.5">
              <label htmlFor="busquedaInput" className="block font-body-md-bold text-sm text-on-surface">
                Buscar persona por Nombre, Apellido, DNI o Teléfono
              </label>
              <div className="relative">
                <Search
                  size={20}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-outline"
                />
                <input
                  id="busquedaInput"
                  type="search"
                  value={busqueda}
                  onChange={(e) => {
                    setBusqueda(e.target.value)
                    setPagina(0)
                  }}
                  placeholder="Ingrese DNI o nombre del titular a consultar..."
                  className="min-h-[48px] w-full rounded-lg border border-field bg-white pl-11 pr-4 font-body-md text-body-md text-on-surface focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/20"
                />
              </div>
            </div>
          </div>

          {/* Tabla de Personas */}
          <div className="overflow-hidden rounded-xl border border-outline-variant/70 bg-surface-container-lowest shadow-sm">
            <div className="flex items-center justify-between border-b border-outline-variant/50 bg-surface-container-low p-4">
              <div className="flex items-center gap-2 font-headline-sm text-headline-sm font-bold text-primary">
                <Users size={20} />
                <span>Personas</span>
              </div>
              <span className="text-xs font-medium text-on-surface-variant">
                Mostrando {filas.length} registros
              </span>
            </div>

            {personasQuery.isLoading ? (
              <div className="p-8 text-center text-ink-soft">
                <Spinner />
                <p className="mt-2 text-xs">Consultando base de personas...</p>
              </div>
            ) : personasQuery.isError ? (
              <div className="p-8 text-center text-error">
                <CircleAlert className="mx-auto h-8 w-8" />
                <p className="mt-2 font-body-md text-body-md">Error al cargar las personas.</p>
              </div>
            ) : filas.length === 0 ? (
              <div className="p-12 text-center text-on-surface-variant">
                <User className="mx-auto h-12 w-12 text-outline/40" />
                <p className="mt-2 font-headline-sm text-headline-sm font-bold text-on-surface">
                  No se encontraron personas
                </p>
                <p className="text-xs">
                  Modifique el término de búsqueda o verifique los datos ingresados.
                </p>
              </div>
            ) : (
              <div>
                {/* Tabla Desktop */}
                <div className="hidden overflow-x-auto lg:block">
                  <table className="w-full border-collapse text-left">
                    <thead>
                      <tr className="bg-primary-container text-on-primary font-label-md text-label-md uppercase tracking-wider">
                        <th className="px-5 py-3.5 font-bold">Apellido y Nombre</th>
                        <th className="px-5 py-3.5 font-bold">DNI</th>
                        <th className="px-5 py-3.5 font-bold">Teléfono</th>
                        <th className="px-5 py-3.5 font-bold">Género</th>
                        <th className="px-5 py-3.5 text-center font-bold">Pedidos</th>
                        <th className="px-5 py-3.5 text-center font-bold">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/30 font-body-md text-body-md">
                      {filas.map((p, i) => (
                        <tr
                          key={p.id}
                          className={`transition-colors hover:bg-surface-container-low/50 ${
                            i % 2 === 0 ? 'bg-white' : 'bg-surface-bright'
                          }`}
                        >
                          <td className="px-5 py-3.5 font-body-md-bold text-on-surface">
                            <div className="flex items-center gap-3">
                              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                                {p.nombreCompleto?.slice(0, 2).toUpperCase() || 'P'}
                              </div>
                              <span>{p.nombreCompleto || 'Sin nombre'}</span>
                            </div>
                          </td>
                          <td className="px-5 py-3.5 font-mono font-semibold text-primary">
                            {p.dni || '—'}
                          </td>
                          <td className="px-5 py-3.5 text-on-surface">
                            {p.telefono ? (
                              <span className="flex items-center gap-1.5">
                                <Phone size={14} className="text-outline" />
                                {p.telefono}
                              </span>
                            ) : (
                              '—'
                            )}
                          </td>
                          <td className="px-5 py-3.5">
                            {p.genero ? (
                              <span className="inline-flex items-center rounded-full border border-outline-variant/60 bg-surface-container-high px-2.5 py-0.5 text-xs font-semibold text-on-surface">
                                {p.genero}
                              </span>
                            ) : (
                              '—'
                            )}
                          </td>
                          <td className="px-5 py-3.5 text-center">
                            <ConteoPedidos
                              resumen={resumenPorId.get(p.id)}
                              cargando={resumenQuery.isLoading}
                            />
                          </td>
                          <td className="px-5 py-3.5 text-center">
                            <button
                              type="button"
                              onClick={() => {
                                setPersonaSeleccionada(p)
                                window.scrollTo({ top: 0, behavior: 'smooth' })
                              }}
                              className="inline-flex min-h-[40px] items-center justify-center gap-1.5 rounded-lg bg-primary-container px-4 py-2 font-label-md text-label-md font-bold text-white shadow-xs transition-colors hover:bg-primary-container/90 active:scale-[0.98]"
                            >
                              <History size={16} />
                              <span>Ver Historial</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Lista Mobile */}
                <div className="divide-y divide-outline-variant/30 lg:hidden">
                  {filas.map((p) => (
                    <div key={p.id} className="space-y-2 p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-body-md-bold text-body-md-bold text-on-surface">
                            {p.nombreCompleto || 'Sin nombre'}
                          </p>
                          <p className="font-mono text-xs font-semibold text-primary">
                            DNI: {p.dni || '—'}
                          </p>
                          {p.telefono && (
                            <p className="text-xs text-on-surface-variant">Tel: {p.telefono}</p>
                          )}
                        </div>
                        <div className="text-center">
                          <p className="text-[10px] font-semibold uppercase text-on-surface-variant">
                            Pedidos
                          </p>
                          <ConteoPedidos
                            resumen={resumenPorId.get(p.id)}
                            cargando={resumenQuery.isLoading}
                          />
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setPersonaSeleccionada(p)
                          window.scrollTo({ top: 0, behavior: 'smooth' })
                        }}
                        className="flex min-h-[44px] w-full items-center justify-center gap-1.5 rounded-lg bg-primary-container py-2 font-label-md text-label-md font-bold text-white shadow-xs"
                      >
                        <History size={16} />
                        <span>Ver Historial de Pedidos</span>
                      </button>
                    </div>
                  ))}
                </div>

                {/* Paginador */}
                <div className="flex items-center justify-between border-t border-outline-variant/40 bg-surface-container-low/30 px-4 py-3">
                  <span className="text-xs text-on-surface-variant">
                    Página {pagina + 1} de {totalPaginas}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={pagina === 0}
                      onClick={() => setPagina((p) => Math.max(0, p - 1))}
                      className="rounded-lg border border-outline-variant p-2 text-on-surface hover:bg-surface-container disabled:opacity-40"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <button
                      type="button"
                      disabled={pagina + 1 >= totalPaginas}
                      onClick={() => setPagina((p) => p + 1)}
                      className="rounded-lg border border-outline-variant p-2 text-on-surface hover:bg-surface-container disabled:opacity-40"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VISTA 2: HISTORIAL DE PEDIDOS DE LA PERSONA SELECCIONADA (Paso 2) */}
      {/* ========================================================================= */}
      {personaSeleccionada && (
        <div className="max-w-[1360px] mx-auto space-y-6">
          {/* Top Breadcrumb & Back Action Bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/40 shadow-sm">
            <nav className="flex items-center gap-2 text-on-surface-variant font-label-md text-label-md flex-wrap">
              <Link to="/estado-pedidos" className="hover:text-primary flex items-center gap-1">
                Inicio
              </Link>
              <span className="text-outline-variant">/</span>
              <button
                type="button"
                onClick={() => setPersonaSeleccionada(null)}
                className="hover:text-primary"
              >
                Historial Pedidos
              </button>
              <span className="text-outline-variant">/</span>
              <span className="text-primary font-bold bg-surface-container px-2 py-0.5 rounded">
                {personaSeleccionada.nombreCompleto || 'Persona'}
              </span>
            </nav>

            <button
              type="button"
              onClick={() => setPersonaSeleccionada(null)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border-2 border-primary-container text-primary-container font-label-lg text-label-lg font-semibold hover:bg-primary-container/5 transition-all duration-150 min-h-[44px] active:scale-[0.98]"
            >
              <ArrowLeft size={18} />
              <span>Volver a Búsqueda</span>
            </button>
          </div>

          {/* Bento Profile Card (Ficha Resumen del Titular) */}
          <section className="bg-surface-container-lowest rounded-xl border border-outline-variant/40 shadow-sm p-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-primary-container via-secondary to-secondary-fixed"></div>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              {/* Left Info Block: Profile Anchor */}
              <div className="lg:col-span-5 flex items-start gap-4">
                <div className="w-16 h-16 rounded-xl bg-surface-container text-primary flex items-center justify-center shrink-0 border border-secondary/20 shadow-xs">
                  <User size={36} />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="font-headline-lg text-headline-lg font-bold text-primary tracking-tight">
                      {personaSeleccionada.nombreCompleto || 'Sin nombre'}
                    </h2>
                  </div>
                  <div className="mt-1 flex items-center gap-3 text-on-surface-variant font-label-md text-label-md flex-wrap">
                    <span className="flex items-center gap-1 font-bold text-on-surface">
                      DNI {personaSeleccionada.dni || '—'}
                    </span>
                    <span>•</span>
                    <span>
                      Género: <strong>{personaSeleccionada.genero || 'No especificado'}</strong>
                    </span>
                    {(resumenPorId.get(personaSeleccionada.id)?.registros_mismo_dni ?? 1) > 1 && (
                      <>
                        <span>•</span>
                        <span className="inline-block rounded border border-[#F9CF58] bg-[#F9CF58]/25 px-2 py-0.5 text-[11px] font-semibold text-[#4A3800]">
                          DNI repetido en {resumenPorId.get(personaSeleccionada.id)?.registros_mismo_dni}{' '}
                          registros
                        </span>
                      </>
                    )}
                    {ultimoPedido?.discapacidad !== undefined && (
                      <>
                        <span>•</span>
                        <span className="inline-block px-2 py-0.5 rounded bg-surface-container-low text-[11px] font-semibold text-on-surface-variant">
                          {ultimoPedido.discapacidad
                            ? 'Persona con Discapacidad'
                            : 'Persona sin Discapacidad'}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Telemetry Grid: Contact and Address Details */}
              <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4 bg-surface-container-low/60 p-4 rounded-lg border border-outline-variant/30">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-surface-container-lowest border border-outline-variant/50 flex items-center justify-center text-primary">
                    <Phone size={20} />
                  </div>
                  <div>
                    <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
                      Teléfono de Contacto
                    </p>
                    <p className="font-body-md-bold text-body-md-bold text-on-surface">
                      {personaSeleccionada.telefono || 'Sin teléfono registrado'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-surface-container-lowest border border-outline-variant/50 flex items-center justify-center text-primary">
                    <MapPin size={20} />
                  </div>
                  <div>
                    <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
                      Barrio / Domicilio
                    </p>
                    <p
                      className="font-body-md-bold text-body-md-bold text-on-surface truncate"
                      title={
                        ultimoPedido
                          ? `${ultimoPedido.barrio || ''} - ${ultimoPedido.direccion || ''}`
                          : 'Sin pedidos previos'
                      }
                    >
                      {ultimoPedido
                        ? `${ultimoPedido.barrio || 'Sin barrio'} — ${ultimoPedido.direccion || 'Sin dirección'}`
                        : 'Sin pedidos previos'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Section Title Bar & Stats Banner */}
          <section className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-headline-md text-headline-md font-bold text-primary tracking-tight">
                Historial de Pedidos
              </h3>
              <p className="font-body-md text-body-md text-on-surface-variant">
                Del más reciente al más antiguo.
                {esDniValido(personaSeleccionada.dni) &&
                  ' Incluye los pedidos de otros registros con el mismo DNI.'}
              </p>
            </div>

            {/* Total Orders Badge Card */}
            <div className="flex items-center gap-3 bg-surface-container-lowest px-5 py-3 rounded-xl border border-outline-variant/40 shadow-sm min-h-[48px]">
              <div className="w-8 h-8 rounded-full bg-primary-container text-on-primary flex items-center justify-center text-white">
                <FolderSync size={18} />
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="font-body-md text-body-md text-on-surface-variant font-medium">
                  Total de Pedidos:
                </span>
                <span className="font-headline-sm text-headline-sm font-bold text-primary">
                  {historialQuery.isLoading ? '...' : pedidosHistorial.length}
                </span>
              </div>
            </div>
          </section>

          {/* History Records Table Container */}
          <section className="bg-surface-container-lowest rounded-xl border border-outline-variant/40 shadow-sm overflow-hidden flex flex-col">
            {historialQuery.isLoading ? (
              <div className="p-8 text-center text-ink-soft">
                <Spinner />
                <p className="mt-2 text-xs">Cargando historial de pedidos...</p>
              </div>
            ) : historialQuery.isError ? (
              <div className="p-8 text-center text-error">
                <CircleAlert className="mx-auto h-8 w-8" />
                <p className="mt-2 font-body-md text-body-md">Error al recuperar el historial.</p>
              </div>
            ) : pedidosHistorial.length === 0 ? (
              <div className="p-12 text-center text-on-surface-variant">
                <Inbox className="mx-auto h-12 w-12 text-outline/40" />
                <p className="mt-2 font-headline-sm text-headline-sm font-bold text-on-surface">
                  Esta persona no tiene pedidos registrados
                </p>
                <p className="mt-1 text-xs">
                  No hay pedidos cargados para esta persona.
                </p>
                <div className="mt-4">
                  <Link
                    to="/solicitudes/nueva"
                    className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-primary-container px-5 py-2 font-label-lg text-label-lg font-bold text-white shadow-xs hover:bg-primary-container/90"
                  >
                    <span>+ Crear Nueva Solicitud</span>
                  </Link>
                </div>
              </div>
            ) : (
              <>
                {/* Table Responsive Scroller (Desktop) */}
                <div className="overflow-x-auto custom-scrollbar">
                  <table className="w-full text-left border-collapse min-w-[980px]">
                    <thead>
                      <tr className="bg-primary-container text-on-primary font-label-lg text-label-lg tracking-wide text-white">
                        <th className="py-3.5 px-4 font-bold border-b border-primary" scope="col">
                          Fecha
                        </th>
                        <th className="py-3.5 px-4 font-bold border-b border-primary" scope="col">
                          Pedido
                        </th>
                        <th className="py-3.5 px-4 font-bold border-b border-primary" scope="col">
                          Apellido y Nombre
                        </th>
                        <th className="py-3.5 px-4 font-bold border-b border-primary" scope="col">
                          Estado
                        </th>
                        <th className="py-3.5 px-4 font-bold border-b border-primary" scope="col">
                          Procedencia
                        </th>
                        <th className="py-3.5 px-4 font-bold border-b border-primary" scope="col">
                          Observaciones
                        </th>
                        <th className="py-3.5 px-4 font-bold border-b border-primary" scope="col">
                          Últ. Edición
                        </th>
                        <th
                          className="py-3.5 px-4 font-bold border-b border-primary text-center"
                          scope="col"
                        >
                          Acción
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/20 font-body-md text-body-md">
                      {pedidosHistorial.map((pedido, i) => {
                        const estado = pedido.estado ?? 'Sin estado'
                        const colores = paletaEstado(estado)

                        return (
                          <tr
                            key={pedido.id}
                            className={`hover:bg-surface-container-low/50 transition-colors duration-100 min-h-[52px] ${
                              i % 2 === 1 ? 'bg-slate-50/50' : 'bg-white'
                            }`}
                          >
                            <td className="py-4 px-4 whitespace-nowrap text-on-surface">
                              <span className="font-semibold text-on-surface block">
                                {formatFecha(pedido.fecha)}
                              </span>
                            </td>
                            <td className="py-4 px-4 whitespace-nowrap font-mono font-bold text-primary">
                              #{pedido.id}
                            </td>
                            <td className="py-4 px-4 whitespace-nowrap font-medium text-on-surface">
                              {pedido.nombreCompleto || personaSeleccionada.nombreCompleto || '—'}
                            </td>
                            <td className="py-4 px-4 whitespace-nowrap">
                              <span
                                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold"
                                style={{
                                  backgroundColor: colores.fondo,
                                  color: colores.texto,
                                  borderColor: colores.punto,
                                  borderWidth: '1px',
                                }}
                              >
                                <span
                                  className="w-2 h-2 rounded-full"
                                  style={{ backgroundColor: colores.punto }}
                                />
                                {estado}
                              </span>
                            </td>
                            <td className="py-4 px-4 whitespace-nowrap text-on-surface-variant">
                              <span>{pedido.procedencia || '—'}</span>
                            </td>
                            <td
                              className="py-4 px-4 text-on-surface max-w-[260px] truncate"
                              title={pedido.observaciones || ''}
                            >
                              {pedido.observaciones || '—'}
                            </td>
                            <td className="py-4 px-4 whitespace-nowrap text-xs text-on-surface-variant">
                              {pedido.ultModificacion || '—'}
                            </td>
                            <td className="py-4 px-4 whitespace-nowrap text-center">
                              <Link
                                to={`/ver-pedido/${pedido.id}`}
                                className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg bg-primary-container text-white font-label-md text-label-md hover:bg-primary transition-colors duration-150 min-h-[44px] shadow-xs active:scale-95"
                              >
                                <Eye size={16} />
                                <span>Ver Pedido</span>
                              </Link>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards */}
                <div className="divide-y divide-outline-variant/30 lg:hidden">
                  {pedidosHistorial.map((pedido) => {
                    const estado = pedido.estado ?? 'Sin estado'
                    const colores = paletaEstado(estado)

                    return (
                      <div key={pedido.id} className="p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold text-primary text-sm">
                            #{pedido.id}
                          </span>
                          <span
                            className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold"
                            style={{
                              backgroundColor: colores.fondo,
                              color: colores.texto,
                            }}
                          >
                            <span
                              className="w-1.5 h-1.5 rounded-full"
                              style={{ backgroundColor: colores.punto }}
                            />
                            {estado}
                          </span>
                        </div>

                        <div className="text-xs text-on-surface-variant space-y-1">
                          <p>
                            <span className="font-medium text-on-surface">Fecha:</span>{' '}
                            {formatFecha(pedido.fecha)}
                          </p>
                          <p>
                            <span className="font-medium text-on-surface">Procedencia:</span>{' '}
                            {pedido.procedencia || '—'}
                          </p>
                          {pedido.observaciones && (
                            <p className="italic">&ldquo;{pedido.observaciones}&rdquo;</p>
                          )}
                        </div>

                        <Link
                          to={`/ver-pedido/${pedido.id}`}
                          className="flex min-h-[44px] w-full items-center justify-center gap-1.5 rounded-lg bg-primary-container py-2 font-label-md text-label-md font-bold text-white shadow-xs"
                        >
                          <Eye size={16} />
                          <span>Ver Pedido</span>
                        </Link>
                      </div>
                    )
                  })}
                </div>

                {/* Bottom Summary & Audit History Section */}
                <div className="p-4 bg-surface-container-low border-t border-outline-variant/30 flex items-center justify-end gap-4">
                  <div className="flex items-center gap-3">
                    <span className="font-label-md text-label-md text-on-surface-variant">
                      Total: <strong>{pedidosHistorial.length}</strong>{' '}
                      {pedidosHistorial.length === 1 ? 'pedido' : 'pedidos'}
                    </span>
                  </div>
                </div>
              </>
            )}
          </section>
        </div>
      )}
    </div>
  )
}

