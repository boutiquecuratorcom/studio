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
  imageDataUri: z
    .string()
    .describe(
      "A photo of a clothing item, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  imageType: z.enum(['flat-lay', 'on-body']),
  styleName: z.string().optional(),
  itemType: z.string(),
  sizes: z.string().optional(),
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
    imageDataUri,
    imageType,
    itemType,
    styleName,
    sizes,
    shadowOption,
  }) => {
    let promptText = `You are an expert boutique visual stylist. Your goal is to transform a user-uploaded product photo into a clean, luxury, retail-ready marketing image. The final image should be square (1:1 aspect ratio) and have a warm, modern boutique aesthetic.

--- CONTEXT ---
Item Type: ${itemType}
${styleName ? `Style Name: ${styleName}` : ''}
${sizes ? `Available Sizes: ${sizes}` : ''}

--- GENERAL INSTRUCTIONS ---
1.  Analyze the original image provided.
2.  Re-compose the scene into a 1:1 square aspect ratio.
3.  The clothing item is the hero. Do not alter the clothing item itself, only enhance its presentation.
4.  Replace the background with a clean, warm, and slightly out-of-focus boutique or studio setting. The background should be elegant and minimalist.
5.  Improve the lighting to be bright, professional, and appealing, creating a luxury feel.
6.  Increase overall contrast and clarity.
7.  The final output must be a high-quality, professional product photograph ready for an online boutique or social media like Facebook.
`;

    if (imageType === 'flat-lay') {
      promptText += `
--- FLAT LAY INSTRUCTIONS ---
- This is a "flat lay" style image. Arrange the item beautifully from a top-down perspective.
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
      // on-body
      promptText += `
--- ON-BODY LIFESTYLE INSTRUCTIONS ---
- This is an "on-body" lifestyle image. The focus must remain on the clothing item.
- The model's face should be out of frame or artistically obscured (e.g., turned away, in shadow) to keep the focus on the product.
`;
    }

    const {media} = await ai.generate({
      model: 'googleai/gemini-2.5-flash-image',
      prompt: [{media: {url: imageDataUri}}, {text: promptText}],
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
