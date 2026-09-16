import { expect, test } from "@playwright/test";

test("visitor can understand the product and open the dashboard", async ({
  page,
}) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", { name: "Ship APIs. Keep trust." }),
  ).toBeVisible();
  await expect(
    page.getByText("Change intelligence for every API release"),
  ).toBeVisible();

  await page.getByRole("link", { name: "Explore the live analysis" }).click();

  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(
    page.getByRole("heading", { name: "Release intelligence" }),
  ).toBeVisible();
  await expect(page.getByText("Release gate blocked")).toBeVisible();
  await expect(
    page.getByText("currency is now required", { exact: true }),
  ).toBeVisible();
});

test("public experience is usable at a mobile viewport", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");

  await expect(page.getByRole("link", { name: "Live demo" })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Ship APIs. Keep trust." }),
  ).toBeVisible();
});

test("health endpoint proves PostgreSQL connectivity", async ({ request }) => {
  const response = await request.get("/api/health");

  expect(response.ok()).toBe(true);
  await expect(response.json()).resolves.toMatchObject({
    status: "ok",
    database: "connected",
  });
});
