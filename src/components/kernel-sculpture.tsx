"use client";

import { useEffect, useId, useRef, useState } from "react";
import { gsap } from "gsap";
import { MotionPathPlugin } from "gsap/MotionPathPlugin";
import { CustomEase } from "gsap/CustomEase";
import { kernelPath } from "./kernel-path";
import { detachedKernelPath } from "./kernel-morph";

const pullStreaks = Array.from({ length: 18 }, (_, i) => ({
  phase: i * .618 % 1,
  speed: 1.4 + i % 4 * .28,
  length: 150 + i * 73 % 190,
  width: 6 + i % 4 * 2,
  angle: Math.atan2(i * 109 % 440 - 220, 760),
}));

export function KernelSculpture() {
  const root = useRef<HTMLDivElement>(null);
  const syncPlayback = useRef<(() => void) | null>(null);
  const manuallyPaused = useRef(false);
  const [paused, setPaused] = useState(false);
  const filterId = useId().replaceAll(":", "");

  useEffect(() => {
    gsap.registerPlugin(MotionPathPlugin, CustomEase);
    const scene = root.current!;
    const hero = scene.closest<HTMLElement>(".about-hero")!;
    const copy = hero.querySelector<HTMLElement>(".about-hero-copy")!;
    const svg = scene.querySelector<SVGSVGElement>(".kernel-sculpture")!;
    const media = gsap.matchMedia();
    media.add(
      "(prefers-reduced-motion: no-preference) and (forced-colors: none)",
      () => {
        const shape = scene.querySelector(".kernel-outline")!;
        const body = scene.querySelector<SVGGElement>(".kernel-body")!;
        const response = scene.querySelector<SVGGElement>(".kernel-response")!;
        const surface = scene.querySelector(".kernel-surface")!;
        const traveler = scene.querySelector(".kernel-traveler")!;
        const drop = scene.querySelector(".kernel-drop")!;
        const neck = scene.querySelector(".kernel-neck")!;
        const attraction = scene.querySelector(".kernel-attraction")!;
        const streaks = [...scene.querySelectorAll(".kernel-pull-streak")];
        const flow = CustomEase.create("", "M0 0 C.045 0 .08 .035 .145 .105 C.21 .175 .61 .58 .735 .71 C.7975 .775 .86 .95 .915 .984 C.94 .99945 .975 1 1 1");

        // A visual copy of the real text: identical wrapping, one accessible h1.
        const ink = copy.cloneNode(true) as HTMLElement;
        ink.classList.add("kernel-ink-copy");
        ink.setAttribute("aria-hidden", "true");
        ink.inert = true;
        const clonedHeading = ink.querySelector("h1")!;
        const visualHeading = document.createElement("div");
        visualHeading.className = clonedHeading.className;
        visualHeading.append(...clonedHeading.childNodes);
        clonedHeading.replaceWith(visualHeading);
        copy.append(ink);

        const animation = gsap.context(() => {}, scene);
        let timeline: gsap.core.Timeline | undefined;
        let visible = false;
        let disposed = false;
        let resizeFrame = 0;
        const pose = { x: 515, y: 1295, rx: 0, progress: 0 };

        function sync() {
          timeline?.paused(manuallyPaused.current || !visible || document.hidden);
        }
        syncPlayback.current = sync;

        function rebuild() {
          if (disposed) return;
          const time = timeline?.time() ?? 0;
          animation.revert();
          Object.assign(pose, { x: 515, y: 1295, rx: 0, progress: 0 });
          const matrix = svg.getScreenCTM()!;
          const inverse = matrix.inverse();
          const title = copy.querySelector("h1")!;
          const heading = title.getBoundingClientRect();
          const firstLine = document.createRange();
          firstLine.selectNodeContents(title.firstChild!);
          const lineEnd = firstLine.getBoundingClientRect().right;
          const paragraph = copy.querySelector("p")!.getBoundingClientRect();
          const copyBox = copy.getBoundingClientRect();
          const heroBox = hero.getBoundingClientRect();
          const dock = new DOMPoint(515, 1295).matrixTransform(matrix);
          const center = new DOMPoint(1000, 1000).matrixTransform(matrix);
          const radius = 300 * matrix.a;
          const origin = new DOMPoint(copyBox.left, copyBox.top).matrixTransform(inverse);
          const point = (x: number, y: number) => {
            const p = new DOMPoint(x, y).matrixTransform(inverse);
            return { x: p.x, y: p.y };
          };
          // The route follows the text's actual bounds, including font swaps.
          // On narrow screens it rises through the copy and returns around the mark.
          const mobile = scene.getBoundingClientRect().top >= copyBox.bottom;
          const right = heroBox.right - radius - 18;
          const bottom = Math.min(center.y + 1120 * matrix.a + radius + 10,
            heroBox.bottom - radius - 20);
          const topTurn = Math.min(heading.right - radius, lineEnd - radius * .6);
          const normalLength = Math.hypot(515 - 780, 1295 - 1190);
          const normal = { x: (515 - 780) / normalLength, y: (1295 - 1190) / normalLength };
          // Start returning on the inlet's ray, rather than adding a low waypoint
          // that sends the ball past it and requires a turn back near the mark.
          const approach = mobile ? 620 : Math.max(700,
            (dock.x - paragraph.right - radius * .35) / (-normal.x * matrix.a));
          const entry = { x: 515 + normal.x * approach, y: 1295 + normal.y * approach };
          const anchors = mobile
            ? [
                point(dock.x - radius * .8, dock.y - radius),
                point(heading.left + heading.width * .2, paragraph.bottom + radius),
                point(heading.left + heading.width * .23, heading.top + heading.height * .65),
                point(topTurn - radius * .4, heading.top + heading.height * .18),
                point(topTurn + radius * .5, heading.bottom - radius * .2),
                point(right, paragraph.bottom + radius * 1.5),
                point(right - radius * .2, center.y + radius * 1.5),
                point(center.x + radius * .4, bottom - radius * .3),
                point(heroBox.left + radius + 40, bottom - radius * .6),
                entry,
              ]
            : [
                point(dock.x - radius * 2, dock.y - radius * .2),
                point(heading.left + heading.width * .53, heading.top + heading.height * .43),
                point(heading.left + radius * 1.4, heading.top + heading.height * .3),
                point(paragraph.left + paragraph.width * .18, paragraph.top + paragraph.height * .5),
                entry,
              ];
          // One continuous spline, sampled by arc length: no direction changes
          // at hand-written joins and no separate clock for the magnetic pull.
          const orbit = MotionPathPlugin.arrayToRawPath([
            { x: 515, y: 1295 }, ...anchors, { x: 515, y: 1295 },
          ], { curviness: 1 });
          // The whole return arc settles onto the socket axis. Its three final
          // points are collinear, so both tangent and curvature meet the straight
          // approach smoothly instead of steering the ball at the last moment.
          const curve = orbit[0];
          const handle = mobile ? 160 : Math.min(320, approach * .22);
          curve[curve.length - 12] = entry.x + normal.x * handle * 2;
          curve[curve.length - 11] = entry.y + normal.y * handle * 2;
          curve[curve.length - 10] = entry.x + normal.x * handle;
          curve[curve.length - 9] = entry.y + normal.y * handle;
          // Carry the arc's initial tangent into its preceding segment too.
          const turnX = curve[curve.length - 14], turnY = curve[curve.length - 13];
          curve[curve.length - 16] = turnX - (curve[curve.length - 12] - turnX) * .2;
          curve[curve.length - 15] = turnY - (curve[curve.length - 11] - turnY) * .2;
          curve.splice(-6, 4, 515 + normal.x * approach * 2 / 3, 1295 + normal.y * approach * 2 / 3,
            515 + normal.x * approach / 3, 1295 + normal.y * approach / 3);
          MotionPathPlugin.cacheRawPathMeasurements(orbit, 32);
          const launch = MotionPathPlugin.getPositionOnPath(orbit, .006, true);
          const launchAngle = (launch as { angle: number }).angle * Math.PI / 180;
          const launchX = Math.cos(launchAngle), launchY = Math.sin(launchAngle);

          function render() {
            const position = MotionPathPlugin.getPositionOnPath(orbit, pose.progress, true);
            pose.x = position.x;
            pose.y = position.y;
            const angle = (position as { angle: number }).angle * Math.PI / 180;
            const stretch = 16 * Math.cos(angle * 2) * Math.sin(Math.PI * pose.progress) ** 2;
            const rx = pose.rx > 0 ? pose.rx + stretch : 0;
            // Stretch redistributes the same apparent volume instead of growing
            // a second lobe or making the traveling mass shrink on departure.
            const ry = rx > 0 ? 280 * 294 / rx : 0;
            // The core follows the traveling mass rather than an unrelated wobble.
            const distance = Math.hypot(pose.x - 515, pose.y - 1295) || 1;
            const life = rx > 0 ? Math.sin(Math.PI * pose.progress) ** 2 : 0;
            const followX = (pose.x - 515) / distance;
            const followY = (pose.y - 1295) / distance;
            response.setAttribute("transform", `translate(${followX * 12 * life} ${followY * 12 * life}) rotate(${followY * .9 * life} 1000 1000)`);
            const coreMatrix = response.transform.baseVal.consolidate()!.matrix
              .multiply(body.transform.baseVal.consolidate()!.matrix);
            // The guide follows the core from the start of its return; docking
            // never introduces a separate positional correction near the mark.
            const blend = Math.min(1, Math.max(0, ((timeline?.time() ?? 0) - 7.65) / .8));
            if (blend > 0) {
              const lock = blend ** 2 * (3 - 2 * blend);
              const aligned = new DOMPoint(pose.x, pose.y).matrixTransform(coreMatrix);
              pose.x += (aligned.x - pose.x) * lock;
              pose.y += (aligned.y - pose.y) * lock;
            }
            traveler.setAttribute("transform", `translate(${pose.x} ${pose.y})`);
            drop.setAttribute("rx", String(rx));
            drop.setAttribute("ry", String(ry));
            // One pose drives both edges in the same frame; no layout reads,
            // blend approximations or separately eased text masks.
            ink.style.clipPath = `ellipse(${rx * matrix.a}px ${ry * matrix.d}px at ${(pose.x - origin.x) * matrix.a}px ${(pose.y - origin.y) * matrix.d}px)`;
            const connected = pose.rx > 0 && Math.hypot(pose.x - 515, pose.y - 1295) < 740;
            surface.setAttribute("filter", connected ? `url(#${filterId})` : "none");
            const socket = new DOMPoint(780, 1190).matrixTransform(coreMatrix);
            const span = Math.hypot(pose.x - socket.x, pose.y - socket.y) || 1;
            const ux = (pose.x - socket.x) / span, uy = (pose.y - socket.y) / span;
            const edge = rx > 0 ? 1 / Math.hypot(ux / rx, uy / ry) : 0;
            const gap = Math.max(0, span - edge - 48);
            const tension = rx > 0 ? Math.max(0, 1 - gap / 220) : 0;
            if (tension < .008) neck.setAttribute("d", "");
            else {
              // A real shared ligament thins as the ball stretches away. Both
              // ends remain inside the masses; it closes along the same axis.
              const tip = { x: pose.x - ux * edge * .85, y: pose.y - uy * edge * .85 };
              const middle = { x: (socket.x + tip.x) / 2, y: (socket.y + tip.y) / 2 };
              const handle = Math.hypot(tip.x - socket.x, tip.y - socket.y) * .22;
              const base = 64 * tension, waist = 30 * tension ** 2, end = 54 * tension;
              neck.setAttribute("d", `M${socket.x - uy * base} ${socket.y + ux * base}
                C${socket.x + ux * handle - uy * base} ${socket.y + uy * handle + ux * base} ${middle.x - ux * handle - uy * waist} ${middle.y - uy * handle + ux * waist} ${middle.x - uy * waist} ${middle.y + ux * waist}
                C${middle.x + ux * handle - uy * waist} ${middle.y + uy * handle + ux * waist} ${tip.x - ux * handle - uy * end} ${tip.y - uy * handle + ux * end} ${tip.x - uy * end} ${tip.y + ux * end}
                L${tip.x + uy * end} ${tip.y - ux * end}
                C${tip.x - ux * handle + uy * end} ${tip.y - uy * handle - ux * end} ${middle.x + ux * handle + uy * waist} ${middle.y + uy * handle - ux * waist} ${middle.x + uy * waist} ${middle.y - ux * waist}
                C${middle.x - ux * handle + uy * waist} ${middle.y - uy * handle - ux * waist} ${socket.x + ux * handle + uy * base} ${socket.y + uy * handle - ux * base} ${socket.x + uy * base} ${socket.y - ux * base} Z`);
            }
            // Speed streaks stream into the vacated socket on the same clock
            // as the ball. Each crosses the field several times during return.
            const returnTime = (timeline?.time() ?? 0) - 7.65;
            const returnPhase = Math.min(1, Math.max(0, returnTime / 2.6));
            const pull = pose.rx > 0 ? Math.sin(Math.PI * returnPhase) ** 1.5 : 0;
            attraction.setAttribute("opacity", String(pull));
            if (pull < .001) {
              return;
            }
            // Read transform attributes, not layout: the socket stays attached
            // through the core's recoil, rotation and elastic deformation.
            const localBall = new DOMPoint(pose.x, pose.y).matrixTransform(coreMatrix.inverse());
            const dx = localBall.x - 780, dy = localBall.y - 1190;
            const separation = Math.hypot(dx, dy) || 1;
            // The field opens through the empty lobe and leans toward the ball.
            // It renders behind the mark, independently of its liquid filter.
            const direction = Math.atan2(.47 * .65 + dy / separation * .35,
              -.88 * .65 + dx / separation * .35);
            const field = coreMatrix.translate(780, 1190).rotate(direction * 180 / Math.PI);
            attraction.setAttribute("transform", `matrix(${field.a} ${field.b} ${field.c} ${field.d} ${field.e} ${field.f})`);
            streaks.forEach((streak, i) => {
              const spec = pullStreaks[i];
              const phase = (returnTime * spec.speed + spec.phase) % 1;
              const head = 760 * (1 - phase ** 1.3) - 70;
              const length = spec.length * (.6 + phase * .65);
              const fade = Math.min(1, phase / .18, (1 - phase) / .18);
              streak.setAttribute("transform", `translate(${head * Math.cos(spec.angle)} ${head * Math.sin(spec.angle)}) rotate(${spec.angle * 180 / Math.PI}) scale(${length / 240} 1)`);
              // Zero opacity at both ends hides each recycle; the dark head
              // leads a fading tail toward the socket, with varied speeds.
              streak.setAttribute("opacity", String(fade ** 2 * (3 - 2 * fade) * (.7 + i % 4 * .1)));
            });
          }

          animation.add(() => {
            gsap.set(body, { svgOrigin: "1000 1000", x: 0, y: 0, rotation: 0 });
            timeline = gsap.timeline({ paused: true, repeat: -1, onUpdate: render });
            timeline
              // Reveal the ball inside the original silhouette, then remove the
              // lobe before it moves away. The liquid filter carries the neck.
              .set(pose, { rx: 280 }, .12)
              .to(shape, { attr: { d: detachedKernelPath }, duration: .88, ease: "sine.inOut" }, .12)
              .to(body, { x: -launchX * 28, y: -launchY * 28, rotation: 1.4, scaleX: .975, scaleY: 1.025, duration: .76, ease: "sine.inOut" }, .12)
              .to(pose, { progress: 1, duration: 9.6, ease: flow }, .65)
              .to(pose, { rx: 314, duration: .8, ease: "sine.inOut" }, .65)
              .to(pose, { rx: 296, duration: 1.5, ease: "sine.inOut" }, 1.55)
              .to(pose, { rx: 286, duration: 2, ease: "sine.inOut" }, 5.6)
              .to(pose, { rx: 280, duration: .55, ease: "sine.inOut" }, 9.1)
              .to(body, { rotation: -1.2, x: launchX * 18, y: launchY * 18, scaleX: 1.012, scaleY: .988, duration: .18, ease: "power2.out" }, 1.35)
              .to(body, { rotation: 0, x: 0, y: 0, scaleX: 1, scaleY: 1, duration: 1.15, ease: "elastic.out(1, .48)" }, 1.53)
              .to(body, { rotation: -.6, x: 12, y: 8, scaleX: 1.014, scaleY: .986, duration: 1.3, ease: "sine.inOut" }, 8.65)
              .to(shape, { attr: { d: kernelPath }, duration: .76, ease: "sine.inOut" }, 9.96)
              .to(body, { rotation: .6, x: -9, y: -5, scaleX: .99, scaleY: 1.01, duration: .18, ease: "sine.inOut" }, 9.96)
              .to(body, { rotation: 0, x: 0, y: 0, scaleX: 1, scaleY: 1, duration: .85, ease: "elastic.out(1, .48)" }, 10.14)
              .set(pose, { rx: 0 }, 11.1)
              .to({}, { duration: .25 });
            timeline.time(time, false);
            render();
            sync();
          });
        }

        function scheduleResize() {
          cancelAnimationFrame(resizeFrame);
          resizeFrame = requestAnimationFrame(rebuild);
        }
        const resize = new ResizeObserver(scheduleResize);
        resize.observe(hero);
        resize.observe(copy);
        resize.observe(scene);
        const observer = new IntersectionObserver(([entry]) => {
          visible = entry.isIntersecting;
          sync();
        });
        observer.observe(hero);
        document.addEventListener("visibilitychange", sync);
        document.fonts.ready.then(() => { if (!disposed) scheduleResize(); });
        rebuild();
        scene.dataset.motionReady = "true";
        return () => {
          disposed = true;
          cancelAnimationFrame(resizeFrame);
          resize.disconnect();
          observer.disconnect();
          document.removeEventListener("visibilitychange", sync);
          syncPlayback.current = null;
          delete scene.dataset.motionReady;
          animation.revert();
          traveler.removeAttribute("transform");
          response.removeAttribute("transform");
          drop.setAttribute("rx", "0");
          drop.setAttribute("ry", "0");
          neck.setAttribute("d", "");
          attraction.removeAttribute("transform");
          attraction.setAttribute("opacity", "0");
          streaks.forEach((streak) => {
            streak.removeAttribute("transform");
            streak.setAttribute("opacity", "0");
          });
          surface.setAttribute("filter", "none");
          ink.remove();
        };
      },
      scene,
    );
    return () => media.revert();
  }, [filterId]);
  function toggle() {
    manuallyPaused.current = !manuallyPaused.current;
    setPaused(manuallyPaused.current);
    syncPlayback.current?.();
  }

  return (
    <div className="kernel-scene" ref={root}>
      <svg
        className="kernel-sculpture"
        viewBox="-720 -720 3440 3440"
        role="img"
        aria-label="Símbolo do KERNEL: um fragmento se desprende, orbita e volta a integrar a mesma forma"
      >
        <defs>
          <linearGradient id={`${filterId}-pull`} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="240" y2="0">
            <stop offset="0" stopColor="currentColor" />
            <stop offset=".2" stopColor="currentColor" stopOpacity=".85" />
            <stop offset="1" stopColor="currentColor" stopOpacity="0" />
          </linearGradient>
          <filter
            id={filterId}
            filterUnits="userSpaceOnUse"
            x="-650"
            y="-650"
            width="3300"
            height="3400"
            colorInterpolationFilters="sRGB"
          >
            <feGaussianBlur
              in="SourceGraphic"
              stdDeviation="24"
              result="blur"
            />
            <feColorMatrix
              in="blur"
              type="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 16 -8"
              result="bridge"
            />
            <feGaussianBlur in="bridge" stdDeviation="1" result="softBridge" />
            <feComposite in="SourceGraphic" in2="softBridge" operator="over" />
          </filter>
        </defs>
        <circle className="kernel-field" cx="1000" cy="1000" r="1120" />
        <g className="kernel-attraction" opacity="0" aria-hidden="true">
          {pullStreaks.map((streak, i) => (
            <line
              key={i}
              className="kernel-pull-streak"
              x1="0" y1="0" x2="240" y2="0"
              stroke={`url(#${filterId}-pull)`}
              strokeWidth={streak.width}
              strokeLinecap="round"
              opacity="0"
            />
          ))}
        </g>
        <g className="kernel-surface" fill="currentColor">
          <path className="kernel-neck" d="" />
          <g className="kernel-response">
            <g className="kernel-body">
              <path className="kernel-outline" d={kernelPath} />
            </g>
          </g>
          <g className="kernel-traveler">
            <ellipse className="kernel-drop" cx="0" cy="0" rx="0" ry="0" />
          </g>
        </g>
      </svg>
      <button
        className="mark-playback"
        type="button"
        onClick={toggle}
        aria-label={paused ? "Continuar animação" : "Pausar animação"}
        aria-pressed={paused}
      >
        <svg
          width="15"
          height="15"
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.4"
          aria-hidden="true"
        >
          {paused ? <path d="m7 4 9 6-9 6Z" /> : <path d="M7 4v12M13 4v12" />}
        </svg>
        {paused ? "Continuar" : "Pausar"}
      </button>
    </div>
  );
}
