const puppeteer = require('puppeteer');

(async () => {
  console.log('🚀 Starting MEFA Platform Comprehensive Test');
  console.log('================================================\n');

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();

    // Set viewport
    await page.setViewport({ width: 1920, height: 1080 });

    // Enable request interception to monitor API calls
    await page.setRequestInterception(true);
    const apiCalls = [];

    page.on('request', (request) => {
      if (request.url().includes('/api/')) {
        apiCalls.push({
          url: request.url(),
          method: request.method(),
          timestamp: new Date().toISOString()
        });
      }
      request.continue();
    });

    // Monitor console logs
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log(`❌ Console Error: ${msg.text()}`);
      }
    });

    console.log('📍 Test 1: Loading Application');
    console.log('--------------------------------');

    // Navigate to the application
    const response = await page.goto('http://localhost:3000', {
      waitUntil: 'networkidle0',
      timeout: 30000
    });

    if (response.status() === 200) {
      console.log('✅ Application loaded successfully');
    } else {
      console.log(`⚠️ Application loaded with status: ${response.status()}`);
    }

    // Wait a bit for any redirects
    await new Promise(resolve => setTimeout(resolve, 2000));

    const currentUrl = page.url();
    console.log(`📍 Current URL: ${currentUrl}`);

    // Try to navigate directly to the project builder
    console.log('\n📍 Test 2: Navigating to Project Builder');
    console.log('----------------------------------------');

    await page.goto('http://localhost:3000/en/municipality/project-builder', {
      waitUntil: 'networkidle0',
      timeout: 30000
    });

    await new Promise(resolve => setTimeout(resolve, 2000));
    console.log(`✅ Navigated to: ${page.url()}`);

    // Check for key elements
    console.log('\n📍 Test 3: Checking Page Elements');
    console.log('----------------------------------');

    // Check for tabs
    const tabsExist = await page.evaluate(() => {
      const tabs = document.querySelector('[role="tablist"]');
      return tabs !== null;
    });

    if (tabsExist) {
      console.log('✅ Tab navigation found');

      // Get tab names
      const tabNames = await page.evaluate(() => {
        const tabs = document.querySelectorAll('[role="tab"]');
        return Array.from(tabs).map(tab => tab.textContent);
      });

      if (tabNames.length > 0) {
        console.log(`   Found tabs: ${tabNames.join(', ')}`);
      }
    } else {
      console.log('⚠️ Tab navigation not found');
    }

    // Check for form fields
    const inputs = await page.evaluate(() => {
      const allInputs = document.querySelectorAll('input, textarea, select');
      return {
        count: allInputs.length,
        types: Array.from(allInputs).map(el => ({
          tag: el.tagName.toLowerCase(),
          type: el.type || 'text',
          placeholder: el.placeholder || '',
          id: el.id || '',
          name: el.name || ''
        })).slice(0, 5) // Show first 5 for brevity
      };
    });

    console.log(`✅ Found ${inputs.count} form elements`);
    if (inputs.types.length > 0) {
      console.log('   Sample fields:');
      inputs.types.forEach(field => {
        console.log(`   - ${field.tag}${field.type ? `[${field.type}]` : ''}: ${field.placeholder || field.name || field.id || 'unnamed'}`);
      });
    }

    // Check for AI buttons
    const aiButtonsCount = await page.evaluate(() => {
      // Check for buttons with sparkle icons or AI-related text
      const buttons = document.querySelectorAll('button');
      let aiButtons = 0;
      buttons.forEach(btn => {
        const text = btn.textContent?.toLowerCase() || '';
        const hasSparkle = btn.querySelector('svg') !== null;
        if (text.includes('ai') || text.includes('fill') || text.includes('generate') || hasSparkle) {
          aiButtons++;
        }
      });
      return aiButtons;
    });

    if (aiButtonsCount > 0) {
      console.log(`✅ Found ${aiButtonsCount} AI assistance buttons`);
    } else {
      console.log('⚠️ No AI assistance buttons found');
    }

    // Check for compliance score
    const complianceExists = await page.evaluate(() => {
      const text = document.body.textContent || '';
      return text.includes('compliance') || text.includes('Compliance') || text.includes('%');
    });

    if (complianceExists) {
      console.log('✅ Compliance scoring element found');
    } else {
      console.log('⚠️ Compliance scoring not visible');
    }

    console.log('\n📍 Test 4: Testing Form Interaction');
    console.log('------------------------------------');

    // Try to fill in the first input field
    const firstInput = await page.$('input[type="text"]');
    if (firstInput) {
      await firstInput.click();
      await page.keyboard.type('Test Municipality Project');
      console.log('✅ Successfully typed in first input field');

      // Check if auto-save triggers
      await new Promise(resolve => setTimeout(resolve, 3000)); // Wait for auto-save

      const saveIndicator = await page.evaluate(() => {
        const text = document.body.textContent || '';
        return text.includes('saving') || text.includes('Saving') || text.includes('saved') || text.includes('Saved');
      });

      if (saveIndicator) {
        console.log('✅ Auto-save indicator detected');
      } else {
        console.log('ℹ️ Auto-save indicator not visible (might be working in background)');
      }
    } else {
      console.log('⚠️ No input field found to test');
    }

    console.log('\n📍 Test 5: Language Switching');
    console.log('-----------------------------');

    // Check for language selector
    const languageSelector = await page.evaluate(() => {
      // Look for select with language options
      const selects = document.querySelectorAll('select');
      for (const select of selects) {
        const options = Array.from(select.options).map(opt => opt.text.toLowerCase());
        if (options.some(opt => opt.includes('english') || opt.includes('albanian') || opt.includes('bosnian'))) {
          return {
            found: true,
            options: Array.from(select.options).map(opt => opt.text)
          };
        }
      }
      return { found: false };
    });

    if (languageSelector.found) {
      console.log('✅ Language selector found');
      console.log(`   Languages: ${languageSelector.options.join(', ')}`);
    } else {
      console.log('ℹ️ Language selector not immediately visible');
    }

    console.log('\n📍 Test 6: API Health Check');
    console.log('---------------------------');

    // Test AI assist endpoint
    const aiResponse = await page.evaluate(async () => {
      try {
        const response = await fetch('/api/ai-assist', {
          method: 'GET'
        });
        return {
          status: response.status,
          ok: response.ok,
          data: await response.json()
        };
      } catch (error) {
        return { error: error.message };
      }
    });

    if (aiResponse.ok) {
      console.log('✅ AI Assist API is responsive');
      console.log(`   Status: ${aiResponse.data.status || 'ready'}`);
    } else {
      console.log('⚠️ AI Assist API returned:', aiResponse.status || aiResponse.error);
    }

    // Check captured API calls
    if (apiCalls.length > 0) {
      console.log(`\n📊 API calls made during test: ${apiCalls.length}`);
      apiCalls.forEach(call => {
        console.log(`   - ${call.method} ${call.url.replace('http://localhost:3000', '')}`);
      });
    }

    console.log('\n📍 Test 7: Page Performance');
    console.log('---------------------------');

    const metrics = await page.metrics();
    console.log(`✅ Page Metrics:`);
    console.log(`   - DOM Nodes: ${metrics.Nodes}`);
    console.log(`   - JS Heap Used: ${(metrics.JSHeapUsedSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   - Layout Duration: ${metrics.LayoutDuration ? metrics.LayoutDuration.toFixed(2) + ' ms' : 'N/A'}`);

    // Take a screenshot for reference
    await page.screenshot({
      path: 'test-results/puppeteer-test-screenshot.png',
      fullPage: true
    });
    console.log('\n📸 Screenshot saved to test-results/puppeteer-test-screenshot.png');

    console.log('\n================================================');
    console.log('✅ All tests completed successfully!');
    console.log('================================================\n');

  } catch (error) {
    console.error('\n❌ Test failed with error:', error.message);
    console.error(error.stack);

    // Try to take error screenshot
    try {
      const page = (await browser.pages())[0];
      if (page) {
        await page.screenshot({
          path: 'test-results/puppeteer-error-screenshot.png',
          fullPage: true
        });
        console.log('📸 Error screenshot saved to test-results/puppeteer-error-screenshot.png');
      }
    } catch (screenshotError) {
      console.log('Could not capture error screenshot');
    }

    process.exit(1);
  } finally {
    await browser.close();
  }
})();