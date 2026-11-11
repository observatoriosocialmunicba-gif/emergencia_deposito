import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  Edit2,
  HeartPulse,
  Home,
  Layers,
  Lock,
  MapPin,
  Package,
  Phone,
  Plus,
  Search,
  Shirt,
  Sparkles,
  Trash2,
  User,
  UserCheck,
  UserPlus,
  Utensils,
  X,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import Spinner from '../../components/Spinner'
import { useAuth } from '../../context/AuthContext'
import { useAreas } from '../../hooks/useAreas'
import { useBarrios } from '../../hooks/useBarrios'
import {
  useActualizarPedido,
  useCrearPedido,
  usePedidoDetalle,
} from '../../hooks/usePedidos'
import {
  useActualizarPersona,
  useCrearPersona,
  usePersonas,
} from '../../hooks/usePersonas'
import { useProductos } from '../../hooks/useProductos'
import { useDebounce } from '../../hooks/useTiempo'
import { formatFecha, hoyISO } from '../../lib/estados'
import type { Barrio, Persona } from '../../lib/types'

const OPCIONES_PROCEDENCIA = [
  'Redes Sociales',
  'Copa de leche / Comedores',
  'Particulares',
  'Referentes Barriales',
  'Pedido de TS',
  'Privada Raúl',
  'Servidores',
  'Cooperativas',
  'Otras',
]

interface ArticuloItem {
  id?: number
  rubro: string
  necesidad: string
  cantidad: number
  observaciones: string
}

function iconoRubro(rubro: string) {
  const r = rubro.toLowerCase()
  if (r.includes('alimento')) return <Utensils className="h-4 w-4 text-secondary" />
  if (r.includes('vivienda')) return <Home className="h-4 w-4 text-secondary" />
  if (r.includes('salud')) return <HeartPulse className="h-4 w-4 text-secondary" />
  if (r.includes('ropa')) return <Shirt className="h-4 w-4 text-secondary" />
  if (r.includes('insumo')) return <Layers className="h-4 w-4 text-secondary" />
  if (r.includes('higiene')) return <Sparkles className="h-4 w-4 text-secondary" />
  return <Package className="h-4 w-4 text-secondary" />
}

export default function NuevaSolicitudPage() {
  const navigate = useNavigate()
  const { usuario, usuarioLoading } = useAuth()

  // Paso del asistente (1, 2, 3)
  const [paso, setPaso] = useState<1 | 2 | 3>(1)

  // Datos acumulados
  const [personaSeleccionada, setPersonaSeleccionada] = useState<Persona | null>(null)

  // Datos del Pedido (Paso 2)
  const [nombreCompleto, setNombreCompleto] = useState('')
  const [dni, setDni] = useState('')
  const [telefono, setTelefono] = useState('')
  const [barrio, setBarrio] = useState('')
  const [direccion, setDireccion] = useState('')
  const [coordenadas, setCoordenadas] = useState('')
  const [discapacidad, setDiscapacidad] = useState(false)
  const [procedencia, setProcedencia] = useState('')
  const [areaId, setAreaId] = useState<number | null>(usuario?.area_id ?? null)
  const [subsecretaria, setSubsecretaria] = useState('')
  const [observaciones, setObservaciones] = useState('')
  const [erroresPaso2, setErroresPaso2] = useState<string[]>([])

  // Datos de Artículos (Paso 3)
  const [articulos, setArticulos] = useState<ArticuloItem[]>([])
  const [rubroSelect, setRubroSelect] = useState('Alimento')
  const [necesidadSelect, setNecesidadSelect] = useState('')
  const [cantidadInput, setCantidadInput] = useState(1)
  const [obsArticulo, setObsArticulo] = useState('')
  const [errorArticulos, setErrorArticulos] = useState<string | null>(null)

  // Modales
  const [modalPersona, setModalPersona] = useState(false)
  const [personaEnEdicion, setPersonaEnEdicion] = useState<Persona | null>(null)
  const [formNombrePersona, setFormNombrePersona] = useState('')
  const [formDniPersona, setFormDniPersona] = useState('')
  const [formTelPersona, setFormTelPersona] = useState('')
  const [formGeneroPersona, setFormGeneroPersona] = useState('')
  const [modalPersonaError, setModalPersonaError] = useState<string | null>(null)

  const [modalConfirmar, setModalConfirmar] = useState(false)
  const [guardandoError, setGuardandoError] = useState<string | null>(null)

  const { id } = useParams<{ id: string }>()
  const esEdicion = Boolean(id)
  const idPedido = id ? parseInt(id, 10) : 0

  const pedidoExistenteQuery = usePedidoDetalle(idPedido)
  const actualizarPedidoMutation = useActualizarPedido()

  const [cargadoId, setCargadoId] = useState<number | null>(null)

  // Consultas
  const [busquedaPersona, setBusquedaPersona] = useState('')
  const [paginaPersonas, setPaginaPersonas] = useState(0)
  const busquedaDebounced = useDebounce(busquedaPersona, 300)

  const personasQuery = usePersonas({
    busqueda: busquedaDebounced,
    pagina: paginaPersonas,
    porPagina: 5,
  })

  const barriosQuery = useBarrios()
  const productosQuery = useProductos()
  const areasQuery = useAreas()

  const crearPersonaMutation = useCrearPersona()
  const actualizarPersonaMutation = useActualizarPersona()
  const crearPedidoMutation = useCrearPedido()

  useEffect(() => {
    if (esEdicion && pedidoExistenteQuery.data && cargadoId !== idPedido) {
      const p = pedidoExistenteQuery.data
      setPersonaSeleccionada({
        id: p.idPersona ?? 0,
        nombreCompleto: p.nombreCompleto,
        dni: p.dni,
        telefono: p.telefono ?? null,
      })
      setNombreCompleto(p.nombreCompleto ?? '')
      setDni(p.dni ?? '')
      setTelefono(p.telefono ?? '')
      setBarrio(p.barrio ?? '')
      setDireccion(p.direccion ?? '')
      setCoordenadas(p.coordenadas ?? '')
      setDiscapacidad(Boolean(p.discapacidad))
      setProcedencia(p.procedencia ?? '')
      setAreaId(p.area_id ?? null)
      setSubsecretaria(p.subsecretaria ?? '')
      setObservaciones(p.observaciones ?? '')
      setArticulos(
        p.detalles.map((d) => ({
          id: d.id,
          rubro: d.rubro ?? 'Alimento',
          necesidad: d.necesidad ?? '',
          cantidad: d.cantidad ?? 1,
          observaciones: d.observaciones ?? '',
        })),
      )
      setPaso(2)
      setCargadoId(idPedido)
    }
  }, [esEdicion, pedidoExistenteQuery.data, idPedido, cargadoId])

  useEffect(() => {
    if (!esEdicion) {
      if (usuario?.rol === 'Solicitante' && usuario.area_id) {
        setAreaId(usuario.area_id)
        const a = areasQuery.data?.find((item) => item.id === usuario.area_id)
        if (a) setSubsecretaria(a.nombre)
      } else if (
        usuario?.rol === 'Administrador' &&
        !areaId &&
        areasQuery.data &&
        areasQuery.data.length > 0
      ) {
        setAreaId(areasQuery.data[0].id)
        setSubsecretaria(areasQuery.data[0].nombre)
      }
    }
  }, [esEdicion, usuario, areasQuery.data, areaId])

  if (usuarioLoading || (esEdicion && pedidoExistenteQuery.isLoading)) {
    return <Spinner />
  }

  if (
    usuario?.rol === 'Asignador' ||
    (usuario?.rol !== 'Administrador' && usuario?.rol !== 'Solicitante')
  ) {
    return (
      <div className="space-y-space-lg p-margin md:p-margin-desktop">
        <h1 className="font-headline-xl text-headline-xl font-bold tracking-tight text-primary">
          {esEdicion ? 'Editar Solicitud' : 'Nueva Solicitud'}
        </h1>
        <div className="flex items-start gap-3 rounded-xl border border-line bg-white p-space-lg text-ink-soft shadow-sm">
          <Lock className="mt-0.5 h-6 w-6 shrink-0 text-outline" />
          <div>
            <h2 className="font-body-md-bold text-body-md-bold text-ink">
              Acceso Restringido
            </h2>
            <p className="mt-1 text-sm">
              La {esEdicion ? 'edición' : 'carga'} de solicitudes está reservada para usuarios con rol{' '}
              <strong>Solicitante</strong> o <strong>Administrador</strong>.
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (esEdicion) {
    if (pedidoExistenteQuery.isError || !pedidoExistenteQuery.data) {
      return (
        <div className="space-y-space-lg p-margin md:p-margin-desktop">
          <div className="rounded-xl border border-error bg-error-container/30 p-6 text-center text-on-error-container">
            <CircleAlert className="mx-auto h-8 w-8 text-error" />
            <h2 className="mt-2 font-headline-sm text-headline-sm font-bold">
              Solicitud no encontrada
            </h2>
            <p className="mt-1 text-sm">
              No se pudo cargar la solicitud #{idPedido} o no tenés permisos para verla.
            </p>
            <div className="mt-4">
              <Link
                to="/solicitudes"
                className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-primary-container px-5 py-2 font-label-md font-bold text-white shadow-xs"
              >
                Volver a Solicitudes
              </Link>
            </div>
          </div>
        </div>
      )
    }

    const pedido = pedidoExistenteQuery.data

    if (pedido.estado !== 'Pendiente de Autorización') {
      return (
        <div className="space-y-space-lg p-margin md:p-margin-desktop">
          <h1 className="font-headline-xl text-headline-xl font-bold tracking-tight text-primary">
            Editar Solicitud #{idPedido}
          </h1>
          <div className="flex items-start gap-3 rounded-xl border border-line bg-white p-space-lg text-ink-soft shadow-sm">
            <Lock className="mt-0.5 h-6 w-6 shrink-0 text-outline" />
            <div>
              <h2 className="font-body-md-bold text-body-md-bold text-ink">
                Acceso Restringido
              </h2>
              <p className="mt-1 text-sm">
                Esta solicitud ya se encuentra en estado <strong>{pedido.estado}</strong> y solo puede ser modificada mientras esté en <strong>Pendiente de Autorización</strong>.
              </p>
              <div className="mt-4">
                <Link
                  to={`/ver-pedido/${idPedido}`}
                  className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-primary-container px-4 py-2 font-label-md font-bold text-white shadow-xs"
                >
                  Ver Solicitud
                </Link>
              </div>
            </div>
          </div>
        </div>
      )
    }

    if (usuario?.rol === 'Solicitante' && pedido.area_id !== usuario.area_id) {
      return (
        <div className="space-y-space-lg p-margin md:p-margin-desktop">
          <h1 className="font-headline-xl text-headline-xl font-bold tracking-tight text-primary">
            Editar Solicitud #{idPedido}
          </h1>
          <div className="flex items-start gap-3 rounded-xl border border-line bg-white p-space-lg text-ink-soft shadow-sm">
            <Lock className="mt-0.5 h-6 w-6 shrink-0 text-outline" />
            <div>
              <h2 className="font-body-md-bold text-body-md-bold text-ink">
                Acceso Restringido
              </h2>
              <p className="mt-1 text-sm">
                No podés editar solicitudes pertenecientes a otra área.
              </p>
              <div className="mt-4">
                <Link
                  to="/solicitudes"
                  className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-primary-container px-4 py-2 font-label-md font-bold text-white shadow-xs"
                >
                  Volver a Solicitudes
                </Link>
              </div>
            </div>
          </div>
        </div>
      )
    }
  }

  // Rubros y necesidades salen únicamente de la tabla Productos (los disponibles):
  // no se inventan opciones que no existan en la base.
  const rubrosDisponibles = [
    ...new Set(
      (productosQuery.data ?? []).map((p) => p.rubro).filter((r): r is string => Boolean(r)),
    ),
  ]
  const necesidadesDisponibles = (productosQuery.data ?? [])
    .filter((p) => p.rubro?.toLowerCase() === rubroSelect.toLowerCase() && p.necesidad)
    .map((p) => p.necesidad as string)

  // Selección de persona -> Auto-completar Paso 2
  function handleSeleccionarPersona(p: Persona) {
    setPersonaSeleccionada(p)
    setNombreCompleto(p.nombreCompleto ?? '')
    setDni(p.dni ?? '')
    setTelefono(p.telefono ?? '')
    setPaso(2)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Las coordenadas NO se completan con el centro del barrio: se cargan a mano (o con el mapa,
  // cuando se migre "Cargar Coordenadas"), porque después se muestran como ubicación exacta.
  function handleCambioBarrio(nombreBarrio: string) {
    setBarrio(nombreBarrio)
  }

  // Validación y paso al Paso 3
  function handleValidarPaso2(e: FormEvent) {
    e.preventDefault()
    const errs: string[] = []
    if (!barrio.trim()) errs.push('Debe seleccionar un Barrio.')
    if (!direccion.trim()) errs.push('Debe cargar la Dirección del destinatario.')
    if (!procedencia.trim()) errs.push('Debe indicar la Procedencia de la solicitud.')
    if (!subsecretaria.trim() || !areaId) errs.push('Debe seleccionar la Subsecretaría demandante.')

    if (errs.length > 0) {
      setErroresPaso2(errs)
      return
    }

    setErroresPaso2([])
    setPaso(3)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Manejo de Artículos
  function handleAgregarArticulo(e: FormEvent) {
    e.preventDefault()
    const nec = necesidadSelect || necesidadesDisponibles[0]
    if (!nec) {
      setErrorArticulos('Seleccione una necesidad o artículo.')
      return
    }

    setArticulos((prev) => [
      ...prev,
      {
        rubro: rubroSelect,
        necesidad: nec,
        cantidad: Math.max(1, cantidadInput),
        observaciones: obsArticulo.trim(),
      },
    ])

    setCantidadInput(1)
    setObsArticulo('')
    setErrorArticulos(null)
  }

  function handleEliminarArticulo(index: number) {
    setArticulos((prev) => prev.filter((_, i) => i !== index))
  }

  // Modal Persona: Abrir para Nueva
  function handleAbrirModalNuevaPersona() {
    setPersonaEnEdicion(null)
    setFormNombrePersona('')
    setFormDniPersona('')
    setFormTelPersona('')
    setFormGeneroPersona('')
    setModalPersonaError(null)
    setModalPersona(true)
  }

  // Modal Persona: Abrir para Editar
  function handleAbrirModalEditarPersona(p: Persona) {
    setPersonaEnEdicion(p)
    setFormNombrePersona(p.nombreCompleto ?? '')
    setFormDniPersona(p.dni ?? '')
    setFormTelPersona(p.telefono ?? '')
    setFormGeneroPersona(p.genero ?? '')
    setModalPersonaError(null)
    setModalPersona(true)
  }

  // Guardar Persona (Crear / Actualizar)
  async function handleGuardarPersona(e: FormEvent) {
    e.preventDefault()
    if (!formNombrePersona.trim() || !formDniPersona.trim()) {
      setModalPersonaError('Nombre y DNI son obligatorios.')
      return
    }

    setModalPersonaError(null)
    try {
      if (personaEnEdicion) {
        const actualizada = await actualizarPersonaMutation.mutateAsync({
          id: personaEnEdicion.id,
          persona: {
            nombreCompleto: formNombrePersona.trim(),
            dni: formDniPersona.trim(),
            telefono: formTelPersona.trim() || null,
            genero: formGeneroPersona.trim() || null,
          },
        })
        if (personaSeleccionada?.id === actualizada.id) {
          setPersonaSeleccionada(actualizada)
          setNombreCompleto(actualizada.nombreCompleto ?? '')
          setDni(actualizada.dni ?? '')
          setTelefono(actualizada.telefono ?? '')
        }
      } else {
        const nueva = await crearPersonaMutation.mutateAsync({
          nombreCompleto: formNombrePersona.trim(),
          dni: formDniPersona.trim(),
          telefono: formTelPersona.trim() || null,
          genero: formGeneroPersona.trim() || null,
        })
        handleSeleccionarPersona(nueva)
      }
      setModalPersona(false)
    } catch (err: unknown) {
      setModalPersonaError(
        err instanceof Error ? err.message : 'Error al procesar los datos de la persona.',
      )
    }
  }

  // Guardar Solicitud Definitiva
  async function handleConfirmarGuardarPedido() {
    if (!personaSeleccionada) return
    if (articulos.length === 0) {
      setErrorArticulos('Debe cargar al menos un artículo o necesidad.')
      setModalConfirmar(false)
      return
    }

    setGuardandoError(null)
    try {
      if (esEdicion) {
        await actualizarPedidoMutation.mutateAsync({
          idPedido,
          pedido: {
            nombreCompleto: nombreCompleto.trim(),
            dni: dni.trim(),
            telefono: telefono.trim() || null,
            barrio: barrio.trim(),
            direccion: direccion.trim(),
            coordenadas: coordenadas.trim() || null,
            discapacidad,
            procedencia: procedencia.trim(),
            observaciones: observaciones.trim() || null,
            ultModificacion: usuario?.nombreCompleto ?? null,
          },
          detalles: articulos.map((a) => ({
            id: a.id,
            rubro: a.rubro,
            necesidad: a.necesidad,
            cantidad: a.cantidad,
            observaciones: a.observaciones || null,
          })),
          idPersona: personaSeleccionada.id,
        })

        setModalConfirmar(false)
        navigate(`/ver-pedido/${idPedido}`)
      } else {
        const nuevoId = await crearPedidoMutation.mutateAsync({
          pedido: {
            fecha: hoyISO(),
            idPersona: personaSeleccionada.id,
            nombreCompleto: nombreCompleto.trim(),
            dni: dni.trim(),
            telefono: telefono.trim() || null,
            barrio: barrio.trim(),
            direccion: direccion.trim(),
            coordenadas: coordenadas.trim() || null,
            discapacidad,
            procedencia: procedencia.trim(),
            subsecretaria: subsecretaria.trim(),
            area_id: areaId,
            observaciones: observaciones.trim() || null,
            idUsuario: usuario?.id ?? null,
            ultModificacion: usuario?.nombreCompleto ?? null,
          },
          detalles: articulos.map((a) => ({
            rubro: a.rubro,
            necesidad: a.necesidad,
            cantidad: a.cantidad,
            observaciones: a.observaciones || null,
          })),
        })

        setModalConfirmar(false)
        navigate(`/ver-pedido/${nuevoId}`)
      }
    } catch (err: unknown) {
      setGuardandoError(
        err instanceof Error ? err.message : 'Error al guardar la solicitud en el sistema.',
      )
    }
  }

  return (
    <div className="space-y-space-lg p-margin md:p-margin-desktop">
      {/* 1. Breadcrumb y Botón Volver */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <nav
          aria-label="Migas de pan"
          className="flex items-center gap-2 font-label-md text-label-md text-on-surface-variant"
        >
          <Link to="/estado-pedidos" className="transition-colors hover:text-primary-container">
            Inicio
          </Link>
          <ChevronRight size={14} />
          <Link to="/solicitudes" className="transition-colors hover:text-primary-container">
            Solicitudes
          </Link>
          <ChevronRight size={14} />
          {esEdicion ? (
            <>
              <Link
                to={`/ver-pedido/${idPedido}`}
                className="transition-colors hover:text-primary-container"
              >
                Solicitud #{idPedido}
              </Link>
              <ChevronRight size={14} />
              <span className="font-body-md-bold text-primary">Editar</span>
            </>
          ) : (
            <span className="font-body-md-bold text-primary">Nueva Solicitud</span>
          )}
        </nav>
        <Link
          to={esEdicion ? `/ver-pedido/${idPedido}` : '/solicitudes'}
          className="inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-outline-variant/60 bg-white px-4 font-label-lg text-label-lg text-primary shadow-xs transition-colors hover:bg-surface-container active:scale-[0.98]"
        >
          <ArrowLeft size={18} />
          <span>{esEdicion ? 'Volver al Pedido' : 'Volver a Solicitudes'}</span>
        </Link>
      </div>

      {/* 2. Título Principal */}
      <div className="flex flex-col gap-1">
        <h1 className="font-headline-xl text-headline-xl font-bold tracking-tight text-primary">
          {esEdicion ? `Editar Solicitud #${idPedido}` : 'Nueva Solicitud de Emergencia'}
        </h1>
        {esEdicion && (
          <p className="text-sm text-ink-soft">
            Modificá los datos del pedido o los artículos mientras se encuentra en estado{' '}
            <span className="font-semibold text-secondary">Pendiente de Autorización</span>.
          </p>
        )}
      </div>

      {/* 3. Stepper de 3 Pasos */}
      <section
        aria-label="Progreso del trámite"
        className="rounded-xl border border-outline-variant/60 bg-surface-container-lowest p-4 shadow-sm"
      >
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {/* Paso 1 */}
          <div
            onClick={() => setPaso(1)}
            className={`flex cursor-pointer items-center gap-3 rounded-lg p-3 transition-all ${
              paso === 1
                ? 'border-2 border-secondary bg-surface-container-low shadow-xs'
                : 'border border-outline-variant/40 bg-surface-container-lowest hover:bg-surface-container-low/50'
            }`}
          >
            <div
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-bold ${
                personaSeleccionada
                  ? 'bg-secondary text-white'
                  : paso === 1
                    ? 'bg-primary-container text-white'
                    : 'bg-surface-variant text-on-surface-variant'
              }`}
            >
              {personaSeleccionada ? <Check size={16} /> : '1'}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-label-sm text-label-sm font-bold uppercase tracking-wider text-secondary">
                Paso 1
              </span>
              <span className="truncate font-body-md-bold text-body-md-bold text-on-surface">
                1. Destinatario
              </span>
            </div>
          </div>

          {/* Paso 2 */}
          <div
            onClick={() => {
              if (personaSeleccionada) setPaso(2)
            }}
            className={`flex items-center gap-3 rounded-lg p-3 transition-all ${
              paso === 2
                ? 'border-2 border-secondary bg-surface-container-low shadow-xs'
                : 'border border-outline-variant/40 bg-surface-container-lowest'
            } ${personaSeleccionada ? 'cursor-pointer hover:bg-surface-container-low/50' : 'opacity-60'}`}
          >
            <div
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-bold ${
                paso === 2
                  ? 'bg-primary-container text-white'
                  : paso === 3
                    ? 'bg-secondary text-white'
                    : 'bg-surface-variant text-on-surface-variant'
              }`}
            >
              {paso === 3 ? <Check size={16} /> : '2'}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-label-sm text-label-sm font-bold uppercase tracking-wider text-secondary">
                Paso 2
              </span>
              <span className="truncate font-body-md-bold text-body-md-bold text-on-surface">
                2. Pedido y Ubicación
              </span>
            </div>
          </div>

          {/* Paso 3 */}
          <div
            onClick={() => {
              if (personaSeleccionada && barrio && direccion && procedencia) setPaso(3)
            }}
            className={`flex items-center gap-3 rounded-lg p-3 transition-all ${
              paso === 3
                ? 'border-2 border-secondary bg-surface-container-low shadow-xs'
                : 'border border-outline-variant/40 bg-surface-container-lowest'
            } ${
              personaSeleccionada && barrio && direccion && procedencia
                ? 'cursor-pointer hover:bg-surface-container-low/50'
                : 'opacity-60'
            }`}
          >
            <div
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-bold ${
                paso === 3
                  ? 'bg-primary-container text-white'
                  : 'bg-surface-variant text-on-surface-variant'
              }`}
            >
              3
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-label-sm text-label-sm font-bold uppercase tracking-wider text-secondary">
                Paso 3
              </span>
              <span className="truncate font-body-md-bold text-body-md-bold text-on-surface">
                3. Artículos e Insumos
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* PASO 1: SELECCIONAR DESTINATARIO */}
      {/* ========================================================================= */}
      {paso === 1 && (
        <div className="space-y-6">
          <div className="rounded-xl border border-outline-variant/50 bg-surface-container-lowest p-6 shadow-sm">
            <div className="flex flex-col justify-between gap-4 border-b border-surface-container pb-4 sm:flex-row sm:items-center">
              <div>
                <span className="block font-label-sm text-label-sm font-bold uppercase tracking-wider text-secondary">
                  PASO 1
                </span>
                <h2 className="font-headline-md text-headline-md font-bold text-primary">
                  Seleccionar Destinatario
                </h2>
                <p className="mt-0.5 font-body-md text-body-md text-on-surface-variant">
                  Busque a la persona por DNI o Nombre, o registre una nueva persona en el padrón.
                </p>
              </div>

              <button
                type="button"
                onClick={handleAbrirModalNuevaPersona}
                className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg bg-primary-container px-5 py-2.5 font-label-lg text-label-lg font-bold text-white shadow-xs transition-all hover:bg-primary-container/90 active:scale-[0.98]"
              >
                <UserPlus size={18} />
                <span>+ Nueva Persona</span>
              </button>
            </div>

            {/* Buscador */}
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search
                  size={20}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-outline"
                />
                <input
                  type="search"
                  value={busquedaPersona}
                  onChange={(e) => {
                    setBusquedaPersona(e.target.value)
                    setPaginaPersonas(0)
                  }}
                  placeholder="Buscar persona por DNI, Nombre o Teléfono..."
                  className="min-h-[46px] w-full rounded-lg border border-field bg-white pl-10 pr-4 font-body-md text-body-md text-on-surface focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/20"
                />
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-on-surface-variant">
                <span className="rounded-lg border border-outline-variant bg-surface-container px-3 py-2">
                  Total registradas: {personasQuery.data?.total ?? 0}
                </span>
              </div>
            </div>

            {/* Tabla de Personas */}
            <div className="mt-4 overflow-hidden rounded-xl border border-outline-variant/50">
              {personasQuery.isLoading ? (
                <div className="p-8 text-center text-ink-soft">
                  <Spinner />
                  <p className="mt-2 text-xs">Buscando personas...</p>
                </div>
              ) : personasQuery.isError ? (
                <div className="p-6 text-center text-error">
                  <CircleAlert className="mx-auto h-8 w-8" />
                  <p className="mt-2 font-body-md text-body-md">Error al cargar las personas.</p>
                </div>
              ) : (personasQuery.data?.filas.length ?? 0) === 0 ? (
                <div className="p-12 text-center text-on-surface-variant">
                  <User className="mx-auto h-12 w-12 text-outline/50" />
                  <p className="mt-2 font-headline-sm text-headline-sm font-bold text-on-surface">
                    No se encontraron personas
                  </p>
                  <p className="mt-1 font-body-md text-body-md">
                    Utilice el botón <strong>+ Nueva Persona</strong> para dar de alta al titular de la solicitud.
                  </p>
                </div>
              ) : (
                <div>
                  {/* Vista Desktop */}
                  <div className="hidden overflow-x-auto lg:block">
                    <table className="w-full border-collapse text-left">
                      <thead>
                        <tr className="bg-primary-container text-on-primary font-label-md text-label-md uppercase tracking-wider">
                          <th className="px-5 py-3.5 font-bold">Nombre y Apellido</th>
                          <th className="px-5 py-3.5 font-bold">DNI</th>
                          <th className="px-5 py-3.5 font-bold">Teléfono</th>
                          <th className="px-5 py-3.5 text-right font-bold">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-outline-variant/30 font-body-md text-body-md">
                        {personasQuery.data?.filas.map((p, i) => (
                          <tr
                            key={p.id}
                            className={`transition-colors hover:bg-surface-container-low/50 ${
                              i % 2 === 0 ? 'bg-white' : 'bg-surface-bright'
                            }`}
                          >
                            <td className="px-5 py-3.5 font-body-md-bold text-on-surface">
                              <div className="flex items-center gap-3">
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-container text-xs font-bold text-primary">
                                  {p.nombreCompleto?.slice(0, 2).toUpperCase() || 'P'}
                                </div>
                                <span>{p.nombreCompleto || 'Sin nombre'}</span>
                              </div>
                            </td>
                            <td className="px-5 py-3.5 font-mono text-on-surface">{p.dni || '—'}</td>
                            <td className="px-5 py-3.5 text-on-surface-variant">
                              {p.telefono ? (
                                <span className="flex items-center gap-1.5">
                                  <Phone size={14} className="text-outline" />
                                  {p.telefono}
                                </span>
                              ) : (
                                '—'
                              )}
                            </td>
                            <td className="px-5 py-3.5 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleAbrirModalEditarPersona(p)}
                                  className="inline-flex min-h-[40px] items-center gap-1 rounded-lg border border-outline-variant px-3 py-1.5 font-label-md text-label-md text-primary transition-colors hover:bg-surface-container"
                                >
                                  <Edit2 size={14} />
                                  <span>Editar</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleSeleccionarPersona(p)}
                                  className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg bg-secondary px-4 py-1.5 font-label-md text-label-md font-bold text-white shadow-xs transition-colors hover:bg-secondary/90 active:scale-[0.98]"
                                >
                                  <CheckCircle size={16} />
                                  <span>Seleccionar</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Vista Mobile */}
                  <div className="divide-y divide-outline-variant/30 lg:hidden">
                    {personasQuery.data?.filas.map((p) => (
                      <div key={p.id} className="space-y-2 p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-body-md-bold text-body-md-bold text-on-surface">
                              {p.nombreCompleto || 'Sin nombre'}
                            </p>
                            <p className="font-mono text-xs text-on-surface-variant">
                              DNI: {p.dni || '—'}
                            </p>
                            {p.telefono && (
                              <p className="text-xs text-on-surface-variant">Tel: {p.telefono}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => handleAbrirModalEditarPersona(p)}
                            className="flex min-h-[44px] flex-1 items-center justify-center gap-1 rounded-lg border border-outline-variant py-2 font-label-md text-label-md text-primary"
                          >
                            <Edit2 size={14} />
                            <span>Editar</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSeleccionarPersona(p)}
                            className="flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-lg bg-secondary py-2 font-label-md text-label-md font-bold text-white shadow-xs"
                          >
                            <CheckCircle size={16} />
                            <span>Seleccionar</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Paginador simple */}
                  <div className="flex items-center justify-between border-t border-outline-variant/40 bg-surface-container-low/30 px-4 py-3">
                    <span className="text-xs text-on-surface-variant">
                      Página {paginaPersonas + 1} de{' '}
                      {Math.max(1, Math.ceil((personasQuery.data?.total ?? 0) / 5))}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        disabled={paginaPersonas === 0}
                        onClick={() => setPaginaPersonas((p) => Math.max(0, p - 1))}
                        className="rounded-lg border border-outline-variant p-2 text-on-surface hover:bg-surface-container disabled:opacity-40"
                      >
                        <ChevronLeft size={16} />
                      </button>
                      <button
                        type="button"
                        disabled={
                          (paginaPersonas + 1) * 5 >= (personasQuery.data?.total ?? 0)
                        }
                        onClick={() => setPaginaPersonas((p) => p + 1)}
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
        </div>
      )}

      {/* ========================================================================= */}
      {/* PASO 2: PEDIDO Y UBICACIÓN */}
      {/* ========================================================================= */}
      {paso === 2 && (
        <form onSubmit={handleValidarPaso2} className="space-y-6">
          {/* Banner de Titular Seleccionado */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-secondary/40 bg-surface-container-low p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-white">
                <UserCheck size={20} />
              </div>
              <div>
                <span className="block text-xs font-semibold uppercase text-secondary">
                  Destinatario Seleccionado
                </span>
                <span className="font-body-md-bold text-body-md-bold text-on-surface">
                  {personaSeleccionada?.nombreCompleto} (DNI: {personaSeleccionada?.dni})
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setPaso(1)}
              className="font-label-md text-label-md font-bold text-secondary hover:underline"
            >
              Cambiar Persona
            </button>
          </div>

          {/* Errores del formulario */}
          {erroresPaso2.length > 0 && (
            <div
              role="alert"
              className="flex items-start gap-3 rounded-xl border border-error bg-error-container/40 p-4 text-on-error-container"
            >
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-error" />
              <div className="space-y-1 text-sm">
                <strong className="block font-bold">Por favor verifique los siguientes campos:</strong>
                <ul className="list-inside list-disc">
                  {erroresPaso2.map((e, idx) => (
                    <li key={idx}>{e}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Tarjeta 1: Creador de la Solicitud (Solo lectura) */}
          <div className="overflow-hidden rounded-xl border border-outline-variant/60 bg-surface-container-lowest shadow-sm">
            <div className="flex items-center justify-between border-b border-surface-container bg-surface-container-low px-6 py-3.5">
              <div className="flex items-center gap-2 text-primary">
                <User size={18} />
                <h2 className="font-headline-sm text-headline-sm font-bold">
                  Creador de la Solicitud
                </h2>
              </div>
              <span className="rounded-full bg-secondary/15 px-2.5 py-0.5 font-label-sm text-label-sm font-bold text-secondary">
                {usuario?.rol ?? 'Sin rol'}
              </span>
            </div>
            <div className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-4 font-body-md text-body-md">
              <div>
                <span className="block text-xs text-on-surface-variant font-bold">Autor / Creador</span>
                <span className="font-semibold text-on-surface">
                  {esEdicion
                    ? pedidoExistenteQuery.data?.creador?.nombreCompleto ||
                      pedidoExistenteQuery.data?.Responsable ||
                      '—'
                    : usuario?.nombreCompleto || '—'}
                </span>
              </div>
              <div>
                <span className="block text-xs text-on-surface-variant font-bold">Fecha de Registro</span>
                <span className="text-on-surface">
                  {esEdicion
                    ? formatFecha(pedidoExistenteQuery.data?.fecha ?? null)
                    : formatFecha(hoyISO())}
                </span>
              </div>
              <div>
                <span className="block text-xs text-on-surface-variant font-bold">DNI</span>
                <span className="text-on-surface">
                  {esEdicion
                    ? pedidoExistenteQuery.data?.creador?.dni ?? '—'
                    : usuario?.dni
                      ? usuario.dni.toLocaleString('es-AR')
                      : '—'}
                </span>
              </div>
              <div>
                <span className="block text-xs text-on-surface-variant font-bold">Estado</span>
                <span className="font-semibold text-secondary">
                  {esEdicion
                    ? pedidoExistenteQuery.data?.estado ?? 'Pendiente de Autorización'
                    : 'Pendiente de Autorización'}
                </span>
              </div>
            </div>
          </div>

          {/* Tarjeta 2: Detalle del Pedido */}
          <div className="overflow-hidden rounded-xl border border-outline-variant/60 bg-surface-container-lowest shadow-sm">
            <div className="flex items-center justify-between border-b border-surface-container bg-surface-container-low px-6 py-3.5">
              <div className="flex items-center gap-2 text-primary">
                <MapPin size={18} />
                <h2 className="font-headline-sm text-headline-sm font-bold">
                  Detalle del Pedido y Ubicación
                </h2>
              </div>
              <span className="text-xs text-on-surface-variant">* Campos obligatorios</span>
            </div>

            <div className="space-y-5 p-6">
              {/* Fila 1: Nombre y Teléfono */}
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div className="space-y-1.5">
                  <label htmlFor="nombre_dest" className="block font-body-md-bold text-xs text-on-surface">
                    Nombre y Apellido <span className="text-error">*</span>
                  </label>
                  <input
                    id="nombre_dest"
                    required
                    type="text"
                    value={nombreCompleto}
                    onChange={(e) => setNombreCompleto(e.target.value)}
                    className="min-h-[46px] w-full rounded-lg border border-field bg-white px-3.5 font-body-md text-sm text-on-surface focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/20"
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="tel_dest" className="block font-body-md-bold text-xs text-on-surface">
                    Teléfono de Contacto
                  </label>
                  <input
                    id="tel_dest"
                    type="text"
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    placeholder="Ej: 351 555-1234"
                    className="min-h-[46px] w-full rounded-lg border border-field bg-white px-3.5 font-body-md text-sm text-on-surface focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/20"
                  />
                </div>
              </div>

              {/* Fila 2: Barrio y Dirección */}
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div className="space-y-1.5">
                  <label htmlFor="barrio_select" className="block font-body-md-bold text-xs text-on-surface">
                    Barrio <span className="text-error">*</span>
                  </label>
                  <select
                    id="barrio_select"
                    required
                    value={barrio}
                    onChange={(e) => handleCambioBarrio(e.target.value)}
                    className="min-h-[46px] w-full rounded-lg border border-field bg-white px-3.5 font-body-md text-sm text-on-surface focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/20"
                  >
                    <option value="">Seleccione un barrio...</option>
                    {barriosQuery.data?.map((b: Barrio) => (
                      <option key={b.id} value={b.NombreBarrio ?? ''}>
                        {b.NombreBarrio}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="direccion_input" className="block font-body-md-bold text-xs text-on-surface">
                    Dirección (Calle y Número) <span className="text-error">*</span>
                  </label>
                  <input
                    id="direccion_input"
                    required
                    type="text"
                    value={direccion}
                    onChange={(e) => setDireccion(e.target.value)}
                    placeholder="Ej: Calle Aviador Mira 1420"
                    className="min-h-[46px] w-full rounded-lg border border-field bg-white px-3.5 font-body-md text-sm text-on-surface focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/20"
                  />
                </div>
              </div>

              {/* Fila 3: Coordenadas y Discapacidad */}
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div className="space-y-1.5">
                  <label htmlFor="coords_input" className="block font-body-md-bold text-xs text-on-surface">
                    Coordenadas Geográficas (Latitud, Longitud)
                  </label>
                  <input
                    id="coords_input"
                    type="text"
                    value={coordenadas}
                    onChange={(e) => setCoordenadas(e.target.value)}
                    placeholder="Ej: -31.4201, -64.1888"
                    className="min-h-[46px] w-full rounded-lg border border-field bg-white px-3.5 font-mono text-sm text-on-surface focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/20"
                  />
                </div>

                <div className="space-y-1.5">
                  <span className="block font-body-md-bold text-xs text-on-surface">
                    ¿Persona con Discapacidad?
                  </span>
                  <div className="flex h-[46px] items-center gap-4">
                    <label className="flex cursor-pointer items-center gap-2 text-sm">
                      <input
                        type="radio"
                        name="discapacidadRadio"
                        checked={!discapacidad}
                        onChange={() => setDiscapacidad(false)}
                        className="text-secondary focus:ring-secondary"
                      />
                      <span>No</span>
                    </label>
                    <label className="flex cursor-pointer items-center gap-2 text-sm">
                      <input
                        type="radio"
                        name="discapacidadRadio"
                        checked={discapacidad}
                        onChange={() => setDiscapacidad(true)}
                        className="text-secondary focus:ring-secondary"
                      />
                      <span className="font-semibold text-secondary">Sí</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Fila 4: Procedencia y Subsecretaría */}
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div className="space-y-1.5">
                  <label htmlFor="proc_select" className="block font-body-md-bold text-xs text-on-surface">
                    Procedencia del Pedido <span className="text-error">*</span>
                  </label>
                  <select
                    id="proc_select"
                    required
                    value={procedencia}
                    onChange={(e) => setProcedencia(e.target.value)}
                    className="min-h-[46px] w-full rounded-lg border border-field bg-white px-3.5 font-body-md text-sm text-on-surface focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/20"
                  >
                    <option value="">Seleccione procedencia...</option>
                    {OPCIONES_PROCEDENCIA.map((op) => (
                      <option key={op} value={op}>
                        {op}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label htmlFor="subsec_select" className="block font-body-md-bold text-xs text-on-surface">
                      Subsecretaría Demandante <span className="text-error">*</span>
                    </label>
                    {esEdicion && (
                      <span className="font-label-sm text-[11px] text-ink-soft">
                        (No modificable en edición)
                      </span>
                    )}
                  </div>
                  {esEdicion || usuario?.rol === 'Solicitante' ? (
                    <input
                      id="subsec_select"
                      type="text"
                      readOnly
                      disabled
                      value={subsecretaria || 'Área no asignada'}
                      className="min-h-[46px] w-full cursor-not-allowed rounded-lg border border-outline-variant/60 bg-surface-container-high/60 px-3.5 font-body-md text-sm text-on-surface-variant select-none"
                    />
                  ) : (
                    <select
                      id="subsec_select"
                      required
                      value={areaId ?? ''}
                      onChange={(e) => {
                        const id = Number(e.target.value)
                        setAreaId(id)
                        const a = areasQuery.data?.find((item) => item.id === id)
                        if (a) setSubsecretaria(a.nombre)
                      }}
                      className="min-h-[46px] w-full rounded-lg border border-field bg-white px-3.5 font-body-md text-sm text-on-surface focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/20"
                    >
                      <option value="">Seleccione subsecretaría...</option>
                      {areasQuery.data?.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.nombre}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              {/* Fila 5: Observaciones */}
              <div className="space-y-1.5">
                <label htmlFor="obs_pedido" className="block font-body-md-bold text-xs text-on-surface">
                  Observaciones Generales
                </label>
                <textarea
                  id="obs_pedido"
                  rows={3}
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  placeholder="Detalles sobre el caso, ubicación, pasillo o información de contacto..."
                  className="w-full rounded-lg border border-field bg-white p-3 font-body-md text-sm text-on-surface focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/20"
                />
              </div>
            </div>
          </div>

          {/* Botones de Navegación */}
          <div className="flex flex-col items-center justify-between gap-4 pt-2 sm:flex-row">
            <button
              type="button"
              onClick={() => setPaso(1)}
              className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg border border-primary-container px-6 font-label-lg text-label-lg text-primary-container transition-colors hover:bg-primary-container/5 sm:w-auto"
            >
              <ArrowLeft size={18} />
              <span>Volver al Paso 1</span>
            </button>
            <button
              type="submit"
              className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg bg-primary-container px-8 font-label-lg text-label-lg font-bold text-white shadow-md transition-all hover:bg-primary-container/90 active:scale-[0.98] sm:w-auto"
            >
              <span>Continuar a Cargar Artículos</span>
              <ArrowRight size={18} />
            </button>
          </div>
        </form>
      )}

      {/* ========================================================================= */}
      {/* PASO 3: CARGAR ARTÍCULOS */}
      {/* ========================================================================= */}
      {paso === 3 && (
        <div className="space-y-6">
          {/* Resumen de Destinatario y Ubicación */}
          <section className="rounded-xl border border-outline-variant/60 bg-surface-container-lowest p-5 shadow-sm">
            <div className="flex items-center justify-between border-b border-surface-container pb-3">
              <h3 className="font-headline-sm text-headline-sm font-bold text-primary">
                Resumen de la Solicitud
              </h3>
              <button
                type="button"
                onClick={() => setPaso(2)}
                className="font-label-md text-label-md font-bold text-secondary hover:underline"
              >
                Modificar Datos
              </button>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4 font-body-md text-xs">
              <div>
                <span className="text-on-surface-variant block font-bold">Titular:</span>
                <span className="font-semibold text-on-surface">{nombreCompleto}</span>
              </div>
              <div>
                <span className="text-on-surface-variant block font-bold">DNI:</span>
                <span className="text-on-surface">{dni}</span>
              </div>
              <div>
                <span className="text-on-surface-variant block font-bold">Barrio:</span>
                <span className="text-on-surface">{barrio}</span>
              </div>
              <div>
                <span className="text-on-surface-variant block font-bold">Dirección:</span>
                <span className="text-on-surface">{direccion}</span>
              </div>
            </div>
          </section>

          {/* Formulario Agregar Artículos */}
          <section className="rounded-xl border border-outline-variant/60 bg-surface-container-lowest p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2 border-b border-surface-container pb-3 text-primary">
              <Package size={20} />
              <h3 className="font-headline-sm text-headline-sm font-bold">
                Agregar Insumos al Pedido
              </h3>
            </div>

            <form onSubmit={handleAgregarArticulo} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-12">
                {/* Rubro */}
                <div className="sm:col-span-3 space-y-1.5">
                  <label htmlFor="rubroSelect" className="block font-body-md-bold text-xs text-on-surface">
                    Rubro <span className="text-error">*</span>
                  </label>
                  <select
                    id="rubroSelect"
                    value={rubroSelect}
                    onChange={(e) => {
                      setRubroSelect(e.target.value)
                      setNecesidadSelect('')
                    }}
                    className="min-h-[46px] w-full rounded-lg border border-field bg-white px-3 font-body-md text-sm text-on-surface focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/20"
                  >
                    {rubrosDisponibles.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Necesidad */}
                <div className="sm:col-span-4 space-y-1.5">
                  <label htmlFor="necesidadSelect" className="block font-body-md-bold text-xs text-on-surface">
                    Necesidad / Artículo <span className="text-error">*</span>
                  </label>
                  <select
                    id="necesidadSelect"
                    value={necesidadSelect || necesidadesDisponibles[0] || ''}
                    onChange={(e) => setNecesidadSelect(e.target.value)}
                    className="min-h-[46px] w-full rounded-lg border border-field bg-white px-3 font-body-md text-sm text-on-surface focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/20"
                  >
                    {necesidadesDisponibles.map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Cantidad */}
                <div className="sm:col-span-2 space-y-1.5">
                  <label htmlFor="cantidadInput" className="block font-body-md-bold text-xs text-on-surface">
                    Cantidad <span className="text-error">*</span>
                  </label>
                  <input
                    id="cantidadInput"
                    type="number"
                    min={1}
                    max={999}
                    required
                    value={cantidadInput}
                    onChange={(e) => setCantidadInput(parseInt(e.target.value, 10) || 1)}
                    className="min-h-[46px] w-full rounded-lg border border-field bg-white px-3 font-body-md text-sm text-on-surface focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/20"
                  />
                </div>

                {/* Observaciones del artículo */}
                <div className="sm:col-span-3 space-y-1.5">
                  <label htmlFor="obsArt" className="block font-body-md-bold text-xs text-on-surface">
                    Observaciones
                  </label>
                  <input
                    id="obsArt"
                    type="text"
                    value={obsArticulo}
                    onChange={(e) => setObsArticulo(e.target.value)}
                    placeholder="Ej: talles, especificaciones..."
                    className="min-h-[46px] w-full rounded-lg border border-field bg-white px-3 font-body-md text-sm text-on-surface focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/20"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-primary-container px-6 font-label-lg text-label-lg font-bold text-white shadow-xs transition-colors hover:bg-primary-container/90 active:scale-[0.98]"
                >
                  <Plus size={18} />
                  <span>+ Agregar al Pedido</span>
                </button>
              </div>
            </form>
          </section>

          {/* Alerta de Error si no hay artículos */}
          {errorArticulos && (
            <div
              role="alert"
              className="flex items-center gap-2 rounded-xl border border-error bg-error-container/40 p-4 text-sm font-semibold text-on-error-container"
            >
              <CircleAlert size={18} className="text-error shrink-0" />
              <span>{errorArticulos}</span>
            </div>
          )}

          {/* Tabla de Artículos Cargados */}
          <section className="overflow-hidden rounded-xl border border-outline-variant/60 bg-surface-container-lowest shadow-sm">
            <div className="flex items-center justify-between border-b border-surface-container p-4">
              <h3 className="font-headline-sm text-headline-sm font-bold text-primary">
                Artículos Cargados ({articulos.length})
              </h3>
            </div>

            {articulos.length === 0 ? (
              <div className="p-8 text-center text-on-surface-variant">
                <Package className="mx-auto h-12 w-12 text-outline/40" />
                <p className="mt-2 font-headline-sm text-headline-sm font-bold text-on-surface">
                  No hay artículos agregados todavía
                </p>
                <p className="text-xs">
                  Utilice el formulario superior para agregar los ítems requeridos para la asistencia.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="bg-primary-container text-on-primary font-label-md text-label-md uppercase tracking-wider">
                      <th className="px-4 py-3 font-bold">Rubro</th>
                      <th className="px-4 py-3 font-bold">Necesidad</th>
                      <th className="px-4 py-3 font-bold">Cantidad</th>
                      <th className="px-4 py-3 font-bold">Observaciones</th>
                      <th className="px-4 py-3 text-center font-bold">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/30 font-body-md text-body-md">
                    {articulos.map((art, idx) => (
                      <tr key={idx} className="hover:bg-surface-container-low/40">
                        <td className="px-4 py-3 font-body-md-bold text-on-surface">
                          <span className="inline-flex items-center gap-1.5">
                            {iconoRubro(art.rubro)}
                            {art.rubro}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-on-surface">{art.necesidad}</td>
                        <td className="px-4 py-3 font-bold text-primary">{art.cantidad}</td>
                        <td className="px-4 py-3 text-xs text-on-surface-variant">
                          {art.observaciones || '—'}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleEliminarArticulo(idx)}
                            title="Eliminar artículo"
                            className="rounded-lg p-1.5 text-error hover:bg-error-container/40"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Barra de Acciones Final */}
          <div className="flex flex-col items-center justify-between gap-4 pt-2 sm:flex-row">
            <button
              type="button"
              onClick={() => setPaso(2)}
              className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg border border-primary-container px-6 font-label-lg text-label-lg text-primary-container transition-colors hover:bg-primary-container/5 sm:w-auto"
            >
              <ArrowLeft size={18} />
              <span>Volver al Paso 2</span>
            </button>
            <button
              type="button"
              disabled={articulos.length === 0}
              onClick={() => setModalConfirmar(true)}
              className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg bg-secondary px-8 font-label-lg text-label-lg font-bold text-white shadow-md transition-all hover:bg-secondary/90 active:scale-[0.98] disabled:opacity-50 sm:w-auto"
            >
              <CheckCircle size={18} />
              <span>{esEdicion ? 'Guardar Cambios' : 'Guardar Pedido'}</span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL CREAR / EDITAR PERSONA */}
      {/* ========================================================================= */}
      {modalPersona && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-primary/40 p-4 backdrop-blur-xs"
        >
          <div className="w-full max-w-lg rounded-2xl border border-white/80 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-page pb-3">
              <div className="flex items-center gap-2 text-primary">
                <UserPlus size={22} className="text-secondary" />
                <h3 className="font-headline-sm text-headline-sm font-bold">
                  {personaEnEdicion ? 'Editar Persona' : 'Registrar Nueva Persona'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setModalPersona(false)}
                className="rounded-lg p-1 text-ink-soft hover:bg-page hover:text-ink"
              >
                <X size={20} />
              </button>
            </div>

            {modalPersonaError && (
              <div
                role="alert"
                className="my-3 flex items-center gap-2 rounded-lg border border-error bg-error-container/40 p-3 text-xs text-on-error-container"
              >
                <CircleAlert size={16} className="text-error shrink-0" />
                <span>{modalPersonaError}</span>
              </div>
            )}

            <form onSubmit={handleGuardarPersona} className="mt-4 space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="pNombre" className="block font-body-md-bold text-xs text-ink">
                  Apellido y Nombre <span className="text-error">*</span>
                </label>
                <input
                  id="pNombre"
                  type="text"
                  required
                  value={formNombrePersona}
                  onChange={(e) => setFormNombrePersona(e.target.value)}
                  placeholder="Ej: Pérez, Juan Carlos"
                  className="min-h-[46px] w-full rounded-lg border border-field bg-white px-3 font-body-md text-sm text-ink focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/20"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="pDni" className="block font-body-md-bold text-xs text-ink">
                  DNI / Documento <span className="text-error">*</span>
                </label>
                <input
                  id="pDni"
                  type="text"
                  required
                  value={formDniPersona}
                  onChange={(e) => setFormDniPersona(e.target.value)}
                  placeholder="Ej: 28451902"
                  className="min-h-[46px] w-full rounded-lg border border-field bg-white px-3 font-body-md text-sm text-ink focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/20"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="pTel" className="block font-body-md-bold text-xs text-ink">
                  Teléfono de Contacto
                </label>
                <input
                  id="pTel"
                  type="text"
                  value={formTelPersona}
                  onChange={(e) => setFormTelPersona(e.target.value)}
                  placeholder="Ej: 3514401928"
                  className="min-h-[46px] w-full rounded-lg border border-field bg-white px-3 font-body-md text-sm text-ink focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/20"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="pGen" className="block font-body-md-bold text-xs text-ink">
                  Género
                </label>
                <input
                  id="pGen"
                  type="text"
                  value={formGeneroPersona}
                  onChange={(e) => setFormGeneroPersona(e.target.value)}
                  placeholder="Ej: Femenino, Masculino, Otro"
                  className="min-h-[46px] w-full rounded-lg border border-field bg-white px-3 font-body-md text-sm text-ink focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/20"
                />
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-page pt-4">
                <button
                  type="button"
                  onClick={() => setModalPersona(false)}
                  className="min-h-[44px] rounded-lg border border-line px-4 py-2 font-label-md text-sm text-ink hover:bg-page"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={
                    crearPersonaMutation.isPending || actualizarPersonaMutation.isPending
                  }
                  className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-primary-container px-5 py-2 font-label-md text-sm font-semibold text-white shadow-xs hover:bg-primary-container/90 disabled:opacity-70"
                >
                  {crearPersonaMutation.isPending || actualizarPersonaMutation.isPending
                    ? 'Guardando...'
                    : 'Guardar Persona'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL CONFIRMAR SOLICITUD */}
      {/* ========================================================================= */}
      {modalConfirmar && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-primary/40 p-4 backdrop-blur-xs"
        >
          <div className="w-full max-w-lg rounded-2xl border border-white/80 bg-white p-6 shadow-2xl">
            <div className="flex items-center gap-3 text-primary">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary-fixed text-secondary">
                <CheckCircle2 size={28} />
              </div>
              <div>
                <h3 className="font-headline-sm text-headline-sm font-bold">
                  {esEdicion ? '¿Guardar Cambios de la Solicitud?' : '¿Confirmar y Guardar Pedido?'}
                </h3>
                <p className="text-xs text-on-surface-variant">
                  {esEdicion
                    ? 'Se actualizarán los datos y artículos de la solicitud.'
                    : 'La solicitud ingresará en estado Pendiente de Autorización.'}
                </p>
              </div>
            </div>

            <div className="my-4 space-y-2 rounded-lg border border-outline-variant bg-surface-container-low p-4 text-xs">
              <p>
                <strong>Destinatario:</strong> {nombreCompleto} (DNI: {dni})
              </p>
              <p>
                <strong>Barrio / Dirección:</strong> {barrio} — {direccion}
              </p>
              <p>
                <strong>Procedencia:</strong> {procedencia}
              </p>
              <p>
                <strong>Artículos incluidos:</strong> {articulos.length} {articulos.length === 1 ? 'ítem' : 'ítems'}
              </p>
            </div>

            {guardandoError && (
              <div
                role="alert"
                className="my-3 flex flex-col gap-2 rounded-lg border border-error bg-error-container/40 p-3 text-xs text-on-error-container"
              >
                <div className="flex items-center gap-2">
                  <CircleAlert size={16} className="text-error shrink-0" />
                  <span className="font-semibold">{guardandoError}</span>
                </div>
                {guardandoError.includes('ya fue autorizado') && (
                  <button
                    type="button"
                    onClick={() => {
                      setModalConfirmar(false)
                      navigate(`/ver-pedido/${idPedido}`)
                    }}
                    className="self-start font-bold text-error underline hover:opacity-80"
                  >
                    Ir al detalle del pedido
                  </button>
                )}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 border-t border-page pt-3">
              <button
                type="button"
                onClick={() => setModalConfirmar(false)}
                className="min-h-[44px] rounded-lg border border-line px-4 py-2 font-label-md text-sm text-ink hover:bg-page"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={
                  crearPedidoMutation.isPending || actualizarPedidoMutation.isPending
                }
                onClick={handleConfirmarGuardarPedido}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-primary-container px-5 py-2 font-label-md text-sm font-semibold text-white shadow-xs hover:bg-primary-container/90 disabled:opacity-70"
              >
                {esEdicion
                  ? actualizarPedidoMutation.isPending
                    ? 'Guardando Cambios...'
                    : 'Guardar Cambios'
                  : crearPedidoMutation.isPending
                    ? 'Guardando Pedido...'
                    : 'Confirmar y Crear Pedido'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
