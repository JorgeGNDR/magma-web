"use client";

import { useGLTF } from "@react-three/drei";
import { type ThreeEvent, useFrame, useThree } from "@react-three/fiber";
import { useCallback, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { audioSignal } from "./audioSignal";
import { palette } from "./palette";

const MODEL_URL = "/magma-logo.glb";

// Medidas extraídas del GLB. Restamos este centro antes de rotarlo para que
// todas las animaciones ocurran alrededor del centro visual del lettering.
const MODEL_CENTER = new THREE.Vector3(
  0.6564119590912014,
  0,
  -0.13035657163709402,
);
const MODEL_SCALE = 4.9;

const MATERIAL_CONFIG = {
  roughness: 0.3,
  metalness: 0.02,
  clearcoat: 0.45,
  clearcoatRoughness: 0.22,
} as const;

const SCROLL_CONFIG = {
  distance: 0.5,
  approach: 7,
  tilt: -1.5,
  response: 5,
  exitY: 0.2,
  hideAt: 1.1,
} as const;

const AUDIO_CONFIG = {
  damping: 12,
  depth: 0.12,
  highFrequencyBoost: 1.75,
  responseCurve: 0.72,
  spread: 0.035,
  spring: 75,
  threshold: 0.7,
} as const;

const DRAG_CONFIG = {
  followResponse: 24,
  returnDamping: 9,
  returnSpring: 52,
} as const;

const COLLISION_CONFIG = {
  impulse: 7,
  iterations: 4,
  radiusScale: 0.82,
  restSpacing: 0.92,
  transfer: 0.72,
} as const;

type LogoPiece = {
  basePosition: THREE.Vector3;
  center: THREE.Vector2;
  centerX: number;
  collisionRadius: number;
  mesh: THREE.Mesh;
  spreadDirection: THREE.Vector2;
};

type CollisionPair = {
  indexA: number;
  indexB: number;
  minimumDistance: number;
};

type PieceMotion = {
  dragOffset: THREE.Vector3;
  dragTarget: THREE.Vector3;
  dragVelocity: THREE.Vector3;
  dragging: boolean;
  offset: number;
  velocity: number;
};

type DragState = {
  pieceIndex: number;
  plane: THREE.Plane;
  pointerId: number;
  startOffset: THREE.Vector3;
  startPoint: THREE.Vector3;
};

type PointerCaptureTarget = EventTarget & {
  releasePointerCapture: (pointerId: number) => void;
  setPointerCapture: (pointerId: number) => void;
};

export function Original3DLogo() {
  const { scene } = useGLTF(MODEL_URL);
  const viewportWidth = useThree((state) => state.viewport.width);
  const camera = useThree((state) => state.camera);
  const responsiveScale = Math.min(1, viewportWidth / 7.2);
  const motionGroupRef = useRef<THREE.Group>(null);
  const scrollProgressRef = useRef(0);
  const pieceMotionRef = useRef<PieceMotion[]>([]);
  const dragStateRef = useRef<DragState | null>(null);

  const material = useMemo(() => {
    return new THREE.MeshPhysicalMaterial({
      clearcoat: MATERIAL_CONFIG.clearcoat,
      clearcoatRoughness: MATERIAL_CONFIG.clearcoatRoughness,
      color: palette.logo,
      metalness: MATERIAL_CONFIG.metalness,
      roughness: MATERIAL_CONFIG.roughness,
    });
  }, []);

  const { collisionPairs, model, pieces } = useMemo(() => {
    const clone = scene.clone(true);
    const nextPieces: LogoPiece[] = [];

    clone.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) return;

      child.castShadow = true;
      child.receiveShadow = true;
      child.material = material;
      child.userData.logoPiece = true;

      child.geometry.computeBoundingBox();
      const geometryCenter = child.geometry.boundingBox?.getCenter(
        new THREE.Vector3(),
      );
      const geometrySize = child.geometry.boundingBox?.getSize(
        new THREE.Vector3(),
      );
      if (!geometryCenter || !geometrySize) return;

      const centerX = geometryCenter.x + child.position.x;
      const centerZ = geometryCenter.z + child.position.z;
      const spreadDirection = new THREE.Vector2(
        centerX - MODEL_CENTER.x,
        centerZ - MODEL_CENTER.z,
      );

      if (spreadDirection.lengthSq() > 0.000001) {
        spreadDirection.normalize();
      }

      nextPieces.push({
        basePosition: child.position.clone(),
        center: new THREE.Vector2(centerX, centerZ),
        centerX,
        collisionRadius:
          Math.max(geometrySize.x, geometrySize.z) * 0.5,
        mesh: child,
        spreadDirection,
      });
    });

    nextPieces.sort((pieceA, pieceB) => pieceA.centerX - pieceB.centerX);

    const nextCollisionPairs: CollisionPair[] = [];

    for (let indexA = 0; indexA < nextPieces.length; indexA += 1) {
      for (let indexB = indexA + 1; indexB < nextPieces.length; indexB += 1) {
        const pieceA = nextPieces[indexA];
        const pieceB = nextPieces[indexB];
        const restDistance = pieceA.center.distanceTo(pieceB.center);
        const radiusDistance =
          (pieceA.collisionRadius + pieceB.collisionRadius) *
          COLLISION_CONFIG.radiusScale;

        nextCollisionPairs.push({
          indexA,
          indexB,
          minimumDistance: Math.min(
            restDistance * COLLISION_CONFIG.restSpacing,
            radiusDistance,
          ),
        });
      }
    }

    return {
      collisionPairs: nextCollisionPairs,
      model: clone,
      pieces: nextPieces,
    };
  }, [material, scene]);

  const finishDrag = useCallback((pointerId?: number) => {
    const dragState = dragStateRef.current;
    if (!dragState || (pointerId !== undefined && pointerId !== dragState.pointerId)) {
      return;
    }

    const motion = pieceMotionRef.current[dragState.pieceIndex];
    if (motion) motion.dragging = false;

    dragStateRef.current = null;
    document.body.style.cursor = "grab";
  }, []);

  function handlePointerDown(event: ThreeEvent<PointerEvent>) {
    const pieceIndex = pieces.findIndex((piece) => piece.mesh === event.object);
    const motion = pieceMotionRef.current[pieceIndex];
    if (pieceIndex < 0 || !motion) return;

    event.stopPropagation();
    const pointerTarget = event.target as PointerCaptureTarget | null;
    pointerTarget?.setPointerCapture(event.pointerId);

    const cameraDirection = camera.getWorldDirection(new THREE.Vector3());
    const plane = new THREE.Plane().setFromNormalAndCoplanarPoint(
      cameraDirection,
      event.point,
    );

    motion.dragging = true;
    motion.dragVelocity.set(0, 0, 0);
    dragStateRef.current = {
      pieceIndex,
      plane,
      pointerId: event.pointerId,
      startOffset: motion.dragOffset.clone(),
      startPoint: event.point.clone(),
    };
    document.body.style.cursor = "grabbing";
  }

  function handlePointerMove(event: ThreeEvent<PointerEvent>) {
    const dragState = dragStateRef.current;
    if (!dragState || dragState.pointerId !== event.pointerId) return;

    const piece = pieces[dragState.pieceIndex];
    const motion = pieceMotionRef.current[dragState.pieceIndex];
    const parent = piece?.mesh.parent;
    if (!piece || !motion || !parent) return;

    event.stopPropagation();

    const intersection = event.ray.intersectPlane(
      dragState.plane,
      new THREE.Vector3(),
    );
    if (!intersection) return;

    const worldDelta = intersection.sub(dragState.startPoint);
    const localOrigin = parent.worldToLocal(new THREE.Vector3());
    const localEnd = parent.worldToLocal(worldDelta.clone());
    const localDelta = localEnd.sub(localOrigin);

    motion.dragTarget.copy(dragState.startOffset).add(localDelta);
  }

  useEffect(() => {
    const releaseDrag = (event: PointerEvent) => finishDrag(event.pointerId);
    const cancelDrag = () => finishDrag();

    window.addEventListener("pointerup", releaseDrag);
    window.addEventListener("pointercancel", releaseDrag);
    window.addEventListener("blur", cancelDrag);

    return () => {
      window.removeEventListener("pointerup", releaseDrag);
      window.removeEventListener("pointercancel", releaseDrag);
      window.removeEventListener("blur", cancelDrag);
      document.body.style.cursor = "default";
    };
  }, [finishDrag]);

  useFrame((_, delta) => {
    const group = motionGroupRef.current;
    if (!group) return;

    const safeDelta = Math.min(delta, 1 / 30);
    const scrollDistance = Math.max(
      window.innerHeight * SCROLL_CONFIG.distance,
      1,
    );
    const rawScrollProgress = THREE.MathUtils.clamp(
      window.scrollY / scrollDistance,
      0,
      1,
    );
    const easedScrollProgress = THREE.MathUtils.smoothstep(
      rawScrollProgress,
      0,
      1,
    );

    scrollProgressRef.current = THREE.MathUtils.damp(
      scrollProgressRef.current,
      easedScrollProgress,
      SCROLL_CONFIG.response,
      safeDelta,
    );

    if (pieceMotionRef.current.length !== pieces.length) {
      pieceMotionRef.current = pieces.map(() => ({
        dragOffset: new THREE.Vector3(),
        dragTarget: new THREE.Vector3(),
        dragVelocity: new THREE.Vector3(),
        dragging: false,
        offset: 0,
        velocity: 0,
      }));
    }

    pieces.forEach((piece, index) => {
      const highFrequencyMix =
        pieces.length > 1 ? index / (pieces.length - 1) : 0;
      const frequencyBoost = THREE.MathUtils.lerp(
        1,
        AUDIO_CONFIG.highFrequencyBoost,
        highFrequencyMix,
      );
      const rawEnergy = (audioSignal.bands[index] ?? 0) * frequencyBoost;
      const normalizedEnergy = THREE.MathUtils.clamp(
        (rawEnergy - AUDIO_CONFIG.threshold) / (1 - AUDIO_CONFIG.threshold),
        0,
        1,
      );
      const targetOffset = normalizedEnergy ** AUDIO_CONFIG.responseCurve;
      const motion = pieceMotionRef.current[index];

      motion.velocity +=
        (targetOffset - motion.offset) * AUDIO_CONFIG.spring * safeDelta;
      motion.velocity *= Math.exp(-AUDIO_CONFIG.damping * safeDelta);
      motion.offset += motion.velocity * safeDelta;

      if (motion.dragging) {
        motion.dragOffset.x = THREE.MathUtils.damp(
          motion.dragOffset.x,
          motion.dragTarget.x,
          DRAG_CONFIG.followResponse,
          safeDelta,
        );
        motion.dragOffset.y = THREE.MathUtils.damp(
          motion.dragOffset.y,
          motion.dragTarget.y,
          DRAG_CONFIG.followResponse,
          safeDelta,
        );
        motion.dragOffset.z = THREE.MathUtils.damp(
          motion.dragOffset.z,
          motion.dragTarget.z,
          DRAG_CONFIG.followResponse,
          safeDelta,
        );
      } else {
        motion.dragVelocity.addScaledVector(
          motion.dragOffset,
          -DRAG_CONFIG.returnSpring * safeDelta,
        );
        motion.dragVelocity.multiplyScalar(
          Math.exp(-DRAG_CONFIG.returnDamping * safeDelta),
        );
        motion.dragOffset.addScaledVector(motion.dragVelocity, safeDelta);
        motion.dragTarget.copy(motion.dragOffset);
      }

    });

    for (
      let iteration = 0;
      iteration < COLLISION_CONFIG.iterations;
      iteration += 1
    ) {
      collisionPairs.forEach(({ indexA, indexB, minimumDistance }) => {
        const pieceA = pieces[indexA];
        const pieceB = pieces[indexB];
        const motionA = pieceMotionRef.current[indexA];
        const motionB = pieceMotionRef.current[indexB];

        const positionAX =
          pieceA.center.x +
          motionA.dragOffset.x +
          pieceA.spreadDirection.x * motionA.offset * AUDIO_CONFIG.spread;
        const positionAZ =
          pieceA.center.y +
          motionA.dragOffset.z +
          pieceA.spreadDirection.y * motionA.offset * AUDIO_CONFIG.spread;
        const positionBX =
          pieceB.center.x +
          motionB.dragOffset.x +
          pieceB.spreadDirection.x * motionB.offset * AUDIO_CONFIG.spread;
        const positionBZ =
          pieceB.center.y +
          motionB.dragOffset.z +
          pieceB.spreadDirection.y * motionB.offset * AUDIO_CONFIG.spread;
        const deltaX = positionBX - positionAX;
        const deltaZ = positionBZ - positionAZ;
        const distance = Math.hypot(deltaX, deltaZ);

        if (distance >= minimumDistance) return;

        const fallbackX = pieceB.center.x - pieceA.center.x;
        const fallbackZ = pieceB.center.y - pieceA.center.y;
        const fallbackLength = Math.hypot(fallbackX, fallbackZ) || 1;
        const normalX =
          distance > 0.00001 ? deltaX / distance : fallbackX / fallbackLength;
        const normalZ =
          distance > 0.00001 ? deltaZ / distance : fallbackZ / fallbackLength;
        const correction =
          (minimumDistance - distance) * COLLISION_CONFIG.transfer;

        if (motionA.dragging && !motionB.dragging) {
          motionB.dragOffset.x += normalX * correction;
          motionB.dragOffset.z += normalZ * correction;
          motionB.dragVelocity.x +=
            normalX * correction * COLLISION_CONFIG.impulse;
          motionB.dragVelocity.z +=
            normalZ * correction * COLLISION_CONFIG.impulse;
        } else if (motionB.dragging && !motionA.dragging) {
          motionA.dragOffset.x -= normalX * correction;
          motionA.dragOffset.z -= normalZ * correction;
          motionA.dragVelocity.x -=
            normalX * correction * COLLISION_CONFIG.impulse;
          motionA.dragVelocity.z -=
            normalZ * correction * COLLISION_CONFIG.impulse;
        } else if (!motionA.dragging && !motionB.dragging) {
          const splitCorrection = correction * 0.5;

          motionA.dragOffset.x -= normalX * splitCorrection;
          motionA.dragOffset.z -= normalZ * splitCorrection;
          motionB.dragOffset.x += normalX * splitCorrection;
          motionB.dragOffset.z += normalZ * splitCorrection;
          motionA.dragVelocity.x -=
            normalX * splitCorrection * COLLISION_CONFIG.impulse;
          motionA.dragVelocity.z -=
            normalZ * splitCorrection * COLLISION_CONFIG.impulse;
          motionB.dragVelocity.x +=
            normalX * splitCorrection * COLLISION_CONFIG.impulse;
          motionB.dragVelocity.z +=
            normalZ * splitCorrection * COLLISION_CONFIG.impulse;
        }
      });
    }

    pieces.forEach((piece, index) => {
      const motion = pieceMotionRef.current[index];

      piece.mesh.position.copy(piece.basePosition);
      piece.mesh.position.x +=
        piece.spreadDirection.x * motion.offset * AUDIO_CONFIG.spread;
      piece.mesh.position.y += motion.offset * AUDIO_CONFIG.depth;
      piece.mesh.position.z +=
        piece.spreadDirection.y * motion.offset * AUDIO_CONFIG.spread;
      piece.mesh.position.add(motion.dragOffset);
    });

    group.scale.setScalar(responsiveScale);
    group.position.z = scrollProgressRef.current * SCROLL_CONFIG.approach;
    group.position.y = -scrollProgressRef.current * SCROLL_CONFIG.exitY;
    group.rotation.x = scrollProgressRef.current * SCROLL_CONFIG.tilt;
    group.visible = scrollProgressRef.current < SCROLL_CONFIG.hideAt;
  });

  return (
    <group ref={motionGroupRef}>
      <group rotation={[Math.PI / 2, 0, 0]} scale={MODEL_SCALE}>
        <primitive
          object={model}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerOut={() => {
            if (!dragStateRef.current) document.body.style.cursor = "default";
          }}
          onPointerOver={(event: ThreeEvent<PointerEvent>) => {
            event.stopPropagation();
            if (!dragStateRef.current) document.body.style.cursor = "grab";
          }}
          onPointerUp={(event: ThreeEvent<PointerEvent>) => {
            event.stopPropagation();
            const pointerTarget = event.target as PointerCaptureTarget | null;
            pointerTarget?.releasePointerCapture(event.pointerId);
            finishDrag(event.pointerId);
          }}
          position={MODEL_CENTER.clone().negate()}
        />
      </group>
    </group>
  );
}

useGLTF.preload(MODEL_URL);
