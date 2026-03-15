# Restaurant Images Design Spec

**Date:** 2026-03-16
**Scope:** Add photo URL support to the restaurant API and display an image carousel on the swipe card.

---

## Goal

Display real restaurant photos on the swipe feed card. The backend exposes a `photo_urls` array in the API response; the frontend renders a swipeable image carousel with name/cuisine/price overlaid on the image.

## Current State

- `Restaurant` model has `has_many_attached :photos` (ActiveStorage) and a `PhotosController` for owner uploads — **these are unaffected by this change**.
- `GET /api/v1/restaurants` returns plain `as_json` with no photo data.
- `RestaurantCard` shows a hardcoded gray placeholder with a 🍜 emoji.

## Backend Changes

### Migration

Add a native PostgreSQL text array column to `restaurants`:

```ruby
add_column :restaurants, :photo_urls, :text, array: true, default: []
```

### API Response

`photo_urls` is a plain ActiveRecord column — it is included in `as_json` output automatically. No model or controller changes needed beyond the migration.

### Seed Data

Update `db/seeds.rb` to populate `photo_urls` for each of the 6 restaurants with 3 Unsplash image URLs each, matched to cuisine type. URLs use the stable `https://images.unsplash.com/photo-<ID>?w=800&fit=crop` format — no file downloads required.

**Restaurants and their cuisine-matched photo sets:**

| Restaurant | Cuisine | Photos (3 Unsplash IDs) |
|---|---|---|
| Pho Saigon | Vietnamese | pho bowl, Vietnamese street food, restaurant interior |
| The Bun House | Chinese | dim sum basket, steamed buns, dumpling spread |
| Grill & Chill | Korean | Korean BBQ grill, meat platter, banchan spread |
| Pasta Rossa | Italian | pasta dish, pizza, Italian restaurant ambience |
| Curry Leaf | Indian | curry bowl, dosa, Indian spices |
| Omakase 88 | Japanese | sushi platter, sashimi, Japanese minimalist setting |

## Frontend Changes

### `Restaurant` type (`src/hooks/useRestaurants.ts`)

Add `photo_urls: string[]` to the `Restaurant` interface.

### `RestaurantCard` (`src/components/swipe/RestaurantCard.tsx`)

Replace the gray placeholder + bottom info panel with a full-card image area + gradient overlay. The bottom info `<View>` is **removed** — all text moves into the overlay.

**Image switching — state-based, no FlatList:**
Using a horizontal-scrolling `FlatList` inside the `GestureDetector` pan gesture in `FeedScreen` would cause gesture conflicts (both compete for horizontal touches). Instead, use a simple `photoIndex` state (`useState(0)`) and render a single `Image` at a time. Tapping a dot advances to that image — zero gesture conflict.

- **Container:** full-width, `aspectRatio: 3/4`, `borderRadius: 20`, `overflow: hidden`
- **Image:** single `Image` component, `resizeMode: cover`, fills the container; source is `photo_urls[photoIndex]`
- **Gradient overlay:** `LinearGradient` (transparent → rgba(0,0,0,0.75)) positioned absolutely at the bottom; contains restaurant name, cuisine type, price symbol, and address (replaces the removed bottom panel)
- **Dot indicators:** row of `TouchableOpacity` dots positioned absolutely above the gradient text; tapping a dot sets `photoIndex`. Each `TouchableOpacity` has `padding: 10` for a usable hit area. Active dot visual: white full opacity, 8×8. Inactive: white 45% opacity, 6×6.
- **Fallback:** if `photo_urls` is empty, show the current gray placeholder with 🍜 emoji

### Dependencies

- `expo-linear-gradient` — for the gradient overlay (part of Expo SDK 55, includes web support via SVG; install with `npx expo install expo-linear-gradient`)
- No other new dependencies

**Note on `price_range` serialization:** The `price_range` column is a PostgreSQL integer. Rails `as_json` serializes the raw integer value (e.g., `1`), not the enum string key (`"budget"`). The existing `PRICE_SYMBOLS` lookup keyed by number is correct and unchanged.

## Out of Scope

- Uploading new photos via the owner UI (existing `PhotosController` / ActiveStorage flow unchanged)
- Lazy loading or image caching optimizations
- RSpec factory updates (no existing specs assert on restaurant JSON shape)
