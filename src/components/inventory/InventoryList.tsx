'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useInventoryItems, deleteInventoryItem, updateInventoryItem, type InventoryItem } from '@/lib/inventory';
import { AlertTriangle, BadgeCheck, Bot, Cpu, Edit, MoreVertical, RefreshCw, Trash2, XCircle } from 'lucide-react';
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
import { analyzeInventoryImage } from '@/ai/flows/analyze-inventory-image-flow';


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
            const analysisResult = await analyzeInventoryImage({ imageUrl: item.image.thumbUrl });
            if (isMounted) {
                await updateInventoryItem(firestore, item.id, {
                    analysis: {
                        ...analysisResult,
                        status: 'complete',
                        error: '', // Clear any previous error
                    },
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
                    'analysis.status': 'failed',
                    'analysis.error': error.message || 'An unknown error occurred during analysis.',
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
  
  const handleRetryAnalysis = async () => {
    if (!firestore || !item) return;
    try {
        await updateInventoryItem(firestore, item.id, {
            'analysis.status': 'pending',
            'analysis.error': '',
        });
        toast({ title: 'Re-analysis Queued', description: `Will try analyzing "${item.title}" again.` });
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Retry Failed', description: error.message });
    }
  };

  const getStatusIcon = () => {
    const commonClasses = "absolute top-2 left-2 p-1.5 bg-background/80 rounded-full shadow-lg";
    switch (item.analysis?.status) {
        case 'pending':
            return (
                <div className={commonClasses} title="Analyzing...">
                    <Cpu className="h-4 w-4 text-muted-foreground animate-pulse" />
                </div>
            );
        case 'complete':
            return (
                 <div className={commonClasses} title="Analyzed">
                    <BadgeCheck className="h-4 w-4 text-green-600" />
                 </div>
            );
        case 'failed':
            return (
                 <div className={commonClasses} title={`Analysis Failed: ${item.analysis.error || 'Unknown error'}`}>
                    <XCircle className="h-4 w-4 text-destructive" />
                 </div>
            );
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
           {getStatusIcon()}
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
                {item.analysis?.status === 'failed' && (
                    <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={handleRetryAnalysis} className="cursor-pointer">
                            <RefreshCw className="mr-2 h-4 w-4" />
                            <span>Retry Analysis</span>
                        </DropdownMenuItem>
                    </>
                )}
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
            <div>
                <h3 className="font-semibold leading-snug break-words mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground mb-3">{item.type}</p>
                <div className="flex flex-wrap gap-2">
                    {item.sizes.map((size) => (
                    <Badge key={size} variant="outline">{size}</Badge>
                    ))}
                </div>
            </div>

            <div className="mt-auto pt-4 space-y-3">
                {item.analysis?.status === 'complete' && (
                    <div className="space-y-2">
                        {item.analysis.dominantColors && item.analysis.dominantColors.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                                {item.analysis.dominantColors.map((color) => (
                                    <div key={color} className="h-4 w-4 rounded-full border" style={{ backgroundColor: color }} title={color} />
                                ))}
                            </div>
                        )}
                        {item.analysis.tags && (
                            <div className="flex flex-wrap gap-1">
                                {item.analysis.tags.slice(0, 3).map(tag => (
                                    <Badge key={tag} variant="secondary" className="text-xs font-normal">{`#${tag.replace(/\s+/g, '')}`}</Badge>
                                ))}
                            </div>
                        )}
                    </div>
                )}
                <div className="border-t pt-2">
                    <p className="text-xs text-muted-foreground/80">
                        Added {item.createdAt ? formatDistanceToNow(item.createdAt.toDate(), { addSuffix: true }) : 'just now'}
                    </p>
                </div>
            </div>
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
