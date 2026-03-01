'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
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
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useDoc, useFirestore, useStorage, useUser } from '@/firebase';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import {
  Building,
  Camera,
  Heart,
  Image as ImageIcon,
  Loader2,
  Megaphone,
  Palette,
  Sparkles,
  UploadCloud,
  Save,
} from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ALL_FONTS,
  DEFAULT_FONTS,
  FontDefinition,
  getFontByName,
  normalizeFontName,
} from '@/lib/fonts';
import { logBrandProfile } from '@/lib/debug/logBrandProfile';

/**
 * Accepts:
 *  - "#RGB" shorthand
 *  - "#RRGGBB"
 * Returns:
 *  - normalized "#RRGGBB" or "" if invalid
 */
function normalizeHexColor(input: string | undefined | null): string {
  const raw = (input ?? '').trim();
  if (!raw) return '';

  const withHash = raw.startsWith('#') ? raw : `#${raw}`;

  const m3 = withHash.match(/^#([0-9a-fA-F]{3})$/);
  if (m3) {
    const [r, g, b] = m3[1].split('');
    return `#${r}${r}${g}${g}${b}${b}`.toUpperCase();
  }

  const m6 = withHash.match(/^#([0-9a-fA-F]{6})$/);
  if (m6) return `#${m6[1].toUpperCase()}`;

  return '';
}

// --- Zod Schema for Validation ---
const brandProfileSchema = z.object({
  brandName: z.string().optional(),
  tagline: z.string().optional(),
  location: z.string().optional(),
  websiteUrl: z.string().url().optional().or(z.literal('')),
  instagramUrl: z.string().url().optional().or(z.literal('')),
  facebookUrl: z.string().url().optional().or(z.literal('')),
  toneOfVoice: z
    .enum([
      'Warm & Friendly',
      'Witty',
      'Southern',
      'High-Fashion',
      'Minimal',
      'Bold',
      'Playful',
    ])
    .optional(),
  brandVibe: z
    .enum(['Cozy Boutique', 'Modern Minimal', 'Luxury Editorial', 'Trendy Pop'])
    .optional(),
  targetCustomer: z
    .enum([
      'Moms',
      'Young Professionals',
      'Size-Inclusive Shoppers',
      'Athleisure Lovers',
      'Modest Fashion',
      'Mixed',
    ])
    .optional(),
  primaryGoal: z
    .enum([
      'Sell Faster',
      'Increase Engagement',
      'Look More Premium',
      'Build Community',
    ])
    .optional(),
  logoUrl: z.string().url().optional().or(z.literal('')),
  // Accept #RGB or #RRGGBB, or empty string
  brandColors: z
    .array(
      z
        .string()
        .regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, {
          message: 'Must be a valid hex code (#RGB or #RRGGBB)',
        })
        .or(z.literal(''))
    )
    .max(3)
    .optional(),
  primaryFont: z.string().optional(),
  secondaryFont: z.string().optional(),
  primaryPlatform: z.enum(['Facebook', 'Instagram', 'Both']).optional(),
  postingFrequency: z.enum(['Daily', '3x/week', 'Weekly']).optional(),
  promoStyle: z
    .enum(['Flash Sales', 'Lives', 'Outfit Drops', 'Mystery Bundles'])
    .optional(),
});

type BrandProfileFormValues = z.infer<typeof brandProfileSchema>;

const formOptions = {
  toneOfVoice: [
    'Warm & Friendly',
    'Witty',
    'Southern',
    'High-Fashion',
    'Minimal',
    'Bold',
    'Playful',
  ],
  brandVibe: [
    'Cozy Boutique',
    'Modern Minimal',
    'Luxury Editorial',
    'Trendy Pop',
  ],
  targetCustomer: [
    'Moms',
    'Young Professionals',
    'Size-Inclusive Shoppers',
    'Athleisure Lovers',
    'Modest Fashion',
    'Mixed',
  ],
  primaryGoal: [
    'Sell Faster',
    'Increase Engagement',
    'Look More Premium',
    'Build Community',
  ],
  primaryPlatform: ['Facebook', 'Instagram', 'Both'],
  postingFrequency: ['Daily', '3x/week', 'Weekly'],
  promoStyle: ['Flash Sales', 'Lives', 'Outfit Drops', 'Mystery Bundles'],
};

const totalFields = Object.keys(brandProfileSchema.shape).length;

export default function MyBrandPage() {
  const { user, loading: userLoading } = useUser();
  const firestore = useFirestore();
  const storage = useStorage();
  const router = useRouter();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  const hasLoggedRef = useRef(false);

  const brandProfileRef = useMemo(() => {
    if (!user || !firestore) return null;
    return doc(firestore, `users/${user.uid}/brandProfile/main`);
  }, [user, firestore]);

  const { data: brandProfileData, loading: dataLoading } = useDoc(brandProfileRef);

  const form = useForm<BrandProfileFormValues>({
    resolver: zodResolver(brandProfileSchema),
    defaultValues: {
      brandName: '',
      tagline: '',
      location: '',
      websiteUrl: '',
      instagramUrl: '',
      facebookUrl: '',
      toneOfVoice: undefined,
      brandVibe: undefined,
      targetCustomer: undefined,
      primaryGoal: undefined,
      logoUrl: '',
      brandColors: ['', '', ''],
      primaryFont: undefined,
      secondaryFont: undefined,
      primaryPlatform: undefined,
      postingFrequency: undefined,
      promoStyle: undefined,
    },
    mode: 'onSubmit',
  });

  const { watch, reset, handleSubmit, formState } = form;
  const watchedValues = watch();

  const completionPercent = useMemo(() => {
    const filledFields = Object.entries(watchedValues).filter(([key, value]) => {
      if (key === 'brandColors') {
        return Array.isArray(value) && value.some((v) => !!v);
      }
      return !!value && (!Array.isArray(value) || value.length > 0);
    }).length;
    return Math.round((filledFields / totalFields) * 100);
  }, [watchedValues]);

  // --- Effects ---
  useEffect(() => {
    if (!user && !userLoading) {
      router.push('/');
    }
  }, [user, userLoading, router]);

  useEffect(() => {
    if (brandProfileData) {
      if (!hasLoggedRef.current) {
        logBrandProfile(brandProfileData, 'MyBrandPage');
        hasLoggedRef.current = true;
      }
      // If the form has unsaved changes, don't overwrite the user's input
      if (formState.isDirty) return;

      const data: any = brandProfileData;
      const colors = Array.isArray(data.brandColors) ? data.brandColors : [];
      const paddedColors = [colors[0] || '', colors[1] || '', colors[2] || ''];
      
      const allFontNames = new Set(ALL_FONTS.map((f) => f.name));
      const initialPrimaryFont = normalizeFontName(data.primaryFont, allFontNames, DEFAULT_FONTS.heading);
      const initialSecondaryFont = normalizeFontName(data.secondaryFont, allFontNames, DEFAULT_FONTS.body);

      reset({
        brandName: data.brandName || '',
        tagline: data.tagline || '',
        location: data.location || '',
        websiteUrl: data.websiteUrl || '',
        instagramUrl: data.instagramUrl || '',
        facebookUrl: data.facebookUrl || '',
        toneOfVoice: data.toneOfVoice || undefined,
        brandVibe: data.brandVibe || undefined,
        targetCustomer: data.targetCustomer || undefined,
        primaryGoal: data.primaryGoal || undefined,
        logoUrl: data.logoUrl || '',
        brandColors: paddedColors,
        primaryFont: initialPrimaryFont,
        secondaryFont: initialSecondaryFont,
        primaryPlatform: data.primaryPlatform || undefined,
        postingFrequency: data.postingFrequency || undefined,
        promoStyle: data.promoStyle || undefined,
      });
    }
  }, [brandProfileData, reset, formState.isDirty]);


  // --- Handlers ---
  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user || !storage) return;

    if (file.size > 5 * 1024 * 1024) {
      toast({
        variant: 'destructive',
        title: 'Logo too large',
        description: 'Please upload an image under 5MB.',
      });
      return;
    }

    setIsUploading(true);
    const storagePath = `brandAssets/${user.uid}/logo-${Date.now()}-${file.name}`;
    const storageRef = ref(storage, storagePath);

    try {
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);
      form.setValue('logoUrl', downloadURL, {
        shouldDirty: true,
        shouldValidate: true,
      });
      toast({
        title: 'Logo uploaded!',
        description: 'Your new logo has been saved.',
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Upload failed',
        description: error.message,
      });
    } finally {
      setIsUploading(false);
    }
  };

  const onSubmit = async (data: BrandProfileFormValues) => {
    if (!brandProfileRef) {
      toast({
        variant: 'destructive',
        title: 'Save failed',
        description: 'Not authenticated.',
      });
      return;
    }

    setIsSaving(true);
    
    // Normalize colors before saving
    const normalizedColors = (data.brandColors || [])
      .map((c) => normalizeHexColor(c))
      .filter((c) => !!c);

    const payload: Record<string, any> = {};
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined) {
        payload[key] = value;
      }
    });

    payload.brandColors = normalizedColors;

    try {
      await setDoc(
        brandProfileRef,
        { ...payload, updatedAt: serverTimestamp() },
        { merge: true }
      );

      toast({
        title: 'My Brand Saved!',
        description: 'Your changes have been saved.',
      });

    } catch (error: any) {
      console.error('Firestore save error:', error);
      toast({
        variant: 'destructive',
        title: 'Save failed',
        description: error.message,
      });
    } finally {
      setIsSaving(false);
    }
  };


  if (userLoading || dataLoading) {
    return (
      <div className="flex-1 p-8 sm:p-10 lg:p-12">
        <header className="mb-12">
          <Skeleton className="h-16 w-96 mb-4" />
          <Skeleton className="h-7 w-full max-w-md" />
        </header>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
          <div className="lg:col-span-1">
            <Skeleton className="h-96 w-full" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-8 sm:p-10 lg:p-12">
      <header className="mb-12">
        <h1 className="text-5xl lg:text-6xl font-bold tracking-tight">My Brand</h1>
        <p className="text-xl text-muted-foreground mt-3 max-w-2xl">
          This is your Brand Intelligence vault. Fill it out to personalize your AI content.
        </p>
      </header>

      <div className="mb-8">
        <div className="flex justify-between items-center mb-2">
          <p className="text-sm font-medium text-foreground">
            Brand setup {completionPercent}% complete
          </p>
        </div>
        <Progress value={completionPercent} className="w-full h-2" />
      </div>

      <Form {...form}>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start"
        >
          <Accordion
            type="multiple"
            defaultValue={['item-1', 'item-2', 'item-3', 'item-4']}
            className="lg:col-span-2 space-y-6"
          >
            {/* Brand Identity */}
            <AccordionItem value="item-1" className="border-none">
              <Card>
                <AccordionTrigger className="p-6">
                  <CardHeader className="p-0 flex-row items-center gap-4 text-left">
                    <Building className="h-6 w-6 text-accent" />
                    <div>
                      <CardTitle>Brand Identity</CardTitle>
                      <CardDescription className="mt-1">
                        The basics of who you are.
                      </CardDescription>
                    </div>
                  </CardHeader>
                </AccordionTrigger>
                <AccordionContent>
                  <CardContent>
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="brandName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Brand Name</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="e.g., Stella & Grace"
                                  {...field}
                                  value={field.value || ''}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="tagline"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Tagline</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="e.g., Effortless style, everyday."
                                  {...field}
                                  value={field.value || ''}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="location"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Location</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="e.g., Nashville, TN"
                                  {...field}
                                  value={field.value || ''}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="websiteUrl"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Website URL</FormLabel>
                              <FormControl>
                                <Input
                                  type="url"
                                  placeholder="https://..."
                                  {...field}
                                  value={field.value || ''}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="instagramUrl"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Instagram URL</FormLabel>
                              <FormControl>
                                <Input
                                  type="url"
                                  placeholder="https://instagram.com/..."
                                  {...field}
                                  value={field.value || ''}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="facebookUrl"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Facebook Page/Group URL</FormLabel>
                              <FormControl>
                                <Input
                                  type="url"
                                  placeholder="https://facebook.com/..."
                                  {...field}
                                  value={field.value || ''}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="mt-6 flex justify-end border-t pt-6">
                        <Button type="submit" disabled={isSaving}>
                          {isSaving ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Save className="mr-2 h-4 w-4" />
                          )}
                          Save Changes
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </AccordionContent>
              </Card>
            </AccordionItem>

            {/* Brand Voice */}
            <AccordionItem value="item-2" className="border-none">
              <Card>
                <AccordionTrigger className="p-6">
                  <CardHeader className="p-0 flex-row items-center gap-4 text-left">
                    <Megaphone className="h-6 w-6 text-accent" />
                    <div>
                      <CardTitle>Brand Voice & Positioning</CardTitle>
                      <CardDescription className="mt-1">
                        Define your brand&apos;s personality and audience.
                      </CardDescription>
                    </div>
                  </CardHeader>
                </AccordionTrigger>
                <AccordionContent>
                  <CardContent>
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <SelectField
                          control={form.control}
                          name="toneOfVoice"
                          label="Tone of Voice"
                          placeholder="Select a tone"
                          options={formOptions.toneOfVoice}
                        />
                        <SelectField
                          control={form.control}
                          name="brandVibe"
                          label="Brand Vibe"
                          placeholder="Select a vibe"
                          options={formOptions.brandVibe}
                        />
                        <SelectField
                          control={form.control}
                          name="targetCustomer"
                          label="Target Customer"
                          placeholder="Select an audience"
                          options={formOptions.targetCustomer}
                        />
                        <SelectField
                          control={form.control}
                          name="primaryGoal"
                          label="Primary Goal"
                          placeholder="Select a goal"
                          options={formOptions.primaryGoal}
                        />
                      </div>
                      <div className="mt-6 flex justify-end border-t pt-6">
                        <Button type="submit" disabled={isSaving}>
                          {isSaving ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Save className="mr-2 h-4 w-4" />
                          )}
                          Save Changes
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </AccordionContent>
              </Card>
            </AccordionItem>

            {/* Visual Identity */}
            <AccordionItem value="item-3" className="border-none">
              <Card>
                <AccordionTrigger className="p-6">
                  <CardHeader className="p-0 flex-row items-center gap-4 text-left">
                    <Palette className="h-6 w-6 text-accent" />
                    <div>
                      <CardTitle>Visual Identity</CardTitle>
                      <CardDescription className="mt-1">
                        Upload your logo and set your brand colors & fonts.
                      </CardDescription>
                    </div>
                  </CardHeader>
                </AccordionTrigger>
                <AccordionContent>
                  <CardContent>
                    <div className="space-y-8">
                      <FormField
                        control={form.control}
                        name="logoUrl"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Brand Logo</FormLabel>
                            <div className="flex items-center gap-6">
                              <div className="relative h-24 w-24 rounded-full border bg-muted flex-shrink-0 overflow-hidden">
                                {isUploading ? (
                                  <div className="flex items-center justify-center h-full w-full">
                                    <Loader2 className="h-6 w-6 animate-spin" />
                                  </div>
                                ) : field.value ? (
                                  <Image src={field.value} alt="Brand Logo" fill objectFit="cover" />
                                ) : (
                                  <div className="flex items-center justify-center h-full w-full">
                                    <Camera className="h-8 w-8 text-muted-foreground" />
                                  </div>
                                )}
                              </div>
                              <div className="flex-grow">
                                <FormControl>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => document.getElementById('logo-upload')?.click()}
                                    disabled={isUploading}
                                  >
                                    <UploadCloud className="mr-2 h-4 w-4" />
                                    {isUploading ? 'Uploading...' : 'Upload Logo'}
                                  </Button>
                                </FormControl>
                                <FormDescription className="mt-2">
                                  PNG or JPG, up to 5MB. Recommended: 512x512px.
                                </FormDescription>
                                <input
                                  type="file"
                                  id="logo-upload"
                                  accept="image/png, image/jpeg"
                                  className="hidden"
                                  onChange={handleLogoUpload}
                                />
                              </div>
                            </div>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="brandColors"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Brand Colors</FormLabel>
                            <FormControl>
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                {[0, 1, 2].map((index) => (
                                  <div key={index} className="relative flex items-center gap-3">
                                    <label
                                      className="h-10 w-12 flex-shrink-0 rounded-md border cursor-pointer"
                                      style={{
                                        backgroundColor:
                                          normalizeHexColor(field.value?.[index]) || 'transparent',
                                      }}
                                    >
                                      <input
                                        type="color"
                                        className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                                        value={normalizeHexColor(field.value?.[index]) || '#ffffff'}
                                        onChange={(e) => {
                                          const newColors = [...(field.value || ['', '', ''])];
                                          newColors[index] = e.target.value; // always #RRGGBB
                                          form.setValue('brandColors', newColors, {
                                            shouldDirty: true,
                                            shouldValidate: true,
                                          });
                                        }}
                                      />
                                    </label>

                                    <Input
                                      placeholder="e.g., #C56A3D"
                                      value={field.value?.[index] || ''}
                                      onChange={(e) => {
                                        const newColors = [...(field.value || ['', '', ''])];
                                        newColors[index] = e.target.value;
                                        form.setValue('brandColors', newColors, {
                                          shouldDirty: true,
                                          shouldValidate: true,
                                        });
                                      }}
                                      onBlur={() => {
                                        // Normalize what they typed into real #RRGGBB (or clear it if invalid)
                                        const newColors = [...(field.value || ['', '', ''])];
                                        const normalized = normalizeHexColor(newColors[index]);
                                        newColors[index] = normalized; // "" if invalid
                                        form.setValue('brandColors', newColors, {
                                          shouldDirty: true,
                                          shouldValidate: true,
                                        });
                                      }}
                                    />
                                  </div>
                                ))}
                              </div>
                            </FormControl>
                            <FormDescription>
                              Choose up to 3 colors for your brand. (#RGB or #RRGGBB)
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="primaryFont"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Primary Font (Headings)</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value ?? ''} key={field.value ?? 'primaryFont'}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select a font" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {ALL_FONTS.map((font: FontDefinition) => (
                                    <SelectItem
                                      key={font.name}
                                      value={font.name}
                                      style={{ fontFamily: font.cssFamily }}
                                    >
                                      <div className="flex justify-between items-center w-full">
                                        <span>{font.name}</span>
                                        <span className="text-muted-foreground text-lg opacity-70">
                                          Aa
                                        </span>
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </FormItem>
                          )}
                        />
                         <FormField
                          control={form.control}
                          name="secondaryFont"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Secondary Font (Body)</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value ?? ''} key={field.value ?? 'secondaryFont'}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select a font" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {ALL_FONTS.map((font: FontDefinition) => (
                                    <SelectItem
                                      key={font.name}
                                      value={font.name}
                                      style={{ fontFamily: font.cssFamily }}
                                    >
                                      <div className="flex justify-between items-center w-full">
                                        <span>{font.name}</span>
                                        <span className="text-muted-foreground text-lg opacity-70">
                                          Aa
                                        </span>
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="mt-6 flex justify-end border-t pt-6">
                        <Button type="submit" disabled={isSaving}>
                          {isSaving ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Save className="mr-2 h-4 w-4" />
                          )}
                          Save Changes
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </AccordionContent>
              </Card>
            </AccordionItem>

            {/* Business Basics */}
            <AccordionItem value="item-4" className="border-none">
              <Card>
                <AccordionTrigger className="p-6">
                  <CardHeader className="p-0 flex-row items-center gap-4 text-left">
                    <Heart className="h-6 w-6 text-accent" />
                    <div>
                      <CardTitle>Business Basics</CardTitle>
                      <CardDescription className="mt-1">
                        How you connect with your customers.
                      </CardDescription>
                    </div>
                  </CardHeader>
                </AccordionTrigger>
                <AccordionContent>
                  <CardContent>
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <SelectField
                          control={form.control}
                          name="primaryPlatform"
                          label="Primary Platform"
                          placeholder="Select a platform"
                          options={formOptions.primaryPlatform}
                        />
                        <SelectField
                          control={form.control}
                          name="postingFrequency"
                          label="Posting Frequency"
                          placeholder="Select a frequency"
                          options={formOptions.postingFrequency}
                        />
                        <SelectField
                          control={form.control}
                          name="promoStyle"
                          label="Promo Style"
                          placeholder="Select a style"
                          options={formOptions.promoStyle}
                        />
                      </div>
                      <div className="mt-6 flex justify-end border-t pt-6">
                        <Button type="submit" disabled={isSaving}>
                          {isSaving ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Save className="mr-2 h-4 w-4" />
                          )}
                          Save Changes
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </AccordionContent>
              </Card>
            </AccordionItem>
          </Accordion>

          <div className="lg:col-span-1 lg:sticky top-12">
            <BrandProfilePreview values={watchedValues} />
          </div>
        </form>
      </Form>
    </div>
  );
}

// --- Reusable Select Field ---
function SelectField({ control, name, label, placeholder, options }: any) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <Select onValueChange={field.onChange} value={field.value ?? ''} key={field.value ?? name}>
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder={placeholder} />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {options.map((option: string) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormItem>
      )}
    />
  );
}

// --- Preview Panel ---
function BrandProfilePreview({ values }: { values: BrandProfileFormValues }) {
  const getFontFamily = (fontName: string | undefined, defaultFamily: string) => {
    return getFontByName(fontName)?.cssFamily || defaultFamily;
  };

  const renderValue = (
    value: any,
    placeholder: string = 'Not set',
    style: React.CSSProperties = {}
  ) => {
    if (!value || (Array.isArray(value) && value.length === 0)) {
      return <span className="text-muted-foreground/70">{placeholder}</span>;
    }
    return (
      <span className="font-semibold text-foreground truncate" style={style}>
        {value}
      </span>
    );
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-accent" />
          Brand Preview
        </CardTitle>
        <CardDescription>A summary of your brand intelligence.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="text-center space-y-2">
          {values.logoUrl ? (
            <Image
              src={values.logoUrl}
              alt="brand logo"
              width={96}
              height={96}
              className="mx-auto rounded-full object-cover h-24 w-24 border"
            />
          ) : (
            <div className="mx-auto h-24 w-24 rounded-full bg-muted flex items-center justify-center border">
              <ImageIcon className="h-10 w-10 text-muted-foreground" />
            </div>
          )}

          <div>
            <h3
              className="text-lg font-bold"
              style={{ fontFamily: getFontFamily(values.primaryFont, DEFAULT_FONTS.heading) }}
            >
              {values.brandName || 'Your Brand Name'}
            </h3>
            <p
              className="text-sm text-muted-foreground"
              style={{ fontFamily: getFontFamily(values.secondaryFont, DEFAULT_FONTS.body) }}
            >
              {values.tagline || 'Your tagline'}
            </p>
          </div>

          <div className="flex justify-center gap-2 pt-2">
            {(values.brandColors || [])
              .map((c) => normalizeHexColor(c))
              .filter((c) => !!c)
              .map((color, i) => (
                <div
                  key={i}
                  className="h-6 w-6 rounded-full border"
                  style={{ backgroundColor: color }}
                />
              ))}
          </div>
        </div>

        <div className="space-y-3 text-sm">
          <div className="flex justify-between items-center gap-4">
            <p className="text-muted-foreground">Tone</p>
            {renderValue(values.toneOfVoice)}
          </div>
          <div className="flex justify-between items-center gap-4">
            <p className="text-muted-foreground">Vibe</p>
            {renderValue(values.brandVibe)}
          </div>
          <div className="flex justify-between items-center gap-4">
            <p className="text-muted-foreground">Customer</p>
            {renderValue(values.targetCustomer)}
          </div>
          <div className="flex justify-between items-center gap-4">
            <p className="text-muted-foreground">Main Goal</p>
            {renderValue(values.primaryGoal)}
          </div>
          <div className="flex justify-between items-center gap-4">
            <p className="text-muted-foreground flex-shrink-0 mr-2">Primary Font</p>
            {renderValue(values.primaryFont, 'Not set', {
              fontFamily: getFontFamily(values.primaryFont, DEFAULT_FONTS.heading),
            })}
          </div>
          <div className="flex justify-between items-center gap-4">
            <p className="text-muted-foreground flex-shrink-0 mr-2">Secondary Font</p>
            {renderValue(values.secondaryFont, 'Not set', {
              fontFamily: getFontFamily(values.secondaryFont, DEFAULT_FONTS.body),
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
