"use client";

import { useState } from "react";
import { steps } from "./process";

export function ProcessDial() {
  const [active, setActive] = useState<number | null>(null);
  const selected = active === null ? null : steps[active];

  return (
    <figure className="process-dial">
      <div className="dial-drawing">
        <svg viewBox="0 0 520 520" className="dial-svg" aria-hidden="true">
          <circle cx="260" cy="260" r="244" className="dial-hairline" />
          <circle cx="260" cy="260" r="171" className="dial-hairline" />
          <circle
            cx="260"
            cy="260"
            r="144"
            className="dial-hairline dial-dashed"
          />
          <path
            d="M260 0v30M260 490v30M0 260h30M490 260h30"
            className="dial-hairline"
          />
          {Array.from({ length: 60 }, (_, i) => (
            <line
              key={i}
              x1="260"
              y1={i % 5 === 0 ? "28" : "35"}
              x2="260"
              y2="43"
              transform={`rotate(${i * 6} 260 260)`}
              className={i % 5 === 0 ? "dial-tick major" : "dial-tick"}
            />
          ))}
          {steps.map((step, index) => {
            const elapsed = steps
              .slice(0, index)
              .reduce((sum, item) => sum + item.minutes, 0);
            const rotation = (elapsed / 30) * 360 - 90;
            const middle =
              ((((elapsed + step.minutes / 2) / 30) * 360 - 90) * Math.PI) /
              180;
            return (
              <g key={step.number}>
                <circle
                  cx="260"
                  cy="260"
                  r="199"
                  pathLength="30"
                  strokeDasharray={`${step.minutes - 0.45} ${30 - step.minutes + 0.45}`}
                  transform={`rotate(${rotation} 260 260)`}
                  className={`dial-segment ${active === null || active === index ? "active" : ""}`}
                  style={{ animationDelay: `${index * 90}ms` }}
                />
                <text
                  x={(260 + 182 * Math.cos(middle)).toFixed(3)}
                  y={(264 + 182 * Math.sin(middle)).toFixed(3)}
                  textAnchor="middle"
                >
                  {step.number}
                </text>
              </g>
            );
          })}
          <path
            className="dial-cross"
            d="M247 109h26m-13-13v26M247 409h26m-13-13v26"
          />
        </svg>
        <div className="dial-center" aria-live="polite" aria-atomic="true">
          <span className="dial-value" key={active ?? "total"}>
            {selected ? String(selected.minutes).padStart(2, "0") : "30"}
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
