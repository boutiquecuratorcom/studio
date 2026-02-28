'use client';
import {
  doc,
  setDoc,
  serverTimestamp,
  type DocumentData,
  type Firestore,
  runTransaction,
  getDoc,
  query,
  collection,
  where,
  limit,
  getDocs,
} from 'firebase/firestore';
import { useDoc, useFirestore, useCollection } from '@/firebase';
import { useMemo } from 'react';
import type { User } from 'firebase/auth';
import { z } from 'zod';

export interface BoutiqueSettings extends DocumentData {
  id: string;
  enabled: boolean;
  featuredOutfitId: string | null;
  accentColor: string | null;
  stylePreset: 'magazine' | 'modern' | 'classic';
  updatedAt?: any;
}

export interface PublicBoutique {
    id: string; // The handle
    ownerId: string;
    handle: string;
    displayName?: string;
    logoUrl?: string;
    createdAt: any;
    updatedAt: any;
}

export const handleSchema = z.string()
  .min(3, 'Handle must be at least 3 characters long.')
  .max(30, 'Handle cannot be more than 30 characters.')
  .regex(/^[a-z0-9-]+$/, 'Can only contain lowercase letters, numbers, and hyphens.')
  .refine(s => !s.startsWith('-') && !s.endsWith('-'), 'Cannot start or end with a hyphen.')
  .refine(s => !s.includes('--'), 'Cannot contain consecutive hyphens.');

// Hook to get boutique settings for a user
export const useBoutiqueSettings = (userId: string | null) => {
  const firestore = useFirestore();
  const docRef = useMemo(() => {
    if (!userId || !firestore) return null;
    return doc(firestore, `users/${userId}/boutiqueSettings/main`) as any;
  }, [userId, firestore]);
  
  return useDoc<BoutiqueSettings>(docRef);
};

// Hook to get a user's public boutique mapping
export const usePublicBoutique = (userId: string | null) => {
    const firestore = useFirestore();
    const q = useMemo(() => {
        if (!userId || !firestore) return null;
        return query(
            collection(firestore, 'publicBoutiques'),
            where('ownerId', '==', userId),
            limit(1)
        );
    }, [userId, firestore]);
    
    const { data, ...rest } = useCollection<PublicBoutique>(q, 'publicBoutiques');
    
    return { publicBoutique: data?.[0], ...rest };
}

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

// Function to claim a handle using a transaction
export const claimBoutiqueHandle = async (
    firestore: Firestore,
    user: User,
    handle: string,
    brandProfile: { brandName?: string; logoUrl?: string } | null
) => {
    handleSchema.parse(handle);

    const handleRef = doc(firestore, 'publicBoutiques', handle);

    await runTransaction(firestore, async (transaction) => {
        const handleDoc = await transaction.get(handleRef);
        if (handleDoc.exists()) {
            throw new Error('This handle is already taken. Please choose another.');
        }

        const userHandlesQuery = query(collection(firestore, 'publicBoutiques'), where('ownerId', '==', user.uid), limit(1));
        const userHandlesSnap = await getDocs(userHandlesQuery);
        if (!userHandlesSnap.empty) {
            throw new Error('You have already claimed a handle.');
        }

        const newHandleData = {
            ownerId: user.uid,
            handle: handle,
            displayName: brandProfile?.brandName || '',
            logoUrl: brandProfile?.logoUrl || '',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        };

        transaction.set(handleRef, newHandleData);
    });

    return handle;
};
