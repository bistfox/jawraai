'use client';

import type { User } from '@/types';
import { createContext, useState, type ReactNode, useEffect, useCallback } from 'react';
import { useAuth, useFirestore } from '@/firebase';
import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

interface UserContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  setUser: (user: User | null) => void;
  isLoading: boolean;
  refetchUser: () => Promise<void>;
}

export const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const auth = useAuth();
  const firestore = useFirestore();

  const fetchUserProfile = useCallback(async (firebaseUser: FirebaseUser | null) => {
    if (firebaseUser) {
        setFirebaseUser(firebaseUser);
        const userDocRef = doc(firestore, 'users', firebaseUser.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
            const userProfile = userDoc.data();
            setUser({
                uid: firebaseUser.uid,
                email: firebaseUser.email,
                ...userProfile,
            } as User);
        } else {
            // User is authenticated but hasn't completed onboarding
            setUser({
                uid: firebaseUser.uid,
                email: firebaseUser.email,
            } as User);
        }
    } else {
        setFirebaseUser(null);
        setUser(null);
    }
    setIsLoading(false);
  }, [firestore]);


  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, fetchUserProfile);
    return () => unsubscribe();
  }, [auth, fetchUserProfile]);

  const refetchUser = async () => {
    setIsLoading(true);
    await fetchUserProfile(auth.currentUser);
  }

  const contextValue = { 
      user, 
      firebaseUser,
      setUser, 
      isLoading,
      refetchUser
  };

  return (
    <UserContext.Provider value={contextValue}>
      {children}
    </UserContext.Provider>
  );
}
