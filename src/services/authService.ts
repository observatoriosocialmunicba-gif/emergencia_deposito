import { supabase } from '../lib/supabase'

function traducirError(message: string): string {
  if (/invalid login credentials/i.test(message)) {
    return 'Email o contraseña incorrectos.'
  }
  if (/email not confirmed/i.test(message)) {
    return 'Tenés que confirmar tu email antes de ingresar.'
  }
  if (/user already registered/i.test(message)) {
    return 'Ya existe un usuario registrado con este correo electrónico.'
  }
  if (/password should be at least/i.test(message)) {
    return 'La contraseña debe tener al menos 6 caracteres.'
  }
  return message
}

/** Devuelve el mensaje de error (ya traducido) o null si salió bien. */
export async function iniciarSesion(
  email: string,
  password: string,
): Promise<{ error: string | null }> {
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  return { error: error ? traducirError(error.message) : null }
}

/** Envía el correo para restablecer la contraseña. */
export async function recuperarPassword(
  email: string,
): Promise<{ error: string | null }> {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/login`,
  })
  return { error: error ? traducirError(error.message) : null }
}

/** Registra un nuevo usuario en Supabase Auth y crea su fila inicial en public.Usuarios. */
export async function registrarUsuario(
  nombreCompleto: string,
  email: string,
  password: string,
): Promise<{ error: string | null }> {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        nombreCompleto,
      },
    },
  })
  if (error) {
    return { error: traducirError(error.message) }
  }

  // Si el correo ya existe, Supabase (con confirmación por email) no devuelve
  // error: devuelve un usuario sin identidades.
  if (data.user && data.user.identities?.length === 0) {
    return { error: traducirError('User already registered') }
  }

  // La fila en public.Usuarios se crea automáticamente mediante el trigger handle_new_user en la base de datos.
  return { error: null }
}

export async function cerrarSesion(): Promise<void> {
  await supabase.auth.signOut()
}
