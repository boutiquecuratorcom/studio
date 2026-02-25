"use client";

import { GlowUpStudio } from '@/components/GlowUpStudio';
import { Header } from '@/components/Header';
import { useEffect } from 'react';
import { useFirestore } from '@/firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export default function Home() {
  const firestore = useFirestore();

  useEffect(() => {
    // This effect runs once on component mount to test the Firestore connection.
    const testConnection = () => {
      if (firestore) {
        const testCollectionRef = collection(firestore, 'test-collection');
        const data = {
          message: 'Connection successful!',
          timestamp: serverTimestamp(),
        };
        
        // The `addDoc` promise is not awaited. Instead, we chain a .catch()
        // to handle potential permission errors without blocking the UI.
        addDoc(testCollectionRef, data)
          .then((docRef) => {
            console.log(
              'Firestore connection test successful. Document written with ID: ',
              docRef.id
            );
          })
          .catch((serverError) => {
            // Create a rich, contextual error that includes details about the
            // failed Firestore request. This is crucial for debugging security rules.
            const permissionError = new FirestorePermissionError({
              path: testCollectionRef.path + '/<auto-id>', // Path for the document being created
              operation: 'create',
              requestResourceData: data,
            });
            
            // Emit the error through the global event emitter. The FirebaseErrorListener
            // will catch this and display it in the Next.js development overlay.
            errorEmitter.emit('permission-error', permissionError);

            // Also log the original server error for more context in the console.
            console.error("Original Firestore server error:", serverError);
          });
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
