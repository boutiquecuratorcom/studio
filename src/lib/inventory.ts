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
  Query,
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
import type { AnalyzeInventoryImageOutput } from '@/ai/flows/analyze-inventory-image-flow';

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
  analysis?: AnalyzeInventoryImageOutput & {
    status: 'pending' | 'complete' | 'failed';
    error?: string;
  };
  searchKeywords?: string[];
  createdAt: any;
  updatedAt: any;
}

const MONTHLY_INVENTORY_LIMIT = 100;

// --- Hooks ---

export const useInventoryItems = (userId: string | null, searchToken: string | null) => {
  const firestore = useFirestore();

  const q = useMemo(() => {
    if (!userId || !firestore) return null;
    let queryRef: Query<InventoryItem> = collection(firestore, 'inventory') as Query<InventoryItem>;
    
    queryRef = query(queryRef, where('ownerId', '==', userId));

    if (searchToken && searchToken.trim().length > 0) {
        queryRef = query(queryRef, where('searchKeywords', 'array-contains', searchToken.trim().toLowerCase()));
    }
    
    return queryRef;
  }, [userId, firestore, searchToken]);

  const { data, loading, error } = useCollection<InventoryItem>(q, 'inventory');

  const sortedItems = useMemo(() => {
    if (!data) return null;
    
    return [...data].sort((a, b) => {
        const timeA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
        const timeB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
        return timeB - timeA;
    });
  }, [data]);

  return { items: sortedItems, loading, error };
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

const stopwords = new Set(['a', 'an', 'the', 'in', 'on', 'for', 'with', 'and', 'or', 'but', 'is', 'it', 'of', 'to', 'as', 'at', 'by']);

/**
 * Generates an array of normalized keywords for searching an inventory item.
 */
export const generateSearchKeywords = (item: Partial<InventoryItem>): string[] => {
  const keywords = new Set<string>();

  const add = (value: string | undefined | null) => {
    if (!value) return;

    const sanitizedValue = value.toLowerCase().trim();
    if (!sanitizedValue || stopwords.has(sanitizedValue)) return;
    
    const words = sanitizedValue.split(/[\s,.\-&/]+/);
    
    // Add useful short phrases (2-4 words)
    if (words.length > 1 && words.length <= 4) {
        keywords.add(sanitizedValue);
    }
    
    // Add individual words
    words.forEach(word => {
        const cleanWord = word.replace(/[^a-z0-9]/gi, ''); // Sanitize further
        if (cleanWord.length > 1 && !stopwords.has(cleanWord)) {
            keywords.add(cleanWord);
        }
    });
  };

  const addAll = (values: (string | undefined | null)[] | undefined) => {
    if (!values) return;
    values.forEach(add);
  };

  // Add keywords from core fields
  add(item.brand);
  add(item.title);
  add(item.type);
  addAll(item.sizes);
  
  // Add keywords from AI analysis if available and complete
  if (item.analysis && item.analysis.status === 'complete') {
    add(item.analysis.clothingType);
    add(item.analysis.styleVibe);
    add(item.analysis.patternType);
    add(item.analysis.patternDescription);
    addAll(item.analysis.tags);
  }

  return Array.from(keywords).filter(Boolean);
};


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

  // --- 6. Generate initial keywords ---
  const initialKeywords = generateSearchKeywords(itemData);

  // --- 7. Create the final document in Firestore ---
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
    searchKeywords: initialKeywords,
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
