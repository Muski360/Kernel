"use client";

import { useState } from "react";
import { steps, totalMinutes } from "@/content/process";

export function ProcessDial() {
  const [active, setActive] = useState<number | null>(null);
  const selected = active === null ? null : steps[active];

  return (
    <figure className="process-dial">
      <div className="dial-drawing">
        <svg viewBox="0 0 520 520" className="dial-svg" aria-hidden="true">
          {Array.from({ length: 12 }, (_, i) => (
            <line
              key={i}
              x1="260"
              y1={i % 3 === 0 ? "19" : "25"}
              x2="260"
              y2="31"
              transform={`rotate(${i * 30} 260 260)`}
              className={i % 3 === 0 ? "dial-tick major" : "dial-tick"}
            />
          ))}
          {steps.map((step, index) => {
            const elapsed = steps
              .slice(0, index)
              .reduce((sum, item) => sum + item.minutes, 0);
            const rotation = (elapsed / totalMinutes) * 360 - 90;
            return (
              <circle
                key={step.number}
                cx="260"
                cy="260"
                r="207"
                pathLength={totalMinutes}
                strokeDasharray={`${step.minutes - 0.42} ${totalMinutes - step.minutes + 0.42}`}
                transform={`rotate(${rotation} 260 260)`}
                className={`dial-segment ${active === null || active === index ? "active" : ""}`}
                style={{ animationDelay: `${index * 60}ms` }}
              />
            );
          })}
        </svg>
        <div className="dial-center" aria-live="polite" aria-atomic="true">
          <span
            className="dial-value"
            key={active ?? "total"}
            data-selected={selected ? "" : undefined}
          >
            {String(selected?.minutes ?? totalMinutes).padStart(2, "0")}
            <span>min</span>
          </span>
          <span className="dial-description">
            {selected ? selected.name : "Prazo proposto"}
          </span>
        </div>
      </div>
      <div
        className="dial-controls"
        aria-label="Explore o planejamento por etapa"
      >
        {steps.map((step, index) => (
          <button
            key={step.number}
            type="button"
            aria-pressed={active === index}
            onClick={() => setActive(active === index ? null : index)}
          >
            <span className="mono">{step.number}</span>{" "}
            <span>{step.name}</span>
            <span className="sr-only">: {step.minutes} minutos previstos</span>
          </button>
        ))}
      </div>
      <figcaption>Explore o tempo previsto em cada etapa.</figcaption>
    </figure>
  );
}
