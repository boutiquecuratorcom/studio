# Boutique Curator - Master System Blueprint

This document provides a comprehensive overview of the Boutique Curator system architecture, data models, core logic, and design principles. It serves as both an internal blueprint for development and an external-ready overview for strategic planning.

---

## CORE POSITIONING

Boutique Curator is an AI-powered **DISCOVERY** and **MARKETING** platform for boutiques and stylists.

It is **NOT** an ecommerce processor.

#### Primary Purpose:
- Drive product discovery
- Generate demand
- Enable outfit-based marketing
- Create shareable boutique pages
- Power AI-driven customer engagement

Transactions happen externally (Shopify, Stripe, in-store, etc). Boutique Curator powers the journey from **DISCOVERY → ENGAGEMENT → CONVERSION**.

---

## CORE LIVE SYSTEMS (CONFIRMED WORKING)

### 1. Authentication System
- **Technology**: Firebase Authentication
- **Providers**: Email/Password, Google Sign-In
- **Function**: Protects all dashboard and management routes. Unauthenticated users are redirected to public-facing login/signup pages. Public boutique pages remain accessible to everyone.
- **Dependency**: Required for all boutique ownership features.

### 2. Boutique Identity System
- **Description**: Each user can establish a unique brand identity that powers AI generation and public-facing pages.
- **Components**:
    - **Brand Profile**: Defines brand voice, vibe, colors, fonts, and target customer.
    - **Boutique Settings**: Manages public visibility, featured content, and style presets.
    - **Public Handle**: The user's unique, shareable URL slug.
- **Firestore Structure**:
    - `users/{uid}`
    - `users/{uid}/brandProfile/main`
    - `users/{uid}/boutiqueSettings/main`

### 3. Handle + Public URL System
- **Description**: Each boutique can claim one unique, human-readable handle, which forms their public URL.
- **Public URL Format**: `https://<domain>/boutique/{handle}`
- **Core Collections**:
    - `handles/{handle}`: Globally unique document mapping a handle to an owner `uid`. Enforces ownership.
    - `publicBoutiques/{handle}`: Publicly readable, denormalized document containing the boutique's live profile.
- **Handle Rules**:
    - Must be unique.
    - Owned by a single user `uid`.
    - Transferable via a secure Firestore transaction (`updateHandleTransaction`).
    - Cannot be duplicated.
    - **Required before a boutique can go live.**
- **Key Transactions**: `claimHandleTransaction`, `updateHandleTransaction`

### 4. Public Boutique Page System
- **Description**: A server-rendered, dynamic public route that showcases a seller's brand and featured look.
- **Route**: `/boutique/[handle]`
- **Data Source**: Loads **ONLY** from the `publicBoutiques` collection for security and performance. It never reads from private user documents.
- **Visibility**: The page is only visible to the public if `publicBoutiques/{handle}.enabled == true`. Otherwise, it displays a "Boutique Not Available" message.
- **Displayed Data**:
    - Brand name, logo, tagline, accent color
    - Featured outfit summary (image, title, description)
    - "Claim a Look" CTA

### 5. Boutique Publishing System
- **Description**: The authenticated workflow for a user to configure and launch their public boutique page.
- **Location**: Dashboard → My Boutique (`/my-boutique`)
- **User Flow**:
    1. Claim a unique handle.
    2. Configure boutique settings (style, featured content).
    3. Toggle "Boutique is Live" to publish.
- **Core Logic**: `syncPublicBoutiqueData()`
    - This function is the **SINGLE SOURCE OF TRUTH** for generating the public boutique document.
    - When triggered, it pulls from the user's private data (`brandProfile`, `boutiqueSettings`, `outfits`), builds the public-safe `publicBoutiques` document, and updates the `enabled` flag.

### 6. Outfit System
- **Description**: Allows users to create curated "looks" by linking multiple items from their inventory.
- **Function**: Outfits are central to the marketing and discovery experience.
- **Data Includes**:
    - Cover Image (manually uploaded or AI-generated)
    - Linked Inventory Items
    - AI-generated descriptions and social captions
    - A "Claim" CTA (can be for the whole outfit or per-item)
    - Publish status (`draft` vs. `published`)
- **Featured Role**: The selected "Featured Outfit" is prominently displayed on the user's public boutique page.

### 7. Security Architecture
- **Foundation**: Firestore Security Rules
- **User Data Isolation**:
    - Users can only read/write their own documents within the `users/{uid}` path (e.g., `brandProfile`, `boutiqueSettings`, `uploads`).
    - Users can only manage inventory items (`inventory/{itemId}`) and outfits (`outfits/{outfitId}`) where `ownerId == auth.uid`.
- **Public Data Access**:
    - The `publicBoutiques` collection is publicly readable **ONLY IF** `resource.data.enabled == true`. This prevents private or draft boutiques from being exposed.
- **Handle Protection**:
    - **Unique Ownership**: The `handles` collection ensures a handle is mapped to a single `uid`.
    - **Collision Prevention**: Firestore transactions are used for all handle creation and update operations, guaranteeing atomic writes and preventing race conditions where two users might claim the same handle simultaneously.

### 8. Admin + Testing System
- **Description**: A suite of tools visible only to admin users for verifying system health.
- **Core Tool**: "Run Boutique Self-Test" button on the `/my-boutique` page.
- **Function**: Executes an end-to-end, non-destructive test of the entire boutique publishing flow in the production environment.
- **Self-Test Verification Steps**:
    1.  Handle Claim (with a temporary, random handle)
    2.  Settings Creation
    3.  Public Data Sync
    4.  Enable Boutique
    5.  Verify Live Status
    6.  Disable Boutique
    7.  Cleanup all test data
- **Purpose**: Ensures the core user journey works automatically for all future users and provides a rapid diagnostic tool.

---

## DEPENDENCY MAP

- A **Handle** is required before a **Boutique can go live**.
- A **Boutique can go live** is required before a **Public Page exists**.
- **Boutique Settings** are required before a **Public Sync** can run.
- An **Outfit** is required for a **Featured Display** on the public page.
- The **Public Boutique Page** depends entirely on the output of `syncPublicBoutiqueData()`.

---

## FUTURE SYSTEMS (PLANNING ONLY)

- Discovery Feed
- AI Stylist Engine
- Automated Social Posting
- Customer Profiles
- Lead Capture System
- DM Automation
- Trend Engine
- Multi-boutique Management
- Marketplace Mode
- Creator Collaborations
- Paid Promotion Tools

*Each future system must be designed to be modular and toggleable.*

---

## SYSTEM DESIGN PRINCIPLES

1.  **Discovery-First, Not Checkout-First**: The platform's primary goal is to surface products and brands, not to process sales.
2.  **AI Marketing Engine at Core**: Generative AI is a core competency, used to create assets, descriptions, and engagement ideas.
3.  **Modular Feature Toggles**: New features should be built in a way that they can be enabled or disabled without breaking core functionality.
4.  **Public Pages are Marketing Assets**: Public-facing content (like boutique pages) are treated as shareable, high-quality marketing materials.
5.  **Boutique = Growth Engine, Not Store**: The language and features are oriented around brand growth, visibility, and audience engagement.
6.  **Clean Separation of Private vs. Public Data**: A clear, secure boundary exists between a user's private data and the denormalized, public-safe data shown on their boutique page.
7.  **Sync Engine Controls Public Output**: A dedicated sync process is the sole gatekeeper for what becomes public, ensuring consistency and security.
8.  **Safe Scaling Without Breaking Core**: The architecture is designed to accommodate thousands of boutiques by isolating user data and using efficient, scalable Firestore queries.
