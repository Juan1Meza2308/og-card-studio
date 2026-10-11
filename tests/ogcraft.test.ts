import { test, expect } from "@playwright/test";

test.describe("OG Craft - Landing Page", () => {
  test("should load the landing page without errors", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/OGCraft/);
  });

  test("should have proper SEO meta tags", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle("OGCraft — Dynamic OG Images via API");
  });
});

test.describe("OG Craft - Playground", () => {
  test("should load the playground page", async ({ page }) => {
    await page.goto("/playground");
    await expect(page.locator("h1")).toContainText("Craft your next social preview");
  });

  test("should have title input", async ({ page }) => {
    await page.goto("/playground");
    await expect(page.locator("#og-title")).toBeVisible();
  });

  test("should have subtitle input", async ({ page }) => {
    await page.goto("/playground");
    await expect(page.locator("#og-subtitle")).toBeVisible();
  });

  test("should have theme selector", async ({ page }) => {
    await page.goto("/playground");
    await expect(page.locator('[aria-label="Violet pulse"]')).toBeVisible();
  });

  test("should have template selector", async ({ page }) => {
    await page.goto("/playground");
    await expect(page.locator("#og-template")).toBeVisible();
  });

  test("should have built-in example presets", async ({ page }) => {
    await page.goto("/playground");
    await expect(page.locator("text=Launch Day")).toBeVisible();
    await expect(page.locator("text=Blog Post")).toBeVisible();
  });

  test("should show code snippets tabs", async ({ page }) => {
    await page.goto("/playground");
    await expect(page.locator('[role="tab"][aria-selected="true"]')).toHaveText("HTML");
  });
});

test.describe("OG Craft - OG Image API", () => {
  test("should generate OG image with valid params", async ({ page }) => {
    const response = await page.request.get("/v1/og?title=Test&theme=violet");
    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toBe("image/png");
  });

  test("should reject invalid template", async ({ page }) => {
    const response = await page.request.get("/v1/og?title=Test&template=invalid");
    expect(response.status()).toBe(400);
  });

  test("should return 405 for POST", async ({ page }) => {
    const response = await page.request.post("/v1/og", { data: { title: "Test" } });
    expect(response.status()).toBe(405);
  });

  test("should include rate limit headers", async ({ page }) => {
    const response = await page.request.get("/v1/og?title=Test");
    expect(response.headers()["x-ratelimit-limit"]).toBeDefined();
    expect(response.headers()["x-ratelimit-remaining"]).toBeDefined();
  });
});

test.describe("OG Craft - Health Endpoint", () => {
  test("should return health status", async ({ page }) => {
    const response = await page.request.get("/api/health");
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.service).toBe("ogcraft");
  });
});
