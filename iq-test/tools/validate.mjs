// ตรวจคลังข้อสอบ: ทุกข้อต้องมีคำตอบที่ถูกต้องเพียงข้อเดียว และตัวเลือกไม่ซ้ำกัน
// ใช้: node iq-test/tools/validate.mjs
import { SECTIONS, PRACTICE, sameCell, ATTRS, viewKey, validViewKeys } from '../js/items.js';

let errors = 0;
const fail = (id, msg) => { errors++; console.error(`✗ ${id}: ${msg}`); };
const RANGE = { shape: [0, 5], count: [1, 4], fill: [0, 2], size: [0, 2], line: [0, 3] };

function checkMatrix(it) {
  const { cells, options, answer, correct } = it._data;
  for (const c of cells) for (const a of ATTRS) {
    const [lo, hi] = RANGE[a];
    if (!(c[a] >= lo && c[a] <= hi)) fail(it.id, `ค่า ${a}=${c[a]} อยู่นอกช่วง`);
  }
  const matches = options.filter((o) => sameCell(o, answer)).length;
  if (matches !== 1) fail(it.id, `มีตัวเลือกที่ตรงกับคำตอบ ${matches} ตัว`);
  if (!sameCell(options[correct], answer)) fail(it.id, 'ดัชนีคำตอบผิด');
  const keys = new Set(options.map((o) => JSON.stringify(o)));
  if (keys.size !== options.length) fail(it.id, 'ตัวเลือกซ้ำกัน');
}
function checkRotation(it) {
  const { cube, views, correct } = it._data;
  const valid = validViewKeys(cube);
  if (valid.size !== 24) fail(it.id, `มุมมองที่ถูกต้องมี ${valid.size} แบบ (ควรเป็น 24)`);
  const ok = views.map((v) => valid.has(viewKey(v)));
  if (ok.filter(Boolean).length !== 1) fail(it.id, `มีตัวเลือกที่พับได้จริง ${ok.filter(Boolean).length} ตัว`);
  if (!ok[correct]) fail(it.id, 'ดัชนีคำตอบผิด');
  if (new Set(views.map(viewKey)).size !== views.length) fail(it.id, 'ตัวเลือกซ้ำกัน');
}
function checkText(it) {
  const raw = it._data.raw;
  if (new Set(raw).size !== raw.length) fail(it.id, 'ตัวเลือกซ้ำกัน');
  if (it.correct < 0 || it.correct >= raw.length) fail(it.id, 'ดัชนีคำตอบผิด');
}

const all = [...SECTIONS.flatMap((s) => s.items), ...PRACTICE];
const ids = new Set();
for (const it of all) {
  if (ids.has(it.id)) fail(it.id, 'id ซ้ำ');
  ids.add(it.id);
  if (it.id.startsWith('M') || it.id === 'P1') checkMatrix(it);
  else if (it.id.startsWith('R')) checkRotation(it);
  else checkText(it);
}

const pos = {};
for (const s of SECTIONS) {
  const dist = s.items.map((i) => i.correct);
  console.log(`${s.id.padEnd(9)} ${String(s.items.length).padStart(2)} ข้อ  b: ${s.items.map((i) => i.b).join(', ')}  ตำแหน่งคำตอบ: ${dist.join(',')}`);
  dist.forEach((d) => (pos[d] = (pos[d] || 0) + 1));
}
console.log('กระจายตำแหน่งคำตอบ:', pos);
console.log(errors ? `\n${errors} error(s)` : `\n✓ ผ่านทั้งหมด ${all.length} ข้อ`);
process.exit(errors ? 1 : 0);
