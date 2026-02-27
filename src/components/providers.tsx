'use client';

import { UserProvider } from '@/contexts/user-context';
import { FirebaseClientProvider } from '@/firebase';
import type { ReactNode } from 'react';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <FirebaseClientProvider>
      <UserProvider>{children}</UserProvider>
    </FirebaseClientProvider>
  );
}
