import { create } from "zustand";
import { persist } from "zustand/middleware";
import { compileField, FIELD_PRESETS, type FieldFn } from "./field-math";
import type { PlaceMat, Tool, WorldId } from "./voxel-sim";
import { SAND } from "./voxel-sim";

type LabState = {
  equation: string;
  presetId: string;
  playing: boolean;
  worldId: WorldId;
  tool: Tool;
  placeMat: PlaceMat;
  brush: number;
  particleCount: number;
  fieldForce: number;
  codeBlend: number;
  gravity: number;
  showArrows: boolean;
  showCodes: boolean;
  compiled: FieldFn;
  parseError: string | null;
  setEquation: (equation: string) => void;
  applyPreset: (id: string) => void;
  setPlaying: (playing: boolean) => void;
  togglePlaying: () => void;
  setWorldId: (id: WorldId) => void;
  setTool: (t: Tool) => void;
  setPlaceMat: (m: PlaceMat) => void;
  setBrush: (n: number) => void;
  setParticleCount: (n: number) => void;
  setFieldForce: (n: number) => void;
  setCodeBlend: (n: number) => void;
  setGravity: (n: number) => void;
  setShowArrows: (v: boolean) => void;
  setShowCodes: (v: boolean) => void;
};

function compile(eq: string) {
  const { fn, error } = compileField(eq);
  return { compiled: fn, parseError: error };
}

export const useLab = create<LabState>()(
  persist(
    (set, get) => ({
      equation: FIELD_PRESETS[1].src,
      presetId: FIELD_PRESETS[1].id,
      playing: true,
      worldId: "canyon",
      tool: "place",
      placeMat: SAND,
      brush: 1,
      particleCount: 1400,
      fieldForce: 1.15,
      codeBlend: 0.85,
      gravity: 0.8,
      showArrows: true,
      showCodes: true,
      ...compile(FIELD_PRESETS[1].src),
      setEquation: (equation) => set({ equation, presetId: "custom", ...compile(equation) }),
      applyPreset: (id) => {
        const p = FIELD_PRESETS.find((x) => x.id === id);
        if (!p) return;
        set({ equation: p.src, presetId: p.id, ...compile(p.src) });
      },
      setPlaying: (playing) => set({ playing }),
      togglePlaying: () => set({ playing: !get().playing }),
      setWorldId: (worldId) => set({ worldId }),
      setTool: (tool) => set({ tool }),
      setPlaceMat: (placeMat) => set({ placeMat }),
      setBrush: (brush) => set({ brush }),
      setParticleCount: (particleCount) => set({ particleCount }),
      setFieldForce: (fieldForce) => set({ fieldForce }),
      setCodeBlend: (codeBlend) => set({ codeBlend }),
      setGravity: (gravity) => set({ gravity }),
      setShowArrows: (showArrows) => set({ showArrows }),
      setShowCodes: (showCodes) => set({ showCodes }),
    }),
    {
      name: "flux-voxel-v1",
      skipHydration: true,
      partialize: (s) => ({
        equation: s.equation,
        presetId: s.presetId,
        worldId: s.worldId,
        tool: s.tool,
        placeMat: s.placeMat,
        brush: s.brush,
        particleCount: s.particleCount,
        fieldForce: s.fieldForce,
        codeBlend: s.codeBlend,
        gravity: s.gravity,
        showArrows: s.showArrows,
        showCodes: s.showCodes,
      }),
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<LabState>;
        const equation = p.equation ?? current.equation;
        return { ...current, ...p, ...compile(equation) };
      },
    },
  ),
);
