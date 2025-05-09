import { ApiInputItem } from './formatIngredientsForLLM'; // Assuming ApiInputItem is exported from here or types file

// Ensure VITE_API_URL is set in your .env file, e.g., VITE_API_URL=http://localhost:8000
const API_BASE_URL = import.meta.env.VITE_API_URL;

if (!API_BASE_URL) {
  console.error("🚨 VITE_API_URL is not defined. Please set it in your .env file for suggestionsHandler.");
  // Fallback or throw error, for now, calls might fail if this isn't set.
}

const SUGGESTIONS_STREAM_API_URL = API_BASE_URL ? `${API_BASE_URL}/suggestions/stream` : '/suggestions/stream';

export interface SuggestionStreamEvent {
  id: string;       // Unique ID for the event
  session_id: string; // Session ID
  event?: string;   // Type of SSE event, e.g., "delta", "complete", "error"
  content?: string; // Content payload, e.g., text chunk for "delta"
  // Add other fields if your backend sends more specific structured data in events
}

/**
 * Fetches suggestions from the backend API as a stream.
 * @param payload The data payload, including formatted ingredients.
 * @param sessionId Optional session ID.
 * @returns An async generator that yields suggestion string chunks.
 */
export async function* fetchSuggestionsStream(
  payload: { input: ApiInputItem[] },
  sessionId?: string
): AsyncGenerator<string> {
  if (!API_BASE_URL) {
    console.error(" VITE_API_URL is not set, cannot make API call.");
    throw new Error("API base URL is not configured.");
  }
  console.log('🌊 [Suggestions] Preparing to call suggestions stream API with payload:', payload);
  
  let response: Response;
  try {
    console.log(`📤 [Suggestions] Sending request to: ${SUGGESTIONS_STREAM_API_URL}`);
    response = await fetch(SUGGESTIONS_STREAM_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ input: payload.input, session_id: sessionId }),
    });
  } catch (networkError) {
    console.error('🌐❌ [Suggestions] Network error during streaming call:', networkError);
    throw new Error('Network error: Could not connect to the suggestions streaming service.');
  }

  if (!response.ok || !response.body) {
    const errorBody = await response.text().catch(() => '');
    console.error('🚫 [Suggestions] Streaming request failed:', response.status, response.statusText, errorBody);
    throw new Error(`Streaming suggestions request failed: ${response.status} ${response.statusText}`);
  }

  console.log('📡 [Suggestions] Connected to SSE stream');
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      console.log('🔚 [Suggestions] SSE stream ended');
      break;
    }

    buffer += decoder.decode(value, { stream: true });
    // console.log('📥 [Suggestions] Received chunk, buffer length:', buffer.length); // Can be too verbose

    let boundary: number;
    while ((boundary = buffer.indexOf('\n\n')) !== -1) {
      const rawEvent = buffer.substring(0, boundary).trim();
      buffer = buffer.substring(boundary + 2);

      if (!rawEvent.startsWith('data:')) continue;
      const jsonStr = rawEvent.slice(5).trim();
      if (!jsonStr) continue;

      try {
        const event: SuggestionStreamEvent = JSON.parse(jsonStr);
        // console.log('📦 [Suggestions] Parsed SSE event:', event); // Can be too verbose
        if (event.event === 'delta' && event.content) {
          // console.log('✨ [Suggestions] Yielding delta content:', event.content);
          yield event.content;
        } else if (event.event === 'error') {
          console.error('❌ [Suggestions] Error event from stream:', event.content);
          throw new Error(`Error from suggestion stream: ${event.content || 'Unknown stream error'}`);
        } else if (event.event === 'complete') {
          console.log('🏁 [Suggestions] Stream complete event received.');
          // Optional: could yield a special marker or just let the loop end
        }
      } catch (err) {
        console.warn('🚨 [Suggestions] Unable to parse SSE event JSON:', err, jsonStr);
      }
    }
  }
}
