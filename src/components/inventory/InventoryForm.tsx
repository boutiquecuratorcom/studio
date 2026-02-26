'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save } from 'lucide-react';
import React, { useState } from 'react';
import { createInventoryItem, updateInventoryItem, InventoryItem } from '@/lib/inventory';
import { ImageUploader } from './ImageUploader';
import { useUser, useFirestore, useStorage } from '@/firebase';
import { Checkbox } from '../ui/checkbox';

const allSizes = [
    'XXS', 'XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', 
    'OS', 'TC', 'TC2', 'Tween', 
    'Kids S/M', 'Kids L/XL',
    '2', '4', '6', '8', '10', '12', '14',
];

const inventoryFormSchema = z.object({
  title: z.string().min(3, { message: 'Title must be at least 3 characters.' }),
  type: z.string().min(2, { message: 'Type must be at least 2 characters.' }),
  sizes: z.array(z.string()).refine(value => value.length > 0, {
    message: "At least one size must be selected."
  }),
  notes: z.string().optional(),
});

type InventoryFormValues = z.infer<typeof inventoryFormSchema>;

type InventoryFormProps = {
  mode: 'create' | 'update';
  item?: InventoryItem;
  onSave: (itemId: string) => void;
};

export function InventoryForm({ mode, item, onSave }: InventoryFormProps) {
  const { user } = useUser();
  const firestore = useFirestore();
  const storage = useStorage();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);

  const form = useForm<InventoryFormValues>({
    resolver: zodResolver(inventoryFormSchema),
    defaultValues: {
      title: item?.title || '',
      type: item?.type || '',
      sizes: item?.sizes || [],
      notes: item?.notes || '',
    },
  });

  const onSubmit = async (values: InventoryFormValues) => {
    if (!user || !firestore || !storage) {
        toast({ variant: 'destructive', title: 'Error', description: 'User or Firebase services not available.' });
        return;
    }
    if (mode === 'create' && !imageFile) {
        toast({ variant: 'destructive', title: 'Image Required', description: 'Please upload an image for the new item.' });
        return;
    }
    
    setIsSaving(true);
    
    try {
        let itemId: string;
        const processedData = {
            ...values,
            brand: 'LuLaRoe', // Default brand
        };
        
        if (mode === 'create') {
            itemId = await createInventoryItem(firestore, storage, user, processedData, imageFile!);
            toast({ title: 'Item Created', description: `"${values.title}" has been added to your inventory.` });
        } else {
            if (!item) throw new Error('Item not found for update.');
            itemId = item.id;
            await updateInventoryItem(firestore, itemId, processedData);
            toast({ title: 'Item Updated', description: `"${values.title}" has been successfully updated.` });
        }
        onSave(itemId);
    } catch (error: any) {
        console.error('Failed to save inventory item:', error);
        toast({ variant: 'destructive', title: 'Save Failed', description: error.message || 'An unexpected error occurred.' });
    } finally {
        setIsSaving(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
        <div className="md:col-span-1 space-y-6">
            <FormField
              name="image"
              control={form.control}
              render={() => (
                <FormItem>
                  <FormLabel>Item Image</FormLabel>
                  <FormControl>
                    <ImageUploader 
                        onFileSelect={setImageFile}
                        existingImageUrl={mode === 'update' ? item?.image.thumbUrl : undefined}
                    />
                  </FormControl>
                   <FormDescription>
                    {mode === 'create' ? 'Upload a new image.' : 'Image cannot be changed after creation.'}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
        </div>
        <div className="md:col-span-2 space-y-6">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Item Title</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., LuLaRoe Amelia Dress" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Item Type</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Dress, Leggings, Top" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
            <FormField
                control={form.control}
                name="sizes"
                render={() => (
                    <FormItem>
                    <FormLabel>Sizes</FormLabel>
                    <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-y-3 gap-x-2 rounded-lg border p-4">
                        {allSizes.map((size) => (
                            <FormField
                                key={size}
                                control={form.control}
                                name="sizes"
                                render={({ field }) => {
                                return (
                                    <FormItem
                                    key={size}
                                    className="flex flex-row items-center space-x-2 space-y-0"
                                    >
                                    <FormControl>
                                        <Checkbox
                                        checked={field.value?.includes(size)}
                                        onCheckedChange={(checked) => {
                                            const currentSizes = field.value || [];
                                            if (checked) {
                                                field.onChange([...currentSizes, size]);
                                            } else {
                                                field.onChange(
                                                    currentSizes.filter(
                                                    (value) => value !== size
                                                    )
                                                );
                                            }
                                        }}
                                        />
                                    </FormControl>
                                    <FormLabel className="text-sm font-normal">
                                        {size}
                                    </FormLabel>
                                    </FormItem>
                                )
                                }}
                            />
                        ))}
                        </div>
                    <FormDescription>
                    Select one or more available sizes.
                    </FormDescription>
                    <FormMessage />
                </FormItem>
                )}
            />
          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Notes (Optional)</FormLabel>
                <FormControl>
                  <Textarea placeholder="Any internal notes about this item..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" size="lg" disabled={isSaving}>
            {isSaving ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Save className="mr-2 h-5 w-5" />}
            {mode === 'create' ? 'Save New Item' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
