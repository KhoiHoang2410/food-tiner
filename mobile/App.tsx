import './global.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';

import LoginScreen from './src/screens/auth/LoginScreen';
import RegisterScreen from './src/screens/auth/RegisterScreen';
import FeedScreen from './src/screens/diner/FeedScreen';
import RestaurantDetailScreen from './src/screens/diner/RestaurantDetailScreen';
import MyReservationsScreen from './src/screens/diner/MyReservationsScreen';
import OwnerProfileScreen from './src/screens/owner/OwnerProfileScreen';
import OwnerReservationsScreen from './src/screens/owner/OwnerReservationsScreen';

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Feed: undefined;
  RestaurantDetail: { id: number };
  MyReservations: undefined;
  OwnerProfile: undefined;
  OwnerReservations: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();
const queryClient = new QueryClient();

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <NavigationContainer>
          <Stack.Navigator initialRouteName="Login" screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
            <Stack.Screen name="Feed" component={FeedScreen} />
            <Stack.Screen name="RestaurantDetail" component={RestaurantDetailScreen} />
            <Stack.Screen name="MyReservations" component={MyReservationsScreen} />
            <Stack.Screen name="OwnerProfile" component={OwnerProfileScreen} />
            <Stack.Screen name="OwnerReservations" component={OwnerReservationsScreen} />
          </Stack.Navigator>
        </NavigationContainer>
        <StatusBar style="auto" />
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
