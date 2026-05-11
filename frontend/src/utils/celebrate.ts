const PARTICLE_COLORS = ["#7c5cfc", "#9b5de5", "#bc46dc", "#ffffff", "#f5d06a"];

function shouldReduceMotion(): boolean {
  if (typeof window === "undefined") return true;
  if (document.documentElement.getAttribute("data-reduce-motion") === "true")
    return true;
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
}

/**
 * Fires a small celebratory particle burst at the given viewport coordinates.
 * No-op when reduce-motion is active.
 */
export function burstParticles(x: number, y: number, count = 16) {
  if (shouldReduceMotion()) return;
  if (typeof document === "undefined") return;

  const container = document.createElement("div");
  container.className = "tt-celebrate";
  container.style.left = `${x}px`;
  container.style.top = `${y}px`;
  document.body.appendChild(container);

  for (let i = 0; i < count; i++) {
    const p = document.createElement("div");
    p.className = "tt-celebrate__particle";
    const color = PARTICLE_COLORS[i % PARTICLE_COLORS.length];
    p.style.background = color;
    p.style.color = color;

    const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.4;
    const distance = 55 + Math.random() * 55;
    const dx = Math.cos(angle) * distance;
    const dy = Math.sin(angle) * distance;
    const duration = 800 + Math.random() * 400;

    p.animate(
      [
        { transform: "translate(-50%, -50%) scale(1)", opacity: 1 },
        {
          transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(0.2)`,
          opacity: 0,
        },
      ],
      {
        duration,
        easing: "cubic-bezier(.2,.7,.2,1)",
        fill: "forwards",
      }
    );
    container.appendChild(p);
  }

  window.setTimeout(() => container.remove(), 1400);
}

/**
 * Convenience helper to fire a burst centered on a DOM element.
 */
export function burstFromElement(el: Element | null | undefined) {
  if (!el) return;
  const rect = (el as HTMLElement).getBoundingClientRect();
  burstParticles(rect.left + rect.width / 2, rect.top + rect.height / 2);
}
