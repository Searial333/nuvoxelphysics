export type FieldFn = (x: number, y: number, z: number, t: number) => [number, number, number];

type Node =
  | { k: "num"; v: number }
  | { k: "var"; v: "x" | "y" | "z" | "t" }
  | { k: "un"; op: "-"; a: Node }
  | { k: "bin"; op: "+" | "-" | "*" | "/" | "^"; a: Node; b: Node }
  | { k: "call"; name: string; args: Node[] };

const FNS: Record<string, (...a: number[]) => number> = {
  sin: (a) => Math.sin(a),
  cos: (a) => Math.cos(a),
  tan: (a) => Math.tan(a),
  asin: (a) => Math.asin(a),
  acos: (a) => Math.acos(a),
  atan: (a) => Math.atan(a),
  atan2: (a, b) => Math.atan2(a, b),
  abs: (a) => Math.abs(a),
  sqrt: (a) => Math.sqrt(Math.max(0, a)),
  exp: (a) => Math.exp(a),
  log: (a) => Math.log(Math.abs(a) + 1e-12),
  ln: (a) => Math.log(Math.abs(a) + 1e-12),
  min: (a, b) => Math.min(a, b),
  max: (a, b) => Math.max(a, b),
  hypot: (a, b) => Math.hypot(a, b),
  pow: (a, b) => Math.pow(a, b),
  floor: (a) => Math.floor(a),
  ceil: (a) => Math.ceil(a),
  sign: (a) => Math.sign(a),
  noise: (a, b = 0) => {
    const n = Math.sin(a * 12.9898 + b * 78.233) * 43758.5453;
    return n - Math.floor(n);
  },
};

const CONSTS: Record<string, number> = {
  pi: Math.PI,
  tau: Math.PI * 2,
  e: Math.E,
};

type Tok =
  | { t: "n"; v: number }
  | { t: "id"; v: string }
  | { t: "op"; v: string }
  | { t: "lp" }
  | { t: "rp" }
  | { t: "comma" };

function tokenize(src: string): Tok[] {
  const out: Tok[] = [];
  let i = 0;
  const s = src.trim();
  while (i < s.length) {
    const c = s[i];
    if (c === " " || c === "\t" || c === "\n") {
      i++;
      continue;
    }
    if (c === "(") {
      out.push({ t: "lp" });
      i++;
      continue;
    }
    if (c === ")") {
      out.push({ t: "rp" });
      i++;
      continue;
    }
    if (c === ",") {
      out.push({ t: "comma" });
      i++;
      continue;
    }
    if ("+-*/^".includes(c)) {
      out.push({ t: "op", v: c });
      i++;
      continue;
    }
    if ((c >= "0" && c <= "9") || c === ".") {
      let j = i + 1;
      while (j < s.length && ((s[j] >= "0" && s[j] <= "9") || s[j] === ".")) j++;
      out.push({ t: "n", v: Number(s.slice(i, j)) });
      i = j;
      continue;
    }
    if ((c >= "a" && c <= "z") || (c >= "A" && c <= "Z") || c === "_") {
      let j = i + 1;
      while (
        j < s.length &&
        ((s[j] >= "a" && s[j] <= "z") ||
          (s[j] >= "A" && s[j] <= "Z") ||
          (s[j] >= "0" && s[j] <= "9") ||
          s[j] === "_")
      )
        j++;
      out.push({ t: "id", v: s.slice(i, j).toLowerCase() });
      i = j;
      continue;
    }
    throw new Error(`Unexpected “${c}”`);
  }
  return out;
}

function parseExpr(tokens: Tok[]): Node {
  let i = 0;
  const peek = () => tokens[i];
  const eat = () => tokens[i++];

  function expr(): Node {
    let n = term();
    while (peek()?.t === "op" && "+-".includes((peek() as { v: string }).v)) {
      const op = eat() as { t: "op"; v: "+" | "-" };
      n = { k: "bin", op: op.v, a: n, b: term() };
    }
    return n;
  }

  function term(): Node {
    let n = power();
    while (peek()?.t === "op" && "*/".includes((peek() as { v: string }).v)) {
      const op = eat() as { t: "op"; v: "*" | "/" };
      n = { k: "bin", op: op.v, a: n, b: power() };
    }
    return n;
  }

  function power(): Node {
    const n = unary();
    if (peek()?.t === "op" && (peek() as { v: string }).v === "^") {
      eat();
      return { k: "bin", op: "^", a: n, b: power() };
    }
    return n;
  }

  function unary(): Node {
    if (peek()?.t === "op" && (peek() as { v: string }).v === "-") {
      eat();
      return { k: "un", op: "-", a: unary() };
    }
    if (peek()?.t === "op" && (peek() as { v: string }).v === "+") {
      eat();
      return unary();
    }
    return primary();
  }

  function primary(): Node {
    const tok = peek();
    if (!tok) throw new Error("Unexpected end of expression");
    if (tok.t === "n") {
      eat();
      return { k: "num", v: tok.v };
    }
    if (tok.t === "id") {
      eat();
      const name = tok.v;
      if (peek()?.t === "lp") {
        eat();
        const args: Node[] = [];
        if (peek() && peek().t !== "rp") {
          args.push(expr());
          while (peek()?.t === "comma") {
            eat();
            args.push(expr());
          }
        }
        if (peek()?.t !== "rp") throw new Error(`Missing ) after ${name}(`);
        eat();
        if (!FNS[name]) throw new Error(`Unknown function ${name}`);
        return { k: "call", name, args };
      }
      if (name === "x" || name === "y" || name === "z" || name === "t") return { k: "var", v: name };
      if (name in CONSTS) return { k: "num", v: CONSTS[name] };
      throw new Error(`Unknown symbol ${name}`);
    }
    if (tok.t === "lp") {
      eat();
      const n = expr();
      if (peek()?.t !== "rp") throw new Error("Missing )");
      eat();
      return n;
    }
    throw new Error("Expected a number, variable, or (");
  }

  const tree = expr();
  if (i < tokens.length) throw new Error("Unexpected extra tokens");
  return tree;
}

function evalNode(n: Node, x: number, y: number, z: number, t: number): number {
  switch (n.k) {
    case "num":
      return n.v;
    case "var":
      return n.v === "x" ? x : n.v === "y" ? y : n.v === "z" ? z : t;
    case "un":
      return -evalNode(n.a, x, y, z, t);
    case "bin": {
      const a = evalNode(n.a, x, y, z, t);
      const b = evalNode(n.b, x, y, z, t);
      if (n.op === "+") return a + b;
      if (n.op === "-") return a - b;
      if (n.op === "*") return a * b;
      if (n.op === "/") return a / (Math.abs(b) < 1e-12 ? 1e-12 * Math.sign(b || 1) : b);
      return Math.pow(a, b);
    }
    case "call": {
      const fn = FNS[n.name];
      const args = n.args.map((a) => evalNode(a, x, y, z, t));
      return fn(...args);
    }
  }
}

function splitTopComma(src: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let acc = "";
  for (const c of src) {
    if (c === "(") depth++;
    if (c === ")") depth--;
    if (c === "," && depth === 0) {
      parts.push(acc);
      acc = "";
      continue;
    }
    acc += c;
  }
  if (acc.trim()) parts.push(acc);
  return parts.map((p) => p.trim()).filter(Boolean);
}

export function compileField(src: string): { fn: FieldFn; error: string | null } {
  try {
    const parts = splitTopComma(src);
    if (parts.length < 1 || parts.length > 3) {
      return { fn: () => [0, 0, 0], error: "Write Fx, Fy, Fz (Y is up)" };
    }
    const ux = parseExpr(tokenize(parts[0]));
    const uy = parts[1] ? parseExpr(tokenize(parts[1])) : { k: "num" as const, v: 0 };
    const uz = parts[2] ? parseExpr(tokenize(parts[2])) : { k: "num" as const, v: 0 };
    const two = parts.length === 2;
    const fn: FieldFn = (x, y, z, t) => {
      const a = evalNode(ux, x, y, z, t);
      const b = evalNode(uy, x, y, z, t);
      const c = evalNode(uz, x, y, z, t);
      if (!Number.isFinite(a) || !Number.isFinite(b) || !Number.isFinite(c)) return [0, 0, 0];
      // Two-component fields live on the ground plane: (Fx, 0, Fy)
      return two ? [a, 0, b] : [a, b, c];
    };
    fn(0.3, -0.2, 0.1, 0);
    return { fn, error: null };
  } catch (e) {
    return { fn: () => [0, 0, 0], error: e instanceof Error ? e.message : "Invalid field" };
  }
}

export const FIELD_PRESETS: { id: string; label: string; src: string; hint: string }[] = [
  { id: "vortex", label: "Vortex", src: "-z, 0.05, x", hint: "Spin around the vertical axis" },
  { id: "tornado", label: "Tornado", src: "-z - 0.25*x, 0.55, x - 0.25*z", hint: "Inward swirl with lift" },
  { id: "sink", label: "Well", src: "-x, -0.6*y - 0.2, -z", hint: "Everything drains down" },
  { id: "updraft", label: "Updraft", src: "0.15*sin(z), 0.9, 0.15*sin(x)", hint: "Column of rising air" },
  { id: "helix", label: "Helix", src: "-z, 0.35, x", hint: "Climbing spiral" },
  { id: "saddle", label: "Saddle", src: "x, 0, -z", hint: "Hyperbolic split" },
  { id: "gyre", label: "Gyres", src: "-sin(pi*x)*cos(pi*z), 0.12*sin(pi*y), cos(pi*x)*sin(pi*z)", hint: "Stacked counter-rotors" },
  { id: "shear", label: "Shear", src: "y, 0, 0", hint: "Velocity increases with height" },
  { id: "wave", label: "Waves", src: "sin(z + t), 0.2*sin(x + t), sin(x)", hint: "Time-varying cross flow" },
  { id: "dipole", label: "Dipole", src: "(x*x - z*z)/(x*x + z*z + 0.25), 0.1, 2*x*z/(x*x + z*z + 0.25)", hint: "Horizontal dipole" },
];
