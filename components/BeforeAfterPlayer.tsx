"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./BeforeAfterPlayer.module.css";

type Version = "before" | "after";

const comparison = {
  title: "Primera comparativa",
  service: "Mezcla + mastering",
  beforeSrc: "/audio/justanillusion.mp3",
  afterSrc: "/audio/justanillusion.mp3",
} as const;

function formatTime(value: number) {
  if (!Number.isFinite(value)) return "0:00";
  const minutes = Math.floor(value / 60);
  const seconds = Math.floor(value % 60);
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export function BeforeAfterPlayer() {
  const beforeRef = useRef<HTMLAudioElement>(null);
  const afterRef = useRef<HTMLAudioElement>(null);
  const [activeVersion, setActiveVersion] = useState<Version>("before");
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const before = beforeRef.current;
    const after = afterRef.current;
    if (!before || !after) return;

    before.muted = activeVersion !== "before";
    after.muted = activeVersion !== "after";

    if (Math.abs(before.currentTime - after.currentTime) > 0.05) {
      after.currentTime = before.currentTime;
    }
  }, [activeVersion]);

  useEffect(() => {
    const before = beforeRef.current;
    const after = afterRef.current;

    return () => {
      before?.pause();
      after?.pause();
    };
  }, []);

  const togglePlayback = async () => {
    const before = beforeRef.current;
    const after = afterRef.current;
    if (!before || !after) return;

    if (isPlaying) {
      before.pause();
      after.pause();
      setIsPlaying(false);
      return;
    }

    try {
      after.currentTime = before.currentTime;
      await Promise.all([before.play(), after.play()]);
      setHasError(false);
      setIsPlaying(true);
    } catch {
      setHasError(true);
      setIsPlaying(false);
    }
  };

  const seek = (value: number) => {
    const before = beforeRef.current;
    const after = afterRef.current;
    if (!before || !after) return;

    before.currentTime = value;
    after.currentTime = value;
    setCurrentTime(value);
  };

  const reset = () => {
    beforeRef.current?.pause();
    afterRef.current?.pause();
    seek(0);
    setIsPlaying(false);
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const isAfter = activeVersion === "after";

  return (
    <div className={styles.comparison}>
      <div className={styles.intro}>
        <span className={styles.eyebrow}>Escucha la diferencia</span>
        <h4>El mismo momento. Dos resultados.</h4>
        <p>
          Cambia entre la sesión original y el resultado final sin perder el
          punto de reproducción.
        </p>
      </div>

      <div className={styles.player}>
        <div className={styles.playerHeader}>
          <div>
            <span>Demo A/B · Audios en preparación</span>
            <strong>{comparison.title}</strong>
          </div>
          <span>{comparison.service}</span>
        </div>

        <div className={styles.playerBody}>
          <button
            aria-label={isPlaying ? "Pausar audio" : "Reproducir audio"}
            className={styles.playButton}
            onClick={togglePlayback}
            type="button"
          >
            <span aria-hidden="true">{isPlaying ? "■" : "▶"}</span>
          </button>

          <div className={styles.progressArea}>
            <input
              aria-label="Posición de reproducción"
              className={styles.timeline}
              max={duration || 0}
              min="0"
              onInput={(event) => seek(Number(event.currentTarget.value))}
              step="0.01"
              style={{ "--progress": `${progress}%` } as React.CSSProperties}
              type="range"
              value={Math.min(currentTime, duration || 0)}
            />
            <div className={styles.timeRow}>
              <span>{isPlaying ? "Reproduciendo" : "Pausado"}</span>
              <span>
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>
          </div>

          <div className={styles.versionControl}>
            <span className={!isAfter ? styles.selectedLabel : ""}>Antes</span>
            <button
              aria-checked={isAfter}
              aria-label="Cambiar entre audio antes y después"
              className={`${styles.toggle} ${isAfter ? styles.toggleOn : ""}`}
              onClick={() => setActiveVersion(isAfter ? "before" : "after")}
              role="switch"
              type="button"
            >
              <span />
            </button>
            <span className={isAfter ? styles.selectedLabel : ""}>Después</span>
          </div>
        </div>

        <p className={styles.status}>
          {hasError
            ? "No se ha podido cargar el audio"
            : "El cambio mantiene el mismo punto de reproducción"}
        </p>

        <audio
          onEnded={reset}
          onError={() => setHasError(true)}
          onLoadedMetadata={(event) => setDuration(event.currentTarget.duration)}
          onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
          preload="metadata"
          ref={beforeRef}
          src={comparison.beforeSrc}
        />
        <audio preload="metadata" ref={afterRef} src={comparison.afterSrc} />
      </div>
    </div>
  );
}
