import {
  ArrowRight,
  CheckCircle2,
  CircleAlert,
  Eye,
  EyeOff,
  Info,
  Lock,
  Mail,
  RotateCcw,
  User,
  X,
} from 'lucide-react'
import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, Navigate } from 'react-router-dom'
import logo from '../../assets/logo-secretaria.png'
import { useAuth } from '../../context/AuthContext'
import { registrarUsuario } from '../../services/authService'

const campo =
  'relative flex items-center rounded-lg border border-field bg-white transition-all focus-within:border-success focus-within:ring-[3px] focus-within:ring-success/20'
const input =
  'h-12 min-h-[44px] w-full border-0 bg-transparent font-readex text-sm text-ink placeholder-[#8A959E] outline-none'

export default function CrearCuentaPage() {
  const { session, loading } = useAuth()
  const [nombreCompleto, setNombreCompleto] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [verPassword, setVerPassword] = useState(false)
  const [verConfirmPassword, setVerConfirmPassword] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [registrado, setRegistrado] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!loading && session) return <Navigate to="/estado-pedidos" replace />

  const passwordMismatch =
    confirmPassword.length > 0 && password !== confirmPassword

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!nombreCompleto.trim() || !email.trim() || !password) return

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.')
      return
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.')
      return
    }

    setError(null)
    setEnviando(true)

    const { error: err } = await registrarUsuario(
      nombreCompleto.trim(),
      email.trim(),
      password,
    )
    setEnviando(false)

    if (err) {
      setError(err)
      return
    }

    setRegistrado(true)
  }

  return (
    <main className="flex min-h-screen w-full flex-col justify-between overflow-x-hidden bg-linear-to-br from-teal to-[#ee8b60] px-4 py-6 md:px-8">
      <div className="w-full" aria-hidden />

      {/* Central Card */}
      <section className="animate-enter z-10 mx-auto my-auto w-full max-w-[560px] rounded-xl bg-white p-6 shadow-[0_20px_40px_-12px_rgba(0,5,141,0.22),0_8px_18px_-6px_rgba(20,24,27,0.15)] sm:p-8 md:p-10">
        {/* Institutional Logo */}
        <div className="mb-6 flex w-full justify-center border-b border-page pb-4">
          <img
            src={logo}
            alt="Secretaría de Políticas Sociales y Desarrollo Humano"
            className="-my-3 h-auto w-full max-w-[320px] object-contain"
          />
        </div>

        {/* Title */}
        <div className="pb-5 text-center">
          <h1 className="font-headline-lg text-headline-lg-mobile text-primary sm:text-headline-lg">
            Crear Cuenta
          </h1>
          <p className="mt-1.5 font-readex text-sm font-medium text-ink-soft">
            Es Necesario crear Una Cuenta para Comenzar
          </p>
        </div>

        {/* Informative Success / Protocol Notice */}
        {registrado ? (
          <div
            role="status"
            className="mb-6 rounded-lg border border-secondary bg-surface-container-low p-4 transition-all duration-300"
          >
            <div className="flex items-start gap-3 text-left">
              <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-secondary" />
              <div className="flex-1">
                <p className="font-readex text-sm font-bold text-secondary">
                  Aviso Administrativo
                </p>
                <p className="mt-0.5 font-readex text-sm text-on-surface">
                  ¡Tu Cuenta fue creada con éxito! El Administrador te asignará un Rol.
                </p>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-secondary/20 text-center">
              <Link
                to="/login"
                className="inline-flex items-center gap-2 rounded-lg bg-secondary px-4 py-2 font-readex text-sm font-semibold text-white shadow-sm transition-all hover:bg-secondary/90"
              >
                <span>Ir al Inicio de Sesión</span>
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        ) : (
          <div className="mb-6 flex items-start gap-3 rounded-lg border border-secondary-container bg-surface-container-low p-4 text-left">
            <Info className="mt-0.5 size-5 shrink-0 text-secondary" />
            <div>
              <p className="font-readex text-xs font-bold text-secondary md:text-sm">
                Aviso Administrativo
              </p>
              <p className="mt-0.5 font-readex text-xs text-ink-soft md:text-sm">
                Una vez registrada tu cuenta, un Administrador deberá asignarte el Rol
                correspondiente para habilitar las funciones del sistema.
              </p>
            </div>
          </div>
        )}

        {!registrado && (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Field: Full Name */}
            <div className="space-y-1.5">
              <label
                htmlFor="fullname"
                className="block font-readex text-xs font-medium text-ink md:text-sm"
              >
                Nombre Completo <span className="text-danger">*</span>
              </label>
              <div className={campo}>
                <User size={20} className="pointer-events-none ml-3.5 shrink-0 text-ink-soft" />
                <input
                  id="fullname"
                  name="fullname"
                  type="text"
                  autoComplete="name"
                  autoFocus
                  required
                  value={nombreCompleto}
                  onChange={(e) => setNombreCompleto(e.target.value)}
                  placeholder="Ej. Juan Pérez"
                  className={`${input} pl-3 pr-3.5`}
                />
              </div>
            </div>

            {/* Field: Email */}
            <div className="space-y-1.5">
              <label
                htmlFor="email"
                className="block font-readex text-xs font-medium text-ink md:text-sm"
              >
                Correo Electrónico <span className="text-danger">*</span>
              </label>
              <div className={campo}>
                <Mail size={20} className="pointer-events-none ml-3.5 shrink-0 text-ink-soft" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  className={`${input} pl-3 pr-3.5`}
                />
              </div>
            </div>

            {/* Field: Password */}
            <div className="space-y-1.5">
              <label
                htmlFor="password"
                className="block font-readex text-xs font-medium text-ink md:text-sm"
              >
                Contraseña <span className="text-danger">*</span>
              </label>
              <div className={campo}>
                <Lock size={20} className="pointer-events-none ml-3.5 shrink-0 text-ink-soft" />
                <input
                  id="password"
                  name="password"
                  type={verPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className={`${input} pl-3 pr-12`}
                />
                <button
                  type="button"
                  aria-label={verPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  onClick={() => setVerPassword((v) => !v)}
                  className="absolute right-2 flex size-9 items-center justify-center rounded-full text-ink-soft transition-colors hover:bg-page hover:text-ink"
                >
                  {verPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Field: Confirm Password */}
            <div className="space-y-1.5">
              <label
                htmlFor="confirm-password"
                className="block font-readex text-xs font-medium text-ink md:text-sm"
              >
                Confirmar Contraseña <span className="text-danger">*</span>
              </label>
              <div
                className={`relative flex items-center rounded-lg border bg-white transition-all focus-within:ring-[3px] ${
                  passwordMismatch
                    ? 'border-danger focus-within:border-danger focus-within:ring-danger/20'
                    : 'border-field focus-within:border-success focus-within:ring-success/20'
                }`}
              >
                <RotateCcw size={20} className="pointer-events-none ml-3.5 shrink-0 text-ink-soft" />
                <input
                  id="confirm-password"
                  name="confirm-password"
                  type={verConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className={`${input} pl-3 pr-12`}
                />
                <button
                  type="button"
                  aria-label={
                    verConfirmPassword
                      ? 'Ocultar confirmación de contraseña'
                      : 'Mostrar confirmación de contraseña'
                  }
                  onClick={() => setVerConfirmPassword((v) => !v)}
                  className="absolute right-2 flex size-9 items-center justify-center rounded-full text-ink-soft transition-colors hover:bg-page hover:text-ink"
                >
                  {verConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>

              {passwordMismatch && (
                <div className="mt-1 flex items-center gap-1.5 text-danger" role="alert">
                  <CircleAlert size={15} />
                  <span className="font-readex text-xs font-semibold">
                    Las contraseñas no coinciden
                  </span>
                </div>
              )}
            </div>

            {error && (
              <div
                role="alert"
                className="flex items-start gap-3 rounded-lg border border-danger bg-error-container/40 p-3.5 text-on-error-container"
              >
                <CircleAlert size={22} className="mt-0.5 shrink-0 text-danger" />
                <div className="flex-1 font-readex text-xs leading-snug md:text-sm">
                  <span className="mb-0.5 block font-bold">No se pudo crear la cuenta</span>
                  {error}
                </div>
                <button
                  type="button"
                  title="Descartar aviso"
                  aria-label="Descartar aviso"
                  onClick={() => setError(null)}
                  className="p-0.5 opacity-70 transition-opacity hover:opacity-100"
                >
                  <X size={18} />
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={enviando || passwordMismatch}
              className="flex h-12 min-h-[48px] w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary-container font-readex text-sm font-semibold text-white shadow-md transition-all hover:bg-primary-container/90 focus:outline-none focus:ring-2 focus:ring-secondary focus:ring-offset-2 active:scale-[0.99] disabled:opacity-70 md:text-base"
            >
              {enviando ? (
                <>
                  <span className="size-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  Procesando Solicitud...
                </>
              ) : (
                <>
                  <span>Crear Cuenta</span>
                  <ArrowRight size={20} />
                </>
              )}
            </button>
          </form>
        )}

        {/* Return to Login Link */}
        <div className="mt-6 border-t border-page pt-5 text-center">
          <p className="font-readex text-xs text-ink-soft md:text-sm">
            ¿Ya tenés una cuenta activa?
          </p>
          <Link
            to="/login"
            className="mt-1 inline-block font-readex text-xs font-bold text-primary-container transition-colors hover:text-secondary hover:underline md:text-sm"
          >
            Si ya tenés cuenta, hacé clic acá para ingresar
          </Link>
        </div>
      </section>

      {/* Institutional Footer */}
      <footer className="z-10 w-full py-4 text-center">
        <p className="inline-block rounded-full border border-white/30 bg-white/20 px-4 py-2 font-readex text-xs font-semibold tracking-wide text-ink backdrop-blur-sm md:text-sm">
          Municipalidad de Córdoba — Secretaría de Políticas Sociales y Desarrollo Humano
        </p>
      </footer>
    </main>
  )
}
