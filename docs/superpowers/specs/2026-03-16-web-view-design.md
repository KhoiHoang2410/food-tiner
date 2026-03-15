# Web View Support — Design Spec

**Date:** 2026-03-16
**Scope:** Enable `expo start --web` to produce a fully functional web app with feature parity to the mobile build.

---

## Goal

Make the Food Tinder mobile app launchable in a web browser via Expo's web target, with all features working (auth, swipe feed, reservations, owner profile).

## Current State

The app already has partial web readiness:
- `package.json` includes `"web": "expo start --web"` script
- `app.json` has a `web` section with favicon configured
- All dependencies except `expo-secure-store` support web: `react-native-gesture-handler`, `react-native-reanimated`, NativeWind v4, `@react-navigation/*`

## Problem

`expo-secure-store` does not support the web platform. It is used in two places:
- `src/hooks/useAuth.ts` — writes `auth_token` and `user_role` after login/register
- `src/lib/api.ts` — reads `auth_token` for the axios request interceptor

Running `expo start --web` currently crashes due to this missing native module.

## Solution

### Platform-aware storage shim

Create `src/lib/storage.ts` — a thin wrapper that delegates to `expo-secure-store` on native platforms and `localStorage` on web.

```ts
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

### Files to modify

| File | Change |
|------|--------|
| `src/lib/storage.ts` | **Create** — platform shim |
| `src/hooks/useAuth.ts` | Replace `SecureStore.setItemAsync` → `storage.setItem` |
| `src/lib/api.ts` | Replace `SecureStore.getItemAsync` → `storage.getItem` |

## Security Note

On web, tokens are stored in `localStorage` (visible in browser DevTools). This is the standard trade-off for Expo web apps and acceptable for this use case.

## Swipe UX on Web

The swipe gesture (pan drag) is not required on web. The existing ✕/♥ buttons in `FeedScreen` are sufficient for web users. No gesture changes needed.

## Out of Scope

- Mouse drag swipe gestures on web
- Replacing `expo-image-picker` (not currently used in any screen)
- PWA configuration
- SSR / Next.js migration
