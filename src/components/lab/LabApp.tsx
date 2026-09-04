import { useEffect, useRef, useState, type ReactNode } from "react";
import { Pause, Play, RotateCcw } from "lucide-react";
import { VoxelScene, type HoverInfo } from "./VoxelScene";
import { useLab } from "@/lib/lab-store";
import { FIELD_PRESETS } from "@/lib/field-math";
import {
  CRYSTAL,
  EMBER,
  SAND,
  STONE,
  WATER,
  type PlaceMat,
  type Tool,
  type WorldId,
} from "@/lib/voxel-sim";
import { cn } from "@/lib/utils";

function fmt(n: number) {
  if (!Number.isFinite(n)) return "—";
  return Math.abs(n) >= 10 ? n.toFixed(2) : n.toFixed(3);
}

const WORLDS: { id: WorldId; label: string }[] = [
  { id: "canyon", label: "Canyon" },
  { id: "chamber", label: "Chamber" },
  { id: "spires", label: "Spires" },
  { id: "lattice", label: "Lattice" },
  { id: "crater", label: "Crater" },
];

const TOOLS: { id: Tool; label: string }[] = [
  { id: "place", label: "Place" },
  { id: "carve", label: "Carve" },
  { id: "encode", label: "Encode" },
  { id: "decode", label: "Clear code" },
  { id: "seed", label: "Seed" },
];

const MATS: { id: PlaceMat; label: string }[] = [
  { id: STONE, label: "Stone" },
  { id: SAND, label: "Sand" },
  { id: WATER, label: "Water" },
  { id: EMBER, label: "Ember" },
  { id: CRYSTAL, label: "Crystal" },
];

export function LabApp() {
  const equation = useLab((s) => s.equation);
  const setEquation = useLab((s) => s.setEquation);
  const presetId = useLab((s) => s.presetId);
  const applyPreset = useLab((s) => s.applyPreset);
  const playing = useLab((s) => s.playing);
  const togglePlaying = useLab((s) => s.togglePlaying);
  const worldId = useLab((s) => s.worldId);
  const setWorldId = useLab((s) => s.setWorldId);
  const tool = useLab((s) => s.tool);
  const setTool = useLab((s) => s.setTool);
  const placeMat = useLab((s) => s.placeMat);
  const setPlaceMat = useLab((s) => s.setPlaceMat);
  const brush = useLab((s) => s.brush);
  const setBrush = useLab((s) => s.setBrush);
  const particleCount = useLab((s) => s.particleCount);
  const setParticleCount = useLab((s) => s.setParticleCount);
  const fieldForce = useLab((s) => s.fieldForce);
  const setFieldForce = useLab((s) => s.setFieldForce);
  const codeBlend = useLab((s) => s.codeBlend);
  const setCodeBlend = useLab((s) => s.setCodeBlend);
  const gravity = useLab((s) => s.gravity);
  const setGravity = useLab((s) => s.setGravity);
  const showArrows = useLab((s) => s.showArrows);
  const setShowArrows = useLab((s) => s.setShowArrows);
  const parseError = useLab((s) => s.parseError);

  const [hover, setHover] = useState<HoverInfo>(null);
  const [eqDraft, setEqDraft] = useState(equation);
  const apiRef = useRef<{ rebuild: (id: WorldId) => void } | null>(null);

  useEffect(() => {
    void useLab.persist.rehydrate();
  }, []);
  useEffect(() => setEqDraft(equation), [equation]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      if (e.code === "Space") {
        e.preventDefault();
        togglePlaying();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [togglePlaying]);

  const hint = FIELD_PRESETS.find((x) => x.id === presetId)?.hint ?? "Custom field codes the voxel volume";

  return (
    <div className="flex min-h-dvh flex-col bg-bg text-fg">
      <header className="flex flex-wrap items-center gap-3 border-b border-border px-4 py-3 sm:px-6">
        <div className="min-w-0 flex-1">
          <p className="font-mono text-[11px] tracking-[0.18em] text-muted uppercase">Voxel field</p>
          <h1 className="font-display text-2xl leading-tight text-fg italic">Flux Lab</h1>
        </div>
        <button
          type="button"
          onClick={togglePlaying}
          className="inline-flex h-11 min-w-11 items-center justify-center gap-2 rounded-lg bg-accent px-3 text-sm font-medium text-accent-fg transition-transform duration-150 active:scale-[0.98]"
        >
          {playing ? <Pause className="size-4" /> : <Play className="size-4" />}
          <span className="hidden sm:inline">{playing ? "Pause" : "Play"}</span>
        </button>
      </header>

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <section className="relative min-h-[52vh] flex-1 lg:min-h-0">
          <VoxelScene onHover={setHover} apiRef={apiRef} />
          <div className="pointer-events-none absolute inset-x-3 top-3 flex flex-wrap items-start justify-between gap-2 sm:inset-x-4">
            <div className="rounded-lg bg-bg/80 px-3 py-2 ring-1 ring-border backdrop-blur-sm">
              <p className="font-mono text-[11px] text-muted">{hint}</p>
              <p className="mt-1 text-[11px] text-subtle">
                Drag to orbit. Click a voxel to use the current tool.
              </p>
            </div>
            {hover && (
              <div className="rounded-lg bg-bg/80 px-3 py-2 font-mono text-[11px] tabular-nums text-fg ring-1 ring-border backdrop-blur-sm">
                <div>
                  {hover.x},{hover.y},{hover.z}
                  <span className="mx-2 text-subtle">·</span>
                  {hover.mat}
                  {hover.coded ? <span className="text-accent"> coded</span> : null}
                </div>
                <div className="text-accent">
                  F ({fmt(hover.u)}, {fmt(hover.v)}, {fmt(hover.w)})
                </div>
              </div>
            )}
          </div>
        </section>

        <aside className="w-full shrink-0 overflow-y-auto border-t border-border bg-surface lg:w-[22.5rem] lg:border-t-0 lg:border-l">
          <div className="flex flex-col gap-5 p-4 sm:p-5">
            <section>
              <Label>World</Label>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {WORLDS.map((w) => (
                  <button
                    key={w.id}
                    type="button"
                    onClick={() => {
                      setWorldId(w.id);
                      apiRef.current?.rebuild(w.id);
                    }}
                    className={cn(
                      "rounded-full px-3 py-1.5 text-xs font-medium ring-1",
                      worldId === w.id
                        ? "bg-accent text-accent-fg ring-accent"
                        : "bg-elevated text-muted ring-border hover:text-fg",
                    )}
                  >
                    {w.label}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => apiRef.current?.rebuild(worldId)}
                className="mt-2 inline-flex h-11 items-center gap-2 rounded-lg bg-elevated px-3 text-sm text-fg ring-1 ring-border"
              >
                <RotateCcw className="size-4" />
                Rebuild world
              </button>
            </section>

            <section>
              <Label>Field equation</Label>
              <p className="mb-2 text-xs text-muted">Fx, Fy, Fz in x, y, z, t. Y is up. Two terms map onto the ground plane.</p>
              <input
                value={eqDraft}
                onChange={(e) => setEqDraft(e.target.value)}
                onBlur={() => setEquation(eqDraft)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") setEquation(eqDraft);
                }}
                spellCheck={false}
                suppressHydrationWarning
                className="h-11 w-full rounded-lg bg-elevated px-3 font-mono text-sm text-fg ring-1 ring-border outline-none focus:ring-accent"
                aria-label="Field equation"
              />
              {parseError ? (
                <p className="mt-2 text-xs text-danger">{parseError}</p>
              ) : (
                <p className="mt-2 text-xs text-muted">Sand, water, and ember step along this field.</p>
              )}
            </section>

            <section>
              <Label>Presets</Label>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {FIELD_PRESETS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => applyPreset(p.id)}
                    className={cn(
                      "rounded-full px-3 py-1.5 text-xs font-medium ring-1",
                      presetId === p.id
                        ? "bg-accent text-accent-fg ring-accent"
                        : "bg-elevated text-muted ring-border hover:text-fg",
                    )}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </section>

            <section>
              <Label>Tool</Label>
              <div className="mt-2 grid grid-cols-2 gap-1.5">
                {TOOLS.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTool(t.id)}
                    className={cn(
                      "h-11 rounded-lg text-xs font-medium ring-1",
                      tool === t.id
                        ? "bg-accent text-accent-fg ring-accent"
                        : "bg-elevated text-muted ring-border hover:text-fg",
                    )}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {MATS.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      setPlaceMat(m.id);
                      setTool("place");
                    }}
                    className={cn(
                      "rounded-full px-3 py-1.5 text-xs font-medium ring-1",
                      placeMat === m.id && tool === "place"
                        ? "bg-accent text-accent-fg ring-accent"
                        : "bg-elevated text-muted ring-border",
                    )}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </section>

            <SliderRow label="Brush" value={brush} min={1} max={4} step={1} display={String(brush)} onChange={setBrush} />
            <SliderRow
              label="Tracers"
              value={particleCount}
              min={200}
              max={3200}
              step={50}
              display={String(Math.round(particleCount))}
              onChange={setParticleCount}
            />
            <SliderRow
              label="Field force"
              value={fieldForce}
              min={0}
              max={3}
              step={0.05}
              display={fieldForce.toFixed(2)}
              onChange={setFieldForce}
            />
            <SliderRow
              label="Code blend"
              value={codeBlend}
              min={0}
              max={1}
              step={0.01}
              display={codeBlend.toFixed(2)}
              onChange={setCodeBlend}
            />
            <SliderRow
              label="Gravity"
              value={gravity}
              min={0}
              max={2}
              step={0.05}
              display={gravity.toFixed(2)}
              onChange={setGravity}
            />
            <button
              type="button"
              aria-pressed={showArrows}
              onClick={() => setShowArrows(!showArrows)}
              className={cn(
                "h-11 rounded-lg text-xs font-medium ring-1",
                showArrows ? "bg-accent text-accent-fg ring-accent" : "bg-elevated text-muted ring-border",
              )}
            >
              Field arrows
            </button>
            <p className="text-xs text-muted">
              Encode writes the live field into a voxel. Those codes keep pushing neighbors even after you change the equation.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Label({ children }: { children: ReactNode }) {
  return <h2 className="font-mono text-[11px] tracking-[0.16em] text-muted uppercase">{children}</h2>;
}

function SliderRow({
  label,
  value,
  min,
  max,
  step,
  display,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  display: string;
  onChange: (n: number) => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 flex items-center justify-between font-mono text-[11px] tracking-[0.16em] text-muted uppercase">
        {label}
        <span className="tabular-nums text-fg normal-case tracking-normal">{display}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        suppressHydrationWarning
        className="h-11 w-full accent-accent"
      />
    </label>
  );
}
