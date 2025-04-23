// netlify/functions/tts-proxy.js
exports.handler = async (event) => {
    try {
      // Ensure the request is a POST
      if (event.httpMethod !== 'POST') {
        return {
          statusCode: 405,
          body: JSON.stringify({ error: 'Method Not Allowed' }),
        };
      }
  
      // Parse the request body
      const { text } = JSON.parse(event.body);
  
      if (!text) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'Text is required' }),
        };
      }
  
      // Get the ElevenLabs API key from environment variables
      const elevenLabsApiKey = process.env.ELEVENLABS_API_KEY;
      if (!elevenLabsApiKey) {
        return {
          statusCode: 500,
          body: JSON.stringify({ error: 'ElevenLabs API key not configured' }),
        };
      }
  
      // Make the request to ElevenLabs
      const response = await fetch('https://api.elevenlabs.io/v1/text-to-speech/OZqXgT52lc0I3Z1rz8Az', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'xi-api-key': elevenLabsApiKey,
          'Accept': 'audio/mpeg',
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_multilingual_v2',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.7,
            style: 0.2,
          },
        }),
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        return {
          statusCode: response.status,
          body: JSON.stringify({ error: `ElevenLabs API request failed: ${JSON.stringify(errorData)}` }),
        };
      }
  
      // Get the audio buffer
      const arrayBuffer = await response.arrayBuffer();
      const base64Audio = Buffer.from(arrayBuffer).toString('base64');
  
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'audio/mpeg',
        },
        body: base64Audio,
        isBase64Encoded: true,
      };
    } catch (error) {
      console.error('Error in tts-proxy:', error);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: error.message }),
      };
    }
  };