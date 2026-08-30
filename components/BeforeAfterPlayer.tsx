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

const waveform = [
  24, 48, 34, 68, 52, 82, 43, 65, 92, 58, 73, 38, 62, 88, 55, 76, 46, 95,
  69, 42, 81, 57, 91, 50, 72, 39, 64, 85, 48, 74, 56, 90, 67, 44, 78, 53,
  86, 61, 35, 70, 49, 80, 58, 93, 65, 41, 75, 51,
];

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

        <div aria-label="Versión de audio" className={styles.switcher} role="group">
          <button
            aria-pressed={activeVersion === "before"}
            className={activeVersion === "before" ? styles.active : ""}
            onClick={() => setActiveVersion("before")}
            type="button"
          >
            <span>01</span>
            Antes
          </button>
          <button
            aria-pressed={activeVersion === "after"}
            className={activeVersion === "after" ? styles.active : ""}
            onClick={() => setActiveVersion("after")}
            type="button"
          >
            <span>02</span>
            Después
          </button>
        </div>

        <div aria-hidden="true" className={styles.waveform}>
          {waveform.map((height, index) => (
            <i
              className={index / waveform.length <= progress / 100 ? styles.played : ""}
              key={`${height}-${index}`}
              style={{ height: `${height}%` }}
            />
          ))}
        </div>

        <input
          aria-label="Posición de reproducción"
          className={styles.timeline}
          max={duration || 0}
          min="0"
          onChange={(event) => seek(Number(event.target.value))}
          step="0.01"
          style={{ "--progress": `${progress}%` } as React.CSSProperties}
          type="range"
          value={Math.min(currentTime, duration || 0)}
        />

        <div className={styles.transport}>
          <button onClick={togglePlayback} type="button">
            <span aria-hidden="true">{isPlaying ? "■" : "▶"}</span>
            {isPlaying ? "Pausa" : "Escuchar"}
          </button>
          <span>
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
          <p>{hasError ? "No se ha podido cargar el audio" : "Cambia de versión en cualquier momento"}</p>
        </div>

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
