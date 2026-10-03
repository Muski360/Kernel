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

        gsap.utils
          .toArray<HTMLElement>(".example-visual", root)
          .forEach((visual, index) => {
            gsap.from(visual, {
              y: 55,
              clipPath: "inset(16% 0 0 0)",
              duration: 1.1,
              delay: index * 0.09,
              ease: "power3.out",
              scrollTrigger: { trigger: visual, start: "top 92%", once: true },
            });
          });
        const folder = root.querySelector(".delivery-folder");
        if (folder) {
          gsap
            .timeline({
              scrollTrigger: {
                trigger: folder.closest(".delivery-art"),
                start: "top 90%",
                end: "center 55%",
                scrub: 0.7,
              },
            })
            .from(folder, { y: 70, rotation: -16, ease: "none", duration: 1 })
            .from(
              folder.querySelectorAll(".folder-row"),
              { x: 18, opacity: 0, stagger: 0.1, duration: 0.4 },
              0.35,
            );
        }
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
