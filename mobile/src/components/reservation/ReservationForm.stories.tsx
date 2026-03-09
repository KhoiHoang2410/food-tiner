import type { Meta, StoryObj } from '@storybook/react-native';
import { ReservationForm } from './ReservationForm';

const meta: Meta<typeof ReservationForm> = {
  title: 'Reservation/ReservationForm',
  component: ReservationForm,
};
export default meta;

export const Default: StoryObj<typeof ReservationForm> = {
  args: { restaurantId: 1, onSubmit: () => {}, isLoading: false },
};
