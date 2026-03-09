# Food Tinder

A Tinder-style mobile app for discovering and reserving restaurants. Swipe right to pick a restaurant, left to skip. After choosing, request a reservation or call directly. Restaurant owners manage their own profiles, photos, specials, and incoming reservations.

## Architecture

```
food_tinder/
├── backend/    # Rails 8 API (PostgreSQL, Devise + JWT, ActiveStorage)
└── mobile/     # React Native (Expo 55, TypeScript, TanStack Query, NativeWind)
```

## User Roles

| Role | Capabilities |
|------|-------------|
| **Diner** | Swipe feed, filter by cuisine/price, view restaurant detail, call restaurant, make/cancel reservations |
| **Restaurant Owner** | Manage profile, upload photos, add specials, confirm/reject reservation requests |

## API Overview

```
POST   /api/v1/auth/register
POST   /api/v1/auth/login
DELETE /api/v1/auth/logout

GET    /api/v1/restaurants          # swipe feed (geo-filtered)
GET    /api/v1/restaurants/:id
POST   /api/v1/swipes
POST   /api/v1/reservations
GET    /api/v1/reservations
DELETE /api/v1/reservations/:id

GET    /api/v1/my/restaurant        # owner endpoints
POST   /api/v1/my/restaurant
PATCH  /api/v1/my/restaurant
POST   /api/v1/my/photos
DELETE /api/v1/my/photos/:id
POST   /api/v1/my/specials
DELETE /api/v1/my/specials/:id
GET    /api/v1/my/reservations
PATCH  /api/v1/my/reservations/:id
```

## Quick Start

See setup instructions in each subdirectory:

- [Backend setup](./backend/README.md)
- [Mobile setup](./mobile/README.md)

## Error Response Format

All `4xx` errors follow a consistent format:

```json
{
  "errors": [
    {
      "message": "Human readable description",
      "error_code": "TF1001"
    }
  ]
}
```

See [design doc](./docs/plans/2026-03-08-food-tinder-design.md) for the full error code registry.
