// การให้คะแนนแบบ Item Response Theory (3PL) + EAP
// P(ถูก | θ) = c + (1−c) / (1 + e^(−1.7·a·(θ−b)))   โดย c = 1/จำนวนตัวเลือก (โอกาสเดาถูก)
// θ ถูกประมาณด้วย Expected A Posteriori (prior ~ N(0,1)) แล้วแปลงเป็นสเกล IQ = 100 + 15θ
const D = 1.7;

export function p3pl(theta, a, b, c) {
  return c + (1 - c) / (1 + Math.exp(-D * a * (theta - b)));
}

/** @param {{a:number,b:number,c:number,u:0|1}[]} resps */
export function estimateTheta(resps) {
  const grid = [], logw = [];
  for (let t = -4; t <= 4.0001; t += 0.01) {
    let lw = (-t * t) / 2;
    for (const r of resps) {
      const p = p3pl(t, r.a, r.b, r.c);
      lw += r.u ? Math.log(p) : Math.log(1 - p);
    }
    grid.push(t);
    logw.push(lw);
  }
  const mx = Math.max(...logw);
  let sw = 0, st = 0, st2 = 0;
  grid.forEach((t, i) => {
    const w = Math.exp(logw[i] - mx);
    sw += w; st += w * t; st2 += w * t * t;
  });
  const theta = st / sw;
  const se = Math.sqrt(Math.max(st2 / sw - theta * theta, 1e-9));
  return { theta, se };
}

export function normCdf(z) {
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const d = 0.3989423 * Math.exp((-z * z) / 2);
  const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  return z > 0 ? 1 - p : p;
}

// ช่วงคำอธิบายตามแนวทางของ Wechsler
export function band(iq) {
  if (iq >= 130) return 'สูงมาก';
  if (iq >= 120) return 'สูง';
  if (iq >= 110) return 'ค่อนข้างสูง';
  if (iq >= 90) return 'ปานกลาง (ช่วงของคนส่วนใหญ่)';
  if (iq >= 80) return 'ค่อนข้างต่ำ';
  if (iq >= 70) return 'ต่ำ';
  return 'ต่ำมาก';
}

const clamp = (x, lo, hi) => Math.min(hi, Math.max(lo, x));

export function scoreTest(items, answers) {
  const resps = items.map((it) => ({
    a: it.a, b: it.b, c: 1 / it.options.length,
    u: answers[it.id] === it.correct ? 1 : 0,
  }));
  const { theta, se } = estimateTheta(resps);
  const iq = clamp(Math.round(100 + 15 * theta), 55, 145);
  const lo = clamp(Math.round(100 + 15 * (theta - 1.645 * se)), 55, 145);
  const hi = clamp(Math.round(100 + 15 * (theta + 1.645 * se)), 55, 145);
  return {
    theta, se, iq, lo, hi,
    percentile: normCdf(theta) * 100,
    correct: resps.filter((r) => r.u).length,
    total: resps.length,
  };
}
