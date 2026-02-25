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
});
export type EnhanceImageInput = z.infer<typeof EnhanceImageInputSchema>;

const EnhanceImageOutputSchema = z.object({
    enhancedImageDataUri: z.string().describe('The data URI of the enhanced image.'),
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
  async ({imageDataUri}) => {
    const {media} = await ai.generate({
        model: 'googleai/gemini-2.5-flash-image',
        prompt: [
          {media: {url: imageDataUri}},
          {text: 'Enhance this clothing product photo for a luxury boutique. The subject is a piece of clothing. Improve the lighting to be bright and professional. Replace the background with a soft, elegant, out-of-focus boutique setting. Increase the overall contrast and clarity to give it a premium, professional product photography look. The clothing item itself should remain the main focus and not be altered, just presented better.'},
        ],
        config: {
          responseModalities: ['TEXT', 'IMAGE'],
        },
      });

    const url = media.url;
    if (!url) {
        throw new Error('Image generation failed.');
    }

    return { enhancedImageDataUri: url };
  }
);
