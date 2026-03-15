# Web View Support Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `expo start --web` produce a fully functional Food Tinder web app with feature parity to the mobile build.

**Architecture:** Replace `expo-secure-store` (native-only) with a platform-aware storage shim in a new `src/lib/storage.ts` file. The shim uses `expo-secure-store` on iOS/Android and `localStorage` on web. Update the two call sites (`useAuth.ts` and `api.ts`) to use the shim.

**Tech Stack:** Expo ~55, React Native 0.83, NativeWind v4, react-navigation v7, react-query v5, TypeScript

---

## Chunk 1: Storage shim + call site updates

**Files:**
- Create: `mobile/src/lib/storage.ts`
- Modify: `mobile/src/hooks/useAuth.ts`
- Modify: `mobile/src/lib/api.ts`

---

### Task 1: Create the platform-aware storage shim

**Files:**
- Create: `mobile/src/lib/storage.ts`

- [ ] **Step 1: Create the file**

```ts
// mobile/src/lib/storage.ts
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

export const storage = {
  getItem: (key: string): Promise<string | null> =>
    Platform.OS === 'web'
      ? Promise.resolve(localStorage.getItem(key))
      : SecureStore.getItemAsync(key),

  setItem: (key: string, value: string): Promise<void> =>
    Platform.OS === 'web'
      ? Promise.resolve(localStorage.setItem(key, value))
      : SecureStore.setItemAsync(key, value),
};
```

- [ ] **Step 2: Verify TypeScript compiles**

Run from `mobile/`:
```bash
npx tsc --noEmit
```
Expected: no errors related to `storage.ts`

---

### Task 2: Update useAuth.ts to use the storage shim

**Files:**
- Modify: `mobile/src/hooks/useAuth.ts`

Current file imports `* as SecureStore from 'expo-secure-store'` and calls `SecureStore.setItemAsync` in two places (once in `useLogin.onSuccess`, once in `useRegister.onSuccess`).

- [ ] **Step 1: Replace the import and call sites**

Replace the entire file with:

```ts
// mobile/src/hooks/useAuth.ts
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
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```
Expected: no errors

---

### Task 3: Update api.ts to use the storage shim

**Files:**
- Modify: `mobile/src/lib/api.ts`

Current file imports `* as SecureStore from 'expo-secure-store'` and calls `SecureStore.getItemAsync('auth_token')` in the axios interceptor.

- [ ] **Step 1: Replace the import and call site**

Replace the entire file with:

```ts
// mobile/src/lib/api.ts
import axios from 'axios';
import { storage } from './storage';

export const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000/api/v1',
});

api.interceptors.request.use(async (config) => {
  const token = await storage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add mobile/src/lib/storage.ts mobile/src/hooks/useAuth.ts mobile/src/lib/api.ts
git commit -m "feat: add platform-aware storage shim for web support"
```

---

### Task 4: Verify web launch

- [ ] **Step 1: Start the web dev server**

Run from `mobile/`:
```bash
npx expo start --web
```
Expected: browser opens, no crash, login screen renders

- [ ] **Step 2: Test login flow**

In the browser:
1. Enter valid credentials and submit
2. Expected: navigates to Feed screen (swipe deck visible)
3. Open DevTools → Application → Local Storage → verify `auth_token` and `user_role` are set

- [ ] **Step 3: Test swipe feed**

1. On the Feed screen, click the ✕ button — card should advance
2. Click the ♥ button — should navigate to RestaurantDetail screen
3. Navigate to My Reservations — list should load

- [ ] **Step 4: Test owner flow**

1. Register or log in as an owner (`role: owner`)
2. Verify OwnerProfile screen renders and form submits
3. Navigate to Owner Reservations — list should load

- [ ] **Step 5: Commit verification**

```bash
git commit --allow-empty -m "chore: verify web launch successful"
```
