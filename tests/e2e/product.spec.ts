import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

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

  await expect(page.getByRole("link", { name: "Run analysis" })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Ship APIs. Keep trust." }),
  ).toBeVisible();
});

test("contract comparison remains usable at a mobile viewport", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/analyze");

  await expect(page.getByLabel("Baseline contract")).toBeVisible();
  await expect(page.getByLabel("Candidate contract")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Run analysis" }),
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

test("analysis endpoint compares real OpenAPI fixtures", async ({
  request,
}) => {
  const fixtureDirectory = resolve(
    process.cwd(),
    "tests",
    "fixtures",
    "openapi",
  );
  const response = await request.post("/api/analyze/preview", {
    data: {
      baseline: readFileSync(
        resolve(fixtureDirectory, "payments-v1.yaml"),
        "utf8",
      ),
      candidate: readFileSync(
        resolve(fixtureDirectory, "payments-v2.yaml"),
        "utf8",
      ),
    },
  });

  expect(response.ok()).toBe(true);
  await expect(response.json()).resolves.toMatchObject({
    data: {
      compatible: false,
      summary: { breaking: 7, dangerous: 2, safe: 5 },
    },
  });
});

test("visitor persists and explores an interactive release analysis", async ({
  page,
}) => {
  await page.goto("/analyze");

  await expect(
    page.getByRole("heading", {
      name: "See the blast radius before your customers do.",
    }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Run analysis" }).click();

  await expect(page).toHaveURL(/\/releases\/release_[a-f0-9]{24}$/);
  await expect(
    page.getByRole("heading", { name: "1.4.0 → 2.0.0" }),
  ).toBeVisible();
  await expect(page.getByText("reload-safe PostgreSQL record")).toBeVisible();

  await page.reload();
  await page.getByRole("button", { name: "dangerous 2" }).click();
  await expect(page.getByText("2 shown")).toBeVisible();
  await page.getByRole("button", { name: /Enum values added/ }).click();
  await expect(
    page.getByText("customer-portal", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("support-console", { exact: true }),
  ).toBeVisible();
});
