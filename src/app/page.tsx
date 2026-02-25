"use client";

import React from 'react';
import { useUser } from '@/firebase';
import { AuthForm } from '@/components/AuthForm';
import { GlowUpStudio } from '@/components/GlowUpStudio';
import { Header } from '@/components/Header';
import { MyUploads } from '@/components/MyUploads';
import { ConnectionStatus } from '@/components/ConnectionStatus';
import { Skeleton } from '@/components/ui/skeleton';

export default function Home() {
  const { user, loading } = useUser();

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <Skeleton className="w-full h-[600px] rounded-lg" />
        </main>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 flex items-center justify-center p-4">
          <AuthForm />
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 px-4 sm:px-6 lg:px-8 pb-8 space-y-8">
        <GlowUpStudio />
        <ConnectionStatus />
        <MyUploads />
      </main>
    </div>
  );
}
