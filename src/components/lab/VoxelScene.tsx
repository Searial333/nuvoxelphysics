import { useEffect, useRef, type MutableRefObject } from "react";
import { useLab } from "@/lib/lab-store";
import {
  AIR,
  MAT_LABEL,
  SX,
  SY,
  SZ,
  VoxelWorld,
  type PlaceMat,
  type Tool,
  type WorldId,
} from "@/lib/voxel-sim";

export type HoverInfo = {
  x: number;
  y: number;
  z: number;
  mat: string;
  u: number;
  v: number;
  w: number;
  coded: boolean;
} | null;

export function VoxelScene({
  onHover,
  apiRef,
}: {
  onHover: (h: HoverInfo) => void;
  apiRef: MutableRefObject<{ rebuild: (id: WorldId) => void } | null>;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hoverRef = useRef(onHover);
  hoverRef.current = onHover;

  const compiled = useLab((s) => s.compiled);
  const playing = useLab((s) => s.playing);
  const fieldForce = useLab((s) => s.fieldForce);
  const codeBlend = useLab((s) => s.codeBlend);
  const gravity = useLab((s) => s.gravity);
  const particleCount = useLab((s) => s.particleCount);
  const showArrows = useLab((s) => s.showArrows);
  const tool = useLab((s) => s.tool);
  const placeMat = useLab((s) => s.placeMat);
  const brush = useLab((s) => s.brush);
  const worldId = useLab((s) => s.worldId);

  const params = useRef({
    compiled,
    playing,
    fieldForce,
    codeBlend,
    gravity,
    particleCount,
    showArrows,
    tool,
    placeMat,
    brush,
    worldId,
  });
  params.current = {
    compiled,
    playing,
    fieldForce,
    codeBlend,
    gravity,
    particleCount,
    showArrows,
    tool,
    placeMat,
    brush,
    worldId,
  };

  useEffect(() => {
    const host = hostRef.current;
    const canvasEl = canvasRef.current;
    if (!host || !canvasEl) return;
    let disposed = false;
    let cleanup: (() => void) | null = null;

    (async () => {
      const THREE = await import("three");
      const { OrbitControls } = await import("three/addons/controls/OrbitControls.js");
      if (disposed || !host || !canvasEl) return;

      const renderer = new THREE.WebGLRenderer({ canvas: canvasEl, antialias: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setClearColor(0x0b0c0e, 1);
      renderer.shadowMap.enabled = true;

      const scene = new THREE.Scene();
      scene.fog = new THREE.Fog(0x0b0c0e, 28, 64);

      const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 120);
      camera.position.set(28, 22, 34);

      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.target.set(SX / 2, SY * 0.35, SZ / 2);
      controls.maxPolarAngle = Math.PI * 0.49;
      controls.minDistance = 8;
      controls.maxDistance = 70;

      scene.add(new THREE.HemisphereLight(0xd7ddd8, 0x1a1c16, 0.75));
      const key = new THREE.DirectionalLight(0xf2f0ea, 1.05);
      key.position.set(18, 28, 12);
      key.castShadow = true;
      key.shadow.mapSize.set(1024, 1024);
      scene.add(key);
      scene.add(new THREE.AmbientLight(0x8fad9a, 0.1));

      const world = new VoxelWorld();
      world.reset(params.current.worldId);
      world.field = params.current.compiled;

      const terrainMat = new THREE.MeshStandardMaterial({
        vertexColors: true,
        roughness: 0.82,
        metalness: 0.04,
      });
      const terrain = new THREE.Mesh(new THREE.BufferGeometry(), terrainMat);
      terrain.castShadow = true;
      terrain.receiveShadow = true;
      scene.add(terrain);

      function rebuildMesh() {
        const data = world.buildMesh();
        const geo = new THREE.BufferGeometry();
        geo.setAttribute("position", new THREE.BufferAttribute(data.position, 3));
        geo.setAttribute("normal", new THREE.BufferAttribute(data.normal, 3));
        geo.setAttribute("color", new THREE.BufferAttribute(data.color, 3));
        geo.setIndex(new THREE.BufferAttribute(data.index, 1));
        const old = terrain.geometry;
        terrain.geometry = geo;
        old.dispose();
        world.dirty = false;
      }
      rebuildMesh();

      const pGeo = new THREE.BufferGeometry();
      const pPos = new Float32Array(4000 * 3);
      pGeo.setAttribute("position", new THREE.BufferAttribute(pPos, 3));
      const pMat = new THREE.PointsMaterial({
        color: 0xdce8df,
        size: 0.18,
        sizeAttenuation: true,
        transparent: true,
        opacity: 0.85,
      });
      const points = new THREE.Points(pGeo, pMat);
      scene.add(points);

      const arrowGroup = new THREE.Group();
      scene.add(arrowGroup);
      const arrowGeo = new THREE.ConeGeometry(0.08, 0.28, 5);
      arrowGeo.rotateX(Math.PI / 2);
      const arrowMat = new THREE.MeshBasicMaterial({ color: 0x8fad9a, transparent: true, opacity: 0.7 });
      const STEP = 4;
      const arrowCount =
        Math.ceil(SX / STEP) * Math.ceil(SY / STEP) * Math.ceil(SZ / STEP);
      const arrows = new THREE.InstancedMesh(arrowGeo, arrowMat, arrowCount);
      arrowGroup.add(arrows);
      const dummy = new THREE.Object3D();
      const up = new THREE.Vector3(0, 0, 1);

      function updateArrows() {
        let i = 0;
        for (let y = 2; y < SY; y += STEP) {
          for (let z = 2; z < SZ; z += STEP) {
            for (let x = 2; x < SX; x += STEP) {
              const [fx, fy, fz] = world.sampleField(x + 0.5, y + 0.5, z + 0.5);
              const mag = Math.hypot(fx, fy, fz);
              dummy.position.set(x + 0.5, y + 0.5, z + 0.5);
              if (mag < 0.02) {
                dummy.scale.set(0, 0, 0);
              } else {
                dummy.scale.set(1, 1, 0.6 + Math.min(1.6, mag));
                dummy.lookAt(dummy.position.x + fx, dummy.position.y + fy, dummy.position.z + fz);
                dummy.rotateX(Math.PI / 2);
              }
              dummy.updateMatrix();
              arrows.setMatrixAt(i, dummy.matrix);
              i++;
            }
          }
        }
        arrows.count = i;
        arrows.instanceMatrix.needsUpdate = true;
        void up;
      }
      updateArrows();

      const hiGeo = new THREE.BoxGeometry(1.02, 1.02, 1.02);
      const hiMat = new THREE.MeshBasicMaterial({
        color: 0x8fad9a,
        wireframe: true,
        transparent: true,
        opacity: 0.9,
      });
      const highlight = new THREE.Mesh(hiGeo, hiMat);
      highlight.visible = false;
      scene.add(highlight);

      apiRef.current = {
        rebuild: (id) => {
          world.reset(id);
          world.field = params.current.compiled;
          rebuildMesh();
          updateArrows();
        },
      };

      const raycaster = new THREE.Raycaster();
      const pointer = new THREE.Vector2();
      let dragging = false;
      let moved = 0;

      function ndc(e: { clientX: number; clientY: number }) {
        const r = renderer.domElement.getBoundingClientRect();
        pointer.x = ((e.clientX - r.left) / r.width) * 2 - 1;
        pointer.y = -((e.clientY - r.top) / r.height) * 2 + 1;
      }

      function hitVoxel() {
        raycaster.setFromCamera(pointer, camera);
        const origin = raycaster.ray.origin;
        const dir = raycaster.ray.direction;
        return world.raycast(origin.x, origin.y, origin.z, dir.x, dir.y, dir.z);
      }

      function applyTool(hit: NonNullable<ReturnType<VoxelWorld["raycast"]>>) {
        const p = params.current;
        const r = Math.max(0, Math.round(p.brush) - 1);
        const target = p.tool === "place" ? { x: hit.px, y: hit.py, z: hit.pz } : hit;
        const visit = (fn: (x: number, y: number, z: number) => void) => {
          for (let dx = -r; dx <= r; dx++) {
            for (let dy = -r; dy <= r; dy++) {
              for (let dz = -r; dz <= r; dz++) {
                if (dx * dx + dy * dy + dz * dz <= r * r + 0.2) fn(target.x + dx, target.y + dy, target.z + dz);
              }
            }
          }
        };
        if (p.tool === "carve") visit((x, y, z) => world.paint(x, y, z, AIR));
        else if (p.tool === "place") visit((x, y, z) => world.paint(x, y, z, p.placeMat as PlaceMat));
        else if (p.tool === "encode") world.encodeBrush(hit.x, hit.y, hit.z, Math.max(1, r + 1));
        else if (p.tool === "decode") visit((x, y, z) => world.decodeAt(x, y, z));
        else if (p.tool === "seed") {
          for (let k = 0; k < 18; k++) {
            world.particles.push({
              x: hit.px + Math.random(),
              y: hit.py + Math.random(),
              z: hit.pz + Math.random(),
              life: 1,
            });
          }
        }
      }

      function onDown(e: PointerEvent) {
        if (e.button !== 0) return;
        dragging = true;
        moved = 0;
        ndc(e);
      }
      function onMove(e: PointerEvent) {
        ndc(e);
        if (dragging) moved += Math.abs(e.movementX) + Math.abs(e.movementY);
        const hit = hitVoxel();
        if (!hit) {
          highlight.visible = false;
          hoverRef.current(null);
          return;
        }
        const show = params.current.tool === "place" ? { x: hit.px, y: hit.py, z: hit.pz } : hit;
        highlight.position.set(show.x + 0.5, show.y + 0.5, show.z + 0.5);
        highlight.visible = true;
        const [u, v, w] = world.sampleField(hit.x + 0.5, hit.y + 0.5, hit.z + 0.5);
        hoverRef.current({
          x: hit.x,
          y: hit.y,
          z: hit.z,
          mat: MAT_LABEL[hit.mat] ?? "?",
          u,
          v,
          w,
          coded: !!world.coded[hit.x + hit.y * SX + hit.z * SX * SY],
        });
      }
      function onUp(e: PointerEvent) {
        if (!dragging) return;
        dragging = false;
        if (moved > 6) return;
        ndc(e);
        const hit = hitVoxel();
        if (hit) applyTool(hit);
      }

      renderer.domElement.addEventListener("pointerdown", onDown);
      renderer.domElement.addEventListener("pointermove", onMove);
      renderer.domElement.addEventListener("pointerup", onUp);
      renderer.domElement.addEventListener("pointerleave", () => {
        highlight.visible = false;
        hoverRef.current(null);
      });

      function resize() {
        const root = host;
        if (!root) return;
        const w = root.clientWidth;
        const h = Math.max(1, root.clientHeight);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h, false);
        renderer.domElement.style.width = "100%";
        renderer.domElement.style.height = "100%";
      }
      resize();
      const ro = new ResizeObserver(resize);
      ro.observe(host);

      let acc = 0;
      let last = performance.now();
      let raf = 0;
      let arrowClock = 0;

      function tick(now: number) {
        if (disposed) return;
        const dt = Math.min(0.05, (now - last) / 1000);
        last = now;
        const p = params.current;
        world.field = p.compiled;
        world.fieldForce = p.fieldForce;
        world.codeBlend = p.codeBlend;
        world.gravity = p.gravity;
        if (p.playing) {
          world.time += dt;
          acc += dt;
          if (acc > 0.2) acc = 0.2;
          while (acc >= 1 / 20) {
            world.stepMaterials();
            acc -= 1 / 20;
          }
          world.stepParticles(dt, p.particleCount);
        }
        if (world.dirty) rebuildMesh();
        arrowClock += dt;
        arrowGroup.visible = p.showArrows;
        if (p.showArrows && arrowClock > 0.12) {
          updateArrows();
          arrowClock = 0;
        }
        const arr = pGeo.getAttribute("position") as { setXYZ: (i: number, x: number, y: number, z: number) => void; needsUpdate: boolean };
        const n = Math.min(world.particles.length, 4000);
        for (let i = 0; i < n; i++) {
          const pt = world.particles[i];
          arr.setXYZ(i, pt.x, pt.y, pt.z);
        }
        arr.needsUpdate = true;
        pGeo.setDrawRange(0, n);
        controls.update();
        renderer.render(scene, camera);
        raf = requestAnimationFrame(tick);
      }
      raf = requestAnimationFrame(tick);

      cleanup = () => {
        cancelAnimationFrame(raf);
        ro.disconnect();
        terrain.geometry.dispose();
        terrainMat.dispose();
        pGeo.dispose();
        pMat.dispose();
        arrowGeo.dispose();
        arrowMat.dispose();
        arrows.dispose();
        hiGeo.dispose();
        hiMat.dispose();
        renderer.dispose();
        apiRef.current = null;
      };
    })();

    return () => {
      disposed = true;
      cleanup?.();
    };
  }, [apiRef]);

  return (
    <div ref={hostRef} className="h-full w-full touch-none bg-bg">
      <canvas ref={canvasRef} className="block h-full w-full" aria-label="Voxel field world" />
    </div>
  );
}

export type { Tool };
