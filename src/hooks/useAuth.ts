import { useEffect, useState } from 'react';
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import Purchases from 'react-native-purchases';

export function useAuth() {
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const unsubscribeFromAuthStateChanged = auth().onAuthStateChanged(
      async (user) => {
        setUser(user);
        setLoading(false);
        if (user) {
          await Purchases.logIn(user.uid);
        }
      }
    );

    return () => {
      unsubscribeFromAuthStateChanged();
    };
  }, []);

  return {
    user,
    loading,
  };
}