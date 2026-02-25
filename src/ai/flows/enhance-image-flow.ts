'use server';
/**
 * @fileOverview A Genkit flow that enhances a product image for a luxury boutique.
 *
 * - enhanceImage - A function that handles the image enhancement process.
 * - EnhanceImageInput - The input type for the enhanceImage function.
 * - EnhanceImageOutput - The return type for the enhanceImage function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const EnhanceImageInputSchema = z.object({
  imageDataUris: z
    .array(z.string())
    .min(1)
    .describe(
      "A list of photos of clothing items, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  creationType: z.enum(['single', 'outfit']),
  styleType: z.enum(['flat-lay', 'on-model']),
  // Single Item fields
  itemType: z.string().optional(),
  styleName: z.string().optional(),
  sizes: z.string().optional(),
  // Outfit field
  outfitDescription: z.string().optional(),
  // Style field
  shadowOption: z.enum(['none', 'soft', 'hard']).optional(),
});
export type EnhanceImageInput = z.infer<typeof EnhanceImageInputSchema>;

const EnhanceImageOutputSchema = z.object({
  enhancedImageDataUri: z
    .string()
    .describe('The data URI of the enhanced image.'),
});
export type EnhanceImageOutput = z.infer<typeof EnhanceImageOutputSchema>;

export async function enhanceImage(
  input: EnhanceImageInput
): Promise<EnhanceImageOutput> {
  return enhanceImageFlow(input);
}

const enhanceImageFlow = ai.defineFlow(
  {
    name: 'enhanceImageFlow',
    inputSchema: EnhanceImageInputSchema,
    outputSchema: EnhanceImageOutputSchema,
  },
  async ({
    imageDataUris,
    creationType,
    styleType,
    itemType,
    styleName,
    sizes,
    outfitDescription,
    shadowOption,
  }) => {
    let promptText = `You are an expert boutique visual stylist. Your goal is to transform user-uploaded product photos into a single, clean, luxury, retail-ready marketing image. The final image should be square (1:1 aspect ratio) and have a warm, modern boutique aesthetic.

--- GENERAL INSTRUCTIONS ---
1.  Analyze the original image(s) provided.
2.  Re-compose the scene into a single, cohesive 1:1 square aspect ratio image.
3.  The clothing is the hero. Do not alter the clothing itself, only enhance its presentation.
4.  Replace the background with a clean, warm, and slightly out-of-focus boutique or studio setting. The background should be elegant and minimalist.
5.  Improve the lighting to be bright, professional, and appealing, creating a luxury feel.
6.  Increase overall contrast and clarity.
7.  The final output must be a high-quality, professional product photograph ready for an online boutique or social media.
`;

    if (creationType === 'single') {
      promptText += `
--- CONTEXT: SINGLE ITEM ---
Item Type: ${itemType}
${styleName ? `Style Name: ${styleName}` : ''}
${sizes ? `Available Sizes: ${sizes}` : ''}
`;
    } else {
      // outfit
      promptText += `
--- CONTEXT: OUTFIT ---
- This is an outfit shot. Combine the items from the provided images into a single, styled composition.
- Outfit Description: ${outfitDescription || 'A stylishly coordinated outfit.'}
`;
    }

    if (styleType === 'flat-lay') {
      promptText += `
--- STYLE: FLAT LAY ---
- This is a "flat lay" style image. Arrange the item(s) beautifully from a top-down perspective.
- ${
        shadowOption === 'soft'
          ? 'Apply a soft, natural drop shadow to give it depth.'
          : shadowOption === 'hard'
          ? 'Apply a more defined, crisp shadow for a modern look.'
          : 'Do not add a strong shadow; keep it minimal.'
      }
- You may add 1-2 small, coordinated accessories (like a simple piece of jewelry or a pair of sunglasses) if it enhances the composition, but keep it minimal.
`;
    } else {
      // on-model
      promptText += `
--- STYLE: ON-MODEL LIFESTYLE ---
- This is an "on-model" lifestyle image. The focus must remain on the clothing.
- If a model is visible, their face should be out of frame or artistically obscured (e.g., turned away, in shadow) to keep the focus on the product.
- If a model is not visible, place the clothing on a mannequin or ghost mannequin.
`;
    }

    const imageParts = imageDataUris.map(url => ({media: {url}}));
    const prompt = [...imageParts, {text: promptText}];

    const {media} = await ai.generate({
      model: 'googleai/gemini-2.5-flash-image',
      prompt: prompt,
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
      },
    });

    const url = media.url;
    if (!url) {
      throw new Error('Image generation failed.');
    }

    return {enhancedImageDataUri: url};
  }
);
