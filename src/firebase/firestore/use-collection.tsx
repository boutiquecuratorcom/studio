'use client';
import { useState, useEffect } from 'react';
import {
  onSnapshot,
  collection,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  endBefore,
  limitToLast,
  startAt,
  Query,
  DocumentData,
  FirestoreError,
  QuerySnapshot,
} from 'firebase/firestore';
import { useFirestore } from '../provider';

export const useCollection = <T extends DocumentData>(
  q: Query<T> | null
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
      },
      (err: FirestoreError) => {
        console.error(err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [q]);

  return { data, loading, error };
};
