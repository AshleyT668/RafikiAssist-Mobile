// hooks/useAuth.js
import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebaseConfig';

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [emailVerified, setEmailVerified] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user);
        setEmailVerified(user.emailVerified);
      } else {
        setUser(null);
        setEmailVerified(false);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const refreshVerificationStatus = async () => {
    if (user) {
      await user.reload();
      setEmailVerified(user.emailVerified);
    }
  };

  return { 
    user, 
    emailVerified, 
    loading, 
    refreshVerificationStatus 
  };
};