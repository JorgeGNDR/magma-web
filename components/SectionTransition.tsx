"use client";

import type { CSSProperties } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import styles from "./SectionTransition.module.css";

const COLUMN_COUNT = 10;
const CELL_FADE_MS = 20;
const TRANSITION_BUFFER_MS = 50;
const DESKTOP_MOTION_QUERY =
  "(min-width: 801px) and (prefers-reduced-motion: no-preference)";

type TransitionPhase = "idle" | "covering" | "revealing";

type PixelStyle = CSSProperties & {
  "--section-transition-delay": string;
};

type OverlayStyle = CSSProperties & {
  "--section-transition-color": string;
  "--section-transition-cols": number;
};

function getRowCount() {
  const cellSize = window.innerWidth / COLUMN_COUNT;
  return Math.max(1, Math.ceil(window.innerHeight / cellSize));
}

function getPixelDelay(row: number, column: number, rowCount: number) {
  const distanceFromBottom = rowCount - row - 1;
  const verticalDelay = distanceFromBottom * 0.055;
  const irregularity = (Math.sin(column * 1.73 + row * 0.91) + 1) * 0.024;
  const smallStep = ((column * 7 + row * 3) % 5) * 0.006;

  return 0.045 + verticalDelay + irregularity + smallStep;
}

function getDestinationColor(target: HTMLElement) {
  let element: HTMLElement | null = target;

  while (element) {
    const backgroundColor = window.getComputedStyle(element).backgroundColor;
    const alpha = backgroundColor.match(/rgba?\([^)]*(?:,|\s\/\s)([\d.]+)\)$/)?.[1];

    if (backgroundColor !== "transparent" && alpha !== "0") {
      return backgroundColor;
    }

    element = element.parentElement;
  }

  return window
    .getComputedStyle(document.documentElement)
    .getPropertyValue("--color-brand-off-white")
    .trim();
}

function jumpToSection(target: HTMLElement, hash: string) {
  const root = document.documentElement;
  const previousScrollBehavior = root.style.scrollBehavior;

  root.style.scrollBehavior = "auto";
  target.scrollIntoView({ block: "start" });
  window.history.pushState(null, "", hash);

  window.requestAnimationFrame(() => {
    root.style.scrollBehavior = previousScrollBehavior;
  });
}

export function SectionTransition() {
  const [isEnabled, setIsEnabled] = useState(false);
  const [phase, setPhase] = useState<TransitionPhase>("idle");
  const [rowCount, setRowCount] = useState(6);
  const [color, setColor] = useState("var(--color-brand-magma-orange)");
  const runningRef = useRef(false);
  const timerIdsRef = useRef<number[]>([]);
  const longestDelayRef = useRef(0);

  const pixels = useMemo(
    () =>
      Array.from({ length: COLUMN_COUNT * rowCount }, (_, index) => {
        const row = Math.floor(index / COLUMN_COUNT);
        const column = index % COLUMN_COUNT;
        const delay = getPixelDelay(row, column, rowCount);

        return { delay, index };
      }),
    [rowCount],
  );

  const longestDelayMs = useMemo(
    () => Math.max(...pixels.map((pixel) => pixel.delay)) * 1000,
    [pixels],
  );

  useEffect(() => {
    longestDelayRef.current = longestDelayMs;
  }, [longestDelayMs]);

  useEffect(() => {
    const mediaQuery = window.matchMedia(DESKTOP_MOTION_QUERY);
    const updateEnabledState = () => setIsEnabled(mediaQuery.matches);

    updateEnabledState();
    mediaQuery.addEventListener("change", updateEnabledState);

    return () => mediaQuery.removeEventListener("change", updateEnabledState);
  }, []);

  useEffect(() => {
    if (!isEnabled) return;

    const updateRows = () => setRowCount(getRowCount());

    updateRows();
    window.addEventListener("resize", updateRows);

    return () => window.removeEventListener("resize", updateRows);
  }, [isEnabled]);

  useEffect(() => {
    const wait = (duration: number) =>
      new Promise<void>((resolve) => {
        const timerId = window.setTimeout(() => {
          timerIdsRef.current = timerIdsRef.current.filter(
            (activeTimerId) => activeTimerId !== timerId,
          );
          resolve();
        }, duration);
        timerIdsRef.current.push(timerId);
      });

    const handleClick = async (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      const clickedElement = event.target;
      if (!(clickedElement instanceof Element)) return;

      const anchor = clickedElement.closest<HTMLAnchorElement>(
        'header nav a[href^="#"]',
      );
      const hash = anchor?.getAttribute("href");

      if (!anchor || !hash || hash === "#") return;

      const target = document.querySelector<HTMLElement>(hash);
      if (!target) return;

      if (!window.matchMedia(DESKTOP_MOTION_QUERY).matches) return;

      event.preventDefault();
      if (runningRef.current) return;

      runningRef.current = true;
      setColor(getDestinationColor(target));
      setPhase("covering");

      const phaseDuration =
        longestDelayRef.current + CELL_FADE_MS + TRANSITION_BUFFER_MS;

      await wait(phaseDuration);
      jumpToSection(target, hash);
      await wait(TRANSITION_BUFFER_MS);
      setPhase("revealing");

      await wait(phaseDuration);
      setPhase("idle");
      runningRef.current = false;
    };

    document.addEventListener("click", handleClick);

    return () => {
      document.removeEventListener("click", handleClick);
      timerIdsRef.current.forEach((timerId) => window.clearTimeout(timerId));
      timerIdsRef.current = [];
    };
  }, []);

  const overlayStyle: OverlayStyle = {
    "--section-transition-color": color,
    "--section-transition-cols": COLUMN_COUNT,
  };

  if (!isEnabled) return null;

  return (
    <div
      aria-hidden="true"
      className={styles.overlay}
      data-phase={phase}
      style={overlayStyle}
    >
      <div className={styles.pixels}>
        {pixels.map((pixel) => {
          const pixelStyle: PixelStyle = {
            "--section-transition-delay": `${pixel.delay.toFixed(3)}s`,
          };

          return (
            <span
              className={styles.cell}
              key={pixel.index}
              style={pixelStyle}
            />
          );
        })}
      </div>
    </div>
  );
}
