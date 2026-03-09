import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { Restaurant } from './useRestaurants';

export function useMyRestaurant() {
  return useQuery({
    queryKey: ['my-restaurant'],
    queryFn: async () => {
      const res = await api.get<Restaurant>('/my/restaurant');
      return res.data;
    },
    retry: false,
  });
}

export function useCreateRestaurant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Restaurant>) => api.post<Restaurant>('/my/restaurant', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-restaurant'] }),
  });
}

export function useUpdateRestaurant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Restaurant>) => api.patch<Restaurant>('/my/restaurant', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-restaurant'] }),
  });
}
