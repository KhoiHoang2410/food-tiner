import { View, Text, TouchableOpacity } from 'react-native';
import type { Reservation } from '../../hooks/useReservations';

interface Props {
  reservation: Reservation;
  onConfirm?: (id: number) => void;
  onReject?: (id: number) => void;
}

const STATUS_STYLE: Record<string, string> = {
  pending: 'text-yellow-600 bg-yellow-50',
  confirmed: 'text-green-600 bg-green-50',
  rejected: 'text-red-600 bg-red-50',
  cancelled: 'text-gray-500 bg-gray-100',
};

export function ReservationCard({ reservation, onConfirm, onReject }: Props) {
  return (
    <View className="bg-white rounded-xl p-4 shadow-sm mb-3">
      <View className="flex-row justify-between items-center">
        <Text className="font-semibold text-gray-900">Party of {reservation.party_size}</Text>
        <Text className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_STYLE[reservation.status] ?? ''}`}>
          {reservation.status}
        </Text>
      </View>

      <Text className="text-gray-500 text-sm mt-1">
        {new Date(reservation.requested_at).toLocaleString()}
      </Text>

      {reservation.note ? (
        <Text className="text-gray-600 mt-2 italic">"{reservation.note}"</Text>
      ) : null}

      {reservation.status === 'pending' && onConfirm && onReject && (
        <View className="flex-row mt-3" style={{ gap: 12 }}>
          <TouchableOpacity
            className="flex-1 bg-green-500 rounded-lg py-2"
            onPress={() => onConfirm(reservation.id)}
          >
            <Text className="text-white text-center font-medium">Confirm</Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="flex-1 bg-red-500 rounded-lg py-2"
            onPress={() => onReject(reservation.id)}
          >
            <Text className="text-white text-center font-medium">Reject</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
