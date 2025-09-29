async function testLocalAPI() {
  try {
    console.log('Testing local AI endpoint...')
    const response = await fetch('http://localhost:3000/api/ai-assist', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        field: 'title',
        context: {
          municipality: 'Sarajevo',
          country: 'Bosnia'
        },
        language: 'en'
      })
    })

    console.log('Response status:', response.status)
    const data = await response.json()
    console.log('Response:', data)
  } catch (error) {
    console.error('Error:', error)
  }
}

testLocalAPI()