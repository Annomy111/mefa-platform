// Test AI functionality
// Using native fetch in Node 18+

async function testAI() {
  console.log('Testing AI functionality...\n');

  const testContext = {
    title: 'Green Energy Municipal Project',
    municipality: 'Sarajevo',
    country: 'Bosnia and Herzegovina',
    ipaWindow: 'Window 1: Rule of Law',
    language: 'en'
  };

  console.log('Testing single field generation...');
  try {
    const response = await fetch('http://localhost:3000/api/ai-assist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        field: 'description',
        context: testContext,
        language: 'en'
      })
    });

    const data = await response.json();
    console.log('✅ Single field response:', data.suggestion ? 'Generated successfully' : 'Failed');
    console.log('   Cached:', data.cached || false);
    console.log('   Source:', data.source || 'unknown');
    console.log('   Preview:', data.suggestion ? data.suggestion.substring(0, 100) + '...' : 'No content');
  } catch (error) {
    console.log('❌ Single field test failed:', error.message);
  }

  console.log('\nTesting section auto-fill...');
  try {
    const response = await fetch('http://localhost:3000/api/ai-assist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'fill-section',
        sectionName: 'basic',
        fields: ['title', 'municipality', 'description'],
        context: testContext,
        language: 'en'
      })
    });

    const data = await response.json();
    console.log('✅ Section fill response:', data.success ? 'Generated successfully' : 'Failed');
    console.log('   Fields generated:', Object.keys(data.results || {}).join(', '));
  } catch (error) {
    console.log('❌ Section fill test failed:', error.message);
  }

  console.log('\nTesting cache functionality...');
  try {
    // Make the same request twice to test caching
    const response1 = await fetch('http://localhost:3000/api/ai-assist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        field: 'objectives',
        context: testContext,
        language: 'en'
      })
    });

    const data1 = await response1.json();
    console.log('✅ First request - Cached:', data1.cached || false);

    // Wait a bit then make the same request
    await new Promise(r => setTimeout(r, 1000));

    const response2 = await fetch('http://localhost:3000/api/ai-assist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        field: 'objectives',
        context: testContext,
        language: 'en'
      })
    });

    const data2 = await response2.json();
    console.log('✅ Second request - Cached:', data2.cached || false);

    if (data2.cached) {
      console.log('   ✅ Cache is working correctly!');
    }
  } catch (error) {
    console.log('❌ Cache test failed:', error.message);
  }

  console.log('\n=== Test Complete ===');
}

testAI().catch(console.error);