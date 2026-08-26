"use client";

import {
  Bounds,
  Center,
  Html,
  OrbitControls,
  PerformanceMonitor,
  type PerformanceMonitorApi,
  useBounds,
  useGLTF,
  useProgress,
} from "@react-three/drei";
import {
  Canvas,
  type ThreeEvent,
  useFrame,
  useThree,
} from "@react-three/fiber";
import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import * as THREE from "three";
import { brandColors } from "./palette";
import styles from "./StudioScene.module.css";

const MODEL_URL = "/studio_mesh.glb";
const DRACO_PATH = "/draco/";
const STUDIO_LIGHT_CONFIG = {
  ambientIntensity: 0.28,
  accentIntensity: 0.35,
  hemisphereIntensity: 0.65,
  keyIntensity: 2.65,
} as const;
const STUDIO_ROTATION_SPEED = 0.018;
const STUDIO_FOCUS_DURATION = 0.72;
const STUDIO_INITIAL_FIT_MARGIN = 0.92;
const STUDIO_MOBILE_FIT_MARGIN = 0.74;
const STUDIO_MIN_ZOOM = 100;
const STUDIO_MAX_ZOOM = 700;
const STUDIO_ZOOM_STEP = 1.2;
const STUDIO_RENDER_QUALITY = {
  mobile: {
    id: "mobile",
    initialDpr: 1.15,
    initialFactor: 0.3,
    maxDpr: 1.5,
    minDpr: 0.85,
  },
  retina: {
    id: "retina",
    initialDpr: 2,
    initialFactor: 1,
    maxDpr: 2,
    minDpr: 1.25,
  },
  standard: {
    id: "standard",
    initialDpr: 1.5,
    initialFactor: 0.5,
    maxDpr: 1.75,
    minDpr: 1,
  },
} as const;
type StudioRenderQualityProfile =
  (typeof STUDIO_RENDER_QUALITY)[keyof typeof STUDIO_RENDER_QUALITY];
const EQUIPMENT_PULSE = {
  cycleDuration: 8,
  maxIntensity: 0.2,
  minIntensity: 0,
  pulseDuration: 1.5,
} as const;

function getStudioRenderQualityProfile(): StudioRenderQualityProfile {
  if (typeof window === "undefined") return STUDIO_RENDER_QUALITY.standard;

  const isMobile = window.matchMedia(
    "(max-width: 800px), (pointer: coarse)",
  ).matches;

  if (isMobile) return STUDIO_RENDER_QUALITY.mobile;
  if (window.devicePixelRatio >= 1.5) return STUDIO_RENDER_QUALITY.retina;
  return STUDIO_RENDER_QUALITY.standard;
}

function getStudioPerformanceBounds(refreshRate: number): [number, number] {
  if (refreshRate < 50) return [24, 29];
  if (refreshRate > 90) return [60, 90];
  return [45, 58];
}

type ZoomRequest = {
  factor: number;
  id: number;
};

type EquipmentId =
  | "ssl2plus"
  | "focal"
  | "beyerdynamic"
  | "audioTechnica"
  | "microphones";

type EquipmentSelection = {
  id: EquipmentId;
  rootKey: string;
};

type EquipmentInfo = {
  category: string;
  description: string;
  focusBoundsNames?: readonly string[];
  focusScale: number;
  focusTargetNames?: readonly string[];
  index: string;
  rootNames: readonly string[];
  title: string;
};

type EquipmentHitAreaSettings = {
  includeDescendants: boolean;
  minSize: number;
  padding: number;
  scale: readonly [number, number, number];
  selfGeometryHitArea?: boolean;
};

const DEFAULT_HIT_AREA_SETTINGS: EquipmentHitAreaSettings = {
  includeDescendants: true,
  minSize: 0.14,
  padding: 0.08,
  scale: [1, 1, 1],
};

const EQUIPMENT_HIT_AREA_SETTINGS: Partial<
  Record<EquipmentId, EquipmentHitAreaSettings>
> = {
  audioTechnica: {
    includeDescendants: true,
    minSize: 0.075,
    padding: 0.015,
    scale: [0.68, 0.68, 0.68],
  },
  microphones: {
    includeDescendants: true,
    minSize: 0.075,
    padding: 0.015,
    scale: [0.62, 0.78, 0.62],
    selfGeometryHitArea: true,
  },
};

const EQUIPMENT: Record<EquipmentId, EquipmentInfo> = {
  ssl2plus: {
    category: "Interfaz de audio USB",
    description:
      "Interfaz de escritorio con dos previos SSL, conversión a 24-bit/192 kHz y modo Legacy 4K. Centraliza la grabación, la monitorización y las mezclas de auriculares del estudio.",
    focusScale: 0.68,
    index: "01",
    rootNames: ["SSL_2_PLUS"],
    title: "Solid State Logic SSL 2+",
  },
  focal: {
    category: "Monitores de estudio",
    description:
      "La pareja principal para tomar decisiones de balance, profundidad y traducción durante la mezcla.",
    focusBoundsNames: ["Legacy_Calibre.001", "Legacy_Calibre.003"],
    focusScale: 0.72,
    index: "02",
    rootNames: [
      "Hi-Fi Monitor Black Wood.001",
      "Hi-Fi Monitor Black Wood.002",
    ],
    title: "Focal Alpha 6.5",
  },
  beyerdynamic: {
    category: "Auriculares abiertos",
    description:
      "Una segunda referencia para edición, mezcla y comprobación detallada fuera de los monitores.",
    focusScale: 0.66,
    index: "03",
    rootNames: ["Retro Audiophile Headphones"],
    title: "Beyerdynamic DT 990 Pro",
  },
  audioTechnica: {
    category: "Auriculares cerrados",
    description:
      "Una referencia directa y aislada para grabación, edición y control de graves sin depender de la acústica de la sala.",
    focusScale: 0.66,
    index: "04",
    rootNames: ["Retro Audiophile Headphones.001"],
    title: "Audio-Technica ATH-M50x",
  },
  microphones: {
    category: "Micrófonos de condensador",
    description:
      "Dos opciones complementarias para voces e instrumentos: AKG C214 y Aston Spirit.",
    focusScale: 0.62,
    focusTargetNames: ["membrane"],
    index: "05",
    rootNames: ["Mic body"],
    title: "AKG C214 + Aston Spirit",
  },
};

function normalizeObjectName(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function findEquipmentRoot(
  model: THREE.Object3D,
  rootKey: string,
): THREE.Object3D | null {
  let equipmentRoot: THREE.Object3D | null = null;

  model.traverse((object) => {
    if (!equipmentRoot && normalizeObjectName(object.name) === rootKey) {
      equipmentRoot = object;
    }
  });

  return equipmentRoot;
}

function getEquipmentFocusName(
  equipment: EquipmentInfo,
  rootKey: string,
  names?: readonly string[],
) {
  if (!names) return null;

  const rootIndex = equipment.rootNames.findIndex(
    (rootName) => normalizeObjectName(rootName) === rootKey,
  );

  return rootIndex >= 0 ? names[rootIndex] ?? null : null;
}

function getEquipmentHitAreaBox(
  equipmentRoot: THREE.Object3D,
  includeDescendants: boolean,
) {
  if (includeDescendants || !(equipmentRoot instanceof THREE.Mesh)) {
    return new THREE.Box3().setFromObject(equipmentRoot);
  }

  const geometry = equipmentRoot.geometry;
  if (!geometry.boundingBox) geometry.computeBoundingBox();

  return geometry.boundingBox
    ? new THREE.Box3()
        .copy(geometry.boundingBox)
        .applyMatrix4(equipmentRoot.matrixWorld)
    : new THREE.Box3().setFromObject(equipmentRoot);
}

function LoadingStudio() {
  const { progress } = useProgress();

  return (
    <Html center>
      <span
        style={{
          color: brandColors.offWhite,
          fontFamily: "monospace",
          fontSize: "0.65rem",
          letterSpacing: "0.08em",
          whiteSpace: "nowrap",
        }}
      >
        CARGANDO ESTUDIO · {Math.round(progress)}%
      </span>
    </Html>
  );
}

function EquipmentCard({
  className,
  equipment,
  onClose,
}: {
  className?: string;
  equipment: EquipmentInfo;
  onClose: () => void;
}) {
  return (
    <aside
      className={
        className
          ? `${styles.equipmentCard} ${className}`
          : styles.equipmentCard
      }
      aria-live="polite"
    >
      <div className={styles.equipmentMeta}>
        <span>({equipment.index})</span>
        <span>{equipment.category}</span>
      </div>

      <h3>{equipment.title}</h3>
      <p>{equipment.description}</p>

      <button type="button" onClick={onClose}>
        Volver a la vista <span aria-hidden="true">×</span>
      </button>
    </aside>
  );
}

type StudioModelProps = {
  hoveredEquipment: EquipmentSelection | null;
  isSceneVisible: boolean;
  onClearSelection: () => void;
  onHoverChange: (selection: EquipmentSelection | null) => void;
  onSelect: (selection: EquipmentSelection) => void;
  selection: EquipmentSelection | null;
};

type InteractiveStudioModelProps = Omit<
  StudioModelProps,
  "hoveredEquipment"
> & {
  model: THREE.Object3D;
};

type EquipmentHitArea = EquipmentSelection & {
  hitAreaKey: string;
  position: [number, number, number];
  size: [number, number, number];
};

function getHitAreaVolume(hitArea: EquipmentHitArea) {
  return hitArea.size[0] * hitArea.size[1] * hitArea.size[2];
}

function getPreferredHitArea(
  intersections: THREE.Intersection[],
  fallback: EquipmentHitArea,
) {
  return intersections.reduce<EquipmentHitArea>((preferred, intersection) => {
    const candidate = intersection.object.userData
      .equipmentHitArea as EquipmentHitArea | undefined;

    if (!candidate) return preferred;

    return getHitAreaVolume(candidate) < getHitAreaVolume(preferred)
      ? candidate
      : preferred;
  }, fallback);
}

type StudioOrbitControls = {
  target: THREE.Vector3;
  update: () => void;
};

type CameraView = {
  position: THREE.Vector3;
  target: THREE.Vector3;
  zoom: number;
};

type CameraTransition = {
  elapsed: number;
  from: CameraView;
  to: CameraView;
};

function calculateFocusZoom(
  camera: THREE.OrthographicCamera,
  box: THREE.Box3,
  position: THREE.Vector3,
  target: THREE.Vector3,
  focusScale: number,
) {
  const viewMatrix = new THREE.Matrix4()
    .lookAt(position, target, camera.up)
    .setPosition(position)
    .invert();
  const corners = [
    new THREE.Vector3(box.min.x, box.min.y, box.min.z),
    new THREE.Vector3(box.min.x, box.min.y, box.max.z),
    new THREE.Vector3(box.min.x, box.max.y, box.min.z),
    new THREE.Vector3(box.min.x, box.max.y, box.max.z),
    new THREE.Vector3(box.max.x, box.min.y, box.min.z),
    new THREE.Vector3(box.max.x, box.min.y, box.max.z),
    new THREE.Vector3(box.max.x, box.max.y, box.min.z),
    new THREE.Vector3(box.max.x, box.max.y, box.max.z),
  ];
  let halfWidth = 0;
  let halfHeight = 0;

  corners.forEach((corner) => {
    corner.applyMatrix4(viewMatrix);
    halfWidth = Math.max(halfWidth, Math.abs(corner.x));
    halfHeight = Math.max(halfHeight, Math.abs(corner.y));
  });

  const horizontalZoom =
    (camera.right - camera.left) / Math.max(halfWidth * 2, 0.001);
  const verticalZoom =
    (camera.top - camera.bottom) / Math.max(halfHeight * 2, 0.001);
  const fittedZoom = Math.min(horizontalZoom, verticalZoom) / 1.15;

  return THREE.MathUtils.clamp(
    fittedZoom / focusScale,
    STUDIO_MIN_ZOOM,
    STUDIO_MAX_ZOOM,
  );
}

function InteractiveStudioModel({
  isSceneVisible,
  model,
  onClearSelection,
  onHoverChange,
  onSelect,
  selection,
}: InteractiveStudioModelProps) {
  const bounds = useBounds();
  const { camera, controls } = useThree();
  const cameraRef = useRef(camera);
  const controlsRef = useRef<StudioOrbitControls | null>(
    controls as StudioOrbitControls | null,
  );
  const rotationRef = useRef<THREE.Group>(null);
  const hadSelectionRef = useRef(false);
  const returnViewRef = useRef<CameraView | null>(null);
  const transitionRef = useRef<CameraTransition | null>(null);
  const hitAreas = useMemo<EquipmentHitArea[]>(() => {
    model.updateWorldMatrix(true, true);

    return Object.entries(EQUIPMENT).flatMap(([id, equipment]) =>
      equipment.rootNames.flatMap((rootName) => {
        const equipmentId = id as EquipmentId;
        const hitAreaSettings =
          EQUIPMENT_HIT_AREA_SETTINGS[equipmentId] ??
          DEFAULT_HIT_AREA_SETTINGS;
        const rootKey = normalizeObjectName(rootName);
        const equipmentRoot = findEquipmentRoot(model, rootKey);
        if (!equipmentRoot) return [];

        const groupBox = getEquipmentHitAreaBox(
          equipmentRoot,
          hitAreaSettings.includeDescendants,
        );
        const groupCenter = groupBox.getCenter(new THREE.Vector3());
        const groupSize = groupBox
          .getSize(new THREE.Vector3())
          .multiply(new THREE.Vector3(...hitAreaSettings.scale))
          .addScalar(hitAreaSettings.padding);

        groupSize.set(
          Math.max(groupSize.x, hitAreaSettings.minSize),
          Math.max(groupSize.y, hitAreaSettings.minSize),
          Math.max(groupSize.z, hitAreaSettings.minSize),
        );

        const areas: EquipmentHitArea[] = [
          {
            hitAreaKey: rootKey,
            id: equipmentId,
            position: groupCenter.toArray(),
            rootKey,
            size: groupSize.toArray(),
          },
        ];

        if (
          hitAreaSettings.selfGeometryHitArea &&
          equipmentRoot instanceof THREE.Mesh
        ) {
          const bodyBox = getEquipmentHitAreaBox(equipmentRoot, false);
          const bodyCenter = bodyBox.getCenter(new THREE.Vector3());
          const bodySize = bodyBox
            .getSize(new THREE.Vector3())
            .addScalar(0.025);

          bodySize.set(
            Math.max(bodySize.x, 0.08),
            Math.max(bodySize.y, 0.08),
            Math.max(bodySize.z, 0.08),
          );

          areas.push({
            hitAreaKey: `${rootKey}-body`,
            id: equipmentId,
            position: bodyCenter.toArray(),
            rootKey,
            size: bodySize.toArray(),
          });
        }

        return areas;
      }),
    );
  }, [model]);

  useEffect(() => {
    cameraRef.current = camera;
    controlsRef.current = controls as StudioOrbitControls | null;
  }, [camera, controls]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      model.updateWorldMatrix(true, true);
      bounds.refresh(model).reset().fit().clip();
    });

    return () => window.cancelAnimationFrame(frame);
  }, [bounds, model]);

  useEffect(() => {
    const rotationGroup = rotationRef.current;
    const activeCamera = cameraRef.current;
    const activeControls = controlsRef.current;
    if (
      !rotationGroup ||
      !activeControls ||
      !(activeCamera instanceof THREE.OrthographicCamera)
    ) {
      return;
    }

    if (selection) {
      rotationGroup.updateWorldMatrix(true, true);
      const equipment = EQUIPMENT[selection.id];
      const equipmentRoot = findEquipmentRoot(model, selection.rootKey);

      if (equipmentRoot) {
        const focusBoundsName = getEquipmentFocusName(
          equipment,
          selection.rootKey,
          equipment.focusBoundsNames,
        );
        const focusTargetName = getEquipmentFocusName(
          equipment,
          selection.rootKey,
          equipment.focusTargetNames,
        );
        const focusBoundsRoot = focusBoundsName
          ? findEquipmentRoot(model, normalizeObjectName(focusBoundsName)) ??
            equipmentRoot
          : equipmentRoot;
        const focusTargetRoot = focusTargetName
          ? findEquipmentRoot(model, normalizeObjectName(focusTargetName)) ??
            focusBoundsRoot
          : focusBoundsRoot;
        const focusBox = new THREE.Box3().setFromObject(focusBoundsRoot);
        const center = new THREE.Box3()
          .setFromObject(focusTargetRoot)
          .getCenter(new THREE.Vector3());
        const focusScale = equipment.focusScale;
        const offset = center.clone().sub(activeControls.target);
        const focusPosition = activeCamera.position.clone().add(offset);

        if (!hadSelectionRef.current) {
          returnViewRef.current = {
            position: activeCamera.position.clone(),
            target: activeControls.target.clone(),
            zoom: activeCamera.zoom,
          };
        }

        transitionRef.current = {
          elapsed: 0,
          from: {
            position: activeCamera.position.clone(),
            target: activeControls.target.clone(),
            zoom: activeCamera.zoom,
          },
          to: {
            position: focusPosition,
            target: center,
            zoom: calculateFocusZoom(
              activeCamera,
              focusBox,
              focusPosition,
              center,
              focusScale,
            ),
          },
        };
        hadSelectionRef.current = true;
      }
    } else if (hadSelectionRef.current && returnViewRef.current) {
      transitionRef.current = {
        elapsed: 0,
        from: {
          position: activeCamera.position.clone(),
          target: activeControls.target.clone(),
          zoom: activeCamera.zoom,
        },
        to: returnViewRef.current,
      };
      hadSelectionRef.current = false;
    }
  }, [model, selection]);

  useFrame((_, delta) => {
    const activeCamera = cameraRef.current;
    const activeControls = controlsRef.current;
    const transition = transitionRef.current;

    if (
      transition &&
      activeControls &&
      activeCamera instanceof THREE.OrthographicCamera
    ) {
      transition.elapsed = Math.min(
        transition.elapsed + delta,
        STUDIO_FOCUS_DURATION,
      );
      const progress = transition.elapsed / STUDIO_FOCUS_DURATION;
      const easedProgress = 1 - Math.pow(1 - progress, 3);

      activeCamera.position.lerpVectors(
        transition.from.position,
        transition.to.position,
        easedProgress,
      );
      activeControls.target.lerpVectors(
        transition.from.target,
        transition.to.target,
        easedProgress,
      );
      activeCamera.zoom = THREE.MathUtils.lerp(
        transition.from.zoom,
        transition.to.zoom,
        easedProgress,
      );
      activeCamera.updateProjectionMatrix();
      activeControls.update();

      if (progress >= 1) transitionRef.current = null;
    }

    const rotationGroup = rotationRef.current;
    if (
      !isSceneVisible ||
      !rotationGroup ||
      selection ||
      transitionRef.current
    ) {
      return;
    }

    rotationGroup.rotation.y += delta * STUDIO_ROTATION_SPEED;
  });

  return (
    <Center top>
      <group ref={rotationRef}>
        <primitive object={model} />

        {hitAreas.map((hitArea) => (
          <mesh
            key={hitArea.hitAreaKey}
            position={hitArea.position}
            userData={{ equipmentHitArea: hitArea }}
            onClick={(event: ThreeEvent<MouseEvent>) => {
              event.stopPropagation();
              const preferredHitArea = getPreferredHitArea(
                event.intersections,
                hitArea,
              );

              onSelect({
                id: preferredHitArea.id,
                rootKey: preferredHitArea.rootKey,
              });
            }}
            onPointerOut={() => onHoverChange(null)}
            onPointerMove={(event: ThreeEvent<PointerEvent>) => {
              event.stopPropagation();
              const preferredHitArea = getPreferredHitArea(
                event.intersections,
                hitArea,
              );

              onHoverChange({
                id: preferredHitArea.id,
                rootKey: preferredHitArea.rootKey,
              });
            }}
          >
            <boxGeometry args={hitArea.size} />
            <meshBasicMaterial
              color={brandColors.magmaOrange}
              depthWrite={false}
              opacity={0}
              transparent
            />
          </mesh>
        ))}

        {selection &&
          hitAreas
            .filter((hitArea) => hitArea.hitAreaKey === selection.rootKey)
            .map((hitArea) => {
              const equipment = EQUIPMENT[hitArea.id];

              return (
                <Html
                  key={`equipment-card-${hitArea.rootKey}`}
                  position={hitArea.position}
                  style={{ pointerEvents: "none" }}
                  zIndexRange={[10, 10]}
                >
                  <div className={styles.equipmentCardPositioner}>
                    <EquipmentCard
                      equipment={equipment}
                      onClose={onClearSelection}
                    />
                  </div>
                </Html>
              );
            })}
      </group>
    </Center>
  );
}

function StudioModel({
  hoveredEquipment,
  isSceneVisible,
  onClearSelection,
  onHoverChange,
  onSelect,
  selection,
}: StudioModelProps) {
  const { scene } = useGLTF(MODEL_URL, DRACO_PATH);
  const isMobile = useThree((state) => state.size.width <= 800);
  const fitMargin =
    isMobile ? STUDIO_MOBILE_FIT_MARGIN : STUDIO_INITIAL_FIT_MARGIN;
  const whiteMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: brandColors.offWhite,
        metalness: 0,
        roughness: 0.58,
      }),
    [],
  );
  const highlightedMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: brandColors.offWhite,
        emissive: brandColors.magmaOrange,
        emissiveIntensity: 0.42,
        metalness: 0,
        roughness: 0.5,
      }),
    [],
  );
  const equipmentPulseMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: brandColors.offWhite,
        emissive: brandColors.magmaOrange,
        emissiveIntensity: EQUIPMENT_PULSE.minIntensity,
        metalness: 0,
        roughness: 0.52,
      }),
    [],
  );
  const equipmentPulseMaterialRef = useRef(equipmentPulseMaterial);
  const model = useMemo(() => {
    const clone = scene.clone(true);

    clone.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) return;

      child.castShadow = true;
      child.material = whiteMaterial;
      child.receiveShadow = true;
    });

    return clone;
  }, [scene, whiteMaterial]);

  useFrame(({ clock }) => {
    const cycleTime = clock.elapsedTime % EQUIPMENT_PULSE.cycleDuration;
    const pulseProgress = THREE.MathUtils.clamp(
      cycleTime / EQUIPMENT_PULSE.pulseDuration,
      0,
      1,
    );
    const pulse =
      cycleTime < EQUIPMENT_PULSE.pulseDuration
        ? Math.sin(pulseProgress * Math.PI) ** 2
        : 0;

    equipmentPulseMaterialRef.current.emissiveIntensity = THREE.MathUtils.lerp(
      EQUIPMENT_PULSE.minIntensity,
      EQUIPMENT_PULSE.maxIntensity,
      pulse,
    );
  });

  useEffect(() => {
    model.traverse((child) => {
      if (child instanceof THREE.Mesh) child.material = whiteMaterial;
    });

    Object.values(EQUIPMENT).forEach((equipment) => {
      equipment.rootNames.forEach((rootName) => {
        const equipmentRoot = findEquipmentRoot(
          model,
          normalizeObjectName(rootName),
        );

        equipmentRoot?.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.material = equipmentPulseMaterial;
          }
        });
      });
    });

    const activeEquipment = hoveredEquipment ?? selection;
    if (!activeEquipment) return;

    const highlightedRootKeys = hoveredEquipment
      ? EQUIPMENT[hoveredEquipment.id].rootNames.map(normalizeObjectName)
      : [activeEquipment.rootKey];

    highlightedRootKeys.forEach((rootKey) => {
      const equipmentRoot = findEquipmentRoot(model, rootKey);
      equipmentRoot?.traverse((child) => {
        if (child instanceof THREE.Mesh) child.material = highlightedMaterial;
      });
    });
  }, [
    highlightedMaterial,
    hoveredEquipment,
    equipmentPulseMaterial,
    model,
    selection,
    whiteMaterial,
  ]);

  useEffect(
    () => () => {
      equipmentPulseMaterial.dispose();
      highlightedMaterial.dispose();
      whiteMaterial.dispose();
    },
    [equipmentPulseMaterial, highlightedMaterial, whiteMaterial],
  );

  return (
    <Bounds clip margin={fitMargin} maxDuration={0.9}>
      <InteractiveStudioModel
        isSceneVisible={isSceneVisible}
        model={model}
        onClearSelection={onClearSelection}
        onHoverChange={onHoverChange}
        onSelect={onSelect}
        selection={selection}
      />
    </Bounds>
  );
}

function CameraKeyLight() {
  const lightRef = useRef<THREE.DirectionalLight>(null);
  const { camera } = useThree();

  useFrame(() => {
    const light = lightRef.current;
    if (!light) return;

    light.position.copy(camera.position);
    light.position.y += 1.25;
  });

  return (
    <directionalLight
      ref={lightRef}
      castShadow
      color={brandColors.offWhite}
      intensity={STUDIO_LIGHT_CONFIG.keyIntensity}
      position={[8, 9.25, 8]}
      shadow-bias={-0.0001}
      shadow-blurSamples={12}
      shadow-mapSize-height={2048}
      shadow-mapSize-width={2048}
      shadow-radius={3.5}
    />
  );
}

function CameraZoomController({ request }: { request: ZoomRequest }) {
  const { camera, gl } = useThree();
  const cameraRef = useRef(camera);

  useEffect(() => {
    cameraRef.current = camera;
  }, [camera]);

  const applyZoom = useCallback(
    (factor: number) => {
      const activeCamera = cameraRef.current;
      if (!(activeCamera instanceof THREE.OrthographicCamera)) return;

      activeCamera.zoom = THREE.MathUtils.clamp(
        activeCamera.zoom * factor,
        STUDIO_MIN_ZOOM,
        STUDIO_MAX_ZOOM,
      );
      activeCamera.updateProjectionMatrix();
    },
    [],
  );

  useEffect(() => {
    if (request.id > 0) applyZoom(request.factor);
  }, [applyZoom, request]);

  useEffect(() => {
    const canvas = gl.domElement;
    let previousPinchDistance: number | null = null;

    const getPinchDistance = (touches: TouchList) => {
      const firstTouch = touches.item(0);
      const secondTouch = touches.item(1);
      if (!firstTouch || !secondTouch) return null;

      return Math.hypot(
        secondTouch.clientX - firstTouch.clientX,
        secondTouch.clientY - firstTouch.clientY,
      );
    };

    const handleWheel = (event: WheelEvent) => {
      if (!event.altKey) return;

      event.preventDefault();
      applyZoom(Math.exp(-event.deltaY * 0.0015));
    };

    const handleTouchStart = (event: TouchEvent) => {
      if (event.touches.length !== 2) return;
      previousPinchDistance = getPinchDistance(event.touches);
    };

    const handleTouchMove = (event: TouchEvent) => {
      if (event.touches.length !== 2 || previousPinchDistance === null) return;

      const nextPinchDistance = getPinchDistance(event.touches);
      if (nextPinchDistance === null) return;

      event.preventDefault();
      applyZoom(nextPinchDistance / previousPinchDistance);
      previousPinchDistance = nextPinchDistance;
    };

    const resetPinch = () => {
      previousPinchDistance = null;
    };

    canvas.addEventListener("wheel", handleWheel, { passive: false });
    canvas.addEventListener("touchstart", handleTouchStart, { passive: true });
    canvas.addEventListener("touchmove", handleTouchMove, { passive: false });
    canvas.addEventListener("touchend", resetPinch);
    canvas.addEventListener("touchcancel", resetPinch);

    return () => {
      canvas.removeEventListener("wheel", handleWheel);
      canvas.removeEventListener("touchstart", handleTouchStart);
      canvas.removeEventListener("touchmove", handleTouchMove);
      canvas.removeEventListener("touchend", resetPinch);
      canvas.removeEventListener("touchcancel", resetPinch);
    };
  }, [applyZoom, gl]);

  return null;
}

export function StudioScene() {
  const rootRef = useRef<HTMLDivElement>(null);
  const [renderQualityProfile] = useState<StudioRenderQualityProfile>(
    getStudioRenderQualityProfile,
  );
  const [hoveredEquipment, setHoveredEquipment] =
    useState<EquipmentSelection | null>(null);
  const [isSceneVisible, setIsSceneVisible] = useState(false);
  const [sceneDpr, setSceneDpr] = useState<number>(
    renderQualityProfile.initialDpr,
  );
  const [selection, setSelection] = useState<EquipmentSelection | null>(null);
  const [zoomRequest, setZoomRequest] = useState<ZoomRequest>({
    factor: 1,
    id: 0,
  });
  const selectedEquipment = selection ? EQUIPMENT[selection.id] : null;

  const requestZoom = (factor: number) => {
    setZoomRequest((currentRequest) => ({
      factor,
      id: currentRequest.id + 1,
    }));
  };

  const handlePerformanceChange = useCallback(
    ({ factor }: PerformanceMonitorApi) => {
      const dpr =
        renderQualityProfile.minDpr +
        factor *
          (renderQualityProfile.maxDpr - renderQualityProfile.minDpr);

      setSceneDpr(Number(dpr.toFixed(2)));
    },
    [renderQualityProfile],
  );

  const handlePerformanceFallback = useCallback(() => {
    setSceneDpr(renderQualityProfile.minDpr);
  }, [renderQualityProfile]);

  const toggleSelection = useCallback((nextSelection: EquipmentSelection) => {
    setHoveredEquipment(null);
    setSelection((currentSelection) =>
      currentSelection?.id === nextSelection.id &&
      currentSelection.rootKey === nextSelection.rootKey
        ? null
        : nextSelection,
    );
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelection(null);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const observer = new IntersectionObserver(
      ([entry]) => setIsSceneVisible(entry.isIntersecting),
      { threshold: 0.25 },
    );

    observer.observe(root);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      className={styles.root}
      data-equipment-hovered={Boolean(hoveredEquipment)}
      ref={rootRef}
    >
      <Canvas
        camera={{
          far: 5000,
          near: 0.01,
          position: [8, 8, 8],
          zoom: 45,
        }}
        dpr={sceneDpr}
        frameloop="always"
        gl={{
          antialias: true,
          powerPreference: "high-performance",
          toneMapping: THREE.ACESFilmicToneMapping,
        }}
        onPointerMissed={() => {
          setHoveredEquipment(null);
          setSelection(null);
        }}
        orthographic
        shadows="variance"
      >
        {isSceneVisible ? (
          <PerformanceMonitor
            bounds={getStudioPerformanceBounds}
            factor={renderQualityProfile.initialFactor}
            flipflops={4}
            iterations={6}
            key={renderQualityProfile.id}
            ms={250}
            onChange={handlePerformanceChange}
            onFallback={handlePerformanceFallback}
            step={0.12}
            threshold={0.75}
          />
        ) : null}
        <color attach="background" args={[brandColors.softBlack]} />
        <ambientLight intensity={STUDIO_LIGHT_CONFIG.ambientIntensity} />
        <hemisphereLight
          color={brandColors.offWhite}
          groundColor={brandColors.softBlack}
          intensity={STUDIO_LIGHT_CONFIG.hemisphereIntensity}
        />
        <CameraKeyLight />
        <CameraZoomController request={zoomRequest} />
        <directionalLight
          color={brandColors.magmaOrange}
          intensity={STUDIO_LIGHT_CONFIG.accentIntensity}
          position={[-6, 3, -4]}
        />

        <Suspense fallback={<LoadingStudio />}>
          <StudioModel
            hoveredEquipment={hoveredEquipment}
            isSceneVisible={isSceneVisible}
            onClearSelection={() => setSelection(null)}
            onHoverChange={setHoveredEquipment}
            onSelect={toggleSelection}
            selection={selection}
          />
        </Suspense>

        <OrbitControls
          dampingFactor={0.075}
          enableDamping
          enablePan={false}
          enableZoom={false}
          makeDefault
          maxPolarAngle={Math.PI * 0.48}
          minPolarAngle={Math.PI * 0.12}
          rotateSpeed={0.55}
        />
      </Canvas>

      <div className={styles.zoomControls} aria-label="Controles de zoom">
        <button
          aria-label="Alejar la vista"
          onClick={() => requestZoom(1 / STUDIO_ZOOM_STEP)}
          type="button"
        >
          −
        </button>
        <button
          aria-label="Acercar la vista"
          onClick={() => requestZoom(STUDIO_ZOOM_STEP)}
          type="button"
        >
          +
        </button>
      </div>

      {selectedEquipment && (
        <EquipmentCard
          className={styles.mobileEquipmentCard}
          equipment={selectedEquipment}
          onClose={() => setSelection(null)}
        />
      )}
    </div>
  );
}

useGLTF.preload(MODEL_URL, DRACO_PATH);
