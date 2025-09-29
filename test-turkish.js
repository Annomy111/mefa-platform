async function testTurkish() {
  console.log('Testing Turkish language generation...')

  const response = await fetch('http://localhost:3000/api/ai-assist', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      field: 'objectives',
      context: {
        title: 'Dijital Dönüşüm Projesi',
        municipality: 'Ankara',
        description: 'Digital transformation project'
      },
      language: 'tr'
    })
  })

  if (response.ok) {
    const data = await response.json()
    console.log('\nGenerated Turkish content:')
    console.log(data.suggestion.substring(0, 400))
    console.log('\nCached:', data.cached)
  }
}

testTurkish()