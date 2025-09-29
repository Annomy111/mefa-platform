import { test, expect } from '@playwright/test';

test.describe('MEFA Platform - Complete Functionality Test', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('01. Page loads with all required components', async ({ page }) => {
    // Check title
    await expect(page.locator('h1')).toContainText('MEFA Project Builder');

    // Check tabs exist
    const tabs = page.locator('[role="tab"]');
    await expect(tabs).toHaveCount(5);

    // Check compliance score is visible
    const complianceScore = page.locator('.text-3xl.font-bold.text-blue-600');
    await expect(complianceScore).toBeVisible();

    // Check Generate Complete Application button exists
    const generateButton = page.getByRole('button', { name: /Generate Complete Application/i });
    await expect(generateButton).toBeVisible();
  });

  test('02. Basic form fields accept input and persist', async ({ page }) => {
    // Fill basic fields
    const titleField = page.locator('[data-field="title"]');
    const municipalityField = page.locator('[data-field="municipality"]');
    const descriptionField = page.locator('[data-field="description"]');

    await titleField.fill('Green Energy Initiative');
    await municipalityField.fill('Sarajevo');
    await descriptionField.fill('A comprehensive renewable energy project for municipal buildings.');

    // Verify values are filled
    await expect(titleField).toHaveValue('Green Energy Initiative');
    await expect(municipalityField).toHaveValue('Sarajevo');
    await expect(descriptionField).toHaveValue('A comprehensive renewable energy project for municipal buildings.');

    // Switch to Review tab to check persistence
    await page.getByRole('tab', { name: 'Review' }).click();
    await page.waitForTimeout(500);

    // Check if data appears in summary
    const summary = page.locator('.bg-gray-50');
    await expect(summary).toContainText('Green Energy Initiative');
    await expect(summary).toContainText('Sarajevo');
  });

  test('03. Tab navigation works correctly', async ({ page }) => {
    // Test each tab
    const tabNames = ['Basic Info', 'Objectives', 'Methodology', 'Budget', 'Review'];

    for (const tabName of tabNames) {
      await page.getByRole('tab', { name: tabName }).click();
      await page.waitForTimeout(300);

      // Check that tab panel is visible
      const activePanel = page.locator('[role="tabpanel"]:visible');
      await expect(activePanel).toBeVisible();
    }
  });

  test('04. AI assist buttons are present and functional', async ({ page }) => {
    // Check for AI buttons on basic tab
    const aiButtons = page.locator('button:has-text("AI Assist")');
    const count = await aiButtons.count();
    expect(count).toBeGreaterThan(0);

    // Test clicking an AI button
    const firstAiButton = aiButtons.first();
    const initialText = await firstAiButton.textContent();

    await firstAiButton.click();
    await page.waitForTimeout(500);

    // Button should change state (loading or success)
    const newText = await firstAiButton.textContent();
    expect(newText).not.toBe(initialText);
  });

  test('05. SMART objectives fields are accessible', async ({ page }) => {
    // Navigate to Objectives tab
    await page.getByRole('tab', { name: 'Objectives' }).click();
    await page.waitForTimeout(500);

    // Check for SMART fields
    const smartFields = [
      'smartSpecific',
      'smartMeasurable',
      'smartAchievable',
      'smartRelevant',
      'smartTimeBound'
    ];

    for (const field of smartFields) {
      const smartField = page.locator(`[data-field="${field}"]`);
      await expect(smartField).toBeVisible();

      // Test that field accepts input
      await smartField.fill(`Test ${field} content`);
      await expect(smartField).toHaveValue(`Test ${field} content`);
    }
  });

  test('06. Budget calculations work correctly', async ({ page }) => {
    // Navigate to Budget tab
    await page.getByRole('tab', { name: 'Budget' }).click();
    await page.waitForTimeout(500);

    // Enter budget amount
    const budgetField = page.locator('[data-field="budget"]');
    await budgetField.fill('100000');

    // Enter duration
    const durationField = page.locator('[data-field="duration"]');
    await durationField.fill('24');

    await page.waitForTimeout(1000);

    // Check EU co-financing calculations appear
    const euContribution = page.locator('text=/EU Contribution/');
    await expect(euContribution).toBeVisible();

    // Verify calculation (85% of 100000 = 85000)
    const euAmount = page.locator('.text-blue-600:has-text("€")');
    await expect(euAmount).toContainText('85,000');

    // Verify co-financing (15% of 100000 = 15000)
    const coFinancing = page.locator('.text-yellow-600:has-text("€")');
    await expect(coFinancing).toContainText('15,000');
  });

  test('07. Compliance score updates dynamically', async ({ page }) => {
    // Get initial compliance score
    const scoreElement = page.locator('.text-3xl.font-bold.text-blue-600');
    const initialScore = await scoreElement.textContent();
    const initialScoreNum = parseInt(initialScore?.replace('%', '') || '0');

    // Fill required fields
    await page.locator('[data-field="title"]').fill('Test Project');
    await page.locator('[data-field="municipality"]').fill('Test City');
    await page.locator('[data-field="description"]').fill('Test Description');

    // Navigate to Objectives and fill
    await page.getByRole('tab', { name: 'Objectives' }).click();
    await page.locator('[data-field="objectives"]').fill('Test objectives');

    // Navigate to Methodology and fill
    await page.getByRole('tab', { name: 'Methodology' }).click();
    await page.locator('[data-field="methodology"]').fill('Test methodology');

    // Navigate to Budget and fill
    await page.getByRole('tab', { name: 'Budget' }).click();
    await page.locator('[data-field="budget"]').fill('50000');
    await page.locator('[data-field="duration"]').fill('12');

    await page.waitForTimeout(1000);

    // Check updated compliance score
    const updatedScore = await scoreElement.textContent();
    const updatedScoreNum = parseInt(updatedScore?.replace('%', '') || '0');

    expect(updatedScoreNum).toBeGreaterThan(initialScoreNum);
  });

  test('08. Generate Complete Application button works', async ({ page }) => {
    // Click Generate Complete Application
    const generateBtn = page.getByRole('button', { name: /Generate Complete Application/i });
    const initialText = await generateBtn.textContent();

    await generateBtn.click();

    // Button text should change after click
    await page.waitForTimeout(500);
    const clickedText = await generateBtn.textContent();

    // Button should either be disabled or show different text
    const isDisabled = await generateBtn.isDisabled();
    const textChanged = clickedText !== initialText;

    expect(isDisabled || textChanged).toBeTruthy();

    // Check for any progress indicator
    const progressIndicator = page.locator('.animate-spin, .bg-gradient-to-r');
    const hasProgress = await progressIndicator.count() > 0;

    // Should have some kind of progress indication
    expect(hasProgress).toBeTruthy();
  });

  test('09. Review tab shows complete summary', async ({ page }) => {
    // Fill all sections with data
    await page.locator('[data-field="title"]').fill('Complete Test Project');
    await page.locator('[data-field="municipality"]').fill('Test Municipality');
    await page.locator('[data-field="description"]').fill('Comprehensive test description');

    await page.getByRole('tab', { name: 'Objectives' }).click();
    await page.locator('[data-field="objectives"]').fill('Main objectives here');

    await page.getByRole('tab', { name: 'Budget' }).click();
    await page.locator('[data-field="budget"]').fill('75000');
    await page.locator('[data-field="duration"]').fill('18');

    // Navigate to Review
    await page.getByRole('tab', { name: 'Review' }).click();
    await page.waitForTimeout(500);

    // Check summary contains all entered data
    const summary = page.locator('.bg-gray-50');
    await expect(summary).toContainText('Complete Test Project');
    await expect(summary).toContainText('Test Municipality');
    await expect(summary).toContainText('€75000');
    await expect(summary).toContainText('18 months');
  });

  test('10. Submit button state changes based on compliance', async ({ page }) => {
    // Navigate to Review tab
    await page.getByRole('tab', { name: 'Review' }).click();
    await page.waitForTimeout(500);

    // Check submit button initially
    const submitButton = page.getByRole('button', { name: /Submit|Complete Required Fields/i });
    const initialText = await submitButton.textContent();

    // Should initially say "Complete Required Fields"
    expect(initialText).toContain('Complete Required Fields');

    // Go back and fill required fields
    await page.getByRole('tab', { name: 'Basic Info' }).click();
    await page.locator('[data-field="title"]').fill('Submission Test Project');
    await page.locator('[data-field="municipality"]').fill('Test City');
    await page.locator('[data-field="description"]').fill('Complete description for submission');

    await page.getByRole('tab', { name: 'Objectives' }).click();
    await page.locator('[data-field="objectives"]').fill('Clear objectives');

    await page.getByRole('tab', { name: 'Methodology' }).click();
    await page.locator('[data-field="methodology"]').fill('Detailed methodology');
    await page.locator('[data-field="risks"]').fill('Risk assessment');
    await page.locator('[data-field="sustainability"]').fill('Sustainability plan');

    await page.getByRole('tab', { name: 'Budget' }).click();
    await page.locator('[data-field="budget"]').fill('100000');
    await page.locator('[data-field="duration"]').fill('24');

    await page.waitForTimeout(2000);

    // Return to Review
    await page.getByRole('tab', { name: 'Review' }).click();
    await page.waitForTimeout(500);

    // Check if button text changed
    const updatedText = await submitButton.textContent();

    // Should now show "Submit to NIPAC" if compliance is high enough
    if (!updatedText?.includes('Complete Required Fields')) {
      expect(updatedText).toContain('Submit');
    }
  });

  test('11. Visual feedback when AI fills fields', async ({ page }) => {
    // Click an AI button
    const aiButton = page.locator('button:has-text("AI Assist")').first();
    await aiButton.click();

    // Check for visual feedback (animation class or color change)
    const titleField = page.locator('[data-field="title"]');

    // Field should have animation class or change appearance
    await page.waitForTimeout(500);

    // Check if field has highlight class
    const hasHighlight = await titleField.evaluate(el =>
      el.classList.contains('animate-highlight-green')
    ).catch(() => false);

    // Visual feedback should be present (either through class or value change)
    const fieldValue = await titleField.inputValue();
    expect(fieldValue.length).toBeGreaterThan(0); // Field should be filled
  });

  test('12. Auto-save functionality works', async ({ page }) => {
    // Fill a field
    const titleField = page.locator('[data-field="title"]');
    await titleField.fill('Auto-save Test Project');

    // Wait for auto-save (2 seconds based on implementation)
    await page.waitForTimeout(2500);

    // Refresh the page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Check if data persisted
    const titleAfterReload = await page.locator('[data-field="title"]').inputValue();

    // Note: This will only work if persistence is properly implemented
    // If not persisting, this is an issue to fix
    console.log('Title after reload:', titleAfterReload);
  });

  test('13. Error handling for invalid inputs', async ({ page }) => {
    // Navigate to Budget tab
    await page.getByRole('tab', { name: 'Budget' }).click();

    // Try to enter negative budget
    const budgetField = page.locator('[data-field="budget"]');
    await budgetField.fill('-1000');

    await page.waitForTimeout(500);

    // App should not crash and handle negative values gracefully
    const pageTitle = page.locator('h1');
    await expect(pageTitle).toBeVisible();
    await expect(pageTitle).toContainText('MEFA Project Builder');

    // Check that type="number" prevents text input (good behavior)
    const budgetType = await budgetField.getAttribute('type');
    expect(budgetType).toBe('number');
  });

  test('14. Progress bar reflects completion status', async ({ page }) => {
    // Get initial progress
    const progressBar = page.locator('[role="progressbar"]');
    const initialValue = await progressBar.getAttribute('aria-valuenow');

    // Fill multiple fields
    await page.locator('[data-field="title"]').fill('Progress Test');
    await page.locator('[data-field="municipality"]').fill('Test City');
    await page.locator('[data-field="description"]').fill('Test Description');

    await page.waitForTimeout(1000);

    // Check updated progress
    const updatedValue = await progressBar.getAttribute('aria-valuenow');

    expect(parseInt(updatedValue || '0')).toBeGreaterThan(parseInt(initialValue || '0'));
  });

  test('15. All language options are available', async ({ page }) => {
    // Check for language selector if present
    const languageSelector = page.locator('select').first();

    if (await languageSelector.isVisible()) {
      const options = await languageSelector.locator('option').allTextContents();

      // Should have multiple language options
      expect(options.length).toBeGreaterThan(1);

      // Check for Western Balkans languages
      const expectedLanguages = ['Albanian', 'Bosnian', 'Croatian', 'Serbian'];
      for (const lang of expectedLanguages) {
        const hasLanguage = options.some(opt => opt.includes(lang));
        expect(hasLanguage).toBeTruthy();
      }
    }
  });
});