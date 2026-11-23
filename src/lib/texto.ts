/**
 * Normaliza un texto removiendo diacríticos (tildes, diéresis), convirtiendo 'ñ' en 'n',
 * a minúsculas y sin espacios a los extremos.
 * Permite búsquedas insensibles a acentos y mayúsculas.
 */
export function normalizar(texto: string): string {
  if (!texto) return ''
  return texto
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .trim()
}
