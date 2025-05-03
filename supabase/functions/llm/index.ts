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
    console.log('Function started')
    
    const apiKey = Deno.env.get('OPENAI_API_KEY')
    if (!apiKey) {
      console.error('OpenAI API key not found in environment variables')
      throw new Error('OpenAI API key not configured in environment variables')
    }
    console.log('API key found')

    const { content, title, isImage } = await req.json() as AnalyzeRequest
    console.log('Request parsed:', { hasContent: !!content, title, isImage })

    if (!content) {
      console.error('No content provided in request')
      return new Response(
        JSON.stringify({ error: 'Content is required' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const systemPrompt = "You are an expert at analyzing ingredients and recipes. Provide a concise title and description for the given content. Return ONLY a JSON response with 'title' and 'description' fields. The title should be short (max 3-4 words) and the description should be 1-2 sentences."

    const messages = [
      {
        role: 'system',
        content: systemPrompt
      },
      {
        role: 'user',
        content: isImage ? [
          {
            type: 'text',
            text: `Analyze this image${title ? ` of ${title}` : ''} and provide a title and description.`
          },
          {
            type: 'image_url',
            image_url: {
              url: content
            }
          }
        ] : `Analyze the following text${title ? ` about ${title}` : ''} and provide a title and description:\n\n${content}`
      }
    ]

    console.log('Preparing OpenAI request with messages:', JSON.stringify(messages, null, 2))

    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1',
        messages,
        response_format: { type: "json_object" },
        temperature: 0.7
      })
    })

    console.log('OpenAI response status:', openaiResponse.status)

    if (!openaiResponse.ok) {
      const error = await openaiResponse.text()
      console.error('OpenAI API error response:', error)
      throw new Error(`OpenAI API request failed: ${openaiResponse.status} ${openaiResponse.statusText}`)
    }

    const data = await openaiResponse.json()
    console.log('OpenAI API response data:', JSON.stringify(data, null, 2))

    const result = JSON.parse(data.choices[0].message.content)
    console.log('Parsed result:', result)

    return new Response(
      JSON.stringify(result),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  } catch (error) {
    console.error('Error in function:', error)
    console.error('Error stack:', error.stack)
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