"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { KernelCursor } from "./kernel-cursor";

export function SiteMotion() {
  const pathname = usePathname();

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const root = document.getElementById("conteudo");
    if (!root) return;
    const media = gsap.matchMedia();
    media.add(
      "(prefers-reduced-motion: no-preference) and (forced-colors: none)",
      () => {
        // One clock for scrolling and ScrollTrigger. Touch keeps native inertia.
        const lenis = new Lenis({ lerp: 0.12, stopInertiaOnNavigate: true });
        const tick = (time: number) => lenis.raf(time * 1000);
        lenis.on("scroll", ScrollTrigger.update);
        gsap.ticker.add(tick);
        gsap.ticker.lagSmoothing(0);

        function interrupt() {
          lenis.scrollTo(lenis.actualScroll, { immediate: true });
        }
        function onKey(event: KeyboardEvent) {
          if (
            ["Tab", " ", "Home", "End", "PageUp", "PageDown", "ArrowUp", "ArrowDown"].includes(event.key)
          ) interrupt();
        }
        function onAnchor(event: MouseEvent) {
          if (
            event.defaultPrevented || event.button !== 0 || event.metaKey ||
            event.ctrlKey || event.shiftKey || event.altKey
          ) return;
          const link = (event.target as Element).closest<HTMLAnchorElement>("a[href]");
          if (!link || link.target || link.hasAttribute("download") || link.classList.contains("skip-link")) return;
          const url = new URL(link.href);
          if (
            url.origin !== location.origin || url.pathname !== location.pathname ||
            url.search !== location.search || !url.hash
          ) return;
          const target = document.getElementById(decodeURIComponent(url.hash.slice(1)));
          if (!target) return;
          // Capture before Next Link: one scroll owner, normal URL/history and focus.
          event.preventDefault();
          if (location.hash !== url.hash) history.pushState(null, "", url);
          lenis.scrollTo(target, {
            onComplete: () => {
              if (!target.hasAttribute("tabindex")) target.tabIndex = -1;
              target.focus({ preventScroll: true });
            },
          });
        }
        document.addEventListener("click", onAnchor, true);
        document.addEventListener("keydown", onKey);
        document.addEventListener("focusin", interrupt);
        window.addEventListener("pointerdown", interrupt);
        window.addEventListener("popstate", interrupt);

        return () => {
          document.removeEventListener("click", onAnchor, true);
          document.removeEventListener("keydown", onKey);
          document.removeEventListener("focusin", interrupt);
          window.removeEventListener("pointerdown", interrupt);
          window.removeEventListener("popstate", interrupt);
          gsap.ticker.remove(tick);
          lenis.destroy();
          gsap.ticker.lagSmoothing(500, 33);
        };
      },
      root,
    );
    return () => media.revert();
  }, [pathname]);
  return <KernelCursor />;
}
