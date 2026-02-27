'use server';
/**
 * @fileOverview A Genkit flow to generate marketing copy for a styled outfit.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { BrandProfileSchema, type BrandProfile } from './generate-engagement-ideas-flow';

// --- Input Schemas ---

const SimplifiedItemSchema = z.object({
  title: z.string(),
  type: z.string(),
  analysis: z.object({
    dominantColors: z.array(z.string()).optional(),
    patternType: z.string().optional(),
    styleVibe: z.string().optional(),
    tags: z.array(z.string()).optional(),
  }).optional(),
});
export type SimplifiedItem = z.infer<typeof SimplifiedItemSchema>;

const GenerateOutfitDescriptionsInputSchema = z.object({
  items: z.array(SimplifiedItemSchema).min(2),
  brandProfile: BrandProfileSchema.optional(),
});
export type GenerateOutfitDescriptionsInput = z.infer<typeof GenerateOutfitDescriptionsInputSchema>;

// --- Output Schemas ---

const GenerateOutfitDescriptionsOutputSchema = z.object({
  storefrontDescription: z.string().describe("A compelling, product-focused description for an e-commerce storefront. Should be 3-5 sentences and highlight the combined look and feel."),
  socialCaption: z.string().describe("A short, punchy, and engaging caption for social media (e.g., Instagram/Facebook). Should be 1-3 sentences, use emojis, and include a call-to-action."),
});
export type GenerateOutfitDescriptionsOutput = z.infer<typeof GenerateOutfitDescriptionsOutputSchema>;


// --- Main Function ---

export async function generateOutfitDescriptions(
  input: GenerateOutfitDescriptionsInput
): Promise<GenerateOutfitDescriptionsOutput> {
  return generateOutfitDescriptionsFlow(input);
}


// --- Genkit Prompt & Flow ---

const descriptionsPrompt = ai.definePrompt({
  name: 'outfitDescriptionsPrompt',
  input: { schema: GenerateOutfitDescriptionsInputSchema },
  output: { schema: GenerateOutfitDescriptionsOutputSchema },
  prompt: `You are "Goldie," an expert fashion copywriter for luxury boutiques. Your task is to generate two distinct pieces of marketing copy for a complete outfit, based on the items it contains and the boutique's brand profile.

--- BOUTIQUE BRAND PROFILE ---
- Brand Name: {{#if brandProfile.brandName}}{{brandProfile.brandName}}{{else}}Not specified{{/if}}
- Tone of Voice: {{#if brandProfile.toneOfVoice}}{{brandProfile.toneOfVoice}}{{else}}Neutral Boutique{{/if}}
- Target Customer: {{#if brandProfile.targetCustomer}}{{brandProfile.targetCustomer}}{{else}}Not specified{{/if}}

--- OUTFIT ITEMS ---
This outfit consists of the following items:
{{#each items}}
- **{{this.title}}** (Type: {{this.type}}{{#if this.analysis.styleVibe}}, Vibe: {{this.analysis.styleVibe}}{{/if}}{{#if this.analysis.patternType}}, Pattern: {{this.analysis.patternType}}{{/if}})
{{/each}}

--- YOUR TASK ---
Generate two distinct pieces of copy. Your response MUST be a valid JSON object.

1.  **storefrontDescription**: Write a compelling, product-focused description for an e-commerce storefront. 
    - Length: 3-5 sentences.
    - Focus: Describe how the items work together, the overall look and feel, and the quality. Highlight key features from the item analysis. Be descriptive and enticing.

2.  **socialCaption**: Write a short, punchy, and engaging caption for social media (e.g., Instagram/Facebook).
    - Length: 1-3 sentences.
    - Style: Use the brand's tone of voice. Incorporate relevant emojis. End with a call-to-action or a question to drive engagement.

Do not include any text outside of the JSON object.`,
});

const generateOutfitDescriptionsFlow = ai.defineFlow(
  {
    name: 'generateOutfitDescriptionsFlow',
    inputSchema: GenerateOutfitDescriptionsInputSchema,
    outputSchema: GenerateOutfitDescriptionsOutputSchema,
  },
  async (input) => {
    const { output } = await descriptionsPrompt(input);
    return output!;
  }
);
