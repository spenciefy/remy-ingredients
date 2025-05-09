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
 * @param customName Optional custom name for the file.
 * @returns A promise that resolves with the public URL of the uploaded file.
 * @throws If the upload fails or the response is not as expected.
 */
export async function uploadImageFile(file: File, customName?: string): Promise<string> {
  // Use the provided customName (e.g. the ingredient title) if available; otherwise fall back to the
  // original filename. In either case prepend a unique id to avoid collisions and sanitise the text so
  // it is safe for URLs / storage keys.
  const baseName = (customName ?? file.name)
    .replace(/[^a-zA-Z0-9_.-]/g, '_')
    .replace(/\s+/g, '_');

  const extensionFromType = (() => {
    const match = file.type.match(/image\/(.*)/);
    return match ? `.${match[1]}` : '';
  })();

  const clientSideImageName = `${baseName}-${uniqueId()}${extensionFromType}`;
  console.log('[Debug] uploadImageFile: Starting upload for:', clientSideImageName, 'Type:', file.type);

  try {
    // Convert the file to a base64 data URL so it can be sent as JSON to the
    // Supabase Edge Function. The edge function expects a JSON body with the
    // shape: { file: <dataUrl>, imageName: <string> } and will reject raw
    // binary bodies (which previously caused the "Unexpected token" JSON
    // parsing error).

    const fileToDataUrl = (f: File): Promise<string> => new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(f);
    });

    const dataUrl = await fileToDataUrl(file);
 
    const response = await fetch(UPLOAD_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          file: dataUrl,
          imageName: clientSideImageName,
        }),
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
    // Use _ctx in a no-op to avoid the unused variable linter warning
    void _ctx;
    if (asset.props?.src) {
      return asset.props.src as string;
    }
    console.warn("[Debug] AssetStore.resolve: Asset resolve called for an asset without a src prop:", asset);
    return null; 
  },
}; 