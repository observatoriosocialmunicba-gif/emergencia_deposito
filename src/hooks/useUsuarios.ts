import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  actualizarPerfil,
  actualizarUsuarioAdmin,
  listarUsuarios,
} from '../services/usuariosService'
import type {
  ActualizarPerfilDTO,
  ActualizarUsuarioAdminDTO,
  FiltroUsuarios,
} from '../services/usuariosService'

export function useActualizarPerfil() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, datos }: { id: string; datos: ActualizarPerfilDTO }) =>
      actualizarPerfil(id, datos),
    onSuccess: (data) => {
      queryClient.setQueryData(['usuario', data.id], data)
      void queryClient.invalidateQueries({ queryKey: ['usuario', data.id] })
    },
  })
}

export function useUsuarios(filtro: FiltroUsuarios) {
  return useQuery({
    queryKey: ['usuarios', filtro],
    queryFn: () => listarUsuarios(filtro),
  })
}

export function useActualizarUsuarioAdmin() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      datos,
    }: {
      id: string
      datos: ActualizarUsuarioAdminDTO
    }) => actualizarUsuarioAdmin(id, datos),
    onSuccess: (data) => {
      queryClient.setQueryData(['usuario', data.id], data)
      void queryClient.invalidateQueries({ queryKey: ['usuario', data.id] })
      void queryClient.invalidateQueries({ queryKey: ['usuarios'] })
    },
  })
}
