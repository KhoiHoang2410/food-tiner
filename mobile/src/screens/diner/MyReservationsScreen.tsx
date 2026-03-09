import { View, Text, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RootStackParamList } from '../../../App';
import { useMyReservations, useCancelReservation } from '../../hooks/useReservations';

type Props = {
  navigation: StackNavigationProp<RootStackParamList, 'MyReservations'>;
};

const STATUS_STYLE: Record<string, string> = {
  pending: 'text-yellow-600 bg-yellow-50',
  confirmed: 'text-green-600 bg-green-50',
  rejected: 'text-red-600 bg-red-50',
  cancelled: 'text-gray-500 bg-gray-100',
};

export default function MyReservationsScreen({ navigation }: Props) {
  const { data: reservations, isLoading } = useMyReservations();
  const cancel = useCancelReservation();

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
        <Text className="text-2xl font-bold text-gray-900">My Reservations</Text>
      </View>

      <FlatList
        data={reservations}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }) => (
          <View className="bg-white rounded-xl p-4 shadow-sm mb-3">
            <View className="flex-row justify-between items-center">
              <Text className="font-semibold text-gray-900">Party of {item.party_size}</Text>
              <Text className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_STYLE[item.status] ?? ''}`}>
                {item.status}
              </Text>
            </View>
            <Text className="text-gray-500 text-sm mt-1">
              {new Date(item.requested_at).toLocaleString()}
            </Text>
            {item.note ? (
              <Text className="text-gray-600 mt-2 italic">"{item.note}"</Text>
            ) : null}
            {item.status === 'pending' && (
              <TouchableOpacity
                className="mt-3 bg-red-50 rounded-lg py-2"
                onPress={() => cancel.mutate(item.id)}
              >
                <Text className="text-red-500 text-center font-medium">Cancel</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
        ListEmptyComponent={
          <Text className="text-gray-400 text-center mt-12">No reservations yet</Text>
        }
      />
    </View>
  );
}
