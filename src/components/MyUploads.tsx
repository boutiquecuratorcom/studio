"use client";

import React, { useMemo } from 'react';
import { useUser, useFirestore, useCollection } from '@/firebase';
import { collection, query, orderBy, Timestamp, DocumentData, limit } from 'firebase/firestore';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';
import { Card } from './ui/card';
import { Skeleton } from './ui/skeleton';
import { ExternalLink, Sparkles } from 'lucide-react';
import { usePathname } from 'next/navigation';

interface Upload extends DocumentData {
  id: string;
  downloadURL: string;
  originalName: string;
  createdAt: Timestamp;
  isEnhanced?: boolean;
}

const UploadGrid = ({ uploads, type = 'images' }: { uploads: Upload[], type?: 'images' | 'Glow-Ups' | 'Originals' }) => {
    if (!uploads || uploads.length === 0) {
        return (
            <div className="text-center py-16 border-2 border-dashed rounded-xl bg-card">
                <p className="text-muted-foreground">No {type.toLowerCase()} found.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
            {uploads.map((upload) => (
            <div key={upload.id} className="relative group aspect-square">
                <Card className="w-full h-full overflow-hidden shadow-lg transition-shadow hover:shadow-2xl">
                    <Image
                    src={upload.downloadURL}
                    alt={upload.originalName || 'Uploaded image'}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                    className="object-cover transition-transform duration-300 ease-in-out group-hover:scale-105"
                    />
                </Card>
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-3 flex flex-col justify-end">
                    <p className="text-white text-sm font-medium truncate">{upload.originalName}</p>
                    <p className="text-white/80 text-xs">
                        {upload.createdAt ? formatDistanceToNow(upload.createdAt.toDate(), { addSuffix: true }) : 'just now'}
                    </p>
                </div>
                <a href={upload.downloadURL} target="_blank" rel="noopener noreferrer" className="absolute top-2 right-2 p-1.5 bg-background/80 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-accent hover:text-accent-foreground">
                    <ExternalLink className='h-4 w-4' />
                </a>
                {upload.isEnhanced && (
                <div className="absolute top-2 left-2 p-1.5 bg-background/80 rounded-full shadow-lg">
                    <Sparkles className="h-4 w-4 text-accent" />
                </div>
                )}
            </div>
            ))}
        </div>
    )
};


export function MyUploads() {
  const { user } = useUser();
  const firestore = useFirestore();
  const pathname = usePathname();
  const isDashboard = pathname === '/dashboard';

  const collectionPath = useMemo(() => (user ? `users/${user.uid}/uploads` : null), [user]);

  const uploadsQuery = useMemo(() => {
    if (user && firestore && collectionPath) {
        const baseQuery = collection(firestore, collectionPath);
        // On dashboard, limit to recent uploads. On uploads page, show all.
        return isDashboard 
            ? query(baseQuery, orderBy('createdAt', 'desc'), limit(12))
            : query(baseQuery, orderBy('createdAt', 'desc'));
    }
    return null;
  }, [user, firestore, isDashboard, collectionPath]);

  const { data: uploads, loading, error } = useCollection<Upload>(uploadsQuery, collectionPath);

  const validUploads = useMemo(() => uploads?.filter(u => u.downloadURL), [uploads]);
  const originalUploads = useMemo(() => validUploads?.filter(u => !u.isEnhanced), [validUploads]);
  const enhancedUploads = useMemo(() => validUploads?.filter(u => u.isEnhanced), [validUploads]);

  if (loading) {
    return (
        <div className="space-y-10">
            <div>
                <Skeleton className="h-8 w-48 mb-4" />
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                    {Array.from({ length: isDashboard ? 6 : 12 }).map((_, i) => (
                    <Skeleton key={i} className="aspect-square rounded-2xl" />
                    ))}
                </div>
            </div>
             { !isDashboard && (
                 <div>
                    <Skeleton className="h-8 w-48 mb-4" />
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                        {Array.from({ length: 6 }).map((_, i) => (
                        <Skeleton key={i} className="aspect-square rounded-2xl" />
                        ))}
                    </div>
                </div>
             )}
        </div>
    );
  }

  if (error) {
    return <p className='text-destructive text-center py-8'>Error loading your library. Please try again later.</p>
  }
  
  if(isDashboard) {
    return <UploadGrid uploads={enhancedUploads || []} type="Glow-Ups" />;
  }

  return (
      <div className="space-y-12">
        <div>
          <h2 className="text-2xl font-headline font-semibold tracking-tight mb-4">Glow-Ups</h2>
          <UploadGrid uploads={enhancedUploads || []} type="Glow-Ups" />
        </div>
        <div>
          <h2 className="text-2xl font-headline font-semibold tracking-tight mb-4">Originals</h2>
          <UploadGrid uploads={originalUploads || []} type="Originals" />
        </div>
      </div>
  );
}
