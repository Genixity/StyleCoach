import { StackScreenProps } from '@react-navigation/stack';

export interface SelectedImage {
  uri: string;
  aspectRatio: number;
}

export interface Message {
  _id: string;
  text: string;
  createdAt: number;
  user: {
    _id: number;
    name: string;
  };
  images?: SelectedImage[];
}

export interface ChatItem {
  id: string;
  title: string;
  messages: Message[];
}

export interface ChatSection {
  title: string;
  data: ChatItem[];
}

export type RootStackParamList = {
  Welcome: undefined;
  'Sign In': undefined;
  'Sign Up': undefined;
  'Reset Password': { email?: string };
  Chatbot: undefined;
};

export type SignInProps = StackScreenProps<RootStackParamList, 'Sign In'>;
export type SignUpProps = StackScreenProps<RootStackParamList, 'Sign Up'>;
export type WelcomeProps = StackScreenProps<RootStackParamList, 'Welcome'>;
export type ResetPasswordProps = StackScreenProps<RootStackParamList, 'Reset Password'>;