import { useState } from 'react';
import { View, TextInput, TouchableOpacity, Text, ActivityIndicator } from 'react-native';

interface AuthFormData {
  email: string;
  password: string;
  role?: string;
}

interface Props {
  mode: 'login' | 'register';
  onSubmit: (data: AuthFormData) => void;
  isLoading: boolean;
}

export function AuthForm({ mode, onSubmit, isLoading }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'diner' | 'restaurant_owner'>('diner');

  const handleSubmit = () => {
    onSubmit({ email, password, role: mode === 'register' ? role : undefined });
  };

  return (
    <View className="flex-1 justify-center px-6 bg-white">
      <Text className="text-3xl font-bold text-center text-orange-500 mb-8">
        {mode === 'login' ? 'Welcome Back' : 'Join Food Tinder'}
      </Text>

      <TextInput
        className="border border-gray-300 rounded-lg px-4 py-3 mb-4 text-base"
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />

      <TextInput
        className="border border-gray-300 rounded-lg px-4 py-3 mb-4 text-base"
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      {mode === 'register' && (
        <View className="flex-row mb-6 gap-3">
          {(['diner', 'restaurant_owner'] as const).map((r) => (
            <TouchableOpacity
              key={r}
              className={`flex-1 py-3 rounded-lg ${role === r ? 'bg-orange-500' : 'bg-gray-100'}`}
              onPress={() => setRole(r)}
            >
              <Text className={`text-center font-medium ${role === r ? 'text-white' : 'text-gray-700'}`}>
                {r === 'diner' ? 'Diner' : 'Restaurant'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <TouchableOpacity
        className="bg-orange-500 rounded-lg py-4"
        onPress={handleSubmit}
        disabled={isLoading}
      >
        {isLoading
          ? <ActivityIndicator color="white" />
          : <Text className="text-white text-center font-semibold text-base">
              {mode === 'login' ? 'Log In' : 'Create Account'}
            </Text>
        }
      </TouchableOpacity>
    </View>
  );
}
