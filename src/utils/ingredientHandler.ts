import { Editor } from 'tldraw';
import { uploadImageFile } from '../lib/tldrawAssetStore';
import { Comment } from '../types/Comment';
import { generateIngredientSummary } from './ingredientSummaryService';

/**
 * Converts a data URL string to a File object.
 */
function dataURLtoFile(dataUrl: string, filename: string): File {
  const arr = dataUrl.split(',');
  if (arr.length < 2) {
    throw new Error('Invalid data URL');
  }
  const mimeMatch = arr[0].match(/:(.*?);/);
  if (!mimeMatch || mimeMatch.length < 2) {
    throw new Error('Cannot parse MIME type from data URL');
  }
  const mime = mimeMatch[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mime });
}

/**
 * Add an image ingredient to the canvas by uploading it and using the returned URL.
 */
export const addImageIngredient = async (editor: Editor, dataUrl: string, point: { x: number, y: number }): Promise<void> => {
  // Define getDimensions in the outer scope of addImageIngredient
  const getDimensions = (url: string): Promise<{ width: number, height: number }> => 
    new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const maxWidth = 600;
        const maxHeight = 600;
        let width = img.naturalWidth;
        let height = img.naturalHeight;
        if (width > maxWidth || height > maxHeight) {
          const aspectRatio = width / height;
          if (width / maxWidth > height / maxHeight) {
            width = maxWidth;
            height = width / aspectRatio;
          } else {
            height = maxHeight;
            width = height * aspectRatio;
          }
        }
        resolve({ width, height });
      };
      img.onerror = (err) => reject(err instanceof Event ? new Error('Image load error') : err);
      img.src = url;
    });

  let imageName = 'pasted-image.png'; // Default filename
  try {
    const tempFileForName = dataURLtoFile(dataUrl, 'temp'); // Create once to get type for name
    imageName = `uploaded-ingredient.${tempFileForName.type.split('/')[1] || 'png'}`;
  } catch (e) {
    console.warn('Could not determine fine name from dataURL, using default.', e)
  }

  try {
    // 1. Get image dimensions (asynchronously) - getDimensions is now defined in outer scope
    // const getDimensions = (url: string): Promise<{ width: number, height: number }> => 
    //   new Promise((resolve, reject) => { ... }); // Moved to outer scope

    // 2. Convert dataUrl to File object for upload
    const imageFile = dataURLtoFile(dataUrl, imageName);

    // 3. Start operations in parallel: get dimensions and generate summary.
    const dimensionsPromise = getDimensions(dataUrl);
    const summaryPromise = generateIngredientSummary(dataUrl, '', true); // Uses original dataUrl

    // Wait for dimensions and summary concurrently
    const [dimensions, summary] = await Promise.all([
      dimensionsPromise,
      summaryPromise
    ]);

    // 4. Upload the image using the summary title for the filename
    const uploadedImageUrl = await uploadImageFile(imageFile, summary.title);

    // 5. Create AI comment
    const newComment: Comment = {
      id: Math.random().toString(36).substr(2, 9),
      text: summary.description,
      createdAt: Date.now(),
      isAI: true,
    };

    // 6. Create the shape with the uploaded image URL and other details
    editor.createShape({
      type: 'image-ingredient-shape',
      props: {
        title: summary.title,
        imageUrl: uploadedImageUrl, // Use the hosted image URL
        w: dimensions.width,
        h: dimensions.height,
        comments: [newComment],
      },
      x: point.x,
      y: point.y,
    });

  } catch (error) {
    console.error("Error processing or creating image ingredient:", error);
    // Fallback: Create shape with an error state or minimal info. 
    // Using original dataUrl as a fallback for imageUrl might be an option if upload fails but dimensions/summary worked.
    // For now, let's try to get dimensions for a simple fallback if possible.
    try {
        const dims = await getDimensions(dataUrl); // Try to get dimensions even for fallback
        editor.createShape({ 
            type: 'image-ingredient-shape',
            props: { 
              title: 'Error Uploading', // Indicate error
              imageUrl: dataUrl, // Fallback to dataUrl or a placeholder error image URL
              w: dims.width,
              h: dims.height,
            },
            x: point.x,
            y: point.y,
        });
    } catch (fallbackError) {
        console.error("Error creating fallback image ingredient:", fallbackError);
        // Absolute fallback if even getting dimensions for dataUrl fails
        editor.createShape({ 
            type: 'image-ingredient-shape',
            props: { 
              title: 'Error Processing', 
              imageUrl: '', // Or a placeholder error image
              w: 200, h: 200 // Default dimensions
            },
            x: point.x,
            y: point.y,
        });
    }
  }
}

/**
 * Add a text ingredient to the canvas
 */
export const addTextIngredient = async (editor: Editor, text: string, point: { x: number, y: number }) => {
  try {
    // Generate summary and title before creating shape
    const summary = await generateIngredientSummary(text, '', false);

    // Create AI comment
    const newComment: Comment = {
      id: Math.random().toString(36).substr(2, 9), // Simple unique ID generation
      text: summary.description,
      createdAt: Date.now(),
      isAI: true,
    };

    // Create the shape with the generated title and comment
    editor.createShape({
      type: 'text-ingredient-shape',
      props: {
        title: summary.title,
        text,
        comments: [newComment], // Add comment during creation
      },
      x: point.x,
      y: point.y,
    });

  } catch (error) {
    console.error("Error generating summary or creating text ingredient:", error);
    // Fallback: Create shape without title/comment or with error state?
    editor.createShape({ 
      type: 'text-ingredient-shape',
      props: { 
        title: 'Error', 
        text,
      },
      x: point.x,
      y: point.y,
    });
  }
} 