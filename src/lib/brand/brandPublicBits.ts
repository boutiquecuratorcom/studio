/**
 * @fileOverview Defines a minimal, public-safe type for a user's Brand Profile.
 * This represents the subset of brand data needed by UI components for rendering,
 * theming, and AI prompt context.
 */

/**
 * Represents the essential public-facing fields of a user's brand profile.
 * This is the canonical "data contract" for what UI components can expect.
 */
export type BrandProfilePublicBits = {
  /**
   * The name of the boutique.
   * Used in: Public Boutique Page header, Post Creator default text.
   */
  brandName?: string | null;

  /**
   * The boutique's tagline or short description.
   * Used in: Public Boutique Page header.
   */
  tagline?: string | null;

  /**
   * The public URL of the brand's logo.
   * Used in: Public Boutique Page header.
   */
  logoUrl?: string | null;

  /**
   * An array of up to 3 brand colors in hex format.
   * Index [0] is considered the primary/accent color.
   * Used in: Post Creator default badge color.
   */
  brandColors?: (string | null)[];

  /**
   * The name of the primary font for headings.
   * Used in: Post Creator image generation.
   */
  primaryFont?: string | null;

  /**
   * The name of the secondary font for body text.
   * Used in: Post Creator image generation.
   */
  secondaryFont?: string | null;

  /**
   * The defined tone for AI content generation.
   * Used in: AI Flows (Engagement, Outfit Descriptions).
   */
  toneOfVoice?: string | null;

  /**
   * The defined target customer for AI content generation.
   * Used in: AI Flows (Engagement, Outfit Descriptions).
   */
  targetCustomer?: string | null;
  
  // Note: Other fields like brandVibe, primaryGoal, etc., are used by AI
  // prompts but are omitted here for UI-specific clarity. This type can be
  // expanded if those fields are needed for rendering in the future.
};
