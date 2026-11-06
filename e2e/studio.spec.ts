import path from "node:path";
import { expect, test } from "@playwright/test";

const shots = path.join("/opt/cursor/artifacts");

test("home, guided flow, vocal single, and health", async ({ page }, info) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Write a song." })).toBeVisible();
  await expect(page.getByTestId("start-song")).toBeVisible();
  await page.screenshot({ path: path.join(shots, `${info.project.name}-home.png`), fullPage: true });

  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");
  await expect(page.getByTestId("start-song")).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("heading", { name: "What is it about?" })).toBeVisible();
  await page.getByLabel("Your sentence").fill("A night-shift nurse locks the clinic and sits in the parking lot.");
  await page.getByRole("button", { name: "Single · 1" }).click();
  await page.getByRole("button", { name: "With words" }).click();
  await page.screenshot({ path: path.join(shots, `${info.project.name}-guided.png`), fullPage: true });
  await page.getByRole("button", { name: "Next" }).click();
  await expect(page.getByRole("heading", { name: "Who is on it?" })).toBeVisible();
  await page.getByRole("button", { name: "Next" }).click();
  await expect(page.getByText("DEMO sample output")).toBeVisible();
  await page.getByRole("button", { name: "Write the song" }).click();
  await expect(page.getByRole("link", { name: /Open song 1/ })).toBeVisible();
  await page.getByRole("link", { name: /Open song 1/ }).click();
  await expect(page.getByTestId("lyrics")).toContainText("night-shift nurse");
  await expect(page.getByTestId("prompt")).toContainText("Natural human vocal with real breaths");
  await expect(page.getByTestId("prompt")).toContainText("never the same generic voice as every other song.");
  await page.screenshot({ path: path.join(shots, `${info.project.name}-track.png`), fullPage: true });

  const health = await page.request.get("/api/health");
  const body = await health.json();
  expect(body.generation.publicMode).toBe("demo");
  expect(body.audioGeneration).toBe(false);
  expect(body.generation.verifiedLive).toBe(false);
});

test("instrumental single stays blank", async ({ page }) => {
  test.skip(test.info().project.name !== "desktop", "desktop covers the instrumental path");
  await page.goto("/start");
  await page.getByLabel("Your sentence").fill("The block party grill runs out of chicken at sunset.");
  await page.getByRole("button", { name: "Instrumental only" }).click();
  await page.getByRole("button", { name: "Next" }).click();
  await page.getByRole("button", { name: "Next" }).click();
  await page.getByRole("button", { name: "Write the song" }).click();
  await page.getByRole("link", { name: /Open song 1/ }).click();
  await expect(page.getByTestId("lyrics")).toContainText("Lyrics are empty");
  await expect(page.getByTestId("prompt")).not.toContainText("Natural human vocal");
});

test("six-track EP shows every song after writing", async ({ page }) => {
  test.skip(test.info().project.name !== "desktop", "desktop covers the EP path");
  await page.goto("/start");
  await page.getByLabel("Your sentence").fill("A father counts the rent twice while the kids finish cereal.");
  await page.getByRole("button", { name: "EP · 6" }).click();
  await page.getByRole("button", { name: "Next" }).click();
  await page.getByRole("button", { name: "Next" }).click();
  await page.getByRole("button", { name: "Write the song" }).click();
  await expect(page.getByRole("link", { name: /Song 6:/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /Song 1:/ })).toBeVisible();
});
