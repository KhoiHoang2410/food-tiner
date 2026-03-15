import type { Meta, StoryObj } from '@storybook/react-native';
import { AuthForm } from './AuthForm';

const meta: Meta<typeof AuthForm> = {
  title: 'Auth/AuthForm',
  component: AuthForm,
};
export default meta;

export const Login: StoryObj<typeof AuthForm> = {
  args: { mode: 'login', onSubmit: () => {}, isLoading: false },
};

export const Register: StoryObj<typeof AuthForm> = {
  args: { mode: 'register', onSubmit: () => {}, isLoading: false },
};
