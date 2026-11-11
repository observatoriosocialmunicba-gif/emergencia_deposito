import {
  AlertTriangle,
  ArrowLeft,
  Calendar,
  CheckCircle,
  CheckCircle2,
  Clock,
  Edit2,
  Eye,
  HeartPulse,
  Home,
  Layers,
  MapPin,
  Package,
  Phone,
  Printer,
  RotateCcw,
  Shield,
  Shirt,
  Sparkles,
  Truck,
  User,
  Utensils,
  X,
  XCircle,
} from 'lucide-react'
import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import HojaPedido from '../../components/pedidos/HojaPedido'
import ModalVistaPrevia from '../../components/pedidos/ModalVistaPrevia'
import { useAuth } from '../../context/AuthContext'
import {
  useAsignarPedido,
  useAutorizarPedido,
  useEntregarPedido,
  useNoEntregarPedido,
  usePedidoDetalle,
  useRechazarPedido,
  useReintentarEntrega,
} from '../../hooks/usePedidos'
import { formatFecha, hoyISO, paletaEstado } from '../../lib/estados'
import type { DetallePedido } from '../../lib/types'

function iconoRubro(rubro: string | null) {
  const r = (rubro ?? '').toLowerCase()
  if (r.includes('alimento')) return <Utensils className="h-4 w-4 text-secondary" />
  if (r.includes('vivienda')) return <Home className="h-4 w-4 text-secondary" />
  if (r.includes('salud')) return <HeartPulse className="h-4 w-4 text-secondary" />
  if (r.includes('ropa')) return <Shirt className="h-4 w-4 text-secondary" />
  if (r.includes('insumo')) return <Layers className="h-4 w-4 text-secondary" />
  if (r.includes('higiene')) return <Sparkles className="h-4 w-4 text-secondary" />
  return <Package className="h-4 w-4 text-secondary" />
}

export default function VerPedidoPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { usuario } = useAuth()
  const idNum = id ? parseInt(id, 10) : 0

  const { data: pedido, isLoading, isError } = usePedidoDetalle(idNum)

  // Mutaciones
  const autorizarMutation = useAutorizarPedido()
  const rechazarMutation = useRechazarPedido()
  const asignarMutation = useAsignarPedido()
  const entregarMutation = useEntregarPedido()
  const noEntregarMutation = useNoEntregarPedido()
  const reintentarMutation = useReintentarEntrega()

  // Estados locales para diálogos / modales
  const [modalRechazar, setModalRechazar] = useState(false)
  const [motivoRechazo, setMotivoRechazo] = useState('')

  const [modalAsignar, setModalAsignar] = useState(false)
  const [nombreVehiculo, setNombreVehiculo] = useState('')
  const [entregador, setEntregador] = useState('')
  const [fechaEntrega, setFechaEntrega] = useState(hoyISO)

  const [modalEntregado, setModalEntregado] = useState(false)
  // Fecha con la que se registra el resultado de la entrega: hoy por defecto, editable.
  const [fechaResultado, setFechaResultado] = useState(hoyISO)
  const [modalNoEntregado, setModalNoEntregado] = useState(false)
  const [opcionNoEntregado, setOpcionNoEntregado] = useState('No se encontró el lugar')
  const [otroMotivoNoEntregado, setOtroMotivoNoEntregado] = useState('')
  const [modalReintentar, setModalReintentar] = useState(false)
  const [modalVistaPrevia, setModalVistaPrevia] = useState(false)

  const [errorAccion, setErrorAccion] = useState<string | null>(null)
  const [exitoAccion, setExitoAccion] = useState<string | null>(null)

  // Permisos por rol
  const rol = usuario?.rol ?? 'No Asignado'
  const puedeAutorizar = rol === 'Administrador'
  const puedeAsignar = rol === 'Administrador' || rol === 'Asignador'
  // La entrega la registra el depósito (Asignador) o el Administrador; los choferes no usan la app.
  const puedeEntregar = rol === 'Administrador' || rol === 'Asignador'
  // Reintentar entrega: Asignador y Administrador
  const puedeReintentar = rol === 'Administrador' || rol === 'Asignador'
  // Nota de permisos: Solicitante solo puede editar/eliminar en 'Pendiente de Autorización',
  // Administrador siempre, Asignador nunca. La base de datos (RLS) impone esta regla.

  // Igual que la app original: si el usuario no tiene nombre se deja vacío (no se inventa uno).
  const modificadoPor = usuario?.nombreCompleto ?? null

  const handleImprimir = () => {
    window.print()
  }

  // 1. Manejador Autorizar
  async function handleAutorizar() {
    if (!pedido || !puedeAutorizar) return
    setErrorAccion(null)
    setExitoAccion(null)
    try {
      await autorizarMutation.mutateAsync({
        idPedido: pedido.id,
        modificadoPor,
      })
      setExitoAccion('Pedido autorizado con éxito. Ahora se encuentra en estado "Para Asignar".')
    } catch (err: unknown) {
      setErrorAccion(err instanceof Error ? err.message : 'Error al autorizar el pedido.')
    }
  }

  // 2. Manejador Rechazar
  async function handleConfirmarRechazo(e: FormEvent) {
    e.preventDefault()
    if (!pedido || !puedeAutorizar) return
    if (!motivoRechazo.trim()) {
      setErrorAccion('El motivo de rechazo es obligatorio.')
      return
    }
    setErrorAccion(null)
    try {
      await rechazarMutation.mutateAsync({
        idPedido: pedido.id,
        motivo: motivoRechazo.trim(),
        observacionesPrevias: pedido.observaciones,
        modificadoPor,
      })
      setModalRechazar(false)
      setMotivoRechazo('')
      setExitoAccion('Pedido rechazado correctamente.')
    } catch (err: unknown) {
      setErrorAccion(err instanceof Error ? err.message : 'Error al rechazar el pedido.')
    }
  }

  // 3. Manejador Asignar
  async function handleConfirmarAsignacion(e: FormEvent) {
    e.preventDefault()
    if (!pedido || !puedeAsignar) return
    if (!nombreVehiculo.trim() || !entregador.trim() || !fechaEntrega) {
      setErrorAccion('Complete todos los datos requeridos para la asignación.')
      return
    }
    setErrorAccion(null)
    try {
      await asignarMutation.mutateAsync({
        idPedido: pedido.id,
        nombreVehiculo: nombreVehiculo.trim(),
        entregador: entregador.trim(),
        fechaEntrega,
        modificadoPor,
      })
      setModalAsignar(false)
      setExitoAccion('Pedido asignado con éxito.')
    } catch (err: unknown) {
      setErrorAccion(err instanceof Error ? err.message : 'Error al asignar el pedido.')
    }
  }

  // 4. Manejador Entregado
  async function handleEntregado() {
    if (!pedido || !puedeEntregar) return
    setErrorAccion(null)
    setExitoAccion(null)
    try {
      await entregarMutation.mutateAsync({
        idPedido: pedido.id,
        fechaEntrega: fechaResultado,
        modificadoPor,
      })
      setModalEntregado(false)
      setExitoAccion('Pedido marcado como Entregado.')
    } catch (err: unknown) {
      setModalEntregado(false)
      setErrorAccion(err instanceof Error ? err.message : 'Error al marcar como entregado.')
    }
  }

  // 5. Manejador No Entregado
  async function handleConfirmarNoEntregado(e: FormEvent) {
    e.preventDefault()
    if (!pedido || !puedeEntregar) return
    const motivoFinal =
      opcionNoEntregado === 'Otros'
        ? otroMotivoNoEntregado.trim()
        : opcionNoEntregado

    if (!motivoFinal) {
      setErrorAccion('Debe especificar el motivo de no entrega.')
      return
    }
    setErrorAccion(null)
    try {
      await noEntregarMutation.mutateAsync({
        idPedido: pedido.id,
        motivo: motivoFinal,
        fechaEntrega: fechaResultado,
        modificadoPor,
      })
      setModalNoEntregado(false)
      setOtroMotivoNoEntregado('')
      setExitoAccion('Pedido registrado como No Entregado.')
    } catch (err: unknown) {
      setErrorAccion(err instanceof Error ? err.message : 'Error al guardar el estado.')
    }
  }

  // 6. Manejador Reintentar Entrega
  async function handleConfirmarReintento() {
    if (!pedido || !puedeReintentar) return
    setErrorAccion(null)
    setExitoAccion(null)
    try {
      await reintentarMutation.mutateAsync({
        idPedido: pedido.id,
        observacionesPrevias: pedido.observaciones,
        motivoAnterior: pedido.obsEntrerga,
        fechaEntregaAnterior: pedido.fechaEntrega,
        modificadoPor,
      })
      setModalReintentar(false)
      setExitoAccion('Pedido devuelto a Para Asignar para reintentar la entrega.')
    } catch (err: unknown) {
      setErrorAccion(err instanceof Error ? err.message : 'Error al reintentar la entrega.')
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-space-lg p-margin md:p-margin-desktop">
        <div className="flex h-64 items-center justify-center rounded-xl border border-line bg-white shadow-sm">
          <div className="flex items-center gap-3 text-ink-soft">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <span className="font-body-md text-body-md">Cargando datos del pedido #{id}...</span>
          </div>
        </div>
      </div>
    )
  }

  if (isError || !pedido) {
    return (
      <div className="space-y-space-lg p-margin md:p-margin-desktop">
        <div className="rounded-xl border border-error/30 bg-error-container/20 p-6 text-center">
          <h2 className="font-headline-sm text-headline-sm font-bold text-error">
            No se pudo encontrar el pedido #{id}
          </h2>
          <p className="mt-2 font-body-md text-body-md text-on-surface-variant">
            El pedido solicitado no existe o hubo un error al cargar la información.
          </p>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="mt-4 inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-primary-container px-4 py-2 font-label-lg text-label-lg text-white hover:bg-primary-container/90"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver
          </button>
        </div>
      </div>
    )
  }

  const estado = pedido.estado ?? 'Sin estado'
  const colores = paletaEstado(estado)
  const isPending =
    autorizarMutation.isPending ||
    rechazarMutation.isPending ||
    asignarMutation.isPending ||
    entregarMutation.isPending ||
    noEntregarMutation.isPending ||
    reintentarMutation.isPending

  return (
    <>
    <div className="space-y-space-lg p-margin md:p-margin-desktop print:hidden">
      {/* 1. Breadcrumb y Botón Volver */}
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center print:hidden">
        <nav
          aria-label="Ruta de navegación"
          className="flex flex-wrap items-center gap-2 font-label-md text-label-md text-on-surface-variant"
        >
          <Link to="/estado-pedidos" className="transition-colors hover:text-primary-container">
            Inicio
          </Link>
          <span>/</span>
          <Link to="/solicitudes" className="transition-colors hover:text-primary-container">
            Pedidos
          </Link>
          <span>/</span>
          <span className="font-body-md-bold text-on-surface">Pedido #{pedido.id}</span>
        </nav>
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg border border-primary-container px-4 font-label-lg text-label-lg text-primary-container transition-colors hover:bg-primary-container/5 active:scale-[0.98]"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Volver</span>
        </button>
      </section>

      {/* Alertas de Acción */}
      {exitoAccion && (
        <div
          role="status"
          className="flex items-center gap-2 rounded-xl border border-secondary bg-surface-container p-4 text-sm font-medium text-secondary print:hidden"
        >
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          <span>{exitoAccion}</span>
        </div>
      )}
      {errorAccion && (
        <div
          role="alert"
          className="flex items-center gap-2 rounded-xl border border-error bg-error-container/40 p-4 text-sm font-medium text-on-error-container print:hidden"
        >
          <AlertTriangle className="h-5 w-5 shrink-0 text-error" />
          <span>{errorAccion}</span>
        </div>
      )}

      {/* 2. Encabezado principal & Cues informativos */}
      <section className="rounded-xl border border-line bg-surface-container-lowest p-6 shadow-sm">
        <div className="flex flex-col justify-between gap-4 border-b border-surface-container pb-5 md:flex-row md:items-center">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="font-headline-lg text-headline-lg font-bold tracking-tight text-on-surface">
                Detalle del Pedido #{pedido.id}
              </h1>
              {/* Chip de estado */}
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-label-md text-label-md font-semibold"
                style={{ backgroundColor: colores.fondo, color: colores.texto }}
              >
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: colores.punto }} />
                {estado}
              </span>
              {/* Chip de discapacidad */}
              <span className="inline-flex items-center gap-1.5 rounded-full border border-surface-variant bg-surface-container-low px-3 py-1 font-label-md text-label-md text-secondary">
                <User className="h-4 w-4" />
                {pedido.discapacidad ? 'Persona con Discapacidad' : 'Persona sin Discapacidad'}
              </span>
            </div>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Procedencia: {pedido.procedencia || 'Sin procedencia'} · Fecha de registro:{' '}
              {formatFecha(pedido.fecha)}
            </p>
          </div>
          <div className="flex items-center gap-3 print:hidden">
            {estado === 'Pendiente de Autorización' &&
              (rol === 'Administrador' || rol === 'Solicitante') && (
                <Link
                  to={`/solicitudes/${pedido.id}/editar`}
                  className="flex min-h-[44px] items-center gap-2 rounded-lg bg-primary-container px-4 font-label-lg text-label-lg font-bold text-white shadow-xs transition-colors hover:bg-primary-container/90 active:scale-[0.98]"
                >
                  <Edit2 className="h-4 w-4" />
                  <span>Editar solicitud</span>
                </Link>
              )}
            <button
              type="button"
              onClick={() => setModalVistaPrevia(true)}
              className="flex min-h-[44px] items-center gap-2 rounded-lg border border-primary-container bg-white px-4 font-label-lg text-label-lg font-bold text-primary-container shadow-xs transition-colors hover:bg-primary-container/5 active:scale-[0.98]"
            >
              <Eye className="h-4 w-4" />
              <span>Vista previa</span>
            </button>
            <button
              type="button"
              onClick={handleImprimir}
              className="flex min-h-[44px] items-center gap-2 rounded-lg border border-surface-variant bg-surface-container-low px-4 font-label-lg text-label-lg text-primary-container transition-colors hover:bg-surface-container"
            >
              <Printer className="h-4 w-4" />
              <span>Imprimir Copia</span>
            </button>
          </div>
        </div>

        {/* Barra de Acciones según Estado */}
        <div className="mt-4 border-t border-surface-container pt-4 print:hidden">
          {estado === 'Pendiente de Autorización' && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-surface-bright p-4">
              <div>
                <h3 className="font-body-md-bold text-body-md-bold text-primary">
                  Gestión de Autorización
                </h3>
                <p className="text-xs text-on-surface-variant">
                  {puedeAutorizar
                    ? 'Autorice el pedido para habilitar su asignación de logística o rechácelo indicando motivo.'
                    : 'La solicitud se encuentra a la espera de autorización por parte de un Administrador.'}
                </p>
              </div>
              {puedeAutorizar && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => setModalRechazar(true)}
                    className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg border border-error px-4 py-2 font-label-md text-label-md font-semibold text-error transition-colors hover:bg-error/5 disabled:opacity-50"
                  >
                    <XCircle className="h-4 w-4" />
                    <span>Rechazar</span>
                  </button>
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={handleAutorizar}
                    className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg bg-primary-container px-5 py-2 font-label-md text-label-md font-semibold text-white shadow-xs transition-colors hover:bg-primary-container/90 disabled:opacity-50"
                  >
                    <CheckCircle className="h-4 w-4" />
                    <span>Autorizar Pedido</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {estado === 'Para Asignar' && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-surface-bright p-4">
              <div>
                <h3 className="font-body-md-bold text-body-md-bold text-primary">
                  Asignación de Entrega
                </h3>
                <p className="text-xs text-on-surface-variant">
                  {puedeAsignar
                    ? 'Asigne el vehículo, el entregador encargado y la fecha programada.'
                    : 'El pedido se encuentra pendiente de asignación logística.'}
                </p>
              </div>
              {puedeAsignar && (
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => {
                    setNombreVehiculo(pedido.nombreVehiculo || '')
                    setEntregador(pedido.entregador || '')
                    setFechaEntrega(pedido.fechaEntrega || hoyISO())
                    setModalAsignar(true)
                  }}
                  className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg bg-primary-container px-5 py-2 font-label-md text-label-md font-semibold text-white shadow-xs transition-colors hover:bg-primary-container/90 disabled:opacity-50"
                >
                  <Truck className="h-4 w-4" />
                  <span>Asignar Entrega</span>
                </button>
              )}
            </div>
          )}

          {estado === 'Asignado' && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-surface-bright p-4">
              <div>
                <h3 className="font-body-md-bold text-body-md-bold text-primary">
                  Registro de Resultado de Entrega
                </h3>
                <p className="text-xs text-on-surface-variant">
                  {puedeEntregar
                    ? 'Indique si el pedido fue entregado con éxito o registre el motivo de no entrega.'
                    : 'El pedido se encuentra asignado y en proceso de distribución.'}
                </p>
              </div>
              {puedeEntregar && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => {
                      setFechaResultado(hoyISO())
                      setModalNoEntregado(true)
                    }}
                    className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg border border-error px-4 py-2 font-label-md text-label-md font-semibold text-error transition-colors hover:bg-error/5 disabled:opacity-50"
                  >
                    <XCircle className="h-4 w-4" />
                    <span>No Entregado</span>
                  </button>
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => {
                      setFechaResultado(hoyISO())
                      setModalEntregado(true)
                    }}
                    className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg bg-secondary px-5 py-2 font-label-md text-label-md font-semibold text-white shadow-xs transition-colors hover:bg-secondary/90 disabled:opacity-50"
                  >
                    <CheckCircle className="h-4 w-4" />
                    <span>Marcar Entregado</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {estado === 'No Entregado' && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-surface-bright p-4">
              <div>
                <h3 className="font-body-md-bold text-body-md-bold text-primary">
                  Reintento de Entrega
                </h3>
                <p className="text-xs text-on-surface-variant">
                  {puedeReintentar
                    ? 'Vuelva a poner este pedido en Para Asignar para programar un nuevo intento de entrega.'
                    : 'La entrega de este pedido no pudo completarse.'}
                </p>
              </div>
              {puedeReintentar && (
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => setModalReintentar(true)}
                  className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg bg-primary-container px-5 py-2 font-label-md text-label-md font-semibold text-white shadow-xs transition-colors hover:bg-primary-container/90 disabled:opacity-50"
                >
                  <RotateCcw className="h-4 w-4" />
                  <span>Reintentar entrega</span>
                </button>
              )}
            </div>
          )}

          {estado !== 'Pendiente de Autorización' &&
            estado !== 'Para Asignar' &&
            estado !== 'Asignado' &&
            estado !== 'No Entregado' && (
              <div className="flex items-center gap-2 text-xs text-on-surface-variant">
                <Clock className="h-4 w-4 text-outline" />
                <span>
                  Este pedido se encuentra en estado <strong>{estado}</strong> (Modo solo lectura).
                </span>
              </div>
            )}
        </div>

        {/* Aviso de Última Modificación */}
        {pedido.ultModificacion && (
          <div className="mt-4 flex items-center gap-3 rounded-lg border-l-4 border-primary bg-surface-container p-3 text-on-surface">
            <Clock className="h-5 w-5 shrink-0 text-primary" />
            <p className="font-label-md text-label-md">
              <strong>Última Modificación:</strong> {pedido.ultModificacion}
            </p>
          </div>
        )}
      </section>

      {/* 3 & 4. Grid de Tarjetas de Información (Creador & Detalle) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* 3. Tarjeta 'Creador de la Solicitud' */}
        <section className="flex flex-col justify-between rounded-xl border border-surface-variant bg-surface-container-lowest p-6 shadow-sm lg:col-span-4">
          <div>
            <div className="mb-4 flex items-center justify-between border-b border-surface-container pb-3">
              <h2 className="flex items-center gap-2 font-headline-sm text-headline-sm font-bold text-on-surface">
                <Shield className="h-5 w-5 text-secondary" />
                Creador de la Solicitud
              </h2>
              {pedido.creador?.rol && (
                <span className="rounded border border-secondary/20 bg-secondary-fixed/20 px-2 py-0.5 font-label-sm text-label-sm text-secondary">
                  {pedido.creador.rol}
                </span>
              )}
            </div>
            <dl className="space-y-4">
              <div>
                <dt className="mb-0.5 font-label-md text-label-md text-on-surface-variant">Nombre Completo</dt>
                <dd className="font-body-md-bold text-body-md-bold text-on-surface">
                  {pedido.creador?.nombreCompleto || 'No especificado'}
                </dd>
              </div>
              <div>
                <dt className="mb-0.5 font-label-md text-label-md text-on-surface-variant">DNI</dt>
                <dd className="font-body-md text-body-md font-medium text-on-surface">
                  {pedido.creador?.dni ? pedido.creador.dni.toLocaleString('es-AR') : '—'}
                </dd>
              </div>
              <div>
                <dt className="mb-0.5 font-label-md text-label-md text-on-surface-variant">Teléfono</dt>
                <dd className="font-body-md text-body-md text-on-surface">
                  {pedido.creador?.telefono || '—'}
                </dd>
              </div>
              <div>
                <dt className="mb-0.5 font-label-md text-label-md text-on-surface-variant">Fecha de la Solicitud</dt>
                <dd className="flex items-center gap-1.5 font-body-md text-body-md text-on-surface">
                  <Calendar className="h-4 w-4 text-outline" />
                  {formatFecha(pedido.fecha)}
                </dd>
              </div>
              <div>
                <dt className="mb-0.5 font-label-md text-label-md text-on-surface-variant">Estado Actual</dt>
                <dd className="pt-1">
                  <span
                    className="inline-flex items-center gap-1.5 rounded px-3 py-1 font-label-md text-label-md font-bold"
                    style={{ backgroundColor: colores.fondo, color: colores.texto }}
                  >
                    <CheckCircle className="h-4 w-4" />
                    {estado}
                  </span>
                </dd>
              </div>
            </dl>
          </div>
        </section>

        {/* 4. Tarjeta 'Detalle del Pedido y Beneficiario' */}
        <section className="rounded-xl border border-surface-variant bg-surface-container-lowest p-6 shadow-sm lg:col-span-8">
          <div className="mb-4 flex items-center justify-between border-b border-surface-container pb-3">
            <h2 className="flex items-center gap-2 font-headline-sm text-headline-sm font-bold text-on-surface">
              <User className="h-5 w-5 text-secondary" />
              Detalle del Pedido y Beneficiario
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2 md:grid-cols-3">
            <div>
              <dt className="mb-0.5 font-label-md text-label-md text-on-surface-variant">Nombre y Apellido</dt>
              <dd className="font-body-md-bold text-body-md-bold text-on-surface">
                {pedido.nombreCompleto || '—'}
              </dd>
            </div>
            <div>
              <dt className="mb-0.5 font-label-md text-label-md text-on-surface-variant">DNI</dt>
              <dd className="font-body-md text-body-md font-medium text-on-surface">
                {pedido.dni || '—'}
              </dd>
            </div>
            <div>
              <dt className="mb-0.5 font-label-md text-label-md text-on-surface-variant">Teléfono</dt>
              <dd className="flex items-center gap-1 font-body-md text-body-md text-on-surface">
                <Phone className="h-3.5 w-3.5 text-outline" />
                {pedido.telefono || '—'}
              </dd>
            </div>
            <div>
              <dt className="mb-0.5 font-label-md text-label-md text-on-surface-variant">Discapacidad</dt>
              <dd className="font-body-md text-body-md text-on-surface">
                {pedido.discapacidad ? 'Sí' : 'No'}
              </dd>
            </div>
            <div>
              <dt className="mb-0.5 font-label-md text-label-md text-on-surface-variant">Barrio</dt>
              <dd className="font-body-md-bold text-body-md-bold text-on-surface">
                {pedido.barrio || '—'}
              </dd>
            </div>
            <div>
              <dt className="mb-0.5 font-label-md text-label-md text-on-surface-variant">Dirección</dt>
              <dd className="font-body-md text-body-md text-on-surface">
                {pedido.direccion || '—'}
              </dd>
            </div>

            {pedido.coordenadas && (
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-surface-container-low p-3 sm:col-span-2 md:col-span-3">
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-secondary" />
                  <div>
                    <span className="block font-label-md text-label-md text-on-surface-variant">
                      Coordenadas Georreferenciadas:
                    </span>
                    <span className="font-mono text-sm font-bold text-primary">
                      {pedido.coordenadas}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div className="sm:col-span-1 md:col-span-1">
              <dt className="mb-0.5 font-label-md text-label-md text-on-surface-variant">Procedencia</dt>
              <dd className="font-body-md text-body-md font-semibold text-primary">
                {pedido.procedencia || '—'}
              </dd>
            </div>

            <div className="sm:col-span-1 md:col-span-2">
              <dt className="mb-0.5 font-label-md text-label-md text-on-surface-variant">Subsecretaría</dt>
              <dd className="font-body-md text-body-md text-on-surface">
                {pedido.subsecretaria || 'Subsecretaría de Políticas Sociales y Desarrollo Humano'}
              </dd>
            </div>

            {/* Asignación y Entrega */}
            {(pedido.nombreVehiculo || pedido.entregador || pedido.fechaEntrega) && (
              <div className="rounded-lg border border-secondary/20 bg-secondary/5 p-3 sm:col-span-2 md:col-span-3">
                <div className="mb-2 flex items-center gap-2 font-body-md-bold text-body-md-bold text-secondary">
                  <Truck className="h-4 w-4" />
                  <span>Datos de Vehículo y Reparto</span>
                </div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 font-body-md text-body-md">
                  <div>
                    <span className="text-xs text-on-surface-variant block">Vehículo:</span>
                    <span className="font-semibold text-on-surface">{pedido.nombreVehiculo || '—'}</span>
                  </div>
                  <div>
                    <span className="text-xs text-on-surface-variant block">Encargado del Reparto / Entregador:</span>
                    <span className="font-semibold text-on-surface">{pedido.entregador || '—'}</span>
                  </div>
                  <div>
                    <span className="text-xs text-on-surface-variant block">Fecha de Entrega:</span>
                    <span className="font-semibold text-on-surface">{pedido.fechaEntrega || '—'}</span>
                  </div>
                </div>
              </div>
            )}

            {pedido.observaciones && (
              <div className="pt-2 sm:col-span-2 md:col-span-3">
                <dt className="mb-1 font-label-md text-label-md text-on-surface-variant">Observaciones</dt>
                <dd className="whitespace-pre-line rounded-lg border border-outline-variant/50 bg-surface-bright p-3.5 font-body-md text-body-md leading-relaxed text-on-surface">
                  {pedido.observaciones}
                </dd>
              </div>
            )}

            {pedido.obsEntrerga && (
              <div className="pt-2 sm:col-span-2 md:col-span-3">
                <dt className="mb-1 font-label-md text-label-md text-on-surface-variant">Observaciones de Entrega</dt>
                <dd className="whitespace-pre-line rounded-lg border border-outline-variant/50 bg-surface-bright p-3.5 font-body-md text-body-md leading-relaxed text-on-surface">
                  {pedido.obsEntrerga}
                </dd>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* 5. Tarjeta 'Productos Solicitados' */}
      <section className="rounded-xl border border-surface-variant bg-surface-container-lowest p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between border-b border-surface-container pb-3">
          <div>
            <h2 className="flex items-center gap-2 font-headline-sm text-headline-sm font-bold text-on-surface">
              <Package className="h-5 w-5 text-secondary" />
              Productos Solicitados
            </h2>
            <p className="mt-0.5 font-label-md text-label-md text-on-surface-variant">
              Bienes e insumos solicitados para este pedido
            </p>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-surface-container-low px-3 py-1 font-label-md text-label-md text-outline">
            <CheckCircle className="h-4 w-4" />
            {pedido.detalles.length} {pedido.detalles.length === 1 ? 'ítem' : 'ítems'}
          </span>
        </div>

        {pedido.detalles.length === 0 ? (
          <div className="rounded-lg border border-surface-variant bg-surface-bright p-8 text-center text-ink-soft">
            <p className="font-body-md text-body-md">No hay productos cargados para este pedido.</p>
          </div>
        ) : (
          <>
            {/* Vista Desktop */}
            <div className="hidden overflow-x-auto rounded-lg border border-outline-variant/50 lg:block">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="bg-primary-container text-on-primary">
                    <th className="px-4 py-3 font-headline-sm text-sm font-bold uppercase tracking-[0.02em]">
                      Rubro
                    </th>
                    <th className="px-4 py-3 font-headline-sm text-sm font-bold uppercase tracking-[0.02em]">
                      Necesidad / Artículo
                    </th>
                    <th className="px-4 py-3 font-headline-sm text-sm font-bold uppercase tracking-[0.02em]">
                      Cantidad
                    </th>
                    <th className="px-4 py-3 font-headline-sm text-sm font-bold uppercase tracking-[0.02em]">
                      Observaciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/30 font-body-md text-body-md">
                  {pedido.detalles.map((detalle: DetallePedido, index: number) => (
                    <tr
                      key={detalle.id || index}
                      className={
                        index % 2 === 0
                          ? 'bg-surface-container-lowest hover:bg-surface-container-low/40'
                          : 'bg-surface-bright hover:bg-surface-container-low/40'
                      }
                    >
                      <td className="px-4 py-3.5 font-body-md-bold text-on-surface">
                        <span className="inline-flex items-center gap-1.5">
                          {iconoRubro(detalle.rubro)}
                          {detalle.rubro || 'General'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-on-surface">{detalle.necesidad || '—'}</td>
                      <td className="px-4 py-3.5 font-body-md-bold text-primary">
                        {detalle.cantidad ?? 1}
                      </td>
                      <td className="px-4 py-3.5 text-on-surface-variant">
                        {detalle.observaciones || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Vista Mobile/Tablet */}
            <div className="flex flex-col gap-3 lg:hidden">
              {pedido.detalles.map((detalle: DetallePedido, index: number) => (
                <div
                  key={detalle.id || index}
                  className="rounded-lg border border-surface-variant bg-surface-container-low/40 p-4"
                >
                  <div className="flex items-center justify-between border-b border-surface-variant pb-2">
                    <span className="inline-flex items-center gap-1.5 font-body-md-bold text-on-surface">
                      {iconoRubro(detalle.rubro)}
                      {detalle.rubro || 'General'}
                    </span>
                    <span className="rounded bg-primary/10 px-2 py-0.5 font-body-md-bold text-primary">
                      Cant: {detalle.cantidad ?? 1}
                    </span>
                  </div>
                  <div className="mt-2 text-sm text-on-surface">
                    <strong>Artículo:</strong> {detalle.necesidad || '—'}
                  </div>
                  {detalle.observaciones && (
                    <div className="mt-1 text-xs text-on-surface-variant">
                      <strong>Obs:</strong> {detalle.observaciones}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </section>

      {/* 6. Barra inferior */}
      <footer className="flex flex-col items-center justify-between gap-4 rounded-xl border border-surface-variant bg-surface-container-lowest p-5 shadow-sm sm:flex-row print:hidden">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-container text-outline">
            <Package className="h-5 w-5" />
          </div>
          <div>
            <p className="font-body-md-bold text-body-md-bold text-on-surface">
              Pedido #{pedido.id}
            </p>
            <p className="font-label-sm text-label-sm text-on-surface-variant">
              Registro cargado en la plataforma de Emergencias de la Municipalidad de Córdoba.
            </p>
          </div>
        </div>
        <div className="flex w-full flex-col sm:flex-row items-center gap-3 sm:w-auto">
          <button
            type="button"
            onClick={() => setModalVistaPrevia(true)}
            className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg bg-primary-container px-5 py-2 font-label-lg text-label-lg font-bold text-white shadow-xs transition-colors hover:bg-primary-container/90 active:scale-[0.98] sm:w-auto"
          >
            <Eye className="h-4 w-4" />
            <span>Vista previa</span>
          </button>
          <button
            type="button"
            onClick={handleImprimir}
            className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg border border-primary-container px-5 py-2 font-label-lg text-label-lg text-primary-container transition-colors hover:bg-primary-container/5 sm:w-auto"
          >
            <Printer className="h-4 w-4" />
            <span>Imprimir Comprobante</span>
          </button>
        </div>
      </footer>

      {/* Modal: Rechazar Pedido */}
      {modalRechazar && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-primary/40 p-4 backdrop-blur-xs"
        >
          <div className="w-full max-w-lg rounded-2xl border border-white/80 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-page pb-3">
              <div className="flex items-center gap-2 text-error">
                <XCircle className="h-6 w-6" />
                <h3 className="font-headline-sm text-headline-sm font-bold">
                  Rechazar Solicitud #{pedido.id}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setModalRechazar(false)}
                className="rounded-lg p-1 text-ink-soft hover:bg-page hover:text-ink"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmarRechazo} className="mt-4 space-y-4">
              <p className="text-xs text-on-surface-variant">
                Indique el motivo por el cual se rechaza la solicitud. Esta información quedará registrada en las observaciones del pedido.
              </p>

              <div className="space-y-1.5">
                <label htmlFor="motivoRechazo" className="block font-body-md-bold text-xs text-ink">
                  Motivo de Rechazo <span className="text-error">*</span>
                </label>
                <textarea
                  id="motivoRechazo"
                  required
                  rows={3}
                  value={motivoRechazo}
                  onChange={(e) => setMotivoRechazo(e.target.value)}
                  placeholder="Escriba el motivo detallado del rechazo..."
                  className="w-full rounded-lg border border-field bg-white p-3 font-body-md text-sm text-ink focus:border-error focus:outline-none focus:ring-2 focus:ring-error/20"
                />
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-page pt-4">
                <button
                  type="button"
                  onClick={() => setModalRechazar(false)}
                  className="min-h-[44px] rounded-lg border border-line px-4 py-2 font-label-md text-sm text-ink hover:bg-page"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={rechazarMutation.isPending}
                  className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-error px-5 py-2 font-label-md text-sm font-semibold text-white shadow-xs hover:bg-error/90 disabled:opacity-50"
                >
                  {rechazarMutation.isPending ? 'Guardando...' : 'Confirmar Rechazo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Asignar Pedido */}
      {modalAsignar && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-primary/40 p-4 backdrop-blur-xs"
        >
          <div className="w-full max-w-lg rounded-2xl border border-white/80 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-page pb-3">
              <div className="flex items-center gap-2 text-primary">
                <Truck className="h-6 w-6 text-secondary" />
                <h3 className="font-headline-sm text-headline-sm font-bold">
                  Asignar Entrega #{pedido.id}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setModalAsignar(false)}
                className="rounded-lg p-1 text-ink-soft hover:bg-page hover:text-ink"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmarAsignacion} className="mt-4 space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="nombreVehiculo" className="block font-body-md-bold text-xs text-ink">
                  Vehículo <span className="text-error">*</span>
                </label>
                <input
                  id="nombreVehiculo"
                  type="text"
                  required
                  value={nombreVehiculo}
                  onChange={(e) => setNombreVehiculo(e.target.value)}
                  placeholder="Nombre o identificador del vehículo"
                  className="min-h-[46px] w-full rounded-lg border border-field bg-white px-3 font-body-md text-sm text-ink focus:border-success focus:outline-none focus:ring-2 focus:ring-success/20"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="entregador" className="block font-body-md-bold text-xs text-ink">
                  Encargado del Reparto / Entregador <span className="text-error">*</span>
                </label>
                <input
                  id="entregador"
                  type="text"
                  required
                  value={entregador}
                  onChange={(e) => setEntregador(e.target.value)}
                  placeholder="Nombre y apellido del entregador"
                  className="min-h-[46px] w-full rounded-lg border border-field bg-white px-3 font-body-md text-sm text-ink focus:border-success focus:outline-none focus:ring-2 focus:ring-success/20"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="fechaEntrega" className="block font-body-md-bold text-xs text-ink">
                  Fecha de Entrega Programada <span className="text-error">*</span>
                </label>
                <input
                  id="fechaEntrega"
                  type="date"
                  required
                  value={fechaEntrega}
                  onChange={(e) => setFechaEntrega(e.target.value)}
                  className="min-h-[46px] w-full rounded-lg border border-field bg-white px-3 font-body-md text-sm text-ink focus:border-success focus:outline-none focus:ring-2 focus:ring-success/20"
                />
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-page pt-4">
                <button
                  type="button"
                  onClick={() => setModalAsignar(false)}
                  className="min-h-[44px] rounded-lg border border-line px-4 py-2 font-label-md text-sm text-ink hover:bg-page"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={asignarMutation.isPending}
                  className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-primary-container px-5 py-2 font-label-md text-sm font-semibold text-white shadow-xs hover:bg-primary-container/90 disabled:opacity-50"
                >
                  {asignarMutation.isPending ? 'Asignando...' : 'Confirmar Asignación'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Confirmar Entregado */}
      {modalEntregado && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="tituloConfirmarEntrega"
          className="fixed inset-0 z-50 flex items-center justify-center bg-primary/40 p-4 backdrop-blur-xs"
        >
          <div className="w-full max-w-md rounded-2xl border border-white/80 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-page pb-3">
              <div className="flex items-center gap-2 text-secondary">
                <CheckCircle className="h-6 w-6" />
                <h3 id="tituloConfirmarEntrega" className="font-headline-sm text-headline-sm font-bold">
                  Confirmar entrega #{pedido.id}
                </h3>
              </div>
              <button
                type="button"
                aria-label="Cerrar"
                onClick={() => setModalEntregado(false)}
                className="rounded-lg p-1 text-ink-soft hover:bg-page hover:text-ink"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-sm text-ink">
              <p>
                ¿Confirmás que el pedido de <strong>{pedido.nombreCompleto ?? 'este beneficiario'}</strong>{' '}
                fue entregado?
              </p>
              <p className="text-xs text-on-surface-variant">
                El pedido pasará a <strong>Entregado</strong>.
              </p>
              <div className="space-y-1.5">
                <label htmlFor="fechaEntregado" className="block font-body-md-bold text-xs text-ink">
                  Fecha de entrega
                </label>
                <input
                  id="fechaEntregado"
                  type="date"
                  required
                  value={fechaResultado}
                  max={hoyISO()}
                  onChange={(e) => setFechaResultado(e.target.value)}
                  className="min-h-[46px] w-full rounded-lg border border-field bg-white px-3 font-body-md text-sm text-ink focus:border-success focus:outline-none focus:ring-2 focus:ring-success/20"
                />
              </div>
            </div>

            <div className="mt-5 flex items-center justify-end gap-2 border-t border-page pt-4">
              <button
                type="button"
                onClick={() => setModalEntregado(false)}
                disabled={entregarMutation.isPending}
                className="min-h-[44px] rounded-lg border border-line px-4 py-2 font-label-md text-sm text-ink hover:bg-page disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleEntregado}
                disabled={entregarMutation.isPending || !fechaResultado || fechaResultado > hoyISO()}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-secondary px-5 py-2 font-label-md text-sm font-semibold text-white shadow-xs hover:bg-secondary/90 disabled:opacity-50"
              >
                {entregarMutation.isPending ? 'Guardando...' : 'Confirmar Entrega'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: No Entregado */}
      {modalNoEntregado && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-primary/40 p-4 backdrop-blur-xs"
        >
          <div className="w-full max-w-lg rounded-2xl border border-white/80 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-page pb-3">
              <div className="flex items-center gap-2 text-error">
                <XCircle className="h-6 w-6" />
                <h3 className="font-headline-sm text-headline-sm font-bold">
                  Registrar No Entrega #{pedido.id}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setModalNoEntregado(false)}
                className="rounded-lg p-1 text-ink-soft hover:bg-page hover:text-ink"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmarNoEntregado} className="mt-4 space-y-4">
              <p className="text-xs text-on-surface-variant">
                Seleccione el motivo de la no entrega del pedido:
              </p>

              <div className="space-y-2">
                {[
                  'No se encontró el lugar',
                  'No estaba el destinatario',
                  'Otros',
                ].map((opcion) => (
                  <label
                    key={opcion}
                    className="flex cursor-pointer items-center gap-3 rounded-lg border border-line p-3 text-sm text-ink hover:bg-surface-bright"
                  >
                    <input
                      type="radio"
                      name="opcionNoEntrega"
                      value={opcion}
                      checked={opcionNoEntregado === opcion}
                      onChange={(e) => setOpcionNoEntregado(e.target.value)}
                      className="text-error focus:ring-error"
                    />
                    <span>{opcion}</span>
                  </label>
                ))}
              </div>

              {opcionNoEntregado === 'Otros' && (
                <div className="space-y-1.5">
                  <label htmlFor="otroMotivo" className="block font-body-md-bold text-xs text-ink">
                    Especifique el motivo <span className="text-error">*</span>
                  </label>
                  <textarea
                    id="otroMotivo"
                    required
                    rows={3}
                    value={otroMotivoNoEntregado}
                    onChange={(e) => setOtroMotivoNoEntregado(e.target.value)}
                    placeholder="Detalle el motivo por el cual no se pudo entregar..."
                    className="w-full rounded-lg border border-field bg-white p-3 font-body-md text-sm text-ink focus:border-error focus:outline-none focus:ring-2 focus:ring-error/20"
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <label htmlFor="fechaNoEntregado" className="block font-body-md-bold text-xs text-ink">
                  Fecha
                </label>
                <input
                  id="fechaNoEntregado"
                  type="date"
                  required
                  value={fechaResultado}
                  max={hoyISO()}
                  onChange={(e) => setFechaResultado(e.target.value)}
                  className="min-h-[46px] w-full rounded-lg border border-field bg-white px-3 font-body-md text-sm text-ink focus:border-success focus:outline-none focus:ring-2 focus:ring-success/20"
                />
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-page pt-4">
                <button
                  type="button"
                  onClick={() => setModalNoEntregado(false)}
                  className="min-h-[44px] rounded-lg border border-line px-4 py-2 font-label-md text-sm text-ink hover:bg-page"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={noEntregarMutation.isPending || !fechaResultado || fechaResultado > hoyISO()}
                  className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-error px-5 py-2 font-label-md text-sm font-semibold text-white shadow-xs hover:bg-error/90 disabled:opacity-50"
                >
                  {noEntregarMutation.isPending ? 'Guardando...' : 'Confirmar No Entrega'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Reintentar Entrega */}
      {modalReintentar && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="titulo-reintentar"
          className="fixed inset-0 z-50 flex items-center justify-center bg-primary/40 p-4 backdrop-blur-xs"
        >
          <div className="w-full max-w-lg rounded-2xl border border-white/80 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-page pb-3">
              <div className="flex items-center gap-2 text-primary">
                <RotateCcw className="h-6 w-6" />
                <h3 id="titulo-reintentar" className="font-headline-sm text-headline-sm font-bold">
                  Reintentar Entrega #{pedido.id}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setModalReintentar(false)}
                className="rounded-lg p-1 text-ink-soft hover:bg-page hover:text-ink"
                aria-label="Cerrar diálogo"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <p className="font-body-md text-sm text-ink">
                ¿Querés volver a poner este pedido en <strong>Para Asignar</strong> para reintentar la entrega?
              </p>

              {/* Motivo de la no entrega anterior para dar contexto */}
              <div className="rounded-lg border border-line bg-surface-container-low p-3.5 space-y-1">
                <p className="font-label-md text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                  Motivo de no entrega anterior
                </p>
                <p className="text-sm font-medium text-error">
                  {pedido.obsEntrerga?.trim() || 'Sin motivo registrado'}
                </p>
                {pedido.fechaEntrega && (
                  <p className="text-xs text-ink-soft">
                    Fecha del intento: {formatFecha(pedido.fechaEntrega)}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-page pt-4">
                <button
                  type="button"
                  disabled={reintentarMutation.isPending}
                  onClick={() => setModalReintentar(false)}
                  className="min-h-[44px] rounded-lg border border-line px-4 py-2 font-label-md text-sm text-ink hover:bg-page disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={reintentarMutation.isPending}
                  onClick={handleConfirmarReintento}
                  className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-primary-container px-5 py-2 font-label-md text-sm font-semibold text-white shadow-xs hover:bg-primary-container/90 disabled:opacity-50"
                >
                  {reintentarMutation.isPending ? 'Guardando...' : 'Confirmar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>

    {/* Modal de vista previa y descarga PDF */}
    {modalVistaPrevia && (
      <ModalVistaPrevia
        pedido={pedido}
        isOpen={modalVistaPrevia}
        onCerrar={() => setModalVistaPrevia(false)}
      />
    )}

    {/* Lo que sale al imprimir directamente cuando el modal NO está abierto */}
    {!modalVistaPrevia && <HojaPedido pedido={pedido} />}
    </>
  )
}
