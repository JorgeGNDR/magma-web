"use client";

import {
  useFrame,
  useLoader,
  useThree,
  type ThreeEvent,
} from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { audioSignal } from "./audioSignal";
import { palette } from "./palette";

const LOGO_ASPECT = 10_548 / 2_095;
const LOGO_WIDTH = 6.5;
const LOGO_HEIGHT = LOGO_WIDTH / LOGO_ASPECT;
const MIN_DEFORMATION_PADDING = 1.2;
const MIN_SURFACE_WIDTH = LOGO_WIDTH + MIN_DEFORMATION_PADDING * 2;
const MIN_SURFACE_HEIGHT = LOGO_HEIGHT + MIN_DEFORMATION_PADDING * 2;
const VIEWPORT_OVERSCAN = 0.12;
const HIDDEN_POINT = 100;
const MASK_URL = "/magma-lettering.svg?v=2";

// Edita únicamente este bloque para cambiar el comportamiento del líquido.
const LIQUID_CONFIG = {
  radius: 0.4, // Anchura de la zona que aparta el cursor.
  pushForce: 5, // Distancia que el cursor empuja la masa.
  blur: 5, // Unión y suavidad de la superficie.
  splitStrength: 1, // Facilidad con la que se abre un hueco.
  edgeStart: 0.1, // Bájalo para engordar la silueta.
  edgeEnd: 0.55, // Separación respecto a edgeStart = borde más suave.
  impulseDecay: 1, // Rapidez con la que desaparece el impulso del cursor.
  attackSpeed: 18, // Rapidez con la que comienza la deformación.
  releaseSpeed: 5, // Rapidez con la que recupera la forma original.
  minimumCursorSpeed: 0.0, // Velocidad mínima necesaria para reaccionar.
  fullStrengthSpeed: 1.0, // Recorrido de velocidad hasta alcanzar fuerza máxima.
  sliverFilterRadius: 2.25, // Elimina láminas de 1–2 px sin recortar la masa.
  sliverCoverageStart: 0.38, // Cobertura mínima para considerar que hay líquido.
  sliverCoverageEnd: 0.56, // Transición suave entre lámina y masa sólida.
  audioPulse: 0.07, // Expansión del logo provocada por los graves.
  audioResponse: 9, // Rapidez con la que el logo sigue la música.
} as const;

// Edita este bloque para cambiar únicamente el volumen y la iluminación.
const MATERIAL_CONFIG = {
  bevelRadius: 0.026, // Anchura del borde redondeado.
  bevelStrength: 1.7, // Profundidad aparente del bisel.
  ambientLight: 0.64, // Luz mínima de la superficie.
  diffuseLight: 0.43, // Contraste entre las zonas iluminadas y las oscuras.
  specularStrength: 0.12, // Intensidad del brillo suave.
  specularPower: 20, // Tamaño del brillo: más alto = más concentrado.
} as const;

// Edita este bloque para cambiar la animación del logo durante el scroll.
const SCROLL_CONFIG = {
  distance: 0.5, // Fracción de pantalla necesaria para completar la animación.
  approach: 2.5, // Distancia que el logo avanza hacia la cámara.
  tilt: -0.9, // Inclinación final hacia atrás, en radianes.
  response: 7, // Suavidad con la que sigue al scroll.
} as const;

const vertexShader = /* glsl */ `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  uniform sampler2D uMask;
  uniform vec4 uSegment;
  uniform float uStrength;
  uniform float uAspect;
  uniform vec3 uColor;
  uniform vec2 uSurfaceToLogo;
  uniform float uAudioBass;

  varying vec2 vUv;

  float maskAt(vec2 uv) {
    if (
      uv.x <= 0.0 || uv.x >= 1.0 ||
      uv.y <= 0.0 || uv.y >= 1.0
    ) return 0.0;

    return texture2D(uMask, uv).a;
  }

  float warpedDensityAt(vec2 logoUv) {
    vec2 metricPosition = vec2(logoUv.x * uAspect, logoUv.y);
    vec2 segmentStart = vec2(uSegment.x * uAspect, uSegment.y);
    vec2 segmentEnd = vec2(uSegment.z * uAspect, uSegment.w);
    vec2 travel = segmentEnd - segmentStart;
    float travelLengthSq = max(dot(travel, travel), 0.00001);
    float along = clamp(
      dot(metricPosition - segmentStart, travel) / travelLengthSq,
      0.0,
      1.0
    );
    vec2 nearestPoint = segmentStart + travel * along;
    vec2 delta = metricPosition - nearestPoint;
    float distanceToPath = length(delta);
    vec2 away = delta / max(distanceToPath, 0.001);

    float radius = ${LIQUID_CONFIG.radius.toFixed(3)};
    float pressure = 1.0 - smoothstep(
      radius * 0.12,
      radius * 1.55,
      distanceToPath
    );
    float core = 1.0 - smoothstep(
      radius * 0.08,
      radius * 0.62,
      distanceToPath
    );

    vec2 flow =
      away * pressure * uStrength * radius *
      ${LIQUID_CONFIG.pushForce.toFixed(3)};
    vec2 sourceUv = logoUv - vec2(flow.x / uAspect, flow.y);

    float audioExpansion = uAudioBass *
      ${LIQUID_CONFIG.audioPulse.toFixed(3)};
    sourceUv = vec2(0.5) + (sourceUv - vec2(0.5)) *
      (1.0 - audioExpansion);

    vec2 texel = vec2(1.0 / 4096.0, 1.0 / 814.0);

    float density = maskAt(sourceUv) * 0.48;
    density += maskAt(
      sourceUv + vec2(texel.x * ${LIQUID_CONFIG.blur.toFixed(1)}, 0.0)
    ) * 0.13;
    density += maskAt(
      sourceUv - vec2(texel.x * ${LIQUID_CONFIG.blur.toFixed(1)}, 0.0)
    ) * 0.13;
    density += maskAt(
      sourceUv + vec2(0.0, texel.y * ${LIQUID_CONFIG.blur.toFixed(1)})
    ) * 0.13;
    density += maskAt(
      sourceUv - vec2(0.0, texel.y * ${LIQUID_CONFIG.blur.toFixed(1)})
    ) * 0.13;

    return density * (1.0 - core * uStrength *
      ${LIQUID_CONFIG.splitStrength.toFixed(3)});
  }

  void main() {
    // The plane includes transparent padding. This remaps it so the logo keeps
    // its original size while displaced mass can move beyond its old bounds.
    vec2 logoUv = (vUv - 0.5) * uSurfaceToLogo + 0.5;

    float density = warpedDensityAt(logoUv);

    // A strong inverse warp can fold a single edge pixel into a long hairline.
    // Measure coverage around the output pixel and keep only actual thick mass.
    vec2 dx = dFdx(logoUv) * ${LIQUID_CONFIG.sliverFilterRadius.toFixed(2)};
    vec2 dy = dFdy(logoUv) * ${LIQUID_CONFIG.sliverFilterRadius.toFixed(2)};
    float coverage = density;
    coverage += warpedDensityAt(logoUv + dx);
    coverage += warpedDensityAt(logoUv - dx);
    coverage += warpedDensityAt(logoUv + dy);
    coverage += warpedDensityAt(logoUv - dy);
    coverage += warpedDensityAt(logoUv + dx + dy);
    coverage += warpedDensityAt(logoUv + dx - dy);
    coverage += warpedDensityAt(logoUv - dx + dy);
    coverage += warpedDensityAt(logoUv - dx - dy);
    coverage /= 9.0;

    float alpha = smoothstep(
      ${LIQUID_CONFIG.edgeStart.toFixed(3)},
      ${LIQUID_CONFIG.edgeEnd.toFixed(3)},
      density
    );
    alpha *= smoothstep(
      ${LIQUID_CONFIG.sliverCoverageStart.toFixed(3)},
      ${LIQUID_CONFIG.sliverCoverageEnd.toFixed(3)},
      coverage
    );
    if (alpha < 0.003) discard;

    // Sample a wider neighbourhood to rebuild a rounded bevel rather than a
    // one-pixel outline. It remains attached to the deformed liquid density.
    vec2 bevelStep = vec2(
      ${MATERIAL_CONFIG.bevelRadius.toFixed(3)} / uAspect,
      ${MATERIAL_CONFIG.bevelRadius.toFixed(3)}
    );
    float densityLeft = warpedDensityAt(logoUv - vec2(bevelStep.x, 0.0));
    float densityRight = warpedDensityAt(logoUv + vec2(bevelStep.x, 0.0));
    float densityDown = warpedDensityAt(logoUv - vec2(0.0, bevelStep.y));
    float densityUp = warpedDensityAt(logoUv + vec2(0.0, bevelStep.y));
    vec2 densityGradient = vec2(
      densityRight - densityLeft,
      densityUp - densityDown
    );
    vec3 surfaceNormal = normalize(vec3(
      -densityGradient.x * ${MATERIAL_CONFIG.bevelStrength.toFixed(2)},
      -densityGradient.y * ${MATERIAL_CONFIG.bevelStrength.toFixed(2)},
      1.0
    ));

    vec3 lightDirection = normalize(vec3(-0.48, 0.62, 0.82));
    vec3 viewDirection = vec3(0.0, 0.0, 1.0);
    vec3 halfDirection = normalize(lightDirection + viewDirection);

    float diffuse = max(dot(surfaceNormal, lightDirection), 0.0);
    float specular = pow(
      max(dot(surfaceNormal, halfDirection), 0.0),
      ${MATERIAL_CONFIG.specularPower.toFixed(1)}
    ) * ${MATERIAL_CONFIG.specularStrength.toFixed(3)};
    float lighting = ${MATERIAL_CONFIG.ambientLight.toFixed(3)} +
      diffuse * ${MATERIAL_CONFIG.diffuseLight.toFixed(3)};

    vec3 shadedColor = uColor * lighting + vec3(specular);
    gl_FragColor = vec4(shadedColor, alpha);
  }
`;

export function ContinuousLiquidLogo() {
  const texture = useLoader(THREE.TextureLoader, MASK_URL);
  const viewportWidth = useThree((state) => state.viewport.width);
  const viewportHeight = useThree((state) => state.viewport.height);
  const responsiveScale = Math.min(1, viewportWidth / 7.2);
  const surfaceWidth = Math.max(
    MIN_SURFACE_WIDTH,
    viewportWidth / responsiveScale + VIEWPORT_OVERSCAN,
  );
  const surfaceHeight = Math.max(
    MIN_SURFACE_HEIGHT,
    viewportHeight / responsiveScale + VIEWPORT_OVERSCAN,
  );
  const groupRef = useRef<THREE.Group>(null);
  const lastPointerRef = useRef<THREE.Vector2 | null>(null);
  const lastEventTimeRef = useRef(0);
  const scrollProgressRef = useRef(0);
  const strengthTargetRef = useRef(0);

  const uniforms = useMemo(
    () => ({
      uAspect: { value: LOGO_ASPECT },
      uAudioBass: { value: 0 },
      uColor: { value: new THREE.Color(palette.logo) },
      uMask: { value: texture },
      uSegment: {
        value: new THREE.Vector4(
          HIDDEN_POINT,
          HIDDEN_POINT,
          HIDDEN_POINT,
          HIDDEN_POINT,
        ),
      },
      uStrength: { value: 0 },
      uSurfaceToLogo: { value: new THREE.Vector2(1, 1) },
    }),
    [texture],
  );

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        depthWrite: false,
        fragmentShader,
        transparent: true,
        uniforms,
        vertexShader,
      }),
    [uniforms],
  );
  const materialRef = useRef(material);

  useFrame((_, delta) => {
    const safeDelta = Math.min(delta, 1 / 30);
    strengthTargetRef.current *= Math.exp(
      -LIQUID_CONFIG.impulseDecay * safeDelta,
    );
    const activeUniforms = materialRef.current.uniforms;

    activeUniforms.uSurfaceToLogo.value.set(
      surfaceWidth / LOGO_WIDTH,
      surfaceHeight / LOGO_HEIGHT,
    );
    activeUniforms.uAudioBass.value = THREE.MathUtils.damp(
      activeUniforms.uAudioBass.value,
      audioSignal.bass,
      LIQUID_CONFIG.audioResponse,
      safeDelta,
    );

    activeUniforms.uStrength.value = THREE.MathUtils.damp(
      activeUniforms.uStrength.value,
      strengthTargetRef.current,
      strengthTargetRef.current > activeUniforms.uStrength.value
        ? LIQUID_CONFIG.attackSpeed
        : LIQUID_CONFIG.releaseSpeed,
      safeDelta,
    );

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

    const group = groupRef.current;
    if (group) {
      group.scale.setScalar(responsiveScale);
      group.position.z = scrollProgressRef.current * SCROLL_CONFIG.approach;
      group.rotation.x = scrollProgressRef.current * SCROLL_CONFIG.tilt;
    }
  });

  function handlePointerMove(event: ThreeEvent<PointerEvent>) {
    event.stopPropagation();

    const group = groupRef.current;
    if (!group) return;

    const localPoint = group.worldToLocal(event.point.clone());
    const position = new THREE.Vector2(
      localPoint.x / LOGO_WIDTH + 0.5,
      localPoint.y / LOGO_HEIGHT + 0.5,
    );
    const previousPosition = lastPointerRef.current;
    const eventTime = event.nativeEvent.timeStamp;

    if (previousPosition && lastEventTimeRef.current > 0) {
      const elapsed = THREE.MathUtils.clamp(
        (eventTime - lastEventTimeRef.current) / 1_000,
        1 / 120,
        1 / 20,
      );
      const metricMovement = position.clone().sub(previousPosition);
      metricMovement.x *= LOGO_ASPECT;
      const speed = metricMovement.length() / elapsed;

      materialRef.current.uniforms.uSegment.value.set(
        previousPosition.x,
        previousPosition.y,
        position.x,
        position.y,
      );
      strengthTargetRef.current = THREE.MathUtils.clamp(
        (speed - LIQUID_CONFIG.minimumCursorSpeed) /
          LIQUID_CONFIG.fullStrengthSpeed,
        0,
        1,
      );
    }

    lastPointerRef.current = position;
    lastEventTimeRef.current = eventTime;
  }

  function handlePointerLeave() {
    strengthTargetRef.current = 0;
    lastPointerRef.current = null;
    lastEventTimeRef.current = 0;
  }

  return (
    <group ref={groupRef}>
      <mesh material={material}>
        <planeGeometry args={[surfaceWidth, surfaceHeight]} />
      </mesh>

      <mesh
        position={[0, 0, -0.05]}
        onPointerLeave={handlePointerLeave}
        onPointerMove={handlePointerMove}
      >
        <planeGeometry args={[surfaceWidth, surfaceHeight]} />
        <meshBasicMaterial
          colorWrite={false}
          depthWrite={false}
          opacity={0}
          transparent
        />
      </mesh>
    </group>
  );
}
