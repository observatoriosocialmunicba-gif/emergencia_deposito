/**
 * Un DNI "usable" son entre 6 y 9 dígitos que no sean todos ceros. Los vacíos, "00000000",
 * "-" o "S/D" no identifican a nadie: no se pueden usar para agrupar ni buscar personas.
 */
export function esDniValido(dni: string | null | undefined): boolean {
  const d = (dni ?? '').trim()
  return /^\d{6,9}$/.test(d) && !/^0+$/.test(d)
}
