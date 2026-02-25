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
  // Flat Lay Presets
  'clean-catalog',
  'styled-boutique',
  'facebook-sales-post',
  'luxury-editorial',
  // Modeled Presets
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
  isFallback: z.boolean().optional().describe('Indicates if the result is a fallback.'),
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
    const maxRetries = 2;
    const initialDelay = 1000;

    let promptText = `You are an expert boutique visual stylist. Your goal is to transform user-uploaded product photos into a single, clean, luxury, retail-ready marketing image. The final image must be square (1:1 aspect ratio).`;

    if (styleType === 'flat-lay') {
      promptText += `

--- TASK: CREATE A PROFESSIONAL FLAT LAY IMAGE ---

--- STRICT COMPOSITION RULES (FOLLOW EXACTLY) ---
- Camera Angle: Perfect 90-degree overhead, top-down flat lay.
- Background: A clean, seamless, warm neutral studio surface (e.g., cream, light beige).
- Lighting: Soft, diffused, even studio light.
- Layout: Balanced, centered, and evenly spaced composition. Garments must NOT overlap or be cropped.
- Scale: Preserve the original proportions of the garments relative to each other. Do not unnaturally shrink or enlarge items.
- Forbidden Elements: Do NOT add text, watermarks, logos, busy background textures, or any other clutter. The final output must be a clean image of the clothing items.
- Garment Integrity: Do not distort the shape of the clothing. Present it neatly.
`;

      if (creationType === 'multiple') {
        promptText += `
--- OUTFIT MODE ---
- Arrange the 2-3 items into a cohesive, styled outfit. Place tops above bottoms.
- Add perfectly coordinated shoes and one or two matching accessories (like a handbag or simple jewelry) to complete the look.
- The added accessories must complement the vibe and NOT distract from the main clothing items.
`;
      } else { // single item
        promptText += `
--- SINGLE ITEM MODE ---
- Center the single garment with generous empty space/margins around it.
`;
      }

      promptText += `\n--- LOOK PRESET: ${lookPreset.replace(/-/g, ' ')} ---`;
      switch (lookPreset) {
        case 'clean-catalog':
          promptText += `
- Style Details: Create a bright, clean, perfectly symmetrical arrangement.
- Shadows: Use minimal to near-zero shadows.
- Accessories: Minimal to no accessories. Focus is 100% on the product.
- Vibe: Crisp, professional, e-commerce catalog.
`;
          break;
        case 'styled-boutique':
          promptText += `
- Style Details: Create a warm, inviting, slightly styled arrangement.
- Shadows: Apply a soft, realistic drop shadow under each garment for depth.
- Accessories (Outfit Mode): Add one premium accessory (e.g., a leather bag).
- Vibe: High-end boutique, sophisticated, warm.
`;
          break;
        case 'facebook-sales-post':
          promptText += `
- Style Details: Create a dynamic but still neat and organized arrangement. It can be slightly more playful than a rigid catalog shot.
- Shadows: Soft shadows are acceptable.
- Accessories (Outfit Mode): Add up to two trendy but tasteful accessories (e.g., sunglasses and a handbag).
- Vibe: Engaging, ready for social media, eye-catching.
`;
          break;
        case 'luxury-editorial':
          promptText += `
- Style Details: Create a highly stylized, artistic arrangement.
- Lighting: Use slightly more dramatic lighting, but maintain a clean look.
- Shadows: Shadows can be more pronounced to create a high-fashion feel.
- Accessories (Outfit Mode): Add premium, luxury accessories that tell a story.
- Vibe: Aspirational, editorial, luxury magazine.
`;
          break;
      }
    } else { // on-model
        promptText += `
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
            promptText += `
--- CONTEXT: OUTFIT ---
- This is an outfit shot. Combine the items from the provided images into a single, styled composition.
`;
        }
        
        promptText += `\n--- STYLE: ON-MODEL ---`;
        promptText += `\n--- LOOK PRESET: ${lookPreset.replace(/-/g, ' ')} ---`;

        switch (lookPreset) {
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
    }

    const imageParts = imageDataUris.map(url => ({media: {url}}));
    const prompt = [...imageParts, {text: promptText}];

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        console.log(`Attempt ${attempt + 1} to generate image...`);
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

        // Success!
        return { enhancedImageDataUri: url, isFallback: false };

      } catch (error: any) {
        console.error(`Attempt ${attempt + 1} failed:`, error.message);
        
        const isRetryable = error.message?.includes('UNAVAILABLE') || error.message?.includes('503');
        if (isRetryable && attempt < maxRetries) {
          const delay = initialDelay * Math.pow(3, attempt); // 1s, 3s
          console.log(`Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        } else {
          console.log('Max retries reached or error is not retryable. Falling back.');
          return { enhancedImageDataUri: imageDataUris[0], isFallback: true };
        }
      }
    }
    
    // This should not be reached, but as a safeguard.
    return { enhancedImageDataUri: imageDataUris[0], isFallback: true };
  }
);
