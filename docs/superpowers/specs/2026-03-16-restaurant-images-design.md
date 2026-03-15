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

Override `as_json` on `Restaurant` to include `photo_urls` in all serialization contexts:

```ruby
def as_json(options = {})
  super(options.merge(methods: :photo_urls))
end
```

Both `GET /api/v1/restaurants` (index) and `GET /api/v1/restaurants/:id` (show) automatically include the field — no controller changes needed.

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

Replace the gray placeholder with an image carousel:

- **Container:** full-width, `aspectRatio: 3/4`, `borderRadius: 20`, `overflow: hidden`
- **Carousel:** `FlatList` with `horizontal`, `pagingEnabled`, `showsHorizontalScrollIndicator: false`; each item renders a full-width `Image` (resizeMode: cover)
- **Gradient overlay:** `LinearGradient` (transparent → rgba(0,0,0,0.75)) positioned absolutely at the bottom; contains restaurant name, cuisine type, price symbol, and address
- **Dot indicators:** row of dots positioned absolutely above the gradient bar; active dot is white/full opacity, inactive dots are white/45% opacity
- **Fallback:** if `photo_urls` is empty, show the existing gray placeholder with 🍜 emoji

### Dependencies

- `expo-linear-gradient` — for the gradient overlay (already available in Expo SDK 55, just needs installing)
- No other new dependencies

## Out of Scope

- Horizontal swipe on images conflicting with the card pan gesture (image carousel uses tap/scroll within the card; pan gesture on the outer `GestureDetector` handles left/right swipe to like/dislike)
- Uploading new photos via the owner UI (existing `PhotosController` / ActiveStorage flow unchanged)
- Lazy loading or image caching optimizations
