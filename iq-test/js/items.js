// คลังข้อสอบ: ข้อสอบทุกข้อเป็นข้อที่ออกใหม่ ตามรูปแบบ (item types) ของ ICAR
// (Condon & Revelle, 2014) และใช้กฎการสร้างเมทริกซ์แบบ Sandia Matrices (Matzen et al., 2010)
// ทุกอย่างสร้างแบบ deterministic จาก seed ทำให้ทุกคนได้ข้อสอบชุดเดียวกัน (จำเป็นต่อการให้คะแนนแบบ IRT)
// ไฟล์นี้ไม่ใช้ DOM จึงนำไป import ใน Node เพื่อตรวจข้อสอบได้ (tools/validate.mjs)

// ---------- utilities ----------
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export function hashStr(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}
function shuffle(arr, rand) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
const pick = (arr, rand) => arr[Math.floor(rand() * arr.length)];
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const INK = '#24292f';
const PAPER = '#ffffff';
const CELL_BORDER = '#d0d7de';

// =====================================================================
// 1) MATRIX REASONING (แบบ Raven / Sandia)
// =====================================================================
// แต่ละช่องมีคุณลักษณะ 5 อย่าง: รูปร่าง จำนวน สีพื้น ขนาด เส้นพื้นหลัง
// แต่ละคุณลักษณะมี "กฎ" ของตัวเอง ความยากของข้อเพิ่มตามจำนวนกฎที่เปลี่ยนแปลง (Matzen et al., 2010)
export const SHAPES = ['circle', 'square', 'triangle', 'diamond', 'pentagon', 'hexagon'];
export const FILL_COLORS = [PAPER, '#a3aab2', INK];
const SIZES = [9, 14, 19];
const DOMAIN = { shape: [0, 1, 2, 3, 4, 5], count: [1, 2, 3, 4], fill: [0, 1, 2], size: [0, 1, 2], line: [0, 1, 2, 3] };
export const ATTRS = ['shape', 'count', 'fill', 'size', 'line'];
const DEFAULTS = { shape: 0, count: 1, fill: 0, size: 1, line: 0 };
const POSITIONS = {
  1: [[0, 0]],
  2: [[-22, 0], [22, 0]],
  3: [[0, -20], [-22, 19], [22, 19]],
  4: [[-22, -22], [22, -22], [-22, 22], [22, 22]],
};

function ruleValue(rule, r, c) {
  switch (rule.t) {
    case 'const': return rule.v;
    case 'progC': return rule.base[r] + rule.step * c; // เปลี่ยนทีละขั้นตามคอลัมน์
    case 'progR': return rule.base[c] + rule.step * r; // เปลี่ยนทีละขั้นตามแถว
    case 'dist': return rule.vals[(c + rule.k * r) % 3]; // "distribution of three" (Latin square)
    case 'row': return rule.vals[r];
    case 'col': return rule.vals[c];
    default: throw new Error('unknown rule ' + rule.t);
  }
}
export function matrixCell(spec, r, c) {
  const o = {};
  for (const a of ATTRS) o[a] = ruleValue(spec.rules[a] ?? { t: 'const', v: DEFAULTS[a] }, r, c);
  return o;
}
export const sameCell = (x, y) => ATTRS.every((a) => x[a] === y[a]);

function polygon(n, cx, cy, R, rot = -Math.PI / 2) {
  const pts = [];
  for (let i = 0; i < n; i++) {
    const t = rot + (i * 2 * Math.PI) / n;
    pts.push(`${(cx + R * Math.cos(t)).toFixed(2)},${(cy + R * Math.sin(t)).toFixed(2)}`);
  }
  return pts.join(' ');
}
function shapeSvg(shape, cx, cy, r, fill) {
  const st = `fill="${FILL_COLORS[fill]}" stroke="${INK}" stroke-width="2" stroke-linejoin="round"`;
  switch (SHAPES[shape]) {
    case 'circle': return `<circle cx="${cx}" cy="${cy}" r="${r}" ${st}/>`;
    case 'square': { const s = r * 0.88; return `<rect x="${cx - s}" y="${cy - s}" width="${2 * s}" height="${2 * s}" ${st}/>`; }
    case 'triangle': return `<polygon points="${polygon(3, cx, cy + r * 0.18, r * 1.2)}" ${st}/>`;
    case 'diamond': return `<polygon points="${polygon(4, cx, cy, r * 1.15)}" ${st}/>`;
    case 'pentagon': return `<polygon points="${polygon(5, cx, cy + r * 0.06, r * 1.08)}" ${st}/>`;
    case 'hexagon': return `<polygon points="${polygon(6, cx, cy, r * 1.05, 0)}" ${st}/>`;
  }
}
function cellInner(cell) {
  let s = '';
  const L = `stroke="${INK}" stroke-width="3" stroke-linecap="round"`;
  if (cell.line === 1) s += `<line x1="10" y1="50" x2="90" y2="50" ${L}/>`;
  if (cell.line === 2) s += `<line x1="50" y1="10" x2="50" y2="90" ${L}/>`;
  if (cell.line === 3) s += `<line x1="14" y1="86" x2="86" y2="14" ${L}/>`;
  for (const [dx, dy] of POSITIONS[cell.count]) s += shapeSvg(cell.shape, 50 + dx, 50 + dy, SIZES[cell.size], cell.fill);
  return s;
}
const cellFrame = `<rect x="1" y="1" width="98" height="98" rx="6" fill="${PAPER}" stroke="${CELL_BORDER}" stroke-width="1.5"/>`;
export function cellSvg(cell) {
  return `<svg viewBox="0 0 100 100" class="fig" aria-hidden="true"><rect width="100" height="100" rx="6" fill="${PAPER}"/>${cellInner(cell)}</svg>`;
}
function matrixSvg(cells) {
  let s = '';
  for (let i = 0; i < 9; i++) {
    const x = (i % 3) * 106, y = Math.floor(i / 3) * 106;
    s += `<g transform="translate(${x},${y})">`;
    if (i < 8) s += cellFrame + cellInner(cells[i]);
    else s += `<rect x="1" y="1" width="98" height="98" rx="6" fill="${PAPER}" stroke="#868e96" stroke-width="2" stroke-dasharray="6 5"/><text x="50" y="64" text-anchor="middle" font-size="44" font-weight="700" fill="#868e96" font-family="sans-serif">?</text>`;
    s += '</g>';
  }
  return `<svg viewBox="-2 -2 314 314" class="fig matrix" role="img" aria-label="ตารางรูปภาพ 3×3 ช่องสุดท้ายหายไป">${s}</svg>`;
}

// ตัวเลือก 8 ข้อ = ผลคูณคาร์ทีเซียนของ 3 คุณลักษณะ × (ค่าถูก/ค่าลวง)
// ทุกค่าปรากฏในตัวเลือกพอๆ กัน จึง "เดาจากตัวเลือกที่ซ้ำบ่อยที่สุด" ไม่ได้ (balanced answer set แบบ I-RAVEN)
export function buildMatrix(spec) {
  const rand = mulberry32(spec.seed);
  const cells = [];
  for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) cells.push(matrixCell(spec, r, c));
  const answer = cells[8];
  const alts = spec.vary.map((attr) => {
    const cands = [cells[7], cells[6], cells[5], cells[2]].map((x) => x[attr]).filter((v) => v !== answer[attr]);
    let alt;
    if (cands.length) alt = pick(cands, rand);
    else {
      const d = DOMAIN[attr].filter((v) => v !== answer[attr]);
      const near = d.filter((v) => Math.abs(v - answer[attr]) === 1);
      alt = pick(attr === 'shape' || attr === 'line' || !near.length ? d : near, rand);
    }
    return { attr, alt };
  });
  const options = [];
  for (let m = 0; m < 8; m++) {
    const o = { ...answer };
    alts.forEach((x, i) => { if ((m >> i) & 1) o[x.attr] = x.alt; });
    options.push(o);
  }
  shuffle(options, rand);
  const correct = options.findIndex((o) => sameCell(o, answer));
  return { cells, answer, options, correct };
}

const MATRIX_SPECS = [
  { id: 'M01', b: -2.3, seed: 101, vary: ['size', 'shape', 'fill'],
    rules: { shape: { t: 'const', v: 0 }, size: { t: 'progC', base: [0, 0, 0], step: 1 } } },
  { id: 'M02', b: -1.8, seed: 102, vary: ['shape', 'fill', 'count'],
    rules: { shape: { t: 'dist', vals: [0, 1, 2], k: 1 }, fill: { t: 'const', v: 2 } } },
  { id: 'M03', b: -1.3, seed: 103, vary: ['count', 'fill', 'size'],
    rules: { shape: { t: 'const', v: 3 }, count: { t: 'progC', base: [1, 1, 1], step: 1 }, fill: { t: 'row', vals: [0, 1, 2] } } },
  { id: 'M04', b: -0.9, seed: 104, vary: ['shape', 'fill', 'size'],
    rules: { shape: { t: 'dist', vals: [5, 2, 1], k: 1 }, fill: { t: 'progC', base: [0, 0, 0], step: 1 } } },
  { id: 'M05', b: -0.5, seed: 105, vary: ['count', 'shape', 'fill'],
    rules: { count: { t: 'progR', base: [1, 2, 1], step: 1 }, shape: { t: 'col', vals: [0, 4, 3] }, size: { t: 'const', v: 0 } } },
  { id: 'M06', b: -0.1, seed: 106, vary: ['shape', 'fill', 'count'],
    rules: { shape: { t: 'dist', vals: [1, 3, 4], k: 1 }, fill: { t: 'dist', vals: [0, 1, 2], k: 2 }, count: { t: 'const', v: 2 }, size: { t: 'const', v: 0 } } },
  { id: 'M07', b: 0.3, seed: 107, vary: ['count', 'shape', 'fill'],
    rules: { count: { t: 'progC', base: [1, 2, 1], step: 1 }, shape: { t: 'dist', vals: [0, 2, 5], k: 2 }, fill: { t: 'row', vals: [2, 0, 1] }, size: { t: 'const', v: 0 } } },
  { id: 'M08', b: 0.7, seed: 108, vary: ['shape', 'size', 'fill'],
    rules: { shape: { t: 'dist', vals: [3, 0, 4], k: 1 }, size: { t: 'dist', vals: [0, 1, 2], k: 2 }, fill: { t: 'progC', base: [2, 2, 2], step: -1 }, count: { t: 'const', v: 2 } } },
  { id: 'M09', b: 1.1, seed: 109, vary: ['count', 'shape', 'fill'],
    rules: { count: { t: 'progR', base: [1, 1, 2], step: 1 }, shape: { t: 'dist', vals: [1, 5, 2], k: 2 }, fill: { t: 'dist', vals: [0, 2, 1], k: 1 }, size: { t: 'progC', base: [0, 0, 0], step: 1 } } },
  { id: 'M10', b: 1.4, seed: 110, vary: ['shape', 'count', 'size'],
    rules: { shape: { t: 'dist', vals: [0, 3, 5], k: 1 }, count: { t: 'dist', vals: [1, 3, 2], k: 2 }, size: { t: 'dist', vals: [0, 2, 1], k: 1 }, fill: { t: 'const', v: 1 } } },
  { id: 'M11', b: 1.8, seed: 111, vary: ['count', 'fill', 'line'],
    rules: { shape: { t: 'dist', vals: [4, 1, 3], k: 2 }, count: { t: 'progC', base: [1, 2, 1], step: 1 }, fill: { t: 'dist', vals: [0, 1, 2], k: 1 }, size: { t: 'progR', base: [0, 0, 0], step: 1 }, line: { t: 'dist', vals: [1, 2, 3], k: 2 } } },
  { id: 'M12', b: 2.2, seed: 112, vary: ['shape', 'fill', 'size'],
    rules: { shape: { t: 'dist', vals: [2, 5, 0], k: 1 }, count: { t: 'dist', vals: [2, 4, 1], k: 2 }, fill: { t: 'dist', vals: [2, 0, 1], k: 2 }, size: { t: 'dist', vals: [1, 0, 2], k: 1 }, line: { t: 'dist', vals: [0, 3, 1], k: 1 } } },
];

function makeMatrixItem(spec, a = 1.3) {
  const m = buildMatrix(spec);
  return {
    id: spec.id, a, b: spec.b, kind: 'visual', cols: 4,
    prompt: 'รูปใดควรอยู่ในช่องที่มีเครื่องหมาย ? เพื่อให้ตารางสมบูรณ์ตามรูปแบบ (ดูทั้งแนวนอนและแนวตั้ง)',
    stem: matrixSvg(m.cells),
    options: m.options.map(cellSvg),
    correct: m.correct,
    _data: { spec, ...m },
  };
}

// =====================================================================
// 2) LETTER–NUMBER SERIES
// =====================================================================
const SERIES = [
  { id: 'S01', b: -2.0, q: '3, 6, 9, 12, ?', ans: '15', wrong: ['14', '16', '18', '13', '24'] },
  { id: 'S02', b: -1.5, q: 'A, C, E, G, ?', ans: 'I', wrong: ['H', 'J', 'K', 'G', 'F'] },
  { id: 'S03', b: -0.9, q: '1, 4, 9, 16, 25, ?', ans: '36', wrong: ['30', '34', '35', '49', '32'] },
  { id: 'S04', b: -0.4, q: '2, 3, 5, 8, 12, 17, ?', ans: '23', wrong: ['22', '24', '25', '21', '29'] },
  { id: 'S05', b: 0.1, q: '5, 10, 7, 14, 11, 22, ?', ans: '19', wrong: ['44', '25', '17', '20', '33'] },
  { id: 'S06', b: 0.5, q: 'B, E, I, N, ?', ans: 'T', wrong: ['S', 'U', 'R', 'O', 'V'] },
  { id: 'S07', b: 1.0, q: '3, 4, 8, 17, 33, ?', ans: '58', wrong: ['49', '57', '59', '65', '50'] },
  { id: 'S08', b: 1.4, q: '1, Z, 3, X, 6, V, 10, ?', ans: 'T', wrong: ['U', 'S', 'W', '15', '14'] },
];

function makeTextItem(def, { a, prompt, stemHtml, cols }) {
  const rand = mulberry32(hashStr(def.id));
  const opts = shuffle([def.ans, ...def.wrong], rand);
  return {
    id: def.id, a, b: def.b, kind: 'text', cols,
    prompt, stem: stemHtml,
    options: opts.map(esc),
    correct: opts.indexOf(def.ans),
    _data: { raw: opts },
  };
}

// =====================================================================
// 3) VERBAL REASONING (ภาษาไทย)
// =====================================================================
const VERBAL = [
  { id: 'V01', b: -1.5, q: '“ใบไม้” สัมพันธ์กับ “ต้นไม้” เช่นเดียวกับ “หน้ากระดาษ” สัมพันธ์กับข้อใด',
    ans: 'หนังสือ', wrong: ['ปากกา', 'ตัวอักษร', 'ห้องสมุด', 'กระดาษ'] },
  { id: 'V02', b: -0.7, q: 'สมชายสูงกว่าสมหญิง สมหญิงสูงกว่าสมศรี และสมปองเตี้ยกว่าสมศรี ใครเตี้ยที่สุด',
    ans: 'สมปอง', wrong: ['สมชาย', 'สมหญิง', 'สมศรี', 'ข้อมูลไม่พอที่จะบอกได้'] },
  { id: 'V03', b: -0.2, q: 'ในภาษาสมมติภาษาหนึ่ง “โม ลา” แปลว่า “แมวดำ”, “ลา ติ” แปลว่า “หมาดำ” และ “ติ ซู” แปลว่า “หมาเล็ก” คำใดแปลว่า “แมว”',
    ans: 'โม', wrong: ['ลา', 'ติ', 'ซู', 'ข้อมูลไม่พอที่จะบอกได้'] },
  { id: 'V04', b: 0.2, q: 'แมวทุกตัวเป็นสัตว์เลี้ยงลูกด้วยนม และสัตว์บางตัวในสวนเป็นแมว ข้อใดสรุปได้อย่างแน่นอน',
    ans: 'สัตว์บางตัวในสวนเป็นสัตว์เลี้ยงลูกด้วยนม',
    wrong: ['สัตว์ทุกตัวในสวนเป็นแมว', 'สัตว์เลี้ยงลูกด้วยนมทุกตัวอยู่ในสวน', 'ไม่มีแมวตัวใดอยู่นอกสวน', 'สรุปสิ่งใดไม่ได้เลย'] },
  { id: 'V05', b: 0.6, q: '“ไม่มีนักเรียนคนใดที่สอบตกได้ไปทัศนศึกษา” และ “เอเป็นนักเรียนคนหนึ่งที่ได้ไปทัศนศึกษา” ข้อใดถูกต้องแน่นอน',
    ans: 'เอไม่ได้สอบตก',
    wrong: ['เอสอบตก', 'เอได้คะแนนสอบสูงที่สุด', 'นักเรียนที่สอบผ่านทุกคนได้ไปทัศนศึกษา', 'สรุปสิ่งใดไม่ได้เลย'] },
  { id: 'V06', b: 1.0, q: 'ถ้า “วันมะรืนนี้” คือวันที่อยู่ก่อนวันพฤหัสบดี 2 วัน แล้ว “วันนี้” คือวันอะไร',
    ans: 'วันอาทิตย์', wrong: ['วันจันทร์', 'วันอังคาร', 'วันเสาร์', 'วันพุธ'] },
];

// =====================================================================
// 4) 3D ROTATION (รูปคลี่ลูกบาศก์ → ลูกบาศก์)
// =====================================================================
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const vEq = (a, b) => a[0] === b[0] && a[1] === b[1] && a[2] === b[2];
const vNeg = (a) => [-a[0] || 0, -a[1] || 0, -a[2] || 0];
const apply = (M, v) => M.map((row) => (row[0] * v[0] + row[1] * v[1] + row[2] * v[2]) || 0);
const matMul = (A, B) => A.map((row) => [0, 1, 2].map((j) => row[0] * B[0][j] + row[1] * B[1][j] + row[2] * B[2][j]));

// สร้างการหมุนทั้ง 24 แบบของลูกบาศก์ (rotation group) ด้วย BFS
export const ROTATIONS = (() => {
  const RX = [[1, 0, 0], [0, 0, -1], [0, 1, 0]];
  const RZ = [[0, -1, 0], [1, 0, 0], [0, 0, 1]];
  const I = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
  const seen = new Map([[JSON.stringify(I), I]]);
  const queue = [I];
  while (queue.length) {
    const M = queue.shift();
    for (const G of [RX, RZ]) {
      const N = matMul(G, M).map((r) => r.map((x) => x || 0));
      const k = JSON.stringify(N);
      if (!seen.has(k)) { seen.set(k, N); queue.push(N); }
    }
  }
  return [...seen.values()];
})();

// รูปคลี่แบบกากบาท: n = ทิศตั้งฉากของหน้า, R = ทิศ "ขวา" ของหน้ากระดาษเมื่อพับแล้ว
const NET = [
  { id: 'T', n: [0, 0, 1], R: [1, 0, 0], gx: 1, gy: 0 },
  { id: 'L', n: [-1, 0, 0], R: [0, -1, 0], gx: 0, gy: 1 },
  { id: 'F', n: [0, -1, 0], R: [1, 0, 0], gx: 1, gy: 1 },
  { id: 'R', n: [1, 0, 0], R: [0, 1, 0], gx: 2, gy: 1 },
  { id: 'B', n: [0, 1, 0], R: [-1, 0, 0], gx: 3, gy: 1 },
  { id: 'D', n: [0, 0, -1], R: [1, 0, 0], gx: 1, gy: 2 },
];
// ตำแหน่งที่มองเห็นในภาพไอโซเมตริก: บน หน้า ขวา
const VIEW_POS = [
  { n: [0, 0, 1], Rc: [1, 0, 0] },
  { n: [0, -1, 0], Rc: [1, 0, 0] },
  { n: [1, 0, 0], Rc: [0, 1, 0] },
];
function rotK(n, v, k) { let r = v; for (let i = 0; i < k; i++) r = cross(n, r); return r; }
function kOf(pos, R) { for (let k = 0; k < 4; k++) if (vEq(rotK(pos.n, pos.Rc, k), R)) return k; throw new Error('bad R'); }

// สัญลักษณ์ทุกตัวไม่มีสมมาตรเชิงหมุน จึงบอกทิศทางของหน้าได้ชัดเจน (พิกัดท้องถิ่น y ชี้ลง)
const SYMBOLS = [
  '<path d="M0,-0.7 L0.45,-0.1 L0.15,-0.1 L0.15,0.7 L-0.15,0.7 L-0.15,-0.1 L-0.45,-0.1 Z"/>', // ลูกศร
  '<path d="M-0.5,-0.6 L-0.2,-0.6 L-0.2,0.3 L0.5,0.3 L0.5,0.6 L-0.5,0.6 Z"/>', // ตัว L
  '<path d="M-0.6,-0.6 L0.6,-0.6 L-0.6,0.6 Z"/>', // สามเหลี่ยมมุม
  '<path d="M-0.6,0.2 A0.6,0.6 0 0 1 0.6,0.2 Z"/>', // ครึ่งวงกลม
  '<path d="M-0.6,-0.6 L0.6,-0.6 L0.6,-0.3 L0.15,-0.3 L0.15,0.6 L-0.15,0.6 L-0.15,-0.3 L-0.6,-0.3 Z"/>', // ตัว T
  '<circle cx="-0.25" cy="-0.25" r="0.32"/><circle cx="0.4" cy="0.4" r="0.17"/>', // วงกลมใหญ่-เล็ก
];
export function symbolSvg(sym, cls = '') {
  return `<svg viewBox="-1 -1 2 2" class="${cls}" aria-hidden="true"><g fill="${INK}">${SYMBOLS[sym]}</g></svg>`;
}
function symbolG(sym, ox, oy, Rs, Us, scale) {
  const a = Rs[0] * scale, b = Rs[1] * scale, c = -Us[0] * scale, d = -Us[1] * scale;
  return `<g transform="matrix(${a.toFixed(3)} ${b.toFixed(3)} ${c.toFixed(3)} ${d.toFixed(3)} ${ox.toFixed(2)} ${oy.toFixed(2)})" fill="${INK}">${SYMBOLS[sym]}</g>`;
}

export function buildCube(seed, randomOrient) {
  const rand = mulberry32(seed);
  const syms = shuffle([0, 1, 2, 3, 4, 5], rand);
  return NET.map((f, i) => {
    const j = randomOrient ? Math.floor(rand() * 4) : 0;
    return { ...f, sym: syms[i], j, Ra: rotK(f.n, f.R, j) };
  });
}
export function cubeView(cube, M) {
  return VIEW_POS.map((pos) => {
    const f = cube.find((x) => vEq(apply(M, x.n), pos.n));
    return { sym: f.sym, k: kOf(pos, apply(M, f.Ra)) };
  });
}
export const viewKey = (v) => v.map((x) => `${x.sym}:${x.k}`).join('|');
export function validViewKeys(cube) { return new Set(ROTATIONS.map((M) => viewKey(cubeView(cube, M)))); }
function oppositeSym(cube, sym) { const f = cube.find((x) => x.sym === sym); return cube.find((x) => vEq(x.n, vNeg(f.n))).sym; }

const ISO_S = 34;
const iR = [1 / Math.SQRT2, 1 / Math.SQRT2, 0];
const iU = [-1 / Math.sqrt(6), 1 / Math.sqrt(6), 2 / Math.sqrt(6)];
const proj = (p) => [ISO_S * dot(p, iR), -ISO_S * dot(p, iU)];
const FACE_SHADE = ['#ffffff', '#eef1f4', '#dde2e7'];
export function cubeSvg(view) {
  let s = '';
  VIEW_POS.forEach((pos, i) => {
    const Uc = cross(pos.n, pos.Rc);
    const corners = [[1, 1], [1, -1], [-1, -1], [-1, 1]].map(([a, b]) =>
      proj([0, 1, 2].map((t) => pos.n[t] + a * pos.Rc[t] + b * Uc[t])));
    s += `<polygon points="${corners.map((p) => p.map((x) => x.toFixed(2)).join(',')).join(' ')}" fill="${FACE_SHADE[i]}" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>`;
    const R = rotK(pos.n, pos.Rc, view[i].k), U = cross(pos.n, R);
    const [ox, oy] = proj(pos.n);
    s += symbolG(view[i].sym, ox, oy, [dot(R, iR), -dot(R, iU)], [dot(U, iR), -dot(U, iU)], ISO_S * 0.78);
  });
  return `<svg viewBox="-54 -62 108 124" class="fig cube" aria-hidden="true"><rect x="-54" y="-62" width="108" height="124" rx="8" fill="${PAPER}"/>${s}</svg>`;
}
export function netSvg(cube) {
  const Z = 44;
  let s = '';
  for (const f of cube) {
    const x = f.gx * Z, y = f.gy * Z;
    s += `<rect x="${x}" y="${y}" width="${Z}" height="${Z}" fill="${PAPER}" stroke="${INK}" stroke-width="2"/>`;
    const ang = (f.j * Math.PI) / 2, co = Math.round(Math.cos(ang)), si = Math.round(Math.sin(ang));
    s += symbolG(f.sym, x + Z / 2, y + Z / 2, [co, -si], [-si, -co], (Z / 2) * 0.82);
  }
  return `<svg viewBox="-6 -6 ${4 * Z + 12} ${3 * Z + 12}" class="fig net" role="img" aria-label="รูปคลี่ของลูกบาศก์"><rect x="-6" y="-6" width="${4 * Z + 12}" height="${3 * Z + 12}" rx="8" fill="${PAPER}"/>${s}</svg>`;
}

// ตัวลวงแต่ละแบบ สร้างจาก "มุมมองที่ถูกต้องแบบสุ่ม" แล้วแก้ไข → ตัวเลือกที่ถูกจึงไม่ใช่ตัวที่ "คล้ายตัวอื่นที่สุด"
// opp: ให้เห็นหน้าตรงข้ามกันพร้อมกัน (ง่าย), hidden: แทนหน้าด้วยหน้าตรงข้าม, swap: สลับตำแหน่ง (ภาพสะท้อน), rot: หมุนสัญลักษณ์หนึ่งหน้า (ยาก)
function makeDistractor(type, cube, rand) {
  const base = cubeView(cube, pick(ROTATIONS, rand)).map((x) => ({ ...x }));
  const p = Math.floor(rand() * 3);
  const q = (p + 1 + Math.floor(rand() * 2)) % 3;
  if (type === 'opp') { base[p] = { sym: oppositeSym(cube, base[q].sym), k: Math.floor(rand() * 4) }; }
  if (type === 'hidden') { base[p] = { sym: oppositeSym(cube, base[p].sym), k: Math.floor(rand() * 4) }; }
  if (type === 'swap') { [base[p], base[q]] = [base[q], base[p]]; }
  if (type === 'rot') { base[p] = { ...base[p], k: (base[p].k + 1 + Math.floor(rand() * 3)) % 4 }; }
  return base;
}
export function buildRotation(spec) {
  const rand = mulberry32(spec.seed);
  const cube = buildCube(spec.seed * 7 + 3, spec.orient);
  const valid = validViewKeys(cube);
  const correctView = cubeView(cube, spec.identity ? ROTATIONS[0] : pick(ROTATIONS, rand));
  const views = [correctView];
  const keys = new Set([viewKey(correctView)]);
  for (const type of spec.distractors) {
    for (let tries = 0; tries < 500; tries++) {
      const v = makeDistractor(type, cube, rand);
      const k = viewKey(v);
      if (!valid.has(k) && !keys.has(k)) { views.push(v); keys.add(k); break; }
      if (tries === 499) throw new Error('cannot build distractor for ' + spec.id);
    }
  }
  const order = shuffle(views.map((_, i) => i), rand);
  return { cube, valid, views: order.map((i) => views[i]), correct: order.indexOf(0) };
}

const ROT_SPECS = [
  { id: 'R01', b: -1.2, seed: 301, orient: false, identity: true, distractors: ['opp', 'opp', 'hidden', 'opp', 'hidden'] },
  { id: 'R02', b: -0.6, seed: 302, orient: true, identity: true, distractors: ['opp', 'hidden', 'hidden', 'swap', 'opp'] },
  { id: 'R03', b: 0.0, seed: 303, orient: true, identity: false, distractors: ['hidden', 'swap', 'rot', 'opp', 'hidden'] },
  { id: 'R04', b: 0.6, seed: 304, orient: true, identity: false, distractors: ['rot', 'swap', 'hidden', 'rot', 'swap'] },
  { id: 'R05', b: 1.1, seed: 305, orient: true, identity: false, distractors: ['rot', 'rot', 'swap', 'hidden', 'rot'] },
  { id: 'R06', b: 1.6, seed: 306, orient: true, identity: false, distractors: ['rot', 'rot', 'rot', 'swap', 'swap'] },
];
function makeRotationItem(spec) {
  const r = buildRotation(spec);
  return {
    id: spec.id, a: 1.1, b: spec.b, kind: 'visual', cols: 3,
    prompt: 'นำรูปคลี่นี้พับเป็นลูกบาศก์ (สัญลักษณ์อยู่ด้านนอก) ลูกบาศก์ใดต่อไปนี้เป็นลูกบาศก์เดียวกันได้ (มีคำตอบเดียว)',
    stem: netSvg(r.cube),
    options: r.views.map(cubeSvg),
    correct: r.correct,
    _data: { spec, ...r },
  };
}

// =====================================================================
// SECTIONS
// =====================================================================
export const SECTIONS = [
  {
    id: 'matrix', title: 'เหตุผลเชิงภาพ', en: 'Matrix Reasoning', minutes: 12,
    intro: 'ในแต่ละข้อจะมีตาราง 3×3 ที่รูปภาพเปลี่ยนไปตามกฎบางอย่าง เช่น รูปร่าง จำนวน สี หรือขนาด ให้หาว่ารูปใดควรอยู่ในช่องที่หายไป ข้อหลังๆ อาจมีหลายกฎพร้อมกัน',
    items: MATRIX_SPECS.map((s) => makeMatrixItem(s)),
  },
  {
    id: 'series', title: 'อนุกรมตัวเลขและตัวอักษร', en: 'Letter–Number Series', minutes: 6,
    intro: 'หาตัวเลขหรือตัวอักษรถัดไปของอนุกรม ตัวอักษรใช้ลำดับภาษาอังกฤษ A–Z (A=1, B=2, …)',
    items: SERIES.map((d) => makeTextItem(d, {
      a: 1.1, cols: 3, prompt: 'ตัวถัดไปของอนุกรมนี้คืออะไร',
      stemHtml: `<div class="series">${esc(d.q)}</div>`,
    })),
  },
  {
    id: 'verbal', title: 'เหตุผลเชิงภาษา', en: 'Verbal Reasoning', minutes: 5,
    intro: 'อ่านโจทย์แล้วเลือกคำตอบที่ถูกต้อง ให้ใช้เฉพาะข้อมูลที่โจทย์ให้มาเท่านั้น',
    items: VERBAL.map((d) => makeTextItem(d, {
      a: 0.9, cols: 1, prompt: '', stemHtml: `<p class="verbal">${esc(d.q)}</p>`,
    })),
  },
  {
    id: 'rotation', title: 'มิติสัมพันธ์ 3 มิติ', en: '3D Rotation', minutes: 7,
    intro: 'ดูรูปคลี่ของลูกบาศก์ แล้วจินตนาการว่าพับขึ้นเป็นกล่อง เลือกภาพลูกบาศก์ที่อาจเป็นกล่องใบเดียวกันเมื่อหมุนไปในมุมต่างๆ สังเกตทั้งตำแหน่งและทิศทางของสัญลักษณ์',
    items: ROT_SPECS.map(makeRotationItem),
  },
];
SECTIONS.forEach((s) => s.items.forEach((it) => { it.section = s.id; }));

// ข้อฝึก (ไม่นับคะแนน)
export const PRACTICE = [
  {
    ...makeMatrixItem({ id: 'P1', b: 0, seed: 901, vary: ['fill', 'shape', 'size'],
      rules: { shape: { t: 'const', v: 1 }, fill: { t: 'progC', base: [0, 0, 0], step: 1 } } }),
    explain: 'ในทุกแถว สีพื้นเปลี่ยนจาก ขาว → เทา → ดำ และรูปเป็นสี่เหลี่ยมขนาดเท่าเดิม ช่องที่หายไปจึงเป็นสี่เหลี่ยมสีดำ',
  },
  {
    ...makeTextItem({ id: 'P2', b: 0, q: '2, 4, 6, 8, ?', ans: '10', wrong: ['9', '12', '11', '16', '14'] },
      { a: 1, cols: 3, prompt: 'ตัวถัดไปของอนุกรมนี้คืออะไร', stemHtml: '<div class="series">2, 4, 6, 8, ?</div>' }),
    explain: 'ตัวเลขเพิ่มขึ้นทีละ 2 ตัวถัดไปจึงเป็น 10',
  },
];

export const ALL_ITEMS = SECTIONS.flatMap((s) => s.items);
