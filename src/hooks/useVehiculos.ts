import { useQuery } from '@tanstack/react-query'
import { obtenerVehiculosDisponibles } from '../services/vehiculosService'

export function useVehiculos() {
  return useQuery({
    queryKey: ['vehiculos-disponibles'],
    queryFn: obtenerVehiculosDisponibles,
    staleTime: 60_000,
  })
}
