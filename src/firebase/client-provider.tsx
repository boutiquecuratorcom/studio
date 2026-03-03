// src/firebase/client-provider.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { initializeFirebase } from './init'; // ✅ FIXED: no more circular import
import { FirebaseProvider, type FirebaseContextType } from './provider';

export function FirebaseClientProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [firebase, setFirebase] = useState<FirebaseContextType | null>(null);

  useEffect(() => {
    const app = initializeFirebase();
    setFirebase(app);
  }, []);

  if (!firebase) {
    return null; // You can replace with a loading spinner if desired
  }

  return <FirebaseProvider value={firebase}>{children}</FirebaseProvider>;
}
