import { View, Text } from 'react-native';
import type { Restaurant } from '../../hooks/useRestaurants';

interface Props {
  restaurant: Restaurant;
}

const PRICE_SYMBOLS: Record<number, string> = { 1: '$', 2: '$$', 3: '$$$', 4: '$$$$' };

export function RestaurantCard({ restaurant }: Props) {
  return (
    <View className="bg-white rounded-2xl shadow-lg overflow-hidden w-full" style={{ aspectRatio: 3 / 4 }}>
      <View className="flex-1 bg-gray-200 items-center justify-center">
        <Text className="text-gray-400 text-4xl">🍜</Text>
      </View>
      <View className="p-4">
        <Text className="text-xl font-bold text-gray-900">{restaurant.name}</Text>
        <View className="flex-row items-center mt-1" style={{ gap: 8 }}>
          <Text className="text-gray-500">{restaurant.cuisine_type}</Text>
          <Text className="text-gray-400">·</Text>
          <Text className="text-gray-500">{PRICE_SYMBOLS[restaurant.price_range] ?? '$$'}</Text>
        </View>
        <Text className="text-gray-400 text-sm mt-1" numberOfLines={1}>{restaurant.address}</Text>
      </View>
    </View>
  );
}
