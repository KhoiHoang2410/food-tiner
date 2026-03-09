import { View, Text, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RootStackParamList } from '../../../App';
import { ReservationCard } from '../../components/reservation/ReservationCard';
import { useOwnerReservations, useUpdateReservationStatus } from '../../hooks/useOwnerReservations';

type Props = {
  navigation: StackNavigationProp<RootStackParamList, 'OwnerReservations'>;
};

export default function OwnerReservationsScreen({ navigation }: Props) {
  const { data: reservations, isLoading } = useOwnerReservations();
  const updateStatus = useUpdateReservationStatus();

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#f97316" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      <View className="bg-white px-6 pt-12 pb-4 border-b border-gray-100">
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text className="text-orange-500 mb-2">← Back</Text>
        </TouchableOpacity>
        <Text className="text-2xl font-bold text-gray-900">Reservation Requests</Text>
      </View>

      <FlatList
        data={reservations}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }) => (
          <ReservationCard
            reservation={item}
            onConfirm={(id) => updateStatus.mutate({ id, status: 'confirmed' })}
            onReject={(id) => updateStatus.mutate({ id, status: 'rejected' })}
          />
        )}
        ListEmptyComponent={
          <Text className="text-gray-400 text-center mt-12">No reservation requests yet</Text>
        }
      />
    </View>
  );
}
