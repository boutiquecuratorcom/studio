

'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { useUser, useFirestore, useDoc } from '@/firebase';
import { useOutfits } from '@/lib/outfits';
import type {
  BrandProfilePublicBits,
} from '@/lib/brand/brandPublicBits';

import {
  type BoutiqueSettings,
  useBoutiqueSettings,
  updateBoutiqueSettings,
  useUserHandle,
  claimHandleTransaction,
  updateHandleTransaction,
  syncPublicBoutiqueData,
  handleSchema,
} from '@/lib/boutique';

import { useToast } from '@/hooks/use-toast';
import { isAdminEmail } from '@/lib/admin';
import { logBrandProfile } from '@/lib/debug/logBrandProfile';

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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';

import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  Copy,
  Eye,
  ImageIcon,
  Loader2,
  Palette,
  PictureInPicture,
  Plus,
  Save,
  Trash2,
  XCircle,
} from 'lucide-react';

import {
  doc,
  updateDoc,
  getDoc,
  deleteDoc,
  runTransaction,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';

import { BoutiqueLivePreview } from '@/components/boutique/BoutiqueLivePreview';
import { BOUTIQUE_PATTERNS, BOUTIQUE_TEMPLATES } from '@/lib/brand/brandPublicBits';
import { Input } from '@/components/ui/input';
import { getFontByName } from '@/lib/fonts';

type HandleFormValues = z.infer<typeof handleSchema>;

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

  const { data: brandProfile, loading: brandLoading } =
    useDoc<BrandProfilePublicBits>(brandProfileRef);

  const { outfits, loading: outfitsLoading } = useOutfits(user?.uid || null);

  const [localSettings, setLocalSettings] = useState<Partial<BoutiqueSettings>>(
    {}
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [publicUrl, setPublicUrl] = useState('');

  const initStartedRef = useRef(false);
  const isMountedRef = useRef(true);
  const hasLoggedRef = useRef(false);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!hasLoggedRef.current && brandProfile) {
      logBrandProfile(brandProfile, 'MyBoutiquePage');
      hasLoggedRef.current = true;
    }
  }, [brandProfile]);

  const handleForm = useForm<HandleFormValues>({
    resolver: zodResolver(handleSchema),
    defaultValues: { handle: '' },
  });

  const isAdmin = isAdminEmail(user?.email);

  const [isTesting, setIsTesting] = useState(false);
  const [selfTestResults, setSelfTestResults] = useState<
    { step: string; ok: boolean; error?: string }[]
  >([]);

  useEffect(() => {
    if (handle?.handle) {
      handleForm.reset({ handle: handle.handle });
      setPublicUrl(`${window.location.origin}/boutique/${handle.handle}`);
    } else {
      setPublicUrl('');
    }
  }, [handle, handleForm]);

  useEffect(() => {
    if (userLoading || settingsLoading || brandLoading) return;
    if (!user || !firestore) return;
    if (initStartedRef.current) return;

    initStartedRef.current = true;

    const performInitialization = async () => {
      try {
        let currentSettings = boutiqueSettings;

        if (!currentSettings) {
          const newSettingsData = {
            enabled: false,
            featuredOutfitId: null,
            handle: null,
            templateId: 'editorial',
            patternId: 'none',
            bannerEnabled: true,
            bannerHeight: 'md',
            bannerOpacity: 0.18,
          };
          await updateBoutiqueSettings(firestore, user.uid, newSettingsData);
          currentSettings = newSettingsData as unknown as BoutiqueSettings;
        }

        if (!isMountedRef.current) return;

        setLocalSettings({
          enabled: currentSettings?.enabled ?? false,
          featuredOutfitId: currentSettings?.featuredOutfitId || 'auto',
          templateId: currentSettings?.templateId ?? 'editorial',
          patternId: currentSettings?.patternId ?? 'none',
          bannerEnabled: currentSettings?.bannerEnabled ?? true,
          bannerHeight: currentSettings?.bannerHeight ?? 'md',
          bannerOpacity: currentSettings?.bannerOpacity ?? 0.18,
          quickLinks: currentSettings?.quickLinks ?? { enabled: false, items: [] },
          social: currentSettings?.social ?? { facebookEnabled: false, facebookUrl: '', position: 'right' },
          footer: currentSettings?.footer ?? { enabled: true, layout: 'minimal', headline: '', message: '', ctaLabel: '', ctaUrl: '' }
        });

        setIsInitialized(true);
      } catch (e) {
        initStartedRef.current = false;
        throw e;
      }
    };

    performInitialization();
  }, [
    user,
    firestore,
    userLoading,
    settingsLoading,
    brandLoading,
    boutiqueSettings,
  ]);

  const handleEnabledToggle = async (enabled: boolean) => {
    if (!user || !firestore) return;

    if (enabled && !handle?.handle) {
      toast({
        variant: 'destructive',
        title: 'Cannot go live',
        description: 'You must claim a public handle first.',
      });
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
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: e.message,
      });
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
        templateId: localSettings.templateId,
        patternId: localSettings.patternId,
        bannerEnabled: localSettings.bannerEnabled,
        bannerHeight: localSettings.bannerHeight,
        bannerOpacity: localSettings.bannerOpacity,
        quickLinks: localSettings.quickLinks,
        social: localSettings.social,
        footer: localSettings.footer,
      };

      await updateBoutiqueSettings(firestore, user.uid, settingsToSave);

      if (boutiqueSettings?.enabled && handle) {
        await syncPublicBoutiqueData(firestore, user.uid, handle.handle);
      }

      toast({ title: 'Configuration Saved!' });
    } catch (e: any) {
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
      handleForm.setError('handle', { type: 'manual', message: e.message });
    }
  };
  
    const handleCopyUrl = () => {
    if (!publicUrl) return;
    navigator.clipboard.writeText(publicUrl);
    toast({ title: 'URL Copied!', description: 'Your public boutique link is on your clipboard.' });
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
        const testPublicBoutiqueRef = doc(
          firestore,
          'publicBoutiques',
          randomHandle
        );

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
  
    const livePreviewProfile = useMemo(() => ({
        ...brandProfile,
        ...localSettings
    }), [brandProfile, localSettings]);

  const isConfigDirty = useMemo(() => {
    if (!boutiqueSettings) return false;
    return (
      (localSettings.featuredOutfitId || 'auto') !== (boutiqueSettings.featuredOutfitId || 'auto') ||
      (localSettings.templateId ?? 'editorial') !== (boutiqueSettings.templateId ?? 'editorial') ||
      (localSettings.patternId ?? 'none') !== (boutiqueSettings.patternId ?? 'none') ||
      (localSettings.bannerEnabled ?? true) !== (boutiqueSettings.bannerEnabled ?? true) ||
      (localSettings.bannerHeight ?? 'md') !== (boutiqueSettings.bannerHeight ?? 'md') ||
      (localSettings.bannerOpacity ?? 0.18) !== (boutiqueSettings.bannerOpacity ?? 0.18) ||
      JSON.stringify(localSettings.quickLinks) !== JSON.stringify(boutiqueSettings.quickLinks) ||
      JSON.stringify(localSettings.social) !== JSON.stringify(boutiqueSettings.social) ||
      JSON.stringify(localSettings.footer) !== JSON.stringify(boutiqueSettings.footer)
    );
  }, [localSettings, boutiqueSettings]);

  const renderHeader = () => (
    <header className="mb-12">
      <h1 className="text-5xl lg:text-6xl font-bold tracking-tight">
        My Boutique
      </h1>
      <p className="text-xl text-muted-foreground mt-3 max-w-2xl">
        Your personal boutique showcase. When you&apos;re ready, share it with the
        world.
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

              {publicUrl && (
                <div className="space-y-2 pt-2">
                  <Label>Your Public URL</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      readOnly
                      value={publicUrl}
                      className="bg-muted text-muted-foreground"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={handleCopyUrl}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          
           <Card>
            <CardHeader>
              <CardTitle>Public Handle</CardTitle>
              <CardDescription>
                Claim a unique URL for your boutique (e.g., /boutique/your-name).
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
                        <FormControl>
                          <Input placeholder="your-boutique-handle" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full">
                    {handle ? 'Update Handle' : 'Claim Handle'}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
          
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

           <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Palette className="h-5 w-5 text-accent" /> Boutique Designer
                </CardTitle>
              <CardDescription>
                Choose a theme and accent pattern for your public boutique.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
               <div className="space-y-2">
                <Label>Theme</Label>
                <Select
                  value={(localSettings.templateId as any) || 'editorial'}
                  onValueChange={(v) =>
                    setLocalSettings((prev) => ({ ...prev, templateId: v as any }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a theme..." />
                  </SelectTrigger>
                  <SelectContent>
                    {BOUTIQUE_TEMPLATES.map((id) => (
                      <SelectItem key={id} value={id}>
                        {id.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

               <div className="space-y-2">
                <Label>Accent Pattern</Label>
                <Select
                  value={(localSettings.patternId as any) || 'none'}
                  onValueChange={(v) =>
                    setLocalSettings((prev) => ({ ...prev, patternId: v as any }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a pattern..." />
                  </SelectTrigger>
                  <SelectContent>
                    {BOUTIQUE_PATTERNS.map((id) => (
                      <SelectItem key={id} value={id}>
                         {id.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
          
            <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                      <ImageIcon className="h-5 w-5 text-accent" /> Brand Snapshot
                  </CardTitle>
                </CardHeader>
                <CardContent>
                    {brandProfile ? (
                        <div className="space-y-6">
                            <div>
                                <Label className="text-xs text-muted-foreground">Logo Style</Label>
                                <div className="text-sm font-medium">
                                    { brandProfile?.logoStyle === 'circle' ? 'Circle Badge' : brandProfile?.logoStyle === 'rounded' ? 'Rounded Card' : 'Auto (Natural Shape)' }
                                </div>
                            </div>
                            <div>
                                <Label className="text-xs text-muted-foreground">Colors</Label>
                                <div className="flex items-center gap-2 mt-2">
                                {(brandProfile.brandColors && brandProfile.brandColors.length > 0) ? (
                                    brandProfile.brandColors.map((color, i) =>
                                        color ? <div key={i} className="h-8 w-8 rounded-full border" style={{ backgroundColor: color }} title={color} /> : null
                                    )
                                ) : (
                                    <p className="text-xs text-muted-foreground">No colors set</p>
                                )}
                                </div>
                            </div>
                             <div>
                                <Label className="text-xs text-muted-foreground">Fonts</Label>
                                <div className="mt-2 space-y-2">
                                    <div className="flex items-baseline justify-between gap-2">
                                        <span className="text-sm">Primary</span>
                                        <span className="font-semibold truncate" style={{ fontFamily: getFontByName(brandProfile.primaryFont)?.cssFamily }}>
                                            {brandProfile.primaryFont || 'Default'}
                                        </span>
                                    </div>
                                    <div className="flex items-baseline justify-between gap-2">
                                        <span className="text-sm">Secondary</span>
                                        <span className="font-semibold truncate" style={{ fontFamily: getFontByName(brandProfile.secondaryFont)?.cssFamily }}>
                                            {brandProfile.secondaryFont || 'Default'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                             <p className="text-xs text-muted-foreground text-center pt-4 border-t">
                                To change these,{' '}
                                <Link href="/my-brand" className="underline hover:text-accent">update My Brand</Link>.
                             </p>
                        </div>
                    ) : (
                         <p className="text-xs text-muted-foreground text-center p-4">
                            Set up{' '}
                            <Link href="/my-brand" className="underline hover:text-accent">My Brand</Link>
                            {' '}to see your snapshot.
                         </p>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <PictureInPicture className="h-5 w-5 text-accent" /> Banner
                    </CardTitle>
                <CardDescription>
                    Configure the top banner area of your boutique.
                </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center space-x-4 rounded-lg border p-4">
                        <Switch
                            checked={localSettings.bannerEnabled ?? true}
                            onCheckedChange={(checked) => setLocalSettings((prev) => ({ ...prev, bannerEnabled: checked }))}
                        />
                        <Label className="flex-grow">
                            Banner Enabled
                        </Label>
                    </div>
                    <div className="space-y-2">
                        <Label>Height</Label>
                        <Select
                            value={localSettings.bannerHeight ?? 'md'}
                            onValueChange={(v) => setLocalSettings((prev) => ({...prev, bannerHeight: v as any}))}
                        >
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="sm">Small</SelectItem>
                                <SelectItem value="md">Medium</SelectItem>
                                <SelectItem value="lg">Large</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Intensity</Label>
                        <Select
                            value={String(localSettings.bannerOpacity ?? 0.18)}
                            onValueChange={(v) => setLocalSettings((prev) => ({...prev, bannerOpacity: parseFloat(v)}))}
                        >
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="0.12">Subtle</SelectItem>
                                <SelectItem value="0.18">Medium</SelectItem>
                                <SelectItem value="0.28">Strong</SelectItem>
                                <SelectItem value="0.40">Bold</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Quick Links</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center space-x-4 rounded-lg border p-4">
                        <Switch
                            checked={localSettings.quickLinks?.enabled ?? false}
                            onCheckedChange={(checked) => setLocalSettings((prev) => ({ ...prev, quickLinks: { ...prev.quickLinks, items: prev.quickLinks?.items || [], enabled: checked } }))}
                        />
                        <Label className="flex-grow">Show Quick Links</Label>
                    </div>
                    {localSettings.quickLinks?.enabled && (
                        <div className="space-y-3">
                            {localSettings.quickLinks?.items?.map((item, index) => (
                                <div key={item.id} className="p-3 border rounded-md space-y-3 bg-muted/50">
                                    <div className="flex items-center gap-2">
                                        <div className="flex-grow space-y-2">
                                            <Input 
                                                placeholder="Label" 
                                                value={item.label}
                                                onChange={(e) => {
                                                    const newItems = [...(localSettings.quickLinks?.items || [])];
                                                    newItems[index].label = e.target.value;
                                                    setLocalSettings(prev => ({...prev, quickLinks: {...prev.quickLinks, items: newItems, enabled: prev.quickLinks?.enabled }}));
                                                }}
                                            />
                                            <Input 
                                                placeholder="URL" 
                                                value={item.url}
                                                onChange={(e) => {
                                                    const newItems = [...(localSettings.quickLinks?.items || [])];
                                                    newItems[index].url = e.target.value;
                                                    setLocalSettings(prev => ({...prev, quickLinks: {...prev.quickLinks, items: newItems, enabled: prev.quickLinks?.enabled }}));
                                                }}
                                            />
                                            <Select
                                                value={item.style || 'primary'}
                                                onValueChange={(style) => {
                                                    const newItems = [...(localSettings.quickLinks?.items || [])];
                                                    newItems[index].style = style as any;
                                                    setLocalSettings(prev => ({...prev, quickLinks: {...prev.quickLinks, items: newItems, enabled: prev.quickLinks?.enabled }}));
                                                }}
                                            >
                                                <SelectTrigger><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="primary">Primary</SelectItem>
                                                    <SelectItem value="secondary">Secondary</SelectItem>
                                                    <SelectItem value="text">Text</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <Button type="button" size="icon" variant="ghost" disabled={index === 0} onClick={() => {
                                                const newItems = [...(localSettings.quickLinks?.items || [])];
                                                [newItems[index], newItems[index-1]] = [newItems[index-1], newItems[index]];
                                                setLocalSettings(prev => ({...prev, quickLinks: {...prev.quickLinks, items: newItems, enabled: prev.quickLinks?.enabled}}));
                                            }}><ArrowUp className="h-4 w-4" /></Button>
                                            <Button type="button" size="icon" variant="ghost" disabled={index === (localSettings.quickLinks?.items?.length || 0) - 1} onClick={() => {
                                                const newItems = [...(localSettings.quickLinks?.items || [])];
                                                [newItems[index], newItems[index+1]] = [newItems[index+1], newItems[index]];
                                                setLocalSettings(prev => ({...prev, quickLinks: {...prev.quickLinks, items: newItems, enabled: prev.quickLinks?.enabled}}));
                                            }}><ArrowDown className="h-4 w-4" /></Button>
                                            <Button type="button" size="icon" variant="ghost" onClick={() => {
                                                const newItems = (localSettings.quickLinks?.items || []).filter(i => i.id !== item.id);
                                                setLocalSettings(prev => ({...prev, quickLinks: {...prev.quickLinks, items: newItems, enabled: prev.quickLinks?.enabled}}));
                                            }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {(localSettings.quickLinks?.items?.length || 0) < 6 && (
                                <Button type="button" variant="outline" className="w-full" onClick={() => {
                                    const newItems = [...(localSettings.quickLinks?.items || []), { id: crypto.randomUUID(), label: '', url: '', style: 'primary' }];
                                    setLocalSettings(prev => ({...prev, quickLinks: {...prev.quickLinks, items: newItems, enabled: prev.quickLinks?.enabled}}));
                                }}><Plus className="mr-2 h-4 w-4" /> Add Link</Button>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>
            
            <Card>
                <CardHeader><CardTitle>Social</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center space-x-4 rounded-lg border p-4">
                        <Switch
                            checked={localSettings.social?.facebookEnabled ?? false}
                            onCheckedChange={(checked) => setLocalSettings((prev) => ({ ...prev, social: { ...prev.social, facebookEnabled: checked } }))}
                        />
                        <Label className="flex-grow">Floating Facebook Button</Label>
                    </div>
                     <div className="space-y-2">
                        <Label>Facebook URL</Label>
                        <Input 
                            placeholder="https://facebook.com/your-page"
                            value={localSettings.social?.facebookUrl || ''}
                            onChange={(e) => setLocalSettings(prev => ({...prev, social: {...prev.social, facebookUrl: e.target.value}}))}
                        />
                     </div>
                     <div className="space-y-2">
                        <Label>Position</Label>
                        <Select
                            value={localSettings.social?.position || 'right'}
                            onValueChange={(pos) => setLocalSettings(prev => ({...prev, social: {...prev.social, position: pos as any}}))}
                        >
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="left">Left</SelectItem>
                                <SelectItem value="right">Right</SelectItem>
                            </SelectContent>
                        </Select>
                     </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader><CardTitle>Footer</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                     <div className="flex items-center space-x-4 rounded-lg border p-4">
                        <Switch
                            checked={localSettings.footer?.enabled ?? true}
                            onCheckedChange={(checked) => setLocalSettings((prev) => ({ ...prev, footer: { ...prev.footer, enabled: checked } }))}
                        />
                        <Label className="flex-grow">Show Footer</Label>
                    </div>
                    <div className="space-y-2">
                        <Label>Layout</Label>
                        <Select
                            value={localSettings.footer?.layout || 'minimal'}
                            onValueChange={(layout) => setLocalSettings(prev => ({...prev, footer: {...prev.footer, layout: layout as any}}))}
                        >
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="minimal">Minimal</SelectItem>
                                <SelectItem value="centered">Centered</SelectItem>
                                <SelectItem value="split">Split</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Headline</Label>
                        <Input value={localSettings.footer?.headline || ''} onChange={(e) => setLocalSettings(prev => ({...prev, footer: {...prev.footer, headline: e.target.value}}))} />
                    </div>
                    <div className="space-y-2">
                        <Label>Message</Label>
                        <Input value={localSettings.footer?.message || ''} onChange={(e) => setLocalSettings(prev => ({...prev, footer: {...prev.footer, message: e.target.value}}))} />
                    </div>
                    <div className="space-y-2">
                        <Label>CTA Label</Label>
                        <Input value={localSettings.footer?.ctaLabel || ''} onChange={(e) => setLocalSettings(prev => ({...prev, footer: {...prev.footer, ctaLabel: e.target.value}}))} />
                    </div>
                    <div className="space-y-2">
                        <Label>CTA URL</Label>
                        <Input value={localSettings.footer?.ctaUrl || ''} onChange={(e) => setLocalSettings(prev => ({...prev, footer: {...prev.footer, ctaUrl: e.target.value}}))} />
                    </div>
                </CardContent>
            </Card>


          {isAdmin && (
            <Card>
              <CardHeader>
                <CardTitle>Admin Tools</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button onClick={handleSelfTest} disabled={isTesting} className="w-full">
                  {isTesting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
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
                brandProfile={livePreviewProfile as any}
                featuredOutfit={featuredOutfit}
                templateId={localSettings.templateId ?? 'editorial'}
                patternId={localSettings.patternId ?? 'none'}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
