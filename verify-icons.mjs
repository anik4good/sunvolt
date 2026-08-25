import { chromium } from "playwright-core";
const browser = await chromium.launch({
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: true,
});
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

// Homepage: DC mode icons
await page.goto("http://localhost:3111/", { waitUntil: "networkidle", timeout: 30000 }).catch(() => {});
await page.waitForTimeout(1000);
await page.getByRole("button", { name: /DC সিস্টেম/ }).click();
await page.waitForTimeout(500);
let icons = await page.evaluate(() =>
  Array.from(document.querySelectorAll("svg.lucide-fan, svg.lucide-lightbulb")).map((s) => s.getAttribute("class"))
);
console.log("homepage DC — lucide fan/bulb count:", icons.length);

// Switch to AC: same icons
await page.getByRole("button", { name: "⚡ AC", exact: false }).first().click();
await page.waitForTimeout(500);
icons = await page.evaluate(() =>
  Array.from(document.querySelectorAll("svg.lucide-fan, svg.lucide-lightbulb")).length
);
const emojis = await page.evaluate(() =>
  Array.from(document.querySelectorAll("div.rounded-2xl")).some((d) => d.textContent.includes("💡") && d.querySelector("svg"))
);
console.log("homepage AC — lucide fan/bulb count:", icons);

// Main calculator
await page.goto("http://localhost:3111/calculator", { waitUntil: "networkidle" }).catch(() => {});
await page.waitForTimeout(1000);
await page.getByRole("button", { name: /DC সিস্টেম/ }).click();
await page.waitForTimeout(500);
const calcIcons = await page.evaluate(() =>
  Array.from(document.querySelectorAll("main svg.lucide-fan, main svg.lucide-lightbulb")).length
);
console.log("calculator DC — lucide fan/bulb count:", calcIcons);
await page.screenshot({ path: "/tmp/icons.png" });
await browser.close();
