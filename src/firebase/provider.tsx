'use client';
import { FirebaseApp } from 'firebase/app';
import { Auth } from 'firebase/auth';
import { Firestore } from 'firebase/firestore';
import React, { createContext, useContext } from 'react';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';

export type FirebaseContextType = {
  firebaseApp: FirebaseApp | null;
  auth: Auth | null;
  firestore: Firestore | null;
};

export const FirebaseContext = createContext<FirebaseContextType | null>(null);

export function FirebaseProvider({
  children,
  value,
}: {
  children: React.ReactNode;
  value: FirebaseContextType;
}) {
  return (
    <FirebaseContext.Provider value={value}>
      <FirebaseErrorListener />
      {children}
    </FirebaseContext.Provider>
  );
}

export const useFirebase = () => {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error('useFirebase must be used within a FirebaseProvider');
  }
  return context;
};

export const useFirebaseApp = () => useFirebase()?.firebaseApp;
export const useFirestore = () => useFirebase()?.firestore;
export const useAuth = () => useFirebase()?.auth;
