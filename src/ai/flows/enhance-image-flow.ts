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

--- STYLE DIRECTION ---
Generate a boutique-quality styled flat lay outfit as if arranged by a professional boutique stylist for a social media post or live sale. The final image should look like a successful boutique owner styled and photographed the outfit themselves for Facebook or Instagram. It must be a premium, scroll-stopping image that feels authentic, warm, and inviting.

--- COMPOSITION RULES (VERY IMPORTANT) ---
- **Natural, Intentional Layout:** Arrange items naturally as a cohesive, intentionally styled outfit. AVOID perfect symmetry, rigid grids, or exact centering. Use slight angles and organic placement to mimic a real stylist's work. Ensure clean spacing and visual balance.
- **Garment Presentation:**
    - Tops should be laid flat and fully visible.
    - Bottoms (pants, leggings) must be displayed fully extended to show their length and fit. A single, gentle fold is acceptable only if required for styling, but avoid random, excessive, or square folding.
    - Garments must look grounded. Avoid awkward or unnatural folding and never overlap garments in a way that obscures them.
- **Realistic Scale & Integrity:** Maintain the realistic scale and proportions of all garments relative to each other. Do not dramatically shrink or enlarge any item. Preserve the original colors, prints, and design of the clothing. Do not alter the garments.
- **Camera Angle:** Strict 90-degree overhead, top-down flat lay view.

--- BACKGROUND & LIGHTING ---
- **Background:** Use a warm, neutral boutique-style background (e.g., cream, light beige, off-white seamless paper, a very light wood texture, or a soft fabric surface).
- **Lighting:** Soft, diffused, even studio light.
- **Shadows:** Create soft, natural drop shadows to add depth and realism. The result should not look flat.

--- ACCESSORIES (MUST BE INCLUDED) ---
- **Automatic Accessorizing:** Always add 1-3 perfectly coordinated boutique accessories to complete the look (e.g., a stylish bag, simple jewelry, sunglasses, a pair of shoes). Do not overcrowd the layout.
- **Tasteful & Complementary:** Accessories must ENHANCE the outfit, not overpower or distract from the main clothing items. They must match the outfit's style and color palette.
- **Lifestyle Props:** You can optionally add a single, subtle lifestyle prop like a small plant or a coffee mug to enhance the boutique feel, but keep it minimal.

--- FORBIDDEN ELEMENTS (DO NOT INCLUDE) ---
- Text, watermarks, or logos.
- Busy, cluttered backgrounds or distracting props.
- A generic, "stock photo" or AI-generated feel. Symmetrical, catalog-style grid layouts are forbidden.
- Distorted or redesigned clothing shapes.
`;

      if (creationType === 'multiple') {
        promptText += `
--- OUTFIT CONTEXT ---
- The user has provided 2-3 items. Arrange them into a single cohesive outfit.
`;
      } else { // single item
        promptText += `
--- SINGLE ITEM CONTEXT ---
- The user has provided a single main clothing item. Center it but maintain an organic, styled feel.
- Add 1-2 complementary accessories to give it context and create a mini-outfit look.
`;
      }

      promptText += `\n--- LOOK PRESET: ${lookPreset.replace(/-/g, ' ')} ---`;
      switch (lookPreset) {
        case 'clean-catalog':
          promptText += `
- **Refinement:** For this preset, lean towards a brighter, cleaner, and more organized arrangement. Reduce overlap and angles slightly. Keep it very organized and minimal.
- **Accessories:** Minimal (one simple item) or no accessories. The focus is 100% on the product.
- **Vibe:** Crisp, professional, high-end e-commerce catalog.
`;
          break;
        case 'styled-boutique':
          promptText += `
- **Refinement:** This is the core style. Create a warm, inviting arrangement with a soft, organic feel and tasteful overlaps.
- **Shadows:** Emphasize soft, realistic drop shadows for depth.
- **Accessories:** Add one premium, standout accessory (e.g., a leather bag, high-quality sunglasses).
- **Vibe:** Sophisticated, warm, high-end boutique.
`;
          break;
        case 'facebook-sales-post':
          promptText += `
- **Refinement:** Create a dynamic but still neat and organized arrangement. Embrace the natural, styled look with soft overlaps to be eye-catching.
- **Accessories:** Add up to two trendy but tasteful accessories (e.g., sunglasses and a handbag). A lifestyle prop is a good fit here.
- **Vibe:** Engaging, ready for social media, scroll-stopping.
`;
          break;
        case 'luxury-editorial':
          promptText += `
- **Refinement:** Create a more artistic and aspirational arrangement. The composition can be more creative.
- **Lighting:** Use slightly more dramatic lighting and shadows to create a premium, editorial feel, while still being clean.
- **Accessories:** Add premium, luxury-style accessories that tell a story.
- **Vibe:** Aspirational, editorial, luxury magazine.
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
