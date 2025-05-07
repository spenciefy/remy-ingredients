import { decode } from "https://deno.land/std@0.168.0/encoding/base64.ts";
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        }
      }
    )

    // Get file data from request
    const body = await req.json();
    const dataUrlString = body.file;
    const imageNameFromBody = body.imageName;

    if (!dataUrlString || typeof dataUrlString !== 'string' || !dataUrlString.startsWith('data:image')) {
      throw new Error('Invalid or missing image data URL in request body.');
    }

    // Extract base64 part from data URL (e.g., "data:image/png;base64,XXXX" -> "XXXX")
    const parts = dataUrlString.split(',');
    if (parts.length !== 2) {
      throw new Error('Malformed data URL.');
    }
    const base64String = parts[1];
    const fileBytes = decode(base64String);

    // Generate unique filename (or use imageNameFromBody if preferred and sanitized)
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2, 15)
    const filename = imageNameFromBody ? `${timestamp}-${imageNameFromBody.replace(/[^a-zA-Z0-9_.-]/g, '_')}` : `${timestamp}-${randomString}.png`;

    // Upload file to Supabase Storage
    const { error: uploadError } = await supabaseClient
      .storage
      .from('ingredient-images')
      .upload(filename, fileBytes, {
        contentType: parts[0].split(':')[1].split(';')[0],
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) {
      throw new Error(`Failed to upload: ${uploadError.message}`)
    }

    // Get public URL for the uploaded file
    const { data: { publicUrl } } = supabaseClient
      .storage
      .from('ingredient-images')
      .getPublicUrl(filename)

    return new Response(
      JSON.stringify({ url: publicUrl }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }), 
      { 
        status: 500,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    )
  }
})