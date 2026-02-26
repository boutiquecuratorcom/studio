'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useInventoryItems, deleteInventoryItem, updateInventoryItem, type InventoryItem } from '@/lib/inventory';
import { AlertTriangle, BadgeCheck, Bot, Cpu, Edit, MoreVertical, Trash2, XCircle } from 'lucide-react';
import { useFirestore, useStorage, useUser } from '@/firebase';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '../ui/badge';
import { analyzeInventoryImage, AnalyzeInventoryImageOutput } from '@/ai/flows/analyze-inventory-image-flow';


function InventoryAnalysis({ item }: { item: InventoryItem }) {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  useEffect(() => {
    let isMounted = true;
    
    const runAnalysis = async () => {
        if (!user || !firestore || item.analysis?.status !== 'pending') {
            return;
        }

        try {
            const analysisResult: AnalyzeInventoryImageOutput = await analyzeInventoryImage({ imageUrl: item.image.thumbUrl });
            if (isMounted) {
                await updateInventoryItem(firestore, item.id, {
                    analysis: {
                        ...analysisResult,
                        status: 'complete',
                        error: null,
                    },
                    updatedAt: new Date(),
                });
                toast({
                    title: 'Analysis Complete',
                    description: `AI analysis for "${item.title}" is done.`,
                });
            }
        } catch (error: any) {
            console.error('AI Analysis failed:', error);
            if (isMounted) {
                await updateInventoryItem(firestore, item.id, {
                    analysis: {
                        ...item.analysis,
                        status: 'failed',
                        error: error.message || 'An unknown error occurred during analysis.',
                    },
                    updatedAt: new Date(),
                });
                toast({
                    variant: 'destructive',
                    title: 'Analysis Failed',
                    description: `Could not analyze "${item.title}".`,
                });
            }
        }
    };
    
    runAnalysis();

    return () => {
      isMounted = false;
    };
  }, [item.id, item.analysis?.status, item.image.thumbUrl, item.title, user, firestore, toast]);

  return null; // This component does not render anything itself
}

function ItemCard({ item }: { item: InventoryItem }) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const firestore = useFirestore();
  const storage = useStorage();
  const { toast } = useToast();

  const handleDelete = async () => {
    if (!firestore || !storage) return;
    try {
      await deleteInventoryItem(firestore, storage, item);
      toast({ title: 'Item Deleted', description: `"${item.title}" has been removed from your inventory.` });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Delete Failed', description: error.message });
    }
    setIsDeleteDialogOpen(false);
  };
  
  const getStatusBadge = () => {
    switch (item.analysis?.status) {
        case 'pending':
            return <Badge variant="secondary" className="gap-1.5 pl-2"><Cpu className="h-3 w-3 animate-pulse" /> Analyzing...</Badge>;
        case 'complete':
            return <Badge className="bg-green-600 hover:bg-green-700 gap-1.5 pl-2"><BadgeCheck className="h-3 w-3" /> Analyzed</Badge>;
        case 'failed':
            return <Badge variant="destructive" className="gap-1.5 pl-2"><XCircle className="h-3 w-3" /> Failed</Badge>;
        default:
            return null;
    }
  }


  return (
    <>
      <InventoryAnalysis item={item} />
      <Card className="w-full overflow-hidden shadow-lg transition-shadow hover:shadow-2xl flex flex-col">
        <div className="relative group aspect-square">
          <Image
            src={item.image.thumbUrl}
            alt={item.title}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
            className="object-cover transition-transform duration-300 ease-in-out group-hover:scale-105"
          />
          <div className="absolute top-2 right-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary" size="icon" className="h-8 w-8 rounded-full bg-background/70 hover:bg-background">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href={`/inventory/edit/${item.id}`} className="flex items-center cursor-pointer">
                    <Edit className="mr-2 h-4 w-4" />
                    <span>Edit Item</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setIsDeleteDialogOpen(true)} className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer">
                  <Trash2 className="mr-2 h-4 w-4" />
                  <span>Delete Item</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <div className="p-4 flex-grow flex flex-col">
            <div className="flex justify-between items-start gap-2 mb-2">
                <h3 className="font-semibold leading-snug flex-grow">{item.title}</h3>
                {getStatusBadge()}
            </div>
          <p className="text-sm text-muted-foreground mb-3 flex-grow">{item.type}</p>
          <div className="flex flex-wrap gap-2 mb-3">
            {item.sizes.map((size) => (
              <Badge key={size} variant="outline">{size}</Badge>
            ))}
          </div>
          <p className="text-xs text-muted-foreground/80 mt-auto pt-2">
            Added {item.createdAt ? formatDistanceToNow(item.createdAt.toDate(), { addSuffix: true }) : 'just now'}
          </p>
        </div>
      </Card>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the item &quot;{item.title}&quot; and all of its images. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
              Yes, delete item
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}


export function InventoryList({ userId }: { userId: string }) {
  const { items, loading, error } = useInventoryItems(userId);

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="aspect-square rounded-2xl" />
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
        <div className="text-center py-16 border-2 border-dashed rounded-xl bg-card text-destructive flex flex-col items-center gap-4">
            <AlertTriangle className="h-10 w-10" />
            <div>
                <p className="font-semibold">Error loading inventory.</p>
                <p className="text-sm">{error.message}</p>
            </div>
        </div>
    );
  }

  if (!items || items.length === 0) {
    return (
        <div className="text-center py-16 border-2 border-dashed rounded-xl bg-card">
            <p className="text-muted-foreground">Your inventory is empty.</p>
            <Button asChild variant="link">
                <Link href="/inventory/add">Add your first item</Link>
            </Button>
        </div>
    );
}

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
      {items.map((item) => (
        <ItemCard key={item.id} item={item} />
      ))}
    </div>
  );
}
