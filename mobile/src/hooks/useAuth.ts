import { useMutation } from '@tanstack/react-query';
import * as SecureStore from 'expo-secure-store';
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
      await SecureStore.setItemAsync('auth_token', data.token);
      await SecureStore.setItemAsync('user_role', data.user.role);
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
      await SecureStore.setItemAsync('auth_token', data.token);
      await SecureStore.setItemAsync('user_role', data.user.role);
    },
  });
}
