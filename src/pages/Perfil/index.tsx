import {
  ArrowLeft,
  Building2,
  Check,
  ChevronRight,
  CircleAlert,
  CreditCard,
  Headset,
  Lock,
  Mail,
  Phone,
  Save,
  Shield,
  ShieldCheck,
  User,
  X,
} from 'lucide-react'
import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import Spinner from '../../components/Spinner'
import { useAuth } from '../../context/AuthContext'
import { useAreas } from '../../hooks/useAreas'
import { useActualizarPerfil } from '../../hooks/useUsuarios'
import { iniciales } from '../../lib/estados'
import type { Rol, Usuario } from '../../lib/types'

export default function PerfilPage() {
  const { session, usuario, usuarioLoading } = useAuth()

  if (usuarioLoading) return <Spinner />

  return <PerfilContenido key={usuario?.id ?? 'anon'} usuario={usuario} email={session?.user?.email} />
}

function PerfilContenido({
  usuario,
  email,
}: {
  usuario: Usuario | null
  email: string | undefined
}) {
  const navigate = useNavigate()
  const actualizarMutation = useActualizarPerfil()
  const areasQuery = useAreas()

  const areaUsuario = areasQuery.data?.find((a) => a.id === usuario?.area_id)
  const nombreArea = areaUsuario ? areaUsuario.nombre : 'Sin área asignada'

  const [nombreCompleto, setNombreCompleto] = useState(usuario?.nombreCompleto ?? '')
  const [dni, setDni] = useState(usuario?.dni != null ? String(usuario.dni) : '')
  const [telefono, setTelefono] = useState(usuario?.telefono ?? '')
  const [alertaExito, setAlertaExito] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const rolActual: Rol = usuario?.rol ?? 'No Asignado'
  const emailActual = email ?? 'Sin correo'

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!usuario?.id) return
    if (!nombreCompleto.trim()) {
      setErrorMsg('El nombre completo es obligatorio.')
      return
    }

    setErrorMsg(null)
    setAlertaExito(false)

    // La app original limitaba el DNI a 8 dígitos numéricos.
    if (dni.trim() !== '' && !/^\d{1,8}$/.test(dni.trim())) {
      setErrorMsg('El DNI debe contener solo números (hasta 8 dígitos).')
      return
    }
    const dniNumero = dni.trim() === '' ? null : Number(dni.trim())

    try {
      await actualizarMutation.mutateAsync({
        id: usuario.id,
        datos: {
          nombreCompleto: nombreCompleto.trim(),
          dni: dniNumero,
          telefono: telefono.trim() || null,
        },
      })
      setAlertaExito(true)
    } catch (err: unknown) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : 'Ocurrió un error al intentar actualizar el perfil.',
      )
    }
  }

  function handleCancelar() {
    if (usuario) {
      setNombreCompleto(usuario.nombreCompleto ?? '')
      setDni(usuario.dni != null ? String(usuario.dni) : '')
      setTelefono(usuario.telefono ?? '')
      setErrorMsg(null)
    } else {
      navigate(-1)
    }
  }

  return (
    <div className="space-y-space-lg p-margin md:p-margin-desktop">
      {/* Context Breadcrumb & Page Title */}
      <div>
        <div className="mb-2 flex items-center gap-2 font-label-md text-label-md text-on-surface-variant">
          <span>Herramientas</span>
          <ChevronRight size={14} />
          <span className="font-semibold text-primary">Perfil de Usuario</span>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-headline-lg-mobile font-bold tracking-tight text-primary md:font-headline-lg md:text-headline-lg">
              Editar Perfil
            </h1>
            <p className="mt-0.5 font-body-md text-body-md text-on-surface-variant">
              Actualizá tus datos personales.
            </p>
          </div>

          <div className="inline-flex items-center gap-2 self-start rounded-lg border border-outline-variant/40 bg-surface-container px-3 py-1.5 font-label-md text-label-md text-on-surface-variant sm:self-auto">
            <ShieldCheck size={18} className="text-secondary" />
            <span>Rol: {rolActual}</span>
          </div>
        </div>
      </div>

      {/* Alerta de Éxito */}
      {alertaExito && (
        <div
          role="status"
          className="flex items-start gap-3 rounded-xl border border-secondary/30 bg-secondary/10 p-4 shadow-xs"
        >
          <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-secondary text-white">
            <Check size={16} />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="font-body-md-bold text-body-md-bold text-secondary">
              Datos de perfil actualizados correctamente
            </h4>
            <p className="mt-0.5 font-body-md text-xs text-on-surface-variant">
              Los cambios se guardaron.
            </p>
          </div>
          <button
            type="button"
            title="Cerrar aviso"
            aria-label="Cerrar aviso"
            onClick={() => setAlertaExito(false)}
            className="rounded-md p-1 text-on-surface-variant transition-colors hover:text-on-surface"
          >
            <X size={18} />
          </button>
        </div>
      )}

      {/* Alerta de Error */}
      {errorMsg && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-danger bg-error-container/40 p-4 text-on-error-container"
        >
          <CircleAlert size={20} className="mt-0.5 shrink-0 text-danger" />
          <div className="flex-1 font-body-md text-xs md:text-sm">
            <span className="block font-bold">No se pudieron guardar los cambios</span>
            {errorMsg}
          </div>
          <button
            type="button"
            title="Descartar aviso"
            aria-label="Descartar aviso"
            onClick={() => setErrorMsg(null)}
            className="p-1 opacity-70 transition-opacity hover:opacity-100"
          >
            <X size={18} />
          </button>
        </div>
      )}

      {/* Main Profile Card Container */}
      <div className="overflow-hidden rounded-xl border border-line bg-white shadow-[0px_2px_8px_rgba(0,5,141,0.04)]">
        {/* Profile Header Zone */}
        <div className="flex flex-col justify-between gap-6 border-b border-surface-container bg-surface-bright p-6 md:flex-row md:items-center md:p-8">
          <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
            {/* Avatar con iniciales */}
            <div className="relative">
              <div className="flex size-20 items-center justify-center rounded-full bg-primary font-headline-xl text-headline-xl font-bold text-on-primary shadow-md ring-4 ring-white">
                {iniciales(usuario?.nombreCompleto, emailActual)}
              </div>
              <span
                className="absolute right-0 bottom-0 flex size-6 items-center justify-center rounded-full border-2 border-white bg-secondary text-white shadow-xs"
                title="Usuario del Sistema"
              >
                <Check size={14} />
              </span>
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-headline-md text-headline-md font-bold text-primary">
                  {usuario?.nombreCompleto || 'Usuario Municipal'}
                </h2>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-secondary/40 bg-secondary/15 px-3 py-0.5 text-xs font-bold tracking-wider text-secondary uppercase">
                  <Shield size={13} />
                  {rolActual}
                </span>
              </div>
              <p className="mt-1 font-body-md text-body-md text-on-surface-variant">
                {emailActual}
              </p>
            </div>
          </div>
        </div>

        {/* Formulario de Edición */}
        <form onSubmit={handleSubmit} className="space-y-6 p-6 md:p-8">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Campo 1: Nombre Completo */}
            <div className="space-y-1.5">
              <label
                className="block font-body-md-bold text-body-md-bold text-on-surface"
                htmlFor="nombreCompleto"
              >
                Nombre Completo <span className="text-danger">*</span>
              </label>
              <div className="relative rounded-lg">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-ink-soft">
                  <User size={18} />
                </div>
                <input
                  id="nombreCompleto"
                  name="nombreCompleto"
                  type="text"
                  required
                  value={nombreCompleto}
                  onChange={(e) => setNombreCompleto(e.target.value)}
                  placeholder="Ingrese nombre y apellido completo"
                  className="block min-h-[48px] w-full rounded-lg border border-field bg-white pl-10 pr-4 font-body-md text-body-md text-on-surface transition-all focus:border-success focus:outline-none focus:ring-2 focus:ring-success/20"
                />
              </div>
            </div>

            {/* Campo 2: DNI */}
            <div className="space-y-1.5">
              <label
                className="block font-body-md-bold text-body-md-bold text-on-surface"
                htmlFor="dni"
              >
                DNI / Documento
              </label>
              <div className="relative rounded-lg">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-ink-soft">
                  <CreditCard size={18} />
                </div>
                <input
                  id="dni"
                  name="dni"
                  type="text"
                  value={dni}
                  onChange={(e) => setDni(e.target.value)}
                  placeholder="Ej. 28452190"
                  className="block min-h-[48px] w-full rounded-lg border border-field bg-white pl-10 pr-4 font-body-md text-body-md text-on-surface transition-all focus:border-success focus:outline-none focus:ring-2 focus:ring-success/20"
                />
              </div>
            </div>

            {/* Campo 3: Teléfono */}
            <div className="space-y-1.5">
              <label
                className="block font-body-md-bold text-body-md-bold text-on-surface"
                htmlFor="telefono"
              >
                Teléfono
              </label>
              <div className="relative rounded-lg">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-ink-soft">
                  <Phone size={18} />
                </div>
                <input
                  id="telefono"
                  name="telefono"
                  type="tel"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  placeholder="Ej. 351 555-0192"
                  className="block min-h-[48px] w-full rounded-lg border border-field bg-white pl-10 pr-4 font-body-md text-body-md text-on-surface transition-all focus:border-success focus:outline-none focus:ring-2 focus:ring-success/20"
                />
              </div>
            </div>

            {/* Campo 4: Correo Electrónico (Solo Lectura) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label
                  className="block font-body-md-bold text-body-md-bold text-on-surface"
                  htmlFor="email"
                >
                  Correo Electrónico
                </label>
                <span className="inline-flex items-center gap-1 rounded bg-surface-container px-2 py-0.5 font-label-sm text-[11px] text-outline">
                  <Lock size={12} /> Solo Lectura
                </span>
              </div>
              <div className="relative rounded-lg">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-outline">
                  <Mail size={18} />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={emailActual}
                  disabled
                  readOnly
                  className="block min-h-[48px] w-full cursor-not-allowed rounded-lg border border-outline-variant/60 bg-surface-container-high/60 pl-10 pr-10 font-body-md text-body-md text-on-surface-variant select-none"
                />
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5 text-outline">
                  <Lock size={16} />
                </div>
              </div>
              <p className="font-label-sm text-label-sm text-on-surface-variant">
                El correo está vinculado a su cuenta de acceso y no se modifica desde aquí.
              </p>
            </div>

            {/* Campo 5: Rol Asignado (Informativo) */}
            <div className="space-y-1.5 md:col-span-2">
              <span className="block font-body-md-bold text-body-md-bold text-on-surface">
                Rol Asignado en el Sistema
              </span>
              <div className="flex flex-col justify-between gap-4 rounded-xl border border-line bg-panel p-4 sm:flex-row sm:items-center">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-secondary-container/40 text-secondary">
                    <ShieldCheck size={24} />
                  </div>
                  <div>
                    <span className="font-body-md-bold text-body-md-bold text-primary">
                      {rolActual}
                    </span>
                  </div>
                </div>

                <div className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-outline-variant/40 bg-white px-3 py-1.5 text-xs text-on-surface-variant">
                  <Shield size={14} className="text-outline" />
                  <span>Configurado por Administrador</span>
                </div>
              </div>
            </div>

            {/* Campo 6: Área Asignada (Informativo / Solo Lectura) */}
            <div className="space-y-1.5 md:col-span-2">
              <span className="block font-body-md-bold text-body-md-bold text-on-surface">
                Área Asignada
              </span>
              <div className="flex flex-col justify-between gap-4 rounded-xl border border-line bg-panel p-4 sm:flex-row sm:items-center">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-teal-soft text-[#0A423C]">
                    <Building2 size={24} />
                  </div>
                  <div>
                    <span className="font-body-md-bold text-body-md-bold text-primary">
                      {nombreArea}
                    </span>
                  </div>
                </div>

                <div className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-outline-variant/40 bg-white px-3 py-1.5 text-xs text-on-surface-variant">
                  <Lock size={14} className="text-outline" />
                  <span>Solo Lectura</span>
                </div>
              </div>
            </div>
          </div>

          {/* Botones de Acción */}
          <div className="flex flex-col-reverse justify-end gap-3 border-t border-line pt-6 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={handleCancelar}
              className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg border border-primary-container px-6 py-2.5 font-body-md-bold text-body-md-bold text-primary-container transition-all hover:bg-primary-container/5 active:scale-[0.98] sm:w-auto"
            >
              <ArrowLeft size={18} />
              Cancelar
            </button>

            <button
              type="submit"
              disabled={actualizarMutation.isPending}
              className="inline-flex min-h-[44px] w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-primary-container px-8 py-2.5 font-body-md-bold text-body-md-bold text-white shadow-md transition-all hover:bg-primary-container/90 focus:outline-none focus:ring-2 focus:ring-success focus:ring-offset-2 active:scale-[0.98] disabled:opacity-70 sm:w-auto"
            >
              {actualizarMutation.isPending ? (
                <>
                  <span className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save size={18} />
                  Guardar Cambios
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Soporte Callout */}
      <div className="flex items-center justify-between gap-4 rounded-xl border border-surface-container-highest bg-surface-container-low p-4">
        <div className="flex items-center gap-3">
          <Headset size={20} className="shrink-0 text-secondary" />
          <p className="font-body-md text-xs text-on-surface-variant">
            Para cambiar tu correo o tu rol, contactá a un <strong>Administrador</strong>.
          </p>
        </div>
      </div>
    </div>
  )
}
