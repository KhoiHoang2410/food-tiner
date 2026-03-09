import type { StackNavigationProp } from '@react-navigation/stack';
import type { RootStackParamList } from '../../../App';
import { AuthForm } from '../../components/auth/AuthForm';
import { useRegister } from '../../hooks/useAuth';

type Props = {
  navigation: StackNavigationProp<RootStackParamList, 'Register'>;
};

export default function RegisterScreen({ navigation }: Props) {
  const register = useRegister();

  return (
    <AuthForm
      mode="register"
      isLoading={register.isPending}
      onSubmit={(data) => {
        register.mutate(
          { email: data.email, password: data.password, role: data.role ?? 'diner' },
          {
            onSuccess: (res) => {
              if (res.user.role === 'restaurant_owner') {
                navigation.replace('OwnerProfile');
              } else {
                navigation.replace('Feed');
              }
            },
          }
        );
      }}
    />
  );
}
