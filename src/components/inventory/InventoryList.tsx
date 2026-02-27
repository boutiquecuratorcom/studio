'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useInventoryItems, deleteInventoryItem, updateInventoryItem, type InventoryItem, generateSearchKeywords } from '@/lib/inventory';
import { AlertTriangle, BadgeCheck, Bot, Cpu, Edit, MoreVertical, RefreshCw, Trash2, XCircle, Search, Loader2, Eye } from 'lucide-react';
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
import { Input } from '../ui/input';
import { isAdminEmail } from '@/lib/admin';
import { collection, getDocs, query, where, writeBatch, doc } from 'firebase/firestore';


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
                const updatedItemData = { ...item, analysis: { ...analysisResult, status: 'complete' } };
                const searchKeywords = generateSearchKeywords(updatedItemData);

                await updateInventoryItem(firestore, item.id, {
                    analysis: {
                        ...analysisResult,
                        status: 'complete',
                        error: '',
                    },
                    searchKeywords,
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
  }, [item, user, firestore, toast]);

  return null;
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
      toast({ title: 'Item Deleted', description: `"${item.title}" has been removed from My Rack.` });
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
      <Card className="w-full overflow-hidden shadow-xl transition-shadow hover:shadow-2xl flex flex-col">
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
                  <Link href={`/inventory/view/${item.id}`} className="flex items-center cursor-pointer">
                    <Eye className="mr-2 h-4 w-4" />
                    <span>View Details</span>
                  </Link>
                </DropdownMenuItem>
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
                <h4 className="font-semibold leading-snug break-words mb-2">{item.title}</h4>
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
                        {item.searchKeywords && item.searchKeywords.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                                {item.searchKeywords.slice(0, 5).map(keyword => (
                                    <Badge key={keyword} variant="secondary" className="text-xs font-normal">{keyword}</Badge>
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
              This will permanently delete &quot;{item.title}&quot; from your rack and all of its images. This action cannot be undone.
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
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isBackfilling, setIsBackfilling] = useState(false);
  const isAdmin = isAdminEmail(user?.email);

  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  useEffect(() => {
    const handler = setTimeout(() => {
        setDebouncedSearchTerm(searchTerm);
    }, 500);

    return () => {
        clearTimeout(handler);
    };
  }, [searchTerm]);

  const { items, loading, error } = useInventoryItems(userId, debouncedSearchTerm);
  
  const handleBackfill = async () => {
    if (!firestore || !user) return;
    setIsBackfilling(true);
    toast({ title: 'Starting backfill...', description: 'Generating search keywords for all your items.' });
    
    try {
        const q = query(collection(firestore, 'inventory'), where('ownerId', '==', user.uid));
        const querySnapshot = await getDocs(q);

        const batch = writeBatch(firestore);
        let updatedCount = 0;

        querySnapshot.forEach(docSnapshot => {
            const item = { id: docSnapshot.id, ...docSnapshot.data() } as InventoryItem;
            // Only update if keywords are missing or seem outdated
            if (!item.searchKeywords || item.searchKeywords.length < 3) {
                const searchKeywords = generateSearchKeywords(item);
                const docRef = doc(firestore, 'inventory', item.id);
                batch.update(docRef, { searchKeywords });
                updatedCount++;
            }
        });

        if (updatedCount > 0) {
            await batch.commit();
            toast({ title: 'Backfill Complete!', description: `Updated search keywords for ${updatedCount} items.` });
        } else {
            toast({ title: 'All Set!', description: 'Your items already have up-to-date search keywords.' });
        }

    } catch (e: any) {
        console.error("Backfill failed:", e);
        toast({ variant: 'destructive', title: 'Backfill Failed', description: e.message });
    } finally {
        setIsBackfilling(false);
    }
  }


  if (error) {
    return (
        <div className="text-center py-16 border-2 border-dashed rounded-xl bg-card text-destructive flex flex-col items-center gap-4">
            <AlertTriangle className="h-10 w-10" />
            <div>
                <p className="font-semibold">Error loading My Rack.</p>
                <p className="text-sm">{error.message}</p>
            </div>
        </div>
    );
  }
  
  const renderContent = () => {
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
  
    if (!items || items.length === 0) {
      if (debouncedSearchTerm) {
        return (
            <div className="text-center py-16 border-2 border-dashed rounded-xl bg-card">
                <p className="text-muted-foreground font-semibold">No results found for &quot;{debouncedSearchTerm}&quot;</p>
                <p className="text-muted-foreground text-sm">Try a different search term.</p>
            </div>
        )
      }
      return (
          <div className="text-center py-16 border-2 border-dashed rounded-xl bg-card">
              <p className="text-muted-foreground">Your rack is empty.</p>
              <Button asChild variant="link">
                  <Link href="/inventory/add">Start by adding your first piece.</Link>
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

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="relative w-full max-w-lg">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
                placeholder="Search by keyword, type, color..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 rounded-full h-11"
            />
        </div>
        {isAdmin && (
            <Button onClick={handleBackfill} disabled={isBackfilling} variant="outline">
                {isBackfilling ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                Backfill Keywords
            </Button>
        )}
      </div>
      {renderContent()}
    </>
  );
}
