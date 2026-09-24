import * as THREE from "three";

// Project the real mesh onto the logo's X/Z interaction plane. A fine occupancy
// grid preserves concavities and holes, unlike circles or a convex hull.
const RESOLUTION = 96;
export type LogoCollider = {
  minX: number; minZ: number; maxX: number; maxZ: number;
  step: number; width: number; height: number;
  depth: Float32Array; normalX: Float32Array; normalZ: Float32Array;
  boundary: number[];
};

export function createLogoCollider(mesh: THREE.Mesh): LogoCollider {
  mesh.updateMatrix();
  const positions = mesh.geometry.getAttribute("position");
  const vertices: THREE.Vector3[] = [];
  const box = new THREE.Box3();
  for (let i = 0; i < positions.count; i++) {
    const v = new THREE.Vector3().fromBufferAttribute(positions, i).applyMatrix4(mesh.matrix);
    vertices.push(v); box.expandByPoint(v);
  }
  const step = Math.max(box.max.x - box.min.x, box.max.z - box.min.z) / RESOLUTION;
  const minX = box.min.x - step * 2, minZ = box.min.z - step * 2;
  const width = Math.ceil((box.max.x - minX) / step) + 2;
  const height = Math.ceil((box.max.z - minZ) / step) + 2;
  const mask = new Uint8Array(width * height);
  const indices = mesh.geometry.index;
  const count = indices?.count ?? positions.count;
  for (let i = 0; i < count; i += 3) {
    const a = vertices[indices ? indices.getX(i) : i];
    const b = vertices[indices ? indices.getX(i + 1) : i + 1];
    const c = vertices[indices ? indices.getX(i + 2) : i + 2];
    const area = (b.x - a.x) * (c.z - a.z) - (b.z - a.z) * (c.x - a.x);
    if (Math.abs(area) < 1e-14) continue;
    const x0 = Math.max(0, Math.floor((Math.min(a.x, b.x, c.x) - minX) / step));
    const x1 = Math.min(width - 1, Math.floor((Math.max(a.x, b.x, c.x) - minX) / step));
    const z0 = Math.max(0, Math.floor((Math.min(a.z, b.z, c.z) - minZ) / step));
    const z1 = Math.min(height - 1, Math.floor((Math.max(a.z, b.z, c.z) - minZ) / step));
    for (let z = z0; z <= z1; z++) for (let x = x0; x <= x1; x++) {
      const px = minX + (x + 0.5) * step, pz = minZ + (z + 0.5) * step;
      const u = ((b.x - px) * (c.z - pz) - (b.z - pz) * (c.x - px)) / area;
      const v = ((c.x - px) * (a.z - pz) - (c.z - pz) * (a.x - px)) / area;
      if (u >= -1e-8 && v >= -1e-8 && u + v <= 1 + 1e-8) mask[z * width + x] = 1;
    }
  }
  const boundary: number[] = [], outside: number[] = [];
  for (let z = 1; z < height - 1; z++) for (let x = 1; x < width - 1; x++) {
    const i = z * width + x;
    const neighbors = [mask[i - 1], mask[i + 1], mask[i - width], mask[i + width]];
    if (mask[i] && neighbors.includes(0)) boundary.push(minX + (x + 0.5) * step, minZ + (z + 0.5) * step);
    if (!mask[i] && neighbors.includes(1)) outside.push(x, z);
  }
  const depth = new Float32Array(mask.length), normalX = new Float32Array(mask.length), normalZ = new Float32Array(mask.length);
  for (let i = 0; i < mask.length; i++) {
    if (!mask[i]) continue;
    const x = i % width, z = Math.floor(i / width);
    let best = Infinity, dx = 0, dz = 0;
    for (let j = 0; j < outside.length; j += 2) {
      const nx = outside[j] - x, nz = outside[j + 1] - z;
      const distance = nx * nx + nz * nz;
      if (distance < best) { best = distance; dx = nx; dz = nz; }
    }
    const distance = Math.sqrt(best);
    depth[i] = (distance - 0.5) * step;
    normalX[i] = dx / distance; normalZ[i] = dz / distance;
  }
  return { minX, minZ, maxX: box.max.x, maxZ: box.max.z, step, width, height, depth, normalX, normalZ, boundary };
}

export function getLogoContact(a: LogoCollider, ax: number, az: number, b: LogoCollider, bx: number, bz: number) {
  if (a.maxX + ax < b.minX + bx || b.maxX + bx < a.minX + ax || a.maxZ + az < b.minZ + bz || b.maxZ + bz < a.minZ + az) return null;
  let depth = 0, normalX = 0, normalZ = 0, fallbackX = 1, fallbackZ = 0;
  const sample = (source: LogoCollider, target: LogoCollider, dx: number, dz: number, sign: number) => {
    for (let i = 0; i < source.boundary.length; i += 2) {
      const x = Math.floor((source.boundary[i] + dx - target.minX) / target.step);
      const z = Math.floor((source.boundary[i + 1] + dz - target.minZ) / target.step);
      if (x < 0 || z < 0 || x >= target.width || z >= target.height) continue;
      const index = z * target.width + x;
      if (target.depth[index] > depth) {
        depth = target.depth[index];
        normalX = target.normalX[index] * sign;
        normalZ = target.normalZ[index] * sign;
        fallbackX = normalX; fallbackZ = normalZ;
      } else if (depth > 0 && Math.abs(target.depth[index] - depth) < 1e-8) {
        normalX += target.normalX[index] * sign;
        normalZ += target.normalZ[index] * sign;
      }
    }
  };
  sample(a, b, ax - bx, az - bz, -1);
  sample(b, a, bx - ax, bz - az, 1);
  if (Math.hypot(normalX, normalZ) < 1e-8) { normalX = fallbackX; normalZ = fallbackZ; }
  const length = Math.hypot(normalX, normalZ);
  return depth > 0 && length > 1e-8
    ? { depth, normalX: normalX / length, normalZ: normalZ / length }
    : null;
}
