'use client';
import React, { useState, useEffect } from 'react';
import { initializeFirebase } from '.';
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
    return null; // Or a loading spinner
  }

  return <FirebaseProvider value={firebase}>{children}</FirebaseProvider>;
}
