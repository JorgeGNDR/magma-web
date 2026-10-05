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
    const observer = new IntersectionObserver(([entry]) => {
      setVisible(!entry.isIntersecting && entry.boundingClientRect.bottom <= 0);
    });
    observer.observe(hero);
    const sizeObserver = new ResizeObserver(() => {
      document.documentElement.style.setProperty("--floating-footer-height", `${footer.offsetHeight}px`);
    });
    sizeObserver.observe(footer);
    return () => {
      observer.disconnect();
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
