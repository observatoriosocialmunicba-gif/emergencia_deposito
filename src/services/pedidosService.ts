import { esDniValido } from '../lib/dni'
import { formatFecha, ordenEstado } from '../lib/estados'
import { supabase } from '../lib/supabase'
import type { ConteoEstado, Pedido } from '../lib/types'

export const POR_PAGINA = 10

const COLUMNAS =
  'id, fecha, nombreCompleto, dni, barrio, direccion, procedencia, observaciones, ultModificacion, estado, nombreVehiculo'

export interface FiltroPedidos {
  estado?: string
  busqueda: string
  /** índice de página, empezando en 0 */
  pagina: number
  porPagina?: number
}

export interface PaginaPedidos {
  filas: Pedido[]
  total: number
}

export async function obtenerConteos(): Promise<ConteoEstado[]> {
  const { data, error } = await supabase
    .from('vista_conteo_pedidos_por_estado')
    .select('estado, cantidad')
  if (error) throw error
  return (data as ConteoEstado[]).sort(
    (a, b) => ordenEstado(a.estado) - ordenEstado(b.estado),
  )
}

// Quita los caracteres que rompen la sintaxis de los filtros de PostgREST
// (coma, paréntesis) y los comodines, para que el texto se busque tal cual.
function limpiarBusqueda(texto: string): string {
  return texto.replace(/[,()%*\\"]/g, ' ').trim()
}

export async function buscarPedidos({
  estado,
  busqueda,
  pagina,
  porPagina = POR_PAGINA,
}: FiltroPedidos): Promise<PaginaPedidos> {
  const desde = pagina * porPagina
  let consulta = supabase
    .from('Pedidos')
    .select(COLUMNAS, { count: 'exact' })

  if (estado && estado !== 'todos') {
    consulta = consulta.eq('estado', estado)
  }

  const q = limpiarBusqueda(busqueda)
  if (q) {
    consulta = consulta.or(
      `nombreCompleto.ilike.%${q}%,dni.ilike.%${q}%,barrio.ilike.%${q}%`,
    )
  }

  const { data, count, error } = await consulta
    .order('fecha', { ascending: false, nullsFirst: false })
    .order('id', { ascending: false })
    .range(desde, desde + porPagina - 1)
  if (error) throw error
  return { filas: data as Pedido[], total: count ?? 0 }
}

export interface AsignarPedidoDTO {
  idPedido: number
  entregador: string
  nombreVehiculo: string
  fechaEntrega: string
  /** nombreCompleto del usuario logueado: la app original lo guarda en `ultModificacion`. */
  modificadoPor: string | null
}

export async function asignarPedido({
  idPedido,
  entregador,
  nombreVehiculo,
  fechaEntrega,
  modificadoPor,
}: AsignarPedidoDTO): Promise<void> {
  const { error } = await supabase
    .from('Pedidos')
    .update({
      estado: 'Asignado',
      entregador,
      nombreVehiculo,
      fechaEntrega,
      ultModificacion: modificadoPor,
    })
    .eq('id', idPedido)

  if (error) throw error
}

export interface AutorizarPedidoDTO {
  idPedido: number
  modificadoPor: string | null
}

export async function autorizarPedido({
  idPedido,
  modificadoPor,
}: AutorizarPedidoDTO): Promise<void> {
  const { error } = await supabase
    .from('Pedidos')
    .update({
      estado: 'Para Asignar',
      ultModificacion: modificadoPor,
    })
    .eq('id', idPedido)

  if (error) throw error
}

export interface RechazarPedidoDTO {
  idPedido: number
  motivo: string
  observacionesPrevias?: string | null
  modificadoPor: string | null
}

export async function rechazarPedido({
  idPedido,
  motivo,
  observacionesPrevias,
  modificadoPor,
}: RechazarPedidoDTO): Promise<void> {
  const obsLimpia = (observacionesPrevias ?? '').trim()
  const nuevasObs = obsLimpia
    ? `${obsLimpia}\nMotivo de rechazo: ${motivo.trim()}`
    : `Motivo de rechazo: ${motivo.trim()}`

  const { error } = await supabase
    .from('Pedidos')
    .update({
      estado: 'Rechazado',
      observaciones: nuevasObs,
      ultModificacion: modificadoPor,
    })
    .eq('id', idPedido)

  if (error) throw error
}

export interface EntregarPedidoDTO {
  idPedido: number
  fechaEntrega?: string
  modificadoPor: string | null
}

export async function entregarPedido({
  idPedido,
  fechaEntrega,
  modificadoPor,
}: EntregarPedidoDTO): Promise<void> {
  const { error } = await supabase
    .from('Pedidos')
    .update({
      estado: 'Entregado',
      fechaEntrega: fechaEntrega ?? null,
      ultModificacion: modificadoPor,
    })
    .eq('id', idPedido)

  if (error) throw error
}

export interface NoEntregarPedidoDTO {
  idPedido: number
  motivo: string
  fechaEntrega?: string
  modificadoPor: string | null
}

export async function noEntregarPedido({
  idPedido,
  motivo,
  fechaEntrega,
  modificadoPor,
}: NoEntregarPedidoDTO): Promise<void> {
  const { error } = await supabase
    .from('Pedidos')
    .update({
      estado: 'No Entregado',
      obsEntrerga: motivo.trim(),
      fechaEntrega: fechaEntrega ?? null,
      ultModificacion: modificadoPor,
    })
    .eq('id', idPedido)

  if (error) throw error
}

export interface ReintentarEntregaDTO {
  idPedido: number
  observacionesPrevias?: string | null
  motivoAnterior?: string | null
  fechaEntregaAnterior?: string | null
  modificadoPor: string | null
}

export async function reintentarEntrega({
  idPedido,
  observacionesPrevias,
  motivoAnterior,
  fechaEntregaAnterior,
  modificadoPor,
}: ReintentarEntregaDTO): Promise<void> {
  const motivoTexto = (motivoAnterior ?? '').trim() || 'Sin motivo especificado'
  const fechaTexto = fechaEntregaAnterior ? formatFecha(fechaEntregaAnterior) : 'Sin fecha'
  const detalleIntento = `Intento anterior no entregado (${motivoTexto}, ${fechaTexto})`

  const obsLimpia = (observacionesPrevias ?? '').trim()
  const nuevasObs = obsLimpia ? `${obsLimpia}\n${detalleIntento}` : detalleIntento

  const { data, error } = await supabase
    .from('Pedidos')
    .update({
      estado: 'Para Asignar',
      observaciones: nuevasObs,
      entregador: null,
      nombreVehiculo: null,
      fechaEntrega: null,
      obsEntrerga: null,
      ultModificacion: modificadoPor,
    })
    .eq('id', idPedido)
    .eq('estado', 'No Entregado')
    .select('id')

  if (error) throw error

  if (!data || data.length === 0) {
    throw new Error('El pedido ya no se encuentra en estado "No Entregado" o fue modificado por otro usuario.')
  }
}

export async function obtenerPedidoDetalle(id: number): Promise<import('../lib/types').PedidoCompleto> {
  // 1. Obtener pedido
  const { data: pedidoData, error: pedidoError } = await supabase
    .from('Pedidos')
    .select('*')
    .eq('id', id)
    .single()

  if (pedidoError) throw pedidoError

  // 2. Obtener detalles de productos
  const { data: detallesData, error: detallesError } = await supabase
    .from('DetalledePedido')
    .select('*')
    .eq('idPedido', id)

  if (detallesError) throw detallesError

  // 3. Obtener creador si tiene idUsuario
  let creador: import('../lib/types').Usuario | null = null
  if (pedidoData.idUsuario) {
    const { data: usuarioData } = await supabase
      .from('Usuarios')
      .select('id, nombreCompleto, dni, rol, telefono')
      .eq('id', pedidoData.idUsuario)
      .maybeSingle()

    if (usuarioData) {
      creador = usuarioData as import('../lib/types').Usuario
    }
  }

  return {
    ...(pedidoData as import('../lib/types').Pedido),
    creador,
    detalles: (detallesData ?? []) as import('../lib/types').DetallePedido[],
  }
}

export interface CrearPedidoDTO {
  pedido: {
    fecha: string
    idPersona: number
    nombreCompleto: string
    dni: string
    telefono?: string | null
    barrio: string
    direccion: string
    coordenadas?: string | null
    discapacidad: boolean
    procedencia: string
    subsecretaria: string
    area_id?: number | null
    observaciones?: string | null
    idUsuario: string | null
    ultModificacion: string | null
  }
  detalles: Array<{
    rubro: string
    necesidad: string
    cantidad: number
    observaciones?: string | null
  }>
}

export async function crearPedidoConDetalles({
  pedido,
  detalles,
}: CrearPedidoDTO): Promise<number> {
  // 1. Insertar el Pedido
  const { data: pedidoData, error: pedidoError } = await supabase
    .from('Pedidos')
    .insert({
      fecha: pedido.fecha,
      idPersona: pedido.idPersona,
      nombreCompleto: pedido.nombreCompleto.trim(),
      dni: pedido.dni.trim(),
      telefono: pedido.telefono?.trim() || null,
      barrio: pedido.barrio.trim(),
      direccion: pedido.direccion.trim(),
      coordenadas: pedido.coordenadas?.trim() || null,
      discapacidad: pedido.discapacidad,
      procedencia: pedido.procedencia.trim(),
      subsecretaria: pedido.subsecretaria.trim(),
      area_id: pedido.area_id ?? null,
      observaciones: pedido.observaciones?.trim() || null,
      estado: 'Pendiente de Autorización',
      idUsuario: pedido.idUsuario,
      ultModificacion: pedido.ultModificacion,
      // La app original guarda el nombre del creador también en `Responsable`.
      Responsable: pedido.ultModificacion,
    })
    .select('id')
    .single()

  if (pedidoError) throw pedidoError
  const idPedido = pedidoData.id as number

  // 2. Insertar DetalledePedido si hay artículos
  if (detalles.length > 0) {
    const filasDetalle = detalles.map((d) => ({
      idPedido,
      idPersona: pedido.idPersona,
      rubro: d.rubro.trim(),
      necesidad: d.necesidad.trim(),
      cantidad: d.cantidad,
      observaciones: d.observaciones?.trim() || null,
    }))

    const { error: detalleError } = await supabase
      .from('DetalledePedido')
      .insert(filasDetalle)

    if (detalleError) {
      // Deshacer la cabecera recién creada para no dejar un pedido sin artículos en la base.
      await supabase.from('Pedidos').delete().eq('id', idPedido)
      throw detalleError
    }
  }

  return idPedido
}

export interface ActualizarPedidoDTO {
  idPedido: number
  pedido: {
    nombreCompleto?: string
    dni?: string
    telefono?: string | null
    barrio: string
    direccion: string
    coordenadas?: string | null
    discapacidad: boolean
    procedencia: string
    observaciones?: string | null
    ultModificacion: string | null
  }
  detalles: Array<{
    id?: number
    rubro: string
    necesidad: string
    cantidad: number
    observaciones?: string | null
  }>
  idPersona?: number
}

export async function actualizarPedidoConDetalles({
  idPedido,
  pedido,
  detalles,
  idPersona,
}: ActualizarPedidoDTO): Promise<number> {
  // 1. Actualizar Pedido solo si sigue en 'Pendiente de Autorización'
  const { data: pedidoActualizado, error: pedidoError } = await supabase
    .from('Pedidos')
    .update({
      nombreCompleto: pedido.nombreCompleto?.trim(),
      dni: pedido.dni?.trim(),
      telefono: pedido.telefono?.trim() || null,
      barrio: pedido.barrio.trim(),
      direccion: pedido.direccion.trim(),
      coordenadas: pedido.coordenadas?.trim() || null,
      discapacidad: pedido.discapacidad,
      procedencia: pedido.procedencia.trim(),
      observaciones: pedido.observaciones?.trim() || null,
      ultModificacion: pedido.ultModificacion,
    })
    .eq('id', idPedido)
    .eq('estado', 'Pendiente de Autorización')
    .select('id, idPersona, estado')
    .maybeSingle()

  if (pedidoError) {
    if (
      pedidoError.code === '42501' ||
      pedidoError.message?.includes('42501')
    ) {
      throw new Error('Este pedido ya fue autorizado y no se puede editar.')
    }
    throw pedidoError
  }

  if (!pedidoActualizado) {
    throw new Error('Este pedido ya fue autorizado y no se puede editar.')
  }

  const personaIdFinal = idPersona ?? pedidoActualizado.idPersona

  // 2. Gestionar DetalledePedido (diff)
  const { data: detallesActuales, error: errFetch } = await supabase
    .from('DetalledePedido')
    .select('id')
    .eq('idPedido', idPedido)

  if (errFetch) throw errFetch

  const idsActuales = new Set(
    (detallesActuales ?? []).map((d) => d.id as number),
  )
  const idsNuevos = new Set(detalles.filter((d) => d.id).map((d) => d.id!))

  // Eliminar los que ya no están
  const idsAEliminar = [...idsActuales].filter((id) => !idsNuevos.has(id))
  if (idsAEliminar.length > 0) {
    const { error: errDelete } = await supabase
      .from('DetalledePedido')
      .delete()
      .in('id', idsAEliminar)
    if (errDelete) throw errDelete
  }

  // Actualizar existentes
  const aActualizar = detalles.filter((d) => d.id && idsActuales.has(d.id))
  for (const item of aActualizar) {
    const { error: errUpdate } = await supabase
      .from('DetalledePedido')
      .update({
        rubro: item.rubro.trim(),
        necesidad: item.necesidad.trim(),
        cantidad: item.cantidad,
        observaciones: item.observaciones?.trim() || null,
      })
      .eq('id', item.id!)
    if (errUpdate) throw errUpdate
  }

  // Insertar nuevos
  const aInsertar = detalles.filter((d) => !d.id)
  if (aInsertar.length > 0) {
    const filasAInsertar = aInsertar.map((item) => ({
      idPedido,
      idPersona: personaIdFinal,
      rubro: item.rubro.trim(),
      necesidad: item.necesidad.trim(),
      cantidad: item.cantidad,
      observaciones: item.observaciones?.trim() || null,
    }))
    const { error: errInsert } = await supabase
      .from('DetalledePedido')
      .insert(filasAInsertar)
    if (errInsert) throw errInsert
  }

  return idPedido
}

export async function obtenerHistorialPorPersona(
  idPersona: number,
  dni?: string | null,
): Promise<Pedido[]> {
  let consulta = supabase.from('Pedidos').select('*')
  // Se suman los pedidos de otros registros con el mismo DNI (hay personas duplicadas en la base),
  // pero solo con un DNI real: con "0000", vacío o texto se mezclarían pedidos de gente distinta.
  // Al ser solo dígitos, es seguro interpolarlo en el filtro.
  if (esDniValido(dni)) {
    consulta = consulta.or(`idPersona.eq.${idPersona},dni.eq.${dni!.trim()}`)
  } else {
    consulta = consulta.eq('idPersona', idPersona)
  }

  const { data, error } = await consulta
    .order('fecha', { ascending: false, nullsFirst: false })
    .order('id', { ascending: false })

  if (error) throw error
  return (data ?? []) as Pedido[]
}
