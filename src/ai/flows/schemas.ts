import { z } from 'zod';

export const BrandProfileSchema = z.object({
  brandName: z.string().optional(),
  tagline: z.string().optional(),
  toneOfVoice: z.string().optional(),
  brandVibe: z.string().optional(),
  targetCustomer: z.string().optional(),
  primaryGoal: z.string().optional(),
  primaryPlatform: z.string().optional(),
  promoStyle: z.string().optional(),
});
export type BrandProfile = z.infer<typeof BrandProfileSchema>;
