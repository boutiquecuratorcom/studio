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
  FormDescription,
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
import { useOutfit, updateOutfit, type Outfit, type OutfitClaim, useInventoryItemsByIds, type CoverPreferences } from '@/lib/outfits';
import { useUser, useFirestore, useStorage, useDoc } from '@/firebase';
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
  Sparkles,
  Info,
  Cpu,
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import React, { useEffect, useMemo, useState } from 'react';
import { LinkedItemsList } from '@/components/outfits/LinkedItemsList';
import Link from 'next/link';
import Image from 'next/image';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { AddItemsFromRackModal } from '@/components/outfits/AddItemsFromRackModal';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { serverTimestamp, doc } from 'firebase/firestore';
import { Badge } from '@/components/ui/badge';
import { generateOutfitDescriptions } from '@/ai/flows/generate-outfit-descriptions-flow';
import { SimplifiedItem } from '@/ai/flows/generate-outfit-descriptions-flow';
import { enhanceImage, EnhanceImageInput } from '@/ai/flows/enhance-image-flow';
import { resizeImage } from '@/lib/image-utils';
import { GenerateCoverModal } from '@/components/outfits/GenerateCoverModal';

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
  internalNotes: z.string().optional(),
  storefrontDescription: z.string().optional(),
  socialCaption: z.string().optional(),
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
  const { items: linkedItems, loading: itemsLoading } = useInventoryItemsByIds(outfit?.linkedRackItemIds || []);
  
  const brandProfileRef = useMemo(() => {
    if (!user || !firestore) return null;
    return doc(firestore, `users/${user.uid}/brandProfile/main`);
  }, [user, firestore]);
  const { data: brandProfile } = useDoc(brandProfileRef);

  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isGeneratingDesc, setIsGeneratingDesc] = useState(false);
  const [addItemsModalOpen, setAddItemsModalOpen] = useState(false);
  const [coverModalOpen, setCoverModalOpen] = useState(false);
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
      internalNotes: '',
      storefrontDescription: '',
      socialCaption: '',
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
        internalNotes: outfit.internalNotes || '',
        storefrontDescription: outfit.storefrontDescription || '',
        socialCaption: outfit.socialCaption || '',
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

    const claimHasChanged = JSON.stringify(outfit.outfitClaim?.claim || {}) !== JSON.stringify(values.outfitClaim.claim);
    if (claimHasChanged) {
        dataToUpdate['outfitClaim.claim.updatedAt'] = serverTimestamp();
    }

    try {
      if (coverImageFile) {
        setIsUploading(true);
        const thumbResult = await resizeImage(coverImageFile, 400);

        const coverPath = `outfits/${user.uid}/${outfit.id}/cover-${Date.now()}`;
        const thumbPath = `outfits/${user.uid}/${outfit.id}/thumb-${Date.now()}`;
        
        const coverStorageRef = ref(storage, coverPath);
        const thumbStorageRef = ref(storage, thumbPath);

        await Promise.all([
            uploadBytes(coverStorageRef, coverImageFile),
            uploadBytes(thumbStorageRef, thumbResult.blob)
        ]);

        const [imageUrl, thumbUrl] = await Promise.all([
            getDownloadURL(coverStorageRef),
            getDownloadURL(thumbStorageRef)
        ]);
        
        dataToUpdate.cover = {
            ...outfit.cover,
            imageUrl: imageUrl,
            thumbUrl: thumbUrl, 
            storagePath: coverPath,
            thumbStoragePath: thumbPath,
            source: 'manual',
            glowUpId: null,
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
  
    const analysisIsPending = useMemo(() => {
        if (itemsLoading || !linkedItems || linkedItems.length < 2) return false;
        return linkedItems.some(item => !item.analysis || item.analysis.status === 'pending');
    }, [linkedItems, itemsLoading]);
  
    const handleGenerateDescriptions = async () => {
        if (!linkedItems || linkedItems.length < 2) {
            toast({ variant: 'destructive', title: 'Not enough items', description: 'Add at least 2 items to generate descriptions.'});
            return;
        }
        if (analysisIsPending) {
             toast({ variant: 'destructive', title: 'Analysis Incomplete', description: 'Please wait for all linked items to be analyzed.'});
            return;
        }
        setIsGeneratingDesc(true);
        try {
            const simplifiedItems: SimplifiedItem[] = linkedItems.map(item => ({
                title: item.title,
                type: item.type,
                analysis: item.analysis ? {
                    dominantColors: item.analysis.dominantColors,
                    patternType: item.analysis.patternType,
                    styleVibe: item.analysis.styleVibe,
                    tags: item.analysis.tags,
                } : undefined,
            }));

            const plainBrandProfile = brandProfile ? JSON.parse(JSON.stringify(brandProfile)) : undefined;

            const result = await generateOutfitDescriptions({
                items: simplifiedItems,
                brandProfile: plainBrandProfile,
            });

            setValue('storefrontDescription', result.storefrontDescription, { shouldDirty: true });
            setValue('socialCaption', result.socialCaption, { shouldDirty: true });

            await updateOutfit(firestore, id, {
                storefrontDescription: result.storefrontDescription,
                socialCaption: result.socialCaption,
                descriptionLastGeneratedAt: serverTimestamp(),
            });

            toast({ title: 'AI Descriptions Generated!', description: 'Your marketing copy is ready.' });
        } catch (error: any) {
            console.error('Failed to generate descriptions:', error);
            toast({ variant: 'destructive', title: 'Generation Failed', description: error.message });
        } finally {
            setIsGeneratingDesc(false);
        }
    };
    
    const handleGenerateCover = async (prefs: CoverPreferences) => {
        if (!storage || !firestore || !user || !outfit || !linkedItems || linkedItems.length < 2) {
            toast({ variant: 'destructive', title: 'Not Ready', description: 'Add at least 2 items with images to generate a cover.'});
            return;
        }

        try {
            await updateOutfit(firestore, outfit.id, { 
                cover: {
                    ...outfit.cover,
                    status: 'generating',
                    prefs,
                    error: null,
                }
            });

            const imageUris = linkedItems.map(item => item.originalImageDetails?.originalUrl || item.image.originalUrl).filter(Boolean);
            if (imageUris.length < 2) {
                throw new Error("Not enough valid original images found on linked items.");
            }

            const input: EnhanceImageInput = {
                imageDataUris: imageUris,
                creationType: 'multiple',
                styleType: 'flat-lay', // Outfit covers are always flat-lay for now
                lookPreset: prefs.preset as any,
                accessories: prefs.accessories as any,
                layout: prefs.layout as any,
            };
            const result = await enhanceImage(input);

            if (result.isFallback || !result.enhancedImageDataUri) {
                throw new Error("AI studio is busy or failed to generate an image.");
            }

            const dataUri = result.enhancedImageDataUri;
            const blob = await (await fetch(dataUri)).blob();
            const thumbResult = await resizeImage(new File([blob], 'cover.png'), 400);

            const coverPath = `outfits/${user.uid}/${outfit.id}/cover-${Date.now()}.png`;
            const thumbPath = `outfits/${user.uid}/${outfit.id}/thumb-${Date.now()}.png`;
            
            const coverRef = ref(storage, coverPath);
            const thumbRef = ref(storage, thumbPath);

            await Promise.all([
                uploadBytes(coverRef, blob),
                uploadBytes(thumbRef, thumbResult.blob)
            ]);

            const [imageUrl, thumbUrl] = await Promise.all([
                getDownloadURL(coverRef),
                getDownloadURL(thumbRef)
            ]);
            
            const coverData = {
                imageUrl,
                thumbUrl,
                storagePath: coverPath,
                thumbStoragePath: thumbPath,
                source: 'ai' as const,
                glowUpId: null,
                generatedAt: serverTimestamp(),
                status: 'completed' as const,
                error: null,
                prefs,
            };

            await updateOutfit(firestore, outfit.id, { cover: coverData });
            setCoverImagePreview(imageUrl);

            toast({ title: 'AI Cover Generated!', description: 'Your new outfit cover image has been saved.' });
        } catch (error: any) {
            console.error('Failed to generate cover:', error);
            await updateOutfit(firestore, outfit.id, { 
                'cover.status': 'error',
                'cover.error': error.message 
            });
            toast({ variant: 'destructive', title: 'Cover Generation Failed', description: error.message });
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

  const canGenerate = linkedItems && linkedItems.length >= 2;

  return (
    <>
    <AddItemsFromRackModal
        isOpen={addItemsModalOpen}
        onOpenChange={setAddItemsModalOpen}
        outfit={outfit}
    />
    <GenerateCoverModal
        isOpen={coverModalOpen}
        onOpenChange={setCoverModalOpen}
        onGenerate={handleGenerateCover}
        currentPrefs={outfit.cover?.prefs}
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
            <Button type="submit" size="lg" disabled={isSaving || isUploading || outfit.cover?.status === 'generating' || isGeneratingDesc}>
              {isSaving || isUploading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Save className="mr-2 h-5 w-5" />}
              {isUploading ? 'Uploading...' : isSaving ? 'Saving...' : 'Save Outfit'}
            </Button>
          </header>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            <div className="lg:col-span-2 space-y-6">
              
               <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2"><Layers className="h-5 w-5" /> Linked Items</CardTitle>
                    <div className="flex items-center gap-2">
                        <Button asChild variant="outline" type="button">
                            <Link href={`/inventory/add?source=outfit&outfitId=${outfit.id}`}>
                                <UploadCloud className="mr-2 h-4 w-4" />
                                Upload New Item
                            </Link>
                        </Button>
                      <Button type="button" onClick={() => setAddItemsModalOpen(true)}>
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

              <Card>
                 <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <CardTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-accent" /> AI Marketing Kit</CardTitle>
                            <CardDescription>Generate descriptions for your storefront and social media.</CardDescription>
                        </div>
                         <Button type="button" onClick={handleGenerateDescriptions} disabled={!canGenerate || isGeneratingDesc || itemsLoading || analysisIsPending}>
                            {isGeneratingDesc ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
                            {isGeneratingDesc ? 'Generating...' : outfit?.descriptionLastGeneratedAt ? 'Re-generate' : 'Generate'}
                        </Button>
                    </div>
                </CardHeader>
                 <CardContent className="space-y-6">
                    {!canGenerate ? (
                        <Alert className="bg-muted/50">
                            <Info className="h-4 w-4" />
                            <AlertTitle>Add More Items</AlertTitle>
                            <AlertDescription>
                                You need at least 2 linked items in this outfit to generate AI descriptions.
                            </AlertDescription>
                        </Alert>
                    ) : analysisIsPending ? (
                        <Alert className="bg-muted/50">
                            <Cpu className="h-4 w-4" />
                            <AlertTitle>Analysis in Progress</AlertTitle>
                            <AlertDescription>
                                Some linked items are still being analyzed by the AI. Description generation will be available once complete.
                            </AlertDescription>
                        </Alert>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                             <FormField
                                control={control} name="storefrontDescription"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Storefront Description</FormLabel>
                                    <FormControl>
                                    <Textarea placeholder="A compelling, product-focused description for an e-commerce storefront..." {...field} rows={6} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                            <FormField
                                control={control} name="socialCaption"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Social Media Caption</FormLabel>
                                    <FormControl>
                                    <Textarea placeholder="A short, punchy, and engaging caption for social media..." {...field} rows={6} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                        </div>
                    )}
                 </CardContent>
              </Card>
              
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
                    control={control} name="internalNotes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Internal Notes</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Private notes about this outfit..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

            </div>
            <div className="lg:col-span-1 space-y-6 sticky top-12">
              <Card>
                <CardHeader>
                  <CardTitle>Outfit Cover Image</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="aspect-square w-full relative bg-muted rounded-lg flex items-center justify-center">
                        {coverImagePreview ? (
                            <Image src={coverImagePreview} alt="Outfit cover" fill className="object-cover rounded-lg" />
                        ) : (
                            <ImageIcon className="h-12 w-12 text-muted-foreground" />
                        )}
                         {outfit?.cover?.status === 'generating' && (
                            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center text-center p-4 rounded-lg">
                                <Loader2 className="h-8 w-8 animate-spin mb-2 text-primary" />
                                <p className="font-medium text-foreground">Generating AI Cover...</p>
                                <p className="text-sm text-muted-foreground">This can take a minute.</p>
                            </div>
                        )}
                         {outfit?.cover?.status === 'error' && (
                            <div className="absolute inset-0 bg-destructive/80 backdrop-blur-sm flex flex-col items-center justify-center text-center p-4 rounded-lg">
                                <AlertTriangle className="h-8 w-8 mb-2 text-destructive-foreground" />
                                <p className="font-medium text-destructive-foreground">Generation Failed</p>
                                {outfit.cover.error && <p className="text-xs text-destructive-foreground/80 mt-1">{outfit.cover.error}</p>}
                            </div>
                         )}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <Button type="button" variant="outline" onClick={() => document.getElementById('cover-upload')?.click()}>
                            <UploadCloud className="mr-2 h-4 w-4" /> Upload
                        </Button>
                        <input type="file" id="cover-upload" accept="image/*" className="hidden" onChange={handleCoverImageSelect} />
                        <Button type="button" variant="outline" onClick={() => setCoverModalOpen(true)} disabled={!canGenerate || outfit?.cover?.status === 'generating'}>
                            <Wand2 className="mr-2 h-4 w-4" />
                            {outfit?.cover?.imageUrl ? 'Re-generate' : 'AI Generate'}
                        </Button>
                    </div>
                     {!canGenerate && (
                        <p className="text-xs text-center text-muted-foreground">Add 2+ items to enable AI generation.</p>
                     )}
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
