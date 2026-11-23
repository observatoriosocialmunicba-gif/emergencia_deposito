import {
  CircleAlert,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  RotateCcw,
  Save,
  X,
} from 'lucide-react'
import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import logo from '../../assets/logo-secretaria.png'
import { useAuth } from '../../context/AuthContext'
import { actualizarPassword, cerrarSesion } from '../../services/authService'

const campo =
  'relative flex items-center rounded-lg border border-field bg-white transition-all focus-within:border-success focus-within:ring-[3px] focus-within:ring-success/20'
const input =
  'h-12 min-h-[44px] w-full border-0 bg-transparent font-readex text-sm text-ink placeholder-[#8A959E] outline-none'

const MIN_PASSWORD = 6

/**
 * Pantalla a la que llega la persona desde el link del correo de recuperación.
 * Supabase abre una sesión temporal con ese link; acá se elige la contraseña nueva.
 */
export default function NuevaPasswordPage() {
  const { session, loading } = useAuth()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [ver, setVer] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const noCoinciden = confirmar.length > 0 && password !== confirmar

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (password.length < MIN_PASSWORD) {
      setError(`La contraseña debe tener al menos ${MIN_PASSWORD} caracteres.`)
      return
    }
    if (password !== confirmar) {
      setError('Las contraseñas no coinciden.')
      return
    }

    setError(null)
    setEnviando(true)
    const { error: err } = await actualizarPassword(password)
    if (err) {
      setEnviando(false)
      setError(err)
      return
    }

    // Se cierra la sesión de recuperación para que ingrese con la contraseña nueva.
    await cerrarSesion()
    navigate('/login', { replace: true, state: { passwordCambiada: true } })
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

        <div className="mb-6 flex flex-col items-center gap-3">
          <div className="relative flex size-16 items-center justify-center rounded-full border-2 border-secondary-container bg-surface-container-low shadow-inner">
            <RotateCcw className="size-8 text-secondary" />
            <div className="absolute -bottom-1 -right-1 flex size-6 items-center justify-center rounded-full bg-primary-container text-white shadow-sm">
              <KeyRound size={13} />
            </div>
          </div>
        </div>

        {loading ? (
          <div
            role="status"
            className="flex flex-col items-center gap-3 py-6 font-readex text-sm text-ink-soft"
          >
            <span className="size-6 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
            Verificando el link...
          </div>
        ) : !session ? (
          <div className="text-center">
            <h1 className="font-headline-lg text-headline-lg-mobile text-primary md:text-headline-lg">
              El link no es válido
            </h1>
            <p className="mx-auto mb-6 mt-2 max-w-md font-readex text-sm leading-relaxed text-ink-soft md:text-base">
              Puede que haya vencido o que ya lo hayas usado. Pedí uno nuevo y
              usalo dentro de la hora.
            </p>
            <Link
              to="/recuperar-password"
              className="flex h-12 min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-primary-container font-readex text-sm font-semibold text-white shadow-md transition-all hover:bg-primary-container/90 focus:outline-none focus:ring-2 focus:ring-secondary focus:ring-offset-2 md:text-base"
            >
              Pedir un link nuevo
            </Link>
          </div>
        ) : (
          <>
            <div className="text-center">
              <h1 className="font-headline-lg text-headline-lg-mobile text-primary md:text-headline-lg">
                Elegí tu nueva contraseña
              </h1>
              <p className="mx-auto mb-6 mt-2 max-w-md font-readex text-sm leading-relaxed text-ink-soft md:text-base">
                Escribila dos veces. Después vas a ingresar con ella.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div className="space-y-1.5">
                <label
                  htmlFor="password"
                  className="block font-readex text-xs font-medium text-ink md:text-sm"
                >
                  Contraseña nueva
                </label>
                <div className={campo}>
                  <Lock size={20} className="pointer-events-none ml-3.5 shrink-0 text-ink-soft" />
                  <input
                    id="password"
                    name="password"
                    type={ver ? 'text' : 'password'}
                    autoComplete="new-password"
                    autoFocus
                    required
                    minLength={MIN_PASSWORD}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={`Mínimo ${MIN_PASSWORD} caracteres`}
                    className={`${input} pl-3 pr-1`}
                  />
                  <button
                    type="button"
                    onClick={() => setVer((v) => !v)}
                    aria-label={ver ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    className="flex size-11 shrink-0 cursor-pointer items-center justify-center text-ink-soft hover:text-ink"
                  >
                    {ver ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="confirmar"
                  className="block font-readex text-xs font-medium text-ink md:text-sm"
                >
                  Repetí la contraseña
                </label>
                <div
                  className={`${campo} ${noCoinciden ? 'border-danger focus-within:border-danger' : ''}`}
                >
                  <Lock size={20} className="pointer-events-none ml-3.5 shrink-0 text-ink-soft" />
                  <input
                    id="confirmar"
                    name="confirmar"
                    type={ver ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    value={confirmar}
                    onChange={(e) => setConfirmar(e.target.value)}
                    aria-invalid={noCoinciden}
                    aria-describedby={noCoinciden ? 'confirmar-error' : undefined}
                    placeholder="Volvé a escribirla"
                    className={`${input} pl-3 pr-3.5`}
                  />
                </div>
                {noCoinciden && (
                  <p
                    id="confirmar-error"
                    className="font-readex text-xs font-medium text-danger"
                  >
                    Las contraseñas no coinciden.
                  </p>
                )}
              </div>

              {error && (
                <div
                  role="alert"
                  className="flex items-start gap-3 rounded-lg border border-danger bg-error-container/40 p-3.5 text-on-error-container"
                >
                  <CircleAlert size={22} className="mt-0.5 shrink-0 text-danger" />
                  <div className="flex-1 font-readex text-xs leading-snug md:text-sm">
                    <span className="mb-0.5 block font-bold">No se pudo guardar la contraseña</span>
                    {error}
                  </div>
                  <button
                    type="button"
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
                className="flex h-12 min-h-[48px] w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary-container font-readex text-sm font-semibold text-white shadow-md transition-all hover:bg-primary-container/90 focus:outline-none focus:ring-2 focus:ring-secondary focus:ring-offset-2 active:scale-[0.99] disabled:opacity-70 md:text-base"
              >
                {enviando ? (
                  <>
                    <span className="size-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save size={20} />
                    Guardar contraseña
                  </>
                )}
              </button>
            </form>
          </>
        )}
      </section>

      <footer className="z-10 w-full py-4 text-center">
        <p className="inline-block rounded-full border border-white/30 bg-white/20 px-4 py-2 font-readex text-xs font-semibold tracking-wide text-ink backdrop-blur-sm md:text-sm">
          Municipalidad de Córdoba — Secretaría de Políticas Sociales y Desarrollo Humano
        </p>
      </footer>
    </main>
  )
}
