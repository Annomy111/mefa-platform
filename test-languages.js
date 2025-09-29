async function testLanguages() {
  const languages = [
    { code: 'en', name: 'English' },
    { code: 'sq', name: 'Albanian' },
    { code: 'bs', name: 'Bosnian' },
    { code: 'sr', name: 'Serbian' }
  ]

  for (const lang of languages) {
    console.log(`\n=== Testing ${lang.name} (${lang.code}) ===`)

    try {
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
          language: lang.code
        })
      })

      if (response.ok) {
        const data = await response.json()
        console.log(`Response (${lang.name}):`)
        console.log(data.suggestion.substring(0, 200) + '...')
      } else {
        console.log(`Error for ${lang.name}: ${response.status}`)
      }
    } catch (error) {
      console.error(`Error testing ${lang.name}:`, error.message)
    }

    // Add delay between requests
    await new Promise(resolve => setTimeout(resolve, 1000))
  }
}

testLanguages()