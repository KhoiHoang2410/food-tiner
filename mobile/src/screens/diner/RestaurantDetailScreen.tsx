import { View, Text, ScrollView, TouchableOpacity, Linking, ActivityIndicator } from 'react-native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RouteProp } from '@react-navigation/native';
import type { RootStackParamList } from '../../../App';
import { useRestaurant } from '../../hooks/useRestaurants';
import { useCreateReservation } from '../../hooks/useReservations';
import { ReservationForm } from '../../components/reservation/ReservationForm';

type Props = {
  navigation: StackNavigationProp<RootStackParamList, 'RestaurantDetail'>;
  route: RouteProp<RootStackParamList, 'RestaurantDetail'>;
};

const PRICE_SYMBOLS: Record<number, string> = { 1: '$', 2: '$$', 3: '$$$', 4: '$$$$' };

export default function RestaurantDetailScreen({ navigation, route }: Props) {
  const { id } = route.params;
  const { data: restaurant, isLoading } = useRestaurant(id);
  const createReservation = useCreateReservation();

  if (isLoading || !restaurant) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#f97316" />
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-white">
      <View className="h-64 bg-gray-200 items-center justify-center">
        <Text className="text-6xl">🍜</Text>
      </View>

      <View className="p-6">
        <TouchableOpacity
          className="mb-4"
          onPress={() => navigation.goBack()}
        >
          <Text className="text-orange-500">← Back</Text>
        </TouchableOpacity>

        <Text className="text-2xl font-bold text-gray-900">{restaurant.name}</Text>
        <Text className="text-gray-500 mt-1">
          {restaurant.cuisine_type} · {PRICE_SYMBOLS[restaurant.price_range] ?? '$$'}
        </Text>

        {restaurant.description ? (
          <Text className="text-gray-600 mt-4">{restaurant.description}</Text>
        ) : null}

        <TouchableOpacity
          className="flex-row items-center mt-4"
          onPress={() => Linking.openURL(`tel:${restaurant.phone}`)}
        >
          <Text className="text-orange-500 font-medium text-base">📞 {restaurant.phone}</Text>
        </TouchableOpacity>

        <Text className="text-gray-500 mt-2">📍 {restaurant.address}</Text>

        <View className="mt-8 border-t border-gray-100 pt-6">
          <ReservationForm
            restaurantId={restaurant.id}
            isLoading={createReservation.isPending}
            onSubmit={(data) => {
              createReservation.mutate(data, {
                onSuccess: () => navigation.push('MyReservations'),
              });
            }}
          />
        </View>
      </View>
    </ScrollView>
  );
}
