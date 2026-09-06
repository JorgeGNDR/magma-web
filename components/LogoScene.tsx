"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import type { ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import { audioSignal } from "./audioSignal";
import { Original3DLogo } from "./Original3DLogo";
import { brandColors, palette } from "./palette";

const LIGHT_CONFIG = {
  accentResponse: 7,
  idleNeutralIntensity: 1.25,
  leftAccentIntensity: 60,
  leftTargetMaxX: -0.25,
  leftTargetMinX: -3.2,
  rightAccentIntensity: 70,
  rightTargetMaxX: 3.2,
  rightTargetMinX: 0.25,
  playingNeutralIntensity: 0.625,
  targetResponse: 4.5,
} as const;

const MOBILE_SCROLL_CONFIG = {
  damping: 0.012,
  minimumVelocity: 0.025,
  velocitySmoothing: 0.72,
} as const;

type BackgroundScrollGesture = {
  pointerId: number;
  previousTime: number;
  previousY: number;
  velocity: number;
};

type PointerCaptureTarget = EventTarget & {
  setPointerCapture: (pointerId: number) => void;
};

function ScrollableBackdrop() {
  const gestureRef = useRef<BackgroundScrollGesture | null>(null);
  const inertiaFrameRef = useRef<number | null>(null);

  const cancelInertia = useCallback(() => {
    if (inertiaFrameRef.current === null) return;

    window.cancelAnimationFrame(inertiaFrameRef.current);
    inertiaFrameRef.current = null;
  }, []);

  const finishGesture = useCallback(
    (event: ThreeEvent<PointerEvent>) => {
      const gesture = gestureRef.current;
      if (!gesture || gesture.pointerId !== event.pointerId) return;

      gestureRef.current = null;
      const initialVelocity = gesture.velocity;
      if (Math.abs(initialVelocity) < MOBILE_SCROLL_CONFIG.minimumVelocity) {
        return;
      }

      let velocity = initialVelocity;
      let previousTime = performance.now();

      const applyInertia = (time: number) => {
        const elapsed = Math.min(time - previousTime, 32);
        previousTime = time;
        window.scrollBy(0, velocity * elapsed);
        velocity *= Math.exp(-MOBILE_SCROLL_CONFIG.damping * elapsed);

        if (Math.abs(velocity) >= MOBILE_SCROLL_CONFIG.minimumVelocity) {
          inertiaFrameRef.current = window.requestAnimationFrame(applyInertia);
        } else {
          inertiaFrameRef.current = null;
        }
      };

      inertiaFrameRef.current = window.requestAnimationFrame(applyInertia);
    },
    [],
  );

  useEffect(() => cancelInertia, [cancelInertia]);

  return (
    <mesh
      position={[0, 0, -0.25]}
      receiveShadow
      onPointerCancel={finishGesture}
      onPointerDown={(event) => {
        if (event.pointerType !== "touch") return;

        event.stopPropagation();
        event.nativeEvent.preventDefault();
        cancelInertia();
        gestureRef.current = {
          pointerId: event.pointerId,
          previousTime: performance.now(),
          previousY: event.clientY,
          velocity: 0,
        };
        const pointerTarget = event.target as PointerCaptureTarget | null;
        pointerTarget?.setPointerCapture(event.pointerId);
      }}
      onPointerMove={(event) => {
        const gesture = gestureRef.current;
        if (!gesture || gesture.pointerId !== event.pointerId) return;

        event.stopPropagation();
        event.nativeEvent.preventDefault();
        const time = performance.now();
        const elapsed = Math.max(time - gesture.previousTime, 1);
        const distance = gesture.previousY - event.clientY;
        const nextVelocity = distance / elapsed;

        window.scrollBy(0, distance);
        gesture.velocity = THREE.MathUtils.lerp(
          nextVelocity,
          gesture.velocity,
          MOBILE_SCROLL_CONFIG.velocitySmoothing,
        );
        gesture.previousTime = time;
        gesture.previousY = event.clientY;
      }}
      onPointerUp={finishGesture}
    >
      <planeGeometry args={[24, 14]} />
      <meshStandardMaterial color={palette.background} roughness={1} />
    </mesh>
  );
}

function averageBands(start: number, end: number) {
  let sum = 0;

  for (let index = start; index < end; index += 1) {
    sum += audioSignal.bands[index] ?? 0;
  }

  return end > start ? sum / (end - start) : 0;
}

function bandCentroid(start: number, end: number) {
  let energySum = 0;
  let weightedSum = 0;
  const bandSpan = Math.max(end - start - 1, 1);

  for (let index = start; index < end; index += 1) {
    const energy = audioSignal.bands[index] ?? 0;
    energySum += energy;
    weightedSum += energy * ((index - start) / bandSpan);
  }

  return energySum > 0.0001 ? weightedSum / energySum : 0.5;
}

/* Three.js animation is intentionally imperative inside useFrame. */
/* eslint-disable react-hooks/immutability */
function ReactiveLights() {
  const ambientLightRef = useRef<THREE.AmbientLight>(null);
  const keyLightRef = useRef<THREE.DirectionalLight>(null);
  const fillLightRef = useRef<THREE.DirectionalLight>(null);
  const leftAccentRef = useRef<THREE.SpotLight>(null);
  const rightAccentRef = useRef<THREE.SpotLight>(null);
  const leftTarget = useMemo(() => {
    const target = new THREE.Object3D();
    target.position.set(-1.7, 0, 0);
    return target;
  }, []);
  const rightTarget = useMemo(() => {
    const target = new THREE.Object3D();
    target.position.set(1.7, 0, 0);
    return target;
  }, []);

  useFrame((_, delta) => {
    const ambientLight = ambientLightRef.current;
    const keyLight = keyLightRef.current;
    const fillLight = fillLightRef.current;
    const leftAccent = leftAccentRef.current;
    const rightAccent = rightAccentRef.current;
    if (
      !ambientLight ||
      !keyLight ||
      !fillLight ||
      !leftAccent ||
      !rightAccent
    ) {
      return;
    }

    const safeDelta = Math.min(delta, 1 / 30);
    const lowEnergy = averageBands(0, 3);
    const highEnergy = averageBands(8, 11);
    const leftEnergy = averageBands(0, 6);
    const rightEnergy = averageBands(5, 11);
    const leftTargetX = THREE.MathUtils.lerp(
      LIGHT_CONFIG.leftTargetMinX,
      LIGHT_CONFIG.leftTargetMaxX,
      bandCentroid(0, 6),
    );
    const rightTargetX = THREE.MathUtils.lerp(
      LIGHT_CONFIG.rightTargetMinX,
      LIGHT_CONFIG.rightTargetMaxX,
      bandCentroid(5, 11),
    );

    leftTarget.position.x = THREE.MathUtils.damp(
      leftTarget.position.x,
      leftTargetX,
      LIGHT_CONFIG.targetResponse,
      safeDelta,
    );
    rightTarget.position.x = THREE.MathUtils.damp(
      rightTarget.position.x,
      rightTargetX,
      LIGHT_CONFIG.targetResponse,
      safeDelta,
    );

    const neutralLightMix = audioSignal.playing
      ? LIGHT_CONFIG.playingNeutralIntensity
      : LIGHT_CONFIG.idleNeutralIntensity;

    ambientLight.intensity = THREE.MathUtils.damp(
      ambientLight.intensity,
      1.35 * neutralLightMix,
      LIGHT_CONFIG.accentResponse,
      safeDelta,
    );
    keyLight.intensity = THREE.MathUtils.damp(
      keyLight.intensity,
      3.6 * neutralLightMix,
      LIGHT_CONFIG.accentResponse,
      safeDelta,
    );
    fillLight.intensity = THREE.MathUtils.damp(
      fillLight.intensity,
      1.15 * neutralLightMix,
      LIGHT_CONFIG.accentResponse,
      safeDelta,
    );
    leftAccent.intensity = THREE.MathUtils.damp(
      leftAccent.intensity,
      audioSignal.playing
        ? leftEnergy * LIGHT_CONFIG.leftAccentIntensity
        : 0,
      LIGHT_CONFIG.accentResponse,
      safeDelta,
    );
    rightAccent.intensity = THREE.MathUtils.damp(
      rightAccent.intensity,
      audioSignal.playing
        ? rightEnergy * LIGHT_CONFIG.rightAccentIntensity
        : 0,
      LIGHT_CONFIG.accentResponse,
      safeDelta,
    );
    leftAccent.position.y = 1.5 + lowEnergy * 1.2;
    rightAccent.position.y = 1.5 + highEnergy * 1.5;
  });

  return (
    <>
      <ambientLight
        ref={ambientLightRef}
        intensity={1.35 * LIGHT_CONFIG.idleNeutralIntensity}
      />
      <directionalLight
        ref={keyLightRef}
        castShadow
        intensity={3.6 * LIGHT_CONFIG.idleNeutralIntensity}
        position={[-4, 5, 7]}
        shadow-bias={-0.0002}
        shadow-mapSize-height={2048}
        shadow-mapSize-width={2048}
      />
      <directionalLight
        ref={fillLightRef}
        intensity={1.15 * LIGHT_CONFIG.idleNeutralIntensity}
        position={[4, -2, 4]}
        color={brandColors.offWhite}
      />
      <spotLight
        ref={leftAccentRef}
        angle={0.68}
        color={brandColors.complementaryBlue}
        decay={1.35}
        distance={11}
        intensity={0}
        penumbra={0.72}
        position={[-4.3, 1.5, 4]}
        target={leftTarget}
      />
      <spotLight
        ref={rightAccentRef}
        angle={0.68}
        color={brandColors.magmaOrange}
        decay={1.35}
        distance={11}
        intensity={0}
        penumbra={0.72}
        position={[4.3, 1.5, 4]}
        target={rightTarget}
      />
      <primitive object={leftTarget} />
      <primitive object={rightTarget} />
    </>
  );
}
/* eslint-enable react-hooks/immutability */

export function LogoScene() {
  return (
    <Canvas
      camera={{ position: [0, 0, 8], fov: 35 }}
      dpr={[1, 2]}
      gl={{
        antialias: true,
        alpha: false,
        powerPreference: "high-performance",
        toneMapping: THREE.ACESFilmicToneMapping,
      }}
      shadows="soft"
    >
      <color attach="background" args={[palette.background]} />
      <ReactiveLights />

      <ScrollableBackdrop />

      <Suspense fallback={null}>
        <Original3DLogo />
      </Suspense>
    </Canvas>
  );
}
