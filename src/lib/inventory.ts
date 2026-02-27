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
  getBlob,
} from 'firebase/storage';
import type { User } from 'firebase/auth';
import { useCollection, useDoc, useFirestore } from '@/firebase';
import { useMemo } from 'react';
import { resizeImage } from './image-utils';
import type { AnalyzeInventoryImageOutput } from '@/ai/flows/analyze-inventory-image-flow';

export interface ImageDetails {
  originalPath: string;
  originalUrl: string;
  thumbPath: string;
  thumbUrl: string;
  width?: number;
  height?: number;
}

export interface InventoryItem extends DocumentData {
  id: string;
  ownerId: string;
  brand: string;
  title: string;
  type: string;
  sizes: string[];
  notes?: string;
  image: ImageDetails;
  originalImageDetails?: ImageDetails;
  glowUpId?: string;
  glowedAt?: any;
  analysis?: AnalyzeInventoryImageOutput & {
    status: 'pending' | 'complete' | 'failed';
    error?: string;
  };
  searchKeywords?: string[];
  createdAt: any;
  updatedAt: any;
}

export interface GlowUp extends DocumentData {
    id: string;
    sourceType: "rackItem" | "upload";
    sourceId: string;
    linkedRackItemId?: string | null;
    inputImageUrl: string;
    inputImageStoragePath?: string;
    outputImageUrl?: string;
    outputThumbUrl?: string;
    storagePath?: string;
    thumbStoragePath?: string;
    stylePreset: string;
    status: "processing" | "completed" | "failed";
    createdAt: any;
}


const MONTHLY_INVENTORY_LIMIT = 100;

// --- Hooks ---

const searchStopwords = new Set(['a', 'an', 'the', 'in', 'on', 'for', 'with', 'and', 'or', 'but', 'is', 'it', 'of', 'to', 'as', 'at', 'by']);

export const useInventoryItems = (userId: string | null, searchTerm: string | null) => {
  const firestore = useFirestore();

  // 1. Tokenize the search term
  const searchTokens = useMemo(() => {
    if (!searchTerm || searchTerm.trim() === '') return [];
    
    const normalized = searchTerm.toLowerCase().trim();
    // Split on whitespace, hyphens, and underscores, then filter
    return normalized
        .split(/[\s\-_]+/)
        .filter(token => token.length > 0 && !searchStopwords.has(token));
  }, [searchTerm]);


  // 2. Build the Firestore query using array-contains-any
  const q = useMemo(() => {
    if (!userId || !firestore) return null;
    let queryRef: Query<InventoryItem> = collection(firestore, 'inventory') as Query<InventoryItem>;
    
    queryRef = query(queryRef, where('ownerId', '==', userId));

    // Use array-contains-any for broad fetching. Max 10 tokens for Firestore query.
    if (searchTokens.length > 0) {
        queryRef = query(queryRef, where('searchKeywords', 'array-contains-any', searchTokens.slice(0, 10)));
    }
    
    return queryRef;
  }, [userId, firestore, searchTokens]);

  const { data, loading, error } = useCollection<InventoryItem>(q, 'inventory');

  // 3. Apply client-side AND filtering and sorting
  const filteredAndSortedItems = useMemo(() => {
    if (!data) return null;

    // Apply AND logic filter on the client
    const filteredItems = searchTokens.length > 0
        ? data.filter(item => {
            // Ensure searchKeywords exists and is an array
            if (!Array.isArray(item.searchKeywords)) return false;
            
            // Use a Set for efficient lookups
            const itemKeywords = new Set(item.searchKeywords.map(k => k.toLowerCase()));
            
            // Every search token must be in the item's keywords
            return searchTokens.every(token => itemKeywords.has(token));
        })
        : data;

    // Sort the final list of items
    return [...filteredItems].sort((a, b) => {
        const timeA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
        const timeB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
        return timeB - timeA;
    });

  }, [data, searchTokens]);

  return { items: filteredAndSortedItems, loading, error };
};


export const useInventoryItem = (itemId: string | null) => {
  const firestore = useFirestore();
  const docRef = useMemo(() => {
    if (!itemId || !firestore) return null;
    const decodedItemId = decodeURIComponent(itemId);
    return doc(firestore, 'inventory', decodedItemId) as any;
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
 * Creates a new inventory item from a file upload, resizes and uploads images, and updates the user's monthly count.
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
 * Creates a new inventory item from an existing GlowUp record. This function does not perform any storage operations.
 */
export const createInventoryItemFromGlowUp = async (
  firestore: Firestore,
  user: User,
  glowUpData: GlowUp,
  glowUpId: string
): Promise<string> => {
  // 1. Transaction to check monthly usage
  const userDocRef = doc(firestore, `users/${user.uid}`);
  const currentMonthKey = new Date().toISOString().slice(0, 7); // YYYY-MM

  await runTransaction(firestore, async (transaction) => {
    const userDoc = await transaction.get(userDocRef);
    if (!userDoc.exists()) throw new Error('User profile not found.');
    const userData = userDoc.data();
    const count =
      userData.inventoryMonthKey === currentMonthKey
        ? userData.inventoryCountThisMonth || 0
        : 0;
    if (count >= MONTHLY_INVENTORY_LIMIT) {
      throw new Error(
        `You have reached your monthly limit of ${MONTHLY_INVENTORY_LIMIT} new items.`
      );
    }
    transaction.set(
      userDocRef,
      {
        inventoryMonthKey: currentMonthKey,
        inventoryCountThisMonth: count + 1,
      },
      { merge: true }
    );
  });

  // 2. Create a new inventory doc ref
  const newItemRef = doc(collection(firestore, 'inventory'));
  const itemId = newItemRef.id;

  // 3. Construct originalImageDetails from the GlowUp's input image.
  // We re-use the main image URL for the thumbnail URL as a fallback, since one wasn't generated on original upload.
  if (!glowUpData.inputImageUrl || !glowUpData.inputImageStoragePath) {
    throw new Error('GlowUp record is missing original image source information.');
  }
  const originalImageDetails: ImageDetails = {
    originalPath: glowUpData.inputImageStoragePath,
    originalUrl: glowUpData.inputImageUrl,
    thumbPath: glowUpData.inputImageStoragePath, // Fallback to main path
    thumbUrl: glowUpData.inputImageUrl,        // Fallback to main URL
  };

  // 4. The display image is the GlowUp output.
  if (
    !glowUpData.outputImageUrl ||
    !glowUpData.storagePath ||
    !glowUpData.outputThumbUrl ||
    !glowUpData.thumbStoragePath
  ) {
    throw new Error('GlowUp record is missing output image information.');
  }
  const displayImage: ImageDetails = {
    originalPath: glowUpData.storagePath,
    originalUrl: glowUpData.outputImageUrl,
    thumbPath: glowUpData.thumbStoragePath,
    thumbUrl: glowUpData.outputThumbUrl,
  };

  // 5. Set up initial data and keywords
  const itemDataForKeywords = {
    title: 'New Item from Glow-Up',
    type: 'Apparel',
    brand: 'LuLaRoe', // Default brand
  };
  const searchKeywords = generateSearchKeywords(itemDataForKeywords);

  // 6. Create the final inventory document
  const finalItemData: Omit<InventoryItem, 'id'> = {
    ...itemDataForKeywords,
    ownerId: user.uid,
    sizes: ['OS'], // Default size
    notes: `Created from Glow-Up: ${glowUpId}`,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    image: displayImage,
    originalImageDetails: originalImageDetails,
    glowUpId: glowUpId,
    glowedAt: serverTimestamp(),
    analysis: { status: 'pending' },
    searchKeywords,
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
  
  const deletionPromises: Promise<any>[] = [];

  // Delete ONLY the images that are specific to this inventory item.
  // If originalImageDetails exists, those are the inventory-specific images.
  // The `item.image` would be pointing to a shared GlowUp asset, which we should not delete.
  if (item.originalImageDetails) {
    if (item.originalImageDetails.originalPath) {
      deletionPromises.push(deleteObject(ref(storage, item.originalImageDetails.originalPath)));
    }
    if (item.originalImageDetails.thumbPath) {
      deletionPromises.push(deleteObject(ref(storage, item.originalImageDetails.thumbPath)));
    }
  } else {
    // If there are no originalImageDetails, it means `item.image` contains the original images.
    if (item.image?.originalPath) {
      deletionPromises.push(deleteObject(ref(storage, item.image.originalPath)));
    }
    if (item.image?.thumbPath) {
      deletionPromises.push(deleteObject(ref(storage, item.image.thumbPath)));
    }
  }

  // Delete the Firestore document
  deletionPromises.push(deleteDoc(doc(firestore, 'inventory', item.id)));

  await Promise.all(deletionPromises);
};
