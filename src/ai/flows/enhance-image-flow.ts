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

const LookPresetSchema = z.enum([
  'soft-boutique-studio',
  'bright-clean-catalog',
  'cozy-lifestyle-flat',
  'minimal-studio-model',
  'warm-lifestyle-model',
  'casual-outdoor-model',
]);

const EnhanceImageInputSchema = z.object({
  imageDataUris: z
    .array(z.string())
    .min(1)
    .max(3)
    .describe(
      "A list of photos of clothing items, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  creationType: z.enum(['single', 'multiple']),
  styleType: z.enum(['flat-lay', 'on-model']),
  lookPreset: LookPresetSchema,
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
  async ({imageDataUris, creationType, styleType, lookPreset}) => {
    let promptText = `You are an expert boutique visual stylist. Your goal is to transform user-uploaded product photos into a single, clean, luxury, retail-ready marketing image. The final image must be square (1:1 aspect ratio).

--- GENERAL INSTRUCTIONS ---
1.  Analyze the original image(s) provided.
2.  Re-compose the scene into a single, cohesive 1:1 square aspect ratio image.
3.  The clothing is the hero. Do not alter the clothing itself, only enhance its presentation.
4.  Replace the background and improve the lighting based on the selected Look Preset.
5.  The final output must be a high-quality, professional product photograph ready for an online boutique.
`;

    if (creationType === 'single') {
      promptText += `
--- CONTEXT: SINGLE ITEM ---
- Feature one primary clothing item from the provided image.
`;
    } else {
      // multiple
      promptText += `
--- CONTEXT: OUTFIT ---
- This is an outfit shot. Combine the items from the provided images into a single, styled composition.
`;
    }

    // Add styleType and lookPreset instructions
    promptText += `\n--- STYLE: ${
      styleType === 'flat-lay' ? 'FLAT LAY' : 'ON-MODEL'
    } ---`;
    promptText += `\n--- LOOK PRESET: ${lookPreset.replace(/-/g, ' ')} ---`;

    switch (lookPreset) {
      case 'soft-boutique-studio':
        promptText += `
- Style: A sophisticated flat lay.
- Background: A neutral, warm, and slightly out-of-focus studio background. Think soft beige, cream, or very light grey.
- Lighting: Bright, soft, and professional studio lighting.
- Shadow: Apply a soft, natural drop shadow to give the item(s) depth.
- Vibe: Elegant, high-end, modern luxury.
`;
        break;
      case 'bright-clean-catalog':
        promptText += `
- Style: A crisp, clean flat lay for a product catalog.
- Background: A pure white or very light grey (#F7F7F8) solid background.
- Lighting: Even, bright, and shadowless lighting.
- Shadow: Minimal to no shadow.
- Vibe: Minimalist, clean, direct-to-consumer.
`;
        break;
      case 'cozy-lifestyle-flat':
        promptText += `
- Style: An inviting and relatable flat lay.
- Background: A textured, neutral surface like a linen cloth, rustic wood, or plush rug.
- Lighting: Natural, warm window light.
- Shadow: Soft and diffuse, as if from natural light.
- Vibe: Cozy, authentic, lifestyle-oriented. You may add 1-2 small, coordinated props (like a coffee cup, a magazine, or simple jewelry) to enhance the scene, but keep it minimal.
`;
        break;
      case 'minimal-studio-model':
        promptText += `
- Style: An on-model shot with a focus entirely on the product.
- Model: The model's face should be out of frame or artistically obscured (e.g., turned away, in shadow). The pose should be simple and highlight the clothing's fit.
- Background: A seamless, solid color studio background (light grey, beige, or off-white).
- Lighting: Professional and even studio lighting that defines the garment.
- Vibe: Clean, high-fashion, minimalist.
`;
        break;
      case 'warm-lifestyle-model':
        promptText += `
- Style: An on-model shot in a relatable, warm setting.
- Model: The model can have a natural, relaxed pose. The face can be partially visible but not the main focus.
- Background: An indoor lifestyle setting, like a chic apartment, a modern cafe, or a beautiful boutique interior. The background should be softly blurred.
- Lighting: Warm, natural, and inviting, as if from indoor lamps or large windows.
- Vibe: Aspirational, chic, and relatable.
`;
        break;
      case 'casual-outdoor-model':
        promptText += `
- Style: A relaxed, on-model outdoor shot.
- Model: The model should be in a natural, candid pose, perhaps walking or interacting with the environment.
- Background: An aesthetically pleasing outdoor location with natural elements (e.g., a park, a quiet city street with nice architecture, a beach). The background should have a shallow depth of field.
- Lighting: Bright, natural daylight. Golden hour lighting is a great option.
- Vibe: Effortless, casual, and authentic.
`;
        break;
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
      throw new Error('Image generation did not return a URL.');
    }

    return {enhancedImageDataUri: url};
  }
);
