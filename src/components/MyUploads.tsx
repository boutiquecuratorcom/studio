"use client";

import React, { useMemo } from 'react';
import { useUser, useFirestore, useCollection } from '@/firebase';
import { collection, query, orderBy, Timestamp, DocumentData } from 'firebase/firestore';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Skeleton } from './ui/skeleton';
import { Badge } from './ui/badge';
import { ExternalLink, Sparkles } from 'lucide-react';

interface Upload extends DocumentData {
  id: string;
  downloadURL: string;
  originalName: string;
  createdAt: Timestamp;
  isEnhanced?: boolean;
}

export function MyUploads() {
  const { user } = useUser();
  const firestore = useFirestore();

  const uploadsQuery = useMemo(() => {
    if (user && firestore) {
      return query(
        collection(firestore, `users/${user.uid}/uploads`),
        orderBy('createdAt', 'desc')
      );
    }
    return null;
  }, [user, firestore]);

  const { data: uploads, loading, error } = useCollection<Upload>(uploadsQuery);

  const validUploads = useMemo(() => uploads?.filter(u => u.downloadURL), [uploads]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>My Uploads</CardTitle>
        <CardDescription>
          Here are the original images you've uploaded.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="aspect-square rounded-lg" />
            ))}
          </div>
        )}
        {error && (
            <p className='text-destructive'>Error loading uploads. Please try again later.</p>
        )}
        {!loading && (!validUploads || validUploads.length === 0) && (
          <p className="text-muted-foreground text-center py-8">
            You haven't uploaded any images yet.
          </p>
        )}
        {validUploads && validUploads.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {validUploads.map((upload) => (
              <div key={upload.id} className="relative group aspect-square">
                <Image
                  src={upload.downloadURL}
                  alt={upload.originalName || 'Uploaded image'}
                  fill
                  className="object-cover rounded-lg border"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-2 flex flex-col justify-end">
                    <p className="text-white text-xs font-medium truncate">{upload.originalName}</p>
                    <p className="text-white/80 text-xs">
                        {upload.createdAt ? formatDistanceToNow(upload.createdAt.toDate(), { addSuffix: true }) : 'just now'}
                    </p>
                </div>
                <a href={upload.downloadURL} target="_blank" rel="noopener noreferrer" className="absolute top-2 right-2 p-1.5 bg-background/80 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-accent">
                    <ExternalLink className='h-4 w-4 text-foreground' />
                </a>
                {upload.isEnhanced && (
                  <div className="absolute top-2 left-2 p-1 bg-background/80 rounded-full shadow-lg">
                    <Sparkles className="h-4 w-4 text-primary" />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
