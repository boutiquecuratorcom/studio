'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useOutfit, updateOutfit, type Outfit, type OutfitClaim, type InventoryItem, useInventoryItemsByIds } from '@/lib/outfits';
import { useUser, useFirestore, useStorage } from '@/firebase';
import {
  AlertTriangle,
  ArrowLeft,
  ImageIcon,
  Layers,
  Link as LinkIcon,
  Loader2,
  Plus,
  Save,
  UploadCloud,
  Wand2,
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { LinkedItemsList } from '@/components/outfits/LinkedItemsList';
import Link from 'next/link';
import Image from 'next/image';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { AddItemsFromRackModal } from '@/components/outfits/AddItemsFromRackModal';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { serverTimestamp } from 'firebase/firestore';
import { Badge } from '@/components/ui/badge';

const claimMethods = [
  { value: 'none', label: 'None' },
  { value: 'custom_url', label: 'Custom URL' },
  { value: 'messenger', label: 'Messenger' },
  { value: 'facebook_page', label: 'Facebook Page' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'sonlet_manual', label: 'Sonlet Link (Manual)' },
] as const;

const outfitFormSchema = z.object({
  title: z.string().min(1, { message: 'Title is required.' }),
  notes: z.string().optional(),
  status: z.enum(['draft', 'published']),
  outfitClaim: z.object({
    mode: z.enum(['individual', 'outfit']),
    claim: z.object({
        mode: z.enum(['none', 'custom_url', 'messenger', 'facebook_page', 'whatsapp', 'sonlet_manual']),
        url: z.string().url({ message: "Please enter a valid URL." }).optional().or(z.literal('')),
        label: z.string().optional().or(z.literal('')),
    })
  }),
});

type OutfitFormValues = z.infer<typeof outfitFormSchema>;

export default function EditOutfitPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { user } = useUser();
  const firestore = useFirestore();
  const storage = useStorage();
  const { toast } = useToast();
  
  const { data: outfit, loading, error } = useOutfit(id);
  const { items: linkedItems } = useInventoryItemsByIds(outfit?.linkedRackItemIds || []);


  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(null);

  const defaultOutfitClaim: OutfitClaim = {
    mode: 'individual',
    claim: {
        mode: 'none',
        url: '',
        label: '',
    }
  };

  const form = useForm<OutfitFormValues>({
    resolver: zodResolver(outfitFormSchema),
    defaultValues: {
      title: '',
      notes: '',
      status: 'draft',
      outfitClaim: defaultOutfitClaim,
    },
  });
  
  const { reset, watch, handleSubmit, control, setValue, getValues } = form;
  const watchOutfitClaim = watch('outfitClaim');
  const watchClaimMethod = watch('outfitClaim.claim.mode');

  useEffect(() => {
    if (outfit) {
      reset({
        title: outfit.title || '',
        notes: outfit.notes || '',
        status: outfit.status || 'draft',
        outfitClaim: outfit.outfitClaim || defaultOutfitClaim,
      });
      setCoverImagePreview(outfit.cover?.imageUrl || null);
    }
  }, [outfit, reset]);
  
    useEffect(() => {
    const defaultLabels: Record<typeof claimMethods[number]['value'], string> = {
      'none': '',
      'custom_url': 'Shop Now',
      'messenger': 'Claim in Messenger',
      'facebook_page': 'View on Facebook',
      'whatsapp': 'Message on WhatsApp',
      'sonlet_manual': 'Shop on Sonlet',
    };
    
    const currentLabel = getValues('outfitClaim.claim.label') || '';
    const isDefaultLabel = Object.values(defaultLabels).includes(currentLabel);
    
    if (watchClaimMethod && (currentLabel === '' || isDefaultLabel)) {
      setValue('outfitClaim.claim.label', defaultLabels[watchClaimMethod], { shouldDirty: true });
    }
  }, [watchClaimMethod, setValue, getValues]);


  const handleCoverImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({ variant: 'destructive', title: 'Image too large', description: 'Please select an image under 5MB.' });
        return;
      }
      setCoverImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSave = async (values: OutfitFormValues) => {
    if (!firestore || !user || !outfit) return;

    setIsSaving(true);
    let dataToUpdate: Partial<Outfit> & { 'outfitClaim.claim.updatedAt'?: any } = { ...values };

    // Handle claim timestamp
    const claimHasChanged = JSON.stringify(outfit.outfitClaim?.claim || {}) !== JSON.stringify(values.outfitClaim.claim);
    if (claimHasChanged) {
        dataToUpdate['outfitClaim.claim.updatedAt'] = serverTimestamp();
    }

    try {
      if (coverImageFile) {
        setIsUploading(true);
        const coverPath = `outfits/${outfit.id}/cover-${Date.now()}`;
        const storageRef = ref(storage, coverPath);
        await uploadBytes(storageRef, coverImageFile);
        const downloadURL = await getDownloadURL(storageRef);
        
        dataToUpdate.cover = {
            ...(outfit.cover || {}),
            imageUrl: downloadURL,
            thumbUrl: downloadURL, 
        };
        setIsUploading(false);
      }

      await updateOutfit(firestore, outfit.id, dataToUpdate);
      toast({ title: 'Outfit Saved!', description: 'Your changes have been saved successfully.' });
    } catch (error: any) {
      console.error('Failed to save outfit:', error);
      toast({ variant: 'destructive', title: 'Save Failed', description: error.message });
    } finally {
      setIsSaving(false);
    }
  };
  
    const urlPlaceholders: Record<string, string> = {
        messenger: 'e.g., m.me/your-page-name',
        whatsapp: 'e.g., wa.me/1234567890',
    }

    const incompleteClaimItems = linkedItems?.filter(item => !item.claim || item.claim.mode === 'none' || (item.claim.mode !== 'none' && !item.claim.url));


  if (loading) {
    return (
      <div className="flex-1 p-8 sm:p-10 lg:p-12">
        <header className="mb-12">
          <Skeleton className="h-16 w-96 mb-4" />
          <Skeleton className="h-7 w-full max-w-md" />
        </header>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-6">
                <Skeleton className="h-64 w-full" />
                <Skeleton className="h-48 w-full" />
            </div>
            <div className="md:col-span-1">
                <Skeleton className="h-80 w-full" />
            </div>
        </div>
      </div>
    );
  }

  if (error || !outfit) {
    return (
      <div className="flex-1 p-8 text-center">
        <p className="text-destructive mt-10">
          {error ? `Error: ${error.message}` : 'Outfit not found.'}
        </p>
      </div>
    );
  }

  return (
    <>
    <AddItemsFromRackModal
        isOpen={isModalOpen}
        onOpenChange={setIsModalOpen}
        outfit={outfit}
    />
    <div className="flex-1 p-8 sm:p-10 lg:p-12">
      <Form {...form}>
        <form onSubmit={handleSubmit(onSave)}>
          <header className="mb-12 flex flex-wrap items-center justify-between gap-4">
            <div>
              <Link href="/outfits" className="flex items-center text-sm text-muted-foreground hover:text-foreground mb-3">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Outfits
              </Link>
              <h1 className="text-5xl lg:text-6xl font-bold tracking-tight">
                Outfit Editor
              </h1>
            </div>
            <Button type="submit" size="lg" disabled={isSaving || isUploading}>
              {isSaving || isUploading ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <Save className="mr-2 h-5 w-5" />
              )}
              {isUploading ? 'Uploading Image...' : isSaving ? 'Saving...' : 'Save Outfit'}
            </Button>
          </header>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
            <div className="md:col-span-2 space-y-6">
              <Card>
                <CardHeader><CardTitle>Outfit Details</CardTitle></CardHeader>
                <CardContent className="space-y-6">
                  <FormField
                    control={control} name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Outfit Title</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Spring Floral Casual Set" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={control} name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea placeholder="A description for your storefront, social media posts, etc." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2"><Layers className="h-5 w-5" /> Linked Items</CardTitle>
                    <div className="flex items-center gap-2">
                      <Button asChild variant="outline">
                          <Link href={`/inventory/add?source=outfit&outfitId=${outfit.id}`}>
                              <UploadCloud className="mr-2 h-4 w-4" />
                              Upload New Item
                          </Link>
                      </Button>
                      <Button type="button" onClick={() => setIsModalOpen(true)}>
                          <Plus className="mr-2 h-4 w-4" />
                          Add from My Rack
                      </Button>
                    </div>
                  </div>
                  <CardDescription>The individual rack items that make up this outfit.</CardDescription>
                </CardHeader>
                <CardContent>
                    <LinkedItemsList outfitId={outfit.id} linkedItemIds={outfit.linkedRackItemIds} />
                </CardContent>
              </Card>

              <Card>
                 <CardHeader>
                    <CardTitle className="flex items-center gap-2"><LinkIcon className="h-5 w-5" /> Claim Destination</CardTitle>
                    <CardDescription>Set how customers will claim or purchase this outfit.</CardDescription>
                </CardHeader>
                <CardContent>
                    <FormField
                        control={control}
                        name="outfitClaim.mode"
                        render={({ field }) => (
                            <FormItem>
                                <Tabs
                                    value={field.value}
                                    onValueChange={field.onChange}
                                >
                                    <TabsList className="grid w-full grid-cols-2">
                                        <TabsTrigger value="individual">Individual Claim</TabsTrigger>
                                        <TabsTrigger value="outfit">Outfit Claim</TabsTrigger>
                                    </TabsList>
                                    <TabsContent value="individual" className="pt-4">
                                        <Card className="bg-muted/50 p-4">
                                            <p className="text-sm text-muted-foreground mb-4">This mode uses the individual Claim Destination set on each linked item. This is recommended for flexibility.</p>
                                             {incompleteClaimItems && incompleteClaimItems.length > 0 && (
                                                <Alert variant="destructive" className="mb-4">
                                                    <AlertTriangle className="h-4 w-4" />
                                                    <AlertTitle>Incomplete Claims</AlertTitle>
                                                    <AlertDescription>
                                                        {incompleteClaimItems.length} linked item(s) do not have a claim destination set. They will not have a claim button.
                                                    </AlertDescription>
                                                </Alert>
                                            )}
                                            <div className="space-y-2">
                                                {linkedItems?.map(item => (
                                                    <div key={item.id} className="flex items-center justify-between text-sm p-2 rounded-md bg-background/50">
                                                        <span className="font-medium truncate pr-4">{item.title}</span>
                                                        <Badge variant={item.claim?.mode === 'none' || !item.claim ? 'destructive' : 'secondary'}>
                                                            {item.claim?.mode?.replace(/_/g, ' ') || 'None'}
                                                        </Badge>
                                                    </div>
                                                ))}
                                            </div>
                                        </Card>
                                    </TabsContent>
                                    <TabsContent value="outfit" className="pt-4 space-y-4">
                                        <p className="text-sm text-muted-foreground">This mode sets one primary claim link for the entire outfit, overriding individual item links.</p>
                                        <FormField
                                            control={control}
                                            name="outfitClaim.claim.mode"
                                            render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Claim Method</FormLabel>
                                                <Select onValueChange={field.onChange} value={field.value}>
                                                <FormControl>
                                                    <SelectTrigger><SelectValue placeholder="Select a claim method" /></SelectTrigger>
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
                                        {watchOutfitClaim.claim.mode && watchOutfitClaim.claim.mode !== 'none' && (
                                            <>
                                                <FormField
                                                    control={control}
                                                    name="outfitClaim.claim.url"
                                                    render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Claim URL</FormLabel>
                                                        <div className="relative">
                                                        <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                        <FormControl>
                                                            <Input placeholder={urlPlaceholders[watchOutfitClaim.claim.mode] || 'https://...'} {...field} value={field.value || ''} className="pl-10" />
                                                        </FormControl>
                                                        </div>
                                                        <FormMessage />
                                                    </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={control}
                                                    name="outfitClaim.claim.label"
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
                                    </TabsContent>
                                </Tabs>
                            </FormItem>
                        )}
                    />
                </CardContent>
              </Card>

            </div>
            <div className="md:col-span-1 space-y-6 sticky top-12">
              <Card>
                <CardHeader><CardTitle>Outfit Image</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    <div className="aspect-square w-full relative bg-muted rounded-lg flex items-center justify-center">
                        {coverImagePreview ? (
                            <Image src={coverImagePreview} alt="Outfit cover" fill className="object-cover rounded-lg" />
                        ) : (
                            <ImageIcon className="h-12 w-12 text-muted-foreground" />
                        )}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <Button type="button" variant="outline" onClick={() => document.getElementById('cover-upload')?.click()}>
                            <UploadCloud className="mr-2 h-4 w-4" /> Upload
                        </Button>
                        <input type="file" id="cover-upload" accept="image/*" className="hidden" onChange={handleCoverImageSelect} />
                        <Button type="button" variant="outline" disabled>
                            <Wand2 className="mr-2 h-4 w-4" /> Regenerate
                        </Button>
                    </div>
                </CardContent>
              </Card>

               <Card>
                <CardHeader><CardTitle>Visibility</CardTitle></CardHeader>
                <CardContent>
                     <FormField
                        control={control} name="status"
                        render={({ field }) => (
                        <FormItem>
                            <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl><SelectTrigger><SelectValue placeholder="Select a status" /></SelectTrigger></FormControl>
                                <SelectContent>
                                    <SelectItem value="draft">Draft</SelectItem>
                                    <SelectItem value="published">Published</SelectItem>
                                </SelectContent>
                            </Select>
                             <p className="text-xs text-muted-foreground pt-2">"Published" outfits may appear on public-facing pages in the future.</p>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </Form>
    </div>
    </>
  );
}

    