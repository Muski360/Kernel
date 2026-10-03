"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { gsap } from "gsap";
import { MorphSVGPlugin } from "gsap/MorphSVGPlugin";
import { kernelPath } from "@/lib/brand/kernel-path";

// A straightened pair of KERNEL lobes: full round ends and an organic waist.
// The center stays on the pointer hotspot throughout text selection.
const textPath = `M650 -460
  C821 -460 960 -321 960 -150 C960 -10 865 52 812 130
  C770 190 745 260 745 350 C745 440 770 510 812 570
  C865 648 960 710 960 850 C960 1021 821 1160 650 1160
  C479 1160 340 1021 340 850 C340 710 435 648 488 570
  C530 510 555 440 555 350 C555 260 530 190 488 130
  C435 52 340 -10 340 -150 C340 -321 479 -460 650 -460 Z`;

export function KernelCursor() {
  const pathname = usePathname();
  const cursorRef = useRef<HTMLDivElement>(null);
  const refreshRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    gsap.registerPlugin(MorphSVGPlugin);
    const cursor = cursorRef.current!;
    const html = document.documentElement;
    const media = gsap.matchMedia();
    media.add(
      "(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference) and (forced-colors: none)",
      () => {
        let x = 0;
        let y = 0;
        let frame = 0;
        let inside = false;
        let selecting = false;
        let textMode = false;
        let surfaceTarget: Element | null = null;
        const shape = cursor.querySelector("path")!;
        const morph = gsap.to(shape, {
          morphSVG: textPath,
          duration: 0.3,
          ease: "power2.inOut",
          paused: true,
        });

        function hide() {
          cursor.removeAttribute("data-visible");
          cursor.removeAttribute("data-pressed");
          html.classList.remove("kernel-pointer");
        }

        function render() {
          frame = 0;
          if (!inside) return;
          const target = document.elementFromPoint(x, y);
          const interactive = target?.closest("a, button, summary, [role='button']");
          const input = target instanceof HTMLInputElement ? target : null;
          const textInput = input &&
            ["text", "search", "email", "url", "tel", "password"].includes(input.type);
          // Native UI (menus, resizing, explicit opt-outs) retains its own cursor.
          if (
            !target ||
            x >= html.clientWidth ||
            target.closest("select, textarea, [data-native-cursor], :disabled") ||
            (input && !textInput)
          ) {
            hide();
            return;
          }
          // Resolve the painted surface, including dark objects in light sections.
          // Cache the hit element so ordinary pointer movement needs no ancestor scan.
          if (target !== surfaceTarget) {
            surfaceTarget = target;
            let surface: Element | null = target;
            while (surface) {
              const style = getComputedStyle(surface);
              const paint = surface instanceof SVGGeometryElement && style.fill !== "none" && Number(style.fillOpacity) > 0
                ? style.fill : style.backgroundColor;
              const rgba = paint.match(/[\d.]+/g)?.map(Number);
              if (rgba && (rgba[3] ?? 1) > 0) {
                const brightness = rgba[0] * 0.299 + rgba[1] * 0.587 + rgba[2] * 0.114;
                cursor.setAttribute("data-surface", brightness > 150 ? "light" : "dark");
                break;
              }
              surface = surface.parentElement;
            }
          }
          const text = selecting || (
            !interactive && getComputedStyle(target).userSelect !== "none" &&
            Boolean(
              textInput || (target instanceof HTMLElement && target.isContentEditable) ||
              target.closest("p, h1, h2, h3, h4, h5, h6, li, dt, dd, figcaption, pre, code, label") ||
              [...target.childNodes].some(node => node.nodeType === Node.TEXT_NODE && node.textContent?.trim()),
            )
          );
          const state = text ? "text" : interactive ? "link" : "default";
          if (text !== textMode) {
            textMode = text;
            if (textMode) morph.play();
            else morph.reverse();
          }
          cursor.style.transform = `translate3d(${x - 12}px, ${y - 12}px, 0)`;
          cursor.setAttribute("data-state", state);
          cursor.toggleAttribute("data-interactive", state === "link");
          cursor.toggleAttribute("data-selecting", selecting);
          cursor.setAttribute("data-visible", "");
          html.classList.add("kernel-pointer");
        }

        function schedule() {
          if (inside && !frame) frame = requestAnimationFrame(render);
        }
        function move(event: PointerEvent) {
          if (event.pointerType !== "mouse") return leave();
          x = event.clientX;
          y = event.clientY;
          inside = true;
          if (!(event.buttons & 1)) {
            selecting = false;
            cursor.removeAttribute("data-pressed");
          }
          schedule();
        }
        function leave() {
          inside = false;
          surfaceTarget = null;
          hide();
        }
        function refreshSurface() {
          surfaceTarget = null;
          schedule();
        }
        refreshRef.current = refreshSurface;
        function press(event: PointerEvent) {
          if (event.pointerType !== "mouse" || event.button !== 0) return;
          x = event.clientX;
          y = event.clientY;
          inside = true;
          cancelAnimationFrame(frame);
          render();
          selecting = cursor.hasAttribute("data-visible") && textMode;
          cursor.toggleAttribute("data-selecting", selecting);
          cursor.setAttribute("data-pressed", "");
        }
        function release() {
          selecting = false;
          cursor.removeAttribute("data-pressed");
          cursor.removeAttribute("data-selecting");
          schedule();
        }
        function onKey(event: KeyboardEvent) {
          if (event.key === "Tab") leave();
        }

        window.addEventListener("pointermove", move, { passive: true });
        window.addEventListener("pointerdown", press);
        window.addEventListener("pointerup", release);
        window.addEventListener("pointercancel", release);
        window.addEventListener("scroll", refreshSurface, { passive: true });
        window.addEventListener("resize", refreshSurface, { passive: true });
        window.addEventListener("blur", leave);
        document.addEventListener("pointerleave", leave);
        document.addEventListener("keydown", onKey);
        document.addEventListener("dragstart", leave);
        return () => {
          refreshRef.current = null;
          cancelAnimationFrame(frame);
          leave();
          window.removeEventListener("pointermove", move);
          window.removeEventListener("pointerdown", press);
          window.removeEventListener("pointerup", release);
          window.removeEventListener("pointercancel", release);
          window.removeEventListener("scroll", refreshSurface);
          window.removeEventListener("resize", refreshSurface);
          window.removeEventListener("blur", leave);
          document.removeEventListener("pointerleave", leave);
          document.removeEventListener("keydown", onKey);
          document.removeEventListener("dragstart", leave);
        };
      },
    );
    return () => media.revert();
  }, []);

  useEffect(() => refreshRef.current?.(), [pathname]);

  return (
    <div ref={cursorRef} className="kernel-cursor" aria-hidden="true">
      <svg viewBox="-1000 -1000 2000 2000">
        <g transform="translate(-650 -350)">
          <path d={kernelPath} />
        </g>
      </svg>
    </div>
  );
}
