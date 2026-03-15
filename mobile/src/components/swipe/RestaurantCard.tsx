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
