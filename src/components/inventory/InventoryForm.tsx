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
import { Link2, Loader2, Save, Wand2 } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { createInventoryItem, createInventoryItemFromGlowUpForm, type InventoryItem, updateInventoryItem, type ClaimDetails } from '@/lib/inventory';
import { ImageUploader } from './ImageUploader';
import { useUser, useFirestore, useStorage } from '@/firebase';
import { Checkbox } from '../ui/checkbox';
import type { GlowUpPrefillData } from '@/app/(app)/inventory/add/page';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { serverTimestamp } from 'firebase/firestore';

const allSizes = [
    'XXS', 'XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', 
    'OS', 'TC', 'TC2', 'Tween', 
    'Kids S/M', 'Kids L/XL',
    '2', '4', '6', '8', '10', '12', '14',
];

const claimMethods = [
  { value: 'none', label: 'None' },
  { value: 'custom_url', label: 'Custom URL' },
  { value: 'messenger', label: 'Messenger' },
  { value: 'facebook_page', label: 'Facebook Page' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'sonlet_manual', label: 'Sonlet Link (Manual)' },
] as const;

const inventoryFormSchema = z.object({
  title: z.string().min(3, { message: 'Title must be at least 3 characters.' }),
  type: z.string().min(2, { message: 'Type must be at least 2 characters.' }),
  sizes: z.array(z.string()).refine(value => value.length > 0, {
    message: "At least one size must be selected."
  }),
  notes: z.string().optional(),
  claim: z.object({
    mode: z.enum(['none', 'custom_url', 'messenger', 'facebook_page', 'whatsapp', 'sonlet_manual']),
    url: z.string().url({ message: "Please enter a valid URL." }).optional().or(z.literal('')),
    label: z.string().optional().or(z.literal('')),
  }).optional(),
}).refine(data => {
  if (data.claim?.mode && data.claim.mode !== 'none' && !data.claim.url) {
    return false;
  }
  return true;
}, {
  message: "A URL is required for this claim method.",
  path: ['claim.url'],
});


type InventoryFormValues = z.infer<typeof inventoryFormSchema>;

type InventoryFormProps = {
  mode: 'create' | 'update';
  item?: InventoryItem;
  onSave: (itemId: string) => void;
  glowUpData?: GlowUpPrefillData | null;
};

export function InventoryForm({ mode, item, onSave, glowUpData }: InventoryFormProps) {
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
      claim: item?.claim || { mode: 'none', url: '', label: '' },
    },
  });

  const watchClaimMode = form.watch('claim.mode');

  useEffect(() => {
    const defaultLabels: Record<ClaimDetails['mode'], string> = {
      'none': '',
      'custom_url': 'Shop Now',
      'messenger': 'Claim in Messenger',
      'facebook_page': 'View on Facebook',
      'whatsapp': 'Message on WhatsApp',
      'sonlet_manual': 'Shop on Sonlet',
    };
    
    const currentLabel = form.getValues('claim.label') || '';
    const isDefaultLabel = Object.values(defaultLabels).includes(currentLabel);
    
    if (watchClaimMode && (currentLabel === '' || isDefaultLabel)) {
      form.setValue('claim.label', defaultLabels[watchClaimMode], { shouldDirty: true });
    }
  }, [watchClaimMode, form]);

  const onSubmit = async (values: InventoryFormValues) => {
    if (!user || !firestore || !storage) {
        toast({ variant: 'destructive', title: 'Error', description: 'User or Firebase services not available.' });
        return;
    }

    setIsSaving(true);
    
    try {
        let itemId: string;

        const claimHasChanged = JSON.stringify(item?.claim || { mode: 'none', url: '', label: '' }) !== JSON.stringify(values.claim || { mode: 'none', url: '', label: '' });
        let dataWithTimestamp = { ...values } as any;

        if (values.claim) {
          if (claimHasChanged) {
            dataWithTimestamp.claim.updatedAt = serverTimestamp();
          }
          if (values.claim.mode === 'none') {
            dataWithTimestamp.claim.url = null;
            dataWithTimestamp.claim.label = null;
          }
        }


        if (glowUpData) {
            itemId = await createInventoryItemFromGlowUpForm(firestore, user, dataWithTimestamp, glowUpData);
            toast({ title: 'Item Added!', description: `"${values.title}" has been added to My Rack from your Glow-Up.` });
        } else if (mode === 'create') {
            if (!imageFile) {
                toast({ variant: 'destructive', title: 'Image Required', description: 'Please upload an image for the new item.' });
                setIsSaving(false);
                return;
            }
            const processedData = { ...dataWithTimestamp, brand: 'LuLaRoe' };
            itemId = await createInventoryItem(firestore, storage, user, processedData, imageFile);
            toast({ title: 'Item Added', description: `"${values.title}" has been added to My Rack.` });
        } else {
            if (!item) throw new Error('Item not found for update.');
            itemId = item.id;
            
            await updateInventoryItem(firestore, itemId, dataWithTimestamp);
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

  const urlPlaceholders: Record<string, string> = {
    messenger: 'e.g., m.me/your-page-name',
    whatsapp: 'e.g., wa.me/1234567890',
  }

  return (
    <Form {...form}>
      {glowUpData && (
        <Alert className="mb-6 border-accent/50 bg-accent/5 text-accent-foreground">
          <Wand2 className="h-4 w-4 !text-accent" />
          <AlertTitle>Adding from a Glow-Up!</AlertTitle>
          <AlertDescription>
            Your enhanced image is ready. Add the item details below to save it to My Rack.
          </AlertDescription>
        </Alert>
      )}
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
                        existingImageUrl={glowUpData?.outputThumbUrl || item?.image.thumbUrl}
                    />
                  </FormControl>
                   <FormDescription>
                    {mode === 'create' && !glowUpData ? 'Upload a new image.' : 'Image cannot be changed after creation.'}
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

          <Card>
            <CardHeader>
              <CardTitle>Claim Destination</CardTitle>
              <CardDescription>Set a call-to-action for this item.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="claim.mode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Claim Method</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a claim method" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {claimMethods.map(method => (
                          <SelectItem key={method.value} value={method.value}>{method.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {watchClaimMode && watchClaimMode !== 'none' && (
                <>
                  <FormField
                    control={form.control}
                    name="claim.url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Claim URL</FormLabel>
                        <div className="relative">
                          <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <FormControl>
                            <Input placeholder={urlPlaceholders[watchClaimMode] || 'https://...'} {...field} value={field.value || ''} className="pl-10" />
                          </FormControl>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="claim.label"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Button Label</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Shop Now" {...field} value={field.value || ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}
            </CardContent>
          </Card>


          <Button type="submit" size="lg" disabled={isSaving}>
            {isSaving ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Save className="mr-2 h-5 w-5" />}
            {mode === 'create' ? 'Add to My Rack' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
