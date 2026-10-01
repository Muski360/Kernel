"use client";

import { useEffect, useId, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { MotionPathPlugin } from "gsap/MotionPathPlugin";
import { kernelPath } from "./kernel-path";
import { detachedKernelPath } from "./kernel-morph";

export function KernelSculpture() {
  const root = useRef<HTMLDivElement>(null);
  const playback = useRef<gsap.core.Timeline | null>(null);
  const filterId = useId().replaceAll(":", "");
  const [phase, setPhase] = useState<"idle" | "playing" | "paused">("idle");

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger, MotionPathPlugin);
    const scene = root.current!;
    const media = gsap.matchMedia();
    media.add(
      "(prefers-reduced-motion: no-preference)",
      () => {
        const shape = scene.querySelector(".kernel-outline")!;
        const surface = scene.querySelector(".kernel-surface")!;
        const traveler = scene.querySelector(".kernel-traveler")!;
        const drop = scene.querySelector(".kernel-drop")!;
        const timeline = gsap.timeline({
          paused: true,
          onStart: () => setPhase("playing"),
          onComplete: () => setPhase("idle"),
        });
        playback.current = timeline;
        scene.dataset.motionReady = "true";
        gsap.set(traveler, { x: 515, y: 1295 });

        timeline
          .set(surface, { attr: { filter: `url(#${filterId})` } }, 0)
          .to(
            shape,
            {
              attr: { d: detachedKernelPath },
              duration: 0.72,
              ease: "power2.inOut",
            },
            0.2,
          )
          .to(
            drop,
            { attr: { rx: 300, ry: 275 }, duration: 0.5, ease: "power2.out" },
            0.25,
          )
          .to(
            traveler,
            {
              motionPath: {
                path: [
                  { x: 515, y: 1295 },
                  { x: 115, y: 1440 },
                  { x: -30, y: 800 },
                  { x: 300, y: 55 },
                  { x: 1130, y: -115 },
                  { x: 2015, y: 520 },
                  { x: 2050, y: 1530 },
                  { x: 1430, y: 2100 },
                  { x: 650, y: 1850 },
                  { x: 515, y: 1295 },
                ],
                curviness: 1.1,
              },
              duration: 3.55,
              ease: "power1.inOut",
            },
            0.25,
          )
          .to(
            shape,
            { attr: { d: kernelPath }, duration: 0.95, ease: "power3.out" },
            1.15,
          )
          .to(
            drop,
            { attr: { rx: 250, ry: 280 }, duration: 1.6, ease: "sine.inOut" },
            1,
          )
          .to(
            drop,
            { attr: { rx: 0, ry: 0 }, duration: 0.35, ease: "power2.inOut" },
            3.5,
          )
          .set(surface, { attr: { filter: "none" } }, 3.9);

        // One entrance cycle. Native scrolling controls only the scene's exit;
        // it never competes with replay or forces the reader through a pinned page.
        let visible = false;
        let started = false;
        let suspended = false;
        function syncVisibility() {
          if (!visible || document.hidden) {
            if (timeline.isActive()) {
              suspended = true;
              timeline.pause();
            }
          } else if (suspended) {
            suspended = false;
            timeline.resume();
          }
        }
        const observer = new IntersectionObserver(
          ([entry]) => {
            visible = entry.isIntersecting;
            if (visible && !started && !document.hidden) {
              started = true;
              timeline.play();
            }
            syncVisibility();
          },
          { threshold: 0.35 },
        );
        observer.observe(scene);
        document.addEventListener("visibilitychange", syncVisibility);
        const desktop = gsap.matchMedia();
        desktop.add("(min-width: 901px)", () => {
          gsap.to(scene.querySelector(".kernel-sculpture"), {
            y: 65,
            rotation: -6,
            ease: "none",
            scrollTrigger: {
              trigger: scene.closest(".about-hero"),
              start: "top top",
              end: "bottom top",
              scrub: 0.8,
            },
          });
        });
        return () => {
          observer.disconnect();
          document.removeEventListener("visibilitychange", syncVisibility);
          desktop.revert();
          playback.current = null;
          delete scene.dataset.motionReady;
        };
      },
      scene,
    );
    return () => media.revert();
  }, [filterId]);

  function toggle() {
    const timeline = playback.current;
    if (!timeline) return;
    if (phase === "playing") {
      timeline.pause();
      setPhase("paused");
    } else if (phase === "paused") {
      timeline.resume();
      setPhase("playing");
    } else timeline.restart();
  }

  const label =
    phase === "playing"
      ? "Pausar animação"
      : phase === "paused"
        ? "Continuar animação"
        : "Repetir animação";
  return (
    <div className="kernel-scene" ref={root}>
      <svg
        className="kernel-sculpture"
        viewBox="-480 -480 2960 2960"
        role="img"
        aria-label="Símbolo do KERNEL"
      >
        <defs>
          <filter
            id={filterId}
            x="-35%"
            y="-35%"
            width="170%"
            height="170%"
            colorInterpolationFilters="sRGB"
          >
            <feGaussianBlur
              in="SourceGraphic"
              stdDeviation="12"
              result="blur"
            />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 28 -13"
            />
          </filter>
        </defs>
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
        aria-label={label}
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
          {phase === "playing" ? (
            <path d="M7 4v12M13 4v12" />
          ) : phase === "paused" ? (
            <path d="m7 4 9 6-9 6Z" />
          ) : (
            <path d="M16 6a7 7 0 1 0 1 7M16 2v5h-5" />
          )}
        </svg>
        {phase === "playing"
          ? "Pausar"
          : phase === "paused"
            ? "Continuar"
            : "Repetir"}
      </button>
    </div>
  );
}
