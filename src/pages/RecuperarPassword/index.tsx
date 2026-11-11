import {
  ArrowLeft,
  CheckCircle2,
  CircleAlert,
  KeyRound,
  Mail,
  RotateCcw,
  Send,
  X,
} from 'lucide-react'
import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, Navigate } from 'react-router-dom'
import logo from '../../assets/logo-secretaria.png'
import { useAuth } from '../../context/AuthContext'
import { recuperarPassword } from '../../services/authService'

const campo =
  'relative flex items-center rounded-lg border border-field bg-white transition-all focus-within:border-success focus-within:ring-[3px] focus-within:ring-success/20'
const input =
  'h-12 min-h-[44px] w-full border-0 bg-transparent font-readex text-sm text-ink placeholder-[#8A959E] outline-none'

export default function RecuperarPasswordPage() {
  const { session, loading } = useAuth()
  const [email, setEmail] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [enviado, setEnviado] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!loading && session) return <Navigate to="/estado-pedidos" replace />

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!email.trim()) return

    setError(null)
    setEnviando(true)
    setEnviado(false)

    const { error: err } = await recuperarPassword(email.trim())
    setEnviando(false)

    if (err) {
      setError(err)
      return
    }

    setEnviado(true)
  }

  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-between overflow-x-hidden bg-linear-to-br from-teal to-[#ee8b60] px-4 py-6 md:px-8">
      <div className="w-full" aria-hidden />

      <section className="animate-enter z-10 my-auto w-full max-w-[540px] rounded-xl bg-white p-8 shadow-[0_20px_40px_-12px_rgba(0,5,141,0.22),0_8px_18px_-6px_rgba(20,24,27,0.15)] md:p-10">
        {/* Logo Institucional */}
        <div className="mb-6 flex w-full justify-center border-b border-page pb-4">
          <img
            src={logo}
            alt="Secretaría de Políticas Sociales y Desarrollo Humano"
            className="-my-3 h-auto w-full max-w-[320px] object-contain"
          />
        </div>

        {/* Badge & Icono */}
        <div className="mb-6 flex flex-col items-center gap-3">
          <div className="relative flex size-16 items-center justify-center rounded-full border-2 border-secondary-container bg-surface-container-low shadow-inner">
            <RotateCcw className="size-8 text-secondary" />
            <div className="absolute -bottom-1 -right-1 flex size-6 items-center justify-center rounded-full bg-primary-container text-white shadow-sm">
              <KeyRound size={13} />
            </div>
          </div>
          <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 backdrop-blur-xs">
            <span className="size-2 animate-pulse rounded-full bg-primary" />
            <span className="font-label-sm text-[11px] font-bold tracking-wider text-primary uppercase">
              Recuperación de Acceso
            </span>
          </div>
        </div>

        {/* Encabezado */}
        <div className="text-center">
          <h1 className="font-headline-lg text-headline-lg-mobile text-primary md:text-headline-lg">
            Olvidaste tu Contraseña
          </h1>
          <p className="mx-auto mb-6 mt-2 max-w-md font-readex text-sm leading-relaxed text-ink-soft md:text-base">
            Coloca tu email y te llegará un link para restablecerla.
          </p>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label
              htmlFor="email"
              className="block font-readex text-xs font-medium text-ink md:text-sm"
            >
              Correo Electrónico
            </label>
            <div className={campo}>
              <Mail size={20} className="pointer-events-none ml-3.5 shrink-0 text-ink-soft" />
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                autoFocus
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                className={`${input} pl-3 pr-3.5`}
              />
            </div>
          </div>

          {error && (
            <div
              role="alert"
              className="flex items-start gap-3 rounded-lg border border-danger bg-error-container/40 p-3.5 text-on-error-container"
            >
              <CircleAlert size={22} className="mt-0.5 shrink-0 text-danger" />
              <div className="flex-1 font-readex text-xs leading-snug md:text-sm">
                <span className="mb-0.5 block font-bold">No se pudo procesar la solicitud</span>
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

          {enviado && (
            <div
              role="status"
              className="flex items-start gap-3 rounded-lg border border-secondary/30 bg-surface-container p-4 text-left"
            >
              <CheckCircle2 size={20} className="mt-0.5 shrink-0 text-secondary" />
              <div className="flex-1 font-readex text-xs leading-snug md:text-sm">
                <span className="block font-bold text-secondary">
                  Instrucciones enviadas con éxito
                </span>
                <p className="mt-0.5 text-on-surface-variant">
                  Si el correo está registrado, vas a recibir el link para restablecer tu contraseña.
                </p>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={enviando}
            className="flex h-12 min-h-[48px] w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary-container font-readex text-sm font-semibold text-white shadow-md transition-all hover:bg-primary-container/90 focus:outline-none focus:ring-2 focus:ring-secondary focus:ring-offset-2 active:scale-[0.99] disabled:opacity-70 md:text-base"
          >
            {enviando ? (
              <>
                <span className="size-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                Procesando solicitud...
              </>
            ) : enviado ? (
              <>
                <CheckCircle2 size={20} />
                Link Enviado
              </>
            ) : (
              <>
                <Send size={20} />
                Enviar Link
              </>
            )}
          </button>
        </form>

        {/* Volver al login */}
        <div className="mt-6 border-t border-page pt-4 text-center">
          <Link
            to="/login"
            className="group inline-flex items-center gap-2 rounded-lg py-2 px-3 font-readex text-xs font-semibold text-primary transition-colors hover:bg-surface-container-low hover:text-secondary focus:outline-none focus:ring-2 focus:ring-secondary md:text-sm"
          >
            <ArrowLeft
              size={18}
              className="transition-transform duration-150 group-hover:-translate-x-1"
            />
            <span>¿Recordaste tu contraseña? Volver al Login</span>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="z-10 w-full py-4 text-center">
        <p className="inline-block rounded-full border border-white/30 bg-white/20 px-4 py-2 font-readex text-xs font-semibold tracking-wide text-ink backdrop-blur-sm md:text-sm">
          Municipalidad de Córdoba — Secretaría de Políticas Sociales y Desarrollo Humano
        </p>
      </footer>
    </main>
  )
}
