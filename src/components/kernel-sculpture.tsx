"use client";

import { useEffect, useId, useRef, useState } from "react";
import { gsap } from "gsap";
import { MotionPathPlugin } from "gsap/MotionPathPlugin";
import { kernelPath } from "./kernel-path";
import { detachedKernelPath, stretchedKernelPath } from "./kernel-morph";

export function KernelSculpture() {
  const root = useRef<HTMLDivElement>(null);
  const syncPlayback = useRef<(() => void) | null>(null);
  const manuallyPaused = useRef(false);
  const [paused, setPaused] = useState(false);
  const filterId = useId().replaceAll(":", "");

  useEffect(() => {
    gsap.registerPlugin(MotionPathPlugin);
    const scene = root.current!;
    const hero = scene.closest<HTMLElement>(".about-hero")!;
    const copy = hero.querySelector<HTMLElement>(".about-hero-copy")!;
    const svg = scene.querySelector<SVGSVGElement>(".kernel-sculpture")!;
    const media = gsap.matchMedia();
    media.add(
      "(prefers-reduced-motion: no-preference) and (forced-colors: none)",
      () => {
        const shape = scene.querySelector(".kernel-outline")!;
        const surface = scene.querySelector(".kernel-surface")!;
        const traveler = scene.querySelector(".kernel-traveler")!;
        const drop = scene.querySelector(".kernel-drop")!;

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
        const pose = { x: 515, y: 1295, rx: 0, ry: 0 };

        function sync() {
          timeline?.paused(manuallyPaused.current || !visible || document.hidden);
        }
        syncPlayback.current = sync;

        function rebuild() {
          if (disposed) return;
          const time = timeline?.time() ?? 0;
          animation.revert();
          Object.assign(pose, { x: 515, y: 1295, rx: 0, ry: 0 });
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
            return `${p.x} ${p.y}`;
          };
          // The route follows the text's actual bounds, including font swaps.
          // On narrow screens it rises through the copy and returns around the mark.
          const mobile = scene.getBoundingClientRect().top >= copyBox.bottom;
          const right = heroBox.right - radius - 18;
          const bottom = center.y + 1120 * matrix.a + radius + 10;
          const topTurn = Math.min(heading.right - radius, lineEnd - radius * .6);
          const orbit = mobile
            ? `M515 1295
               C${point(dock.x - 120, dock.y - 100)} ${point(heading.left + heading.width * .15, paragraph.bottom)} ${point(heading.left + heading.width * .22, heading.bottom - heading.height * .1)}
               C${point(heading.left + heading.width * .29, heading.top + heading.height * .18)} ${point(topTurn - 8, heading.top + heading.height * .1)} ${point(topTurn, heading.top + heading.height * .3)}
               C${point(topTurn + 25, heading.bottom - 20)} ${point(right, paragraph.bottom + 10)} ${point(right, paragraph.bottom + 70)}
               C${point(right, center.y + 90)} ${point(right, bottom - 8)} ${point(center.x + 15, bottom)}
               C${point(heading.left + radius * .5, bottom + 10)} ${point(heading.left + radius * .2, dock.y + 80)} 515 1295`
            : `M515 1295
               C${point(dock.x - 100, dock.y + 20)} ${point(heading.right - heading.width * .25, heading.bottom - 12)} ${point(heading.left + heading.width * .52, heading.top + heading.height * .6)}
               C${point(heading.left + heading.width * .18, heading.top + heading.height * .2)} ${point(heading.left + radius, heading.top + heading.height * .1)} ${point(heading.left + radius * .55, heading.top + heading.height * .42)}
               C${point(heading.left + radius * .2, heading.bottom + 10)} ${point(paragraph.left + paragraph.width * .2, paragraph.bottom + 24)} ${point(paragraph.left + paragraph.width * .62, paragraph.top + paragraph.height * .65)}
               C${point(paragraph.right + 130, paragraph.bottom + 10)} ${point(dock.x - 190, dock.y + 159)} ${point(dock.x - 140, dock.y + 95)}
               C${point(dock.x - 90, dock.y + 30)} ${point(dock.x - 50, dock.y + 15)} 515 1295`;

          function render() {
            traveler.setAttribute("transform", `translate(${pose.x} ${pose.y})`);
            drop.setAttribute("rx", String(pose.rx));
            drop.setAttribute("ry", String(pose.ry));
            // One pose drives both edges in the same frame; no layout reads,
            // blend approximations or separately eased text masks.
            ink.style.clipPath = `ellipse(${pose.rx * matrix.a}px ${pose.ry * matrix.d}px at ${(pose.x - origin.x) * matrix.a}px ${(pose.y - origin.y) * matrix.d}px)`;
            const connected = pose.rx > 0 && Math.hypot(pose.x - 515, pose.y - 1295) < 740;
            surface.setAttribute("filter", connected ? `url(#${filterId})` : "none");
          }

          animation.add(() => {
            gsap.set(shape, { svgOrigin: "1000 1000" });
            timeline = gsap.timeline({ paused: true, repeat: -1, onUpdate: render });
            timeline
              .to(shape, { attr: { d: stretchedKernelPath }, duration: .5, ease: "sine.inOut" }, .2)
              .to(shape, { attr: { d: detachedKernelPath }, duration: .95, ease: "sine.inOut" }, .65)
              .set(pose, { rx: 280, ry: 294 }, .65)
              .to(pose, { motionPath: { path: orbit }, duration: 9.6, ease: "sine.inOut" }, .65)
              .to(pose, { rx: 308, ry: 268, duration: .7, ease: "sine.inOut" }, .65)
              .to(pose, { rx: 286, ry: 290, duration: 2, ease: "sine.inOut" }, 2.2)
              .to(pose, { rx: 300, ry: 275, duration: 2, ease: "sine.inOut" }, 6)
              .to(pose, { rx: 280, ry: 294, duration: 1, ease: "sine.inOut" }, 9.25)
              .to(shape, { rotation: -1.5, x: -5, y: 2, duration: 2, ease: "sine.inOut" }, .65)
              .to(shape, { rotation: 1.1, x: 3, y: -2, duration: 3, ease: "sine.inOut" }, 2.65)
              .to(shape, { rotation: -.8, x: -3, y: 1, duration: 3, ease: "sine.inOut" }, 5.65)
              .to(shape, { rotation: 0, x: 0, y: 0, duration: 1.4, ease: "sine.inOut" }, 8.65)
              .to(pose, { rx: 258, ry: 310, duration: .14, ease: "power2.out" }, 10.25)
              .to(pose, { rx: 280, ry: 294, duration: .38, ease: "sine.inOut" }, 10.39)
              .to(shape, { attr: { d: kernelPath }, duration: .7, ease: "sine.inOut" }, 10.25)
              .to(shape, { rotation: .45, x: 7, y: -4, duration: .14, ease: "sine.out" }, 10.25)
              .to(shape, { rotation: 0, x: 0, y: 0, duration: .55, ease: "sine.inOut" }, 10.39)
              .set(pose, { rx: 0, ry: 0 }, 11.1)
              .to({}, { duration: .35 });
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
          drop.setAttribute("rx", "0");
          drop.setAttribute("ry", "0");
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
        <g className="kernel-surface" fill="currentColor">
          <path className="kernel-outline" d={kernelPath} />
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
