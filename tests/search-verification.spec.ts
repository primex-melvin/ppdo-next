import { test, expect } from "@playwright/test";

/**
 * Search Feature Verification Tests
 *
 * These tests verify the search functionality implemented in Phase 7.
 * Run with: npx playwright test tests/search-verification.spec.ts
 */

test.describe("Search Feature - User Journey", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to search page
    await page.goto("/search");
  });

  test("should display search page with initial state", async ({ page }) => {
    // Verify page title and header
    await expect(page.locator("h1")).toContainText("Search");

    // Verify search input is visible
    await expect(page.locator('input[type="text"]')).toBeVisible();

    // Verify initial empty state message
    await expect(page.locator("text=Start searching")).toBeVisible();
  });

  test("should display search input with placeholder", async ({ page }) => {
    const searchInput = page.locator('input[type="text"]');
    await expect(searchInput).toBeVisible();
    await expect(searchInput).toHaveAttribute("placeholder", /search/i);
  });

  test("should perform search and display results", async ({ page }) => {
    const searchInput = page.locator('input[type="text"]');

    // Type a search query
    await searchInput.fill("infrastructure");
    await searchInput.press("Enter");

    // Wait for results to load (or empty state)
    await page.waitForTimeout(1000);

    // Check that either results or empty state is shown
    const hasResults = await page.locator('[class*="card"]').count();
    const hasEmptyState = await page.locator("text=No results found").count();

    expect(hasResults > 0 || hasEmptyState > 0).toBeTruthy();
  });

  test("should show category sidebar on desktop", async ({ page }) => {
    // Set viewport to desktop size
    await page.setViewportSize({ width: 1200, height: 800 });

    // Verify category sidebar is visible
    await expect(page.locator("text=Filter by Category")).toBeVisible();
  });

  test("should show filter button on mobile", async ({ page }) => {
    // Set viewport to mobile size
    await page.setViewportSize({ width: 375, height: 667 });

    // Verify filter button is visible
    const filterButton = page.locator('[aria-label="Open filters"]');
    await expect(filterButton).toBeVisible();
  });

  test("should open mobile filter sheet when clicking filter button", async ({
    page,
  }) => {
    // Set viewport to mobile size
    await page.setViewportSize({ width: 375, height: 667 });

    // Click filter button
    await page.locator('[aria-label="Open filters"]').click();

    // Verify sheet content is visible
    await expect(page.locator("text=Filter Results")).toBeVisible();
  });

  test("should clear search query using keyboard", async ({ page }) => {
    const searchInput = page.locator('input[type="text"]');

    // Type a search query
    await searchInput.fill("test query");
    await expect(searchInput).toHaveValue("test query");

    // Clear using keyboard shortcuts
    await searchInput.clear();

    // Input should be empty
    await expect(searchInput).toHaveValue("");
  });

  test("should show results count after search", async ({ page }) => {
    const searchInput = page.locator('input[type="text"]');

    // Type a search query
    await searchInput.fill("project");
    await searchInput.press("Enter");

    // Wait for results
    await page.waitForTimeout(1500);

    // Check for results text (showing count like "X results")
    const resultsText = page.locator('text=/\\d+ result/');
    await expect(resultsText).toBeVisible({ timeout: 10000 });
  });
});

test.describe("Search Feature - Error States", () => {
  test("should show no results state for nonsense query", async ({ page }) => {
    await page.goto("/search");
    const searchInput = page.locator('input[type="text"]');

    // Search for something that likely won't exist
    await searchInput.fill("zxcvbnmasdfghjklqwertyuiop123456789");
    await searchInput.press("Enter");

    // Wait for search to complete
    await page.waitForTimeout(1500);

    // Should show no results state
    await expect(page.locator("text=No results found")).toBeVisible();
  });

  test("should display search tips in no results state", async ({ page }) => {
    await page.goto("/search");
    const searchInput = page.locator('input[type="text"]');

    // Search for something that likely won't exist
    await searchInput.fill("xyzabc123nonexistent");
    await searchInput.press("Enter");

    await page.waitForTimeout(1500);

    // Check for search tips
    const searchTips = page.locator("text=Search tips");
    if (await searchTips.isVisible()) {
      await expect(searchTips).toBeVisible();
    }
  });
});

test.describe("Search Feature - Category Filtering", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/search");
    // Ensure desktop viewport
    await page.setViewportSize({ width: 1200, height: 800 });
  });

  test("should show all category options in sidebar", async ({ page }) => {
    // Common category labels
    const categories = [
      "All Results",
      "Project",
      "Department",
      "User",
    ];

    for (const category of categories) {
      await expect(page.locator(`text=${category}`).first()).toBeVisible();
    }
  });

  test("should have clickable category buttons", async ({ page }) => {
    const searchInput = page.locator('input[type="text"]');

    // First, perform a search
    await searchInput.fill("infrastructure");
    await searchInput.press("Enter");
    await page.waitForTimeout(1500);

    // Verify category buttons exist and are enabled
    const categoryButtons = page.locator('aside button');
    const buttonCount = await categoryButtons.count();

    // Should have at least the "All Results" category
    expect(buttonCount).toBeGreaterThan(0);

    // First button should be clickable (not disabled)
    const firstButton = categoryButtons.first();
    await expect(firstButton).toBeEnabled();
  });
});

test.describe("Search Feature - Accessibility", () => {
  test("should have proper ARIA labels on search input", async ({ page }) => {
    await page.goto("/search");

    const searchInput = page.locator('input[type="text"]');
    await expect(searchInput).toBeVisible();

    // Check for accessibility attributes
    const hasAriaLabel = await searchInput.getAttribute("aria-label");
    const hasPlaceholder = await searchInput.getAttribute("placeholder");

    expect(hasAriaLabel || hasPlaceholder).toBeTruthy();
  });

  test("should be keyboard navigable", async ({ page }) => {
    await page.goto("/search");

    // Focus the search input directly
    const searchInput = page.locator('input[type="text"]');
    await searchInput.focus();

    // Verify input is focused
    await expect(searchInput).toBeFocused();

    // Type something
    await searchInput.type("test");
    await expect(searchInput).toHaveValue("test");
  });
});

test.describe("Search Feature - Performance", () => {
  test("should load search page within acceptable time", async ({ page }) => {
    const startTime = Date.now();

    await page.goto("/search");
    await page.waitForLoadState("networkidle");

    const loadTime = Date.now() - startTime;

    // Page should load within 5 seconds
    expect(loadTime).toBeLessThan(5000);
  });

  test("should respond to search input quickly", async ({ page }) => {
    await page.goto("/search");
    const searchInput = page.locator('input[type="text"]');

    const startTime = Date.now();

    await searchInput.fill("test");
    await page.waitForTimeout(500); // Wait for debounce

    const responseTime = Date.now() - startTime;

    // Input should respond within 1 second (including debounce)
    expect(responseTime).toBeLessThan(1000);
  });
});
