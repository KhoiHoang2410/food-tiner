import { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  ScrollView, ActivityIndicator,
} from 'react-native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RootStackParamList } from '../../../App';
import { useMyRestaurant, useCreateRestaurant, useUpdateRestaurant } from '../../hooks/useMyRestaurant';

type Props = {
  navigation: StackNavigationProp<RootStackParamList, 'OwnerProfile'>;
};

interface FormState {
  name: string;
  cuisine_type: string;
  price_range: string;
  phone: string;
  address: string;
  description: string;
}

const FIELDS: { key: keyof FormState; label: string; numeric?: boolean; multiline?: boolean }[] = [
  { key: 'name', label: 'Restaurant Name' },
  { key: 'cuisine_type', label: 'Cuisine Type' },
  { key: 'price_range', label: 'Price Range (1-4)', numeric: true },
  { key: 'phone', label: 'Phone Number', numeric: true },
  { key: 'address', label: 'Address' },
  { key: 'description', label: 'Description', multiline: true },
];

export default function OwnerProfileScreen({ navigation }: Props) {
  const { data: restaurant, isLoading } = useMyRestaurant();
  const create = useCreateRestaurant();
  const update = useUpdateRestaurant();
  const isEdit = !!restaurant;

  const [form, setForm] = useState<FormState>({
    name: '', cuisine_type: '', price_range: '2',
    phone: '', address: '', description: '',
  });

  useEffect(() => {
    if (restaurant) {
      setForm({
        name: restaurant.name ?? '',
        cuisine_type: restaurant.cuisine_type ?? '',
        price_range: String(restaurant.price_range ?? 2),
        phone: restaurant.phone ?? '',
        address: restaurant.address ?? '',
        description: restaurant.description ?? '',
      });
    }
  }, [restaurant]);

  const handleSubmit = () => {
    const data = { ...form, price_range: Number(form.price_range) };
    if (isEdit) {
      update.mutate(data);
    } else {
      create.mutate(data);
    }
  };

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#f97316" />
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-white">
      <View className="px-6 pt-12 pb-4 border-b border-gray-100">
        <Text className="text-2xl font-bold text-gray-900">
          {isEdit ? 'Edit Profile' : 'Create Profile'}
        </Text>
      </View>

      <View className="p-6">
        {FIELDS.map(({ key, label, numeric, multiline }) => (
          <View key={key} className="mb-4">
            <Text className="text-gray-600 mb-1 font-medium">{label}</Text>
            <TextInput
              className="border border-gray-300 rounded-lg px-4 py-3 text-base"
              value={form[key]}
              onChangeText={(v) => setForm((f) => ({ ...f, [key]: v }))}
              keyboardType={numeric ? 'numeric' : 'default'}
              multiline={multiline}
              numberOfLines={multiline ? 4 : 1}
            />
          </View>
        ))}

        <TouchableOpacity
          className="bg-orange-500 rounded-lg py-4 mt-4"
          onPress={handleSubmit}
          disabled={create.isPending || update.isPending}
        >
          {create.isPending || update.isPending
            ? <ActivityIndicator color="white" />
            : <Text className="text-white text-center font-semibold text-base">
                {isEdit ? 'Save Changes' : 'Create Profile'}
              </Text>
          }
        </TouchableOpacity>

        <TouchableOpacity
          className="mt-4 py-3"
          onPress={() => navigation.push('OwnerReservations')}
        >
          <Text className="text-orange-500 text-center">View Reservation Requests</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
