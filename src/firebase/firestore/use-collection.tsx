'use client';
import { useState, useEffect } from 'react';
import {
  onSnapshot,
  Query,
  DocumentData,
  FirestoreError,
  QuerySnapshot,
} from 'firebase/firestore';
import { errorEmitter } from '../error-emitter';
import { FirestorePermissionError } from '../errors';

export const useCollection = <T extends DocumentData>(
  q: Query<T> | null,
  collectionPathForDebug: string | null = null
) => {
  const [data, setData] = useState<T[] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<FirestoreError | null>(null);

  useEffect(() => {
    if (!q) {
      setData(null);
      setLoading(false);
      return;
    }

    setLoading(true);

    const unsubscribe = onSnapshot(
      q,
      (snapshot: QuerySnapshot<T>) => {
        const docs = snapshot.docs.map(
          (doc) => ({ ...doc.data(), id: doc.id } as T)
        );
        setData(docs);
        setLoading(false);
        setError(null); // Clear previous errors on success
      },
      (err: FirestoreError) => {
        console.error(err); // Keep for basic console logging
        setError(err);
        setLoading(false);
        
        // For real-time listeners, if we get a permission error, we need to
        // manually construct and emit our rich contextual error so the developer
        // can see it in the Next.js error overlay.
        if (err.code === 'permission-denied' && collectionPathForDebug) {
            const permissionError = new FirestorePermissionError({
                path: collectionPathForDebug,
                operation: 'list',
            });
            errorEmitter.emit('permission-error', permissionError);
        }
      }
    );

    return () => unsubscribe();
  }, [q, collectionPathForDebug]);

  return { data, loading, error };
};
