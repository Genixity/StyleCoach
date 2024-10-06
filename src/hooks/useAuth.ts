import React, { useEffect } from 'react';
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';

export function useAuth() {
  const [user, setUser] = React.useState<FirebaseAuthTypes.User | null>(null);

  useEffect(() => {
    const unsubscribeFromAuthStateChanged = auth().onAuthStateChanged(
      (user) => {
        setUser(user);
      }
    );

    return unsubscribeFromAuthStateChanged;
  }, []);

  return {
    user,
  };
}