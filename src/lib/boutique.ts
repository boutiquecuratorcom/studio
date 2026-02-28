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
} from 'firebase/firestore';
import { useDoc, useFirestore, useCollection } from '@/firebase';
import { useMemo } from 'react';
import type { User } from 'firebase/auth';
import { z } from 'zod';
import type { BrandProfile } from './schemas';
import { useOutfits, type Outfit, type OutfitClaim } from './outfits';

// --- Interfaces ---

export interface BoutiqueSettings extends DocumentData {
  id: string;
  enabled: boolean;
  featuredOutfitId: string | null;
  accentColor: string | null;
  stylePreset: 'magazine' | 'modern' | 'classic';
  updatedAt?: any;
}

export interface HandleMapping {
  id: string; // The handle
  uid: string;
  handle: string;
  createdAt: any;
  updatedAt: any;
}

export interface PublicBoutiqueProfile {
  id: string; // The handle
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
  'admin', 'dashboard', 'login', 'signup', 'support', 'terms', 'privacy',
  'api', '_next', 'firebase', 'public', 'boutique-curator', 'settings',
  'inventory', 'outfits', 'editor', 'post-creator', 'engagement-machine',
  'my-brand', 'my-boutique', 'uploads', 'profile', 'looks', 'boutique'
]);

export const handleSchema = z.object({
  handle: z.string()
    .min(3, 'Handle must be at least 3 characters long.')
    .max(30, 'Handle cannot be more than 30 characters.')
    .regex(/^[a-z][a-z0-9-]*$/, 'Must start with a letter and contain only lowercase letters, numbers, and hyphens.')
    .refine(s => !s.endsWith('-'), 'Cannot end with a hyphen.')
    .refine(s => !s.includes('--'), 'Cannot contain consecutive hyphens.')
    .refine(s => !RESERVED_HANDLES.has(s), 'This handle is reserved. Please choose another.'),
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
  const { data, ...rest } = useCollection<HandleMapping>(q, 'handles');
  return { handle: data?.[0], ...rest };
};

export const usePublicBoutiqueByHandle = (handle: string | null) => {
    const firestore = useFirestore();
    const docRef = useMemo(() => {
        if (!handle || !firestore) return null;
        return doc(firestore, 'publicBoutiques', handle);
    }, [handle, firestore]);
    return useDoc<PublicBoutiqueProfile>(docRef as any);
}

// --- Data Functions ---

export const claimHandleTransaction = async (firestore: Firestore, user: User, handle: string) => {
  handleSchema.parse({ handle });
  
  const userHandleQuery = query(collection(firestore, 'handles'), where('uid', '==', user.uid), limit(1));
  const newHandleRef = doc(firestore, 'handles', handle);
  const userProfileRef = doc(firestore, 'users', user.uid);
  
  await runTransaction(firestore, async (transaction) => {
    const userHandleSnap = await getDocs(userHandleQuery);
    if (!userHandleSnap.empty) {
      throw new Error("You have already claimed a handle. Please update it instead.");
    }
    
    const newHandleSnap = await transaction.get(newHandleRef);
    if (newHandleSnap.exists()) {
      throw new Error("This handle is already taken. Please choose another.");
    }

    const now = serverTimestamp();
    transaction.set(newHandleRef, { uid: user.uid, handle, createdAt: now, updatedAt: now });
    transaction.update(userProfileRef, { handle });
  });
};

export const updateHandleTransaction = async (firestore: Firestore, user: User, oldHandle: string, newHandle: string) => {
    handleSchema.parse({ handle: newHandle });

    const oldHandleRef = doc(firestore, 'handles', oldHandle);
    const newHandleRef = doc(firestore, 'handles', newHandle);
    const userProfileRef = doc(firestore, 'users', user.uid);
    
    const oldPublicBoutiqueRef = doc(firestore, 'publicBoutiques', oldHandle);

    await runTransaction(firestore, async (transaction) => {
        const oldHandleSnap = await transaction.get(oldHandleRef);
        if (!oldHandleSnap.exists() || oldHandleSnap.data()?.uid !== user.uid) {
            throw new Error("You do not own the handle you are trying to update.");
        }
        
        const newHandleSnap = await transaction.get(newHandleRef);
        if (newHandleSnap.exists()) {
            throw new Error("This handle is already taken. Please choose another.");
        }

        const now = serverTimestamp();
        transaction.set(newHandleRef, { uid: user.uid, handle: newHandle, createdAt: now, updatedAt: now });
        transaction.delete(oldHandleRef);
        transaction.update(userProfileRef, { handle: newHandle });
        
        const oldPublicData = await transaction.get(oldPublicBoutiqueRef);
        if (oldPublicData.exists()) {
            const newPublicBoutiqueRef = doc(firestore, 'publicBoutiques', newHandle);
            transaction.set(newPublicBoutiqueRef, { ...oldPublicData.data(), handle: newHandle, updatedAt: now });
            transaction.delete(oldPublicBoutiqueRef);
        }
    });
};

export const updateBoutiqueSettings = async (
  firestore: Firestore,
  userId: string,
  data: Partial<Omit<BoutiqueSettings, 'id'>>
) => {
  const settingsRef = doc(firestore, `users/${userId}/boutiqueSettings/main`);
  await setDoc(settingsRef, { ...data, updatedAt: serverTimestamp() }, { merge: true });
};

export const syncPublicBoutiqueData = async (firestore: Firestore, userId: string, handle: string) => {
    const settingsRef = doc(firestore, `users/${userId}/boutiqueSettings/main`);
    const brandRef = doc(firestore, `users/${userId}/brandProfile/main`);
    const outfitsQuery = query(collection(firestore, 'outfits'), where('ownerId', '==', userId), orderBy('createdAt', 'desc'));

    const [settingsSnap, brandSnap, outfitsSnap] = await Promise.all([
        getDoc(settingsRef),
        getDoc(brandRef),
        getDocs(outfitsQuery),
    ]);

    const settings = settingsSnap.data() as BoutiqueSettings;
    const brandProfile = brandSnap.data() as BrandProfile;

    let featuredOutfit: Outfit | null = null;
    if (settings?.featuredOutfitId && settings.featuredOutfitId !== 'auto') {
        const outfitDoc = outfitsSnap.docs.find(d => d.id === settings.featuredOutfitId);
        if (outfitDoc) {
            featuredOutfit = { id: outfitDoc.id, ...outfitDoc.data() } as Outfit;
        }
    } else {
        const firstPublished = outfitsSnap.docs.find(d => d.data().status === 'published');
        if (firstPublished) {
            featuredOutfit = { id: firstPublished.id, ...firstPublished.data() } as Outfit;
        } else if (outfitsSnap.docs.length > 0) {
            const firstDoc = outfitsSnap.docs[0];
            featuredOutfit = { id: firstDoc.id, ...firstDoc.data() } as Outfit;
        }
    }

    const publicData: Omit<PublicBoutiqueProfile, 'id'> = {
        uid: userId,
        handle,
        enabled: settings?.enabled ?? false,
        brandName: brandProfile?.brandName || null,
        tagline: brandProfile?.tagline || null,
        logoUrl: brandProfile?.logoUrl || null,
        accentColor: settings?.accentColor || brandProfile?.brandColors?.[0] || null,
        featuredOutfit: featuredOutfit ? {
            id: featuredOutfit.id,
            title: featuredOutfit.title,
            imageUrl: featuredOutfit.cover?.imageUrl || null,
            description: featuredOutfit.storefrontDescription || null,
            itemCount: featuredOutfit.linkedRackItemIds?.length || 0,
            outfitClaim: featuredOutfit.outfitClaim || null,
        } : null,
        updatedAt: serverTimestamp(),
    };
    
    const publicBoutiqueRef = doc(firestore, 'publicBoutiques', handle);
    await setDoc(publicBoutiqueRef, publicData, { merge: true });
};
