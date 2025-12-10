#!/usr/bin/env node

import puppeteer from "puppeteer";

const browser = await puppeteer.connect({
  browserURL: "http://localhost:9222",
  defaultViewport: null,
});

const pages = await browser.pages();
const page = pages[0];

// Navigate to the client detail page
await page.goto("http://localhost:3000");
await page.waitForSelector("button");

// Click first Manage Quote button
await page.evaluate(() => {
  const buttons = Array.from(document.querySelectorAll("button"));
  const manageButton = buttons.find((b) =>
    b.textContent.includes("Manage Quote")
  );
  if (manageButton) manageButton.click();
});

await new Promise((resolve) => setTimeout(resolve, 2000));

// Count pending requests before
const beforeCount = await page.evaluate(() => {
  const badge = document.querySelector(".text-sm.font-medium");
  return badge?.textContent || "unknown";
});

console.log("Pending requests before cancel:", beforeCount);

// Set up dialog handler
page.on("dialog", async (dialog) => {
  console.log("Confirmation dialog appeared:", dialog.message());
  await dialog.accept();
});

// Click the first cancel button
await page.evaluate(() => {
  const buttons = Array.from(document.querySelectorAll("button"));
  const cancelButton = buttons.find((b) => b.title === "Cancel request");
  if (cancelButton) {
    cancelButton.click();
    return "Clicked";
  }
  return "Not found";
});

console.log("Clicked cancel button");

// Wait for the mutation to complete
await new Promise((resolve) => setTimeout(resolve, 2000));

// Count pending requests after
const afterCount = await page.evaluate(() => {
  const badge = document.querySelector(".text-sm.font-medium");
  return badge?.textContent || "unknown";
});

console.log("Pending requests after cancel:", afterCount);

// Take screenshot
await page.screenshot({
  path: "session31-after-cancel.png",
  fullPage: false,
});

console.log("Screenshot saved");

await browser.disconnect();
