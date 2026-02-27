# Boutique Curator - Feature Map

This document provides a high-level overview of the existing features in the Boutique Curator application, their primary entry points, dependencies, and data sources.

---

### 1. Authentication

The entry gate for the application, handling user sign-up and sign-in.

| Property | Value |
| --- | --- |
| **Feature Name** | Authentication |
| **Entry Route(s)** | `/` |
| **Main Component(s)** | `src/app/page.tsx`, `src/components/AuthForm.tsx` |
| **Firestore Collections**| `/users/{userId}` |
| **Storage Paths** | None |
| **Dependencies** | Firebase Authentication |
| **Notes** | Creates a `UserProfile` document in Firestore on new user sign-up. Redirects authenticated users to `/dashboard`. |

---

### 2. Dashboard

The main landing page for authenticated users, providing a welcome message and a summary of recent activity.

| Property | Value |
| --- | --- |
| **Feature Name** | Dashboard |
| **Entry Route(s)** | `/dashboard` |
| **Main Component(s)** | `src/app/(app)/dashboard/page.tsx`, `src/components/MyUploads.tsx` |
| **Firestore Collections**| `users/{userId}/uploads` |
| **Storage Paths** | Reads from `uploads/{userId}/` |
| **Dependencies** | Firebase Authentication |
| **Notes** | Displays the 6 most recent AI-enhanced images ("Glow-Ups") from the user's library. |

---

### 3. My Rack (Inventory Management)

The core feature for managing a user's clothing inventory. Includes adding, editing, viewing, and deleting items.

| Property | Value |
| --- | --- |
| **Feature Name** | My Rack |
| **Entry Route(s)** | `/inventory`, `/inventory/add`, `/inventory/edit/[id]`, `/inventory/view/[id]` |
| **Main Component(s)** | `src/app/(app)/inventory/**/*.tsx`, `src/components/inventory/InventoryList.tsx`, `src/components/inventory/InventoryForm.tsx` |
| **Firestore Collections**| `/inventory/{itemId}`, `users/{userId}/glowUps/{glowUpId}` |
| **Storage Paths** | `inventory/{userId}/{itemId}/`, `glowUps/{userId}/{glowUpId}/` |
| **Dependencies** | Firebase Auth, Firestore, Storage, `analyzeInventoryImage` AI flow. |
| **Notes** | This is a full CRUD interface for inventory. Triggers AI analysis on item creation, which populates search keywords and descriptive metadata. |

---

### 4. Glow-Up Studio

The AI-powered image enhancement engine. Users can transform basic product photos into premium marketing assets.

| Property | Value |
| --- | --- |
| **Feature Name** | Glow-Up Studio |
| **Entry Route(s)** | `/editor` |
| **Main Component(s)** | `src/app/(app)/editor/page.tsx`, `src/components/GlowUpStudio.tsx` |
| **Firestore Collections**| `users/{userId}/uploads`, `users/{userId}/glowUps`, `inventory` |
| **Storage Paths** | Reads from `uploads/{userId}/`. Writes to `glowUps/{userId}/{glowUpId}/`. |
| **Dependencies** | Firebase Auth, `enhanceImage` AI flow. |
| **Notes** | Can be initiated from a "My Rack" item or a direct file upload. All successful enhancements create a document in the `/glowUps` subcollection. |

---

### 5. My Brand

A centralized profile where users define their brand's identity, voice, and visual style to personalize AI-generated content.

| Property | Value |
| --- | --- |
| **Feature Name** | My Brand |
| **Entry Route(s)** | `/my-brand` |
| **Main Component(s)** | `src/app/(app)/my-brand/page.tsx` |
| **Firestore Collections**| `users/{userId}/brandProfile/main` |
| **Storage Paths** | `brandAssets/{userId}/` (for logo) |
| **Dependencies** | Firebase Auth |
| **Notes** | A critical dependency for the Post Creator and Engagement Machine. Stores fonts, colors, tone, etc. |

---

### 6. Engagement Machine

An AI-powered idea generator for daily social media content.

| Property | Value |
| --- | --- |
| **Feature Name** | Engagement Machine |
| **Entry Route(s)** | `/engagement-machine` |
| **Main Component(s)** | `src/app/(app)/engagement-machine/page.tsx` |
| **Firestore Collections**| `users/{userId}/engagementDrops`, `users/{userId}/brandProfile` |
| **Storage Paths** | None |
| **Dependencies** | `generateEngagementIdeas` AI flow, My Brand profile. |
| **Notes** | Relies heavily on a completed "My Brand" profile for quality output. Caches the 5 generated ideas for the current day. |

---

### 7. Post Creator

A visual editor for creating social media post graphics from enhanced images.

| Property | Value |
| --- | --- |
| **Feature Name** | Post Creator |
| **Entry Route(s)** | `/post-creator` |
| **Main Component(s)** | `src/components/post-creator/PostCreatorClient.tsx`, `src/components/post-creator/PostPreview.tsx`, `src/components/post-creator/PostControls.tsx` |
| **Firestore Collections**| `users/{userId}/posts` (drafts), `users/{userId}/uploads` (image selection), `users/{userId}/brandProfile` |
| **Storage Paths** | Reads from `uploads/{userId}/` |
| **Dependencies** | My Brand profile, an enhanced image from Library/Glow-Up Studio. |
| **Notes** | Allows users to apply templates, frames, and custom text to an image. Can be pre-filled from the Engagement Machine. |

---

### 8. My Library

A gallery view of all original and AI-enhanced images uploaded by the user.

| Property | Value |
| --- | --- |
| **Feature Name** | My Library |
| **Entry Route(s)** | `/uploads` |
| **Main Component(s)** | `src/app/(app)/uploads/page.tsx`, `src/components/MyUploads.tsx` |
| **Firestore Collections**| `users/{userId}/uploads` |
| **Storage Paths** | Reads from `uploads/{userId}/` |
| **Dependencies** | Firebase Auth |
| **Notes** | Separates "Originals" from "Glow-Ups" for clarity. |

---

### 9. Placeholder Pages

These routes exist but contain no functional logic. They are stubs for future features.

| Property | Value |
| --- | --- |
| **Feature Name** | Profile, Settings, Looks (Stubs) |
| **Entry Route(s)** | `/profile`, `/settings`, `/looks` |
| **Main Component(s)** | `src/app/(app)/profile/page.tsx`, `src/app/(app)/settings/page.tsx`, `src/app/(app)/looks/page.tsx` |
| **Dependencies** | None |
| **Notes** | These pages currently display a "Coming Soon" message. |
