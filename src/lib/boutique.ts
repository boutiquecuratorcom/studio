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
  writeBatch,
  deleteDoc,
  updateDoc,
  orderBy,
} from 'firebase/firestore';
import { useDoc, useFirestore, useCollection } from '@/firebase';
import { useMemo } from 'react';
import type { User } from 'firebase/auth';
import { z } from 'zod';
import type { BrandProfile } from '@/ai/flows/schemas';
import { useOutfits, type Outfit, type OutfitClaim } from './outfits';

// ---- Helpers ----
type AnyRecord = Record<string, any>;
const asRecord = (v: unknown): AnyRecord => (v && typeof v === 'object' ? (v as AnyRecord) : {});

// If your generated BrandProfile type doesn't include these fields,
// we safely widen it locally without changing your schema file.
type BrandProfilePublicBits = Partial<BrandProfile> & {
  brandName?: string | null;
  tagline?: string | null;
  logoUrl?: string | null;
  brandColors?: string[] | null;
};

// --- Interfaces ---
export interface BoutiqueSettings extends DocumentData {
  id: string;
  enabled: boolean;
  featuredOutfitId: string | null;
  accentColor: string | null;
  stylePreset: 'magazine' | 'modern' | 'classic';
  handle: string | null;
  updatedAt?: any;
}

export interface HandleMapping {
  id: string; // The handle (doc id)
  uid: string;
  handle: string;
  createdAt: any;
  updatedAt: any;
}

export interface PublicBoutiqueProfile {
  id: string; // The handle (doc id)
  uid: string;
  handle: string;
  enabled: boolean;
  brandName: string | null;
  tagline: string | null;
  logoUrl: string | null;
  accentColor: string | null;
  featuredOutfit: {
    id: string;
    title: string | null;
    imageUrl: string | null;
    description: string | null;
    itemCount: number | null;
    outfitClaim: OutfitClaim | null;
  } | null;
  updatedAt: any;
}

// --- Validation ---
const RESERVED_HANDLES = new Set([
  'admin',
  'dashboard',
  'login',
  'signup',
  'support',
  'terms',
  'privacy',
  'api',
  '_next',
  'firebase',
  'public',
  'boutique-curator',
  'settings',
  'inventory',
  'outfits',
  'editor',
  'post-creator',
  'engagement-machine',
  'my-brand',
  'my-boutique',
  'uploads',
  'profile',
  'looks',
  'boutique',
]);

export const handleSchema = z.object({
  handle: z
    .string()
    .transform((val) =>
      val
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '')
        .replace(/-+/g, '-')
    )
    .refine((s) => s.length >= 3, 'Handle must be at least 3 characters long.')
    .refine((s) => s.length <= 30, 'Handle cannot be more than 30 characters.')
    .refine((s) => /^[a-z]/.test(s), 'Must start with a letter.')
    .refine((s) => !s.endsWith('-'), 'Cannot end with a hyphen.')
    .refine((s) => !s.includes('--'), 'Cannot contain consecutive hyphens.')
    .refine((s) => !RESERVED_HANDLES.has(s), 'This handle is reserved. Please choose another.'),
});

// --- Hooks ---
export const useBoutiqueSettings = (userId: string | null) => {
  const firestore = useFirestore();
  const docRef = useMemo(() => {
    if (!userId || !firestore) return null;
    return doc(firestore, `users/${userId}/boutiqueSettings/main`);
  }, [userId, firestore]);

  return useDoc<BoutiqueSettings>(docRef as any);
};

export const useUserHandle = (userId: string | null) => {
  const firestore = useFirestore();
  const q = useMemo(() => {
    if (!userId || !firestore) return null;
    return query(collection(firestore, 'handles'), where('uid', '==', userId), limit(1));
  }, [userId, firestore]);

  const { data, ...rest } = useCollection<HandleMapping>(q as any, 'handles');
  return { handle: data?.[0], ...rest };
};

export const usePublicBoutiqueByHandle = (handle: string | null) => {
  const firestore = useFirestore();
  const docRef = useMemo(() => {
    if (!handle || !firestore) return null;
    return doc(firestore, 'publicBoutiques', handle);
  }, [handle, firestore]);

  return useDoc<PublicBoutiqueProfile>(docRef as any);
};

// --- Data Functions ---
export const claimHandleTransaction = async (firestore: Firestore, user: User, handle: string) => {
  handleSchema.parse({ handle });

  const userHandleQuery = query(collection(firestore, 'handles'), where('uid', '==', user.uid), limit(1));
  const newHandleRef = doc(firestore, 'handles', handle);
  const publicBoutiqueRef = doc(firestore, 'publicBoutiques', handle);
  const settingsRef = doc(firestore, `users/${user.uid}/boutiqueSettings/main`);
  const userProfileRef = doc(firestore, `users/${user.uid}`);

  await runTransaction(firestore, async (transaction) => {
    const [userHandleSnap, newHandleSnap] = await Promise.all([
        getDocs(userHandleQuery),
        transaction.get(newHandleRef)
    ]);
    
    if (!userHandleSnap.empty) {
      throw new Error(`You have already claimed the handle "${userHandleSnap.docs[0].id}".`);
    }
    if (newHandleSnap.exists()) {
      throw new Error('This handle is already taken. Please choose another.');
    }

    const now = serverTimestamp();

    transaction.set(newHandleRef, {
      uid: user.uid,
      handle,
      createdAt: now,
      updatedAt: now,
    });

    transaction.set(publicBoutiqueRef, {
      uid: user.uid,
      handle,
      enabled: false,
      updatedAt: now,
    });
  });

  await setDoc(settingsRef, { handle }, { merge: true });
  await setDoc(userProfileRef, { handle }, { merge: true });
};

export const updateHandleTransaction = async (
  firestore: Firestore,
  user: User,
  oldHandle: string,
  newHandle: string
) => {
  handleSchema.parse({ handle: newHandle });

  const oldHandleRef = doc(firestore, 'handles', oldHandle);
  const newHandleRef = doc(firestore, 'handles', newHandle);
  const userProfileRef = doc(firestore, 'users', user.uid);
  const settingsRef = doc(firestore, `users/${user.uid}/boutiqueSettings/main`);
  const oldPublicBoutiqueRef = doc(firestore, 'publicBoutiques', oldHandle);

  await runTransaction(firestore, async (transaction) => {
    const [oldHandleSnap, newHandleSnap] = await Promise.all([
        transaction.get(oldHandleRef),
        transaction.get(newHandleRef)
    ]);

    const oldHandleData = asRecord(oldHandleSnap.data());

    if (!oldHandleSnap.exists() || oldHandleData.uid !== user.uid) {
      throw new Error('You do not own the handle you are trying to update.');
    }

    if (newHandleSnap.exists()) {
      throw new Error('This handle is already taken. Please choose another.');
    }

    const now = serverTimestamp();

    // Create new handle doc
    transaction.set(newHandleRef, {
      uid: user.uid,
      handle: newHandle,
      createdAt: oldHandleData.createdAt || now,
      updatedAt: now,
    });
    
    // Delete old handle doc
    transaction.delete(oldHandleRef);

    // Migrate public boutique doc
    const oldPublicDataSnap = await transaction.get(oldPublicBoutiqueRef);
    if (oldPublicDataSnap.exists()) {
      const newPublicBoutiqueRef = doc(firestore, 'publicBoutiques', newHandle);
      const publicDataToMigrate = {
          ...asRecord(oldPublicDataSnap.data()),
          uid: user.uid, // Ensure UID is correct
          handle: newHandle,
          updatedAt: now,
      };
      
      transaction.set(newPublicBoutiqueRef, publicDataToMigrate);
      transaction.delete(oldPublicBoutiqueRef);
    }
  });

  await setDoc(settingsRef, { handle: newHandle }, { merge: true });
  await setDoc(userProfileRef, { handle: newHandle }, { merge: true });
};

export const updateBoutiqueSettings = async (
  firestore: Firestore,
  userId: string,
  data: Partial<Omit<BoutiqueSettings, 'id'>>
) => {
  const settingsRef = doc(firestore, `users/${userId}/boutiqueSettings/main`);
  await setDoc(settingsRef, { ...data, updatedAt: serverTimestamp() }, { merge: true });
};

export const syncPublicBoutiqueData = async (
  firestore: Firestore,
  userId: string,
  handle: string | null | undefined
) => {
  if (!handle || typeof handle !== 'string') {
    throw new Error('Sync failed: A valid handle is required.');
  }

  const settingsRef = doc(firestore, `users/${userId}/boutiqueSettings/main`);
  const brandRef = doc(firestore, `users/${userId}/brandProfile/main`);

  const outfitsQuery = query(
    collection(firestore, 'outfits'),
    where('ownerId', '==', userId),
    orderBy('createdAt', 'desc')
  );

  const [settingsSnap, brandSnap, outfitsSnap] = await Promise.all([
    getDoc(settingsRef),
    getDoc(brandRef),
    getDocs(outfitsQuery),
  ]);

  const settings = (settingsSnap.data() ?? {}) as Partial<BoutiqueSettings>;
  const brandProfile = (brandSnap.data() ?? {}) as BrandProfilePublicBits;

  let featuredOutfit: Outfit | null = null;
  const outfitDocs = outfitsSnap.docs;

  const pickOutfitFromDoc = (d: any): Outfit => ({ id: d.id, ...asRecord(d.data()) } as Outfit);

  if (settings.featuredOutfitId && settings.featuredOutfitId !== 'auto') {
    const outfitDoc = outfitDocs.find((d) => d.id === settings.featuredOutfitId);
    if (outfitDoc) featuredOutfit = pickOutfitFromDoc(outfitDoc);
  } 
  if (!featuredOutfit) {
    const firstPublished = outfitDocs.find((d) => asRecord(d.data()).status === 'published');
    if (firstPublished) featuredOutfit = pickOutfitFromDoc(firstPublished);
    else if (outfitDocs.length > 0) featuredOutfit = pickOutfitFromDoc(outfitDocs[0]);
  }

  const brandColors = Array.isArray(brandProfile.brandColors) ? brandProfile.brandColors : [];
  const accentColor = settings.accentColor || (brandColors.length > 0 ? brandColors[0] : null);

  const publicData: Omit<PublicBoutiqueProfile, 'id' | 'updatedAt'> = {
    uid: userId,
    handle,
    enabled: settings.enabled ?? false,
    brandName: brandProfile.brandName ?? null,
    tagline: brandProfile.tagline ?? null,
    logoUrl: brandProfile.logoUrl ?? null,
    accentColor,
    featuredOutfit: featuredOutfit
      ? {
          id: featuredOutfit.id,
          title: featuredOutfit.title ?? null,
          imageUrl: featuredOutfit.cover?.imageUrl ?? null,
          description: featuredOutfit.storefrontDescription ?? null,
          itemCount: Array.isArray(featuredOutfit.linkedRackItemIds) ? featuredOutfit.linkedRackItemIds.length : 0,
          outfitClaim: featuredOutfit.outfitClaim ?? null,
        }
      : null,
  };

  const publicBoutiqueRef = doc(firestore, 'publicBoutiques', handle);
  await setDoc(publicBoutiqueRef, { ...publicData, updatedAt: serverTimestamp() }, { merge: true });
};
