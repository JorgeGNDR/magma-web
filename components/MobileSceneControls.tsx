"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import styles from "./MobileSceneControls.module.css";

export function MobileSceneControls({ children, label }: { children: ReactNode; label: string }) {
  const [active, setActive] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!active) return;
    const trigger = toggle.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialog.current?.showModal();
    return () => {
      document.body.style.overflow = previousOverflow;
      trigger?.focus();
    };
  }, [active]);

  return (
    <div className={styles.root}>
      {!active && children}
      <div className={styles.scrollShield} aria-hidden="true" />
      <button ref={toggle} className={styles.toggle} type="button" onClick={() => setActive(true)}>
        {label}
      </button>
      {active && createPortal(
        <dialog ref={dialog} className={styles.fullscreen} aria-label="Explorar el estudio" onCancel={() => setActive(false)}>
          <div className={styles.experience}>{children}</div>
          <button autoFocus className={styles.close} type="button" onClick={() => setActive(false)}>Cerrar ✕</button>
          <p className={styles.hint}>Arrastra para girar · Pellizca para zoom · Toca un equipo</p>
        </dialog>, document.body,
      )}
    </div>
  );
}
