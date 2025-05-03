import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface AnalyzeRequest {
  content: string
  title?: string
  isImage: boolean
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const apiKey = Deno.env.get('OPENAI_API_KEY')
    if (!apiKey) {
      throw new Error('OpenAI API key not configured in environment variables')
    }

    const { content, title, isImage } = await req.json() as AnalyzeRequest

    if (!content) {
      return new Response(
        JSON.stringify({ error: 'Content is required' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const messages = [
      {
        role: 'user',
        content: isImage ? [
          {
            type: 'text',
            text: `Analyze this image${title ? ` of ${title}` : ''} and provide a brief description in maximum 2 sentences. Use plain text only, no markdown or special formatting.`
          },
          {
            type: 'image_url',
            image_url: {
              url: content
            }
          }
        ] : `analyze the following text${title ? ` about ${title}` : ''} and provide a brief summary in maximum 2 sentences. Use plain text only, no markdown or special formatting:\n\n${content}`
      }
    ]

    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1',
        messages,
        temperature: 0.7
      })
    })

    if (!openaiResponse.ok) {
      const error = await openaiResponse.text()
      console.error('OpenAI API error:', error)
      throw new Error(`OpenAI API request failed: ${openaiResponse.status} ${openaiResponse.statusText}`)
    }

    const data = await openaiResponse.json()
    const summary = data.choices[0].message.content.trim()

    return new Response(
      JSON.stringify({ text: summary }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: 'If you are seeing an authorization error, please ensure the OPENAI_API_KEY is properly configured in your Supabase project settings.'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})