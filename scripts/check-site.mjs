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

  const originalSvg = await readFile("assets/isotipo_vetorizado.svg", "utf8");
  const originalPath = originalSvg.match(/\bd="([^"]+)"/)[1];
  const normalizePath = (path) => path.trim().replace(/\s+/g, " ");
  await page.goto(`${base}/sobre`, { waitUntil: "networkidle" });
  const outline = page.locator(".kernel-outline");
  const drop = page.locator(".kernel-drop");
  const traveler = page.locator(".kernel-traveler");
  const playback = page.locator(".mark-playback");
  const ink = page.locator(".kernel-ink-copy");

  async function waitForTextCrossing() {
    await page.waitForFunction(() => {
      const ball = document.querySelector(".kernel-drop").getBoundingClientRect();
      const title = document.querySelector(".about-hero-copy h1").getBoundingClientRect();
      const x = ball.x + ball.width / 2;
      const y = ball.y + ball.height / 2;
      return ball.width > 20 && x > title.left + 25 && x < title.right - 45 &&
        y > title.top + 15 && y < title.bottom - 15;
    });
  }

  async function assertInkGeometry() {
    const error = await page.evaluate(() => {
      const ink = document.querySelector(".kernel-ink-copy");
      const copy = ink.parentElement;
      const box = ink.getBoundingClientRect();
      const mask = ink.style.clipPath.match(/-?\d+(?:\.\d+)?/g).map(Number);
      const ball = document.querySelector(".kernel-drop").getBoundingClientRect();
      const title = copy.querySelector("h1").getBoundingClientRect();
      const duplicate = ink.querySelector(".about-hero-title").getBoundingClientRect();
      return Math.max(
        Math.abs(box.x + mask[2] - ball.x - ball.width / 2),
        Math.abs(box.y + mask[3] - ball.y - ball.height / 2),
        Math.abs(mask[0] - ball.width / 2),
        Math.abs(mask[1] - ball.height / 2),
        ...["x", "y", "width", "height"].map((key) => Math.abs(title[key] - duplicate[key])),
      );
    });
    assert(error < .03, `Text mask and ball are misaligned by ${error}px`);
    assert.equal(await page.locator("h1").count(), 1);
    assert.equal(await ink.getAttribute("aria-hidden"), "true");
  }

  async function assertInkPixels(label) {
    await assertInkGeometry();
    const copy = page.locator(".about-hero-copy").first();
    const clip = await ink.evaluate((el) => el.style.clipPath.match(/-?\d+(?:\.\d+)?/g).map(Number));
    const white = await copy.screenshot({ path: `output/playwright/about-ink-${label}.png` });
    await ink.evaluate((el) => { el.style.visibility = "hidden"; });
    const original = await copy.screenshot();
    await ink.evaluate((el) => { el.style.removeProperty("visibility"); });
    const pixels = await page.evaluate(async ({ white, original, clip }) => {
      const images = await Promise.all([white, original].map(async (base64) => {
        const bitmap = await createImageBitmap(await (await fetch(`data:image/png;base64,${base64}`)).blob());
        const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
        const ctx = canvas.getContext("2d");
        ctx.drawImage(bitmap, 0, 0);
        return { data: ctx.getImageData(0, 0, canvas.width, canvas.height).data, width: canvas.width };
      }));
      let changedOutside = 0;
      let whiteInside = 0;
      const [a, b] = images;
      for (let i = 0; i < a.data.length; i += 4) {
        if (Math.abs(a.data[i] - b.data[i]) + Math.abs(a.data[i + 1] - b.data[i + 1]) + Math.abs(a.data[i + 2] - b.data[i + 2]) < 30) continue;
        const x = (i / 4) % a.width;
        const y = Math.floor(i / 4 / a.width);
        const inside = ((x - clip[2]) / (clip[0] + 1.5)) ** 2 + ((y - clip[3]) / (clip[1] + 1.5)) ** 2 <= 1;
        if (!inside) changedOutside++;
        else if (a.data[i] > 240 && a.data[i + 1] > 240 && a.data[i + 2] > 240) whiteInside++;
      }
      return { changedOutside, whiteInside };
    }, { white: white.toString("base64"), original: original.toString("base64"), clip });
    assert.equal(pixels.changedOutside, 0, `${label}: color changes must stay inside the ball`);
    assert(pixels.whiteInside > 80, `${label}: intersecting glyphs must render white`);
  }

  await waitForTextCrossing();
  await page.getByRole("button", { name: "Pausar animação" }).click();
  const pausedTraveler = await traveler.getAttribute("transform");
  const pausedMask = await ink.getAttribute("style");
  await page.waitForTimeout(200);
  assert.equal(await traveler.getAttribute("transform"), pausedTraveler);
  assert.equal(await ink.getAttribute("style"), pausedMask);
  await assertInkPixels("desktop");
  await page.screenshot({ path: "output/playwright/about-motion-desktop.png" });
  await page.evaluate(() => scrollTo({ top: 1400, behavior: "instant" }));
  await page.waitForTimeout(150);
  await page.evaluate(() => scrollTo({ top: 0, behavior: "instant" }));
  await page.waitForTimeout(150);
  assert.equal(await traveler.getAttribute("transform"), pausedTraveler);
  await assertInkGeometry();

  // Recompose a paused scene without restarting playback or desynchronizing text.
  for (const width of [390, 768, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    await page.waitForTimeout(200);
    await assertInkGeometry();
    assert.equal(await playback.getAttribute("aria-pressed"), "true");
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
  }
  await playback.focus();
  await page.keyboard.press("Enter");
  const docking = await page.evaluate(() => new Promise((resolve) => {
    const outline = document.querySelector(".kernel-outline");
    const drop = document.querySelector(".kernel-drop");
    const rotations = new Set();
    let previous = { rx: 0, ry: 0 };
    let minimumRadius = Infinity;
    let maxMaskError = 0;
    const deadline = performance.now() + 14000;
    function sample() {
      const rx = Number(drop.getAttribute("rx"));
      const ry = Number(drop.getAttribute("ry"));
      if (rx > 0) {
        minimumRadius = Math.min(minimumRadius, rx, ry);
        rotations.add(outline.getAttribute("transform"));
        const ink = document.querySelector(".kernel-ink-copy");
        const box = ink.getBoundingClientRect();
        const mask = ink.style.clipPath.match(/-?\d+(?:\.\d+)?/g).map(Number);
        const ball = drop.getBoundingClientRect();
        maxMaskError = Math.max(maxMaskError,
          Math.abs(box.x + mask[2] - ball.x - ball.width / 2),
          Math.abs(box.y + mask[3] - ball.y - ball.height / 2));
        previous = { rx, ry };
      } else if (previous.rx > 0) {
        const toOutline = outline.getScreenCTM().inverse().multiply(drop.getScreenCTM());
        const contained = Array.from({ length: 96 }, (_, i) => {
          const angle = i / 96 * Math.PI * 2;
          return outline.isPointInFill(new DOMPoint(
            previous.rx * Math.cos(angle), previous.ry * Math.sin(angle),
          ).matrixTransform(toOutline));
        }).every(Boolean);
        resolve({ minimumRadius, contained, rotations: rotations.size, maxMaskError });
        return;
      }
      if (performance.now() > deadline) resolve({ timedOut: true });
      else requestAnimationFrame(sample);
    }
    requestAnimationFrame(sample);
  }));
  assert.equal(docking.timedOut, undefined);
  assert(docking.minimumRadius >= 250, "The same full-size ball survives the whole trip");
  assert.equal(docking.contained, true, "The ball disappears only after complete reintegration");
  assert(docking.rotations > 10, "The base reacts throughout the journey");
  assert(docking.maxMaskError < .03, "The mask remains synchronized on every sampled frame");
  assert.equal(normalizePath(await outline.getAttribute("d")), normalizePath(originalPath));

  await page.waitForFunction(() => Number(document.querySelector(".kernel-drop").getAttribute("rx")) > 200);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await playback.waitFor({ state: "hidden" });
  assert.equal(await ink.count(), 0);
  assert.equal(normalizePath(await outline.getAttribute("d")), normalizePath(originalPath));
  assert.equal(Number(await drop.getAttribute("rx")), 0);
  await page.emulateMedia({ reducedMotion: "no-preference", forcedColors: "active" });
  assert.equal(await ink.count(), 0, "Forced colors retain ordinary readable text");
  await page.emulateMedia({ forcedColors: "none" });
  await ink.waitFor({ state: "attached" });
  await page.waitForFunction(() => Number(document.querySelector(".kernel-drop").getAttribute("rx")) > 200);
  await page.evaluate(() => scrollTo({ top: 1400, behavior: "instant" }));
  await page.waitForTimeout(250);
  const suspended = await traveler.getAttribute("transform");
  await page.waitForTimeout(200);
  assert.equal(await traveler.getAttribute("transform"), suspended, "Offscreen work stops");
  await page.evaluate(() => scrollTo({ top: 0, behavior: "instant" }));
  await page.setViewportSize({ width: 390, height: 844 });
  await waitForTextCrossing();
  await page.getByRole("button", { name: "Pausar animação" }).click();
  await assertInkPixels("mobile");
  await page.screenshot({ path: "output/playwright/about-motion-mobile.png" });
  await page.emulateMedia({ reducedMotion: "reduce" });
  console.log("PASS hero journey, exact local text inversion (pixels and geometry), resize, docking, base reaction, keyboard pause, offscreen suspension and reduced-motion/forced-colors fallback");
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
