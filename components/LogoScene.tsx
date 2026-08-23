"use client";

import { Canvas } from "@react-three/fiber";
import { ContinuousLiquidLogo } from "./ContinuousLiquidLogo";
import { palette } from "./palette";

export function LogoScene() {
  return (
    <Canvas
      camera={{ position: [0, 0, 8], fov: 35 }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
    >
      <color attach="background" args={[palette.background]} />

      <ContinuousLiquidLogo />
    </Canvas>
  );
}
