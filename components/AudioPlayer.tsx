"use client";

import {
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  AUDIO_BAND_COUNT,
  audioSignal,
  resetAudioSignal,
} from "./audioSignal";
import styles from "./AudioPlayer.module.css";

const TRACK_URL = "/audio/justanillusion.mp3";

const LOW_BAND_MIN_HZ = 20;
const LOW_BAND_MAX_HZ = 120;
const MAX_ANALYSED_HZ = 16_000;

type PlaybackState = "idle" | "loading" | "playing" | "missing";

type AudioGraph = {
  analyser: AnalyserNode;
  audio: HTMLAudioElement;
  context: AudioContext;
  data: Uint8Array<ArrayBuffer>;
  source: MediaElementAudioSourceNode;
};

function releaseMouseFocus(event: ReactPointerEvent<HTMLElement>) {
  if (event.pointerType === "mouse") {
    event.currentTarget.blur();
  }
}

function averageBand(data: Uint8Array<ArrayBuffer>, start: number, end: number) {
  let sum = 0;
  const safeEnd = Math.min(end, data.length);

  for (let index = start; index < safeEnd; index += 1) {
    sum += data[index];
  }

  return safeEnd > start ? sum / (safeEnd - start) / 255 : 0;
}

function frequencyBand(
  data: Uint8Array<ArrayBuffer>,
  startHz: number,
  endHz: number,
  sampleRate: number,
  fftSize: number,
) {
  const binWidth = sampleRate / fftSize;
  const startBin = Math.max(1, Math.ceil(startHz / binWidth));
  const endBin = Math.max(startBin + 1, Math.ceil(endHz / binWidth));

  return averageBand(data, startBin, endBin);
}

function spatialBand(graph: AudioGraph, bandIndex: number) {
  if (bandIndex === 0) {
    return frequencyBand(
      graph.data,
      LOW_BAND_MIN_HZ,
      LOW_BAND_MAX_HZ,
      graph.context.sampleRate,
      graph.analyser.fftSize,
    );
  }

  const upperFrequency = Math.min(
    MAX_ANALYSED_HZ,
    graph.context.sampleRate / 2,
  );
  const remainingBandCount = AUDIO_BAND_COUNT - 1;
  const logarithmicRatio = upperFrequency / LOW_BAND_MAX_HZ;
  const logarithmicIndex = bandIndex - 1;
  const startHz =
    LOW_BAND_MAX_HZ *
    logarithmicRatio ** (logarithmicIndex / remainingBandCount);
  const endHz =
    LOW_BAND_MAX_HZ *
    logarithmicRatio ** ((logarithmicIndex + 1) / remainingBandCount);

  return frequencyBand(
    graph.data,
    startHz,
    endHz,
    graph.context.sampleRate,
    graph.analyser.fftSize,
  );
}

export function AudioPlayer() {
  const [playbackState, setPlaybackState] = useState<PlaybackState>("idle");
  const [progress, setProgress] = useState(0);
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

      for (let index = 0; index < AUDIO_BAND_COUNT; index += 1) {
        const target = spatialBand(graph, index);
        const current = audioSignal.bands[index];
        const response = target > current ? 0.42 : 0.16;

        audioSignal.bands[index] += (target - current) * response;
      }

      audioSignal.playing = true;
      animationFrameRef.current = window.requestAnimationFrame(analyse);
    };

    analyse();
  }

  function updateProgress(audio: HTMLAudioElement) {
    const duration = Number.isFinite(audio.duration) ? audio.duration : 0;
    setProgress(duration > 0 ? audio.currentTime / duration : 0);
  }

  function createAudioGraph() {
    const audio = new Audio(TRACK_URL);
    const context = new AudioContext();
    const analyser = context.createAnalyser();
    const source = context.createMediaElementSource(audio);

    audio.preload = "auto";
    audio.loop = true;
    analyser.fftSize = 2048;
    analyser.smoothingTimeConstant = 0.68;
    source.connect(analyser);
    analyser.connect(context.destination);

    const graph: AudioGraph = {
      analyser,
      audio,
      context,
      data: new Uint8Array(analyser.frequencyBinCount),
      source,
    };

    audio.addEventListener("timeupdate", () => updateProgress(audio));
    audio.addEventListener("loadedmetadata", () => updateProgress(audio));


    graphRef.current = graph;
    return graph;
  }

  async function playGraph(graph: AudioGraph) {
    setPlaybackState("loading");

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

  async function togglePlayback() {
    const currentGraph = graphRef.current;

    if (playbackState === "playing" && currentGraph) {
      currentGraph.audio.pause();
      stopAnalysis();
      setPlaybackState("idle");
      return;
    }

    const graph = currentGraph ?? createAudioGraph();
    await playGraph(graph);
  }

  function seek(nextProgress: number) {
    const graph = graphRef.current;
    if (!graph || !Number.isFinite(graph.audio.duration)) return;

    graph.audio.currentTime = graph.audio.duration * nextProgress;
    setProgress(nextProgress);
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
  const statusLabel =
    playbackState === "missing"
      ? "TRACK MISSING"
      : playbackState === "loading"
        ? "LOADING"
        : null;
  const progressStyle = {
    "--audio-progress": `${progress * 100}%`,
  } as CSSProperties;

  return (
    <div className={styles.playerShell} data-playing={isPlaying}>
      <div className={styles.compactRow}>
        <div className={styles.progressSlot} aria-hidden={!isPlaying}>
          <input
            aria-label="Progreso de la canción"
            className={styles.progress}
            max={1}
            min={0}
            onChange={(event) => seek(Number(event.currentTarget.value))}
            onPointerUp={releaseMouseFocus}
            step={0.001}
            style={progressStyle}
            tabIndex={isPlaying ? 0 : -1}
            type="range"
            value={progress}
          />
        </div>

        <button
          aria-label={isPlaying ? "Pausar música" : "Reproducir música"}
          aria-pressed={isPlaying}
          className={styles.transport}
          data-state={playbackState}
          onClick={() => void togglePlayback()}
          onPointerUp={releaseMouseFocus}
          type="button"
        >
          <span className={styles.icon} aria-hidden="true">
            <span className={styles.transportShape} />
          </span>
          <span
            className={styles.labelViewport}
            data-status={statusLabel ? "true" : "false"}
          >
            <span className={styles.labelRail}>
              <span>PRESS PLAY</span>
              <span>PRESS PAUSE</span>
            </span>
            {statusLabel ? (
              <span className={styles.statusLabel}>{statusLabel}</span>
            ) : null}
          </span>
        </button>
      </div>


    </div>
  );
}
