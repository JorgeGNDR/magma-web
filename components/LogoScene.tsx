"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
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
  const rootRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      setVisible(entry.isIntersecting);
    });
    if (rootRef.current) observer.observe(rootRef.current);
    return () => observer.disconnect();
  }, []);
  return (
    <div ref={rootRef} style={{ width: "100%", height: "100%" }}>
    <Canvas
      frameloop={visible ? "always" : "never"}
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

      <mesh position={[0, 0, -0.25]} receiveShadow>
        <planeGeometry args={[24, 14]} />
        <meshStandardMaterial color={palette.background} roughness={1} />
      </mesh>

      <Suspense fallback={null}>
        <Original3DLogo />
      </Suspense>
    </Canvas>
    </div>
  );
}
