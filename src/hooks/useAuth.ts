import { useEffect, useState } from 'react';
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';

export function useAuth() {
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const unsubscribeFromAuthStateChanged = auth().onAuthStateChanged(
      (user) => {
        setUser(user);
        setLoading(false);
      }
    );

    return unsubscribeFromAuthStateChanged;
  }, []);

  return {
    user,
    loading, 
  };
}