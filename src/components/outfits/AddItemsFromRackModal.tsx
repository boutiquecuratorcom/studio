'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useInventoryItems, type InventoryItem, type Outfit } from '@/lib/inventory';
import { useUser, useFirestore } from '@/firebase';
import { Skeleton } from '../ui/skeleton';
import { linkMultipleRackItemsToOutfit } from '@/lib/outfits';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Plus, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '../ui/input';

interface AddItemsFromRackModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  outfit: Outfit;
}

const SelectableItemCard = ({
  item,
  isSelected,
  onSelect,
}: {
  item: InventoryItem;
  isSelected: boolean;
  onSelect: (itemId: string) => void;
}) => {
  return (
    <div
      onClick={() => onSelect(item.id)}
      className={cn(
        'relative group aspect-square border-4 rounded-lg cursor-pointer transition-all',
        isSelected ? 'border-primary' : 'border-transparent hover:border-primary/50'
      )}
    >
      <Image
        src={item.image.thumbUrl}
        alt={item.title}
        fill
        sizes="150px"
        className="object-cover rounded-md"
      />
      {isSelected && (
        <div className="absolute inset-0 bg-primary/70 flex items-center justify-center">
            <Check className="h-8 w-8 text-primary-foreground" />
        </div>
      )}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
        <p className="text-white text-xs font-medium truncate">{item.title}</p>
      </div>
    </div>
  );
};

export function AddItemsFromRackModal({
  isOpen,
  onOpenChange,
  outfit,
}: AddItemsFromRackModalProps) {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  // For now, we fetch all items. For larger inventories, pagination would be needed.
  const { items: allItems, loading: itemsLoading } = useInventoryItems(user?.uid || null, null);
  
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const handleSelect = (itemId: string) => {
    setSelectedIds((prev) =>
      prev.includes(itemId)
        ? prev.filter((id) => id !== itemId)
        : [...prev, itemId]
    );
  };
  
  const filteredItems = useMemo(() => {
    if (!allItems) return [];
    const lowercasedTerm = searchTerm.toLowerCase();
    return allItems.filter(item => 
        (item.searchKeywords || []).some(keyword => keyword.toLowerCase().includes(lowercasedTerm)) ||
        item.title.toLowerCase().includes(lowercasedTerm) ||
        item.type.toLowerCase().includes(lowercasedTerm)
    ).filter(item => !outfit.linkedRackItemIds.includes(item.id)); // Exclude already linked items
  }, [allItems, searchTerm, outfit.linkedRackItemIds]);

  const handleAddItems = async () => {
    if (!firestore || selectedIds.length === 0) return;

    setIsSaving(true);
    try {
      await linkMultipleRackItemsToOutfit(firestore, outfit.id, selectedIds);
      toast({
        title: `${selectedIds.length} Item(s) Added`,
        description: 'The selected items have been linked to your outfit.',
      });
      setSelectedIds([]);
      onOpenChange(false);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Linking Failed',
        description: error.message,
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Add Items from My Rack</DialogTitle>
          <DialogDescription>
            Select one or more items to link to your outfit.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-shrink-0">
            <Input 
                placeholder="Search your rack..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
            />
        </div>

        <div className="flex-grow overflow-y-auto pr-2 -mr-6">
          {itemsLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {Array.from({ length: 10 }).map((_, i) => (
                <Skeleton key={i} className="aspect-square rounded-lg" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {filteredItems.map((item) => (
                <SelectableItemCard
                  key={item.id}
                  item={item}
                  isSelected={selectedIds.includes(item.id)}
                  onSelect={handleSelect}
                />
              ))}
            </div>
          )}
           {!itemsLoading && filteredItems.length === 0 && (
                <div className="flex items-center justify-center h-full text-center">
                    <p className="text-muted-foreground">No unlinked items found{searchTerm ? ' for "' + searchTerm + '"' : ''}.</p>
                </div>
            )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleAddItems} disabled={isSaving || selectedIds.length === 0}>
            {isSaving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Plus className="mr-2 h-4 w-4" />
            )}
            Add {selectedIds.length > 0 ? `${selectedIds.length} Item(s)` : 'Items'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
