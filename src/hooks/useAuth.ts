import { useEffect, useState } from 'react';
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';

export function useAuth() {
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);

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