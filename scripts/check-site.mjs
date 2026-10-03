import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdir, readFile, readdir } from "node:fs/promises";
import { createHash } from "node:crypto";
import { setTimeout as delay } from "node:timers/promises";
import { chromium, firefox, webkit } from "playwright";
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
  page.setDefaultTimeout(15000);
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
  await page.mouse.click(380, 834);
  assert.equal(await menu.getAttribute("aria-expanded"), "false", "Outside pointer closes the menu");
  await menu.click();
  await page.locator(".hero-actions .button").focus();
  assert.equal(await menu.getAttribute("aria-expanded"), "false", "Leaving the header closes the menu");
  await menu.click();
  await page.setViewportSize({ width: 900, height: 900 });
  await page.waitForFunction(() => document.querySelector(".menu-toggle").getAttribute("aria-expanded") === "false");
  await page.setViewportSize({ width: 390, height: 844 });
  assert.equal(await menu.getAttribute("aria-expanded"), "false", "Resizing does not reopen a stale menu");
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

  const cursor = page.locator(".kernel-cursor");
  const html = page.locator("html");
  assert.match(await html.getAttribute("class"), /\blenis\b/);
  await page.locator(".hero-actions .button").hover();
  await page.waitForFunction(() => document.querySelector(".kernel-cursor")?.hasAttribute("data-interactive"));
  assert.equal(await cursor.getAttribute("data-visible"), "");
  await page.mouse.down();
  assert.equal(await cursor.getAttribute("data-pressed"), "");
  await page.mouse.move(680, 170);
  await page.mouse.up();
  await page.locator(".hero-description").hover();
  await page.waitForFunction(() => document.querySelector(".kernel-cursor")?.getAttribute("data-state") === "text");
  await page.waitForFunction(() => document.querySelector(".kernel-cursor path").getBoundingClientRect().width < 8);
  assert(await html.evaluate(el => el.classList.contains("kernel-pointer")));
  assert.equal(await page.locator(".hero-description").evaluate(el => getComputedStyle(el).cursor), "none");
  const copyBox = await page.locator(".hero-description").boundingBox();
  await page.mouse.move(copyBox.x + 2, copyBox.y + 12);
  await page.mouse.down();
  await page.mouse.move(copyBox.x + 280, copyBox.y + 39, { steps: 12 });
  assert.match(await page.evaluate(() => getSelection().toString()), /Você conta/);
  assert.equal(await cursor.getAttribute("data-selecting"), "");
  const beamBox = await page.locator(".kernel-cursor path").boundingBox();
  assert(Math.abs(beamBox.x + beamBox.width / 2 - copyBox.x - 280) < 0.1);
  assert(Math.abs(beamBox.y + beamBox.height / 2 - copyBox.y - 39) < 0.1);
  // Keep the text shape when a selection passes out of its original paragraph.
  await page.mouse.move(680, 570, { steps: 5 });
  assert.equal(await cursor.getAttribute("data-state"), "text");
  await page.mouse.up();
  await page.waitForFunction(() => document.querySelector(".kernel-cursor")?.getAttribute("data-state") === "default");
  await page.waitForFunction(() => document.querySelector(".kernel-cursor path").getBoundingClientRect().width > 18);
  await page.locator(".hero-description").hover();
  await page.waitForFunction(() => document.querySelector(".kernel-cursor")?.getAttribute("data-state") === "text");
  await page.keyboard.press("Control+c");
  assert.equal(await cursor.getAttribute("data-visible"), "");
  await page.evaluate(() => getSelection().removeAllRanges());
  // Rapid reversals must settle back to the same single SVG without a lost cursor.
  for (let pass = 0; pass < 3; pass++) {
    await page.locator(".hero-actions .button").hover();
    await page.locator(".hero-description").hover();
  }
  await page.locator(".dial-svg").hover({ position: { x: 15, y: 15 } });
  await page.waitForFunction(() => document.documentElement.classList.contains("kernel-pointer"));
  await page.waitForFunction(() => document.querySelector(".kernel-cursor")?.getAttribute("data-state") === "default");
  await page.waitForFunction(() => document.querySelector(".kernel-cursor path").getBoundingClientRect().width > 18);
  assert.equal(await cursor.locator("path").count(), 1);
  await page.keyboard.press("Tab");
  assert.equal(await cursor.getAttribute("data-visible"), null);

  await page.keyboard.press("Home");
  await page.waitForFunction(() => scrollY === 0);
  const heroBottom = await page.locator(".hero").evaluate(el => el.getBoundingClientRect().bottom);
  await page.mouse.move(1260, Math.min(heroBottom - 16, 880));
  await page.mouse.wheel(0, 600);
  await page.waitForFunction(() => scrollY > 10 && scrollY < 590);
  await page.waitForFunction(() => scrollY >= 599);
  await page.waitForFunction(() => document.querySelector(".kernel-cursor")?.getAttribute("data-surface") === "light");
  await page.keyboard.press("Home");
  await page.waitForFunction(() => scrollY === 0);
  await page.waitForFunction(() => document.querySelector(".kernel-cursor")?.getAttribute("data-surface") === "dark");
  await page.locator(".hero-actions .button").click();
  await page.waitForFunction(() => document.activeElement?.id === "como-funciona");
  assert.equal(new URL(page.url()).hash, "#como-funciona");
  assert(Math.abs(await page.locator("#como-funciona").evaluate(el => el.getBoundingClientRect().top) - 100) < 2);
  await page.locator(".section-intro > p").hover();
  await page.waitForFunction(() => getComputedStyle(document.querySelector(".kernel-cursor svg")).fill === "rgb(17, 19, 16)");
  assert.equal(await cursor.getAttribute("data-surface"), "light");
  assert(await cursor.isVisible());
  await page.locator("#como-funciona").focus();
  await page.keyboard.press("Tab");
  assert(await page.locator(".process-step summary").first().evaluate(el => document.activeElement === el));
  await page.goBack();
  await page.waitForFunction(() => scrollY === 0);

  const cursorNode = await cursor.elementHandle();
  for (let pass = 0; pass < 2; pass++) {
    await page.locator(".hero-actions .text-link").click();
    await page.waitForURL(`${base}/sobre`);
    await page.waitForFunction(() => document.documentElement.classList.contains("lenis"));
    assert.equal(await cursor.count(), 1);
    assert(await cursorNode.evaluate(el => el === document.querySelector(".kernel-cursor")),
      "The same cursor survives client-side navigation");
    await page.locator(".about-hero-copy:not(.kernel-ink-copy) > p").hover();
    await page.waitForFunction(() => document.querySelector(".kernel-cursor")?.getAttribute("data-surface") === "light");
    await page.keyboard.press("Home");
    await page.waitForFunction(() => scrollY === 0);
    await page.mouse.move(680, 650);
    await page.mouse.wheel(0, 400);
    await page.waitForFunction(() => scrollY > 10 && scrollY < 390);
    await page.waitForFunction(() => scrollY >= 399);
    await page.locator(".nav-cta").click();
    await page.waitForFunction(() => document.activeElement?.id === "piloto");
    assert.equal(new URL(page.url()).hash, "#piloto");
    assert(Math.abs(await page.locator("#piloto").evaluate(el => el.getBoundingClientRect().top) - 100) < 2);
    await page.goBack();
    // Next returns this unanchored entry to the top with native scrolling too.
    await page.waitForFunction(() => scrollY === 0);
    await page.getByRole("banner").getByRole("link", { name: "KERNEL, início" }).click();
    await page.waitForURL(`${base}/`);
    await page.waitForFunction(() => document.documentElement.classList.contains("lenis"));
    assert.equal(await cursor.count(), 1);
    assert(await cursorNode.evaluate(el => el === document.querySelector(".kernel-cursor")));
  }
  for (const route of ["/", "/sobre"]) {
    await page.goto(`${base}${route}`);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.waitForFunction(() => !document.documentElement.classList.contains("lenis"));
    assert.equal(await cursor.isVisible(), false);
    await page.emulateMedia({ reducedMotion: "no-preference", forcedColors: "active" });
    assert.equal(await cursor.isVisible(), false);
    assert(!/\blenis\b/.test(await html.getAttribute("class")));
    await page.emulateMedia({ forcedColors: "none" });
    await page.waitForFunction(() => document.documentElement.classList.contains("lenis"));
  }

  const touchContext = await browser.newContext({
    viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true,
  });
  const touchPage = await touchContext.newPage();
  const touchSession = await touchContext.newCDPSession(touchPage);
  for (const route of ["/", "/sobre"]) {
    await touchPage.goto(`${base}${route}`);
    assert.equal(await touchPage.locator(".kernel-cursor").isVisible(), false);
    await touchSession.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: 190, y: 680 }] });
    for (let step = 1; step <= 8; step++) {
      await touchSession.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: 190, y: 680 - step * 40 }] });
      await delay(20);
    }
    await touchSession.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    await touchPage.waitForFunction(() => scrollY > 150);
    assert(!await touchPage.locator("html").evaluate(el => el.classList.contains("lenis-smooth")));
  }
  await touchContext.close();
  console.log("PASS global cursor, native text selection/copy, Lenis wheel/anchors/history on Home and Sobre, keyboard, touch, preferences and repeated route changes");

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
    const attraction = document.querySelector(".kernel-attraction");
    const streaks = [...document.querySelectorAll(".kernel-pull-streak")];
    const copy = document.querySelector(".about-hero-copy").getBoundingClientRect();
    const rotations = new Set();
    let pullFrames = 0;
    let inwardFrames = 0;
    let lastHead;
    let lastOpacity = 0;
    let pullOverlapsCopy = false;
    let socketInsideMark = true;
    let socketOrigin;
    let socketDrift = 0;
    let previous = { rx: 0, ry: 0 };
    let minimumRadius = Infinity;
    let maximumAreaError = 0;
    let approachFrames = 0;
    let maximumSideOffset = 0;
    let maxMaskError = 0;
    const deadline = performance.now() + 14000;
    function sample() {
      const rx = Number(drop.getAttribute("rx"));
      const ry = Number(drop.getAttribute("ry"));
      if (rx > 0) {
        minimumRadius = Math.min(minimumRadius, rx, ry);
        maximumAreaError = Math.max(maximumAreaError, Math.abs(rx * ry / (280 * 294) - 1));
        const transform = outline.getScreenCTM();
        const toOutlineBall = transform.inverse().multiply(drop.getScreenCTM());
        const center = new DOMPoint(0, 0).matrixTransform(toOutlineBall);
        const distance = Math.hypot(center.x - 515, center.y - 1295);
        if (pullFrames > 0 && distance > 10 && distance < 600) {
          approachFrames++;
          maximumSideOffset = Math.max(maximumSideOffset,
            Math.abs((center.x - 515) * 105 + (center.y - 1295) * 265) / Math.hypot(265, 105));
        }
        rotations.add([transform.a, transform.b, transform.c, transform.d, transform.e, transform.f].join(","));
        if (Number(attraction.getAttribute("opacity")) > .01) {
          pullFrames++;
          const streak = streaks[0];
          const head = streak.transform.baseVal.consolidate().matrix.e;
          const opacity = Number(streak.getAttribute("opacity"));
          if (lastHead > head && opacity > .02 && lastOpacity > .02) inwardFrames++;
          lastHead = head;
          lastOpacity = opacity;
          const bounds = attraction.getBoundingClientRect();
          pullOverlapsCopy ||= bounds.left < copy.right && bounds.right > copy.left &&
            bounds.top < copy.bottom && bounds.bottom > copy.top;
          const toOutline = transform.inverse().multiply(attraction.getScreenCTM());
          const socket = new DOMPoint(0, 0).matrixTransform(toOutline);
          socketInsideMark &&= outline.isPointInFill(socket);
          socketOrigin ??= socket;
          socketDrift = Math.max(socketDrift, Math.hypot(socket.x - socketOrigin.x, socket.y - socketOrigin.y));
        }
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
        resolve({ minimumRadius, maximumAreaError, approachFrames, maximumSideOffset,
          contained, rotations: rotations.size, maxMaskError,
          pullFrames, inwardFrames, pullOverlapsCopy, socketInsideMark, socketDrift,
          pullCleared: Number(attraction.getAttribute("opacity")) < .001 });
        return;
      }
      if (performance.now() > deadline) resolve({ timedOut: true });
      else requestAnimationFrame(sample);
    }
    requestAnimationFrame(sample);
  }));
  assert.equal(docking.timedOut, undefined);
  assert(docking.minimumRadius >= 250, "The same full-size ball survives the whole trip");
  assert(docking.maximumAreaError < .005, "Squash and stretch preserve the ball's area");
  assert(docking.approachFrames > 5 && docking.maximumSideOffset < .03,
    "The final approach follows the socket axis, including the core's reaction");
  assert.equal(docking.contained, true, "The ball disappears only after complete reintegration");
  assert(docking.rotations > 10, "The base reacts throughout the journey");
  assert(docking.maxMaskError < .03, "The mask remains synchronized on every sampled frame");
  assert(docking.pullFrames > 10 && docking.inwardFrames > 10, "The streaks move continuously into the isotipo");
  assert.equal(docking.socketInsideMark, true, "The attraction originates inside the remaining isotipo");
  assert(docking.socketDrift < .03, "The magnetic source stays attached to the isotipo during recoil");
  assert.equal(docking.pullOverlapsCopy, false, "The attraction stays clear of the typography");
  assert.equal(docking.pullCleared, true, "The pull is absorbed before the loop restarts");
  assert.equal(normalizePath(await outline.getAttribute("d")), normalizePath(originalPath));

  await page.waitForFunction(() => Number(document.querySelector(".kernel-drop").getAttribute("rx")) > 200);
  assert(await page.evaluate(() => {
    const shape = document.querySelector(".kernel-outline");
    const ball = document.querySelector(".kernel-drop");
    const matrix = shape.getScreenCTM().inverse().multiply(ball.getScreenCTM());
    return Array.from({ length: 96 }, (_, i) => {
      const angle = i / 96 * Math.PI * 2;
      return shape.isPointInFill(new DOMPoint(
        Number(ball.getAttribute("rx")) * Math.cos(angle),
        Number(ball.getAttribute("ry")) * Math.sin(angle),
      ).matrixTransform(matrix));
    }).every(Boolean);
  }), "The ball first becomes visible entirely inside the original mass");
  const release = await page.evaluate(() => new Promise((resolve) => {
    const shape = document.querySelector(".kernel-outline");
    const ball = document.querySelector(".kernel-drop");
    const neck = document.querySelector(".kernel-neck");
    let ligamentFrames = 0, sourceVacated = true;
    const deadline = performance.now() + 5000;
    function sample() {
      const center = new DOMPoint(0, 0).matrixTransform(
        shape.getScreenCTM().inverse().multiply(ball.getScreenCTM()));
      const distance = Math.hypot(center.x - 515, center.y - 1295);
      if (distance > 130 && distance < 400 && neck.getAttribute("d")) ligamentFrames++;
      if (distance > 340) sourceVacated &&= !shape.isPointInFill(new DOMPoint(515, 1295));
      if (distance > 620) return resolve({ ligamentFrames, sourceVacated });
      if (performance.now() > deadline) return resolve({ timedOut: true });
      requestAnimationFrame(sample);
    }
    requestAnimationFrame(sample);
  }));
  assert.equal(release.timedOut, undefined);
  assert(release.ligamentFrames > 5, "The shared ligament stretches before separating");
  assert.equal(release.sourceVacated, true, "No stationary copy remains after the ball leaves");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await playback.waitFor({ state: "hidden" });
  assert.equal(await ink.count(), 0);
  assert.equal(normalizePath(await outline.getAttribute("d")), normalizePath(originalPath));
  assert.equal(Number(await drop.getAttribute("rx")), 0);
  assert.equal(await page.locator(".kernel-neck").getAttribute("d"), "");
  assert.equal(Number(await page.locator(".kernel-attraction").getAttribute("opacity")), 0,
    "Reduced motion clears the magnetic pull");
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

  const noImages = await browser.newContext({ reducedMotion: "reduce", viewport: { width: 320, height: 800 } });
  await noImages.route("**/*", (route) => route.request().resourceType() === "image" ? route.abort() : route.continue());
  const imageFallback = await noImages.newPage();
  await imageFallback.goto(base);
  assert(await imageFallback.locator("h1").isVisible());
  await imageFallback.locator(".hero-actions").getByRole("link", { name: "Conheça o projeto" }).click();
  await imageFallback.waitForURL(`${base}/sobre`);
  assert(await imageFallback.locator("h1").isVisible());
  await noImages.close();
  console.log("PASS content and route recovery with image requests blocked");

  const faultContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await faultContext.addInitScript(() => {
    const original = Element.prototype.querySelector;
    window.restoreKernelQuery = () => { Element.prototype.querySelector = original; };
    Element.prototype.querySelector = function (selector) {
      if (selector === ".delivery-folder") throw new Error("Simulated enhancement failure");
      return original.call(this, selector);
    };
  });
  const fault = await faultContext.newPage();
  await fault.goto(base);
  const recovery = fault.getByRole("button", { name: "Tentar novamente" });
  await recovery.waitFor({ state: "visible" });
  assert(await fault.getByRole("heading", { name: "Não foi possível abrir esta página." }).isVisible());
  assert(await fault.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
  const faultAccessibility = await new AxeBuilder({ page: fault })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
  assert.deepEqual(faultAccessibility.violations, []);
  await fault.screenshot({ path: "output/playwright/error-mobile.png", fullPage: true });
  await fault.evaluate(() => window.restoreKernelQuery());
  await recovery.click();
  await fault.locator(".hero h1").waitFor({ state: "visible" });
  await faultContext.close();
  console.log("PASS actual route error boundary, accessible recovery and retry after a simulated enhancement failure");

  const assetPaths = (await readdir("public", { recursive: true }))
    .filter((file) => /\.(png|svg|woff2)$/.test(file))
    .map((file) => `/${file.replaceAll("\\", "/")}`);
  for (const path of [...assetPaths, "/icon.svg", "/robots.txt", "/sitemap.xml", "/llms.txt"]) {
    const response = await fetch(`${base}${path}`);
    assert.equal(response.status, 200, `${path} must be served`);
    assert((await response.arrayBuffer()).byteLength > 0, `${path} must not be empty`);
  }
  const origin = (await page.evaluate(() => document.querySelector('meta[property="og:url"]')?.content))
    || "https://kernel.muski.workers.dev";
  const robots = await (await fetch(`${base}/robots.txt`)).text();
  const sitemap = await (await fetch(`${base}/sitemap.xml`)).text();
  assert(robots.includes(new URL("/sitemap.xml", origin).href));
  for (const route of ["/", "/sobre"]) assert(sitemap.includes(new URL(route, origin).href));
  const destinations = new Set();
  for (const route of ["/", "/sobre"]) {
    await page.goto(`${base}${route}`);
    const links = await page.locator("a[href]").evaluateAll((elements) => elements
      .map((element) => new URL(element.href))
      .filter((url) => url.origin === location.origin)
      .map((url) => url.pathname + url.hash));
    links.forEach((url) => destinations.add(url));
  }
  for (const destination of destinations) {
    const response = await fetch(new URL(destination.split("#")[0], base));
    assert.equal(response.status, 200, `Internal link: ${destination}`);
    await page.goto(`${base}${destination}`);
    if (destination.includes("#")) assert(await page.evaluate(() => Boolean(document.getElementById(decodeURIComponent(location.hash.slice(1))))));
  }
  console.log("PASS public assets, robots/sitemap/llms and all internal link/anchor destinations");

  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const route of ["/", "/sobre", "/pagina-inexistente"]) {
    for (const width of [540, 680, 681, 900, 1024, 1920, 2560]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(`${base}${route}`);
      assert(await page.locator("h1").isVisible());
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${route} reflow at ${width}px`);
    }
  }
  await page.setViewportSize({ width: 844, height: 390 });
  await page.goto(base);
  await page.locator("#possibilidades").scrollIntoViewIfNeeded();
  await page.screenshot({ path: "output/playwright/landing-landscape.png" });
  console.log("PASS breakpoint boundaries, ultrawide layouts and landscape reflow");

  await page.emulateMedia({ reducedMotion: "no-preference" });
  for (const width of [320, 390, 768, 1280, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    const missing = await page.goto(`${base}/pagina-inexistente`);
    assert.equal(missing.status(), 404);
    await page.waitForFunction(() => document.documentElement.classList.contains("lenis"));
    assert.equal(await cursor.count(), 1);
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
  await page.getByRole("link", { name: "Voltar ao início" }).hover();
  await page.waitForFunction(() => document.querySelector(".kernel-cursor")?.getAttribute("data-state") === "link");
  assert.equal(await cursor.getAttribute("data-visible"), "");
  await page.mouse.move(1200, 600);
  await page.mouse.wheel(0, 150);
  await page.waitForFunction(() => scrollY > 10 && scrollY < 140);
  await page.waitForFunction(() => scrollY >= 149);
  await page.keyboard.press("Home");
  await page.waitForFunction(() => scrollY === 0);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.waitForFunction(() => !document.documentElement.classList.contains("lenis"));
  assert.equal(await cursor.isVisible(), false);
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
      .update(await readFile("docs/references/prototype.html"))
      .digest("hex"),
    "c293ae2acb104e6cd65ef2edf07488732df21b61be9900c0b2987ce1b6d0a16a",
    "Reference prototype remains untouched",
  );
  console.log(
    "PASS responsive 404, global cursor and Lenis, reduced motion, axe, recovery links, social image and untouched prototype",
  );
  for (const engine of [firefox, webkit]) {
    const secondary = await engine.launch();
    try {
      const secondaryPage = await secondary.newPage({ reducedMotion: "reduce" });
      const engineErrors = [];
      secondaryPage.on("pageerror", (error) => engineErrors.push(error.message));
      for (const width of [390, 768, 1440]) {
        await secondaryPage.setViewportSize({ width, height: 900 });
        for (const route of ["/", "/sobre", "/pagina-inexistente"]) {
          const response = await secondaryPage.goto(`${base}${route}`);
          assert((route === "/pagina-inexistente" ? [404] : [200, 304]).includes(response.status()),
            `${engine.name()} ${route}: expected a successful response or valid cache revalidation`);
          assert(await secondaryPage.locator("h1").isVisible());
          assert(await secondaryPage.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${engine.name()} ${route} at ${width}px`);
        }
      }
      await secondaryPage.goto(base);
      await secondaryPage.locator(".process-step summary").nth(2).click();
      assert.equal(await secondaryPage.locator(".process-step[open]").count(), 1);
      await secondaryPage.getByRole("button", { name: /04 Construção\s*: 12 minutos previstos/ }).click();
      assert.match(await secondaryPage.locator(".dial-value").textContent(), /12/);
      await secondaryPage.locator(".hero-actions").getByRole("link", { name: "Conheça o projeto" }).click();
      await secondaryPage.waitForURL(`${base}/sobre`);
      await secondaryPage.emulateMedia({ reducedMotion: "no-preference" });
      await secondaryPage.getByRole("button", { name: "Pausar animação" }).waitFor({ state: "visible" });
      await secondaryPage.waitForFunction(() => Number(document.querySelector(".kernel-drop").getAttribute("rx")) > 200);
      await secondaryPage.getByRole("button", { name: "Pausar animação" }).click();
      const stopped = await secondaryPage.locator(".kernel-traveler").getAttribute("transform");
      await secondaryPage.waitForTimeout(150);
      assert.equal(await secondaryPage.locator(".kernel-traveler").getAttribute("transform"), stopped);
      assert.deepEqual(engineErrors, [], `${engine.name()} console`);
      await secondaryPage.screenshot({ path: `output/playwright/about-${engine.name()}.png` });
      console.log(`PASS ${engine.name()}: routes, reflow, accordions, dial, navigation and animated/pause state`);
    } finally {
      await secondary.close();
    }
  }
  console.log("All production browser checks passed.");
} finally {
  await browser?.close();
  server.kill();
}
