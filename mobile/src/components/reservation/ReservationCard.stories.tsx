import type { Meta, StoryObj } from '@storybook/react-native';
import { ReservationCard } from './ReservationCard';

const meta: Meta<typeof ReservationCard> = {
  title: 'Reservation/ReservationCard',
  component: ReservationCard,
};
export default meta;

export const Pending: StoryObj<typeof ReservationCard> = {
  args: {
    reservation: {
      id: 1,
      restaurant_id: 1,
      party_size: 3,
      requested_at: '2026-03-10T19:00:00',
      note: 'Window seat',
      status: 'pending',
    },
    onConfirm: () => {},
    onReject: () => {},
  },
};
