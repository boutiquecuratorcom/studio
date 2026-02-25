"use client";

import { GlowUpStudio } from '@/components/GlowUpStudio';
import { Header } from '@/components/Header';
import { useEffect } from 'react';
import { useFirestore } from '@/firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';

export default function Home() {
  const firestore = useFirestore();

  useEffect(() => {
    // This effect runs once on component mount to test the Firestore connection.
    const testConnection = async () => {
      if (firestore) {
        try {
          const testCollectionRef = collection(firestore, 'test-collection');
          const docRef = await addDoc(testCollectionRef, {
            message: 'Connection successful!',
            timestamp: serverTimestamp(),
          });
          console.log(
            'Firestore connection test successful. Document written with ID: ',
            docRef.id
          );
        } catch (error) {
          console.error('Firestore connection test failed: ', error);
        }
      }
    };
    testConnection();
  }, [firestore]);

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 px-4 sm:px-6 lg:px-8 pb-8">
        <GlowUpStudio />
      </main>
    </div>
  );
}
