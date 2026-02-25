"use client";

import { GlowUpStudio } from '@/components/GlowUpStudio';
import { Header } from '@/components/Header';
import { db } from '@/lib/firebase';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { useEffect } from 'react';

export default function Home() {
  useEffect(() => {
    const createTestDocument = async () => {
      try {
        console.log("Attempting to create a test document in Firestore...");
        const testDocRef = doc(db, "test-collection", "test-doc-1");
        await setDoc(testDocRef, {
          message: "Connection to Firebase was successful!",
          timestamp: serverTimestamp(),
        });
        console.log("Successfully created test document in 'test-collection'. Your Firebase connection is working!");
      } catch (error) {
        console.error("Failed to create test document. Firebase connection might have an issue:", error);
      }
    };

    createTestDocument();
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 px-4 sm:px-6 lg:px-8 pb-8">
        <GlowUpStudio />
      </main>
    </div>
  );
}
