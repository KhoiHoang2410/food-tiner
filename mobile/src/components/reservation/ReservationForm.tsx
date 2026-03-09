import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';

interface ReservationFormData {
  restaurant_id: number;
  party_size: number;
  requested_at: string;
  note?: string;
}

interface Props {
  restaurantId: number;
  onSubmit: (data: ReservationFormData) => void;
  isLoading: boolean;
}

export function ReservationForm({ restaurantId, onSubmit, isLoading }: Props) {
  const [partySize, setPartySize] = useState('2');
  const [date, setDate] = useState('');
  const [note, setNote] = useState('');

  const handleSubmit = () => {
    onSubmit({
      restaurant_id: restaurantId,
      party_size: Number(partySize),
      requested_at: date,
      note: note || undefined,
    });
  };

  return (
    <View>
      <Text className="text-lg font-semibold mb-4">Make a Reservation</Text>

      <TextInput
        className="border border-gray-300 rounded-lg px-4 py-3 mb-4 text-base"
        placeholder="Party size"
        value={partySize}
        onChangeText={setPartySize}
        keyboardType="numeric"
      />

      <TextInput
        className="border border-gray-300 rounded-lg px-4 py-3 mb-4 text-base"
        placeholder="Date & time (e.g. 2026-03-10 19:00)"
        value={date}
        onChangeText={setDate}
      />

      <TextInput
        className="border border-gray-300 rounded-lg px-4 py-3 mb-6 text-base"
        placeholder="Special requests (optional)"
        value={note}
        onChangeText={setNote}
        multiline
        numberOfLines={3}
      />

      <TouchableOpacity
        className="bg-orange-500 rounded-lg py-4"
        onPress={handleSubmit}
        disabled={isLoading}
      >
        {isLoading
          ? <ActivityIndicator color="white" />
          : <Text className="text-white text-center font-semibold">Request Reservation</Text>
        }
      </TouchableOpacity>
    </View>
  );
}
