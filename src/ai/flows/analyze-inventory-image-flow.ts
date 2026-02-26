'use server';
/**
 * @fileOverview An advanced Genkit flow to perform AI analysis on an inventory image
 * using Gemini Vision.
 *
 * - analyzeInventoryImage - A function that returns structured analysis data for an image.
 * - AnalyzeInventoryImageInput - The input type for the analyzeInventoryImage function.
 * - AnalyzeInventoryImageOutput - The return type for the analyzeInventoryImage function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeInventoryImageInputSchema = z.object({
  imageUrl: z
    .string()
    .describe('The public URL of the inventory image to analyze.'),
});
export type AnalyzeInventoryImageInput = z.infer<
  typeof AnalyzeInventoryImageInputSchema
>;

const AnalyzeInventoryImageOutputSchema = z.object({
  dominantColors: z
    .array(z.string().regex(/^#[0-9a-fA-F]{6}$/))
    .min(3)
    .max(6)
    .describe('An array of 3-6 dominant colors from the image as hex codes.'),
  patternType: z
    .string()
    .describe('The primary pattern type (e.g., "Floral", "Geometric", "Striped", "Solid", "Abstract", "Animal Print").'),
  patternDescription: z
    .string()
    .describe('A human-readable, one-sentence description of the visual pattern.'),
  styleVibe: z
    .string()
    .describe('The overall style vibe of the item (e.g., "Bold & Vibrant", "Soft & Romantic", "Elegant & Classic", "Casual & Relaxed").'),
  clothingType: z
    .string()
    .describe("The AI's best guess of the clothing type (e.g., 'Midi Dress', 'Graphic Tee', 'High-Waisted Leggings'). Be specific."),
  visualDescription: z
    .string()
    .describe("A 1-2 sentence descriptive summary of the item's key visual features."),
  tags: z
    .array(z.string())
    .min(8)
    .max(15)
    .describe('An array of 8-15 relevant keywords for search and filtering.'),
  facebookCaptionHooks: z
    .array(z.string())
    .length(3)
    .describe('3 short, engaging, question-based hooks for Facebook captions.'),
  instagramCaptionHooks: z
    .array(z.string())
    .length(3)
    .describe('3 short, trendy, emoji-heavy hooks for Instagram captions.'),
});
export type AnalyzeInventoryImageOutput = z.infer<
  typeof AnalyzeInventoryImageOutputSchema
>;

export async function analyzeInventoryImage(
  input: AnalyzeInventoryImageInput
): Promise<AnalyzeInventoryImageOutput> {
  return analyzeInventoryImageFlow(input);
}

const analysisPrompt = ai.definePrompt({
  name: 'inventoryAnalysisPrompt',
  input: {schema: AnalyzeInventoryImageInputSchema},
  output: {schema: AnalyzeInventoryImageOutputSchema},
  prompt: `You are an expert fashion merchandiser and AI analyst for a high-end online boutique. Your task is to analyze the provided image of a clothing item and extract detailed, structured metadata.

The image to analyze is: {{media url=imageUrl}}

Carefully examine the item's color, pattern, style, and type. Generate the following structured information.

Your response MUST be a valid JSON object that conforms to the specified output schema.

- **dominantColors**: Identify 3-6 primary colors and return them as an array of hex codes.
- **patternType**: Classify the main pattern (e.g., "Floral", "Geometric", "Striped", "Solid").
- **patternDescription**: Briefly describe the pattern in one sentence.
- **styleVibe**: Describe the overall feeling or vibe of the item (e.g., "Bold & Vibrant", "Elegant & Classic").
- **clothingType**: Provide a specific guess for the clothing type (e.g., "A-Line Midi Skirt", "Oversized Knit Sweater").
- **visualDescription**: Write a compelling 1-2 sentence summary of the item's appearance.
- **tags**: Generate 8-15 diverse and useful keywords for search (include type, style, pattern, colors, occasion, etc.).
- **facebookCaptionHooks**: Write 3 short, engaging, question-based hooks to start a Facebook post.
- **instagramCaptionHooks**: Write 3 short, trendy hooks using relevant emojis for an Instagram post.
`,
});

const analyzeInventoryImageFlow = ai.defineFlow(
  {
    name: 'analyzeInventoryImageFlow',
    inputSchema: AnalyzeInventoryImageInputSchema,
    outputSchema: AnalyzeInventoryImageOutputSchema,
  },
  async ({imageUrl}) => {
    const {output} = await analysisPrompt({imageUrl});
    return output!;
  }
);
