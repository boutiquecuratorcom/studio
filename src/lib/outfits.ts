'use client';
import {
  collection,
  query,
  where,
  orderBy,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  arrayUnion,
  type DocumentData,
  type Firestore,
} from 'firebase/firestore';
import type { User } from 'firebase/auth';
import { useCollection, useDoc, useFirestore } from '@/firebase';
import { useMemo } from 'react';

// Interface for Outfit Document
export interface Outfit extends DocumentData {
  id: string;
  ownerId: string;
  title: string;
  notes: string;
  linkedRackItemIds: string[];
  cover: {
    imageUrl: string | null;
    thumbUrl: string | null;
    glowUpId: string | null;
  };
  source: {
    type: "rack" | "upload" | "mixed";
    inputUploadIds: string[];
  };
  status: "draft" | "published";
  createdAt: any;
  updatedAt: any;
}

// Hook to get a list of outfits for a user
export const useOutfits = (userId: string | null) => {
  const firestore = useFirestore();
  const q = useMemo(() => {
    if (!userId || !firestore) return null;
    // We only filter by ownerId to avoid needing a composite index. Sorting is handled on the client.
    return query(
      collection(firestore, 'outfits'),
      where('ownerId', '==', userId)
    );
  }, [userId, firestore]);
  
  const { data, loading, error } = useCollection<Outfit>(q, 'outfits');
  
  // Sort the outfits on the client-side after fetching
  const sortedOutfits = useMemo(() => {
    if (!data) return null;
    return [...data].sort((a, b) => {
        const timeA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
        const timeB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
        return timeB - timeA; // Newest first
    });
  }, [data]);

  return { outfits: sortedOutfits, loading, error };
};

// Hook to get a single outfit document
export const useOutfit = (outfitId: string | null) => {
  const firestore = useFirestore();
  const docRef = useMemo(() => {
    if (!outfitId || !firestore) return null;
    const decodedOutfitId = decodeURIComponent(outfitId);
    return doc(firestore, 'outfits', decodedOutfitId) as any;
  }, [outfitId, firestore]);
  
  return useDoc<Outfit>(docRef);
};

// Function to create a new outfit
export const createOutfit = async (
  firestore: Firestore,
  user: User,
  data: { title: string, notes: string }
): Promise<string> => {
  const newOutfitRef = doc(collection(firestore, 'outfits'));
  const outfitData: Omit<Outfit, 'id'> = {
    ownerId: user.uid,
    title: data.title,
    notes: data.notes,
    linkedRackItemIds: [],
    cover: {
      imageUrl: null,
      thumbUrl: null,
      glowUpId: null,
    },
    source: {
        type: 'mixed',
        inputUploadIds: [],
    },
    status: 'draft',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  await setDoc(newOutfitRef, outfitData);
  return newOutfitRef.id;
};

// Function to update an existing outfit
export const updateOutfit = async (
  firestore: Firestore,
  outfitId: string,
  data: Partial<{ title: string; notes: string; status: "draft" | "published" }>
) => {
  const outfitRef = doc(firestore, 'outfits', outfitId);
  await updateDoc(outfitRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
};

// Function to link a rack item to an outfit
export const linkRackItemToOutfit = async (
    firestore: Firestore,
    outfitId: string,
    itemId: string
) => {
    const outfitRef = doc(firestore, 'outfits', outfitId);
    await updateDoc(outfitRef, {
        linkedRackItemIds: arrayUnion(itemId),
        updatedAt: serverTimestamp(),
    });
};

// Function to delete an outfit
export const deleteOutfit = async (
  firestore: Firestore,
  outfitId: string
) => {
  await deleteDoc(doc(firestore, 'outfits', outfitId));
};
