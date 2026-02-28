'use client';

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { useUser, useFirestore, useDoc, useCollection } from '@/firebase';
import { useOutfits, type Outfit } from '@/lib/outfits';
import {
  BoutiqueSettings,
  useBoutiqueSettings,
  updateBoutiqueSettings,
  useUserHandle,
  claimHandleTransaction,
  updateHandleTransaction,
  syncPublicBoutiqueData,
  handleSchema,
  PublicBoutiqueProfile,
} from '@/lib/boutique';
import { useToast } from '@/hooks/use-toast';
import { isAdminEmail } from '@/lib/admin';

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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Copy,
  ExternalLink,
  Eye,
  Globe,
  Info,
  Loader2,
  Save,
  XCircle,
} from 'lucide-react';
import { doc, setDoc, serverTimestamp, updateDoc, getDoc, deleteDoc, runTransaction } from 'firebase/firestore';
import { BoutiqueLivePreview } from '@/components/boutique/BoutiqueLivePreview';

type HandleFormValues = z.infer<typeof handleSchema>;

export default function MyBoutiquePage() {
  const { user, loading: userLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const { handle, loading: handleLoading, error: handleEror } = useUserHandle(user?.uid || null);

  const { data: boutiqueSettings, loading: settingsLoading, error: settingsError } =
    useBoutiqueSettings(user?.uid || null);

  const brandProfileRef = useMemo(() => {
    if (!user || !firestore) return null;
    return doc(firestore, `users/${user.uid}/brandProfile/main`);
  }, [user, firestore]);

  const { data: brandProfile, loading: brandLoading, error: brandError } = useDoc<any>(brandProfileRef);
  
  const { outfits, loading: outfitsLoading, error: outfitsError } = useOutfits(user?.uid || null);

  const [localSettings, setLocalSettings] = useState<Partial<BoutiqueSettings>>({});
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [publicUrl, setPublicUrl] = useState('');

  const handleForm = useForm<HandleFormValues>({
    resolver: zodResolver(handleSchema),
    defaultValues: { handle: '' },
  });
  
  const isAdmin = isAdminEmail(user?.email);
  const [isTesting, setIsTesting] = useState(false);
  const [selfTestResults, setSelfTestResults] = useState<{ step: string; ok: boolean; error?: string }[]>([]);


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
    if (userLoading || settingsLoading) return;
    if (!user) return;

    if (boutiqueSettings) {
      setLocalSettings({
        enabled: boutiqueSettings.enabled,
        featuredOutfitId: boutiqueSettings.featuredOutfitId || 'auto',
        stylePreset: boutiqueSettings.stylePreset || 'magazine',
        accentColor: boutiqueSettings.accentColor || brandProfile?.brandColors?.[0] || null,
      });
      setIsInitialized(true);
    } else if (!settingsError) {
      // If settings are missing, create them.
      (async () => {
        try {
          if (!firestore) throw new Error('Firestore not available');
          const defaults = {
            enabled: false,
            featuredOutfitId: null,
            accentColor: brandProfile?.brandColors?.[0] || null,
            stylePreset: 'magazine',
            handle: null,
          };
          await updateBoutiqueSettings(firestore, user.uid, defaults);
        } catch (e: any) {
          console.error('[MyBoutique] Failed to create default settings:', e);
          toast({ variant: 'destructive', title: 'Initialization Failed', description: e.message });
        }
      })();
    }
  }, [user, userLoading, firestore, boutiqueSettings, settingsLoading, settingsError, brandProfile, toast]);

  // --- Handlers ---
  
  const handleEnabledToggle = async (enabled: boolean) => {
    if (!user || !firestore || !handle?.handle) {
      toast({ variant: 'destructive', title: 'Cannot go live', description: 'You must claim a public handle first.' });
      return;
    }
    
    setIsSyncing(true);
    toast({ title: 'Updating boutique status...', description: 'Please wait.' });

    try {
        if (enabled) {
            await syncPublicBoutiqueData(firestore, user.uid, handle.handle);
        }
        
        const publicBoutiqueRef = doc(firestore, "publicBoutiques", handle.handle);
        await updateDoc(publicBoutiqueRef, { enabled, updatedAt: serverTimestamp() });
        await updateBoutiqueSettings(firestore, user.uid, { enabled });
      
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
    } finally {
      setIsSyncing(false);
    }
  };

  const handleConfigSave = async () => {
    if (!user || !firestore) return;
    setIsSavingConfig(true);
    try {
      const settingsToSave: Partial<BoutiqueSettings> = {
        featuredOutfitId:
          localSettings.featuredOutfitId === 'auto' ? null : localSettings.featuredOutfitId,
        stylePreset: localSettings.stylePreset as any,
        accentColor: localSettings.accentColor
      };
      await updateBoutiqueSettings(firestore, user.uid, settingsToSave);

      if (boutiqueSettings?.enabled && handle) {
        await syncPublicBoutiqueData(firestore, user.uid, handle.handle);
      }

      toast({ title: 'Configuration Saved!' });
    } catch (e: any) {
      console.error('[MyBoutique] Failed to save config:', e);
      toast({ variant: 'destructive', title: 'Save Failed', description: e.message });
    } finally {
      setIsSavingConfig(false);
    }
  };

  const onClaimSubmit = async (values: HandleFormValues) => {
    if (!user || !firestore) return;
    
    const isUpdate = !!handle;
    const newHandle = values.handle;
    const oldHandle = handle?.handle;

    if (isUpdate && newHandle === oldHandle) {
        toast({ title: "No Changes", description: "You already own this handle." });
        return;
    }
    
    handleForm.clearErrors();
    
    try {
        if (isUpdate && oldHandle) {
            await updateHandleTransaction(firestore, user, oldHandle, newHandle);
            toast({ title: 'Handle Updated!', description: `Your new public URL is /boutique/${newHandle}` });
        } else {
            await claimHandleTransaction(firestore, user, newHandle);
            // After a successful claim, we must also write the handle to the private settings doc
            await updateBoutiqueSettings(firestore, user.uid, { handle: newHandle });
            toast({ title: 'Handle Claimed!', description: `Your boutique is now ready to go live at /boutique/${newHandle}` });
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
    // Store original state to restore it later
    const originalSettings = {
        handle: handle?.handle || null,
        enabled: boutiqueSettings?.enabled ?? false,
    };

    try {
        // Step 1: Claim Test Handle (Transactionally)
        await runTransaction(firestore, async (transaction) => {
            const testHandleRef = doc(firestore, 'handles', randomHandle);
            const testPublicBoutiqueRef = doc(firestore, 'publicBoutiques', randomHandle);

            const testHandleSnap = await transaction.get(testHandleRef);
            if (testHandleSnap.exists()) {
                throw new Error(`Test handle '${randomHandle}' already exists.`);
            }
            const now = serverTimestamp();
            transaction.set(testHandleRef, { uid: user.uid, handle: randomHandle, createdAt: now, updatedAt: now });
            transaction.set(testPublicBoutiqueRef, { uid: user.uid, handle: randomHandle, enabled: false, updatedAt: now });
        });
        addResult({ step: '1. Claim Test Handle', ok: true });
        
        // Step 2: Update Private Settings to use the test handle
        await updateBoutiqueSettings(firestore, user.uid, { handle: randomHandle });
        addResult({ step: '2. Update Private Settings', ok: true });

        // Step 3: Sync Public Data
        await syncPublicBoutiqueData(firestore, user.uid, randomHandle);
        addResult({ step: '3. Sync Public Data', ok: true });

        // Step 4: Enable Boutique
        const publicBoutiqueRef = doc(firestore, 'publicBoutiques', randomHandle);
        await updateDoc(publicBoutiqueRef, { enabled: true });
        await updateBoutiqueSettings(firestore, user.uid, { enabled: true });
        addResult({ step: '4. Enable Boutique', ok: true });

        // Step 5: Verify Live Status
        const liveDocSnap = await getDoc(publicBoutiqueRef);
        if (!liveDocSnap.exists() || !liveDocSnap.data()?.enabled) {
            throw new Error('Verification failed: Public document is not enabled.');
        }
        addResult({ step: '5. Verify Live Status', ok: true });
        
        // Step 6: Disable Boutique
        await updateDoc(publicBoutiqueRef, { enabled: false });
        await updateBoutiqueSettings(firestore, user.uid, { enabled: false });
        addResult({ step: '6. Disable Boutique', ok: true });

        toast({ title: 'Self-Test Passed!', description: 'All steps completed successfully.' });

    } catch (e: any) {
        const lastStep = steps.length > 0 ? steps[steps.length - 1] : { step: '0. Initializing', ok: false };
        const stepNum = steps.findIndex(s => !s.ok);
        const failedStepName = stepNum !== -1 ? `Step ${stepNum + 1}` : `Step ${steps.length + 1}`;
        
        addResult({ step: `${failedStepName}: ${lastStep.step.split('.')[1]?.trim() || 'Execution'}`, ok: false, error: e.message });
        toast({ variant: 'destructive', title: `Self-Test Failed at ${failedStepName}`, description: e.message });
    } finally {
        // Final Cleanup step (runs on success or failure after catch)
        try {
            const handleRef = doc(firestore, 'handles', randomHandle);
            const publicBoutiqueRef = doc(firestore, 'publicBoutiques', randomHandle);
            const handleSnap = await getDoc(handleRef);
            const publicSnap = await getDoc(publicBoutiqueRef);

            if (handleSnap.exists()) await deleteDoc(handleRef);
            if (publicSnap.exists()) await deleteDoc(publicBoutiqueRef);
            
            // Restore original settings
            await updateBoutiqueSettings(firestore, user.uid, originalSettings);
            
            addResult({ step: '7. Cleanup & Restore', ok: true });

        } catch (cleanupError: any) {
             addResult({ step: '7. Cleanup & Restore', ok: false, error: cleanupError.message });
             console.error("Critical: Failed to cleanup test data or restore settings:", cleanupError);
             toast({ variant: 'destructive', title: 'Cleanup Failed', description: 'Test data may not have been fully removed.' });
        }
        
        setIsTesting(false);
    }
};

  // --- Derived State & Memos ---
  const loading = userLoading || !isInitialized || outfitsLoading || brandLoading || handleLoading;
  const anyError = settingsError || brandError || outfitsError || handleEror;

  const featuredOutfit = useMemo(() => {
    if (!outfits) return undefined;
    const featuredId = localSettings.featuredOutfitId;
    if (featuredId === 'auto' || !featuredId) {
      return outfits.find(o => o.status === 'published') || outfits[0];
    }
    return outfits.find((o) => o.id === featuredId);
  }, [localSettings.featuredOutfitId, outfits]);
  
  const isConfigDirty = useMemo(() => boutiqueSettings ? 
    (localSettings.featuredOutfitId !== (boutiqueSettings.featuredOutfitId || 'auto')) || 
    (localSettings.stylePreset !== (boutiqueSettings.stylePreset || 'magazine')) ||
    (localSettings.accentColor !== (boutiqueSettings.accentColor || brandProfile?.brandColors?.[0] || null))
    : false,
    [localSettings, boutiqueSettings, brandProfile]
  );
  
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

  const renderHandleCard = () => {
    const isLive = boutiqueSettings?.enabled;

    return (
      <Card>
        <CardHeader>
          <CardTitle>Public Handle</CardTitle>
          <CardDescription>This becomes your public link: /boutique/your-handle</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...handleForm}>
            <form onSubmit={handleForm.handleSubmit(onClaimSubmit)} className="space-y-4">
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
                        <Input placeholder="your-handle" {...field} className="rounded-l-none" disabled={isLive || handleForm.formState.isSubmitting} />
                      </FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex flex-col gap-4">
                <Button type="submit" disabled={isLive || handleForm.formState.isSubmitting || !handleForm.formState.isDirty}>
                  {handleForm.formState.isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  {handle ? 'Update Handle' : 'Claim Handle'}
                </Button>
                {isLive && (
                    <p className="text-xs text-muted-foreground text-center">Disable "Boutique is Live" to change your handle.</p>
                )}
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    );
  };
  
  if (userLoading) {
    return (
        <div className="flex-1 flex items-center justify-center p-8">
            <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
        </div>
    );
  }

  if (anyError) {
    console.error("[MyBoutique] Rendering error state:", anyError);
    return (
      <div className="flex-1 p-8 sm:p-10 lg:p-12">
        {renderHeader()}
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error Loading Boutique Data</AlertTitle>
          <AlertDescription>
            <p>There was a problem loading your data. Please try refreshing the page.</p>
            <pre className="mt-2 text-xs bg-destructive/10 p-2 rounded">{anyError.message}</pre>
          </AlertDescription>
        </Alert>
      </div>
    );
  }
  
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
              <CardTitle>Boutique Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-4 rounded-lg border p-4">
                {isSyncing ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                    <Switch
                        id="boutique-enabled"
                        checked={boutiqueSettings?.enabled ?? false}
                        onCheckedChange={handleEnabledToggle}
                        disabled={!handle}
                    />
                )}
                <Label htmlFor="boutique-enabled" className="flex-grow">
                  Boutique is {boutiqueSettings?.enabled ? 'Live' : 'Private'}
                </Label>
              </div>
               <p className="text-sm text-muted-foreground mt-3 px-1">
                {boutiqueSettings?.enabled ? 'Your boutique is public and can be viewed by anyone with the link.' : 'Your boutique is currently private. Only you can see it.'}
            </p>
            {!handle && (
                <Alert variant="destructive" className="mt-4">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Handle Required</AlertTitle>
                    <AlertDescription>You must claim a public handle before your boutique can go live.</AlertDescription>
                </Alert>
            )}
            </CardContent>
          </Card>
          
          {renderHandleCard()}
          
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
                            Visit Public Page <ExternalLink className="h-4 w-4"/>
                       </Link>
                    </Button>
                     <Button variant="outline" className="w-full justify-between" onClick={() => { navigator.clipboard.writeText(publicUrl); toast({ title: 'Link Copied!' }); }}>
                        Copy Link <Copy className="h-4 w-4"/>
                    </Button>
                </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Configuration</CardTitle>
              <CardDescription>
                Choose what to feature on your boutique page.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-2">
                    <Label>Featured Outfit</Label>
                    <Select value={localSettings.featuredOutfitId || 'auto'} onValueChange={(v) => setLocalSettings(prev => ({...prev, featuredOutfitId: v}))}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select an outfit..." />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="auto">Auto (newest published look)</SelectItem>
                            {outfits?.map(outfit => (
                                <SelectItem key={outfit.id} value={outfit.id}>{outfit.title}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                 <div className="space-y-2">
                    <Label>Style Preset</Label>
                    <Select value={localSettings.stylePreset || 'magazine'} onValueChange={(v) => setLocalSettings(prev => ({...prev, stylePreset: v as any}))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="magazine">Magazine</SelectItem>
                            <SelectItem value="modern">Modern</SelectItem>
                            <SelectItem value="classic">Classic</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <Button onClick={handleConfigSave} disabled={isSavingConfig || !isConfigDirty} className="w-full">
                    {isSavingConfig ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
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
                    <Button onClick={handleSelfTest} disabled={isTesting} className="w-full">
                        {isTesting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Run Boutique Self-Test
                    </Button>
                    {selfTestResults.length > 0 && (
                        <div className="p-3 border rounded-md bg-muted/50 space-y-2">
                            <p className="text-sm font-medium">Test Results:</p>
                            <ul className="text-xs space-y-1">
                                {selfTestResults.map((result, i) => (
                                    <li key={i} className={`flex items-center gap-2 ${!result.ok ? 'text-destructive' : ''}`}>
                                        {result.ok ? <CheckCircle2 className="h-3.5 w-3.5 text-green-600" /> : <XCircle className="h-3.5 w-3.5" />}
                                        <span>{result.step}</span>
                                        {result.error && <span className="font-mono text-destructive/80">- {result.error}</span>}
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
                    <CardTitle className="flex items-center gap-2"><Eye className="h-5 w-5" /> Live Preview</CardTitle>
                </CardHeader>
                <CardContent>
                    <BoutiqueLivePreview brandProfile={brandProfile} featuredOutfit={featuredOutfit} accentColor={localSettings.accentColor || '#111827'} />
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
