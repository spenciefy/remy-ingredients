import { Editor } from 'tldraw';
import { Comment } from '../types/Comment';
import { generateIngredientSummary } from './llmService';

/**
 * Add an image ingredient to the canvas
 */
export const addImageIngredient = (editor: Editor, dataUrl: string, point: { x: number, y: number }) => {
  // Create temporary image to get dimensions
  const img = new Image()
  img.onload = async () => {
    // Calculate dimensions while maintaining aspect ratio
    const maxWidth = 600
    const maxHeight = 600
    let width = img.naturalWidth
    let height = img.naturalHeight
    
    // Scale down if image is larger than max dimensions
    if (width > maxWidth || height > maxHeight) {
      const aspectRatio = width / height
      if (width / maxWidth > height / maxHeight) {
        width = maxWidth
        height = width / aspectRatio
      } else {
        height = maxHeight
        width = height * aspectRatio
      }
    }

    try {
      // Generate summary and title before creating shape
      const summary = await generateIngredientSummary(dataUrl, '', true);

      // Create AI comment
      const newComment: Comment = {
        id: Math.random().toString(36).substr(2, 9), // Simple unique ID generation
        text: summary.description,
        createdAt: Date.now(),
        isAI: true,
      };

      // Create the shape with the generated title and comment
      editor.createShape({
        type: 'image-ingredient-shape',
        props: {
          title: summary.title,
          imageUrl: dataUrl,
          w: width,
          h: height,
          comments: [newComment], // Add comment during creation
        },
        x: point.x,
        y: point.y,
      });

    } catch (error) {
      console.error("Error generating summary or creating image ingredient:", error);
      // Fallback: Create shape without title/comment or with error state?
      editor.createShape({ 
        type: 'image-ingredient-shape',
        props: { 
          title: 'Error',
          imageUrl: dataUrl,
          w: width,
          h: height,
        },
        x: point.x,
        y: point.y,
      });
    }
  }
  img.src = dataUrl
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