import { StackScreenProps } from '@react-navigation/stack';

export type RootStackParamList = {
  Welcome: undefined;
  'Sign In': undefined;
  'Sign Up': undefined;
};

export type SignInProps = StackScreenProps<RootStackParamList, 'Sign In'>;
export type SignUpProps = StackScreenProps<RootStackParamList, 'Sign Up'>;
export type WelcomeProps = StackScreenProps<RootStackParamList, 'Welcome'>;
