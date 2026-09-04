import type { FieldFn } from "./field-math";

export const SX = 32;
export const SY = 20;
export const SZ = 32;
export const N = SX * SY * SZ;

export const AIR = 0;
export const BEDROCK = 1;
export const STONE = 2;
export const SAND = 3;
export const WATER = 4;
export const EMBER = 5;
export const CRYSTAL = 6;

export const MAT_LABEL = ["air", "bedrock", "stone", "sand", "water", "ember", "crystal"];

export const MAT_COLOR: [number, number, number][] = [
  [0, 0, 0],
  [0.18, 0.18, 0.2],
  [0.42, 0.44, 0.46],
  [0.72, 0.62, 0.42],
  [0.28, 0.48, 0.62],
  [0.78, 0.38, 0.22],
  [0.55, 0.78, 0.68],
];

export type Tool = "carve" | "place" | "encode" | "decode" | "seed";
export type PlaceMat = typeof STONE | typeof SAND | typeof WATER | typeof EMBER | typeof CRYSTAL;
export type WorldId = "canyon" | "chamber" | "spires" | "lattice" | "crater";

export function idx(x: number, y: number, z: number) {
  return x + y * SX + z * SX * SY;
}

export function inBounds(x: number, y: number, z: number) {
  return x >= 0 && y >= 0 && z >= 0 && x < SX && y < SY && z < SZ;
}

function hash3(x: number, y: number, z: number) {
  let n = x * 374761393 + y * 668265263 + z * 1274126177;
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
}

function fbm(x: number, z: number) {
  return (
    hash3(Math.floor(x), 3, Math.floor(z)) * 0.55 +
    hash3(Math.floor(x * 0.5), 7, Math.floor(z * 0.5)) * 0.3 +
    hash3(Math.floor(x * 0.25), 11, Math.floor(z * 0.25)) * 0.15
  );
}

export type Particle = { x: number; y: number; z: number; life: number };

export class VoxelWorld {
  mat = new Uint8Array(N);
  coded = new Uint8Array(N);
  cx = new Float32Array(N);
  cy = new Float32Array(N);
  cz = new Float32Array(N);
  particles: Particle[] = [];
  dirty = true;
  field: FieldFn = () => [0, 0, 0];
  fieldForce = 1.2;
  codeBlend = 1;
  gravity = 0.85;
  time = 0;

  reset(id: WorldId) {
    this.mat.fill(AIR);
    this.coded.fill(0);
    this.cx.fill(0);
    this.cy.fill(0);
    this.cz.fill(0);
    this.particles.length = 0;
    if (id === "canyon") this.genCanyon();
    else if (id === "chamber") this.genChamber();
    else if (id === "spires") this.genSpires();
    else if (id === "lattice") this.genLattice();
    else this.genCrater();
    this.seedParticles(900);
    this.dirty = true;
  }

  private set(x: number, y: number, z: number, m: number) {
    if (inBounds(x, y, z)) this.mat[idx(x, y, z)] = m;
  }

  private genCanyon() {
    for (let x = 0; x < SX; x++) {
      for (let z = 0; z < SZ; z++) {
        const nx = x / SX;
        const nz = z / SZ;
        const river = Math.abs(nz - 0.5 - 0.12 * Math.sin(nx * 6.2));
        const ridge = fbm(x * 0.55, z * 0.55);
        let h = 5 + Math.floor(ridge * 8);
        if (river < 0.08) h = 3;
        for (let y = 0; y < SY; y++) {
          if (y === 0) this.set(x, y, z, BEDROCK);
          else if (y < h - 1) this.set(x, y, z, STONE);
          else if (y < h) this.set(x, y, z, river < 0.1 ? SAND : STONE);
          else if (river < 0.055 && y < 4) this.set(x, y, z, WATER);
        }
        if (ridge > 0.78 && h + 2 < SY) this.set(x, h + 1, z, CRYSTAL);
      }
    }
  }

  private genChamber() {
    const cx = SX / 2;
    const cy = SY * 0.45;
    const cz = SZ / 2;
    for (let x = 0; x < SX; x++) {
      for (let y = 0; y < SY; y++) {
        for (let z = 0; z < SZ; z++) {
          if (y === 0) {
            this.set(x, y, z, BEDROCK);
            continue;
          }
          const dx = (x - cx) / 13;
          const dy = (y - cy) / 7;
          const dz = (z - cz) / 13;
          const d = dx * dx + dy * dy + dz * dz;
          if (d > 1.05) this.set(x, y, z, y < 3 ? STONE : y > SY - 3 ? STONE : STONE);
          else if (d > 0.88) this.set(x, y, z, CRYSTAL);
          else if (y < 3 && Math.hypot(x - cx, z - cz) < 5) this.set(x, y, z, WATER);
        }
      }
    }
  }

  private genSpires() {
    for (let x = 0; x < SX; x++) {
      for (let z = 0; z < SZ; z++) {
        const base = 3 + Math.floor(fbm(x * 0.4, z * 0.4) * 3);
        for (let y = 0; y <= base; y++) this.set(x, y, z, y === 0 ? BEDROCK : STONE);
        const peak = hash3(x, 1, z);
        if (peak > 0.82) {
          const h = 8 + Math.floor(peak * 8);
          for (let y = base; y < Math.min(SY - 1, base + h); y++) {
            const r = y > base + h - 3 ? 0 : 1;
            for (let ox = -r; ox <= r; ox++) {
              for (let oz = -r; oz <= r; oz++) {
                this.set(x + ox, y, z + oz, y > base + h - 4 ? CRYSTAL : STONE);
              }
            }
          }
        } else if (peak > 0.7) {
          this.set(x, base + 1, z, SAND);
          this.set(x, base + 2, z, SAND);
        }
      }
    }
  }

  private genLattice() {
    for (let x = 0; x < SX; x++) {
      for (let y = 0; y < SY; y++) {
        for (let z = 0; z < SZ; z++) {
          if (y === 0) this.set(x, y, z, BEDROCK);
          else if (x % 4 === 0 && z % 4 === 0) this.set(x, y, z, STONE);
          else if (y % 5 === 0 && (x % 4 === 0 || z % 4 === 0)) this.set(x, y, z, STONE);
          else if (y === 1 && (x + z) % 7 === 0) this.set(x, y, z, SAND);
          else if ((x + z + y) % 11 === 0 && y > 8) this.set(x, y, z, CRYSTAL);
        }
      }
    }
  }

  private genCrater() {
    const cx = SX / 2;
    const cz = SZ / 2;
    for (let x = 0; x < SX; x++) {
      for (let z = 0; z < SZ; z++) {
        const r = Math.hypot(x - cx, z - cz);
        const bowl = Math.max(2, 11 - r * 0.7 + fbm(x * 0.8, z * 0.8) * 2);
        for (let y = 0; y < SY; y++) {
          if (y === 0) this.set(x, y, z, BEDROCK);
          else if (y < bowl) this.set(x, y, z, r < 4 && y < 5 ? EMBER : r < 7 && y < 6 ? SAND : STONE);
          else if (r < 3.2 && y < 6) this.set(x, y, z, EMBER);
        }
      }
    }
  }

  seedParticles(count: number) {
    this.particles.length = 0;
    let guard = 0;
    while (this.particles.length < count && guard++ < count * 8) {
      const x = Math.random() * SX;
      const y = Math.random() * SY;
      const z = Math.random() * SZ;
      if (this.sampleMat(x, y, z) === AIR) {
        this.particles.push({ x, y, z, life: 0.4 + Math.random() });
      }
    }
  }

  sampleMat(x: number, y: number, z: number) {
    const ix = Math.floor(x);
    const iy = Math.floor(y);
    const iz = Math.floor(z);
    if (!inBounds(ix, iy, iz)) return BEDROCK;
    return this.mat[idx(ix, iy, iz)];
  }

  worldToField(x: number, y: number, z: number): [number, number, number] {
    return [(x / SX) * 2 - 1, (y / SY) * 2 - 1, (z / SZ) * 2 - 1];
  }

  sampleField(x: number, y: number, z: number): [number, number, number] {
    const [nx, ny, nz] = this.worldToField(x, y, z);
    let [fx, fy, fz] = this.field(nx, ny, nz, this.time);
    const ix = Math.floor(x);
    const iy = Math.floor(y);
    const iz = Math.floor(z);
    if (inBounds(ix, iy, iz)) {
      const i = idx(ix, iy, iz);
      if (this.coded[i]) {
        const k = this.codeBlend;
        fx = fx * (1 - k) + this.cx[i] * k;
        fy = fy * (1 - k) + this.cy[i] * k;
        fz = fz * (1 - k) + this.cz[i] * k;
      }
    }
    return [fx * this.fieldForce, fy * this.fieldForce, fz * this.fieldForce];
  }

  encodeAt(x: number, y: number, z: number) {
    if (!inBounds(x, y, z)) return;
    const i = idx(x, y, z);
    if (this.mat[i] === AIR || this.mat[i] === BEDROCK) return;
    const [nx, ny, nz] = this.worldToField(x + 0.5, y + 0.5, z + 0.5);
    const [fx, fy, fz] = this.field(nx, ny, nz, this.time);
    this.coded[i] = 1;
    this.cx[i] = fx;
    this.cy[i] = fy;
    this.cz[i] = fz;
    this.dirty = true;
  }

  decodeAt(x: number, y: number, z: number) {
    if (!inBounds(x, y, z)) return;
    const i = idx(x, y, z);
    this.coded[i] = 0;
    this.dirty = true;
  }

  paint(x: number, y: number, z: number, m: number) {
    if (!inBounds(x, y, z)) return;
    if (this.mat[idx(x, y, z)] === BEDROCK && m === AIR) return;
    this.mat[idx(x, y, z)] = m;
    if (m === AIR) this.coded[idx(x, y, z)] = 0;
    this.dirty = true;
  }

  encodeBrush(x: number, y: number, z: number, r: number) {
    for (let dx = -r; dx <= r; dx++) {
      for (let dy = -r; dy <= r; dy++) {
        for (let dz = -r; dz <= r; dz++) {
          if (dx * dx + dy * dy + dz * dz <= r * r + 0.2) this.encodeAt(x + dx, y + dy, z + dz);
        }
      }
    }
  }

  stepMaterials() {
    const order: number[] = [];
    for (let i = 0; i < N; i++) {
      const m = this.mat[i];
      if (m === SAND || m === WATER || m === EMBER) order.push(i);
    }
    for (let k = order.length - 1; k > 0; k--) {
      const j = Math.floor(Math.random() * (k + 1));
      const tmp = order[k];
      order[k] = order[j];
      order[j] = tmp;
    }
    let moved = 0;
    for (const i of order) {
      const x = i % SX;
      const y = Math.floor(i / SX) % SY;
      const z = Math.floor(i / (SX * SY));
      const m = this.mat[i];
      if (m !== SAND && m !== WATER && m !== EMBER) continue;
      const [fx, fy, fz] = this.sampleField(x + 0.5, y + 0.5, z + 0.5);
      let gy = m === EMBER ? 0.55 : m === WATER ? -0.25 : -this.gravity;
      if (m === SAND) gy = -this.gravity;
      const vx = fx;
      const vy = fy + gy;
      const vz = fz;
      const ax = Math.abs(vx) >= Math.abs(vy) && Math.abs(vx) >= Math.abs(vz) ? Math.sign(vx) : 0;
      const ay = Math.abs(vy) >= Math.abs(vx) && Math.abs(vy) >= Math.abs(vz) ? Math.sign(vy) : 0;
      const az = ax === 0 && ay === 0 ? Math.sign(vz) : 0;
      const candidates: [number, number, number][] = [];
      if (ax || ay || az) candidates.push([x + ax, y + ay, z + az]);
      if (m === SAND || m === WATER) candidates.push([x, y - 1, z]);
      if (m === WATER) {
        candidates.push([x + 1, y, z], [x - 1, y, z], [x, y, z + 1], [x, y, z - 1]);
      }
      if (m === EMBER) candidates.push([x, y + 1, z]);
      if (m === SAND) {
        candidates.push([x + 1, y - 1, z], [x - 1, y - 1, z], [x, y - 1, z + 1], [x, y - 1, z - 1]);
      }
      for (const [nx, ny, nz] of candidates) {
        if (!inBounds(nx, ny, nz)) continue;
        const j = idx(nx, ny, nz);
        if (this.mat[j] !== AIR) continue;
        this.mat[j] = m;
        this.mat[i] = AIR;
        if (this.coded[i]) {
          this.coded[j] = 1;
          this.cx[j] = this.cx[i];
          this.cy[j] = this.cy[i];
          this.cz[j] = this.cz[i];
          this.coded[i] = 0;
        }
        moved++;
        break;
      }
    }
    if (moved) this.dirty = true;
  }

  stepParticles(dt: number, target: number) {
    while (this.particles.length < target) {
      const x = Math.random() * SX;
      const y = 2 + Math.random() * (SY - 3);
      const z = Math.random() * SZ;
      if (this.sampleMat(x, y, z) === AIR) this.particles.push({ x, y, z, life: 1 });
      else break;
    }
    if (this.particles.length > target) this.particles.length = target;
    for (const p of this.particles) {
      const [fx, fy, fz] = this.sampleField(p.x, p.y, p.z);
      p.x += fx * dt * 4.2;
      p.y += (fy - this.gravity * 0.15) * dt * 4.2;
      p.z += fz * dt * 4.2;
      p.life -= dt * 0.18;
      const solid = this.sampleMat(p.x, p.y, p.z) !== AIR;
      if (p.life <= 0 || solid || !inBounds(Math.floor(p.x), Math.floor(p.y), Math.floor(p.z))) {
        p.x = Math.random() * SX;
        p.y = 3 + Math.random() * (SY - 5);
        p.z = Math.random() * SZ;
        p.life = 0.5 + Math.random();
      }
    }
  }

  raycast(ox: number, oy: number, oz: number, dx: number, dy: number, dz: number, max = 64) {
    let x = Math.floor(ox);
    let y = Math.floor(oy);
    let z = Math.floor(oz);
    const stepX = dx >= 0 ? 1 : -1;
    const stepY = dy >= 0 ? 1 : -1;
    const stepZ = dz >= 0 ? 1 : -1;
    const tDeltaX = dx === 0 ? Infinity : Math.abs(1 / dx);
    const tDeltaY = dy === 0 ? Infinity : Math.abs(1 / dy);
    const tDeltaZ = dz === 0 ? Infinity : Math.abs(1 / dz);
    let tMaxX = tDeltaX * (dx >= 0 ? x + 1 - ox : ox - x);
    let tMaxY = tDeltaY * (dy >= 0 ? y + 1 - oy : oy - y);
    let tMaxZ = tDeltaZ * (dz >= 0 ? z + 1 - oz : oz - z);
    let px = x;
    let py = y;
    let pz = z;
    for (let i = 0; i < max; i++) {
      if (!inBounds(x, y, z)) return null;
      if (this.mat[idx(x, y, z)] !== AIR) {
        return { x, y, z, px, py, pz, mat: this.mat[idx(x, y, z)] };
      }
      px = x;
      py = y;
      pz = z;
      if (tMaxX < tMaxY && tMaxX < tMaxZ) {
        x += stepX;
        tMaxX += tDeltaX;
      } else if (tMaxY < tMaxZ) {
        y += stepY;
        tMaxY += tDeltaY;
      } else {
        z += stepZ;
        tMaxZ += tDeltaZ;
      }
    }
    return null;
  }

  buildMesh() {
    const pos: number[] = [];
    const nrm: number[] = [];
    const col: number[] = [];
    const faces: [number, number, number, number, number, number][] = [
      [1, 0, 0, 1, 0, 0],
      [-1, 0, 0, -1, 0, 0],
      [0, 1, 0, 0, 1, 0],
      [0, -1, 0, 0, -1, 0],
      [0, 0, 1, 0, 0, 1],
      [0, 0, -1, 0, 0, -1],
    ];
    const quads: Record<string, number[][]> = {
      "1,0,0": [
        [1, 0, 0],
        [1, 1, 0],
        [1, 1, 1],
        [1, 0, 1],
      ],
      "-1,0,0": [
        [0, 0, 1],
        [0, 1, 1],
        [0, 1, 0],
        [0, 0, 0],
      ],
      "0,1,0": [
        [0, 1, 1],
        [1, 1, 1],
        [1, 1, 0],
        [0, 1, 0],
      ],
      "0,-1,0": [
        [0, 0, 0],
        [1, 0, 0],
        [1, 0, 1],
        [0, 0, 1],
      ],
      "0,0,1": [
        [0, 0, 1],
        [1, 0, 1],
        [1, 1, 1],
        [0, 1, 1],
      ],
      "0,0,-1": [
        [1, 0, 0],
        [0, 0, 0],
        [0, 1, 0],
        [1, 1, 0],
      ],
    };

    for (let x = 0; x < SX; x++) {
      for (let y = 0; y < SY; y++) {
        for (let z = 0; z < SZ; z++) {
          const m = this.mat[idx(x, y, z)];
          if (m === AIR) continue;
          const rgb = MAT_COLOR[m];
          const marked = this.coded[idx(x, y, z)];
          for (const [dx, dy, dz] of faces) {
            const nx = x + dx;
            const ny = y + dy;
            const nz = z + dz;
            const exposed = !inBounds(nx, ny, nz) || this.mat[idx(nx, ny, nz)] === AIR;
            if (!exposed) continue;
            const key = `${dx},${dy},${dz}`;
            const q = quads[key];
            const shade = 0.55 + 0.45 * Math.max(0, dx * 0.35 + dy * 0.7 + dz * 0.15);
            const cr = Math.min(1, rgb[0] * shade + (marked ? 0.12 : 0));
            const cg = Math.min(1, rgb[1] * shade + (marked ? 0.18 : 0));
            const cb = Math.min(1, rgb[2] * shade + (marked ? 0.08 : 0));
            const v0 = pos.length / 3;
            for (const [qx, qy, qz] of q) {
              pos.push(x + qx, y + qy, z + qz);
              nrm.push(dx, dy, dz);
              col.push(cr, cg, cb);
            }
            // two triangles — push by duplicating last pattern via indexed later
            void v0;
          }
        }
      }
    }

    const index: number[] = [];
    const verts = pos.length / 3;
    for (let i = 0; i < verts; i += 4) {
      index.push(i, i + 1, i + 2, i, i + 2, i + 3);
    }
    return {
      position: new Float32Array(pos),
      normal: new Float32Array(nrm),
      color: new Float32Array(col),
      index: new Uint32Array(index),
    };
  }
}
