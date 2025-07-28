import { test, expect } from "@playwright/test";

test.describe("Google Maps Hook Test App", () => {
  test("should load the page successfully", async ({ page }) => {
    // Navigate to the test app
    await page.goto("/");

    // Wait for the page to load
    await page.waitForLoadState("networkidle");

    // Check that the page title is present
    await expect(page).toHaveTitle(/Vite \+ React \+ TS/);

    // Verify that the main div container is present
    const mapContainer = page.getByTestId("jabraf-test-map-container");
    await expect(mapContainer).toBeVisible();

    // Check that the page doesn't have any console errors
    const consoleMessages: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleMessages.push(msg.text());
      }
    });

    // Wait a bit to catch any console errors
    await page.waitForTimeout(2000);

    // Assert no console errors (except for expected Google Maps API key warnings)
    const relevantErrors = consoleMessages.filter(
      (msg) =>
        !msg.includes("Google Maps") &&
        !msg.includes("API key") &&
        !msg.includes("InvalidKeyMapError")
    );

    expect(relevantErrors).toHaveLength(0);
  });

  test("should render the Google Maps container with correct styling", async ({
    page,
  }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Check that the map container has the expected styling
    const mapContainer = page.getByTestId("jabraf-test-map-container");

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
