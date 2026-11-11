import { AtSign, CircleAlert, Eye, EyeOff, Lock, LogIn, ShieldCheck, X } from 'lucide-react'
import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import logo from '../../assets/logo-secretaria.png'
import { useAuth } from '../../context/AuthContext'
import { iniciarSesion } from '../../services/authService'

const campo =
  'relative flex items-center rounded-lg border border-field bg-white transition-all focus-within:border-success focus-within:ring-[3px] focus-within:ring-success/20'
const input =
  'h-12 min-h-[44px] w-full border-0 bg-transparent font-readex text-sm text-ink placeholder-[#8A959E] outline-none'

export default function LoginPage() {
  const { session, loading } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [verPassword, setVerPassword] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!loading && session) return <Navigate to="/estado-pedidos" replace />

  async function entrar(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setEnviando(true)
    const { error } = await iniciarSesion(email.trim(), password)
    setEnviando(false)
    if (error) {
      setError(error)
      return
    }
    navigate('/estado-pedidos', { replace: true })
  }

  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-between overflow-x-hidden bg-linear-to-br from-teal to-[#ee8b60] px-4 py-6 md:px-8">
      <div className="w-full" aria-hidden />

      <section className="animate-enter z-10 my-auto w-full max-w-[540px] rounded-xl bg-white p-8 shadow-[0_20px_40px_-12px_rgba(0,5,141,0.22),0_8px_18px_-6px_rgba(20,24,27,0.15)] md:p-10">
        <div className="mb-6 flex w-full justify-center border-b border-page pb-4">
          <img
            src={logo}
            alt="Secretaría de Políticas Sociales y Desarrollo Humano"
            className="-my-3 h-auto w-full max-w-[320px] object-contain"
          />
        </div>

        <h1 className="font-headline-xl text-headline-xl-mobile text-ink md:text-headline-xl">
          Bienvenido
        </h1>
        <p className="mb-6 mt-2 font-readex text-sm leading-relaxed text-ink-soft md:text-base">
          Coloca tu Email y Contraseña para comenzar.
        </p>

        <form onSubmit={entrar} className="space-y-4">
          <div className="space-y-1.5">
            <label
              htmlFor="email"
              className="block font-readex text-xs font-medium text-ink md:text-sm"
            >
              Correo Electrónico
            </label>
            <div className={campo}>
              <AtSign size={20} className="pointer-events-none ml-3.5 shrink-0 text-ink-soft" />
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

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label
                htmlFor="password"
                className="block font-readex text-xs font-medium text-ink md:text-sm"
              >
                Contraseña
              </label>
              <Link
                to="/recuperar-password"
                className="font-readex text-xs font-medium text-primary-container hover:underline"
              >
                ¿Olvidaste tu Contraseña?
              </Link>
            </div>
            <div className={campo}>
              <Lock size={20} className="pointer-events-none ml-3.5 shrink-0 text-ink-soft" />
              <input
                id="password"
                name="password"
                type={verPassword ? 'text' : 'password'}
                autoComplete="current-password"
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

          {error && (
            <div
              role="alert"
              className="flex items-start gap-3 rounded-lg border border-danger bg-error-container/40 p-3.5 text-on-error-container"
            >
              <CircleAlert size={22} className="mt-0.5 shrink-0 text-danger" />
              <div className="flex-1 font-readex text-xs leading-snug md:text-sm">
                <span className="mb-0.5 block font-bold">No se pudo ingresar</span>
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
            disabled={enviando}
            className="flex h-12 min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-primary-container font-readex text-sm font-semibold text-white shadow-md transition-all hover:bg-primary-container/90 focus:outline-none focus:ring-2 focus:ring-success focus:ring-offset-2 active:scale-[0.99] disabled:opacity-70 md:text-base"
          >
            {enviando ? (
              <>
                <span className="size-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                Iniciando sesión...
              </>
            ) : (
              <>
                <LogIn size={20} />
                Entrar
              </>
            )}
          </button>
        </form>

        <p className="mt-4 border-t border-page pt-4 text-center font-readex text-xs text-ink-soft">
          ¿No tienes Cuenta?{' '}
          <Link
            to="/crear-cuenta"
            className="font-semibold text-primary-container transition-colors hover:text-secondary hover:underline"
          >
            Crear Una
          </Link>
        </p>

        <div className="mt-6 flex items-center gap-2.5 rounded-lg border border-line bg-panel p-3">
          <ShieldCheck size={18} className="shrink-0 text-primary-container" />
          <p className="font-readex text-[11px] leading-snug text-ink-soft">
            Acceso restringido a personal autorizado.
          </p>
        </div>
      </section>

      <footer className="z-10 w-full py-4 text-center">
        <p className="inline-block rounded-full border border-white/30 bg-white/20 px-4 py-2 font-readex text-xs font-semibold tracking-wide text-ink backdrop-blur-sm md:text-sm">
          Municipalidad de Córdoba — Secretaría de Políticas Sociales y Desarrollo Humano
        </p>
      </footer>
    </main>
  )
}
