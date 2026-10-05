"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import styles from "@/app/page.module.css";

export function FloatingFooter({ children }: { children: ReactNode }) {
  const [visible, setVisible] = useState(false);
  const footerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const hero = document.getElementById("inicio");
    const footer = footerRef.current;
    if (!hero || !footer) return;
    // Show once the studio reaches the footer's area, including partial scrolls.
    let frame: number | null = null;
    const updateVisibility = () => {
      frame = null;
      setVisible(hero.getBoundingClientRect().bottom <= footer.getBoundingClientRect().top);
    };
    const scheduleUpdate = () => {
      if (frame === null) frame = window.requestAnimationFrame(updateVisibility);
    };
    updateVisibility();
    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate);
    const sizeObserver = new ResizeObserver(() => {
      document.documentElement.style.setProperty("--floating-footer-height", `${footer.offsetHeight}px`);
      scheduleUpdate();
    });
    sizeObserver.observe(footer);
    return () => {
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
      if (frame !== null) window.cancelAnimationFrame(frame);
      sizeObserver.disconnect();
      document.documentElement.style.removeProperty("--floating-footer-height");
    };
  }, []);

  return (
    <footer ref={footerRef} className={styles.footer} data-visible={visible} inert={!visible} aria-hidden={!visible}>
      {children}
    </footer>
  );
}
