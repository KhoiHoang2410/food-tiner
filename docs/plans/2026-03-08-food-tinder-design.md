# Food Tinder — Design Document
_Date: 2026-03-08_

## Overview

A mobile app like Tinder but for food. Diners swipe right to choose a restaurant, left to skip. After choosing, they can make a reservation request and view the restaurant's phone number for manual contact. Restaurant owners manage their own profiles including photos, specials, and opening hours.

**Target users:** Indecisive diners who want to discover and decide on nearby restaurants (solo or group).

**Core mechanic:** Swipe feed filtered by location + user preferences (cuisine, price range).

**MVP scope:** Swipe, reserve (simple request), restaurant profile management, phone contact.

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                  React Native App                   │
│         (Diner mode / Restaurant mode)              │
└──────────────────────┬──────────────────────────────┘
                       │ REST API (JSON)
┌──────────────────────▼──────────────────────────────┐
│              Rails API (Monolith)                   │
│  Auth │ Restaurants │ Swipes │ Reservations         │
└──────────────────────┬──────────────────────────────┘
                       │
         ┌─────────────┴──────────────┐
         ▼                            ▼
    PostgreSQL                  ActiveStorage
  (primary data)              (image uploads → S3)
```

- Single Rails API serves both mobile app roles
- Two user roles in one React Native app: **diner** and **restaurant_owner**

---

## Data Models

```
User
├── id, email, password_digest
├── role: enum [diner, restaurant_owner]
└── timestamps

Restaurant
├── id, user_id (→ User) [DB column: owner_id]
├── name, description, phone
├── address, latitude, longitude
├── cuisine_type, price_range (1-4)
├── opening_hours (jsonb)
├── is_active: boolean
└── timestamps
  has_many :photos (ActiveStorage)
  has_many :specials

Special
├── id, restaurant_id
├── title, description
├── valid_until
└── timestamps

Swipe
├── id, user_id, restaurant_id
├── direction: enum [left, right]
└── created_at

Reservation
├── id, user_id, restaurant_id
├── party_size, requested_at (datetime)
├── note (optional user message)
├── status: enum [pending, confirmed, rejected, cancelled]
└── timestamps
```

**Key decisions:**
- `latitude/longitude` on Restaurant enables geo-filtering by distance
- `opening_hours` as JSONB (flexible per-day structure)
- Swipes are idempotent (upsert on duplicate)
- Cancelled reservations are soft-deleted (status: cancelled)
- Rails association: `belongs_to :user, foreign_key: :owner_id`

---

## API Endpoints

### Auth
```
POST   /api/v1/auth/register
POST   /api/v1/auth/login
DELETE /api/v1/auth/logout
```

### Restaurants (Diner)
```
GET  /api/v1/restaurants         # swipe feed
GET  /api/v1/restaurants/:id     # detail view
```

Swipe feed query params:
```
?lat=&lng=&radius_km=&cuisine=&price_range=&page=
```

### Restaurants (Owner)
```
GET    /api/v1/my/restaurant
POST   /api/v1/my/restaurant
PATCH  /api/v1/my/restaurant
POST   /api/v1/my/restaurant/photos
DELETE /api/v1/my/restaurant/photos/:id
POST   /api/v1/my/restaurant/specials
DELETE /api/v1/my/restaurant/specials/:id
```

### Swipes
```
POST /api/v1/swipes    # { restaurant_id, direction: "left"|"right" }
```

### Reservations (Diner)
```
POST   /api/v1/reservations
GET    /api/v1/reservations
DELETE /api/v1/reservations/:id
```

### Reservations (Owner)
```
GET   /api/v1/my/reservations
PATCH /api/v1/my/reservations/:id    # confirm or reject
```

---

## Mobile App Screens

### Diner Flow
```
Onboarding → Set preferences (cuisine, price range)
    ↓
Swipe Feed → Cards with photo, name, cuisine, price, distance
    ├── Swipe Left  → next card
    └── Swipe Right → Restaurant Detail screen
                          ├── Photos, description, hours, specials
                          ├── Phone number (tap to call)
                          └── [Make Reservation] button
                                  ↓
                          Reservation Form (party size, date/time, note)
                                  ↓
                          Confirmation screen (pending status)

My Reservations → list with status (pending/confirmed/rejected)
```

### Restaurant Owner Flow
```
Register/Login (role: restaurant_owner)
    ↓
Profile Setup → name, cuisine, price range, address, phone, hours
    ↓
Photo Upload → up to 5 photos
    ↓
Specials → add/remove current promotions
    ↓
Reservation Inbox → list of requests → confirm or reject each
```

**UX notes:**
- Swipe gestures via `react-native-gesture-handler` + `react-native-reanimated`
- Card stack shows top 3 cards for smooth animation

---

## Error Handling

### Standard Error Response Format
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

### Error Code Registry

| Code   | HTTP | Description |
|--------|------|-------------|
| **Auth** |||
| TF1001 | 401  | Missing or invalid token |
| TF1002 | 401  | Token expired |
| TF1003 | 400  | Invalid credentials (wrong email/password) |
| TF1004 | 422  | Email already registered |
| TF1005 | 400  | Invalid role |
| **Authorization** |||
| TF2001 | 400  | Insufficient role for this action |
| TF2002 | 400  | Resource does not belong to current user |
| **Restaurant** |||
| TF3001 | 404  | Restaurant not found |
| TF3002 | 422  | Restaurant already exists for this owner |
| TF3003 | 422  | Max photos limit reached (5) |
| TF3004 | 422  | Invalid image format or size |
| **Reservation** |||
| TF4001 | 404  | Reservation not found |
| TF4002 | 422  | Pending reservation already exists for this restaurant |
| TF4003 | 422  | Cannot cancel a confirmed/rejected reservation |
| **General** |||
| TF5001 | 422  | Validation failed (field-level details in message) |
| TF5002 | 404  | Resource not found |
| TF5003 | 500  | Internal server error |

### Auth
- JWT tokens stored in device keychain (`expo-secure-store`)
- Access token: 24h, Refresh token: 7d
- Role-based access enforced server-side

### Edge Cases
- No restaurants nearby → empty state with "expand radius" prompt
- All restaurants swiped → "You've seen everything nearby" message
- Restaurant: one active profile per owner account
- Reservation: one pending reservation per restaurant per diner
- Images: max 5 per restaurant, max 10MB, formats: jpg/png/webp

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Mobile | React Native, TypeScript (strict), TanStack Query, NativeWind (TailwindCSS), Storybook |
| Backend | Ruby on Rails (API mode) |
| Database | PostgreSQL |
| File Storage | ActiveStorage + S3 |
| Auth | Devise + JWT |

---

## Testing

### Backend (Rails)
- RSpec for unit + request specs
- Stubs/mocks only for external API calls (S3, third-party) — internal services/classes tested through real execution
- Factory Bot for test data, Shoulda Matchers for model validations
- Coverage focus: auth, swipe feed filtering, reservation state machine, error codes

### Mobile (React Native)
- TypeScript strict mode throughout
- TanStack Query for all server state (fetching, caching, mutations)
- NativeWind for styling
- Storybook for component isolation and visual testing
- Jest + React Native Testing Library for logic/behavior tests
