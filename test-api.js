const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'
const OPENROUTER_API_KEY = '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'

async function testAPI() {
  try {
    console.log('Testing OpenRouter API...')
    const response = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://mefa-platform.eu',
        'X-Title': 'MEFA Platform'
      },
      body: JSON.stringify({
        model: 'meta-llama/llama-3.2-3b-instruct:free',
        messages: [
          {
            role: 'user',
            content: 'Say hello in one word'
          }
        ],
        temperature: 0.7,
        max_tokens: 100
      })
    })

    console.log('Response status:', response.status)
    const text = await response.text()
    console.log('Response text:', text)

    if (response.ok) {
      const data = JSON.parse(text)
      console.log('AI response:', data.choices?.[0]?.message?.content)
    }
  } catch (error) {
    console.error('Error:', error)
  }
}

testAPI()