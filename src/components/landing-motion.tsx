"use client";

import { useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export function LandingMotion() {
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const root = document.getElementById("conteudo")!;
    const media = gsap.matchMedia();
    media.add(
      "(prefers-reduced-motion: no-preference)",
      () => {
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
        const folder = root.querySelector(".delivery-folder")!;
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
      },
      root,
    );
    return () => media.revert();
  }, []);
  return null;
}
