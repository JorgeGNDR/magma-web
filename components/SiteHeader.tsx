"use client";

import { useEffect, useRef, useState } from "react";
import styles from "@/app/page.module.css";

const TOP_THRESHOLD = 24;
const DIRECTION_THRESHOLD = 5;
type HeaderSurface = "dark" | "light";

function getHeaderSurface(): HeaderSurface {
  const header = document.querySelector("header");
  const elements = document.elementsFromPoint(window.innerWidth / 2, 32);

  for (const element of elements) {
    if (header?.contains(element)) continue;

    const colorValues = getComputedStyle(element)
      .backgroundColor.match(/[\d.]+/g)
      ?.map(Number);

    if (!colorValues || colorValues.length < 3) continue;
    if (colorValues.length === 4 && colorValues[3] === 0) continue;

    const [red, green, blue] = colorValues;
    const luminance = (0.2126 * red + 0.7152 * green + 0.0722 * blue) / 255;

    return luminance < 0.55 ? "dark" : "light";
  }

  return "light";
}

export function SiteHeader() {
  const [isVisible, setIsVisible] = useState(true);
  const [surface, setSurface] = useState<HeaderSurface>("light");
  const lastScrollYRef = useRef(0);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    lastScrollYRef.current = window.scrollY;

    const updateHeader = () => {
      const currentScrollY = window.scrollY;
      const scrollDelta = currentScrollY - lastScrollYRef.current;

      setSurface(getHeaderSurface());

      if (currentScrollY <= TOP_THRESHOLD) {
        setIsVisible(true);
      } else if (scrollDelta > DIRECTION_THRESHOLD) {
        setIsVisible(false);
      } else if (scrollDelta < -DIRECTION_THRESHOLD) {
        setIsVisible(true);
      }

      lastScrollYRef.current = currentScrollY;
      frameRef.current = null;
    };

    const handleScroll = () => {
      if (frameRef.current === null) {
        frameRef.current = window.requestAnimationFrame(updateHeader);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    frameRef.current = window.requestAnimationFrame(updateHeader);

    return () => {
      window.removeEventListener("scroll", handleScroll);

      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
      }
    };
  }, []);

  return (
    <header
      className={styles.header}
      data-surface={surface}
      data-visible={isVisible}
    >
      <a className={styles.brand} href="#inicio" aria-label="MAGMA, inicio">
        MAGMA<sup>®</sup>
      </a>

      <nav className={styles.navigation} aria-label="Navegación principal">
        <a href="#estudio" data-label="Estudio">
          <span>Estudio</span>
        </a>

        <a href="#servicios" data-label="Servicios">
          <span>Servicios</span>
        </a>

        <a href="#proyectos" data-label="Proyectos">
          <span>Proyectos</span>
        </a>

        <a href="#contacto" data-label="Contacto">
          <span>Contacto</span>
        </a>
      </nav>

      <a className={styles.availability} href="#contacto">
        <span className={styles.availabilityDot} aria-hidden="true" />
        <span className={styles.availabilityLabel}>
          Disponible para proyectos
        </span>
      </a>
    </header>
  );
}
