import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdir, readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { setTimeout as delay } from "node:timers/promises";
import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";

const port = process.env.PLAYWRIGHT_PORT || "3100";
const base = `http://127.0.0.1:${port}`;
const server = spawn(
  process.execPath,
  [
    "node_modules/next/dist/bin/next",
    "start",
    "--hostname",
    "127.0.0.1",
    "--port",
    port,
  ],
  { stdio: ["ignore", "pipe", "pipe"], windowsHide: true },
);
let serverLog = "";
server.stdout.on("data", (chunk) => {
  serverLog += chunk;
});
server.stderr.on("data", (chunk) => {
  serverLog += chunk;
});
let browser;
const errors = [];

try {
  await mkdir("output/playwright", { recursive: true });
  let ready = false;
  for (let attempt = 0; attempt < 60; attempt++) {
    if (server.exitCode !== null) throw new Error(serverLog);
    try {
      ready = (await fetch(base)).ok;
    } catch {
      /* The server may still be starting. */
    }
    if (ready) break;
    await delay(250);
  }
  assert(ready, `Production server did not start. ${serverLog}`);
  browser = await chromium.launch();
  const context = await browser.newContext({ reducedMotion: "reduce" });
  const page = await context.newPage();
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });

  for (const route of ["/", "/sobre"]) {
    for (const width of [320, 390, 768, 1280, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      const response = await page.goto(`${base}${route}`, {
        waitUntil: "networkidle",
      });
      assert.equal(response.status(), 200);
      assert.equal(await page.locator("h1").count(), 1);
      assert.equal(await page.locator("html").getAttribute("lang"), "pt-BR");
      assert(await page.locator("h1").isVisible());
      assert.equal(
        await page
          .locator(
            ".section-index, .eyebrow, .about-overline, .dial-tag, .dial-topline, .art-caption, .folder-tab",
          )
          .count(),
        0,
      );
      assert(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1,
        ),
        `${route} overflows at ${width}px`,
      );
      if (width === 390 || width === 1440) {
        const accessibility = await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
          .analyze();
        assert.deepEqual(
          accessibility.violations.map((v) => ({
            id: v.id,
            impact: v.impact,
            nodes: v.nodes.map((n) => ({
              target: n.target,
              summary: n.failureSummary,
            })),
          })),
          [],
          `Accessibility: ${route} at ${width}px`,
        );
        await page.screenshot({
          path: `output/playwright/${route === "/" ? "landing" : "about"}-${width}.png`,
          fullPage: true,
        });
      }
      console.log(
        `PASS ${route} at ${width}px: route, heading, reflow${width === 390 || width === 1440 ? ", axe" : ""}`,
      );
    }
  }

  await page.goto(base);
  await page
    .getByRole("button", { name: /04 Construção\s*: 12 minutos previstos/ })
    .click();
  assert.equal(
    await page.locator(".dial-description").textContent(),
    "Construção",
  );
  assert.match(await page.locator(".dial-value").textContent(), /12/);
  await page.keyboard.press("Enter");
  assert.equal(
    await page.locator(".dial-description").textContent(),
    "Prazo proposto",
  );
  await page.locator(".process-step summary").nth(2).click();
  assert.equal(await page.locator(".process-step[open]").count(), 1);
  assert(await page.getByText("Explore antes de aprovar.").isVisible());
  const faq = page.locator(".faq-item").first();
  await faq.locator("summary").focus();
  await page.keyboard.press("Enter");
  assert(await faq.locator("p").isVisible());
  await page.keyboard.press("Enter");
  assert.equal(await faq.locator("p").isVisible(), false);
  console.log("PASS dial and native accordions with keyboard");

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(base);
  await page.keyboard.press("Tab");
  assert.equal(
    await page.locator(":focus").textContent(),
    "Pular para o conteúdo",
  );
  const menu = page.getByRole("button", { name: "Abrir menu" });
  await menu.click();
  assert.equal(
    await page
      .getByRole("button", { name: "Fechar menu" })
      .getAttribute("aria-expanded"),
    "true",
  );
  await page.keyboard.press("Escape");
  assert.equal(await menu.getAttribute("aria-expanded"), "false");
  assert(await menu.evaluate((el) => document.activeElement === el));
  await menu.click();
  await page
    .getByRole("navigation", { name: "Navegação principal" })
    .getByRole("link", { name: "Sobre o KERNEL" })
    .click();
  await page.waitForURL(`${base}/sobre`);
  assert.match(await page.title(), /Sobre o projeto/);
  assert.equal(
    await page
      .getByRole("button", { name: "Abrir menu" })
      .getAttribute("aria-expanded"),
    "false",
  );
  await page.getByRole("button", { name: "Abrir menu" }).click();
  await page
    .getByRole("navigation", { name: "Navegação principal" })
    .getByRole("link", { name: "Como funciona" })
    .click();
  await page.waitForURL(`${base}/#como-funciona`);
  assert(await page.locator("#como-funciona").isVisible());
  console.log(
    "PASS mobile menu, Escape focus, skip link, route and anchor navigation",
  );

  assert.equal(
    await page.evaluate(
      () =>
        document
          .getAnimations()
          .filter((animation) => animation.playState === "running").length,
    ),
    0,
  );
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto(base);
  await page.waitForTimeout(2000);
  assert(await page.locator("h1").isVisible());
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.screenshot({ path: "output/playwright/landing-motion.png" });
  console.log("PASS reduced motion and regular entrance");

  // The original mark remains the source of truth at rest and without motion.
  const originalSvg = await readFile("assets/isotipo_vetorizado.svg", "utf8");
  const originalPath = originalSvg.match(/\bd="([^"]+)"/)[1];
  const normalizePath = (path) => path.trim().replace(/\s+/g, " ");
  await page.goto(`${base}/sobre`, { waitUntil: "networkidle" });
  const outline = page.locator(".kernel-outline");
  const drop = page.locator(".kernel-drop");
  const playback = page.locator(".mark-playback");
  await page.waitForFunction(
    () =>
      Number(document.querySelector(".kernel-drop").getAttribute("rx")) > 200,
  );
  await page.getByRole("button", { name: "Pausar animação" }).click();
  const pausedPath = await outline.getAttribute("d");
  const pausedTraveler = await page
    .locator(".kernel-traveler")
    .getAttribute("transform");
  assert.notEqual(normalizePath(pausedPath), normalizePath(originalPath));
  assert(Number(await drop.getAttribute("rx")) > 0);
  await page.waitForTimeout(250);
  assert.equal(
    await outline.getAttribute("d"),
    pausedPath,
    "Pause holds the SVG geometry",
  );
  await page.screenshot({ path: "output/playwright/about-motion-detach.png" });
  // An explicit pause must survive leaving the viewport and coming back.
  await page.evaluate(() => scrollTo({ top: 1400, behavior: "instant" }));
  await page.waitForTimeout(150);
  await page.evaluate(() => scrollTo({ top: 0, behavior: "instant" }));
  await page.waitForTimeout(150);
  assert.equal(
    await page.locator(".kernel-traveler").getAttribute("transform"),
    pausedTraveler,
  );
  await playback.focus();
  await page.keyboard.press("Enter");
  await page.waitForFunction(
    (original) =>
      document
        .querySelector(".kernel-outline")
        .getAttribute("d")
        .trim()
        .replace(/\s+/g, " ") === original &&
      document.querySelector(".kernel-surface").getAttribute("filter") ===
        "none",
    normalizePath(originalPath),
  );
  assert.equal(
    normalizePath(await outline.getAttribute("d")),
    normalizePath(originalPath),
  );
  assert.equal(Number(await drop.getAttribute("rx")), 0);
  assert.equal(
    await page.locator(".kernel-surface").getAttribute("filter"),
    "none",
  );

  // Cross the repeat boundary inside the rest interval. Exact vector geometry
  // must survive the wrap; raster comparison tolerates subpixel antialiasing.
  const scene = page.locator(".kernel-scene");
  const seamBefore = await scene.screenshot({
    path: "output/playwright/loop-seam-before.png",
  });
  await page.waitForTimeout(1400);
  const seamAfter = await scene.screenshot({
    path: "output/playwright/loop-seam-after.png",
  });
  assert.equal(
    normalizePath(await outline.getAttribute("d")),
    normalizePath(originalPath),
  );
  assert.equal(Number(await drop.getAttribute("rx")), 0);
  const seamDifference = await page.evaluate(
    async (frames) => {
      const pixels = await Promise.all(
        frames.map(async (frame) => {
          const bitmap = await createImageBitmap(
            await (await fetch(`data:image/png;base64,${frame}`)).blob(),
          );
          const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
          const context = canvas.getContext("2d");
          context.drawImage(bitmap, 0, 0);
          bitmap.close();
          return context.getImageData(0, 0, canvas.width, canvas.height).data;
        }),
      );
      let difference = 0;
      for (let i = 0; i < pixels[0].length; i++)
        difference += Math.abs(pixels[0][i] - pixels[1][i]);
      return difference / pixels[0].length;
    },
    [seamBefore.toString("base64"), seamAfter.toString("base64")],
  );
  assert(
    seamDifference < 0.02,
    `The loop has a visible seam: average channel difference ${seamDifference}`,
  );
  await page.waitForFunction(
    () =>
      Number(document.querySelector(".kernel-drop").getAttribute("rx")) > 200,
  );
  assert.notEqual(
    normalizePath(await outline.getAttribute("d")),
    normalizePath(originalPath),
    "The next cycle starts automatically",
  );
  await page.emulateMedia({ reducedMotion: "reduce" });
  await playback.waitFor({ state: "hidden" });
  assert.equal(
    normalizePath(await outline.getAttribute("d")),
    normalizePath(originalPath),
  );
  assert.equal(Number(await drop.getAttribute("rx")), 0);
  const reducedPath = await outline.getAttribute("d");
  await page.waitForTimeout(200);
  assert.equal(await outline.getAttribute("d"), reducedPath);

  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.getByRole("button", { name: "Pausar animação" }).waitFor();
  await page.waitForFunction(
    () =>
      Number(document.querySelector(".kernel-drop").getAttribute("rx")) > 200,
  );
  await page.evaluate(() => scrollTo({ top: 1400, behavior: "instant" }));
  await page.waitForTimeout(250);
  const suspendedPath = await page
    .locator(".kernel-traveler")
    .getAttribute("transform");
  await page.waitForTimeout(250);
  assert.equal(
    await page.locator(".kernel-traveler").getAttribute("transform"),
    suspendedPath,
    "Offscreen animation is suspended",
  );
  await page.evaluate(() => scrollTo({ top: 0, behavior: "instant" }));
  await page.setViewportSize({ width: 390, height: 844 });
  await playback.scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
  await page.getByRole("button", { name: "Pausar animação" }).click();
  await page.screenshot({ path: "output/playwright/about-motion-mobile.png" });
  assert(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
  );
  await page.emulateMedia({ reducedMotion: "reduce" });
  console.log(
    "PASS SVG loop, vector/raster seam continuity, persistent keyboard pause, offscreen suspension, mobile and live reduced-motion fallback",
  );

  for (const route of ["/", "/sobre"]) {
    await page.goto(`${base}${route}`);
    await page.locator("footer").scrollIntoViewIfNeeded();
    for (const img of await page.locator("img").all()) {
      await img.scrollIntoViewIfNeeded();
      await img.evaluate((el) => el.decode());
      assert(await img.evaluate((el) => el.naturalWidth > 0));
    }
  }
  assert.deepEqual(errors, [], "Browser errors on the public routes");

  const noScript = await browser.newContext({
    javaScriptEnabled: false,
    viewport: { width: 320, height: 800 },
  });
  const plain = await noScript.newPage();
  await plain.goto(base);
  assert(await plain.locator("h1").isVisible());
  await plain
    .getByRole("navigation", { name: "Navegação sem JavaScript" })
    .getByRole("link", { name: "Sobre o KERNEL" })
    .click();
  assert.match(plain.url(), /\/sobre$/);
  assert(await plain.locator("h1").isVisible());
  assert.equal(
    normalizePath(await plain.locator(".kernel-outline").getAttribute("d")),
    normalizePath(originalPath),
  );
  assert.equal(await plain.locator(".mark-playback").isVisible(), false);
  await noScript.close();
  console.log("PASS image loading and content/navigation without JavaScript");

  const noFonts = await browser.newContext({
    viewport: { width: 320, height: 800 },
  });
  await noFonts.route("**/*.woff2", (route) => route.abort());
  const fallback = await noFonts.newPage();
  for (const route of ["/", "/sobre"]) {
    await fallback.goto(`${base}${route}`);
    assert(await fallback.locator("h1").isVisible());
    assert(
      await fallback.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
      "Font fallback overflows",
    );
  }
  await noFonts.close();
  console.log("PASS font-failure fallback");

  for (const width of [320, 390, 768, 1280, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    const missing = await page.goto(`${base}/pagina-inexistente`);
    assert.equal(missing.status(), 404);
    assert.equal(await page.locator("h1").count(), 1);
    assert(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
    );
    if (width === 390 || width === 1440) {
      const audit = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
        .analyze();
      assert.deepEqual(audit.violations, [], `404 accessibility at ${width}px`);
      await page.screenshot({
        path: `output/playwright/404-${width}.png`,
        fullPage: true,
      });
    }
  }
  await page
    .locator(".error-actions")
    .getByRole("link", { name: "Sobre o KERNEL" })
    .click();
  await page.waitForURL(base + "/sobre");
  await page.goto(`${base}/pagina-inexistente`);
  await page.getByRole("link", { name: "Voltar ao início" }).click();
  await page.waitForURL(base + "/");
  const social = await fetch(`${base}/opengraph-image`);
  assert.equal(social.status, 200);
  assert.match(social.headers.get("content-type"), /image\/png/);
  assert.equal(
    createHash("sha256")
      .update(await readFile("temp/prototype.html"))
      .digest("hex"),
    "c293ae2acb104e6cd65ef2edf07488732df21b61be9900c0b2987ce1b6d0a16a",
    "Reference prototype remains untouched",
  );
  console.log(
    "PASS responsive 404, axe, both recovery links, social image and untouched prototype",
  );
  console.log("All production browser checks passed.");
} finally {
  await browser?.close();
  server.kill();
}
