import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  actualizarVehiculo,
  cambiarEstadoVehiculo,
  crearVehiculo,
  obtenerVehiculosAdmin,
  obtenerVehiculosDisponibles,
} from '../services/vehiculosService'

export function useVehiculos() {
  return useQuery({
    queryKey: ['vehiculos-disponibles'],
    queryFn: obtenerVehiculosDisponibles,
    staleTime: 60_000,
  })
}

export function useVehiculosAdmin() {
  return useQuery({
    queryKey: ['vehiculos-admin'],
    queryFn: obtenerVehiculosAdmin,
  })
}

export function useCrearVehiculo() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      nombre,
      tipoVehiculo,
      patente,
    }: {
      nombre: string
      tipoVehiculo?: string | null
      patente?: string | null
    }) => crearVehiculo({ nombre, tipoVehiculo, patente }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['vehiculos-disponibles'] })
      void queryClient.invalidateQueries({ queryKey: ['vehiculos-admin'] })
    },
  })
}

export function useActualizarVehiculo() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      nombre,
      tipoVehiculo,
      patente,
    }: {
      id: number
      nombre: string
      tipoVehiculo?: string | null
      patente?: string | null
    }) => actualizarVehiculo(id, { nombre, tipoVehiculo, patente }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['vehiculos-disponibles'] })
      void queryClient.invalidateQueries({ queryKey: ['vehiculos-admin'] })
    },
  })
}

export function useCambiarEstadoVehiculo() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, estado }: { id: number; estado: boolean }) =>
      cambiarEstadoVehiculo(id, estado),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['vehiculos-disponibles'] })
      void queryClient.invalidateQueries({ queryKey: ['vehiculos-admin'] })
    },
  })
}
