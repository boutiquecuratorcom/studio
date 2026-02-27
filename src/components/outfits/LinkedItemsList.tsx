'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useInventoryItemsByIds, type InventoryItem } from '@/lib/inventory';
import { AlertTriangle, Trash2, XCircle, Link as LinkIcon, Link2Off } from 'lucide-react';
import { useFirestore } from '@/firebase';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { unlinkRackItemFromOutfit } from '@/lib/outfits';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Badge } from '../ui/badge';

const LinkedItemCard = ({ item, outfitId }: { item: InventoryItem; outfitId: string }) => {
  const firestore = useFirestore();
  const { toast } = useToast();

  const handleUnlink = async () => {
    if (!firestore) return;
    try {
      await unlinkRackItemFromOutfit(firestore, outfitId, item.id);
      toast({ title: 'Item Unlinked', description: `"${item.title}" has been removed from the outfit.` });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Unlink Failed', description: error.message });
    }
  };
  
  const hasClaim = item.claim && item.claim.mode !== 'none' && item.claim.url;

  return (
    <Card className="overflow-hidden transition-shadow hover:shadow-md w-full">
      <div className="flex items-start gap-4 p-4">
        <Link href={`/inventory/view/${item.id}`} className="flex-shrink-0">
          <div className="relative h-20 w-20 rounded-md overflow-hidden bg-muted">
            <Image src={item.image.thumbUrl} alt={item.title} fill className="object-cover" />
          </div>
        </Link>
        <div className="flex-grow">
          <Link href={`/inventory/view/${item.id}`}>
            <p className="font-semibold leading-snug break-words hover:underline">{item.title}</p>
          </Link>
          <p className="text-sm text-muted-foreground">{item.type}</p>
          <div className="mt-2 flex items-center gap-2">
            {hasClaim ? (
                <Badge variant="secondary" className="text-xs">
                    <LinkIcon className="h-3 w-3 mr-1.5" />
                    Claim Set
                </Badge>
            ) : (
                 <Badge variant="destructive" className="text-xs opacity-80">
                    <Link2Off className="h-3 w-3 mr-1.5" />
                    No Claim Link
                </Badge>
            )}
          </div>
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will remove "{item.title}" from this outfit. It will not be deleted from your rack.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleUnlink} className="bg-destructive hover:bg-destructive/90">
                Unlink Item
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Card>
  );
};

const NotFoundItemCard = ({ itemId, outfitId }: { itemId: string; outfitId: string }) => {
    const firestore = useFirestore();
    const { toast } = useToast();

    const handleUnlink = async () => {
        if (!firestore) return;
        try {
            await unlinkRackItemFromOutfit(firestore, outfitId, itemId);
            toast({ title: 'Broken Link Removed' });
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Removal Failed', description: error.message });
        }
    };
    
    return (
        <Card className="overflow-hidden bg-destructive/5 border-destructive/20 w-full">
            <div className="flex items-center gap-4 p-4">
                <div className="flex h-20 w-20 rounded-md items-center justify-center bg-destructive/10 flex-shrink-0">
                    <XCircle className="h-8 w-8 text-destructive/80" />
                </div>
                <div className="flex-grow">
                    <p className="font-semibold text-destructive/90">Item Not Found</p>
                    <p className="text-xs text-destructive/70 font-mono break-all">{itemId}</p>
                </div>
                <Button variant="ghost" size="icon" onClick={handleUnlink} className="h-8 w-8 flex-shrink-0">
                    <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
            </div>
        </Card>
    );
};


export function LinkedItemsList({ outfitId, linkedItemIds }: { outfitId: string; linkedItemIds: string[] }) {
  const { items, loading, error } = useInventoryItemsByIds(linkedItemIds);

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: Math.min(linkedItemIds.length, 3) }).map((_, i) => (
          <Skeleton key={i} className="h-28 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-10 border-2 border-dashed rounded-xl bg-card text-destructive flex flex-col items-center gap-4">
        <AlertTriangle className="h-8 w-8" />
        <p className="font-semibold">Error loading linked items.</p>
      </div>
    );
  }

  const itemsMap = new Map(items?.map(item => [item.id, item]));

  return (
    <div className="space-y-3">
        {linkedItemIds.map(id => {
            const item = itemsMap.get(id);
            if (item) {
                return <LinkedItemCard key={id} item={item} outfitId={outfitId} />;
            } else if (!loading) { // Only show not found if we are done loading
                return <NotFoundItemCard key={id} itemId={id} outfitId={outfitId} />;
            }
            return null;
        })}
    </div>
  );
}
