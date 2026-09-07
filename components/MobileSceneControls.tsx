"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";
import styles from "./MobileSceneControls.module.css";

export function MobileSceneControls({
  children,
  label,
}: {
  children: ReactNode;
  label: string;
}) {
  const [active, setActive] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) setActive(false);
    });
    if (root.current) observer.observe(root.current);
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") setActive(false);
    };
    window.addEventListener("keydown", close);
    return () => {
      observer.disconnect();
      window.removeEventListener("keydown", close);
    };
  }, []);

  return (
    <div ref={root} className={styles.root} data-active={active}>
      {children}
      {!active && <div className={styles.scrollShield} aria-hidden="true" />}
      <button
        className={styles.toggle}
        type="button"
        aria-pressed={active}
        onClick={() => setActive((value) => !value)}
      >
        {active ? "Terminar · seguir bajando ↓" : label}
      </button>
    </div>
  );
}
