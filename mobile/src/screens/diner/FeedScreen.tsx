import { View, Text, TouchableOpacity } from 'react-native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RootStackParamList } from '../../../App';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { RestaurantCard } from '../../components/swipe/RestaurantCard';
import { useSwipeFeed, useSwipe } from '../../hooks/useRestaurants';

type Props = {
  navigation: StackNavigationProp<RootStackParamList, 'Feed'>;
};

const LAT = 10.77;
const LNG = 106.69;

export default function FeedScreen({ navigation }: Props) {
  const { data, fetchNextPage } = useSwipeFeed(LAT, LNG);
  const swipe = useSwipe();
  const translateX = useSharedValue(0);
  const rotate = useSharedValue(0);

  const restaurants = data?.pages.flat() ?? [];
  const current = restaurants[0];

  const handleSwipe = (direction: 'left' | 'right') => {
    if (!current) return;
    swipe.mutate({ restaurant_id: current.id, direction });
    if (direction === 'right') {
      navigation.push('RestaurantDetail', { id: current.id });
    }
    translateX.value = 0;
    rotate.value = 0;
    if (restaurants.length <= 3) fetchNextPage();
  };

  const gesture = Gesture.Pan()
    .onUpdate((e) => {
      translateX.value = e.translationX;
      rotate.value = e.translationX / 20;
    })
    .onEnd((e) => {
      if (Math.abs(e.translationX) > 120) {
        runOnJS(handleSwipe)(e.translationX > 0 ? 'right' : 'left');
      } else {
        translateX.value = withSpring(0);
        rotate.value = withSpring(0);
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { rotate: `${rotate.value}deg` },
    ],
  }));

  if (!current) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50 px-6">
        <Text className="text-2xl mb-2">🍽️</Text>
        <Text className="text-gray-500 text-center">No more restaurants nearby. Check back later!</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 items-center justify-center bg-gray-50 px-4">
      <Text className="text-2xl font-bold text-orange-500 mb-6">Food Tinder</Text>

      <GestureDetector gesture={gesture}>
        <Animated.View style={[animatedStyle, { width: '100%' }]}>
          <RestaurantCard restaurant={current} />
        </Animated.View>
      </GestureDetector>

      <View className="flex-row mt-8" style={{ gap: 24 }}>
        <TouchableOpacity
          className="bg-red-100 rounded-full p-4"
          onPress={() => handleSwipe('left')}
        >
          <Text className="text-2xl">✕</Text>
        </TouchableOpacity>
        <TouchableOpacity
          className="bg-green-100 rounded-full p-4"
          onPress={() => handleSwipe('right')}
        >
          <Text className="text-2xl">♥</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        className="mt-4"
        onPress={() => navigation.push('MyReservations')}
      >
        <Text className="text-orange-500">My Reservations</Text>
      </TouchableOpacity>
    </View>
  );
}
