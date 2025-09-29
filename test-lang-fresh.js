async function testFreshLanguages() {
  const tests = [
    { code: 'sr', name: 'Serbian', municipality: 'Beograd' },
    { code: 'bs', name: 'Bosnian', municipality: 'Banja Luka' },
    { code: 'sq', name: 'Albanian', municipality: 'Tirana' },
    { code: 'mk', name: 'Macedonian', municipality: 'Skopje' }
  ]

  for (const test of tests) {
    console.log(`\n=== Testing ${test.name} (${test.code}) ===`)

    try {
      const response = await fetch('http://localhost:3000/api/ai-assist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          field: 'description',
          context: {
            title: 'Green Energy Project',
            municipality: test.municipality,
            country: test.name
          },
          language: test.code
        })
      })

      if (response.ok) {
        const data = await response.json()
        console.log(`Response in ${test.name}:`)
        console.log(data.suggestion.substring(0, 300) + '...')
        console.log('Cached:', data.cached)
      } else {
        console.log(`Error for ${test.name}: ${response.status}`)
      }
    } catch (error) {
      console.error(`Error testing ${test.name}:`, error.message)
    }

    // Add delay between requests
    await new Promise(resolve => setTimeout(resolve, 2000))
  }
}

testFreshLanguages()