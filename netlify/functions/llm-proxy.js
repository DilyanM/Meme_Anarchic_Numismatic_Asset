// netlify/functions/llm-proxy.js
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
      const { message } = JSON.parse(event.body);
  
      if (!message) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'Message is required' }),
        };
      }
  
      // Get the OpenAI API key from environment variables
      const openaiApiKey = process.env.OPENAI_API_KEY;
      if (!openaiApiKey) {
        return {
          statusCode: 500,
          body: JSON.stringify({ error: 'OpenAI API key not configured' }),
        };
      }
  
      // Make the request to OpenAI
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openaiApiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            { role: 'system', content: 'You are Mana, a mystical humanoid cow AI guiding users in the realm of digital seeds.' },
            { role: 'user', content: message },
          ],
          max_tokens: 150,
          temperature: 0.7,
        }),
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        return {
          statusCode: response.status,
          body: JSON.stringify({ error: `OpenAI API request failed: ${JSON.stringify(errorData)}` }),
        };
      }
  
      const data = await response.json();
      if (!data.choices || !data.choices[0].message.content) {
        return {
          statusCode: 500,
          body: JSON.stringify({ error: 'No response from LLM' }),
        };
      }
  
      return {
        statusCode: 200,
        body: JSON.stringify({ response: data.choices[0].message.content }),
      };
    } catch (error) {
      console.error('Error in llm-proxy:', error);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: error.message }),
      };
    }
  };