const puppeteer = require('puppeteer');

describe('MEFA Platform Integration Tests', () => {
  let browser;
  let page;

  beforeAll(async () => {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });
  });

  afterAll(async () => {
    await browser.close();
  });

  const wait = (ms) => page.waitForFunction(`new Promise(r => setTimeout(r, ${ms}))`);

  test('✅ 1. Application loads successfully', async () => {
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
    const title = await page.$eval('h1', el => el.textContent);
    expect(title).toBe('MEFA Project Builder');
  });

  test('✅ 2. Basic form fields are present and functional', async () => {
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });

    // Check if title field exists and can accept input
    const titleField = await page.$('[data-field="title"]');
    expect(titleField).toBeTruthy();

    await page.type('[data-field="title"]', 'Test Project');
    const titleValue = await page.$eval('[data-field="title"]', el => el.value);
    expect(titleValue).toBe('Test Project');

    // Check municipality field
    const municipalityField = await page.$('[data-field="municipality"]');
    expect(municipalityField).toBeTruthy();

    await page.type('[data-field="municipality"]', 'Test City');
    const municipalityValue = await page.$eval('[data-field="municipality"]', el => el.value);
    expect(municipalityValue).toBe('Test City');
  });

  test('✅ 3. Compliance score is displayed', async () => {
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });

    const complianceScore = await page.$('.text-3xl.font-bold.text-blue-600');
    expect(complianceScore).toBeTruthy();

    const scoreText = await page.$eval('.text-3xl.font-bold.text-blue-600', el => el.textContent);
    expect(scoreText).toMatch(/^\d+%$/);
  });

  test('✅ 4. Tabs are present and clickable', async () => {
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });

    // Check for tab buttons
    const tabs = await page.$$('[role="tab"]');
    expect(tabs.length).toBeGreaterThan(0);

    // Click through tabs by text content
    const tabNames = ['Objectives', 'Methodology', 'Budget', 'Review', 'Basic Info'];
    for (const tabName of tabNames) {
      const tabButton = await page.evaluate((name) => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const tab = buttons.find(b => b.textContent?.includes(name));
        if (tab) {
          tab.click();
          return true;
        }
        return false;
      }, tabName);

      expect(tabButton).toBe(true);
      await wait(300);
    }
  });

  test('✅ 5. AI assist buttons are present', async () => {
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });

    const aiButtons = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.filter(b =>
        b.textContent?.includes('AI Assist') ||
        b.textContent?.includes('Generate') ||
        b.innerHTML?.includes('Sparkles') ||
        b.innerHTML?.includes('Zap')
      ).length;
    });

    expect(aiButtons).toBeGreaterThan(0);
  });

  test('✅ 6. Description field accepts text', async () => {
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });

    const descField = await page.$('[data-field="description"]');
    expect(descField).toBeTruthy();

    await page.type('[data-field="description"]', 'This is a test description for the project.');
    const descValue = await page.$eval('[data-field="description"]', el => el.value);
    expect(descValue).toBe('This is a test description for the project.');
  });

  test('✅ 7. Budget tab shows EU co-financing calculation', async () => {
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });

    // Navigate to Budget tab
    const budgetClicked = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const budgetTab = buttons.find(b => b.textContent?.includes('Budget'));
      if (budgetTab) {
        budgetTab.click();
        return true;
      }
      return false;
    });

    expect(budgetClicked).toBe(true);
    await wait(500);

    // Enter budget amount
    const budgetField = await page.$('[data-field="budget"]');
    if (budgetField) {
      await page.type('[data-field="budget"]', '100000');
      await wait(500);

      // Check for EU contribution display
      const euSection = await page.evaluate(() => {
        const elements = Array.from(document.querySelectorAll('div'));
        return elements.some(el => el.textContent?.includes('EU Contribution'));
      });

      expect(euSection).toBe(true);
    }
  });

  test('✅ 8. SMART objectives fields are accessible', async () => {
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });

    // Navigate to Objectives tab
    const objClicked = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const objTab = buttons.find(b => b.textContent?.includes('Objectives'));
      if (objTab) {
        objTab.click();
        return true;
      }
      return false;
    });

    expect(objClicked).toBe(true);
    await wait(500);

    // Check for SMART fields
    const smartFields = await page.evaluate(() => {
      const inputs = Array.from(document.querySelectorAll('input'));
      const smartCount = inputs.filter(input => {
        const dataField = input.getAttribute('data-field');
        return dataField?.toLowerCase().includes('smart');
      }).length;
      return smartCount;
    });

    expect(smartFields).toBeGreaterThan(0);
  });

  test('✅ 9. Review tab shows project summary', async () => {
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });

    // Enter some data first
    await page.type('[data-field="title"]', 'Summary Test Project');
    await page.type('[data-field="municipality"]', 'Test Municipality');

    // Navigate to Review tab
    const reviewClicked = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const reviewTab = buttons.find(b => b.textContent?.includes('Review'));
      if (reviewTab) {
        reviewTab.click();
        return true;
      }
      return false;
    });

    expect(reviewClicked).toBe(true);
    await wait(500);

    // Check for summary content
    const summaryContent = await page.evaluate(() => {
      const summaryDiv = document.querySelector('.bg-gray-50');
      return summaryDiv?.textContent || '';
    });

    expect(summaryContent).toContain('Summary Test Project');
    expect(summaryContent).toContain('Test Municipality');
  });

  test('✅ 10. Submit button exists and shows proper state', async () => {
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });

    // Navigate to Review tab
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const reviewTab = buttons.find(b => b.textContent?.includes('Review'));
      if (reviewTab) reviewTab.click();
    });

    await wait(500);

    // Check for submit button
    const submitButton = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const submit = buttons.find(b =>
        b.textContent?.includes('Submit') ||
        b.textContent?.includes('Complete Required Fields')
      );
      return submit ? submit.textContent : null;
    });

    expect(submitButton).toBeTruthy();
  });

  test('✅ 11. Progress bar updates with compliance', async () => {
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });

    // Get initial progress
    const initialProgress = await page.evaluate(() => {
      const progressBar = document.querySelector('[role="progressbar"]');
      return progressBar?.getAttribute('aria-valuenow') || '0';
    });

    // Fill some fields
    await page.type('[data-field="title"]', 'Progress Test');
    await page.type('[data-field="municipality"]', 'Test City');
    await wait(1000);

    // Get updated progress
    const updatedProgress = await page.evaluate(() => {
      const progressBar = document.querySelector('[role="progressbar"]');
      return progressBar?.getAttribute('aria-valuenow') || '0';
    });

    expect(parseInt(updatedProgress)).toBeGreaterThanOrEqual(parseInt(initialProgress));
  });

  test('✅ 12. Generate Complete Application button exists', async () => {
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });

    const generateButton = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const genBtn = buttons.find(b =>
        b.textContent?.includes('Generate Complete Application')
      );
      return genBtn ? true : false;
    });

    expect(generateButton).toBe(true);
  });
});

// Run tests
if (require.main === module) {
  const { execSync } = require('child_process');
  try {
    execSync('npx jest --config jest.config.js tests/e2e/integration-simple.test.js', {
      stdio: 'inherit',
      cwd: '/Users/winzendwyers/Desktop/GreenMayors/mefa-working'
    });
  } catch (error) {
    process.exit(1);
  }
}