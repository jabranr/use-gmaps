import { test, expect } from '@playwright/test';

test.describe('Google Maps Hook Test App', () => {
  test('should load the page successfully', async ({ page }) => {
    // Collect errors before navigating so load-time errors are not missed
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    page.on('pageerror', (err) => consoleErrors.push(err.message));

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // create-vite titles the page after the project name ('test-app' in setup-test-app.sh)
    await expect(page).toHaveTitle(/test-app/);

    const mapContainer = page.getByTestId('jabraf-test-map-container');
    await expect(mapContainer).toBeVisible();

    // The Maps API is loaded and the map is mounted into the container
    await expect
      .poll(() => page.evaluate(() => typeof window.google?.maps?.Map))
      .toBe('function');
    await expect(mapContainer.locator('div').first()).toBeAttached();

    // Ignore the expected errors from running without a real API key
    const relevantErrors = consoleErrors.filter(
      (msg) =>
        !msg.includes('Google Maps') &&
        !msg.includes('API key') &&
        !msg.includes('InvalidKeyMapError') &&
        !msg.includes('maps.googleapis.com')
    );

    expect(relevantErrors).toHaveLength(0);
  });

  test('should render the Google Maps container with correct styling', async ({
    page
  }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Check that the map container has the expected styling
    const mapContainer = page.getByTestId('jabraf-test-map-container');

    // Verify the container is visible
    await expect(mapContainer).toBeVisible();

    // Check the computed styles
    const containerBox = await mapContainer.boundingBox();
    expect(containerBox).toBeTruthy();

    // The container should take up the full viewport
    if (containerBox) {
      expect(containerBox.width).toBeGreaterThan(800); // Assuming reasonable viewport width
      expect(containerBox.height).toBeGreaterThan(600); // Assuming reasonable viewport height
    }
  });
});
