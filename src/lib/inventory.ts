import {
  collection,
  query,
  where,
  orderBy,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
  serverTimestamp,
  runTransaction,
  type DocumentData,
  type Firestore,
} from 'firebase/firestore';
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
  type FirebaseStorage,
} from 'firebase/storage';
import type { User } from 'firebase/auth';
import { useCollection, useDoc, useFirestore } from '@/firebase';
import { useMemo } from 'react';
import { resizeImage } from './image-utils';

export interface InventoryItem extends DocumentData {
  id: string;
  ownerId: string;
  brand: string;
  title: string;
  type: string;
  sizes: string[];
  notes?: string;
  image: {
    originalPath: string;
    originalUrl: string;
    thumbPath: string;
    thumbUrl: string;
    width?: number;
    height?: number;
  };
  analysis?: {
    status: 'pending' | 'complete' | 'failed';
    colors?: string[];
    pattern?: string;
    categoryGuess?: string;
    tags?: string[];
    confidence?: number;
    error?: string;
  };
  createdAt: any;
  updatedAt: any;
}

const MONTHLY_INVENTORY_LIMIT = 100;

// --- Hooks ---

export const useInventoryItems = (userId: string | null) => {
  const firestore = useFirestore();
  const q = useMemo(() => {
    if (!userId || !firestore) return null;
    return query(
      collection(firestore, 'inventory'),
      where('ownerId', '==', userId),
      orderBy('createdAt', 'desc')
    );
  }, [userId, firestore]);

  return useCollection<InventoryItem>(q);
};

export const useInventoryItem = (itemId: string | null) => {
  const firestore = useFirestore();
  const docRef = useMemo(() => {
    if (!itemId || !firestore) return null;
    return doc(firestore, 'inventory', itemId) as any;
  }, [itemId, firestore]);
  
  return useDoc<InventoryItem>(docRef);
};


// --- Data Functions ---

/**
 * Creates a new inventory item, resizes and uploads images, and updates the user's monthly count.
 */
export const createInventoryItem = async (
  firestore: Firestore,
  storage: FirebaseStorage,
  user: User,
  itemData: Omit<InventoryItem, 'id' | 'ownerId' | 'image' | 'createdAt' | 'updatedAt' | 'analysis'> & { sizes: string[] },
  imageFile: File
): Promise<string> => {
    
  // --- 1. Check and update monthly usage in a transaction ---
  const userDocRef = doc(firestore, `users/${user.uid}`);
  const currentMonthKey = new Date().toISOString().slice(0, 7); // YYYY-MM

  await runTransaction(firestore, async (transaction) => {
    const userDoc = await transaction.get(userDocRef);
    if (!userDoc.exists()) {
        throw new Error("User profile not found.");
    }
    const userData = userDoc.data();
    const count = userData.inventoryMonthKey === currentMonthKey ? userData.inventoryCountThisMonth || 0 : 0;
    
    if (count >= MONTHLY_INVENTORY_LIMIT) {
        throw new Error(`You have reached your monthly limit of ${MONTHLY_INVENTORY_LIMIT} new items.`);
    }

    transaction.set(userDocRef, {
        inventoryMonthKey: currentMonthKey,
        inventoryCountThisMonth: count + 1,
    }, { merge: true });
  });

  // --- 2. Create a new document ref to get a unique ID ---
  const newItemRef = doc(collection(firestore, 'inventory'));
  const itemId = newItemRef.id;
  
  // --- 3. Resize images ---
  const [originalResult, thumbResult] = await Promise.all([
    resizeImage(imageFile, 1600), // Main image
    resizeImage(imageFile, 400),  // Thumbnail
  ]);

  // --- 4. Upload images to Firebase Storage ---
  const originalPath = `inventory/${user.uid}/${itemId}/original.jpeg`;
  const thumbPath = `inventory/${user.uid}/${itemId}/thumb.jpeg`;
  const originalStorageRef = ref(storage, originalPath);
  const thumbStorageRef = ref(storage, thumbPath);

  await Promise.all([
    uploadBytes(originalStorageRef, originalResult.blob),
    uploadBytes(thumbStorageRef, thumbResult.blob),
  ]);

  // --- 5. Get download URLs ---
  const [originalUrl, thumbUrl] = await Promise.all([
    getDownloadURL(originalStorageRef),
    getDownloadURL(thumbStorageRef),
  ]);

  // --- 6. Create the final document in Firestore ---
  const finalItemData: Omit<InventoryItem, 'id'> = {
    ...itemData,
    ownerId: user.uid,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    image: {
      originalPath,
      originalUrl,
      thumbPath,
      thumbUrl,
      width: originalResult.width,
      height: originalResult.height,
    },
    analysis: {
      status: 'pending',
    },
  };

  await setDoc(newItemRef, finalItemData);
  
  return itemId;
};

/**
 * Updates an existing inventory item in Firestore.
 */
export const updateInventoryItem = async (
  firestore: Firestore,
  itemId: string,
  data: Partial<InventoryItem>
) => {
  const itemRef = doc(firestore, 'inventory', itemId);
  await updateDoc(itemRef, {
      ...data,
      updatedAt: serverTimestamp(),
  });
};

/**
 * Deletes an inventory item document from Firestore and its associated images from Storage.
 */
export const deleteInventoryItem = async (
  firestore: Firestore,
  storage: FirebaseStorage,
  item: InventoryItem
) => {
  if (!item) throw new Error('Item data is required for deletion.');
  
  // References to the images in Storage
  const originalImageRef = ref(storage, item.image.originalPath);
  const thumbImageRef = ref(storage, item.image.thumbPath);
  
  // Reference to the Firestore document
  const itemDocRef = doc(firestore, 'inventory', item.id);
  
  // Delete all in parallel
  await Promise.all([
    deleteObject(originalImageRef),
    deleteObject(thumbImageRef),
    deleteDoc(itemDocRef)
  ]);
};
