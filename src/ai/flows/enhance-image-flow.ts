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

--- TASK: CREATE A STYLED BOUTIQUE FLAT LAY IMAGE ---

--- GOAL ---
Produce a premium, scroll-stopping flat lay image that looks like it was created by a top online boutique for a Facebook sales post. The image must be warm, inviting, and professional. The final image must be square (1:1 aspect ratio).

--- GENERAL STYLING RULES ---
- Camera Angle: Perfect 90-degree overhead, top-down flat lay.
- Background: Use a warm, soft, clean background like a cream or light beige studio surface, or a light wood texture. Avoid pure white or harsh backgrounds.
- Layout: Arrange the clothing items in a natural, intentionally styled outfit composition. Avoid rigid, grid-like catalog placements. Create a sense of realism with slight angles and soft, tasteful overlaps between items.
- Garment Integrity: Preserve the original colors, prints, and proportions of the clothing items accurately. Do not distort or redesign the garments.
- Lighting: Soft, diffused, even studio light. Shadows should be soft and natural, adding depth without being distracting.
- Forbidden Elements: Do NOT add text, watermarks, or logos. Avoid a cluttered or stock-photo feel.
`;

      if (creationType === 'multiple') {
        promptText += `
--- OUTFIT COMPOSITION ---
- Arrange the 2-3 items into a cohesive, styled outfit that looks natural and intentional. Place tops above bottoms.
- Automatically add 1-3 perfectly coordinated boutique accessories to complete the look.
- Accessory examples: a stylish crossbody bag, a clutch, simple jewelry (necklace, bracelet), sunglasses, or a pair of shoes.
- You can optionally add a subtle lifestyle prop like a small plant or a coffee mug to enhance the boutique feel.
- Critical Rule: Accessories and props must ENHANCE the outfit, not overpower or distract from the main clothing items.
`;
      } else { // single item
        promptText += `
--- SINGLE ITEM COMPOSITION ---
- Center the single garment with generous empty space/margins around it.
- You can add one or two simple, complementary accessories (like a piece of jewelry or sunglasses) to give it context, but the focus must remain on the main item.
`;
      }

      promptText += `\n--- LOOK PRESET: ${lookPreset.replace(/-/g, ' ')} ---`;
      switch (lookPreset) {
        case 'clean-catalog':
          promptText += `
- Style Details: Create a bright, clean, symmetrical arrangement. Keep it very organized and minimal. Reduce overlap and angles for this preset.
- Shadows: Use minimal to near-zero shadows.
- Accessories: Minimal to no accessories. Focus is 100% on the product.
- Vibe: Crisp, professional, e-commerce catalog.
`;
          break;
        case 'styled-boutique':
          promptText += `
- Style Details: Create a warm, inviting, slightly styled arrangement with a soft, organic feel.
- Shadows: Apply a soft, realistic drop shadow under each garment for depth.
- Accessories (Outfit Mode): Add one premium accessory (e.g., a leather bag, high-quality sunglasses).
- Vibe: High-end boutique, sophisticated, warm.
`;
          break;
        case 'facebook-sales-post':
          promptText += `
- Style Details: Create a dynamic but still neat and organized arrangement. This is the primary goal, so embrace the natural, styled look with soft overlaps.
- Shadows: Soft, natural shadows are encouraged.
- Accessories (Outfit Mode): Add up to two trendy but tasteful accessories (e.g., sunglasses and a handbag). A lifestyle prop like a plant is a good fit here.
- Vibe: Engaging, ready for social media, eye-catching.
`;
          break;
        case 'luxury-editorial':
          promptText += `
- Style Details: Create a highly stylized, artistic, and aspirational arrangement.
- Lighting: Use slightly more dramatic lighting, but maintain a clean, high-fashion look.
- Shadows: Shadows can be more pronounced to create a premium, editorial feel.
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
