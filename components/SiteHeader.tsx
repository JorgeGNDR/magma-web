"use client";

import { type MouseEvent, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { navigateWithSectionTransition, SECTION_ARRIVAL_EVENT } from "./SectionTransition";
import menuStyles from "./MobileMenu.module.css";
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
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDialogElement>(null);
  const pendingSectionRef = useRef<string | null>(null);

  function navigateFromMenu(event: MouseEvent<HTMLAnchorElement>, id: string) {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    pendingSectionRef.current = id;
    setMenuOpen(false);
  }

  useEffect(() => {
    if (menuOpen || !pendingSectionRef.current) return;
    const id = pendingSectionRef.current;
    const frame = window.requestAnimationFrame(() => {
      pendingSectionRef.current = null;
      // Start the shared pixel transition after the modal releases the page.
      navigateWithSectionTransition(`#${id}`);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [menuOpen]);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const trigger = menuButtonRef.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    menuRef.current?.showModal();
    const desktop = window.matchMedia("(min-width: 801px)");
    const closeOnDesktop = () => { if (desktop.matches) setMenuOpen(false); };
    desktop.addEventListener("change", closeOnDesktop);
    return () => {
      document.body.style.overflow = previousOverflow;
      desktop.removeEventListener("change", closeOnDesktop);
      trigger?.focus({ preventScroll: true });
    };
  }, [menuOpen]);

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

    const handleSectionArrival = () => {
      lastScrollYRef.current = window.scrollY;
      setIsVisible(true);
      setSurface(getHeaderSurface());
    };

    window.addEventListener(SECTION_ARRIVAL_EVENT, handleSectionArrival);
    window.addEventListener("scroll", handleScroll, { passive: true });
    frameRef.current = window.requestAnimationFrame(updateHeader);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener(SECTION_ARRIVAL_EVENT, handleSectionArrival);

      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
      }
    };
  }, []);

  return (
    <header
      className={styles.header}
      data-surface={surface}
      data-visible={isVisible || menuOpen}
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

        <a href="#proyectos" data-label="Trabajos">
          <span>Trabajos</span>
        </a>

        <a href="#contacto" data-label="Contacto">
          <span>Contacto</span>
        </a>
      </nav>

      <button
        ref={menuButtonRef}
        className={menuStyles.trigger}
        type="button"
        aria-label="Abrir menú"
        aria-expanded={menuOpen}
        aria-controls="mobile-navigation"
        aria-haspopup="dialog"
        onClick={() => setMenuOpen(true)}
      ><span className={styles.availabilityDot} aria-hidden="true" /></button>

      {menuOpen && createPortal(
        <dialog ref={menuRef} id="mobile-navigation" className={menuStyles.menu} aria-label="Menú de navegación" onCancel={() => setMenuOpen(false)}>
          <div className={menuStyles.top}>
            <a className={styles.brand} href="#inicio" onClick={(event) => navigateFromMenu(event, "inicio")} aria-label="MAGMA, inicio">MAGMA<sup>®</sup></a>
            <button autoFocus type="button" className={menuStyles.close} aria-label="Cerrar menú" onClick={() => setMenuOpen(false)}>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M6 18 18 6" /></svg>
            </button>
          </div>
          <nav className={menuStyles.links} aria-label="Navegación móvil">
            {[['estudio', 'Estudio'], ['servicios', 'Servicios'], ['proyectos', 'Trabajos'], ['contacto', 'Contacto']].map(([id, title], index) => (
              <a key={id} href={`#${id}`} onClick={(event) => navigateFromMenu(event, id)}><span>0{index + 1}</span>{title}</a>
            ))}
          </nav>
          <p className={menuStyles.footer}>Estudio independiente<br />de música contemporánea</p>
        </dialog>, document.body,
      )}

      <a className={styles.availability} href="#contacto">
        <span className={styles.availabilityDot} aria-hidden="true" />
        <span className={styles.availabilityLabel}>
          Disponible para proyectos
        </span>
      </a>
    </header>
  );
}
