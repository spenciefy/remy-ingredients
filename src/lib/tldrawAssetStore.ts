import { TLAsset, TLAssetContext, TLAssetStore, uniqueId } from 'tldraw';

// [1] Define UPLOAD_URL
const VITE_SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

if (!VITE_SUPABASE_URL) {
  console.error("VITE_SUPABASE_URL is not set in environment variables. Image uploads will likely fail.");
  // You might want to throw an error here or handle this case more gracefully
}
const UPLOAD_URL = `${VITE_SUPABASE_URL}/functions/v1/upload`;

// [2] Define myAssetStore
export const myAssetStore: TLAssetStore = {
  async upload(_asset: TLAsset, file: File) {
    const id = uniqueId();
    // Client-side image name generation is not strictly necessary if Supabase function generates its own,
    // but can be useful for debugging or if the function were to use it.
    const clientSideImageName = `${id}-${file.name.replace(/[^a-zA-Z0-9_.-]/g, '_')}`;
    console.log('[Debug] AssetStore: Starting upload for:', clientSideImageName, 'Type:', file.type);


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
          console.error('[Debug] AssetStore: Failed to upload image:', response.status, errorText);
          throw new Error(`Upload failed: ${response.statusText} - ${errorText}`);
      }

      const resultJson = await response.json(); 

      if (!resultJson.url) {
        console.error('[Debug] AssetStore: Upload response missing url:', resultJson);
        throw new Error('Upload response missing url');
      }
      return { src: resultJson.url };
    } catch (error) {
      console.error("[Debug] AssetStore: Error in asset upload process:", error);
      throw error;
    }
  },

  resolve(asset: TLAsset, _ctx: TLAssetContext) {
    if (asset.props?.src) {
      return asset.props.src as string;
    }
    console.warn("[Debug] AssetStore: Asset resolve called for an asset without a src prop:", asset);
    return null; 
  },
}; 