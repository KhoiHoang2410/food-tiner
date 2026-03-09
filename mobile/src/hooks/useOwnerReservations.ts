import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { Reservation } from './useReservations';

export function useOwnerReservations() {
  return useQuery({
    queryKey: ['owner-reservations'],
    queryFn: async () => {
      const res = await api.get<Reservation[]>('/my/reservations');
      return res.data;
    },
  });
}

export function useUpdateReservationStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: 'confirmed' | 'rejected' }) =>
      api.patch(`/my/reservations/${id}`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['owner-reservations'] }),
  });
}
