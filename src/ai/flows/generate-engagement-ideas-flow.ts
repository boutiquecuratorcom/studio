'use server';
/**
 * @fileOverview A Genkit flow to generate daily social media engagement ideas for a boutique.
 *
 * - generateEngagementIdeas - A function that returns 5 engagement ideas based on brand settings.
 * - EngagementSettings - The input type for the generateEngagementIdeas function.
 * - EngagementIdea - The structure of a single idea.
 * - EngagementDrop - The full return type containing the array of ideas.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { BrandProfileSchema, type BrandProfile } from './schemas';

// --- Input Schemas ---

const EngagementSettingsSchema = z.object({
  intensity: z.enum(['Safe', 'Bold', 'Viral']),
  goal: z.enum(['Engagement', 'Sales', 'Both']),
  platform: z.enum(['Facebook', 'Instagram', 'Both']),
  brandProfile: BrandProfileSchema.optional(),
});
export type EngagementSettings = z.infer<typeof EngagementSettingsSchema>;

// --- Output Schemas ---

const EngagementIdeaSchema = z.object({
  title: z.string().describe("The short, catchy title for the idea (e.g., 'This or That: Weekend Edition')."),
  caption: z.string().describe("The ready-to-post caption text, including emojis and hashtags."),
  whyItWorks: z.string().describe("A brief, 1-2 sentence explanation of the strategy behind the idea."),
  ctaSuggestion: z.string().describe("A suggested call-to-action to include in the post (e.g., 'Vote in the comments!')."),
  recommendedFormat: z.string().describe("The suggested post format (e.g., 'Static Image Post', 'Instagram Reel', 'Carousel')."),
});
export type EngagementIdea = z.infer<typeof EngagementIdeaSchema>;


const EngagementDropSchema = z.object({
  ideas: z.array(EngagementIdeaSchema).length(5).describe('An array of exactly 5 unique engagement ideas.'),
});
export type EngagementDrop = z.infer<typeof EngagementDropSchema>;


// --- Main Function ---

export async function generateEngagementIdeas(
  input: EngagementSettings
): Promise<EngagementDrop> {
  return generateEngagementIdeasFlow(input);
}


// --- Genkit Prompt & Flow ---

const ideasPrompt = ai.definePrompt({
  name: 'engagementIdeasPrompt',
  input: { schema: EngagementSettingsSchema },
  output: { schema: EngagementDropSchema },
  prompt: `You are "Goldie," the world's top social media strategist for fashion boutiques. Your specialty is creating scroll-stopping, brand-aligned engagement that feels authentic and drives sales.

Today, you will generate a "Daily Engagement Drop" of EXACTLY 5 unique content ideas for a boutique owner.

Analyze the user's brand profile and settings carefully to tailor your response.

--- USER'S BRAND PROFILE ---
- Brand Name: {{#if brandProfile.brandName}}{{brandProfile.brandName}}{{else}}Not specified{{/if}}
- Tagline: {{#if brandProfile.tagline}}{{brandProfile.tagline}}{{else}}Not specified{{/if}}
- Tone of Voice: {{#if brandProfile.toneOfVoice}}{{brandProfile.toneOfVoice}}{{else}}Not specified{{/if}}
- Brand Vibe: {{#if brandProfile.brandVibe}}{{brandProfile.brandVibe}}{{else}}Not specified{{/if}}
- Target Customer: {{#if brandProfile.targetCustomer}}{{brandProfile.targetCustomer}}{{else}}Not specified{{/if}}
- Primary Business Goal: {{#if brandProfile.primaryGoal}}{{brandProfile.primaryGoal}}{{else}}Not specified{{/if}}
- Primary Social Platform: {{#if brandProfile.primaryPlatform}}{{brandProfile.primaryPlatform}}{{else}}Not specified{{/if}}
- Typical Promo Style: {{#if brandProfile.promoStyle}}{{brandProfile.promoStyle}}{{else}}Not specified{{/if}}

--- TODAY'S SETTINGS ---
- Content Goal: {{{goal}}}
  - If 'Engagement', focus on interaction (likes, comments, shares).
  - If 'Sales', focus on driving product interest and purchases.
  - If 'Both', create a mix of engagement hooks with subtle sales drivers.
- Target Platform: {{{platform}}}
  - Tailor formats and language (e.g., 'Reel' for Instagram, longer text for Facebook).
- Intensity Level: {{{intensity}}}
  - 'Safe': Classic, reliable engagement tactics. Low risk.
  - 'Bold': More creative, attention-grabbing ideas that stand out. Medium risk.
  - 'Viral': Edgy, highly shareable, trend-driven concepts. High risk, high reward.

--- YOUR TASK ---
Generate 5 distinct ideas. For each idea, provide:
1.  **title**: A short, catchy title.
2.  **caption**: The full, ready-to-use caption with relevant emojis and hashtags. It should be written in the brand's tone of voice.
3.  **whyItWorks**: A 1-2 sentence strategic explanation.
4.  **ctaSuggestion**: A clear call-to-action for the audience.
5.  **recommendedFormat**: The ideal format (e.g., 'Static Image Post', 'Instagram Reel', 'Carousel', 'Facebook Live Poll').

Your response MUST be a valid JSON object that conforms to the specified output schema. Do not include any text outside of the JSON object.`,
});

const generateEngagementIdeasFlow = ai.defineFlow(
  {
    name: 'generateEngagementIdeasFlow',
    inputSchema: EngagementSettingsSchema,
    outputSchema: EngagementDropSchema,
  },
  async (input) => {
    const { output } = await ideasPrompt(input);
    return output!;
  }
);
