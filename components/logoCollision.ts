import * as THREE from "three";

// Smooth oval proxies deliberately omit the mesh's notches and holes.
// Only collision geometry changes; the rendered logo retains its original shape.
export type LogoCollider = {
  centerX: number;
  centerZ: number;
  radiusX: number;
  radiusZ: number;
  step: number;
};

export function createLogoCollider(mesh: THREE.Mesh): LogoCollider {
  mesh.updateMatrix();
  mesh.geometry.computeBoundingBox();
  const box = mesh.geometry.boundingBox!.clone().applyMatrix4(mesh.matrix);
  const width = Math.max(box.max.x - box.min.x, 0.00001);
  const height = Math.max(box.max.z - box.min.z, 0.00001);
  return {
    centerX: (box.min.x + box.max.x) / 2,
    centerZ: (box.min.z + box.max.z) / 2,
    radiusX: width / 2,
    radiusZ: height / 2,
    step: Math.max(width, height) / 96,
  };
}

export function getLogoContact(a: LogoCollider, ax: number, az: number, b: LogoCollider, bx: number, bz: number) {
  const dx = b.centerX + bx - a.centerX - ax;
  const dz = b.centerZ + bz - a.centerZ - az;
  // Approximate the combined contact envelope with an ellipse. Its continuous
  // normal avoids the abrupt changes caused by rasterized silhouette edges.
  const rx = a.radiusX + b.radiusX;
  const rz = a.radiusZ + b.radiusZ;
  const distance = Math.hypot(dx / rx, dz / rz);
  if (distance >= 1) return null;
  if (distance < 1e-8) {
    return rx < rz
      ? { depth: rx, normalX: 1, normalZ: 0 }
      : { depth: rz, normalX: 0, normalZ: 1 };
  }
  const nx = dx / (rx * rx);
  const nz = dz / (rz * rz);
  const length = Math.hypot(nx, nz);
  return {
    depth: (1 - distance) * distance / length,
    normalX: nx / length,
    normalZ: nz / length,
  };
}
