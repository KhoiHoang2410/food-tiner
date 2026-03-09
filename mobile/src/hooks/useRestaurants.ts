import { useInfiniteQuery, useMutation, useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';

export interface Restaurant {
  id: number;
  name: string;
  cuisine_type: string;
  price_range: number;
  address: string;
  latitude: number;
  longitude: number;
  description: string;
  phone: string;
  opening_hours: Record<string, string>;
  is_active: boolean;
}

export function useSwipeFeed(lat: number, lng: number) {
  return useInfiniteQuery({
    queryKey: ['restaurants', lat, lng],
    queryFn: async ({ pageParam }) => {
      const res = await api.get<Restaurant[]>('/restaurants', {
        params: { lat, lng, radius_km: 10, page: pageParam },
      });
      return res.data;
    },
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length === 10 ? allPages.length + 1 : undefined,
    initialPageParam: 1,
  });
}

export function useRestaurant(id: number) {
  return useQuery({
    queryKey: ['restaurant', id],
    queryFn: async () => {
      const res = await api.get<Restaurant>(`/restaurants/${id}`);
      return res.data;
    },
  });
}

export function useSwipe() {
  return useMutation({
    mutationFn: (data: { restaurant_id: number; direction: 'left' | 'right' }) =>
      api.post('/swipes', data),
  });
}
