import React from 'react';
import { useAuth } from '../hooks/useAuth';
import UserStack from './userStack';
import AuthStack from './authStack';
import LoadingScreen from '../screens/Loading';

export default function RootNavigation() {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  return user ? <UserStack /> : <AuthStack />;
}