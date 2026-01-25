import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:8080';

test.describe('Stage 1: Foundations', () => {
  test('home page loads without errors', async ({ page }) => {
    // Capture console errors
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    page.on('pageerror', err => {
      errors.push(err.message);
    });

    await page.goto(BASE_URL);

    // Wait for the page to load
    await page.waitForTimeout(1000);

    // Log any errors found
    if (errors.length > 0) {
      console.log('Console errors found:', errors);
    }

    // Check for main content
    const mainContent = await page.locator('#main-content');
    await expect(mainContent).toBeVisible();

    // Check that there are no errors
    expect(errors).toHaveLength(0);
  });

  test('home page shows stage cards', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForTimeout(500);

    // Check for logo (use first() since there may be multiple)
    await expect(page.locator('.home__logo, .header__logo').first()).toBeVisible();

    // Check for stage cards
    const stageCards = page.locator('.stage-card');
    await expect(stageCards).toHaveCount(4);
  });

  test('can navigate to foundations', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForTimeout(500);

    // Click on Foundations stage card or button
    await page.click('text=Foundations');
    await page.waitForTimeout(500);

    // Should be on foundations page
    await expect(page).toHaveURL(/#\/foundations/);
  });

  test('foundations page shows modules', async ({ page }) => {
    await page.goto(BASE_URL + '/#/foundations');
    await page.waitForTimeout(500);

    // Check for module cards
    const moduleCards = page.locator('.module-card');
    await expect(moduleCards).toHaveCount(4);
  });

  test('can access hand strength module', async ({ page }) => {
    await page.goto(BASE_URL + '/#/module/hand-strength');
    await page.waitForTimeout(500);

    // Should show the module content (use page header title for specificity)
    await expect(page.locator('.page-header__title')).toBeVisible();
  });

  test('hand strength module quiz works', async ({ page }) => {
    await page.goto(BASE_URL + '/#/module/hand-strength');
    await page.waitForTimeout(500);

    // Find and click start quiz button
    const startButton = page.locator('text=Start Quiz, button:has-text("Start")').first();
    if (await startButton.isVisible()) {
      await startButton.click();
      await page.waitForTimeout(500);
    }
  });
});

test.describe('Stage 2: Drills', () => {
  test('drills page loads', async ({ page }) => {
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    page.on('pageerror', err => {
      errors.push(err.message);
    });

    await page.goto(BASE_URL + '/#/drills');
    await page.waitForTimeout(1000);

    if (errors.length > 0) {
      console.log('Drills page errors:', errors);
    }

    // Check if drills hub loads or shows locked message
    const content = await page.locator('#main-content').textContent();
    console.log('Drills page content:', content?.substring(0, 200));
  });

  test('hand ranking drill loads', async ({ page }) => {
    const errors = [];
    page.on('pageerror', err => {
      errors.push(err.message);
    });

    await page.goto(BASE_URL + '/#/drill/hand-ranking');
    await page.waitForTimeout(1000);

    if (errors.length > 0) {
      console.log('Hand ranking drill errors:', errors);
    }
  });
});

test.describe('Debug: Find all errors', () => {
  test('check home page for JS errors', async ({ page }) => {
    const errors = [];
    const warnings = [];

    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(`Console error: ${msg.text()}`);
      }
    });

    page.on('pageerror', err => {
      errors.push(`Page error: ${err.message}\n${err.stack}`);
    });

    // Check for failed network requests
    page.on('requestfailed', request => {
      errors.push(`Failed request: ${request.url()} - ${request.failure()?.errorText}`);
    });

    await page.goto(BASE_URL);
    await page.waitForTimeout(2000);

    // Print all errors
    console.log('\n=== ERRORS FOUND ===');
    errors.forEach((err, i) => {
      console.log(`${i + 1}. ${err}`);
    });
    console.log('===================\n');

    // Take screenshot
    await page.screenshot({ path: 'tests/home-page.png', fullPage: true });

    if (errors.length > 0) {
      throw new Error(`Found ${errors.length} errors:\n${errors.join('\n')}`);
    }
  });
});
