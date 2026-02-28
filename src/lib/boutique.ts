'use client';
import {
  doc,
  setDoc,
  serverTimestamp,
  type DocumentData,
  type Firestore,
} from 'firebase/firestore';
import { useDoc, useFirestore } from '@/firebase';
import { useMemo } from 'react';
import type { User } from 'firebase/auth';

export interface BoutiqueSettings extends DocumentData {
  id: string;
  enabled: boolean;
  featuredOutfitId: string | null;
  accentColor: string | null;
  stylePreset: 'magazine' | 'modern' | 'classic';
  updatedAt?: any;
}

// Hook to get boutique settings for a user
export const useBoutiqueSettings = (userId: string | null) => {
  const firestore = useFirestore();
  const docRef = useMemo(() => {
    if (!userId || !firestore) return null;
    return doc(firestore, `users/${userId}/boutiqueSettings/main`) as any;
  }, [userId, firestore]);
  
  return useDoc<BoutiqueSettings>(docRef);
};

// Function to update boutique settings
export const updateBoutiqueSettings = async (
  firestore: Firestore,
  userId: string,
  data: Partial<Omit<BoutiqueSettings, 'id'>>
) => {
  const settingsRef = doc(firestore, `users/${userId}/boutiqueSettings/main`);
  await setDoc(settingsRef, {
    ...data,
    updatedAt: serverTimestamp(),
  }, { merge: true });
};
