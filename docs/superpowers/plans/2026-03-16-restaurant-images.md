# Restaurant Images Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `photo_urls` array to the restaurant API and display a tap-to-navigate image carousel with gradient overlay on the swipe card.

**Architecture:** PostgreSQL `text[]` column on `restaurants` holds external Unsplash URLs. Rails `as_json` serializes the column automatically — no model/controller changes needed. The frontend renders a single `Image` at a time driven by a `photoIndex` state; tapping dots advances the photo. A `LinearGradient` overlay replaces the existing bottom info panel.

**Tech Stack:** Rails 8, PostgreSQL, React Native 0.83, Expo ~55, NativeWind v4, TypeScript, expo-linear-gradient

---

## Chunk 1: Backend — migration + seed data

### Task 1: Add `photo_urls` column migration

**Files:**
- Create: `backend/db/migrate/<timestamp>_add_photo_urls_to_restaurants.rb`

- [ ] **Step 1: Generate migration**

Run from `backend/`:
```bash
bin/rails generate migration AddPhotoUrlsToRestaurants
```
Expected: creates `db/migrate/<timestamp>_add_photo_urls_to_restaurants.rb`

- [ ] **Step 2: Edit the migration file**

Replace the generated body with:
```ruby
class AddPhotoUrlsToRestaurants < ActiveRecord::Migration[8.0]
  def change
    add_column :restaurants, :photo_urls, :text, array: true, default: [], null: false
  end
end
```

- [ ] **Step 3: Run the migration**

```bash
bin/rails db:migrate
```
Expected output: `== AddPhotoUrlsToRestaurants: migrated`

- [ ] **Step 4: Verify column exists**

```bash
bin/rails runner "puts Restaurant.column_names.include?('photo_urls')"
```
Expected: `true`

- [ ] **Step 5: Verify API includes photo_urls**

```bash
bin/rails runner "puts Restaurant.first.as_json.key?('photo_urls')"
```
Expected: `true`

- [ ] **Step 6: Commit**

```bash
git add db/migrate db/schema.rb
git commit -m "feat: add photo_urls column to restaurants"
```

---

### Task 2: Update seed data with Unsplash photo URLs

**Files:**
- Modify: `backend/db/seeds.rb`

- [ ] **Step 1: Add `photo_urls` to each restaurant hash in `restaurants_data`**

In `db/seeds.rb`, update each entry in `restaurants_data` to include a `photo_urls` key. The full updated array:

```ruby
restaurants_data = [
  {
    owner: owner1,
    name: "Pho Saigon",
    description: "Authentic Vietnamese pho and banh mi in the heart of the city.",
    phone: "028-1234-5678",
    address: "12 Nguyen Hue, District 1, Ho Chi Minh City",
    latitude: 10.7769,
    longitude: 106.7009,
    cuisine_type: "Vietnamese",
    price_range: :budget,
    opening_hours: { mon: "07:00-22:00", tue: "07:00-22:00", wed: "07:00-22:00",
                     thu: "07:00-22:00", fri: "07:00-23:00", sat: "08:00-23:00", sun: "08:00-21:00" },
    is_active: true,
    photo_urls: [
      "https://images.unsplash.com/photo-1555126634-323283e090fa?w=800&fit=crop",
      "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&fit=crop",
      "https://images.unsplash.com/photo-1553163147-622ab57be1c7?w=800&fit=crop"
    ]
  },
  {
    owner: owner1,
    name: "The Bun House",
    description: "Steamed buns, dumplings and dim sum. Casual lunch spot with queues worth joining.",
    phone: "028-2222-3333",
    address: "45 Le Loi, District 1, Ho Chi Minh City",
    latitude: 10.7740,
    longitude: 106.7030,
    cuisine_type: "Chinese",
    price_range: :moderate,
    opening_hours: { mon: "11:00-21:00", tue: "11:00-21:00", wed: "closed",
                     thu: "11:00-21:00", fri: "11:00-22:00", sat: "10:00-22:00", sun: "10:00-20:00" },
    is_active: true,
    photo_urls: [
      "https://images.unsplash.com/photo-1563245372-f21724e3856d?w=800&fit=crop",
      "https://images.unsplash.com/photo-1496116218417-1a781b1c416c?w=800&fit=crop",
      "https://images.unsplash.com/photo-1585032226651-759b368d7246?w=800&fit=crop"
    ]
  },
  {
    owner: owner2,
    name: "Grill & Chill",
    description: "Korean BBQ with premium cuts, unlimited sides, and great cocktails.",
    phone: "028-9876-5432",
    address: "88 Bui Vien, District 1, Ho Chi Minh City",
    latitude: 10.7690,
    longitude: 106.6920,
    cuisine_type: "Korean",
    price_range: :pricey,
    opening_hours: { mon: "17:00-23:00", tue: "17:00-23:00", wed: "17:00-23:00",
                     thu: "17:00-23:00", fri: "17:00-00:00", sat: "17:00-00:00", sun: "17:00-22:00" },
    is_active: true,
    photo_urls: [
      "https://images.unsplash.com/photo-1590301157890-4810ed352733?w=800&fit=crop",
      "https://images.unsplash.com/photo-1498654896293-37aacf113fd9?w=800&fit=crop",
      "https://images.unsplash.com/photo-1558030006-450675393462?w=800&fit=crop"
    ]
  },
  {
    owner: owner2,
    name: "Pasta Rossa",
    description: "Family-run Italian trattoria. Hand-rolled pasta, wood-fired pizza, imported wine.",
    phone: "028-5555-6666",
    address: "5 Thai Van Lung, District 1, Ho Chi Minh City",
    latitude: 10.7800,
    longitude: 106.7050,
    cuisine_type: "Italian",
    price_range: :pricey,
    opening_hours: { mon: "11:30-22:00", tue: "11:30-22:00", wed: "11:30-22:00",
                     thu: "11:30-22:00", fri: "11:30-23:00", sat: "12:00-23:00", sun: "12:00-21:00" },
    is_active: true,
    photo_urls: [
      "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=800&fit=crop",
      "https://images.unsplash.com/photo-1563379926898-05f4575a45d8?w=800&fit=crop",
      "https://images.unsplash.com/photo-1516100882582-96c3a05fe590?w=800&fit=crop"
    ]
  },
  {
    owner: owner1,
    name: "Curry Leaf",
    description: "South Indian street food — dosas, curries, and freshly squeezed lassi.",
    phone: "028-7777-8888",
    address: "22 Dong Du, District 1, Ho Chi Minh City",
    latitude: 10.7760,
    longitude: 106.7020,
    cuisine_type: "Indian",
    price_range: :budget,
    opening_hours: { mon: "10:00-21:00", tue: "10:00-21:00", wed: "10:00-21:00",
                     thu: "10:00-21:00", fri: "10:00-22:00", sat: "10:00-22:00", sun: "closed" },
    is_active: true,
    photo_urls: [
      "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=800&fit=crop",
      "https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=800&fit=crop",
      "https://images.unsplash.com/photo-1559847844-5315695dadae?w=800&fit=crop"
    ]
  },
  {
    owner: owner2,
    name: "Omakase 88",
    description: "Chef's choice Japanese tasting menu. Reservations strongly recommended.",
    phone: "028-0000-1111",
    address: "1 Mac Thi Buoi, District 1, Ho Chi Minh City",
    latitude: 10.7830,
    longitude: 106.7060,
    cuisine_type: "Japanese",
    price_range: :luxury,
    opening_hours: { mon: "closed", tue: "18:00-22:00", wed: "18:00-22:00",
                     thu: "18:00-22:00", fri: "18:00-23:00", sat: "17:00-23:00", sun: "17:00-21:00" },
    is_active: true,
    photo_urls: [
      "https://images.unsplash.com/photo-1562802378-063ec186a863?w=800&fit=crop",
      "https://images.unsplash.com/photo-1534482421-64566f976cfa?w=800&fit=crop",
      "https://images.unsplash.com/photo-1617196034738-26c5f7c977ce?w=800&fit=crop"
    ]
  },
]
```

- [ ] **Step 2: Update the `find_or_create_by!` block to also update `photo_urls` on existing records**

The current seed uses `find_or_create_by!(name: ...)` — existing restaurants won't get `photo_urls` added on re-seed. After the array, update the loop to handle this:

```ruby
restaurants = restaurants_data.map do |data|
  owner = data.delete(:owner)
  r = Restaurant.find_or_create_by!(name: data[:name]) do |rec|
    rec.assign_attributes(data)
    rec.owner_id = owner.id
  end
  r.update!(photo_urls: data[:photo_urls]) # always sync URLs on re-seed
  r
end
```

- [ ] **Step 3: Run seeds**

```bash
bin/rails db:seed
```
Expected output includes `6 restaurants`

- [ ] **Step 4: Verify photo_urls persisted**

```bash
bin/rails runner 'puts Restaurant.pluck(:name, :photo_urls).map { |n, p| "#{n}: #{p.length} photos" }'
```
Expected: each restaurant shows `3 photos`

- [ ] **Step 5: Verify API response includes photo_urls**

```bash
bin/rails runner "puts Restaurant.first.to_json"
```
Expected: JSON contains `photo_urls` array with 3 URL strings.

- [ ] **Step 6: Commit**

```bash
git add db/seeds.rb
git commit -m "feat: add photo_urls to restaurant seed data"
```

---

## Chunk 2: Frontend — install dependency, update type, rewrite card

### Task 3: Install expo-linear-gradient

**Files:** `mobile/package.json` (updated by expo install)

- [ ] **Step 1: Install the package**

Run from `mobile/`:
```bash
npx expo install expo-linear-gradient
```
Expected: installs `expo-linear-gradient` (SDK 55 compatible version)

- [ ] **Step 2: Verify installed**

```bash
node -e "require('./node_modules/expo-linear-gradient/package.json'); console.log('ok')"
```
Expected: `ok`

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: install expo-linear-gradient"
```

---

### Task 4: Add `photo_urls` to Restaurant TypeScript interface

**Files:**
- Modify: `mobile/src/hooks/useRestaurants.ts`

- [ ] **Step 1: Add `photo_urls: string[]` to the `Restaurant` interface**

In `mobile/src/hooks/useRestaurants.ts`, update the interface:

```ts
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
  photo_urls: string[];
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useRestaurants.ts
git commit -m "feat: add photo_urls to Restaurant type"
```

---

### Task 5: Rewrite RestaurantCard with image carousel + gradient overlay

**Files:**
- Modify: `mobile/src/components/swipe/RestaurantCard.tsx`

- [ ] **Step 1: Replace the entire file with the new implementation**

```tsx
import { useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import type { Restaurant } from '../../hooks/useRestaurants';

interface Props {
  restaurant: Restaurant;
}

const PRICE_SYMBOLS: Record<number, string> = { 1: '$', 2: '$$', 3: '$$$', 4: '$$$$' };

export function RestaurantCard({ restaurant }: Props) {
  const [photoIndex, setPhotoIndex] = useState(0);
  const photos = restaurant.photo_urls ?? [];

  if (photos.length === 0) {
    return (
      <View style={styles.shadow}>
        <View style={styles.container}>
          <View style={styles.placeholder}>
            <Text style={styles.placeholderEmoji}>🍜</Text>
          </View>
          <View style={styles.infoPanel}>
            <Text style={styles.name}>{restaurant.name}</Text>
            <View style={styles.meta}>
              <Text style={styles.metaText}>{restaurant.cuisine_type}</Text>
              <Text style={styles.separatorDot}>·</Text>
              <Text style={styles.metaText}>{PRICE_SYMBOLS[restaurant.price_range] ?? '$$'}</Text>
            </View>
            <Text style={styles.address} numberOfLines={1}>{restaurant.address}</Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.shadow}>
      <View style={styles.container}>
        <Image
          source={{ uri: photos[photoIndex] }}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
        />

        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.75)']}
          style={styles.gradient}
        >
          {photos.length > 1 && (
            <View style={styles.dots}>
              {photos.map((_, i) => (
                <TouchableOpacity
                  key={i}
                  onPress={() => setPhotoIndex(i)}
                  style={styles.dotHitArea}
                >
                  <View style={i === photoIndex ? styles.dotActive : styles.dotInactive} />
                </TouchableOpacity>
              ))}
            </View>
          )}

          <Text style={styles.overlayName}>{restaurant.name}</Text>
          <View style={styles.overlayMeta}>
            <Text style={styles.overlayMetaText}>{restaurant.cuisine_type}</Text>
            <Text style={styles.overlayMetaDot}>·</Text>
            <Text style={styles.overlayMetaText}>{PRICE_SYMBOLS[restaurant.price_range] ?? '$$'}</Text>
            <Text style={styles.overlayMetaDot}>·</Text>
            <Text style={styles.overlayAddress} numberOfLines={1}>{restaurant.address}</Text>
          </View>
        </LinearGradient>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shadow: {
    width: '100%',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  container: {
    width: '100%',
    aspectRatio: 3 / 4,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#e5e7eb',
  },
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderEmoji: {
    fontSize: 48,
  },
  infoPanel: {
    padding: 16,
    backgroundColor: 'white',
  },
  name: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 8,
  },
  metaText: {
    color: '#6b7280',
    fontSize: 14,
  },
  separatorDot: {
    color: '#9ca3af',
    fontSize: 14,
  },
  address: {
    color: '#9ca3af',
    fontSize: 13,
    marginTop: 4,
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 16,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 12,
    gap: 4,
  },
  dotHitArea: {
    padding: 10,
  },
  dotActive: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'white',
    opacity: 1,
  },
  dotInactive: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'white',
    opacity: 0.45,
  },
  overlayName: {
    color: 'white',
    fontSize: 22,
    fontWeight: '800',
    lineHeight: 26,
  },
  overlayMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 6,
    flexWrap: 'nowrap',
  },
  overlayMetaText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
  },
  overlayMetaDot: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
  },
  overlayAddress: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
    flex: 1,
  },
});
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```
Expected: no errors

- [ ] **Step 3: Verify in browser**

Open http://localhost:8081 — the feed card should show a real food photo with name/cuisine/price overlaid. Tap dots to cycle through photos.

- [ ] **Step 4: Commit**

```bash
git add src/components/swipe/RestaurantCard.tsx
git commit -m "feat: add image carousel with gradient overlay to RestaurantCard"
```
