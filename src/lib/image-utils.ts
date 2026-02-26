/**
 * Represents the result of an image resize operation.
 */
export interface ResizedImage {
  blob: Blob;
  width: number;
  height: number;
}

/**
 * Resizes an image file to a maximum dimension while maintaining aspect ratio.
 *
 * @param file The image file to resize.
 * @param maxDimension The maximum width or height of the resized image.
 * @param quality The quality of the output JPEG image (0.0 to 1.0).
 * @returns A promise that resolves with the resized image blob and its dimensions.
 */
export const resizeImage = (
  file: File,
  maxDimension: number,
  quality = 0.8
): Promise<ResizedImage> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      if (!event.target?.result) {
        return reject(new Error('FileReader did not load file.'));
      }

      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;

        // Calculate new dimensions
        if (width > height) {
          if (width > maxDimension) {
            height = Math.round(height * (maxDimension / width));
            width = maxDimension;
          }
        } else {
          if (height > maxDimension) {
            width = Math.round(width * (maxDimension / height));
            height = maxDimension;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return reject(new Error('Could not get 2D canvas context.'));
        }

        // Draw the image onto the canvas
        ctx.drawImage(img, 0, 0, width, height);

        // Get the result as a Blob
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              return reject(new Error('Failed to create blob from canvas.'));
            }
            resolve({ blob, width, height });
          },
          'image/jpeg',
          quality
        );
      };
      img.onerror = (error) => {
        reject(new Error(`Image loading failed: ${error}`));
      };
      img.src = event.target.result as string;
    };

    reader.onerror = (error) => {
      reject(new Error(`FileReader failed: ${error}`));
    };
    reader.readAsDataURL(file);
  });
};
