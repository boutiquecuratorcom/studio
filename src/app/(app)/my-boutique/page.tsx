'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { useUser, useFirestore, useDoc } from '@/firebase';
import { useOutfits } from '@/lib/outfits';
import {
  BoutiqueSettings,
  useBoutiqueSettings,
  updateBoutiqueSettings,
  useUserHandle,
  claimHandleTransaction,
  updateHandleTransaction,
  syncPublicBoutiqueData,
  handleSchema,
} from '@/lib/boutique';

import {
  type BoutiqueDesign,
  getContrastingTextColor,
  defaultDesign,
  getBoutiqueDesignDefaults,
} from '@/lib/boutique-design';

import { useToast } from '@/hooks/use-toast';
import { isAdminEmail } from '@/lib/admin';
import { ALL_FONTS, BUTTON_SAFE_FONTS } from '@/lib/fonts';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

import {
  AlertTriangle,
  CheckCircle2,
  Copy,
  ExternalLink,
  Eye,
  Globe,
  Loader2,
  Save,
  Settings2,
  XCircle,
  Heart,
  Type,
  CaseSensitive,
} from 'lucide-react';

import {
  doc,
  updateDoc,
  getDoc,
  deleteDoc,
  runTransaction,
  serverTimestamp,
} from 'firebase/firestore';

import { BoutiqueLivePreview } from '@/components/boutique/BoutiqueLivePreview';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Separator } from '@/components/ui/separator';

type HandleFormValues = z.infer<typeof handleSchema>;

// IMPORTANT: "sans-serif" contains the substring "serif", so we must whitelist sans-serif and exclude cursive.
const hasBrandData = (brandProfile: any | null | undefined) => {
  return !!(
    brandProfile &&
    ((Array.isArray(brandProfile.brandColors) && brandProfile.brandColors.length > 0) ||
      !!brandProfile.primaryFont ||
      !!brandProfile.secondaryFont)
  );
};

/**
 * Key behavior:
 * - We ALWAYS start from the brand-derived base design if brand exists.
 * - If a saved boutique design exists, we merge it on top (so user customizations win).
 * - BUT: if the saved design is still “default-like” for specific fields, we overwrite those
 *   fields with brand values (so “defaults” stay synced to Brand).
 */
const applyBrandToDefaultDesign = (
  savedDesign: any | undefined,
  brandBase: Omit<BoutiqueDesign, 'updatedAt'>,
  brandExists: boolean
): Omit<BoutiqueDesign, 'updatedAt'> => {
  const base = brandExists ? brandBase : (defaultDesign as any);

  const merged: any = savedDesign
    ? {
        ...base,
        ...savedDesign,
        palette: { ...(base as any).palette, ...(savedDesign.palette ?? {}) },
        fonts: { ...(base as any).fonts, ...(savedDesign.fonts ?? {}) },
      }
    : { ...base };

  if (!brandExists) return merged;

  // If user never customized away from defaults, keep these synced with Brand.
  if ((savedDesign?.palette?.accent ?? defaultDesign.palette.accent) === defaultDesign.palette.accent) {
    merged.palette.accent = (brandBase as any).palette.accent;
    merged.palette.accentText = (brandBase as any).palette.accentText;
  }

  if ((savedDesign?.fonts?.heading ?? defaultDesign.fonts.heading) === defaultDesign.fonts.heading) {
    merged.fonts.heading = (brandBase as any).fonts.heading;
  }

  if ((savedDesign?.fonts?.body ?? defaultDesign.fonts.body) === defaultDesign.fonts.body) {
    merged.fonts.body = (brandBase as any).fonts.body;
  }

  if ((savedDesign?.fonts?.button ?? defaultDesign.fonts.button) === defaultDesign.fonts.button) {
    merged.fonts.button = (brandBase as any).fonts.button;
  }

  return merged;
};

export default function MyBoutiquePage() {
  const { user, loading: userLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const { handle, loading: handleLoading } = useUserHandle(user?.uid || null);
  const { data: boutiqueSettings, loading: settingsLoading } =
    useBoutiqueSettings(user?.uid || null);

  const brandProfileRef = useMemo(() => {
    if (!user || !firestore) return null;
    return doc(firestore, `users/${user.uid}/brandProfile/main`);
  }, [user, firestore]);

  const { data: brandProfile, loading: brandLoading } = useDoc<any>(brandProfileRef);

  // useDoc typically returns undefined while loading; null when doc doesn't exist.
  const brandResolved = brandProfile !== undefined;

  const { outfits, loading: outfitsLoading } = useOutfits(user?.uid || null);

  const [localSettings, setLocalSettings] = useState<Partial<BoutiqueSettings>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [publicUrl, setPublicUrl] = useState('');

  const handleForm = useForm<HandleFormValues>({
    resolver: zodResolver(handleSchema),
    defaultValues: { handle: '' },
  });

  const isAdmin = isAdminEmail(user?.email);
  const [isTesting, setIsTesting] = useState(false);
  const [selfTestResults, setSelfTestResults] = useState<
    { step: string; ok: boolean; error?: string }[]
  >([]);

  const updateDesign = (newDesignPartial: Partial<BoutiqueDesign>) => {
    setLocalSettings((prev) => {
      const currentDesign = (prev.design as any) || defaultDesign;

      const mergedDesign: BoutiqueDesign = {
        ...currentDesign,
        ...newDesignPartial,
        palette: {
          ...currentDesign.palette,
          ...(newDesignPartial as any).palette,
        },
        fonts: {
          ...currentDesign.fonts,
          ...(newDesignPartial as any).fonts,
        },
      };

      return {
        ...prev,
        design: mergedDesign,
      };
    });
  };

  const updatePalette = (newPalette: Partial<BoutiqueDesign['palette']>) => {
    updateDesign({
      palette: {
        ...(((localSettings.design as any)?.palette || defaultDesign.palette) as any),
        ...newPalette,
      } as any,
    });
  };

  // --- Effects ---
  useEffect(() => {
    if (handle?.handle) {
      handleForm.reset({ handle: handle.handle });
      setPublicUrl(`${window.location.origin}/boutique/${handle.handle}`);
    } else {
      setPublicUrl('');
    }
  }, [handle, handleForm]);

  useEffect(() => {
    // Wait until brand is resolved to avoid initializing with defaults and then never re-running.
    if (userLoading || settingsLoading || brandLoading || !brandResolved || isInitialized) return;
    if (!user || !firestore) return;

    const performInitialization = async () => {
      let currentSettings = boutiqueSettings;

      const brandExists = hasBrandData(brandProfile);
      const brandBase = getBoutiqueDesignDefaults(brandProfile);

      const savedDesign = currentSettings?.design as any | undefined;

      // Compute final design for UI (brand defaults + saved customizations; brand overwrites only default-like fields)
      const designToUse = applyBrandToDefaultDesign(savedDesign, brandBase, brandExists);

      // If no settings doc exists, create one
      if (!currentSettings) {
        const newSettingsData = {
          enabled: false,
          featuredOutfitId: null,
          handle: null,
          design: designToUse,
        };
        await updateBoutiqueSettings(firestore, user.uid, newSettingsData);
        currentSettings = newSettingsData as unknown as BoutiqueSettings;
      } else {
        // If a saved design exists but is default-like, migrate it once so it stops reverting on reload.
        if (savedDesign && JSON.stringify(savedDesign) !== JSON.stringify(designToUse)) {
          await updateBoutiqueSettings(firestore, user.uid, { design: designToUse });
        }

        // If settings exist but design missing, set it
        if (!currentSettings.design) {
          await updateBoutiqueSettings(firestore, user.uid, { design: designToUse });
        }
      }

      setLocalSettings({
        enabled: currentSettings?.enabled ?? false,
        featuredOutfitId: currentSettings?.featuredOutfitId || 'auto',
        design: designToUse as any,
      });

      setIsInitialized(true);
    };

    performInitialization();
  }, [
    user,
    firestore,
    userLoading,
    settingsLoading,
    brandLoading,
    brandResolved,
    brandProfile,
    boutiqueSettings,
    isInitialized,
  ]);

  // --- Handlers ---
  const handleEnabledToggle = async (enabled: boolean) => {
    if (!user || !firestore) return;

    if (enabled && !handle?.handle) {
      toast({
        variant: 'destructive',
        title: 'Cannot go live',
        description: 'You must claim a public handle first.',
      });
      console.error('Attempted to go live without a handle.');
      return;
    }

    setIsSyncing(true);
    toast({ title: 'Updating boutique status...', description: 'Please wait.' });

    try {
      if (enabled) {
        await syncPublicBoutiqueData(firestore, user.uid, handle!.handle);
        await updateDoc(doc(firestore, `publicBoutiques/${handle!.handle}`), {
          enabled: true,
        });
        await updateBoutiqueSettings(firestore, user.uid, { enabled: true });
      } else {
        if (handle?.handle) {
          await updateDoc(doc(firestore, `publicBoutiques/${handle.handle}`), {
            enabled: false,
          });
        }
        await updateBoutiqueSettings(firestore, user.uid, { enabled: false });
      }

      setLocalSettings((prev) => ({ ...prev, enabled }));

      toast({
        title: 'Boutique Status Updated',
        description: `Your boutique is now ${enabled ? 'live' : 'private'}.`,
      });
    } catch (e: any) {
      console.error('[MyBoutique] Failed to toggle status:', e);
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: e.message,
      });

      // Revert local state if toggle failed
      setLocalSettings((prev) => ({ ...prev, enabled: !enabled }));
    } finally {
      setIsSyncing(false);
    }
  };

  const handleConfigSave = async () => {
    if (!user || !firestore) return;

    setIsSaving(true);
    try {
      const settingsToSave: Partial<BoutiqueSettings> = {
        featuredOutfitId:
          localSettings.featuredOutfitId === 'auto'
            ? null
            : (localSettings.featuredOutfitId as any),
        design: localSettings.design as any,
      };

      await updateBoutiqueSettings(firestore, user.uid, settingsToSave);

      if (boutiqueSettings?.enabled && handle) {
        await syncPublicBoutiqueData(firestore, user.uid, handle.handle);
      }

      toast({ title: 'Configuration Saved!' });
    } catch (e: any) {
      console.error('[MyBoutique] Failed to save config:', e);
      toast({
        variant: 'destructive',
        title: 'Save Failed',
        description: e.message,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const onClaimSubmit = async (values: HandleFormValues) => {
    if (!user || !firestore) return;

    const isUpdate = !!handle;
    const newHandle = values.handle;
    const oldHandle = handle?.handle;

    handleForm.clearErrors();

    try {
      if (isUpdate && oldHandle) {
        await updateHandleTransaction(firestore, user, oldHandle, newHandle);
        toast({
          title: 'Handle Updated!',
          description: `Your new public URL is /boutique/${newHandle}`,
        });
      } else {
        await claimHandleTransaction(firestore, user, newHandle);
        await updateBoutiqueSettings(firestore, user.uid, { handle: newHandle });
        toast({
          title: 'Handle Claimed!',
          description: `Your boutique is now ready to go live at /boutique/${newHandle}`,
        });
      }
    } catch (e: any) {
      console.error('Handle transaction failed:', e);
      handleForm.setError('handle', { type: 'manual', message: e.message });
    }
  };

  const handleSelfTest = async () => {
    if (!firestore || !user) return;

    setIsTesting(true);
    setSelfTestResults([]);

    const randomHandle = `test-${Date.now()}`;
    const steps: { step: string; ok: boolean; error?: string }[] = [];

    const addResult = (result: { step: string; ok: boolean; error?: string }) => {
      steps.push(result);
      setSelfTestResults([...steps]);
    };

    const originalSettings = {
      handle: handle?.handle || null,
      enabled: boutiqueSettings?.enabled ?? false,
    };

    try {
      await runTransaction(firestore, async (transaction) => {
        const testHandleRef = doc(firestore, 'handles', randomHandle);
        const testPublicBoutiqueRef = doc(firestore, 'publicBoutiques', randomHandle);

        const testHandleSnap = await transaction.get(testHandleRef);
        if (testHandleSnap.exists())
          throw new Error(`Test handle '${randomHandle}' already exists.`);

        const now = serverTimestamp();
        transaction.set(testHandleRef, {
          uid: user.uid,
          handle: randomHandle,
          createdAt: now,
          updatedAt: now,
        });
        transaction.set(testPublicBoutiqueRef, {
          uid: user.uid,
          handle: randomHandle,
          enabled: false,
          updatedAt: now,
        });
      });

      addResult({ step: '1. Claim Test Handle', ok: true });

      await updateBoutiqueSettings(firestore, user.uid, { handle: randomHandle });
      addResult({ step: '2. Update Private Settings', ok: true });

      await syncPublicBoutiqueData(firestore, user.uid, randomHandle);
      addResult({ step: '3. Sync Public Data', ok: true });

      const publicBoutiqueRef = doc(firestore, 'publicBoutiques', randomHandle);
      await updateDoc(publicBoutiqueRef, { enabled: true });
      await updateBoutiqueSettings(firestore, user.uid, { enabled: true });
      addResult({ step: '4. Enable Boutique', ok: true });

      const liveDocSnap = await getDoc(publicBoutiqueRef);
      if (!liveDocSnap.exists() || !liveDocSnap.data()?.enabled)
        throw new Error('Verification failed: Public document is not enabled.');

      addResult({ step: '5. Verify Live Status', ok: true });

      await updateDoc(publicBoutiqueRef, { enabled: false });
      await updateBoutiqueSettings(firestore, user.uid, { enabled: false });
      addResult({ step: '6. Disable Boutique', ok: true });

      toast({
        title: 'Self-Test Passed!',
        description: 'All steps completed successfully.',
      });
    } catch (e: any) {
      const stepNum = steps.findIndex((s) => !s.ok) + 1 || steps.length + 1;
      const failedStepName = `Step ${stepNum}`;
      addResult({ step: `${failedStepName}`, ok: false, error: e.message });
      toast({
        variant: 'destructive',
        title: `Self-Test Failed at ${failedStepName}`,
        description: e.message,
      });
    } finally {
      try {
        await deleteDoc(doc(firestore, 'handles', randomHandle));
        await deleteDoc(doc(firestore, 'publicBoutiques', randomHandle));
        await updateBoutiqueSettings(firestore, user.uid, originalSettings);
        addResult({ step: '7. Cleanup & Restore', ok: true });
      } catch (cleanupError: any) {
        addResult({
          step: '7. Cleanup & Restore',
          ok: false,
          error: cleanupError.message,
        });
        toast({
          variant: 'destructive',
          title: 'Cleanup Failed',
          description: 'Test data may not have been fully removed.',
        });
      }
      setIsTesting(false);
    }
  };

  const handleAccentColorChange = (color: string) => {
    updatePalette({
      accent: color,
      accentText: getContrastingTextColor(color),
    });
  };

  // --- Derived State & Memos ---
  const loading =
    userLoading ||
    !isInitialized ||
    outfitsLoading ||
    brandLoading ||
    handleLoading;

  const featuredOutfit = useMemo(() => {
    if (!outfits) return undefined;
    const featuredId = localSettings.featuredOutfitId as any;

    if (featuredId === 'auto' || !featuredId) {
      return outfits.find((o) => o.status === 'published') || outfits[0];
    }

    return outfits.find((o) => o.id === featuredId);
  }, [localSettings.featuredOutfitId, outfits]);

  const isConfigDirty = useMemo(() => {
    if (!boutiqueSettings || !localSettings?.design) return false;

    const settingsDirty =
      (localSettings.featuredOutfitId || 'auto') !==
      (boutiqueSettings.featuredOutfitId || 'auto');

    const designDirty =
      JSON.stringify(localSettings.design) !==
      JSON.stringify(boutiqueSettings.design);

    return settingsDirty || designDirty;
  }, [localSettings, boutiqueSettings]);

  // --- Render Functions ---
  const renderHeader = () => (
    <header className="mb-12">
      <h1 className="text-5xl lg:text-6xl font-bold tracking-tight">
        My Boutique
      </h1>
      <p className="text-xl text-muted-foreground mt-3 max-w-2xl">
        Your personal boutique showcase. When you're ready, share it with the world.
      </p>
    </header>
  );

  if (loading) {
    return (
      <div className="flex-1 p-8 sm:p-10 lg:p-12">
        {renderHeader()}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <div className="lg:col-span-1 space-y-6">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
          <div className="lg:col-span-2">
            <Skeleton className="h-[700px] w-full" />
          </div>
        </div>
      </div>
    );
  }

  const designForUI = (localSettings.design as any) || defaultDesign;
  const brandExists = hasBrandData(brandProfile);

  return (
    <div className="flex-1 p-8 sm:p-10 lg:p-12">
      {renderHeader()}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Publishing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-4 rounded-lg border p-4">
                {isSyncing ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Switch
                    id="boutique-enabled"
                    checked={localSettings.enabled ?? false}
                    onCheckedChange={handleEnabledToggle}
                    disabled={!handle}
                  />
                )}
                <Label htmlFor="boutique-enabled" className="flex-grow">
                  Boutique is {localSettings.enabled ? 'Live' : 'Private'}
                </Label>
              </div>

              <p className="text-sm text-muted-foreground mt-3 px-1">
                {localSettings.enabled ? 'Your boutique is public.' : 'Your boutique is private.'}
              </p>

              {!handle && (
                <Alert variant="destructive" className="mt-4">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Handle Required</AlertTitle>
                  <AlertDescription>
                    You must claim a public handle before your boutique can go live.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Public Handle</CardTitle>
              <CardDescription>
                This becomes your public link: /boutique/your-handle
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...handleForm}>
                <form
                  onSubmit={handleForm.handleSubmit(onClaimSubmit)}
                  className="space-y-4"
                >
                  <FormField
                    control={handleForm.control}
                    name="handle"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center">
                          <span className="text-sm text-muted-foreground bg-muted border border-r-0 rounded-l-md px-3 h-10 flex items-center">
                            .../boutique/
                          </span>
                          <FormControl>
                            <Input
                              placeholder="your-handle"
                              {...field}
                              className="rounded-l-none"
                              disabled={
                                !!localSettings.enabled ||
                                handleForm.formState.isSubmitting
                              }
                            />
                          </FormControl>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex flex-col gap-4">
                    <Button
                      type="submit"
                      disabled={
                        !!localSettings.enabled ||
                        handleForm.formState.isSubmitting ||
                        !handleForm.formState.isDirty
                      }
                    >
                      {handleForm.formState.isSubmitting ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : null}
                      {handle ? 'Update Handle' : 'Claim Handle'}
                    </Button>

                    {localSettings.enabled && (
                      <p className="text-xs text-muted-foreground text-center">
                        Disable "Boutique is Live" to change your handle.
                      </p>
                    )}
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>

          {publicUrl && (
            <Card>
              <CardHeader>
                <CardTitle>Your Public URL</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center space-x-2 rounded-lg border p-2 pl-3 bg-muted/50">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground font-mono flex-grow truncate">
                    {new URL(publicUrl).pathname}
                  </p>
                </div>

                <Button variant="outline" className="w-full justify-between" asChild>
                  <Link href={publicUrl} target="_blank">
                    Visit Public Page <ExternalLink className="h-4 w-4" />
                  </Link>
                </Button>

                <Button
                  variant="outline"
                  className="w-full justify-between"
                  onClick={() => {
                    navigator.clipboard.writeText(publicUrl);
                    toast({ title: 'Link Copied!' });
                  }}
                >
                  Copy Link <Copy className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          )}

          <Accordion type="multiple" defaultValue={['design']} className="w-full">
            <AccordionItem value="design" className="border-none">
              <Card>
                <AccordionTrigger className="p-6 border-b">
                  <CardHeader className="p-0 flex-row items-center gap-4 text-left">
                    <Settings2 className="h-6 w-6 text-accent" />
                    <div>
                      <CardTitle>Boutique Style Foundation</CardTitle>
                      <CardDescription className="mt-1">
                        Define your brand's visual identity.
                      </CardDescription>
                    </div>
                  </CardHeader>
                </AccordionTrigger>

                <AccordionContent className="p-6 space-y-6">
                  <div>
                    <Label className="font-semibold text-base">Boutique Colors</Label>

                    {brandExists ? (
                      <p className="text-sm text-muted-foreground mt-1 mb-3">
                        Defaults loaded from your Brand Profile.
                      </p>
                    ) : (
                      <Alert className="mt-2">
                        <Heart className="h-4 w-4" />
                        <AlertTitle>Using Defaults</AlertTitle>
                        <AlertDescription>
                          <Link href="/my-brand" className="underline">
                            Complete your Brand Profile
                          </Link>{' '}
                          for better results.
                        </AlertDescription>
                      </Alert>
                    )}

                    <div className="space-y-4 mt-4">
                      <div className="grid grid-cols-2 gap-x-4 gap-y-2 items-center">
                        <Label htmlFor="bg-color">Background</Label>
                        <Input
                          id="bg-color"
                          type="color"
                          value={designForUI.palette.background || defaultDesign.palette.background}
                          onChange={(e) => updatePalette({ background: e.target.value })}
                          className="w-full h-10 p-1"
                        />

                        <Label htmlFor="surface-color">Surface</Label>
                        <Input
                          id="surface-color"
                          type="color"
                          value={designForUI.palette.surface || defaultDesign.palette.surface}
                          onChange={(e) => updatePalette({ surface: e.target.value })}
                          className="w-full h-10 p-1"
                        />

                        <Label htmlFor="accent-color">Accent</Label>
                        <Input
                          id="accent-color"
                          type="color"
                          value={designForUI.palette.accent || defaultDesign.palette.accent}
                          onChange={(e) => handleAccentColorChange(e.target.value)}
                          className="w-full h-10 p-1"
                        />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <Label className="font-semibold text-base">Typography</Label>
                    <div className="space-y-4 mt-4">
                      <div>
                        <Label
                          htmlFor="heading-font"
                          className="text-sm text-muted-foreground flex items-center gap-2"
                        >
                          <CaseSensitive className="h-4 w-4" />
                          Heading Font
                        </Label>
                        <Select
                          value={designForUI.fonts.heading}
                          onValueChange={(value) =>
                            updateDesign({ fonts: { ...designForUI.fonts, heading: value } })
                          }
                        >
                          <SelectTrigger id="heading-font" className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {ALL_FONTS.map((font) => (
                              <SelectItem
                                key={font.name}
                                value={font.name}
                                style={{ fontFamily: font.cssFamily }}
                              >
                                {font.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label
                          htmlFor="body-font"
                          className="text-sm text-muted-foreground flex items-center gap-2"
                        >
                          <Type className="h-4 w-4" />
                          Body Font
                        </Label>
                        <Select
                          value={designForUI.fonts.body}
                          onValueChange={(value) =>
                            updateDesign({ fonts: { ...designForUI.fonts, body: value } })
                          }
                        >
                          <SelectTrigger id="body-font" className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {ALL_FONTS.map((font) => (
                              <SelectItem
                                key={font.name}
                                value={font.name}
                                style={{ fontFamily: font.cssFamily }}
                              >
                                {font.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label
                          htmlFor="button-font"
                          className="text-sm text-muted-foreground flex items-center gap-2"
                        >
                          <Type className="h-4 w-4" />
                          Button Font
                        </Label>
                        <Select
                          value={designForUI.fonts.button}
                          onValueChange={(value) =>
                            updateDesign({ fonts: { ...designForUI.fonts, button: value } })
                          }
                        >
                          <SelectTrigger id="button-font" className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {BUTTON_SAFE_FONTS.map((font) => (
                              <SelectItem
                                key={font.name}
                                value={font.name}
                                style={{ fontFamily: font.cssFamily }}
                              >
                                {font.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </AccordionContent>
              </Card>
            </AccordionItem>
          </Accordion>

          <Card>
            <CardHeader>
              <CardTitle>Page Content</CardTitle>
              <CardDescription>
                Choose what to feature on your boutique page.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Featured Outfit</Label>
                <Select
                  value={(localSettings.featuredOutfitId as any) || 'auto'}
                  onValueChange={(v) =>
                    setLocalSettings((prev) => ({ ...prev, featuredOutfitId: v as any }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select an outfit..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">Auto (newest published look)</SelectItem>
                    {outfits?.map((outfit) => (
                      <SelectItem key={outfit.id} value={outfit.id}>
                        {outfit.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={handleConfigSave}
                disabled={isSaving || !isConfigDirty}
                className="w-full"
              >
                {isSaving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Save Configuration
              </Button>
            </CardContent>
          </Card>

          {isAdmin && (
            <Card>
              <CardHeader>
                <CardTitle>Admin Tools</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  onClick={handleSelfTest}
                  disabled={isTesting}
                  className="w-full"
                >
                  {isTesting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  Run Boutique Self-Test
                </Button>

                {selfTestResults.length > 0 && (
                  <div className="p-3 border rounded-md bg-muted/50 space-y-2">
                    <p className="text-sm font-medium">Test Results:</p>
                    <ul className="text-xs space-y-1">
                      {selfTestResults.map((result, i) => (
                        <li
                          key={i}
                          className={`flex items-center gap-2 ${
                            !result.ok ? 'text-destructive' : ''
                          }`}
                        >
                          {result.ok ? (
                            <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                          ) : (
                            <XCircle className="h-3.5 w-3.5" />
                          )}
                          <span>{result.step}</span>
                          {result.error && (
                            <span className="font-mono text-destructive/80">
                              - {result.error}
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        <div className="lg:col-span-2 lg:sticky top-12">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" /> Live Preview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <BoutiqueLivePreview
                brandProfile={brandProfile}
                featuredOutfit={featuredOutfit}
                design={designForUI}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
