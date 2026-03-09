import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

export interface Reservation {
  id: number;
  restaurant_id: number;
  party_size: number;
  requested_at: string;
  note?: string;
  status: 'pending' | 'confirmed' | 'rejected' | 'cancelled';
}

export function useMyReservations() {
  return useQuery({
    queryKey: ['reservations'],
    queryFn: async () => {
      const res = await api.get<Reservation[]>('/reservations');
      return res.data;
    },
  });
}

export function useCreateReservation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      restaurant_id: number;
      party_size: number;
      requested_at: string;
      note?: string;
    }) => api.post<Reservation>('/reservations', data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['reservations'] }),
  });
}

export function useCancelReservation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.delete(`/reservations/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['reservations'] }),
  });
}
