import type { Meta, StoryObj } from '@storybook/react-native';
import { RestaurantCard } from './RestaurantCard';

const meta: Meta<typeof RestaurantCard> = {
  title: 'Swipe/RestaurantCard',
  component: RestaurantCard,
};
export default meta;

export const Default: StoryObj<typeof RestaurantCard> = {
  args: {
    restaurant: {
      id: 1,
      name: 'Pho 24',
      cuisine_type: 'Vietnamese',
      price_range: 2,
      address: '123 Nguyen Hue, HCMC',
      description: 'Best pho in town',
      phone: '0901234567',
      latitude: 10.77,
      longitude: 106.69,
      opening_hours: {},
      is_active: true,
    },
  },
};
