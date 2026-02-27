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
  'clean-catalog',
  'styled-boutique',
  'facebook-sales-post',
  'luxury-editorial',
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
  accessories: z.enum(['Off', 'Light', 'Full']).optional().describe('The level of accessory styling.'),
  layout: z.enum(['Grid', 'Flat-lay', 'Hero']).optional().describe('The desired composition layout.'),
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
  async ({imageDataUris, creationType, styleType, lookPreset, accessories, layout}) => {
    const maxRetries = 2;
    const initialDelay = 1000;

    let promptText = `You are an expert boutique visual stylist. Your goal is to transform user-uploaded product photos into a single, clean, luxury, retail-ready marketing image. The final image must be square (1:1 aspect ratio).`;

    if (styleType === 'flat-lay') {
      promptText = `You are an expert boutique merchandiser and product photographer. Your goal is to transform user-uploaded product photos into a single, premium, retail-ready marketing image that looks like it was styled by a successful boutique owner for a Facebook post.

--- CORE RULES (APPLY TO ALL FLAT LAY IMAGES) ---

**1. Aesthetic & Vibe:**
- **Goal:** A warm, cozy, and inviting boutique aesthetic (think successful LuLaRoe seller). The image must feel clean, premium, and scroll-stopping.
- **Lighting:** Soft, warm, diffused lighting.
- **Shadows:** Create natural, soft drop shadows for depth and realism. The result should not look flat.
- **Background:** Use a warm, neutral boutique-style background (e.g., cream, light beige, off-white seamless paper, a very light wood texture, or a soft fabric surface).

**2. Composition & Layout:**
- **Camera Angle:** Strict 90-degree overhead, top-down flat lay view.
- **Layout:** The composition must be center-weighted and visually balanced. Arrange items naturally and intentionally.
- **Spacing:** Ensure clean, balanced spacing between all items.

**3. Garment Presentation (CRITICAL):**
- **Realism:** Preserve the original garment texture, print, and colors exactly. Maintain realistic fabric folds and drape. Do not distort patterns or shapes.
- **Tops:** Must appear smooth, fully visible, and naturally positioned.
- **Bottoms:** Must be displayed realistically and in a wearable way (e.g., fully extended to show length). A single, gentle fold is acceptable only if required for styling, but AVOID random, excessive, or square folding.
- **Placement:** Garments should not look like they are floating. No awkward overlapping that obscures items. The outfit must feel intentionally styled.

**4. Final Output:**
- **Format:** Square (1:1) aspect ratio.
- **Forbidden:** No text, watermarks, or logos. Avoid busy backgrounds, clutter, or a generic "stock photo" feel.
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
- Add complementary accessories to give it context and create a mini-outfit look.
`;
      }
      
      // -- NEW: Layout, Accessories, and Preset Refinements --

      if (layout) {
          promptText += `\n--- LAYOUT STYLE: ${layout} ---`;
          if (layout === 'Grid') {
              promptText += `\n- Refinement: Arrange items in a clean, organized, grid-like fashion with minimal overlap. More structured than a standard flat-lay.`
          } else if (layout === 'Hero' && imageDataUris.length > 1) {
              promptText += `\n- Refinement: Make the first clothing item the clear focal point, larger and more central than the others, which should be arranged around it.`
          } else { // Flat-lay
               promptText += `\n- Refinement: Arrange items in a natural, organic flat-lay with tasteful overlaps. This is the classic boutique look.`
          }
      }

      if (accessories) {
          promptText += `\n--- ACCESSORY LEVEL: ${accessories} ---`;
          if (accessories === 'Off') {
              promptText += `\n- Refinement: Do not include ANY props or accessories. Focus only on the main clothing item(s).`;
          } else if (accessories === 'Light') {
              promptText += `\n- Refinement: Include 1-2 simple, complementary accessories (e.g., a piece of jewelry, sunglasses).`;
          } else { // Full
              promptText += `\n- Refinement: Include 3-5 stylish accessories to create a complete, rich look (e.g., handbag, shoes, jewelry).`;
          }
      } else {
           promptText += `\n--- ACCESSORY LEVEL: Default --- \n- Use your best judgment to add 1-3 tasteful accessories that enhance the outfit.`;
      }


      promptText += `\n--- LOOK PRESET REFINEMENT: ${lookPreset.replace(/-/g, ' ')} ---`;
      switch (lookPreset) {
        case 'clean-catalog':
          promptText += `
- **Vibe:** Crisp, professional, high-end e-commerce catalog. Reduce overlap and angles. Keep it very organized and minimal. If accessories are requested, keep them very simple.
`;
          break;
        case 'styled-boutique':
          promptText += `
- **Vibe:** Sophisticated, warm, high-end boutique. Create a warm, inviting arrangement with a soft, organic feel and tasteful overlaps. Emphasize soft, realistic drop shadows for depth.
`;
          break;
        case 'facebook-sales-post':
          promptText += `
- **Vibe:** Engaging, ready for social media, scroll-stopping. Create a dynamic but still neat arrangement. Use trendy but tasteful accessories if requested.
`;
          break;
        case 'luxury-editorial':
          promptText += `
- **Vibe:** Aspirational, editorial, luxury magazine. Create a more artistic arrangement. Use slightly more dramatic lighting and shadows to create a premium feel.
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
