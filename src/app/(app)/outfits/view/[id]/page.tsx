'use client';

import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { useOutfit } from '@/lib/outfits';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, ServerCrash, FileQuestion, UserX, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useUser } from '@/firebase';
import { format } from 'date-fns';

export default function ViewOutfitPage() {
  const params = useParams();
  const id = params.id as string;
  const { user } = useUser();
  const { data: outfit, loading, error } = useOutfit(id);

  if (loading) {
    return (
      <div className="flex-1 p-8 sm:p-10 lg:p-12">
        <header className="mb-12">
          <Skeleton className="h-16 w-3/5" />
          <Skeleton className="mt-4 h-7 w-2/5" />
        </header>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-48 w-full" />
          </div>
          <div className="lg:col-span-1">
            <Skeleton className="h-80 w-full" />
          </div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
        <div className="flex-1 p-8 text-center text-destructive mt-10">
            <ServerCrash className="h-16 w-16 mx-auto mb-4" />
            <p>Error loading outfit: {error.message}</p>
        </div>
    )
  }
  
  if (!outfit) {
     return (
        <div className="flex-1 p-8 text-center text-muted-foreground mt-10">
            <FileQuestion className="h-16 w-16 mx-auto mb-4" />
            <p>Outfit not found.</p>
        </div>
     )
  }
  
  if (!user || outfit.ownerId !== user.uid) {
    return (
        <div className="flex-1 p-8 text-center text-destructive mt-10">
            <UserX className="h-16 w-16 mx-auto mb-4" />
            <p>You do not have permission to view this outfit.</p>
        </div>
    )
  }
  
  return (
    <div className="flex-1 p-8 sm:p-10 lg:p-12">
      <header className="mb-12 flex justify-between items-start">
        <div>
            <h1 className="text-5xl lg:text-6xl font-bold tracking-tight break-words">{outfit.title}</h1>
            <p className="text-xl text-muted-foreground mt-4">
                Created on {outfit.createdAt ? format(outfit.createdAt.toDate(), 'PPP') : ''}
            </p>
        </div>
        <Button asChild>
            <Link href={`/outfits/edit/${outfit.id}`}>Edit Outfit</Link>
        </Button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Outfit Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div>
                    <p className="text-sm font-medium text-muted-foreground">Status</p>
                    <Badge variant={outfit.status === 'ready' ? 'default' : 'secondary'}>{outfit.status}</Badge>
                </div>
                {outfit.notes && (
                    <div>
                        <p className="text-sm font-medium text-muted-foreground">Notes</p>
                        <p className="text-foreground whitespace-pre-wrap">{outfit.notes}</p>
                    </div>
                )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layers className="h-5 w-5" />
                Linked Rack Items
              </CardTitle>
              <CardDescription>Items that make up this outfit.</CardDescription>
            </CardHeader>
            <CardContent>
                {outfit.linkedRackItemIds.length > 0 ? (
                     <p>Linked items will be shown here.</p>
                ) : (
                    <p className="text-sm text-muted-foreground">No items have been linked to this outfit yet.</p>
                )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1 space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Cover Image</CardTitle>
                </CardHeader>
                <CardContent>
                    {outfit.cover?.imageUrl ? (
                        <Image src={outfit.cover.imageUrl} alt={outfit.title} width={400} height={400} className="rounded-lg object-cover w-full aspect-square" />
                    ) : (
                        <div className="aspect-square bg-muted rounded-lg flex items-center justify-center">
                            <p className="text-sm text-muted-foreground">No cover image</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
