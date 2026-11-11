import { useEffect, useState } from 'react'

/** Devuelve `valor` recién después de que dejó de cambiar durante `ms`. */
export function useDebounce<T>(valor: T, ms = 300): T {
  const [debounced, setDebounced] = useState(valor)
  useEffect(() => {
    const id = setTimeout(() => setDebounced(valor), ms)
    return () => clearTimeout(id)
  }, [valor, ms])
  return debounced
}

/** Hora actual (ms), refrescada cada `ms` para textos tipo "hace 2 min". */
export function useAhora(ms = 30_000): number {
  const [ahora, setAhora] = useState(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setAhora(Date.now()), ms)
    return () => clearInterval(id)
  }, [ms])
  return ahora
}
