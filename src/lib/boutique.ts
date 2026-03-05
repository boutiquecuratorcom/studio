'use client';

import {
  doc,
  setDoc,
  serverTimestamp,
  type DocumentData,
  type Firestore,
  runTransaction,
  getDoc,
  query,
  collection,
  where,
  limit,
  getDocs,
  orderBy,
} from 'firebase/firestore';

import { useDoc, useFirestore, useCollection } from '@/firebase';
import { useMemo } from 'react';
import type { User } from 'firebase/auth';
import { z } from 'zod';

import { type Outfit, type OutfitClaim } from './outfits';
import {
  type BoutiqueTemplateId,
  type BoutiquePatternId,
  type BrandProfilePublicBits,
} from '@/lib/brand/brandPublicBits';

// ------------------------------
// Canonical Refs (GUARDRAIL #1)
// ------------------------------
export const getBoutiqueSettingsRef = (firestore: Firestore, userId: string) => {
  return doc(firestore, `users/${userId}/boutiqueSettings/main`);
};

export const getBrandProfileRef = (firestore: Firestore, userId: string) => {
  return doc(firestore, `users/${userId}/brandProfile/main`);
};

// ------------------------------
// Helpers
// ------------------------------
type AnyRecord = Record<string, any>;
const asRecord = (v: unknown): AnyRecord => (v && typeof v === 'object' ? (v as AnyRecord) : {});

const withDefaultBool = (v: boolean | null | undefined, d: boolean) =>
  v === null || v === undefined ? d : v;

const DEV_ASSERT = process.env.NODE_ENV !== 'production';

// ------------------------------
// Interfaces
// ------------------------------
export interface BoutiqueSettings extends DocumentData {
  id: string;
  enabled: boolean;
  featuredOutfitId: string | null;
  handle: string | null;

  templateId?: BoutiqueTemplateId | null;
  patternId?: BoutiquePatternId | null;
  accentColorIndex?: 0 | 1 | 2 | null;

  bannerEnabled?: boolean | null;
  bannerHeight?: 'sm' | 'md' | 'lg' | null;
  bannerOpacity?: number | null;

  announcementEnabled?: boolean | null;
  announcementText?: string | null;
  announcementHref?: string | null;
  announcementCtaLabel?: string | null;
  announcementColorSource?: 'accent' | 'color2' | 'color3' | null;

  quickLinks?: {
    enabled?: boolean;
    items?: {
      id: string;
      label: string;
      url: string;
      style?: 'primary' | 'secondary' | 'text';
    }[];
  };

  social?: {
    facebookEnabled?: boolean;
    facebookUrl?: string | null;
    position?: 'left' | 'right';
  };

  footer?: {
    enabled?: boolean;
    layout?: 'minimal' | 'centered' | 'split';
    headline?: string | null;
    message?: string | null;
    ctaLabel?: string | null;
    ctaUrl?: string | null;
  };

  showFeaturedLook?: boolean | null;
  showOutfits?: boolean | null;
  showRack?: boolean | null;

  updatedAt?: any;
}

export interface HandleMapping {
  id: string; // The handle (doc id)
  uid: string;
  handle: string;
  createdAt: any;
  updatedAt: any;
}

export interface PublicBoutiqueProfile extends BrandProfilePublicBits {
  id: string; // The handle (doc id)
  uid: string;
  handle: string;
  enabled: boolean;

  templateId?: BoutiqueTemplateId | null;
  patternId?: BoutiquePatternId | null;

  bannerEnabled?: boolean | null;
  bannerHeight?: 'sm' | 'md' | 'lg' | null;
  bannerOpacity?: number | null;

  announcementEnabled?: boolean | null;
  announcementText?: string | null;
  announcementHref?: string | null;
  announcementCtaLabel?: string | null;
  announcementColorSource?: 'accent' | 'color2' | 'color3' | null;

  featuredOutfit: {
    id: string;
    title: string | null;
    imageUrl: string | null;
    description: string | null;
    itemCount: number | null;
    outfitClaim: OutfitClaim | null;
  } | null;

  quickLinks?: BoutiqueSettings['quickLinks'];
  social?: BoutiqueSettings['social'];
  footer?: BoutiqueSettings['footer'];

  showFeaturedLook?: boolean | null;
  showOutfits?: boolean | null;
  showRack?: boolean | null;

  updatedAt: any;
}

// ------------------------------
// Normalizer
// ------------------------------
export function normalizeBoutiqueSettings(raw: any): BoutiqueSettings {
  const settings = raw || {};
  const design = settings.design || {};

  const normalized = {
    ...settings,

    // design fallbacks
    templateId: settings.templateId ?? design.template ?? 'editorial',
    patternId: settings.patternId ?? design.patternId ?? 'none',

    enabled: withDefaultBool(settings.enabled, false),
    handle: settings.handle ?? null,
    featuredOutfitId: settings.featuredOutfitId ?? 'auto',

    accentColorIndex: settings.accentColorIndex ?? 0,

    bannerEnabled: withDefaultBool(settings.bannerEnabled, true),
    bannerHeight: settings.bannerHeight ?? 'md',
    bannerOpacity: settings.bannerOpacity ?? 0.18,

    announcementEnabled: withDefaultBool(settings.announcementEnabled, false),
    announcementText: settings.announcementText ?? '',
    announcementHref: settings.announcementHref ?? '',
    announcementCtaLabel: settings.announcementCtaLabel ?? '',
    announcementColorSource: settings.announcementColorSource ?? 'accent',

    quickLinks: settings.quickLinks ?? { enabled: false, items: [] },
    social: settings.social ?? {
      facebookEnabled: false,
      facebookUrl: '',
      position: 'right',
    },
    footer: settings.footer ?? {
      enabled: true,
      layout: 'minimal',
      headline: '',
      message: '',
      ctaLabel: '',
      ctaUrl: '',
    },

    showFeaturedLook: withDefaultBool(settings.showFeaturedLook, true),
    showOutfits: withDefaultBool(settings.showOutfits, true),
    showRack: withDefaultBool(settings.showRack, true),
  };

  return normalized as BoutiqueSettings;
}

// ------------------------------
// Validation
// ------------------------------
const RESERVED_HANDLES = new Set([
  'admin',
  'dashboard',
  'login',
  'signup',
  'support',
  'terms',
  'privacy',
  'api',
  '_next',
  'firebase',
  'public',
  'boutique-curator',
  'settings',
  'inventory',
  'outfits',
  'editor',
  'post-creator',
  'engagement-machine',
  'my-brand',
  'my-boutique',
  'uploads',
  'profile',
  'looks',
  'boutique',
]);

export const handleSchema = z.object({
  handle: z
    .string()
    .transform((val) =>
      val
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '')
        .replace(/-+/g, '-')
    )
    .refine((s) => s.length >= 3, 'Handle must be at least 3 characters long.')
    .refine((s) => s.length <= 30, 'Handle cannot be more than 30 characters.')
    .refine((s) => /^[a-z]/.test(s), 'Must start with a letter.')
    .refine((s) => !s.endsWith('-'), 'Cannot end with a hyphen.')
    .refine((s) => !s.includes('--'), 'Cannot contain consecutive hyphens.')
    .refine((s) => !RESERVED_HANDLES.has(s), 'This handle is reserved. Please choose another.'),
});

// ------------------------------
// Hooks (GUARDRAIL: canonical ref)
// ------------------------------
export const useBoutiqueSettings = (userId: string | null) => {
  const firestore = useFirestore();

  const docRef = useMemo(() => {
    if (!userId || !firestore) return null;
    return getBoutiqueSettingsRef(firestore, userId);
  }, [userId, firestore]);

  const { data, ...rest } = useDoc<BoutiqueSettings>(docRef as any);

  // Always return normalized settings once data exists.
  const normalized = useMemo(() => {
    if (typeof data === 'undefined') return data; // preserve hook’s undefined-loading semantics
    return normalizeBoutiqueSettings(data ?? {});
  }, [data]);

  return { data: normalized as any, ...rest };
};

export const useUserHandle = (userId: string | null) => {
  const firestore = useFirestore();

  const q = useMemo(() => {
    if (!userId || !firestore) return null;
    return query(collection(firestore, 'handles'), where('uid', '==', userId), limit(1));
  }, [userId, firestore]);

  const { data, ...rest } = useCollection<HandleMapping>(q as any, 'handles');
  return { handle: data?.[0], ...rest };
};

export const usePublicBoutiqueByHandle = (handle: string | null) => {
  const firestore = useFirestore();

  const docRef = useMemo(() => {
    if (!handle || !firestore) return null;
    return doc(firestore, 'publicBoutiques', handle);
  }, [handle, firestore]);

  return useDoc<PublicBoutiqueProfile>(docRef as any);
};

// ------------------------------
// Data Functions
// ------------------------------
export const claimHandleTransaction = async (firestore: Firestore, user: User, handle: string) => {
  handleSchema.parse({ handle });

  const userHandleQuery = query(
    collection(firestore, 'handles'),
    where('uid', '==', user.uid),
    limit(1)
  );

  const newHandleRef = doc(firestore, 'handles', handle);
  const publicBoutiqueRef = doc(firestore, 'publicBoutiques', handle);

  // GUARDRAIL: canonical settings ref
  const settingsRef = getBoutiqueSettingsRef(firestore, user.uid);

  const userProfileRef = doc(firestore, `users/${user.uid}`);

  await runTransaction(firestore, async (transaction) => {
    const [userHandleSnap, newHandleSnap] = await Promise.all([
      getDocs(userHandleQuery),
      transaction.get(newHandleRef),
    ]);

    if (newHandleSnap.exists()) {
      const handleData = asRecord(newHandleSnap.data());
      if (handleData.uid !== user.uid) {
        throw new Error('This handle is already taken. Please choose another.');
      }
    } else if (!userHandleSnap.empty) {
      const existingHandle = userHandleSnap.docs[0].id;
      if (existingHandle !== handle) {
        throw new Error(`You already have a handle (${existingHandle}). You can only have one.`);
      }
    }

    const now = serverTimestamp();

    transaction.set(
      newHandleRef,
      {
        uid: user.uid,
        handle,
        createdAt: asRecord(newHandleSnap.data()).createdAt || now,
        updatedAt: now,
      },
      { merge: true }
    );

    transaction.set(
      publicBoutiqueRef,
      {
        uid: user.uid,
        handle,
        enabled: false,
        updatedAt: now,
      },
      { merge: true }
    );

    transaction.set(settingsRef, { handle }, { merge: true });
    transaction.set(userProfileRef, { handle }, { merge: true });
  });
};

export const updateHandleTransaction = async (
  firestore: Firestore,
  user: User,
  oldHandle: string,
  newHandle: string
) => {
  handleSchema.parse({ handle: newHandle });
  if (newHandle === oldHandle) return;

  const oldHandleRef = doc(firestore, 'handles', oldHandle);
  const newHandleRef = doc(firestore, 'handles', newHandle);

  const userProfileRef = doc(firestore, 'users', user.uid);

  // GUARDRAIL: canonical settings ref
  const settingsRef = getBoutiqueSettingsRef(firestore, user.uid);

  const oldPublicBoutiqueRef = doc(firestore, 'publicBoutiques', oldHandle);

  await runTransaction(firestore, async (transaction) => {
    const [oldHandleSnap, newHandleSnap] = await Promise.all([
      transaction.get(oldHandleRef),
      transaction.get(newHandleRef),
    ]);

    const oldHandleData = asRecord(oldHandleSnap.data());

    if (!oldHandleSnap.exists() || oldHandleData.uid !== user.uid) {
      throw new Error('You do not own the handle you are trying to update.');
    }

    if (newHandleSnap.exists() && asRecord(newHandleSnap.data()).uid !== user.uid) {
      throw new Error('This handle is already taken. Please choose another.');
    }

    const now = serverTimestamp();

    transaction.set(newHandleRef, {
      uid: user.uid,
      handle: newHandle,
      createdAt: oldHandleData.createdAt || now,
      updatedAt: now,
    });

    transaction.delete(oldHandleRef);

    const oldPublicDataSnap = await transaction.get(oldPublicBoutiqueRef);
    if (oldPublicDataSnap.exists()) {
      const newPublicBoutiqueRef = doc(firestore, 'publicBoutiques', newHandle);
      const publicDataToMigrate = {
        ...asRecord(oldPublicDataSnap.data()),
        uid: user.uid,
        handle: newHandle,
        updatedAt: now,
      };
      transaction.set(newPublicBoutiqueRef, publicDataToMigrate);
      transaction.delete(oldPublicBoutiqueRef);
    }

    transaction.set(settingsRef, { handle: newHandle }, { merge: true });
    transaction.set(userProfileRef, { handle: newHandle }, { merge: true });
  });
};

// GUARDRAIL #2: update uses canonical ref + dev readback proof
export const updateBoutiqueSettings = async (
  firestore: Firestore,
  userId: string,
  data: Partial<Omit<BoutiqueSettings, 'id'>>
) => {
  const settingsRef = getBoutiqueSettingsRef(firestore, userId);

  await setDoc(settingsRef, { ...data, updatedAt: serverTimestamp() }, { merge: true });

  if (DEV_ASSERT) {
    const snap = await getDoc(settingsRef);
    console.log('[BOUTIQUE][updateBoutiqueSettings] readback', {
      userId,
      exists: snap.exists(),
      data: snap.exists() ? snap.data() : null,
    });
  }
};

export const syncPublicBoutiqueData = async (
  firestore: Firestore,
  userId: string,
  handle: string | null | undefined
) => {
  if (!handle || typeof handle !== 'string') {
    throw new Error('Sync failed: A valid handle is required.');
  }

  // GUARDRAIL: canonical refs
  const settingsRef = getBoutiqueSettingsRef(firestore, userId);
  const brandRef = getBrandProfileRef(firestore, userId);

  const outfitsQuery = query(
    collection(firestore, 'outfits'),
    where('ownerId', '==', userId),
    orderBy('createdAt', 'desc')
  );

  const [settingsSnap, brandSnap, outfitsSnap] = await Promise.all([
    getDoc(settingsRef),
    getDoc(brandRef),
    getDocs(outfitsQuery),
  ]);

  const settings = normalizeBoutiqueSettings(settingsSnap.data() ?? {});
  const brandProfile = (brandSnap.data() ?? {}) as BrandProfilePublicBits;

  let featuredOutfit: Outfit | null = null;

  const outfitDocs = outfitsSnap.docs;
  const pickOutfitFromDoc = (d: any): Outfit => ({ id: d.id, ...asRecord(d.data()) } as Outfit);

  if (settings.featuredOutfitId && settings.featuredOutfitId !== 'auto') {
    const outfitDoc = outfitDocs.find((d) => d.id === settings.featuredOutfitId);
    if (outfitDoc) featuredOutfit = pickOutfitFromDoc(outfitDoc);
  }

  if (!featuredOutfit) {
    const firstPublished = outfitDocs.find((d) => asRecord(d.data()).status === 'published');
    if (firstPublished) featuredOutfit = pickOutfitFromDoc(firstPublished);
    else if (outfitDocs.length > 0) featuredOutfit = pickOutfitFromDoc(outfitDocs[0]);
  }

  const publicData: Omit<PublicBoutiqueProfile, 'id' | 'updatedAt'> = {
    uid: userId,
    handle,
    enabled: settings.enabled,

    brandName: brandProfile.brandName ?? null,
    tagline: brandProfile.tagline ?? null,
    logoUrl: brandProfile.logoUrl ?? null,
    logoStyle: brandProfile.logoStyle ?? 'auto',
    brandColors: brandProfile.brandColors ?? [],
    primaryFont: brandProfile.primaryFont ?? null,
    secondaryFont: brandProfile.secondaryFont ?? null,

    templateId: settings.templateId,
    patternId: settings.patternId,
    accentColorIndex: settings.accentColorIndex,

    bannerEnabled: settings.bannerEnabled,
    bannerHeight: settings.bannerHeight,
    bannerOpacity: settings.bannerOpacity,

    announcementEnabled: settings.announcementEnabled,
    announcementText: settings.announcementText,
    announcementHref: settings.announcementHref,
    announcementCtaLabel: settings.announcementCtaLabel,
    announcementColorSource: settings.announcementColorSource,

    quickLinks: settings.quickLinks,
    social: settings.social,
    footer: settings.footer,

    showFeaturedLook: settings.showFeaturedLook,
    showOutfits: settings.showOutfits,
    showRack: settings.showRack,

    featuredOutfit: featuredOutfit
      ? {
          id: featuredOutfit.id,
          title: featuredOutfit.title ?? null,
          imageUrl: featuredOutfit.cover?.imageUrl ?? null,
          description: featuredOutfit.storefrontDescription ?? null,
          itemCount: Array.isArray(featuredOutfit.linkedRackItemIds)
            ? featuredOutfit.linkedRackItemIds.length
            : 0,
          outfitClaim: featuredOutfit.outfitClaim ?? null,
        }
      : null,
  };

  const publicBoutiqueRef = doc(firestore, 'publicBoutiques', handle);

  await setDoc(publicBoutiqueRef, { ...publicData, updatedAt: serverTimestamp() }, { merge: true });

  if (DEV_ASSERT) {
    const snap = await getDoc(publicBoutiqueRef);
    console.log('[BOUTIQUE][syncPublicBoutiqueData] readback', {
      handle,
      exists: snap.exists(),
      enabled: snap.exists() ? asRecord(snap.data()).enabled : null,
    });
  }
};
