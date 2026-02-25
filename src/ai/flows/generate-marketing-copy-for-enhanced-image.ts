'use server';
/**
 * @fileOverview A Genkit flow that generates engaging marketing descriptions and suggested product names
 * for an enhanced luxury clothing image.
 *
 * - generateMarketingCopyForEnhancedImage - A function that handles the marketing copy generation process.
 * - GenerateMarketingCopyInput - The input type for the generateMarketingCopyForEnhancedImage function.
 * - GenerateMarketingCopyOutput - The return type for the generateMarketingCopyForEnhancedImage function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateMarketingCopyInputSchema = z.object({
  enhancedImageDataUri: z
    .string()
    .describe(
      "A URL or data URI of the enhanced clothing image that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  productDescription: z
    .string()
    .optional()
    .describe('An optional description of the clothing item, its features, or desired selling points.'),
  tone: z
    .enum(['luxury', 'casual', 'boho', 'minimalist', 'modern', 'elegant'])
    .optional()
    .describe('The desired marketing tone for the copy.'),
});
export type GenerateMarketingCopyInput = z.infer<
  typeof GenerateMarketingCopyInputSchema
>;

const GenerateMarketingCopyOutputSchema = z.object({
  productNames: z
    .array(z.string())
    .describe('A list of suggested, engaging product names for the clothing item.'),
  marketingDescriptions: z
    .array(z.string())
    .describe(
      'A list of compelling marketing descriptions for the clothing item, suitable for product listings and promotions.'
    ),
});
export type GenerateMarketingCopyOutput = z.infer<
  typeof GenerateMarketingCopyOutputSchema
>;

export async function generateMarketingCopyForEnhancedImage(
  input: GenerateMarketingCopyInput
): Promise<GenerateMarketingCopyOutput> {
  return generateMarketingCopyFlow(input);
}

const marketingCopyPrompt = ai.definePrompt({
  name: 'generateMarketingCopyPrompt',
  input: {schema: GenerateMarketingCopyInputSchema},
  output: {schema: GenerateMarketingCopyOutputSchema},
  prompt: `You are an expert marketing copywriter for a high-end clothing boutique. Your task is to generate captivating product names and marketing descriptions for a clothing item, based on its image and any provided details.

Focus on creating a sense of luxury, uniqueness, and desire for the product. Highlight features, style, and potential emotional connections.

--- INPUT ---
Image of the clothing item: {{media url=enhancedImageDataUri}}

{{#if productDescription}}
Product Details: {{{productDescription}}}
{{/if}}

{{#if tone}}
Desired Marketing Tone: {{{tone}}}
{{else}}
Desired Marketing Tone: luxury and elegant
{{/if}}

--- INSTRUCTIONS ---
Generate 3-5 unique and appealing product names.
Generate 2-3 engaging marketing descriptions (2-4 sentences each) that can be used for product listings or social media.

Ensure the output is valid JSON, matching the specified output schema.
`,
});

const generateMarketingCopyFlow = ai.defineFlow(
  {
    name: 'generateMarketingCopyForEnhancedImageFlow',
    inputSchema: GenerateMarketingCopyInputSchema,
    outputSchema: GenerateMarketingCopyOutputSchema,
  },
  async (input) => {
    const {output} = await marketingCopyPrompt(input);
    return output!;
  }
);
