import { SECTIONS, PRACTICE, ALL_ITEMS, symbolSvg } from './items.js';
import { scoreTest, band } from './scoring.js';

const app = document.getElementById('app');
const TOTAL_ITEMS = ALL_ITEMS.length;
const TOTAL_MIN = SECTIONS.reduce((s, x) => s + x.minutes, 0);
const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const st = {
  screen: 'home',
  practice: 0, practiceChoice: null,
  sec: 0, q: 0,
  answers: {},
  deadline: 0, used: {},
  confirm: false,
  enter: '', // ทิศทางการเข้าของการ์ดข้อสอบ: next | prev | ''
};
let timerId = null;

const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
const section = () => SECTIONS[st.sec];
const item = () => section().items[st.q];

// ไอคอนเส้น (outline) ประจำแต่ละหมวด
const ICONS = {
  matrix: '<rect x="3" y="3" width="5" height="5" rx="1"/><rect x="9.5" y="3" width="5" height="5" rx="1"/><rect x="16" y="3" width="5" height="5" rx="1"/><rect x="3" y="9.5" width="5" height="5" rx="1"/><rect x="9.5" y="9.5" width="5" height="5" rx="1"/><rect x="16" y="9.5" width="5" height="5" rx="1"/><rect x="3" y="16" width="5" height="5" rx="1"/><rect x="9.5" y="16" width="5" height="5" rx="1"/><path d="M17.5 17.5h2v2"/>',
  series: '<path d="M3 17l4-4 4 3 4-6 6-5"/><path d="M16 5h5v5"/>',
  verbal: '<path d="M4 5h16v10H9l-5 4z"/><path d="M8 9h8M8 12h5"/>',
  rotation: '<path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z"/><path d="M12 12l8-4.5M12 12v9M12 12L4 7.5"/>',
};
const icon = (id, cls = 'ic') => `<svg viewBox="0 0 24 24" class="${cls}" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[id]}</svg>`;

// ---------------------------------------------------------------- screens
function heroCube() {
  const faces = ['front', 'back', 'right', 'left', 'top', 'bottom'];
  return `<div class="stage" aria-hidden="true"><div class="tilt"><div class="cube3d">
    ${faces.map((f, i) => `<div class="face ${f}">${symbolSvg(i)}</div>`).join('')}
  </div></div></div>`;
}

function homeView() {
  return `
  <header class="hero">
    <div class="hero-text">
      <h1>วัดเชาวน์ปัญญา<br>ด้วยข้อสอบที่มีหลักวิชาการ</h1>
      <p class="lede">${TOTAL_ITEMS} ข้อ ใช้เวลาประมาณ ${TOTAL_MIN} นาที วัดการใช้เหตุผล 4 ด้าน
      ตามรูปแบบข้อสอบของ ICAR ซึ่งเป็นแบบวัดสาธารณะที่ทดสอบกับผู้เข้าร่วมเกือบ 1 แสนคน</p>
      <div class="hero-cta">
        <a class="btn primary lg" href="#prep">เริ่มเตรียมตัว</a>
        <span class="muted small">ฟรี · ไม่ต้องสมัคร · ไม่เก็บข้อมูล</span>
      </div>
    </div>
    ${heroCube()}
  </header>

  <section class="grid4 reveal">
    ${SECTIONS.map((s) => `
      <div class="sec-card">
        ${icon(s.id)}
        <h3>${s.title}</h3>
        <p class="muted small">${s.items.length} ข้อ · ${s.minutes} นาที</p>
      </div>`).join('')}
  </section>

  <section class="card reveal" id="prep">
    <h2>ก่อนเริ่มทำ</h2>
    <ul class="checklist">
      <li>หาที่เงียบๆ และทำให้จบในครั้งเดียว ไม่ใช้เครื่องคิดเลข กระดาษทด หรือให้คนอื่นช่วย</li>
      <li>แต่ละหมวดมีเวลาจำกัด เมื่อหมดเวลาระบบจะส่งคำตอบให้อัตโนมัติ</li>
      <li>ข้อที่ไม่ได้ตอบจะนับว่าผิด ถ้าไม่แน่ใจ <b>ให้เดาดีกว่าเว้นว่าง</b></li>
      <li>ข้อสอบเรียงจากง่ายไปยาก ข้ามข้อที่ยากไปก่อนแล้วกลับมาทำทีหลังได้</li>
      <li>เหมาะสำหรับผู้มีอายุ 16 ปีขึ้นไป</li>
    </ul>
    <div class="notice">
      <b>ข้อควรทราบ:</b> ผลที่ได้เป็น <b>IQ โดยประมาณ</b> เพื่อการศึกษาและความสนใจส่วนตัว
      ไม่ใช่การวินิจฉัยทางคลินิก และใช้แทนแบบทดสอบมาตรฐานที่ทำโดยนักจิตวิทยา (เช่น WAIS) ไม่ได้
      ค่าความยากของข้อสอบเป็นค่าเริ่มต้นตามโครงสร้างของข้อ ยังไม่ได้ปรับเทียบกับกลุ่มตัวอย่างคนไทย
    </div>
    <label class="agree"><input type="checkbox" id="agree"> ฉันเข้าใจข้อควรทราบข้างต้น</label>
    <div class="actions">
      <button class="btn primary" id="start" disabled>เริ่มทำข้อฝึก</button>
    </div>
  </section>

  ${methodView()}
  `;
}

function methodView() {
  return `
  <details class="card method reveal">
    <summary><h2>ที่มาและวิธีคิดคะแนน</h2><span class="chev" aria-hidden="true"></span></summary>
    <div class="method-body">
    <h3>รูปแบบข้อสอบ</h3>
    <p>ใช้ข้อสอบ 4 รูปแบบตาม <b>International Cognitive Ability Resource (ICAR)</b> ของ Condon &amp; Revelle (2014)
    ซึ่งเป็นแบบวัดสาธารณะ (public domain) ที่ทดสอบกับผู้เข้าร่วมประมาณ 97,000 คน และพบว่ามีความสัมพันธ์สูงกับแบบทดสอบเชาวน์ปัญญามาตรฐาน
    ข้อสอบในเว็บนี้เป็น<b>ข้อที่ออกใหม่ทั้งหมด</b>ตามรูปแบบเดียวกัน ไม่ได้คัดลอกข้อสอบของ ICAR</p>
    <p>ข้อเหตุผลเชิงภาพสร้างด้วยกฎตรรกะแบบ <b>Sandia Matrices</b> (Matzen et al., 2010) ที่สร้างข้อสอบลักษณะเดียวกับ Raven’s Progressive Matrices
    งานนี้พบว่าข้อที่มี 1–2 กฎยากใกล้เคียงข้อต้นฉบับ และข้อที่มีกฎมากกว่านั้นมักยากกว่า
    ตัวเลือกออกแบบให้แต่ละคุณลักษณะปรากฏเท่าๆ กัน จึงเดาคำตอบจากตัวเลือกที่ซ้ำบ่อยที่สุดไม่ได้</p>
    <h3>การให้คะแนน</h3>
    <p>ใช้ <b>Item Response Theory แบบ 3 พารามิเตอร์</b> แต่ละข้อมีค่าความยาก (b) ค่าอำนาจจำแนก (a) และโอกาสเดาถูก (c = 1/จำนวนตัวเลือก)
    แล้วประมาณระดับความสามารถ θ ด้วยวิธี EAP ก่อนแปลงเป็นสเกล IQ ที่มีค่าเฉลี่ย 100 และส่วนเบี่ยงเบนมาตรฐาน 15
    ผลแสดงพร้อม<b>ช่วงความเชื่อมั่น 90%</b> ซึ่งบอกว่าคะแนนจริงน่าจะอยู่ในช่วงใด</p>
    <h3>ข้อจำกัด</h3>
    <ul>
      <li>ค่าพารามิเตอร์ของข้อสอบเป็นค่าเริ่มต้นจากการออกแบบ ยังไม่ได้ปรับเทียบกับกลุ่มตัวอย่างจริง ตัวเลข IQ จึงเป็นค่าประมาณ</li>
      <li>แบบทดสอบ 32 ข้อมีความคลาดเคลื่อนมากกว่าแบบทดสอบมาตรฐานที่ใช้เวลา 1–2 ชั่วโมง</li>
      <li>สภาพแวดล้อม ความเหนื่อยล้า และการเคยทำข้อสอบแบบนี้มาก่อน มีผลต่อคะแนน</li>
      <li>ช่วงคะแนนที่รายงานคือ 55–145 เพราะนอกช่วงนี้ข้อสอบชุดนี้มีจำนวนข้อไม่พอที่จะแยกได้อย่างแม่นยำ</li>
    </ul>
    <h3>เอกสารอ้างอิง</h3>
    <ol class="refs">
      <li>Condon, D. M., &amp; Revelle, W. (2014). The International Cognitive Ability Resource: Development and initial validation of a public-domain measure. <i>Intelligence, 43</i>, 52–64. <a href="https://personality-project.org/revelle/publications/condon.icar.14.pdf" target="_blank" rel="noopener">PDF</a></li>
      <li>Condon, D. M., &amp; Revelle, W. (2016). Selected ICAR data from the SAPA-Project. <i>Journal of Open Psychology Data, 4</i>(1). <a href="https://doaj.org/article/e90aa359ea554359931b440c40c0f737" target="_blank" rel="noopener">DOAJ</a></li>
      <li>Matzen, L. E., et al. (2010). Recreating Raven’s: Software for systematically generating large numbers of Raven-like matrix problems with normed properties. <i>Behavior Research Methods, 42</i>(2), 525–541. <a href="https://github.com/sandialabs/Matrices" target="_blank" rel="noopener">GitHub</a></li>
      <li>Embretson, S. E., &amp; Reise, S. P. (2000). <i>Item Response Theory for Psychologists</i>. Lawrence Erlbaum.</li>
    </ol>
    </div>
  </details>`;
}

function optionsHtml(it, chosen, reveal) {
  return `<div class="opts ${it.kind === 'visual' ? 'visual' : 'text'} cols-${it.cols}" role="radiogroup">
    ${it.options.map((o, i) => {
      let cls = 'opt';
      if (chosen === i) cls += ' sel';
      if (reveal && i === it.correct) cls += ' right';
      if (reveal && chosen === i && i !== it.correct) cls += ' wrong';
      return `<button class="${cls}" data-opt="${i}" style="--i:${i}" role="radio" aria-checked="${chosen === i}" aria-label="ตัวเลือกที่ ${i + 1}">
        <span class="key">${i + 1}</span><span class="optbody">${o}</span></button>`;
    }).join('')}
  </div>`;
}

function practiceView() {
  const it = PRACTICE[st.practice];
  return `
  <div class="topbar"><span class="crumb">ข้อฝึก ${st.practice + 1} จาก ${PRACTICE.length}</span><span class="muted small">ไม่นับคะแนน</span></div>
  <section class="card qcard enter-${st.enter || 'fade'}">
    ${it.prompt ? `<p class="prompt">${it.prompt}</p>` : ''}
    <div class="stem">${it.stem}</div>
    ${optionsHtml(it, st.practiceChoice, st.practiceChoice !== null)}
    <div id="feedback"></div>
  </section>
  <div class="actions">
    <button class="btn primary" id="practiceNext" ${st.practiceChoice !== null ? '' : 'disabled'}>
      ${st.practice + 1 < PRACTICE.length ? 'ข้อฝึกถัดไป' : 'เริ่มทำแบบทดสอบจริง'}
    </button>
  </div>`;
}

function secIntroView() {
  const s = section();
  return `
  <section class="intro">
    <div class="steps" aria-label="ความคืบหน้า">
      ${SECTIONS.map((x, i) => `<span class="step ${i < st.sec ? 'done' : ''} ${i === st.sec ? 'cur' : ''}">${icon(x.id)}</span>`).join('<span class="step-line"></span>')}
    </div>
    <p class="muted">หมวดที่ ${st.sec + 1} จาก ${SECTIONS.length} · ${s.en}</p>
    <h1>${s.title}</h1>
    <p class="intro-text">${s.intro}</p>
    <div class="facts">
      <div><b>${s.items.length}</b><span>ข้อ</span></div>
      <div><b>${s.minutes}</b><span>นาที</span></div>
    </div>
    <p class="small muted">เวลาเริ่มนับเมื่อกดปุ่มเริ่ม · ใช้ปุ่ม 1–${s.items[0].options.length} บนคีย์บอร์ดเลือกคำตอบ และปุ่มลูกศรเปลี่ยนข้อได้</p>
    <div class="actions center"><button class="btn primary lg" id="secStart">เริ่มหมวดนี้</button></div>
  </section>`;
}

const RING = 2 * Math.PI * 15;
function questionView() {
  const s = section(), it = item();
  const doneBefore = SECTIONS.slice(0, st.sec).reduce((n, x) => n + x.items.length, 0);
  const pct = ((doneBefore + st.q) / TOTAL_ITEMS) * 100;
  const last = st.q === s.items.length - 1;
  const unanswered = s.items.filter((x) => st.answers[x.id] === undefined).length;
  return `
  <div class="topbar">
    <span class="crumb">${icon(s.id, 'ic sm')} ${s.title}</span>
    <span class="timer" id="timer">
      <svg viewBox="0 0 36 36" aria-hidden="true"><circle cx="18" cy="18" r="15" class="track"/><circle cx="18" cy="18" r="15" class="ring" id="ring" stroke-dasharray="${RING}" stroke-dashoffset="0"/></svg>
      <span id="timerText">${fmt(remaining())}</span>
    </span>
  </div>
  <div class="progress" aria-hidden="true"><span style="transform:scaleX(${pct / 100})"></span></div>
  <section class="card qcard enter-${st.enter || 'fade'}">
    <p class="qnum">ข้อ ${st.q + 1} จาก ${s.items.length}</p>
    ${it.prompt ? `<p class="prompt">${it.prompt}</p>` : ''}
    <div class="stem">${it.stem}</div>
    ${optionsHtml(it, st.answers[it.id], false)}
  </section>
  <nav class="qnav">
    <button class="btn" id="prev" ${st.q === 0 ? 'disabled' : ''}>ก่อนหน้า</button>
    <div class="dots">${s.items.map((x, i) => `<button class="dot ${st.answers[x.id] !== undefined ? 'done' : ''} ${i === st.q ? 'cur' : ''}" data-jump="${i}" aria-label="ไปข้อ ${i + 1}">${i + 1}</button>`).join('')}</div>
    ${last ? `<button class="btn primary" id="submitSec">ส่งหมวดนี้</button>` : `<button class="btn primary" id="next">ถัดไป</button>`}
  </nav>
  ${st.confirm ? `
  <div class="modal" role="dialog" aria-modal="true" aria-labelledby="mt">
    <div class="card">
      <h3 id="mt">ยังมี ${unanswered} ข้อที่ยังไม่ได้ตอบ</h3>
      <p>ข้อที่ไม่ได้ตอบจะนับว่าผิด ถ้ายังมีเวลา แนะนำให้กลับไปเดาคำตอบก่อน</p>
      <div class="actions"><button class="btn" id="cancelSubmit">กลับไปทำต่อ</button><button class="btn primary" id="confirmSubmit">ส่งเลย</button></div>
    </div>
  </div>` : ''}`;
}

function bellSvg(iq, lo, hi) {
  const W = 600, H = 180, x0 = 30, x1 = 570, base = H - 34;
  const X = (v) => x0 + ((v - 55) / 90) * (x1 - x0);
  const Y = (v) => base - 125 * Math.exp(-(((v - 100) / 15) ** 2) / 2);
  let d = '', area = '';
  for (let v = 55; v <= 145; v += 1) d += `${v === 55 ? 'M' : 'L'}${X(v).toFixed(1)},${Y(v).toFixed(1)}`;
  for (let v = lo; v <= hi; v += 1) area += `${v === lo ? 'M' : 'L'}${X(v).toFixed(1)},${Y(v).toFixed(1)}`;
  area += `L${X(hi)},${base}L${X(lo)},${base}Z`;
  const ticks = [55, 70, 85, 100, 115, 130, 145].map((v) =>
    `<line x1="${X(v)}" y1="${base}" x2="${X(v)}" y2="${base + 5}" class="axis"/><text x="${X(v)}" y="${H - 10}" class="tick">${v}</text>`).join('');
  return `<svg viewBox="0 0 ${W} ${H}" class="bell" role="img" aria-label="คะแนน ${iq} บนโค้งปกติ ช่วง ${lo} ถึง ${hi}">
    <path d="${area}" class="ci"/>
    <path d="${d}" class="curve" pathLength="1"/>
    <line x1="${x0}" y1="${base}" x2="${x1}" y2="${base}" class="axis"/>${ticks}
    <g class="mark"><line x1="${X(iq)}" y1="${Y(iq) - 16}" x2="${X(iq)}" y2="${base}" class="marker"/>
    <circle cx="${X(iq)}" cy="${Y(iq) - 16}" r="6" class="markerdot"/></g>
  </svg>`;
}

function resultsView() {
  const r = scoreTest(ALL_ITEMS, st.answers);
  const pct = r.percentile;
  const pctText = pct >= 99.5 ? 'มากกว่า 99' : pct < 0.5 ? 'น้อยกว่า 1' : Math.round(pct);
  return `
  <header class="result-hero">
    <h1 class="result-title">ผลการทดสอบของคุณ</h1>
    <div class="iq" id="iqNum" data-to="${r.iq}">${r.iq}</div>
    <p class="iqlabel">IQ โดยประมาณ · ระดับ<b>${band(r.iq)}</b></p>
    <p class="muted">ช่วงความเชื่อมั่น 90%: <b class="num">${r.lo}–${r.hi}</b> · สูงกว่าประชากรประมาณ <b class="num">${pctText}%</b></p>
  </header>
  <section class="card chart">${bellSvg(r.iq, r.lo, r.hi)}
    <p class="small muted center">แถบสีคือช่วงที่คะแนนจริงของคุณน่าจะอยู่ (90%) · ค่าเฉลี่ยประชากร 100, ส่วนเบี่ยงเบนมาตรฐาน 15</p>
  </section>
  <section class="card reveal">
    <h2>คะแนนรายหมวด</h2>
    <p class="muted small">ตอบถูก ${r.correct} จาก ${r.total} ข้อ</p>
    ${SECTIONS.map((s, i) => {
      const c = s.items.filter((it) => st.answers[it.id] === it.correct).length;
      const used = st.used[s.id] ?? 0;
      return `<div class="bar-row">
        <div class="bar-head"><span>${icon(s.id, 'ic sm')} ${s.title}</span><span class="num"><b>${c}</b>/${s.items.length} · ${fmt(used)} นาที</span></div>
        <div class="bar"><span style="--w:${c / s.items.length};--d:${i * 70}ms"></span></div>
      </div>`;
    }).join('')}
    <p class="small muted">คะแนนรายหมวดมีจำนวนข้อน้อย ใช้ดูแนวโน้มจุดแข็งได้อย่างคร่าวๆ เท่านั้น</p>
  </section>
  <section class="notice">
    <b>อ่านผลอย่างไร:</b> คะแนนนี้ประมาณจากข้อสอบ 32 ข้อ และค่าความยากที่ยังไม่ได้ปรับเทียบกับคนไทย
    จึงควรดู<b>ช่วงคะแนน</b>มากกว่าตัวเลขเดียว ไม่ควรใช้ผลนี้ตัดสินใจเรื่องสำคัญ เช่น การศึกษา การจ้างงาน หรือการวินิจฉัยทางการแพทย์
    ถ้าทำซ้ำ คะแนนมักสูงขึ้นจากความคุ้นเคยกับข้อสอบ ไม่ได้แปลว่าเชาวน์ปัญญาเพิ่มขึ้น
  </section>
  ${methodView()}
  <div class="actions center"><button class="btn" id="restart">ทำแบบทดสอบใหม่</button></div>`;
}

// ---------------------------------------------------------------- motion helpers
function countUp(el) {
  const to = Number(el.dataset.to);
  if (reduceMotion()) { el.textContent = to; return; }
  const from = 55, dur = 1100, t0 = performance.now();
  const ease = (t) => 1 - Math.pow(1 - t, 4);
  const tick = (now) => {
    const t = Math.min(1, (now - t0) / dur);
    el.textContent = Math.round(from + (to - from) * ease(t));
    if (t < 1) requestAnimationFrame(tick);
  };
  el.textContent = from;
  requestAnimationFrame(tick);
}

// ---------------------------------------------------------------- timer
function remaining() { return Math.max(0, Math.ceil((st.deadline - Date.now()) / 1000)); }
function paintTimer() {
  const total = section().minutes * 60;
  const left = remaining();
  const txt = document.getElementById('timerText');
  const ring = document.getElementById('ring');
  const box = document.getElementById('timer');
  if (txt) txt.textContent = fmt(left);
  if (ring) ring.style.strokeDashoffset = String(RING * (1 - left / total));
  if (box) box.classList.toggle('low', left <= 60);
  return left;
}
function startTimer() {
  stopTimer();
  st.deadline = Date.now() + section().minutes * 60 * 1000;
  st.secStarted = Date.now();
  timerId = setInterval(() => { if (paintTimer() <= 0) finishSection(); }, 500);
}
function stopTimer() { if (timerId) clearInterval(timerId); timerId = null; }

function finishSection() {
  stopTimer();
  st.used[section().id] = Math.min(section().minutes * 60, Math.round((Date.now() - st.secStarted) / 1000));
  if (st.sec + 1 < SECTIONS.length) { st.sec++; st.q = 0; go('secIntro'); }
  else go('results');
}

// ---------------------------------------------------------------- state changes
function go(screen) {
  st.screen = screen;
  st.confirm = false;
  st.enter = '';
  render();
  window.scrollTo({ top: 0 });
}

// เลือกคำตอบ: อัปเดตเฉพาะคลาส ไม่ render ใหม่ทั้งหน้า (ให้ transition ทำงานต่อเนื่อง)
function markSelected(i) {
  app.querySelectorAll('.opt').forEach((b) => {
    const on = Number(b.dataset.opt) === i;
    b.classList.toggle('sel', on);
    b.setAttribute('aria-checked', String(on));
  });
}
function choose(i) {
  if (st.screen === 'practice') {
    if (st.practiceChoice !== null) return;
    const it = PRACTICE[st.practice];
    st.practiceChoice = i;
    markSelected(i);
    app.querySelectorAll('.opt').forEach((b) => {
      const k = Number(b.dataset.opt);
      if (k === it.correct) b.classList.add('right');
      else if (k === i) b.classList.add('wrong');
    });
    const ok = i === it.correct;
    document.getElementById('feedback').outerHTML =
      `<div class="feedback ${ok ? 'ok' : 'bad'}" role="status"><b>${ok ? 'ถูกต้อง' : 'ยังไม่ถูก'}</b> ${it.explain}</div>`;
    document.getElementById('practiceNext').disabled = false;
  } else if (st.screen === 'question') {
    st.answers[item().id] = i;
    markSelected(i);
    app.querySelector(`.dot[data-jump="${st.q}"]`)?.classList.add('done');
  }
}
function jump(to, viaKeyboard = false) {
  const n = section().items.length;
  to = Math.min(n - 1, Math.max(0, to));
  if (to === st.q) return;
  st.enter = viaKeyboard ? 'none' : to > st.q ? 'next' : 'prev';
  st.q = to;
  render();
}
function submitSection() {
  const unanswered = section().items.some((x) => st.answers[x.id] === undefined);
  if (unanswered) { st.confirm = true; st.enter = 'none'; render(); } else finishSection();
}

app.addEventListener('click', (e) => {
  const t = e.target.closest('button, input, a[href^="#"]');
  if (!t) return;
  if (t.matches('a[href^="#"]')) {
    e.preventDefault();
    document.querySelector(t.getAttribute('href'))?.scrollIntoView({ behavior: reduceMotion() ? 'auto' : 'smooth' });
    return;
  }
  if (t.dataset.opt !== undefined) return choose(Number(t.dataset.opt));
  if (t.dataset.jump !== undefined) return jump(Number(t.dataset.jump));
  switch (t.id) {
    case 'agree': document.getElementById('start').disabled = !t.checked; break;
    case 'start': st.practice = 0; st.practiceChoice = null; go('practice'); break;
    case 'practiceNext':
      if (st.practice + 1 < PRACTICE.length) { st.practice++; st.practiceChoice = null; st.enter = 'next'; render(); window.scrollTo({ top: 0 }); }
      else { st.sec = 0; st.q = 0; st.answers = {}; st.used = {}; go('secIntro'); }
      break;
    case 'secStart': startTimer(); go('question'); break;
    case 'prev': jump(st.q - 1); break;
    case 'next': jump(st.q + 1); break;
    case 'submitSec': submitSection(); break;
    case 'cancelSubmit': st.confirm = false; st.enter = 'none'; render(); break;
    case 'confirmSubmit': finishSection(); break;
    case 'restart': stopTimer(); st.answers = {}; go('home'); break;
  }
});

document.addEventListener('keydown', (e) => {
  if (!['question', 'practice'].includes(st.screen) || st.confirm) return;
  if (e.altKey || e.ctrlKey || e.metaKey) return;
  const it = st.screen === 'practice' ? PRACTICE[st.practice] : item();
  const n = Number(e.key);
  if (n >= 1 && n <= it.options.length) { e.preventDefault(); choose(n - 1); }
  if (st.screen !== 'question') return;
  if (e.key === 'ArrowRight') jump(st.q + 1, true);
  if (e.key === 'ArrowLeft') jump(st.q - 1, true);
});

window.addEventListener('beforeunload', (e) => {
  if (st.screen === 'question' || st.screen === 'secIntro') { e.preventDefault(); e.returnValue = ''; }
});

// องค์ประกอบ .reveal ค่อยๆ ปรากฏเมื่อเลื่อนมาถึง (เนื้อหายังแสดงปกติถ้า JS/IO ใช้ไม่ได้)
const io = 'IntersectionObserver' in window
  ? new IntersectionObserver((ents) => ents.forEach((en) => {
    if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
  }), { rootMargin: '0px 0px -8% 0px' })
  : null;

function render() {
  const views = { home: homeView, practice: practiceView, secIntro: secIntroView, question: questionView, results: resultsView };
  app.innerHTML = views[st.screen]();
  document.body.dataset.screen = st.screen;
  if (io && !reduceMotion()) {
    document.documentElement.classList.add('js-reveal');
    app.querySelectorAll('.reveal').forEach((el) => io.observe(el));
  }
  if (st.screen === 'question') paintTimer();
  if (st.screen === 'results') countUp(document.getElementById('iqNum'));
}
render();
