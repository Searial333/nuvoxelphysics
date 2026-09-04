import { i as __toESM } from "../_runtime.mjs";
import { L as require_react, v as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { i as Pause, n as RotateCcw, r as Play } from "../_libs/lucide-react.mjs";
import { n as create, t as persist } from "../_libs/zustand.mjs";
import { t as clsx } from "../_libs/clsx.mjs";
import { t as twMerge } from "../_libs/tailwind-merge.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-DPoSReSF.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var FNS = {
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
	}
};
var CONSTS = {
	pi: Math.PI,
	tau: Math.PI * 2,
	e: Math.E
};
function tokenize(src) {
	const out = [];
	let i = 0;
	const s = src.trim();
	while (i < s.length) {
		const c = s[i];
		if (c === " " || c === "	" || c === "\n") {
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
			out.push({
				t: "op",
				v: c
			});
			i++;
			continue;
		}
		if (c >= "0" && c <= "9" || c === ".") {
			let j = i + 1;
			while (j < s.length && (s[j] >= "0" && s[j] <= "9" || s[j] === ".")) j++;
			out.push({
				t: "n",
				v: Number(s.slice(i, j))
			});
			i = j;
			continue;
		}
		if (c >= "a" && c <= "z" || c >= "A" && c <= "Z" || c === "_") {
			let j = i + 1;
			while (j < s.length && (s[j] >= "a" && s[j] <= "z" || s[j] >= "A" && s[j] <= "Z" || s[j] >= "0" && s[j] <= "9" || s[j] === "_")) j++;
			out.push({
				t: "id",
				v: s.slice(i, j).toLowerCase()
			});
			i = j;
			continue;
		}
		throw new Error(`Unexpected “${c}”`);
	}
	return out;
}
function parseExpr(tokens) {
	let i = 0;
	const peek = () => tokens[i];
	const eat = () => tokens[i++];
	function expr() {
		let n = term();
		while (peek()?.t === "op" && "+-".includes(peek().v)) n = {
			k: "bin",
			op: eat().v,
			a: n,
			b: term()
		};
		return n;
	}
	function term() {
		let n = power();
		while (peek()?.t === "op" && "*/".includes(peek().v)) n = {
			k: "bin",
			op: eat().v,
			a: n,
			b: power()
		};
		return n;
	}
	function power() {
		const n = unary();
		if (peek()?.t === "op" && peek().v === "^") {
			eat();
			return {
				k: "bin",
				op: "^",
				a: n,
				b: power()
			};
		}
		return n;
	}
	function unary() {
		if (peek()?.t === "op" && peek().v === "-") {
			eat();
			return {
				k: "un",
				op: "-",
				a: unary()
			};
		}
		if (peek()?.t === "op" && peek().v === "+") {
			eat();
			return unary();
		}
		return primary();
	}
	function primary() {
		const tok = peek();
		if (!tok) throw new Error("Unexpected end of expression");
		if (tok.t === "n") {
			eat();
			return {
				k: "num",
				v: tok.v
			};
		}
		if (tok.t === "id") {
			eat();
			const name = tok.v;
			if (peek()?.t === "lp") {
				eat();
				const args = [];
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
				return {
					k: "call",
					name,
					args
				};
			}
			if (name === "x" || name === "y" || name === "z" || name === "t") return {
				k: "var",
				v: name
			};
			if (name in CONSTS) return {
				k: "num",
				v: CONSTS[name]
			};
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
function evalNode(n, x, y, z, t) {
	switch (n.k) {
		case "num": return n.v;
		case "var": return n.v === "x" ? x : n.v === "y" ? y : n.v === "z" ? z : t;
		case "un": return -evalNode(n.a, x, y, z, t);
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
			return fn(...n.args.map((a) => evalNode(a, x, y, z, t)));
		}
	}
}
function splitTopComma(src) {
	const parts = [];
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
function compileField(src) {
	try {
		const parts = splitTopComma(src);
		if (parts.length < 1 || parts.length > 3) return {
			fn: () => [
				0,
				0,
				0
			],
			error: "Write Fx, Fy, Fz (Y is up)"
		};
		const ux = parseExpr(tokenize(parts[0]));
		const uy = parts[1] ? parseExpr(tokenize(parts[1])) : {
			k: "num",
			v: 0
		};
		const uz = parts[2] ? parseExpr(tokenize(parts[2])) : {
			k: "num",
			v: 0
		};
		const two = parts.length === 2;
		const fn = (x, y, z, t) => {
			const a = evalNode(ux, x, y, z, t);
			const b = evalNode(uy, x, y, z, t);
			const c = evalNode(uz, x, y, z, t);
			if (!Number.isFinite(a) || !Number.isFinite(b) || !Number.isFinite(c)) return [
				0,
				0,
				0
			];
			return two ? [
				a,
				0,
				b
			] : [
				a,
				b,
				c
			];
		};
		fn(.3, -.2, .1, 0);
		return {
			fn,
			error: null
		};
	} catch (e) {
		return {
			fn: () => [
				0,
				0,
				0
			],
			error: e instanceof Error ? e.message : "Invalid field"
		};
	}
}
var FIELD_PRESETS = [
	{
		id: "vortex",
		label: "Vortex",
		src: "-z, 0.05, x",
		hint: "Spin around the vertical axis"
	},
	{
		id: "tornado",
		label: "Tornado",
		src: "-z - 0.25*x, 0.55, x - 0.25*z",
		hint: "Inward swirl with lift"
	},
	{
		id: "sink",
		label: "Well",
		src: "-x, -0.6*y - 0.2, -z",
		hint: "Everything drains down"
	},
	{
		id: "updraft",
		label: "Updraft",
		src: "0.15*sin(z), 0.9, 0.15*sin(x)",
		hint: "Column of rising air"
	},
	{
		id: "helix",
		label: "Helix",
		src: "-z, 0.35, x",
		hint: "Climbing spiral"
	},
	{
		id: "saddle",
		label: "Saddle",
		src: "x, 0, -z",
		hint: "Hyperbolic split"
	},
	{
		id: "gyre",
		label: "Gyres",
		src: "-sin(pi*x)*cos(pi*z), 0.12*sin(pi*y), cos(pi*x)*sin(pi*z)",
		hint: "Stacked counter-rotors"
	},
	{
		id: "shear",
		label: "Shear",
		src: "y, 0, 0",
		hint: "Velocity increases with height"
	},
	{
		id: "wave",
		label: "Waves",
		src: "sin(z + t), 0.2*sin(x + t), sin(x)",
		hint: "Time-varying cross flow"
	},
	{
		id: "dipole",
		label: "Dipole",
		src: "(x*x - z*z)/(x*x + z*z + 0.25), 0.1, 2*x*z/(x*x + z*z + 0.25)",
		hint: "Horizontal dipole"
	}
];
var N = 20480;
var MAT_LABEL = [
	"air",
	"bedrock",
	"stone",
	"sand",
	"water",
	"ember",
	"crystal"
];
var MAT_COLOR = [
	[
		0,
		0,
		0
	],
	[
		.18,
		.18,
		.2
	],
	[
		.42,
		.44,
		.46
	],
	[
		.72,
		.62,
		.42
	],
	[
		.28,
		.48,
		.62
	],
	[
		.78,
		.38,
		.22
	],
	[
		.55,
		.78,
		.68
	]
];
function idx(x, y, z) {
	return x + y * 32 + z * 32 * 20;
}
function inBounds(x, y, z) {
	return x >= 0 && y >= 0 && z >= 0 && x < 32 && y < 20 && z < 32;
}
function hash3(x, y, z) {
	let n = x * 374761393 + y * 668265263 + z * 1274126177;
	n = Math.imul(n ^ n >>> 13, 1274126177);
	return ((n ^ n >>> 16) >>> 0) / 4294967296;
}
function fbm(x, z) {
	return hash3(Math.floor(x), 3, Math.floor(z)) * .55 + hash3(Math.floor(x * .5), 7, Math.floor(z * .5)) * .3 + hash3(Math.floor(x * .25), 11, Math.floor(z * .25)) * .15;
}
var VoxelWorld = class {
	mat = new Uint8Array(N);
	coded = new Uint8Array(N);
	cx = new Float32Array(N);
	cy = new Float32Array(N);
	cz = new Float32Array(N);
	particles = [];
	dirty = true;
	field = () => [
		0,
		0,
		0
	];
	fieldForce = 1.2;
	codeBlend = 1;
	gravity = .85;
	time = 0;
	reset(id) {
		this.mat.fill(0);
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
	set(x, y, z, m) {
		if (inBounds(x, y, z)) this.mat[idx(x, y, z)] = m;
	}
	genCanyon() {
		for (let x = 0; x < 32; x++) for (let z = 0; z < 32; z++) {
			const nx = x / 32;
			const nz = z / 32;
			const river = Math.abs(nz - .5 - .12 * Math.sin(nx * 6.2));
			const ridge = fbm(x * .55, z * .55);
			let h = 5 + Math.floor(ridge * 8);
			if (river < .08) h = 3;
			for (let y = 0; y < 20; y++) if (y === 0) this.set(x, y, z, 1);
			else if (y < h - 1) this.set(x, y, z, 2);
			else if (y < h) this.set(x, y, z, river < .1 ? 3 : 2);
			else if (river < .055 && y < 4) this.set(x, y, z, 4);
			if (ridge > .78 && h + 2 < 20) this.set(x, h + 1, z, 6);
		}
	}
	genChamber() {
		const cx = 16;
		const cy = 9;
		const cz = 16;
		for (let x = 0; x < 32; x++) for (let y = 0; y < 20; y++) for (let z = 0; z < 32; z++) {
			if (y === 0) {
				this.set(x, y, z, 1);
				continue;
			}
			const dx = (x - cx) / 13;
			const dy = (y - cy) / 7;
			const dz = (z - cz) / 13;
			const d = dx * dx + dy * dy + dz * dz;
			if (d > 1.05) this.set(x, y, z, y < 3 ? 2 : y > 17 ? 2 : 2);
			else if (d > .88) this.set(x, y, z, 6);
			else if (y < 3 && Math.hypot(x - cx, z - cz) < 5) this.set(x, y, z, 4);
		}
	}
	genSpires() {
		for (let x = 0; x < 32; x++) for (let z = 0; z < 32; z++) {
			const base = 3 + Math.floor(fbm(x * .4, z * .4) * 3);
			for (let y = 0; y <= base; y++) this.set(x, y, z, y === 0 ? 1 : 2);
			const peak = hash3(x, 1, z);
			if (peak > .82) {
				const h = 8 + Math.floor(peak * 8);
				for (let y = base; y < Math.min(19, base + h); y++) {
					const r = y > base + h - 3 ? 0 : 1;
					for (let ox = -r; ox <= r; ox++) for (let oz = -r; oz <= r; oz++) this.set(x + ox, y, z + oz, y > base + h - 4 ? 6 : 2);
				}
			} else if (peak > .7) {
				this.set(x, base + 1, z, 3);
				this.set(x, base + 2, z, 3);
			}
		}
	}
	genLattice() {
		for (let x = 0; x < 32; x++) for (let y = 0; y < 20; y++) for (let z = 0; z < 32; z++) if (y === 0) this.set(x, y, z, 1);
		else if (x % 4 === 0 && z % 4 === 0) this.set(x, y, z, 2);
		else if (y % 5 === 0 && (x % 4 === 0 || z % 4 === 0)) this.set(x, y, z, 2);
		else if (y === 1 && (x + z) % 7 === 0) this.set(x, y, z, 3);
		else if ((x + z + y) % 11 === 0 && y > 8) this.set(x, y, z, 6);
	}
	genCrater() {
		const cx = 16;
		const cz = 16;
		for (let x = 0; x < 32; x++) for (let z = 0; z < 32; z++) {
			const r = Math.hypot(x - cx, z - cz);
			const bowl = Math.max(2, 11 - r * .7 + fbm(x * .8, z * .8) * 2);
			for (let y = 0; y < 20; y++) if (y === 0) this.set(x, y, z, 1);
			else if (y < bowl) this.set(x, y, z, r < 4 && y < 5 ? 5 : r < 7 && y < 6 ? 3 : 2);
			else if (r < 3.2 && y < 6) this.set(x, y, z, 5);
		}
	}
	seedParticles(count) {
		this.particles.length = 0;
		let guard = 0;
		while (this.particles.length < count && guard++ < count * 8) {
			const x = Math.random() * 32;
			const y = Math.random() * 20;
			const z = Math.random() * 32;
			if (this.sampleMat(x, y, z) === 0) this.particles.push({
				x,
				y,
				z,
				life: .4 + Math.random()
			});
		}
	}
	sampleMat(x, y, z) {
		const ix = Math.floor(x);
		const iy = Math.floor(y);
		const iz = Math.floor(z);
		if (!inBounds(ix, iy, iz)) return 1;
		return this.mat[idx(ix, iy, iz)];
	}
	worldToField(x, y, z) {
		return [
			x / 32 * 2 - 1,
			y / 20 * 2 - 1,
			z / 32 * 2 - 1
		];
	}
	sampleField(x, y, z) {
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
		return [
			fx * this.fieldForce,
			fy * this.fieldForce,
			fz * this.fieldForce
		];
	}
	encodeAt(x, y, z) {
		if (!inBounds(x, y, z)) return;
		const i = idx(x, y, z);
		if (this.mat[i] === 0 || this.mat[i] === 1) return;
		const [nx, ny, nz] = this.worldToField(x + .5, y + .5, z + .5);
		const [fx, fy, fz] = this.field(nx, ny, nz, this.time);
		this.coded[i] = 1;
		this.cx[i] = fx;
		this.cy[i] = fy;
		this.cz[i] = fz;
		this.dirty = true;
	}
	decodeAt(x, y, z) {
		if (!inBounds(x, y, z)) return;
		const i = idx(x, y, z);
		this.coded[i] = 0;
		this.dirty = true;
	}
	paint(x, y, z, m) {
		if (!inBounds(x, y, z)) return;
		if (this.mat[idx(x, y, z)] === 1 && m === 0) return;
		this.mat[idx(x, y, z)] = m;
		if (m === 0) this.coded[idx(x, y, z)] = 0;
		this.dirty = true;
	}
	encodeBrush(x, y, z, r) {
		for (let dx = -r; dx <= r; dx++) for (let dy = -r; dy <= r; dy++) for (let dz = -r; dz <= r; dz++) if (dx * dx + dy * dy + dz * dz <= r * r + .2) this.encodeAt(x + dx, y + dy, z + dz);
	}
	stepMaterials() {
		const order = [];
		for (let i = 0; i < N; i++) {
			const m = this.mat[i];
			if (m === 3 || m === 4 || m === 5) order.push(i);
		}
		for (let k = order.length - 1; k > 0; k--) {
			const j = Math.floor(Math.random() * (k + 1));
			const tmp = order[k];
			order[k] = order[j];
			order[j] = tmp;
		}
		let moved = 0;
		for (const i of order) {
			const x = i % 32;
			const y = Math.floor(i / 32) % 20;
			const z = Math.floor(i / 640);
			const m = this.mat[i];
			if (m !== 3 && m !== 4 && m !== 5) continue;
			const [fx, fy, fz] = this.sampleField(x + .5, y + .5, z + .5);
			let gy = m === 5 ? .55 : m === 4 ? -.25 : -this.gravity;
			if (m === 3) gy = -this.gravity;
			const vx = fx;
			const vy = fy + gy;
			const vz = fz;
			const ax = Math.abs(vx) >= Math.abs(vy) && Math.abs(vx) >= Math.abs(vz) ? Math.sign(vx) : 0;
			const ay = Math.abs(vy) >= Math.abs(vx) && Math.abs(vy) >= Math.abs(vz) ? Math.sign(vy) : 0;
			const az = ax === 0 && ay === 0 ? Math.sign(vz) : 0;
			const candidates = [];
			if (ax || ay || az) candidates.push([
				x + ax,
				y + ay,
				z + az
			]);
			if (m === 3 || m === 4) candidates.push([
				x,
				y - 1,
				z
			]);
			if (m === 4) candidates.push([
				x + 1,
				y,
				z
			], [
				x - 1,
				y,
				z
			], [
				x,
				y,
				z + 1
			], [
				x,
				y,
				z - 1
			]);
			if (m === 5) candidates.push([
				x,
				y + 1,
				z
			]);
			if (m === 3) candidates.push([
				x + 1,
				y - 1,
				z
			], [
				x - 1,
				y - 1,
				z
			], [
				x,
				y - 1,
				z + 1
			], [
				x,
				y - 1,
				z - 1
			]);
			for (const [nx, ny, nz] of candidates) {
				if (!inBounds(nx, ny, nz)) continue;
				const j = idx(nx, ny, nz);
				if (this.mat[j] !== 0) continue;
				this.mat[j] = m;
				this.mat[i] = 0;
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
	stepParticles(dt, target) {
		while (this.particles.length < target) {
			const x = Math.random() * 32;
			const y = 2 + Math.random() * 17;
			const z = Math.random() * 32;
			if (this.sampleMat(x, y, z) === 0) this.particles.push({
				x,
				y,
				z,
				life: 1
			});
			else break;
		}
		if (this.particles.length > target) this.particles.length = target;
		for (const p of this.particles) {
			const [fx, fy, fz] = this.sampleField(p.x, p.y, p.z);
			p.x += fx * dt * 4.2;
			p.y += (fy - this.gravity * .15) * dt * 4.2;
			p.z += fz * dt * 4.2;
			p.life -= dt * .18;
			const solid = this.sampleMat(p.x, p.y, p.z) !== 0;
			if (p.life <= 0 || solid || !inBounds(Math.floor(p.x), Math.floor(p.y), Math.floor(p.z))) {
				p.x = Math.random() * 32;
				p.y = 3 + Math.random() * 15;
				p.z = Math.random() * 32;
				p.life = .5 + Math.random();
			}
		}
	}
	raycast(ox, oy, oz, dx, dy, dz, max = 64) {
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
			if (this.mat[idx(x, y, z)] !== 0) return {
				x,
				y,
				z,
				px,
				py,
				pz,
				mat: this.mat[idx(x, y, z)]
			};
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
		const pos = [];
		const nrm = [];
		const col = [];
		const faces = [
			[
				1,
				0,
				0,
				1,
				0,
				0
			],
			[
				-1,
				0,
				0,
				-1,
				0,
				0
			],
			[
				0,
				1,
				0,
				0,
				1,
				0
			],
			[
				0,
				-1,
				0,
				0,
				-1,
				0
			],
			[
				0,
				0,
				1,
				0,
				0,
				1
			],
			[
				0,
				0,
				-1,
				0,
				0,
				-1
			]
		];
		const quads = {
			"1,0,0": [
				[
					1,
					0,
					0
				],
				[
					1,
					1,
					0
				],
				[
					1,
					1,
					1
				],
				[
					1,
					0,
					1
				]
			],
			"-1,0,0": [
				[
					0,
					0,
					1
				],
				[
					0,
					1,
					1
				],
				[
					0,
					1,
					0
				],
				[
					0,
					0,
					0
				]
			],
			"0,1,0": [
				[
					0,
					1,
					1
				],
				[
					1,
					1,
					1
				],
				[
					1,
					1,
					0
				],
				[
					0,
					1,
					0
				]
			],
			"0,-1,0": [
				[
					0,
					0,
					0
				],
				[
					1,
					0,
					0
				],
				[
					1,
					0,
					1
				],
				[
					0,
					0,
					1
				]
			],
			"0,0,1": [
				[
					0,
					0,
					1
				],
				[
					1,
					0,
					1
				],
				[
					1,
					1,
					1
				],
				[
					0,
					1,
					1
				]
			],
			"0,0,-1": [
				[
					1,
					0,
					0
				],
				[
					0,
					0,
					0
				],
				[
					0,
					1,
					0
				],
				[
					1,
					1,
					0
				]
			]
		};
		for (let x = 0; x < 32; x++) for (let y = 0; y < 20; y++) for (let z = 0; z < 32; z++) {
			const m = this.mat[idx(x, y, z)];
			if (m === 0) continue;
			const rgb = MAT_COLOR[m];
			const marked = this.coded[idx(x, y, z)];
			for (const [dx, dy, dz] of faces) {
				const nx = x + dx;
				const ny = y + dy;
				const nz = z + dz;
				if (!(!inBounds(nx, ny, nz) || this.mat[idx(nx, ny, nz)] === 0)) continue;
				const q = quads[`${dx},${dy},${dz}`];
				const shade = .55 + .45 * Math.max(0, dx * .35 + dy * .7 + dz * .15);
				const cr = Math.min(1, rgb[0] * shade + (marked ? .12 : 0));
				const cg = Math.min(1, rgb[1] * shade + (marked ? .18 : 0));
				const cb = Math.min(1, rgb[2] * shade + (marked ? .08 : 0));
				pos.length / 3;
				for (const [qx, qy, qz] of q) {
					pos.push(x + qx, y + qy, z + qz);
					nrm.push(dx, dy, dz);
					col.push(cr, cg, cb);
				}
			}
		}
		const index = [];
		const verts = pos.length / 3;
		for (let i = 0; i < verts; i += 4) index.push(i, i + 1, i + 2, i, i + 2, i + 3);
		return {
			position: new Float32Array(pos),
			normal: new Float32Array(nrm),
			color: new Float32Array(col),
			index: new Uint32Array(index)
		};
	}
};
function compile(eq) {
	const { fn, error } = compileField(eq);
	return {
		compiled: fn,
		parseError: error
	};
}
var useLab = create()(persist((set, get) => ({
	equation: FIELD_PRESETS[1].src,
	presetId: FIELD_PRESETS[1].id,
	playing: true,
	worldId: "canyon",
	tool: "place",
	placeMat: 3,
	brush: 1,
	particleCount: 1400,
	fieldForce: 1.15,
	codeBlend: .85,
	gravity: .8,
	showArrows: true,
	showCodes: true,
	...compile(FIELD_PRESETS[1].src),
	setEquation: (equation) => set({
		equation,
		presetId: "custom",
		...compile(equation)
	}),
	applyPreset: (id) => {
		const p = FIELD_PRESETS.find((x) => x.id === id);
		if (!p) return;
		set({
			equation: p.src,
			presetId: p.id,
			...compile(p.src)
		});
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
	setShowCodes: (showCodes) => set({ showCodes })
}), {
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
		showCodes: s.showCodes
	}),
	merge: (persisted, current) => {
		const p = persisted ?? {};
		const equation = p.equation ?? current.equation;
		return {
			...current,
			...p,
			...compile(equation)
		};
	}
}));
function VoxelScene({ onHover, apiRef }) {
	const hostRef = (0, import_react.useRef)(null);
	const canvasRef = (0, import_react.useRef)(null);
	const hoverRef = (0, import_react.useRef)(onHover);
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
	const params = (0, import_react.useRef)({
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
		worldId
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
		worldId
	};
	(0, import_react.useEffect)(() => {
		const host = hostRef.current;
		const canvasEl = canvasRef.current;
		if (!host || !canvasEl) return;
		let disposed = false;
		let cleanup = null;
		(async () => {
			const THREE = await import("../_libs/three.mjs").then((n) => n.n);
			const { OrbitControls } = await import("../_libs/three.mjs").then((n) => n.t);
			if (disposed || !host || !canvasEl) return;
			const renderer = new THREE.WebGLRenderer({
				canvas: canvasEl,
				antialias: true
			});
			renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
			renderer.setClearColor(723982, 1);
			renderer.shadowMap.enabled = true;
			const scene = new THREE.Scene();
			scene.fog = new THREE.Fog(723982, 28, 64);
			const camera = new THREE.PerspectiveCamera(55, 1, .1, 120);
			camera.position.set(28, 22, 34);
			const controls = new OrbitControls(camera, renderer.domElement);
			controls.enableDamping = true;
			controls.target.set(16, 7, 16);
			controls.maxPolarAngle = Math.PI * .49;
			controls.minDistance = 8;
			controls.maxDistance = 70;
			scene.add(new THREE.HemisphereLight(14147032, 1711126, .75));
			const key = new THREE.DirectionalLight(15921386, 1.05);
			key.position.set(18, 28, 12);
			key.castShadow = true;
			key.shadow.mapSize.set(1024, 1024);
			scene.add(key);
			scene.add(new THREE.AmbientLight(9416090, .1));
			const world = new VoxelWorld();
			world.reset(params.current.worldId);
			world.field = params.current.compiled;
			const terrainMat = new THREE.MeshStandardMaterial({
				vertexColors: true,
				roughness: .82,
				metalness: .04
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
			const pPos = /* @__PURE__ */ new Float32Array(12e3);
			pGeo.setAttribute("position", new THREE.BufferAttribute(pPos, 3));
			const pMat = new THREE.PointsMaterial({
				color: 14477535,
				size: .18,
				sizeAttenuation: true,
				transparent: true,
				opacity: .85
			});
			const points = new THREE.Points(pGeo, pMat);
			scene.add(points);
			const arrowGroup = new THREE.Group();
			scene.add(arrowGroup);
			const arrowGeo = new THREE.ConeGeometry(.08, .28, 5);
			arrowGeo.rotateX(Math.PI / 2);
			const arrowMat = new THREE.MeshBasicMaterial({
				color: 9416090,
				transparent: true,
				opacity: .7
			});
			const STEP = 4;
			const arrowCount = Math.ceil(32 / STEP) * Math.ceil(20 / STEP) * Math.ceil(32 / STEP);
			const arrows = new THREE.InstancedMesh(arrowGeo, arrowMat, arrowCount);
			arrowGroup.add(arrows);
			const dummy = new THREE.Object3D();
			new THREE.Vector3(0, 0, 1);
			function updateArrows() {
				let i = 0;
				for (let y = 2; y < 20; y += STEP) for (let z = 2; z < 32; z += STEP) for (let x = 2; x < 32; x += STEP) {
					const [fx, fy, fz] = world.sampleField(x + .5, y + .5, z + .5);
					const mag = Math.hypot(fx, fy, fz);
					dummy.position.set(x + .5, y + .5, z + .5);
					if (mag < .02) dummy.scale.set(0, 0, 0);
					else {
						dummy.scale.set(1, 1, .6 + Math.min(1.6, mag));
						dummy.lookAt(dummy.position.x + fx, dummy.position.y + fy, dummy.position.z + fz);
						dummy.rotateX(Math.PI / 2);
					}
					dummy.updateMatrix();
					arrows.setMatrixAt(i, dummy.matrix);
					i++;
				}
				arrows.count = i;
				arrows.instanceMatrix.needsUpdate = true;
			}
			updateArrows();
			const hiGeo = new THREE.BoxGeometry(1.02, 1.02, 1.02);
			const hiMat = new THREE.MeshBasicMaterial({
				color: 9416090,
				wireframe: true,
				transparent: true,
				opacity: .9
			});
			const highlight = new THREE.Mesh(hiGeo, hiMat);
			highlight.visible = false;
			scene.add(highlight);
			apiRef.current = { rebuild: (id) => {
				world.reset(id);
				world.field = params.current.compiled;
				rebuildMesh();
				updateArrows();
			} };
			const raycaster = new THREE.Raycaster();
			const pointer = new THREE.Vector2();
			let dragging = false;
			let moved = 0;
			function ndc(e) {
				const r = renderer.domElement.getBoundingClientRect();
				pointer.x = (e.clientX - r.left) / r.width * 2 - 1;
				pointer.y = -((e.clientY - r.top) / r.height) * 2 + 1;
			}
			function hitVoxel() {
				raycaster.setFromCamera(pointer, camera);
				const origin = raycaster.ray.origin;
				const dir = raycaster.ray.direction;
				return world.raycast(origin.x, origin.y, origin.z, dir.x, dir.y, dir.z);
			}
			function applyTool(hit) {
				const p = params.current;
				const r = Math.max(0, Math.round(p.brush) - 1);
				const target = p.tool === "place" ? {
					x: hit.px,
					y: hit.py,
					z: hit.pz
				} : hit;
				const visit = (fn) => {
					for (let dx = -r; dx <= r; dx++) for (let dy = -r; dy <= r; dy++) for (let dz = -r; dz <= r; dz++) if (dx * dx + dy * dy + dz * dz <= r * r + .2) fn(target.x + dx, target.y + dy, target.z + dz);
				};
				if (p.tool === "carve") visit((x, y, z) => world.paint(x, y, z, 0));
				else if (p.tool === "place") visit((x, y, z) => world.paint(x, y, z, p.placeMat));
				else if (p.tool === "encode") world.encodeBrush(hit.x, hit.y, hit.z, Math.max(1, r + 1));
				else if (p.tool === "decode") visit((x, y, z) => world.decodeAt(x, y, z));
				else if (p.tool === "seed") for (let k = 0; k < 18; k++) world.particles.push({
					x: hit.px + Math.random(),
					y: hit.py + Math.random(),
					z: hit.pz + Math.random(),
					life: 1
				});
			}
			function onDown(e) {
				if (e.button !== 0) return;
				dragging = true;
				moved = 0;
				ndc(e);
			}
			function onMove(e) {
				ndc(e);
				if (dragging) moved += Math.abs(e.movementX) + Math.abs(e.movementY);
				const hit = hitVoxel();
				if (!hit) {
					highlight.visible = false;
					hoverRef.current(null);
					return;
				}
				const show = params.current.tool === "place" ? {
					x: hit.px,
					y: hit.py,
					z: hit.pz
				} : hit;
				highlight.position.set(show.x + .5, show.y + .5, show.z + .5);
				highlight.visible = true;
				const [u, v, w] = world.sampleField(hit.x + .5, hit.y + .5, hit.z + .5);
				hoverRef.current({
					x: hit.x,
					y: hit.y,
					z: hit.z,
					mat: MAT_LABEL[hit.mat] ?? "?",
					u,
					v,
					w,
					coded: !!world.coded[hit.x + hit.y * 32 + hit.z * 32 * 20]
				});
			}
			function onUp(e) {
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
			function tick(now) {
				if (disposed) return;
				const dt = Math.min(.05, (now - last) / 1e3);
				last = now;
				const p = params.current;
				world.field = p.compiled;
				world.fieldForce = p.fieldForce;
				world.codeBlend = p.codeBlend;
				world.gravity = p.gravity;
				if (p.playing) {
					world.time += dt;
					acc += dt;
					if (acc > .2) acc = .2;
					while (acc >= 1 / 20) {
						world.stepMaterials();
						acc -= 1 / 20;
					}
					world.stepParticles(dt, p.particleCount);
				}
				if (world.dirty) rebuildMesh();
				arrowClock += dt;
				arrowGroup.visible = p.showArrows;
				if (p.showArrows && arrowClock > .12) {
					updateArrows();
					arrowClock = 0;
				}
				const arr = pGeo.getAttribute("position");
				const n = Math.min(world.particles.length, 4e3);
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
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		ref: hostRef,
		className: "h-full w-full touch-none bg-bg",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("canvas", {
			ref: canvasRef,
			className: "block h-full w-full",
			"aria-label": "Voxel field world"
		})
	});
}
function cn(...inputs) {
	return twMerge(clsx(inputs));
}
function fmt(n) {
	if (!Number.isFinite(n)) return "—";
	return Math.abs(n) >= 10 ? n.toFixed(2) : n.toFixed(3);
}
var WORLDS = [
	{
		id: "canyon",
		label: "Canyon"
	},
	{
		id: "chamber",
		label: "Chamber"
	},
	{
		id: "spires",
		label: "Spires"
	},
	{
		id: "lattice",
		label: "Lattice"
	},
	{
		id: "crater",
		label: "Crater"
	}
];
var TOOLS = [
	{
		id: "place",
		label: "Place"
	},
	{
		id: "carve",
		label: "Carve"
	},
	{
		id: "encode",
		label: "Encode"
	},
	{
		id: "decode",
		label: "Clear code"
	},
	{
		id: "seed",
		label: "Seed"
	}
];
var MATS = [
	{
		id: 2,
		label: "Stone"
	},
	{
		id: 3,
		label: "Sand"
	},
	{
		id: 4,
		label: "Water"
	},
	{
		id: 5,
		label: "Ember"
	},
	{
		id: 6,
		label: "Crystal"
	}
];
function LabApp() {
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
	const [hover, setHover] = (0, import_react.useState)(null);
	const [eqDraft, setEqDraft] = (0, import_react.useState)(equation);
	const apiRef = (0, import_react.useRef)(null);
	(0, import_react.useEffect)(() => {
		useLab.persist.rehydrate();
	}, []);
	(0, import_react.useEffect)(() => setEqDraft(equation), [equation]);
	(0, import_react.useEffect)(() => {
		const onKey = (e) => {
			const t = e.target;
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
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex min-h-dvh flex-col bg-bg text-fg",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
			className: "flex flex-wrap items-center gap-3 border-b border-border px-4 py-3 sm:px-6",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "min-w-0 flex-1",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "font-mono text-[11px] tracking-[0.18em] text-muted uppercase",
					children: "Voxel field"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "font-display text-2xl leading-tight text-fg italic",
					children: "Flux Lab"
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				type: "button",
				onClick: togglePlaying,
				className: "inline-flex h-11 min-w-11 items-center justify-center gap-2 rounded-lg bg-accent px-3 text-sm font-medium text-accent-fg transition-transform duration-150 active:scale-[0.98]",
				children: [playing ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pause, { className: "size-4" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Play, { className: "size-4" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "hidden sm:inline",
					children: playing ? "Pause" : "Play"
				})]
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex min-h-0 flex-1 flex-col lg:flex-row",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "relative min-h-[52vh] flex-1 lg:min-h-0",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(VoxelScene, {
					onHover: setHover,
					apiRef
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "pointer-events-none absolute inset-x-3 top-3 flex flex-wrap items-start justify-between gap-2 sm:inset-x-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "rounded-lg bg-bg/80 px-3 py-2 ring-1 ring-border backdrop-blur-sm",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "font-mono text-[11px] text-muted",
							children: hint
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 text-[11px] text-subtle",
							children: "Drag to orbit. Click a voxel to use the current tool."
						})]
					}), hover && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "rounded-lg bg-bg/80 px-3 py-2 font-mono text-[11px] tabular-nums text-fg ring-1 ring-border backdrop-blur-sm",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
							hover.x,
							",",
							hover.y,
							",",
							hover.z,
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "mx-2 text-subtle",
								children: "·"
							}),
							hover.mat,
							hover.coded ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-accent",
								children: " coded"
							}) : null
						] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "text-accent",
							children: [
								"F (",
								fmt(hover.u),
								", ",
								fmt(hover.v),
								", ",
								fmt(hover.w),
								")"
							]
						})]
					})]
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("aside", {
				className: "w-full shrink-0 overflow-y-auto border-t border-border bg-surface lg:w-[22.5rem] lg:border-t-0 lg:border-l",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-col gap-5 p-4 sm:p-5",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "World" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "mt-2 flex flex-wrap gap-1.5",
								children: WORLDS.map((w) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									onClick: () => {
										setWorldId(w.id);
										apiRef.current?.rebuild(w.id);
									},
									className: cn("rounded-full px-3 py-1.5 text-xs font-medium ring-1", worldId === w.id ? "bg-accent text-accent-fg ring-accent" : "bg-elevated text-muted ring-border hover:text-fg"),
									children: w.label
								}, w.id))
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								onClick: () => apiRef.current?.rebuild(worldId),
								className: "mt-2 inline-flex h-11 items-center gap-2 rounded-lg bg-elevated px-3 text-sm text-fg ring-1 ring-border",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RotateCcw, { className: "size-4" }), "Rebuild world"]
							})
						] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Field equation" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mb-2 text-xs text-muted",
								children: "Fx, Fy, Fz in x, y, z, t. Y is up. Two terms map onto the ground plane."
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								value: eqDraft,
								onChange: (e) => setEqDraft(e.target.value),
								onBlur: () => setEquation(eqDraft),
								onKeyDown: (e) => {
									if (e.key === "Enter") setEquation(eqDraft);
								},
								spellCheck: false,
								suppressHydrationWarning: true,
								className: "h-11 w-full rounded-lg bg-elevated px-3 font-mono text-sm text-fg ring-1 ring-border outline-none focus:ring-accent",
								"aria-label": "Field equation"
							}),
							parseError ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-2 text-xs text-danger",
								children: parseError
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-2 text-xs text-muted",
								children: "Sand, water, and ember step along this field."
							})
						] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Presets" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mt-2 flex flex-wrap gap-1.5",
							children: FIELD_PRESETS.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: () => applyPreset(p.id),
								className: cn("rounded-full px-3 py-1.5 text-xs font-medium ring-1", presetId === p.id ? "bg-accent text-accent-fg ring-accent" : "bg-elevated text-muted ring-border hover:text-fg"),
								children: p.label
							}, p.id))
						})] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Tool" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "mt-2 grid grid-cols-2 gap-1.5",
								children: TOOLS.map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									onClick: () => setTool(t.id),
									className: cn("h-11 rounded-lg text-xs font-medium ring-1", tool === t.id ? "bg-accent text-accent-fg ring-accent" : "bg-elevated text-muted ring-border hover:text-fg"),
									children: t.label
								}, t.id))
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "mt-2 flex flex-wrap gap-1.5",
								children: MATS.map((m) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									onClick: () => {
										setPlaceMat(m.id);
										setTool("place");
									},
									className: cn("rounded-full px-3 py-1.5 text-xs font-medium ring-1", placeMat === m.id && tool === "place" ? "bg-accent text-accent-fg ring-accent" : "bg-elevated text-muted ring-border"),
									children: m.label
								}, m.id))
							})
						] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SliderRow, {
							label: "Brush",
							value: brush,
							min: 1,
							max: 4,
							step: 1,
							display: String(brush),
							onChange: setBrush
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SliderRow, {
							label: "Tracers",
							value: particleCount,
							min: 200,
							max: 3200,
							step: 50,
							display: String(Math.round(particleCount)),
							onChange: setParticleCount
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SliderRow, {
							label: "Field force",
							value: fieldForce,
							min: 0,
							max: 3,
							step: .05,
							display: fieldForce.toFixed(2),
							onChange: setFieldForce
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SliderRow, {
							label: "Code blend",
							value: codeBlend,
							min: 0,
							max: 1,
							step: .01,
							display: codeBlend.toFixed(2),
							onChange: setCodeBlend
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SliderRow, {
							label: "Gravity",
							value: gravity,
							min: 0,
							max: 2,
							step: .05,
							display: gravity.toFixed(2),
							onChange: setGravity
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							"aria-pressed": showArrows,
							onClick: () => setShowArrows(!showArrows),
							className: cn("h-11 rounded-lg text-xs font-medium ring-1", showArrows ? "bg-accent text-accent-fg ring-accent" : "bg-elevated text-muted ring-border"),
							children: "Field arrows"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs text-muted",
							children: "Encode writes the live field into a voxel. Those codes keep pushing neighbors even after you change the equation."
						})
					]
				})
			})]
		})]
	});
}
function Label({ children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
		className: "font-mono text-[11px] tracking-[0.16em] text-muted uppercase",
		children
	});
}
function SliderRow({ label, value, min, max, step, display, onChange }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
		className: "block",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
			className: "mb-2 flex items-center justify-between font-mono text-[11px] tracking-[0.16em] text-muted uppercase",
			children: [label, /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "tabular-nums text-fg normal-case tracking-normal",
				children: display
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
			type: "range",
			min,
			max,
			step,
			value,
			onChange: (e) => onChange(Number(e.target.value)),
			suppressHydrationWarning: true,
			className: "h-11 w-full accent-accent"
		})]
	});
}
function Home() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LabApp, {});
}
//#endregion
export { Home as component };
