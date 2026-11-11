// Tipos mínimos del esquema actual de Supabase (public).
// Se irán ampliando a medida que se porten más pantallas.

export type Rol =
  | 'Administrador'
  | 'Solicitante'
  | 'Asignador'
  | 'No Asignado'

export interface Area {
  id: number
  nombre: string
  activa: boolean
}

export interface Usuario {
  id: string
  nombreCompleto: string | null
  dni: number | null
  rol: Rol | null
  telefono: string | null
  area_id: number | null
  activo: boolean
}

export interface Pedido {
  id: number
  fecha: string | null
  idPersona?: number | null
  nombreCompleto: string | null
  dni: string | null
  telefono?: string | null
  barrio: string | null
  direccion: string | null
  coordenadas?: string | null
  discapacidad?: boolean | null
  procedencia: string | null
  subsecretaria?: string | null
  area_id?: number | null
  Responsable?: string | null
  observaciones: string | null
  ultModificacion: string | null
  estado: string | null
  idUsuario?: string | null
  nombreVehiculo: string | null
  entregador?: string | null
  fechaEntrega?: string | null
  obsEntrerga?: string | null
}

export interface Persona {
  id: number
  nombreCompleto: string | null
  dni: string | null
  telefono: string | null
  genero?: string | null
}

export interface Barrio {
  id: number
  NombreBarrio: string | null
  Long: string | null
  Lat: string | null
}

export interface Producto {
  id: number
  rubro: string | null
  necesidad: string | null
  estado: boolean | null
}

export interface DetallePedido {
  id: number
  rubro: string | null
  necesidad: string | null
  cantidad: number | null
  observaciones: string | null
  idPedido: number | null
  idPersona?: number | null
}

export interface PedidoCompleto extends Pedido {
  creador?: Usuario | null
  detalles: DetallePedido[]
}

export interface Vehiculo {
  idVehiculo: number
  tipoVehiculo: string | null
  patente: string | null
  Nombre: string | null
  estado: boolean | null
}

export interface ConteoEstado {
  estado: string | null
  cantidad: number | null
}

/** Fila de la vista `vista_personas_dni` (una por persona). Solo lectura. */
export interface PersonaDni {
  id_persona: number
  /** DNI limpio, o null si el de la persona no es un DNI real (vacío, ceros, texto...) */
  dni: string | null
  dni_valido: boolean
  /** cuántas personas (registros) comparten este DNI; 1 si es único */
  registros_mismo_dni: number
  nombres_distintos: number
  /** pedidos cargados a nombre de este registro */
  pedidos_propios: number
  /** pedidos de todos los registros con el mismo DNI (= propios si no hay DNI válido) */
  pedidos_total: number
}

// ---- Dashboard (vistas de solo lectura vista_dashboard_*) ----

/** Una fila por día: pedidos registrados ese día y entregas reales (estado Entregado) ese día. */
export interface DiaDashboard {
  fecha: string // 'YYYY-MM-DD'
  pedidos: number
  entregas: number
  /** desglose de los pedidos registrados ese día según su estado ACTUAL */
  pendientes: number
  para_asignar: number
  asignados: number
  entregados: number
  no_entregados: number
  rechazados: number
}

export type DimensionDashboardNombre = 'procedencia' | 'subsecretaria' | 'barrio'

export interface DimensionDashboard {
  dimension: DimensionDashboardNombre
  valor: string
  pedidos: number
  entregados: number
}

export interface RubroDashboard {
  rubro: string
  renglones: number
  /** unidades de mercadería (el rubro "Dinero" queda en 0: su cantidad es un importe) */
  unidades: number
  unidades_entregadas: number
  pedidos: number
  /** importe en pesos, solo para el rubro "Dinero" */
  monto: number
}

export interface KpisDashboard {
  pedidos_total: number
  personas_atendidas: number
  pedidos_con_discapacidad: number
  renglones: number
  unidades_solicitadas: number
  unidades_entregadas: number
  /** días promedio entre la solicitud y la entrega (solo pedidos Entregado) */
  dias_promedio_entrega: number | null
  primer_pedido: string | null
  ultimo_pedido: string | null
  monto_dinero: number
}
