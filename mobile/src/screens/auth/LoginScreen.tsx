import type { StackNavigationProp } from '@react-navigation/stack';
import type { RootStackParamList } from '../../../App';
import { AuthForm } from '../../components/auth/AuthForm';
import { useLogin } from '../../hooks/useAuth';

type Props = {
  navigation: StackNavigationProp<RootStackParamList, 'Login'>;
};

export default function LoginScreen({ navigation }: Props) {
  const login = useLogin();

  return (
    <AuthForm
      mode="login"
      isLoading={login.isPending}
      onSubmit={(data) => {
        login.mutate(
          { email: data.email, password: data.password },
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
