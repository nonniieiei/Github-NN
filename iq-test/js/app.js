import { SECTIONS, PRACTICE, ALL_ITEMS } from './items.js';
import { scoreTest, band } from './scoring.js';

const app = document.getElementById('app');
const TOTAL_ITEMS = ALL_ITEMS.length;
const TOTAL_MIN = SECTIONS.reduce((s, x) => s + x.minutes, 0);

const st = {
  screen: 'home',
  practice: 0, practiceChoice: null,
  sec: 0, q: 0,
  answers: {},
  deadline: 0, used: {},
  confirm: false,
};
let timerId = null;

const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
const section = () => SECTIONS[st.sec];
const item = () => section().items[st.q];

function go(screen) {
  st.screen = screen;
  st.confirm = false;
  render();
  window.scrollTo({ top: 0 });
}

// ---------------------------------------------------------------- screens
function homeView() {
  return `
  <header class="hero">
    <p class="eyebrow">แบบทดสอบความสามารถทางสติปัญญา</p>
    <h1>แบบทดสอบ IQ ออนไลน์</h1>
    <p class="lede">${TOTAL_ITEMS} ข้อ · ประมาณ ${TOTAL_MIN} นาที · วัดความสามารถในการใช้เหตุผล 4 ด้าน
    ออกแบบตามรูปแบบข้อสอบของ ICAR ซึ่งเป็นแบบวัดสาธารณะที่ผ่านการตรวจสอบกับผู้เข้าร่วมเกือบ 1 แสนคน</p>
  </header>

  <section class="grid4">
    ${SECTIONS.map((s, i) => `
      <div class="card sec-card">
        <div class="sec-num">${i + 1}</div>
        <h3>${s.title}</h3>
        <p class="muted small">${s.en}</p>
        <p class="small">${s.items.length} ข้อ · ${s.minutes} นาที</p>
      </div>`).join('')}
  </section>

  <section class="card">
    <h2>ก่อนเริ่มทำ</h2>
    <ul class="checklist">
      <li>หาที่เงียบๆ และทำให้จบในครั้งเดียว ไม่ควรใช้เครื่องคิดเลข กระดาษทด หรือขอให้คนอื่นช่วย</li>
      <li>แต่ละหมวดมีเวลาจำกัด เมื่อหมดเวลาระบบจะส่งคำตอบให้อัตโนมัติ</li>
      <li>ข้อที่ไม่ได้ตอบจะนับว่าผิด ถ้าไม่แน่ใจ <b>ให้เดาดีกว่าเว้นว่าง</b></li>
      <li>ข้อสอบเรียงจากง่ายไปยาก ถ้าข้อใดยากเกินไปให้ข้ามไปก่อนแล้วกลับมาทำทีหลังได้</li>
      <li>เหมาะสำหรับผู้มีอายุ 16 ปีขึ้นไป</li>
    </ul>
    <div class="notice">
      <b>ข้อควรทราบ:</b> ผลที่ได้เป็น <b>IQ โดยประมาณ</b> เพื่อการศึกษาและความสนใจส่วนตัว
      ไม่ใช่การวินิจฉัยทางคลินิก และไม่สามารถใช้แทนแบบทดสอบมาตรฐานที่ทำโดยนักจิตวิทยา (เช่น WAIS) ได้
      ค่าความยากของข้อสอบเป็นค่าเริ่มต้นที่กำหนดตามโครงสร้างของข้อ ยังไม่ได้ปรับเทียบกับกลุ่มตัวอย่างคนไทย
    </div>
    <label class="agree"><input type="checkbox" id="agree"> ฉันเข้าใจข้อควรทราบข้างต้น</label>
    <div class="actions">
      <button class="btn primary" id="start" disabled>เริ่มทำข้อฝึก →</button>
    </div>
  </section>

  ${methodView()}
  `;
}

function methodView() {
  return `
  <details class="card method">
    <summary><h2>ที่มาและวิธีคิดคะแนน</h2></summary>
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
  </details>`;
}

function optionsHtml(it, chosen, reveal) {
  return `<div class="opts ${it.kind === 'visual' ? 'visual' : 'text'} cols-${it.cols}" role="radiogroup">
    ${it.options.map((o, i) => {
      let cls = 'opt';
      if (chosen === i) cls += ' sel';
      if (reveal && i === it.correct) cls += ' right';
      if (reveal && chosen === i && i !== it.correct) cls += ' wrong';
      return `<button class="${cls}" data-opt="${i}" role="radio" aria-checked="${chosen === i}" aria-label="ตัวเลือกที่ ${i + 1}">
        <span class="key">${i + 1}</span><span class="optbody">${o}</span></button>`;
    }).join('')}
  </div>`;
}

function practiceView() {
  const it = PRACTICE[st.practice];
  const reveal = st.practiceChoice !== null;
  const right = st.practiceChoice === it.correct;
  return `
  <div class="topbar"><span class="pill">ข้อฝึก ${st.practice + 1}/${PRACTICE.length}</span><span class="muted small">ไม่นับคะแนน</span></div>
  <section class="card qcard">
    ${it.prompt ? `<p class="prompt">${it.prompt}</p>` : ''}
    <div class="stem">${it.stem}</div>
    ${optionsHtml(it, st.practiceChoice, reveal)}
    ${reveal ? `<div class="feedback ${right ? 'ok' : 'bad'}"><b>${right ? 'ถูกต้อง!' : 'ยังไม่ถูก'}</b> ${it.explain}</div>` : ''}
  </section>
  <div class="actions">
    <button class="btn primary" id="practiceNext" ${reveal ? '' : 'disabled'}>
      ${st.practice + 1 < PRACTICE.length ? 'ข้อฝึกถัดไป →' : 'เริ่มทำแบบทดสอบจริง →'}
    </button>
  </div>`;
}

function secIntroView() {
  const s = section();
  return `
  <section class="card intro">
    <p class="eyebrow">หมวดที่ ${st.sec + 1} จาก ${SECTIONS.length}</p>
    <h1>${s.title}</h1>
    <p class="muted">${s.en}</p>
    <p>${s.intro}</p>
    <div class="facts">
      <div><b>${s.items.length}</b><span>ข้อ</span></div>
      <div><b>${s.minutes}</b><span>นาที</span></div>
    </div>
    <p class="small muted">เวลาจะเริ่มนับเมื่อกดปุ่มเริ่ม และใช้ปุ่มตัวเลข 1–${s.items[0].options.length} บนคีย์บอร์ดเลือกคำตอบได้</p>
    <div class="actions"><button class="btn primary" id="secStart">เริ่มหมวดนี้ →</button></div>
  </section>`;
}

function questionView() {
  const s = section(), it = item();
  const doneBefore = SECTIONS.slice(0, st.sec).reduce((n, x) => n + x.items.length, 0);
  const pct = ((doneBefore + st.q) / TOTAL_ITEMS) * 100;
  const last = st.q === s.items.length - 1;
  const unanswered = s.items.filter((x) => st.answers[x.id] === undefined).length;
  return `
  <div class="topbar">
    <span class="pill">หมวด ${st.sec + 1}/${SECTIONS.length} · ${s.title}</span>
    <span class="timer" id="timer" aria-live="off">${fmt(remaining())}</span>
  </div>
  <div class="progress" aria-hidden="true"><span style="width:${pct}%"></span></div>
  <section class="card qcard">
    <p class="qnum">ข้อ ${st.q + 1} จาก ${s.items.length}</p>
    ${it.prompt ? `<p class="prompt">${it.prompt}</p>` : ''}
    <div class="stem">${it.stem}</div>
    ${optionsHtml(it, st.answers[it.id], false)}
  </section>
  <nav class="qnav">
    <button class="btn" id="prev" ${st.q === 0 ? 'disabled' : ''}>← ก่อนหน้า</button>
    <div class="dots">${s.items.map((x, i) => `<button class="dot ${st.answers[x.id] !== undefined ? 'done' : ''} ${i === st.q ? 'cur' : ''}" data-jump="${i}" aria-label="ไปข้อ ${i + 1}">${i + 1}</button>`).join('')}</div>
    ${last ? `<button class="btn primary" id="submitSec">ส่งหมวดนี้</button>` : `<button class="btn primary" id="next">ถัดไป →</button>`}
  </nav>
  ${st.confirm ? `
  <div class="modal" role="dialog" aria-modal="true">
    <div class="card">
      <h3>ยังมี ${unanswered} ข้อที่ยังไม่ได้ตอบ</h3>
      <p>ข้อที่ไม่ได้ตอบจะนับว่าผิด ถ้ายังมีเวลา แนะนำให้กลับไปเดาคำตอบก่อน</p>
      <div class="actions"><button class="btn" id="cancelSubmit">กลับไปทำต่อ</button><button class="btn primary" id="confirmSubmit">ส่งเลย</button></div>
    </div>
  </div>` : ''}`;
}

function bellSvg(iq, lo, hi) {
  const W = 600, H = 170, x0 = 40, x1 = 560;
  const X = (v) => x0 + ((v - 55) / 90) * (x1 - x0);
  const Y = (v) => H - 30 - 120 * Math.exp(-(((v - 100) / 15) ** 2) / 2);
  let d = '', area = '';
  for (let v = 55; v <= 145; v += 1) d += `${v === 55 ? 'M' : 'L'}${X(v).toFixed(1)},${Y(v).toFixed(1)}`;
  for (let v = lo; v <= hi; v += 1) area += `${v === lo ? 'M' : 'L'}${X(v).toFixed(1)},${Y(v).toFixed(1)}`;
  area += `L${X(hi)},${H - 30}L${X(lo)},${H - 30}Z`;
  const ticks = [55, 70, 85, 100, 115, 130, 145].map((v) =>
    `<line x1="${X(v)}" y1="${H - 30}" x2="${X(v)}" y2="${H - 25}" class="axis"/><text x="${X(v)}" y="${H - 10}" class="tick">${v}</text>`).join('');
  return `<svg viewBox="0 0 ${W} ${H}" class="bell" role="img" aria-label="ตำแหน่งคะแนนบนโค้งปกติ">
    <path d="${area}" class="ci"/>
    <path d="${d}" class="curve"/>
    <line x1="${x0}" y1="${H - 30}" x2="${x1}" y2="${H - 30}" class="axis"/>${ticks}
    <line x1="${X(iq)}" y1="${Y(iq) - 14}" x2="${X(iq)}" y2="${H - 30}" class="marker"/>
    <circle cx="${X(iq)}" cy="${Y(iq) - 14}" r="5" class="markerdot"/>
  </svg>`;
}

function resultsView() {
  const r = scoreTest(ALL_ITEMS, st.answers);
  const pct = r.percentile;
  const pctText = pct >= 99.5 ? 'มากกว่า 99' : pct < 0.5 ? 'น้อยกว่า 1' : Math.round(pct);
  return `
  <header class="hero center">
    <p class="eyebrow">ผลการทดสอบ</p>
    <div class="iq">${r.iq}</div>
    <p class="iqlabel">IQ โดยประมาณ · ระดับ <b>${band(r.iq)}</b></p>
    <p class="muted">ช่วงความเชื่อมั่น 90%: <b>${r.lo}–${r.hi}</b> · สูงกว่าประชากรประมาณ <b>${pctText}%</b></p>
  </header>
  <section class="card">${bellSvg(r.iq, r.lo, r.hi)}
    <p class="small muted center">แถบสีคือช่วงที่คะแนนจริงของคุณน่าจะอยู่ (90%) · ค่าเฉลี่ยประชากร = 100, SD = 15</p>
  </section>
  <section class="card">
    <h2>คะแนนรายหมวด</h2>
    <p class="muted small">ตอบถูก ${r.correct} จาก ${r.total} ข้อ</p>
    ${SECTIONS.map((s) => {
      const c = s.items.filter((it) => st.answers[it.id] === it.correct).length;
      const used = st.used[s.id] ?? 0;
      return `<div class="bar-row">
        <div class="bar-head"><span>${s.title}</span><span><b>${c}</b>/${s.items.length} · ${fmt(used)} นาที</span></div>
        <div class="bar"><span style="width:${(c / s.items.length) * 100}%"></span></div>
      </div>`;
    }).join('')}
    <p class="small muted">คะแนนรายหมวดมีจำนวนข้อน้อย จึงใช้ดูแนวโน้มจุดแข็งได้อย่างคร่าวๆ เท่านั้น</p>
  </section>
  <section class="card notice">
    <b>อ่านผลอย่างไร:</b> คะแนนนี้ประมาณจากข้อสอบ 32 ข้อ และค่าความยากที่ยังไม่ได้ปรับเทียบกับคนไทย
    จึงควรดู<b>ช่วงคะแนน</b>มากกว่าตัวเลขเดียว ไม่ควรใช้ผลนี้ตัดสินใจเรื่องสำคัญ เช่น การศึกษา การจ้างงาน หรือการวินิจฉัยทางการแพทย์
    ถ้าทำซ้ำ คะแนนมักสูงขึ้นจากความคุ้นเคยกับข้อสอบ ไม่ได้แปลว่าเชาวน์ปัญญาเพิ่มขึ้น
  </section>
  ${methodView()}
  <div class="actions center"><button class="btn" id="restart">ทำแบบทดสอบใหม่</button></div>`;
}

// ---------------------------------------------------------------- timer
function remaining() { return Math.max(0, Math.ceil((st.deadline - Date.now()) / 1000)); }
function startTimer() {
  stopTimer();
  st.deadline = Date.now() + section().minutes * 60 * 1000;
  st.secStarted = Date.now();
  timerId = setInterval(() => {
    const el = document.getElementById('timer');
    const left = remaining();
    if (el) { el.textContent = fmt(left); el.classList.toggle('low', left <= 60); }
    if (left <= 0) finishSection();
  }, 500);
}
function stopTimer() { if (timerId) clearInterval(timerId); timerId = null; }

function finishSection() {
  stopTimer();
  st.used[section().id] = Math.min(section().minutes * 60, Math.round((Date.now() - st.secStarted) / 1000));
  if (st.sec + 1 < SECTIONS.length) { st.sec++; st.q = 0; go('secIntro'); }
  else go('results');
}

// ---------------------------------------------------------------- events
function choose(i) {
  if (st.screen === 'practice') {
    if (st.practiceChoice !== null) return;
    st.practiceChoice = i; render();
  } else if (st.screen === 'question') {
    st.answers[item().id] = i; render();
  }
}
function move(delta) {
  const n = section().items.length;
  st.q = Math.min(n - 1, Math.max(0, st.q + delta));
  render();
}
function submitSection() {
  const unanswered = section().items.some((x) => st.answers[x.id] === undefined);
  if (unanswered) { st.confirm = true; render(); } else finishSection();
}

app.addEventListener('click', (e) => {
  const t = e.target.closest('button, input');
  if (!t) return;
  if (t.dataset.opt !== undefined) return choose(Number(t.dataset.opt));
  if (t.dataset.jump !== undefined) { st.q = Number(t.dataset.jump); return render(); }
  switch (t.id) {
    case 'agree': document.getElementById('start').disabled = !t.checked; break;
    case 'start': st.practice = 0; st.practiceChoice = null; go('practice'); break;
    case 'practiceNext':
      if (st.practice + 1 < PRACTICE.length) { st.practice++; st.practiceChoice = null; go('practice'); }
      else { st.sec = 0; st.q = 0; st.answers = {}; st.used = {}; go('secIntro'); }
      break;
    case 'secStart': startTimer(); go('question'); break;
    case 'prev': move(-1); break;
    case 'next': move(1); break;
    case 'submitSec': submitSection(); break;
    case 'cancelSubmit': st.confirm = false; render(); break;
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
  if (e.key === 'ArrowRight') move(1);
  if (e.key === 'ArrowLeft') move(-1);
});

window.addEventListener('beforeunload', (e) => {
  if (st.screen === 'question' || st.screen === 'secIntro') { e.preventDefault(); e.returnValue = ''; }
});

function render() {
  const views = { home: homeView, practice: practiceView, secIntro: secIntroView, question: questionView, results: resultsView };
  app.innerHTML = views[st.screen]();
  document.body.dataset.screen = st.screen;
}
render();
