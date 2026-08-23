"use client";

import { useEffect, useRef, useState } from "react";
import { audioSignal, resetAudioSignal } from "./audioSignal";
import styles from "./AudioPlayer.module.css";

const AUDIO_SOURCE = "/audio/justanillusion.mp3";

type PlaybackState = "idle" | "loading" | "playing" | "missing";

type AudioGraph = {
  analyser: AnalyserNode;
  audio: HTMLAudioElement;
  context: AudioContext;
  data: Uint8Array<ArrayBuffer>;
  source: MediaElementAudioSourceNode;
};

function averageBand(data: Uint8Array<ArrayBuffer>, start: number, end: number) {
  let sum = 0;
  const safeEnd = Math.min(end, data.length);

  for (let index = start; index < safeEnd; index += 1) {
    sum += data[index];
  }

  return safeEnd > start ? sum / (safeEnd - start) / 255 : 0;
}

export function AudioPlayer() {
  const [playbackState, setPlaybackState] = useState<PlaybackState>("idle");
  const graphRef = useRef<AudioGraph | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  function stopAnalysis() {
    if (animationFrameRef.current !== null) {
      window.cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    resetAudioSignal();
  }

  function startAnalysis(graph: AudioGraph) {
    const analyse = () => {
      graph.analyser.getByteFrequencyData(graph.data);

      const level = averageBand(graph.data, 1, graph.data.length);
      const bass = averageBand(graph.data, 1, 7);
      const mid = averageBand(graph.data, 7, 45);
      const treble = averageBand(graph.data, 45, 140);

      audioSignal.level += (level - audioSignal.level) * 0.28;
      audioSignal.bass += (bass - audioSignal.bass) * 0.34;
      audioSignal.mid += (mid - audioSignal.mid) * 0.24;
      audioSignal.treble += (treble - audioSignal.treble) * 0.2;
      audioSignal.playing = true;

      animationFrameRef.current = window.requestAnimationFrame(analyse);
    };

    analyse();
  }

  function createAudioGraph() {
    const audio = new Audio(AUDIO_SOURCE);
    const context = new AudioContext();
    const analyser = context.createAnalyser();
    const source = context.createMediaElementSource(audio);

    audio.loop = true;
    audio.preload = "auto";
    analyser.fftSize = 512;
    analyser.smoothingTimeConstant = 0.82;
    source.connect(analyser);
    analyser.connect(context.destination);

    const graph: AudioGraph = {
      analyser,
      audio,
      context,
      data: new Uint8Array(analyser.frequencyBinCount),
      source,
    };

    graphRef.current = graph;
    return graph;
  }

  async function togglePlayback() {
    const currentGraph = graphRef.current;

    if (playbackState === "playing" && currentGraph) {
      currentGraph.audio.pause();
      stopAnalysis();
      setPlaybackState("idle");
      return;
    }

    setPlaybackState("loading");
    const graph = currentGraph ?? createAudioGraph();

    try {
      await graph.context.resume();
      await graph.audio.play();
      startAnalysis(graph);
      setPlaybackState("playing");
    } catch {
      stopAnalysis();
      setPlaybackState("missing");
    }
  }

  useEffect(() => {
    return () => {
      const graph = graphRef.current;
      stopAnalysis();

      if (graph) {
        graph.audio.pause();
        graph.source.disconnect();
        graph.analyser.disconnect();
        void graph.context.close();
      }
    };
  }, []);

  const isPlaying = playbackState === "playing";
  const label =
    playbackState === "missing"
      ? "TRACK MISSING"
      : playbackState === "loading"
        ? "LOADING"
        : isPlaying
          ? "PAUSE"
          : "PRESS PLAY";

  return (
    <button
      aria-label={isPlaying ? "Pausar música" : "Reproducir música"}
      aria-pressed={isPlaying}
      className={styles.player}
      data-state={playbackState}
      onClick={togglePlayback}
      type="button"
    >
      <span className={styles.icon} aria-hidden="true">
        {isPlaying ? (
          <span className={styles.pauseIcon} />
        ) : (
          <span className={styles.playIcon} />
        )}
      </span>
      <span>{label}</span>
    </button>
  );
}
