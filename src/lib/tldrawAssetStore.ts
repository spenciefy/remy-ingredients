import { TLAsset, TLAssetContext, TLAssetStore, uniqueId } from 'tldraw';

// [1] Define UPLOAD_URL
const VITE_SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

if (!VITE_SUPABASE_URL) {
  console.error("VITE_SUPABASE_URL is not set in environment variables. Image uploads will likely fail.");
  // You might want to throw an error here or handle this case more gracefully
}
const UPLOAD_URL = `${VITE_SUPABASE_URL}/functions/v1/upload`;

/**
 * Uploads a file to the Supabase endpoint.
 * @param file The file to upload.
 * @returns A promise that resolves with the public URL of the uploaded file.
 * @throws If the upload fails or the response is not as expected.
 */
export async function uploadImageFile(file: File): Promise<string> {
  const clientSideImageName = `${uniqueId()}-${file.name.replace(/[^a-zA-Z0-9_.-]/g, '_')}`;
  console.log('[Debug] uploadImageFile: Starting upload for:', clientSideImageName, 'Type:', file.type);

  try {
    const response = await fetch(UPLOAD_URL, {
        method: 'POST',
        headers: {
            'Content-Type': file.type, 
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: file, 
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error('[Debug] uploadImageFile: Failed to upload image:', response.status, errorText);
        throw new Error(`Upload failed: ${response.statusText} - ${errorText}`);
    }

    const resultJson = await response.json(); 

    if (!resultJson.url) {
      console.error('[Debug] uploadImageFile: Upload response missing url:', resultJson);
      throw new Error('Upload response missing url');
    }
    console.log('[Debug] uploadImageFile: Upload successful, URL:', resultJson.url);
    return resultJson.url;
  } catch (error) {
    console.error("[Debug] uploadImageFile: Error in asset upload process:", error);
    throw error; // Re-throw the error to be caught by the caller
  }
}

// [2] Define myAssetStore
export const myAssetStore: TLAssetStore = {
  async upload(_asset: TLAsset, file: File) {
    // Now uses the extracted uploadImageFile utility
    try {
      const imageUrl = await uploadImageFile(file);
      return { src: imageUrl };
    } catch (error) {
      // Log context specific to TLAssetStore if needed, then rethrow
      console.error("[Debug] AssetStore.upload: Error during file upload:", error);
      throw error; 
    }
  },

  resolve(asset: TLAsset, _ctx: TLAssetContext) {
    if (asset.props?.src) {
      return asset.props.src as string;
    }
    console.warn("[Debug] AssetStore.resolve: Asset resolve called for an asset without a src prop:", asset);
    return null; 
  },
}; 