"use client";

import { useEffect, useId, useRef, useState } from "react";
import { gsap } from "gsap";
import { MotionPathPlugin } from "gsap/MotionPathPlugin";
import { kernelPath } from "./kernel-path";
import { detachedKernelPath, stretchedKernelPath } from "./kernel-morph";

// One continuous flight, with room for the fragment to clear every lobe.
const orbit =
  "M515 1295 C210 1400 -230 1540 -300 1030 C-400 300 -100 -240 520 -390 C1220 -560 2160 -20 2310 700 C2490 1500 1960 2370 1100 2400 C500 2420 30 2070 20 1690 C15 1460 270 1370 515 1295";

export function KernelSculpture() {
  const root = useRef<HTMLDivElement>(null);
  const syncPlayback = useRef<(() => void) | null>(null);
  const manuallyPaused = useRef(false);
  const [paused, setPaused] = useState(false);
  const filterId = useId().replaceAll(":", "");

  useEffect(() => {
    gsap.registerPlugin(MotionPathPlugin);
    const scene = root.current!;
    const media = gsap.matchMedia();
    media.add(
      "(prefers-reduced-motion: no-preference)",
      () => {
        const shape = scene.querySelector(".kernel-outline")!;
        const surface = scene.querySelector(".kernel-surface")!;
        const traveler = scene.querySelector(".kernel-traveler")!;
        const drop = scene.querySelector(".kernel-drop")!;
        const timeline = gsap.timeline({ paused: true, repeat: -1 });

        gsap.set(traveler, { x: 515, y: 1295 });
        timeline
          // Anticipation, separation, flight, absorption, rest. Every visible
          // property returns to its starting value before the 8.8 s boundary.
          .to(
            shape,
            {
              attr: { d: stretchedKernelPath },
              duration: 0.65,
              ease: "sine.inOut",
            },
            0.55,
          )
          .set(surface, { attr: { filter: `url(#${filterId})` } }, 1.05)
          .to(
            shape,
            {
              attr: { d: detachedKernelPath },
              duration: 1.1,
              ease: "sine.inOut",
            },
            1.1,
          )
          .to(
            drop,
            { attr: { rx: 260, ry: 240 }, duration: 0.7, ease: "sine.out" },
            1.1,
          )
          .to(
            traveler,
            {
              motionPath: { path: orbit, autoRotate: true },
              duration: 5.45,
              ease: "sine.inOut",
            },
            1.1,
          )
          .to(
            drop,
            { attr: { rx: 280, ry: 223 }, duration: 1.35, ease: "sine.inOut" },
            1.85,
          )
          .set(surface, { attr: { filter: "none" } }, 2.25)
          .to(
            drop,
            { attr: { rx: 250, ry: 250 }, duration: 1.3, ease: "sine.inOut" },
            4.8,
          )
          .set(surface, { attr: { filter: `url(#${filterId})` } }, 5.65)
          .to(
            shape,
            {
              attr: { d: stretchedKernelPath },
              duration: 0.95,
              ease: "sine.inOut",
            },
            5.65,
          )
          .to(
            drop,
            { attr: { rx: 0, ry: 0 }, duration: 0.65, ease: "sine.inOut" },
            6,
          )
          .to(
            shape,
            { attr: { d: kernelPath }, duration: 0.75, ease: "sine.inOut" },
            6.6,
          )
          .set(surface, { attr: { filter: "none" } }, 7.35)
          .to({}, { duration: 1.45 });

        let visible = false;
        function sync() {
          timeline.paused(
            manuallyPaused.current || !visible || document.hidden,
          );
        }
        syncPlayback.current = sync;
        const observer = new IntersectionObserver(
          ([entry]) => {
            visible = entry.isIntersecting && entry.intersectionRatio >= 0.25;
            sync();
          },
          { threshold: [0, 0.25] },
        );
        observer.observe(scene);
        document.addEventListener("visibilitychange", sync);
        scene.dataset.motionReady = "true";
        return () => {
          observer.disconnect();
          document.removeEventListener("visibilitychange", sync);
          syncPlayback.current = null;
          delete scene.dataset.motionReady;
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
