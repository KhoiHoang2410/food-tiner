# Food Tinder — Mobile

React Native app (Expo) for the Food Tinder platform. Supports two modes in a single app: diner (swipe + reserve) and restaurant owner (profile + reservations).

## Tech Stack

| | |
|---|---|
| **Framework** | React Native + Expo SDK 55 |
| **Language** | TypeScript (strict mode) |
| **Styling** | NativeWind 4 (TailwindCSS for RN) |
| **Server State** | TanStack Query v5 |
| **Navigation** | React Navigation v7 (Stack) |
| **Gestures** | react-native-gesture-handler + reanimated |
| **Auth Storage** | expo-secure-store |
| **Component Dev** | Storybook |

## Prerequisites

- Node.js 18+
- npm or yarn
- [Expo Go](https://expo.dev/go) app on your iOS/Android device, **or** iOS Simulator / Android Emulator

## Setup

**1. Install dependencies**

```bash
npm install
```

**2. Configure API URL**

Create a `.env` file in the `mobile/` directory:

```env
EXPO_PUBLIC_API_URL=http://localhost:3000/api/v1
```

For a physical device, replace `localhost` with your machine's local IP (e.g. `192.168.1.x`).

## Running Locally

```bash
# Start the Expo dev server
npm start

# Or run directly on a platform
npm run ios       # iOS Simulator
npm run android   # Android Emulator
npm run web       # Browser (limited)
```

Scan the QR code with Expo Go on your phone, or press `i` / `a` in the terminal to open a simulator.

## Type Checking

```bash
npx tsc --noEmit
```

Expected output: no errors (strict TypeScript).

## Project Structure

```
src/
├── lib/
│   └── api.ts                  # Axios instance with JWT interceptor
├── hooks/
│   ├── useAuth.ts              # login / register mutations
│   ├── useRestaurants.ts       # swipe feed, restaurant detail, swipe mutation
│   ├── useReservations.ts      # diner reservations (create / cancel / list)
│   ├── useMyRestaurant.ts      # owner restaurant CRUD
│   └── useOwnerReservations.ts # owner reservation inbox
├── components/
│   ├── auth/
│   │   └── AuthForm.tsx
│   ├── swipe/
│   │   └── RestaurantCard.tsx
│   └── reservation/
│       ├── ReservationForm.tsx
│       └── ReservationCard.tsx
└── screens/
    ├── auth/
    │   ├── LoginScreen.tsx
    │   └── RegisterScreen.tsx
    ├── diner/
    │   ├── FeedScreen.tsx
    │   ├── RestaurantDetailScreen.tsx
    │   └── MyReservationsScreen.tsx
    └── owner/
        ├── OwnerProfileScreen.tsx
        └── OwnerReservationsScreen.tsx
App.tsx                         # Root: QueryClient + NavigationContainer
```

## Screen Flow

### Diner
```
Login / Register
  └── Feed (swipe cards)
        └── Restaurant Detail (photos, phone, hours)
              └── Reservation Form → My Reservations
```

### Restaurant Owner
```
Login / Register (role: restaurant_owner)
  └── Owner Profile (create / edit restaurant)
        └── Owner Reservations (confirm / reject requests)
```

## Swipe Gestures

- **Swipe right** (or tap ♥) → navigate to restaurant detail + record right swipe
- **Swipe left** (or tap ✕) → skip, record left swipe
- Threshold: 120px horizontal movement to trigger

Already-swiped restaurants are excluded from future feeds by the backend.
