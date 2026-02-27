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
import { useOutfit, updateOutfit, type Outfit } from '@/lib/outfits';
import { useFirestore, useStorage, useUser } from '@/firebase';
import {
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

const outfitFormSchema = z.object({
  title: z.string().min(1, { message: 'Title is required.' }),
  notes: z.string().optional(),
  status: z.enum(['draft', 'published']),
  claimDestination: z.enum(['sonlet', 'comment_sold', 'facebook_live', 'messenger', 'custom']).optional(),
  claimUrl: z.string().url().optional().or(z.literal('')),
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

  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(null);


  const form = useForm<OutfitFormValues>({
    resolver: zodResolver(outfitFormSchema),
    defaultValues: {
      title: '',
      notes: '',
      status: 'draft',
      claimDestination: undefined,
      claimUrl: '',
    },
  });
  
  const { reset, watch, handleSubmit, control } = form;
  const watchClaimDestination = watch('claimDestination');

  useEffect(() => {
    if (outfit) {
      reset({
        title: outfit.title || '',
        notes: outfit.notes || '',
        status: outfit.status || 'draft',
        claimDestination: outfit.claimDestination || undefined,
        claimUrl: outfit.claimUrl || '',
      });
      setCoverImagePreview(outfit.cover?.imageUrl || null);
    }
  }, [outfit, reset]);

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
    let dataToUpdate: Partial<Outfit> = { ...values };

    try {
      // Handle cover image upload if a new one was selected
      if (coverImageFile) {
        setIsUploading(true);
        const coverPath = `outfits/${outfit.id}/cover-${Date.now()}`;
        const storageRef = ref(storage, coverPath);
        await uploadBytes(storageRef, coverImageFile);
        const downloadURL = await getDownloadURL(storageRef);
        
        dataToUpdate.cover = {
            ...(outfit.cover || {}),
            imageUrl: downloadURL,
            // In a real app, we'd generate a thumb here too
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
              {/* Main Details Card */}
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

              {/* Linked Items Card */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2"><Layers className="h-5 w-5" /> Linked Items</CardTitle>
                    <Button type="button" variant="outline" onClick={() => setIsModalOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add from My Rack
                    </Button>
                  </div>
                  <CardDescription>The individual rack items that make up this outfit.</CardDescription>
                </CardHeader>
                <CardContent>
                    <LinkedItemsList outfitId={outfit.id} linkedItemIds={outfit.linkedRackItemIds} />
                </CardContent>
              </Card>

              {/* Claim Links Card */}
               <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><LinkIcon className="h-5 w-5" /> Claim Destination</CardTitle>
                    <CardDescription>Set a primary claim link for this entire outfit.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                   <FormField
                        control={control} name="claimDestination"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Claim Method</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl><SelectTrigger><SelectValue placeholder="Select a method" /></SelectTrigger></FormControl>
                                <SelectContent>
                                    <SelectItem value="comment_sold">Comment "Sold"</SelectItem>
                                    <SelectItem value="sonlet">Sonlet Link</SelectItem>
                                    <SelectItem value="facebook_live">Facebook Live</SelectItem>
                                    <SelectItem value="messenger">Messenger</SelectItem>
                                    <SelectItem value="custom">Custom URL</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    {watchClaimDestination === 'custom' && (
                         <FormField
                            control={control} name="claimUrl"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Custom URL</FormLabel>
                                <FormControl>
                                <Input placeholder="https://your-claim-link.com" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                    )}
                </CardContent>
              </Card>

            </div>
            <div className="md:col-span-1 space-y-6 sticky top-12">
               {/* Cover Image Card */}
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

               {/* Status Card */}
               <Card>
                <CardHeader><CardTitle>Visibility</CardTitle></CardHeader>
                <CardContent>
                     <FormField
                        control={control} name="status"
                        render={({ field }) => (
                        <FormItem>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl><SelectTrigger><SelectValue placeholder="Select a status" /></SelectTrigger></FormControl>
                                <SelectContent>
                                    <SelectItem value="draft">Draft</SelectItem>
                                    <SelectItem value="published">Published</SelectItem>
                                </SelectContent>
                            </Select>
                             <FormDescription className="pt-2">"Published" outfits may appear on public-facing pages in the future.</FormDescription>
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
