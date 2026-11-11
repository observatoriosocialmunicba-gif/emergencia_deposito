import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  actualizarPedidoConDetalles,
  asignarPedido,
  autorizarPedido,
  buscarPedidos,
  crearPedidoConDetalles,
  entregarPedido,
  noEntregarPedido,
  obtenerConteos,
  obtenerHistorialPorPersona,
  obtenerPedidoDetalle,
  rechazarPedido,
  reintentarEntrega,
} from '../services/pedidosService'
import type {
  ActualizarPedidoDTO,
  AsignarPedidoDTO,
  AutorizarPedidoDTO,
  CrearPedidoDTO,
  EntregarPedidoDTO,
  FiltroPedidos,
  NoEntregarPedidoDTO,
  RechazarPedidoDTO,
  ReintentarEntregaDTO,
} from '../services/pedidosService'

export function useConteos() {
  return useQuery({
    queryKey: ['conteo-estados'],
    queryFn: obtenerConteos,
  })
}

export function usePedidos(filtro: FiltroPedidos) {
  return useQuery({
    queryKey: ['pedidos', filtro.estado, filtro.busqueda, filtro.pagina, filtro.porPagina],
    queryFn: () => buscarPedidos(filtro),
    placeholderData: keepPreviousData,
  })
}

export function useAsignarPedido() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dto: AsignarPedidoDTO) => asignarPedido(dto),
    onSuccess: (_, vars) => {
      void queryClient.invalidateQueries({ queryKey: ['pedidos'] })
      void queryClient.invalidateQueries({ queryKey: ['conteo-estados'] })
      void queryClient.invalidateQueries({ queryKey: ['pedido', vars.idPedido] })
    },
  })
}

export function useAutorizarPedido() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dto: AutorizarPedidoDTO) => autorizarPedido(dto),
    onSuccess: (_, vars) => {
      void queryClient.invalidateQueries({ queryKey: ['pedidos'] })
      void queryClient.invalidateQueries({ queryKey: ['conteo-estados'] })
      void queryClient.invalidateQueries({ queryKey: ['pedido', vars.idPedido] })
    },
  })
}

export function useRechazarPedido() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dto: RechazarPedidoDTO) => rechazarPedido(dto),
    onSuccess: (_, vars) => {
      void queryClient.invalidateQueries({ queryKey: ['pedidos'] })
      void queryClient.invalidateQueries({ queryKey: ['conteo-estados'] })
      void queryClient.invalidateQueries({ queryKey: ['pedido', vars.idPedido] })
    },
  })
}

export function useEntregarPedido() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dto: EntregarPedidoDTO) => entregarPedido(dto),
    onSuccess: (_, vars) => {
      void queryClient.invalidateQueries({ queryKey: ['pedidos'] })
      void queryClient.invalidateQueries({ queryKey: ['conteo-estados'] })
      void queryClient.invalidateQueries({ queryKey: ['pedido', vars.idPedido] })
    },
  })
}

export function useNoEntregarPedido() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dto: NoEntregarPedidoDTO) => noEntregarPedido(dto),
    onSuccess: (_, vars) => {
      void queryClient.invalidateQueries({ queryKey: ['pedidos'] })
      void queryClient.invalidateQueries({ queryKey: ['conteo-estados'] })
      void queryClient.invalidateQueries({ queryKey: ['pedido', vars.idPedido] })
    },
  })
}

export function useReintentarEntrega() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dto: ReintentarEntregaDTO) => reintentarEntrega(dto),
    onSuccess: (_, vars) => {
      void queryClient.invalidateQueries({ queryKey: ['pedidos'] })
      void queryClient.invalidateQueries({ queryKey: ['conteo-estados'] })
      void queryClient.invalidateQueries({ queryKey: ['pedido', vars.idPedido] })
    },
  })
}

export function usePedidoDetalle(id: number) {
  return useQuery({
    queryKey: ['pedido', id],
    queryFn: () => obtenerPedidoDetalle(id),
    enabled: Number.isFinite(id) && id > 0,
  })
}

export function useCrearPedido() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dto: CrearPedidoDTO) => crearPedidoConDetalles(dto),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['pedidos'] })
      void queryClient.invalidateQueries({ queryKey: ['conteo-estados'] })
    },
  })
}

export function useActualizarPedido() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dto: ActualizarPedidoDTO) => actualizarPedidoConDetalles(dto),
    onSuccess: (_, vars) => {
      void queryClient.invalidateQueries({ queryKey: ['pedidos'] })
      void queryClient.invalidateQueries({ queryKey: ['conteo-estados'] })
      void queryClient.invalidateQueries({ queryKey: ['pedido', vars.idPedido] })
    },
  })
}

export function useHistorialPersona(idPersona?: number | null, dni?: string | null) {
  return useQuery({
    queryKey: ['historial-persona', idPersona, dni],
    queryFn: () => obtenerHistorialPorPersona(idPersona ?? 0, dni),
    enabled: Boolean((idPersona && idPersona > 0) || (dni && dni.trim().length > 0)),
  })
}
