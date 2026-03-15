import { useMutation } from '@tanstack/react-query';
import { storage } from '../lib/storage';
import { api } from '../lib/api';

interface AuthResponse {
  token: string;
  user: { id: number; email: string; role: string };
}

export function useLogin() {
  return useMutation({
    mutationFn: async (data: { email: string; password: string }) => {
      const res = await api.post<AuthResponse>('/auth/login', data);
      return res.data;
    },
    onSuccess: async (data) => {
      await storage.setItem('auth_token', data.token);
      await storage.setItem('user_role', data.user.role);
    },
  });
}

export function useRegister() {
  return useMutation({
    mutationFn: async (data: { email: string; password: string; role: string }) => {
      const res = await api.post<AuthResponse>('/auth/register', data);
      return res.data;
    },
    onSuccess: async (data) => {
      await storage.setItem('auth_token', data.token);
      await storage.setItem('user_role', data.user.role);
    },
  });
}
