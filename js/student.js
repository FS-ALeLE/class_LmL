// 학생 화면
import { VILLAGES, STAGES, STORY, LESSON_GOAL, JAR_ML, MATCH_PAIRS, SCALE_LEVELS, SELF_CHECK, IMG } from "./config.js";
import { createSync } from "./sync.js";
import { h, speakBtn, speak, toast, confetti, store, fmtLmL, readLmL, shuffle, vImg } from "./util.js";
import { jarSVG, cupSVG, beakerSVG, literBoxSVG, bridgeSVG } from "./art.js";
import { choiceQuiz, numberQuestion, lmlQuestion, traceBox, matchGame } from "./widgets.js";

const app = document.getElementById("app");
const params = new URLSearchParams(location.search);
const S = {
  sync: null, code: null, v: null, seat: null, helper: false,
  room: {}, stage: null, ctrl: null, manualStage: 0, unsub: null,
};
const village = () => VILLAGES.find((x) => x.id === S.v);
const devId = () => `${S.v}-${S.seat}`;
const progKey = () => `deuli-prog-${S.code || "manual"}-${devId()}`;
let prog = {};
const saveProg = () => store.set(progKey(), prog);
const roomPath = (p = "") => `rooms/${S.code}${p ? "/" + p : ""}`;
const push = (p, v) => S.sync && S.sync.update(roomPath(p), v).catch((e) => console.warn(e));

// ───────────────── 입장 화면 ─────────────────
async function boot() {
  app.replaceChildren(h("div.center", h("div.loading", "🏺 오아시스에 연결하는 중…")));
  S.sync = await createSync();
  renderEntry();
}

function renderEntry() {
  const saved = store.get("deuli-student");
  let selV = saved?.v || null, selSeat = saved?.seat || 1, helper = !!saved?.helper;
  const codeIn = h("input.code", { type: "text", inputmode: "numeric", maxlength: "4", placeholder: "0000", value: params.get("room") || saved?.code || "", "aria-label": "방 코드" });
  const err = h("p.feedback.no");
  const vBtns = VILLAGES.map((v) => h("button.village-btn", {
    type: "button", style: { "--vc": v.color }, "aria-pressed": String(selV === v.id),
    onclick: () => { selV = v.id; vBtns.forEach((b, i) => b.setAttribute("aria-pressed", String(VILLAGES[i].id === selV))); },
  }, vImg(v), h("span", v.name)));
  const seatBtns = [1, 2, 3].map((n) => h("button.seat-btn", {
    type: "button", "aria-pressed": String(selSeat === n),
    onclick: () => { selSeat = n; seatBtns.forEach((b, i) => b.setAttribute("aria-pressed", String(i + 1 === selSeat))); },
  }, `${n}번 태블릿`));
  const helperChk = h("input", { type: "checkbox", id: "helper", ...(helper ? { checked: true } : {}) });

  const go = async () => {
    if (!selV) { err.textContent = "우리 마을을 골라 주세요."; return; }
    S.v = selV; S.seat = selSeat; S.helper = helperChk.checked;
    if (S.sync) {
      const code = codeIn.value.trim();
      if (!/^\d{4}$/.test(code)) { err.textContent = "방 코드 4자리를 입력해 주세요."; return; }
      err.textContent = "들어가는 중…";
      try {
        const exists = await S.sync.get(`rooms/${code}/createdAt`);
        if (!exists) { err.textContent = "그런 방이 없어요. 선생님 화면의 방 코드를 다시 확인해 주세요."; return; }
      } catch (e) { err.textContent = "연결에 문제가 있어요. 잠시 후 다시 눌러 주세요."; return; }
      S.code = code;
    } else {
      S.code = null;
    }
    store.set("deuli-student", { code: S.code, v: S.v, seat: S.seat, helper: S.helper });
    start();
  };

  app.replaceChildren(h("div.entry",
    h("div.hero", h("img.hero-img", { src: IMG.title, alt: "" }),
      h("div.hero-text", h("h1.title", "여섯 마을 물 거래 대소동"), h("p.sub", "들이의 단위를 찾아 평화의 다리를 놓아요!"))),
    h("div.entry-card",
    S.sync
      ? h("label.field", h("span", "① 방 코드"), codeIn)
      : h("p.manual-note", "📴 수동 모드예요. 선생님 안내에 따라 화면을 직접 넘겨요."),
    h("div.field", h("span", `${S.sync ? "②" : "①"} 우리 마을`), h("div.village-grid", vBtns)),
    h("div.field", h("span", `${S.sync ? "③" : "②"} 우리 태블릿 번호`), h("div.seat-row", seatBtns)),
    h("label.helper-toggle", helperChk, h("span", "도우미 모드 (글자 크게, 고르기 문제, 소리)")),
    err,
    h("button.btn.primary.big", { type: "button", onclick: go }, "출발!"),
  )));
}

// ───────────────── 시작 & 동기화 ─────────────────
function start() {
  document.body.classList.toggle("helper", S.helper);
  prog = store.get(progKey(), {}) || {};
  if (S.sync) {
    const dev = { v: S.v, seat: S.seat, helper: S.helper, online: true, joinedAt: S.sync.now() };
    push(`devices/${devId()}`, dev);
    S.sync.onDisconnectSet(roomPath(`devices/${devId()}/online`), false);
    S.unsub = S.sync.on(roomPath(), onRoom);
    S.sync.onConnection((ok) => document.body.classList.toggle("offline", !ok));
  } else {
    S.manualStage = store.get("deuli-manual-stage", 1);
    onRoom({ stage: STAGES[S.manualStage].key, villages: {} });
  }
}

function onRoom(data) {
  if (S.sync && !data) {
    app.replaceChildren(h("div.center", h("div.panel", h("h2", "수업 방이 닫혔어요 👋"), h("p", "선생님이 방을 닫았어요. 수고했어요!"),
      h("button.btn", { onclick: () => { store.del("deuli-student"); location.href = location.pathname + (params.get("mode") ? `?mode=${params.get("mode")}` : ""); } }, "처음으로"))));
    return;
  }
  S.room = data || {};
  document.body.classList.toggle("attention", !!S.room.attention);
  const stage = S.room.stage || "lobby";
  if (stage !== S.stage) { S.stage = stage; renderStage(); }
  else S.ctrl?.update?.(S.room);
}

function renderStage() {
  const v = village();
  const st = STAGES.find((s) => s.key === S.stage) || STAGES[0];
  const header = h("header.bar", { style: { "--vc": v.color } },
    h("div.who", vImg(v, "emblem-sm"), h("span", `${v.name} · ${S.seat}번`)),
    h("div.stage-name", st.label),
    h("div.conn", { title: S.sync ? "실시간 연결" : "수동 모드" }, S.sync ? "●" : "수동"),
  );
  const builders = { lobby: stLobby, story: stStory, a1: stA1, a2: stA2, a3: stA3, wrap: stWrap };
  S.ctrl = (builders[S.stage] || stLobby)();
  const nodes = [header, h("main.stage", S.ctrl.el)];
  if (!S.sync) {
    nodes.push(h("nav.manual-nav",
      h("button.btn", { disabled: S.manualStage <= 1, onclick: () => moveManual(-1) }, "◀ 이전"),
      h("span", `${S.manualStage} / ${STAGES.length - 1}`),
      h("button.btn.primary", { disabled: S.manualStage >= STAGES.length - 1, onclick: () => moveManual(1) }, "다음 ▶")));
  }
  nodes.push(h("div.attention-overlay", h("div", h("div.big", "👀"), h("p", "선생님을 봐 주세요!"))));
  app.replaceChildren(...nodes);
  window.scrollTo(0, 0);
}
function moveManual(d) {
  S.manualStage = Math.max(1, Math.min(STAGES.length - 1, S.manualStage + d));
  store.set("deuli-manual-stage", S.manualStage);
  onRoom({ ...S.room, stage: STAGES[S.manualStage].key });
}

// ───────────────── 단계: 입장 대기 ─────────────────
function stLobby() {
  const v = village();
  return { el: h("div.center", h("div.welcome",
    h("div.welcome-art", h("img.guide-big", { src: IMG.guide.hello, alt: "들이 박사" }), vImg(v, "emblem-lg")),
    h("div.panel",
      h("h2", `${v.name} 견습 측량사님, 환영해요!`),
      h("p", "나는 들이 박사야. 선생님이 시작할 때까지 잠깐만 기다려 줘!"),
      h("div.dots", h("i"), h("i"), h("i"))))) };
}

// ───────────────── 단계: 이야기 ─────────────────
function stStory() {
  const wrap = h("div.story");
  let localIdx = 0;
  const draw = () => {
    const idx = S.sync ? Math.min(STORY.length - 1, S.room.storyIdx || 0) : localIdx;
    const s = STORY[idx];
    const last = idx === STORY.length - 1;
    wrap.replaceChildren(h("div.panel.story-card",
      h("div.story-img-wrap", h("img.story-img", { src: s.img, alt: s.title }), h("span.story-no", `${idx + 1} / ${STORY.length}`)),
      h("h2", s.title, speakBtn(s.text)),
      h("p.story-text", s.text),
      last ? h("div.goal", h("b", "📜 학습 문제"), h("p", LESSON_GOAL)) : null,
      last ? h("p.mine", vImg(village(), "emblem-sm"), `우리는 ${village().name}! 우리 마을 컵을 받았어요.`) : null,
      !S.sync ? h("div.row",
        h("button.btn", { disabled: idx === 0, onclick: () => { localIdx--; draw(); } }, "◀"),
        h("button.btn", { disabled: last, onclick: () => { localIdx++; draw(); } }, "▶")) : null,
    ));
  };
  draw();
  return { el: wrap, update: draw };
}

// ───────────────── 활동1: 물 거래 대소동 ─────────────────
function stA1() {
  const v = village();
  prog.a1 = prog.a1 || { pours: 0, submitted: false };
  const P = prog.a1;
  const need = Math.ceil(JAR_ML / v.cup);
  const root = h("div.a1");

  const drawBoard = () => {
    const res = S.room.villages || {};
    const board = h("div.result-board", VILLAGES.map((x) => {
      const val = x.id === v.id ? (res[x.id]?.a1 ?? (P.submitted ? P.count : null)) : res[x.id]?.a1;
      return h("div.result-card", { style: { "--vc": x.color }, class: `result-card ${x.id === v.id ? "me" : ""}` },
        vImg(x), h("span.name", x.name),
        h("b.val", val != null ? `${val}컵` : "…"));
    }));
    const reveal = S.room.reveal ? h("div.panel.reveal",
      h("h3", "🔍 마을 컵을 나란히 놓아 보면…"),
      h("div.cups-row", VILLAGES.map((x) => h("div.cup-col", cupSVG(x, { base: 90 }), h("span.cup-name", x.name.replace(" 마을", ""))))),
      h("p.big-msg", "컵의 크기가 서로 달라요! 그래서 같은 항아리도 다르게 잰 거예요."),
      h("p", "👉 모두가 똑같이 쓸 수 있는 ‘기준’이 필요해요!")) : null;
    return h("div",
      h("div.panel", h("h3", "여섯 마을의 결과", speakBtn("여섯 마을의 결과를 살펴봐요. 같은 항아리인데 왜 결과가 다를까요?")),
        board,
        h("p.question", "🤔 같은 항아리인데 왜 마을마다 결과가 다를까요?")),
      reveal);
  };

  const draw = () => {
    if (P.submitted) { root.replaceChildren(h("p.done-banner", `✅ 우리 마을은 ${P.count}컵이라고 알렸어요!`), drawBoard()); return; }
    const jar = jarSVG(Math.min(1, (P.pours * v.cup) / JAR_ML));
    const cup = cupSVG(v, { base: 120 });
    const full = P.pours >= need;
    const tally = h("div.tally", Array.from({ length: P.pours }, (_, i) => h("span.tally-cup", { style: { "--vc": v.color } }, vImg(v, "emblem-xs"))));
    const pourBtn = h("button.btn.primary.big", { type: "button", disabled: full, onclick: () => {
      pourBtn.disabled = true;
      cup.classList.add("pouring");
      setTimeout(() => {
        cup.classList.remove("pouring");
        P.pours = Math.min(need, P.pours + 1); saveProg();
        jar.setLevel((P.pours * v.cup) / JAR_ML);
        tally.append(h("span.tally-cup.pop", { style: { "--vc": v.color } }, vImg(v, "emblem-xs")));
        if (P.pours >= need) setTimeout(draw, 900); else pourBtn.disabled = false;
      }, 650);
    } }, "🫗 컵으로 물 붓기");
    const ask = full ? h("div.panel.ask",
      h("p.big-msg", "항아리가 가득 찼어요! 💧"),
      numberQuestion({
        q: `마법 항아리에는 우리 마을 컵으로 몇 컵만큼 물이 들어가나요?`,
        answer: need, unit: "컵", helper: S.helper,
        helperOptions: shuffle([need, need + 2, Math.max(1, need - 1)]),
        hint: "아래에 있는 컵 그림의 개수를 하나씩 세어 보세요.",
        onCorrect: () => {
          P.submitted = true; P.count = need; saveProg();
          push(`villages/${v.id}`, { a1: need });
          confetti(30); draw();
        },
      })) : null;
    root.replaceChildren(
      h("div.panel.mission", h("h3", "미션 1 · 우리 마을 컵으로 마법 항아리 재기", speakBtn("우리 마을 컵으로 물을 부어서 마법 항아리를 가득 채워 보세요. 몇 컵이 들어가는지 세어 보세요.")),
        h("p", "컵으로 물을 부어 항아리를 가득 채워 보세요. 몇 컵이 들어갈까요?")),
      h("div.scene", h("div.cup-holder", cup, h("span.label", v.cupName)), h("div.arrow", "➜"), h("div.jar-holder", jar)),
      h("div.row.center-row", pourBtn,
        h("button.btn.small", { type: "button", onclick: () => { P.pours = 0; saveProg(); draw(); } }, "↺ 처음부터")),
      tally, ask);
  };
  draw();
  return { el: root, update: () => { if (P.submitted) draw(); } };
}

// ───────────────── 활동2: 단위의 탄생 ─────────────────
const A2_MISSIONS = [
  { mark: "L", name: "L 각인" },
  { mark: "mL", name: "mL 각인" },
  { mark: "1000", name: "천 개의 물방울" },
  { mark: "장부", name: "마을 장부" },
];
const medal = (i, cls = "medal") => h(`div.${cls}`, h("img", { src: IMG.badge[i], alt: "" }), h("b", A2_MISSIONS[i].mark));

// 각인 획득 축하 창
function showReward(i, title) {
  const close = () => box.remove();
  const box = h("div.reward", { onclick: close },
    h("div.reward-card", { onclick: (e) => e.stopPropagation() },
      h("p.reward-kicker", "각인 획득!"),
      medal(i, "medal.big"),
      h("h2", title),
      h("img.reward-guide", { src: IMG.guide.cheer, alt: "" }),
      h("button.btn.primary.big", { type: "button", onclick: close }, "계속하기")));
  document.body.append(box);
}
function stA2() {
  prog.a2 = prog.a2 || { m: 0, step: 0 };
  const P = prog.a2;
  const root = h("div.a2");
  const map = () => h("div.mission-map", A2_MISSIONS.map((m, i) =>
    h("div.node", { class: `node ${i < P.m ? "done" : i === P.m ? "now" : "locked"}` }, medal(i, "medal.sm"), h("span", m.name))));
  const next = () => { P.step++; saveProg(); draw(); };
  const finishMission = (msg) => {
    const done = P.m;
    P.m++; P.step = 0; saveProg();
    push(`devices/${devId()}`, { a2: P.m });
    confetti(35); draw();
    showReward(done, msg.replace(/^\S+\s/, ""));
  };

  const learnCard = ({ big, read, lines, speakText }) => h("div.panel.learn",
    h("div.unit-big", big),
    h("div.read-as", "읽기: ", h("b", read), speakBtn(speakText || read)),
    lines.map((l) => h("p", l)),
    h("button.btn.primary", { type: "button", onclick: next }, "써 보기 ✍️"));

  const missions = [
    // M1: L
    () => [
      learnCard({ big: "1 L", read: "1 리터", lines: ["들이의 단위에는 ‘리터’가 있어요.", "1 리터는 1 L라고 써요."] }),
      h("div.panel", h("h3", "L를 따라 써 보세요", speakBtn("엘을 따라 써 보세요")), traceBox({ glyph: "L", helper: S.helper, onDone: next })),
      h("div.panel", choiceQuiz({ q: "‘3 L’는 어떻게 읽을까요?", options: ["3 리터", "3 밀리리터", "3 엘"], answer: "3 리터",
        hint: "L는 ‘리터’라고 읽어요.", onCorrect: () => finishMission("🅻 L 각인을 얻었어요!") })),
    ],
    // M2: mL
    () => [
      learnCard({ big: "1 mL", read: "1 밀리리터", lines: ["L보다 작은 들이의 단위에는 ‘밀리리터’가 있어요.", "1 밀리리터는 1 mL라고 써요.", "약병이나 숟가락처럼 아주 적은 양을 나타낼 때 써요."] }),
      h("div.panel", h("h3", "mL를 따라 써 보세요", speakBtn("엠엘을 따라 써 보세요")), traceBox({ glyph: "mL", helper: S.helper, onDone: next })),
      h("div.panel", choiceQuiz({ q: "‘500 mL’는 어떻게 읽을까요?", options: ["500 밀리리터", "500 리터", "500 엠엘"], answer: "500 밀리리터",
        hint: "mL는 ‘밀리리터’라고 읽어요.", onCorrect: next })),
      h("div.panel", choiceQuiz({ q: "‘2 리터’를 바르게 쓴 것은?", options: ["2 L", "2 mL", "L 2"], answer: "2 L",
        hint: "수를 먼저 쓰고, 그 뒤에 단위를 써요. 리터는 L!", onCorrect: () => finishMission("💧 mL 각인을 얻었어요!") })),
    ],
    // M3: 1 L = 1000 mL
    () => {
      P.pour = P.pour || 0;
      if (P.step === 0) {
        const box = literBoxSVG(P.pour);
        const counter = h("p.counter");
        const setCounter = () => { counter.innerHTML = P.pour ? `100 mL를 <b>${P.pour}</b>번 부었어요 → <b>${P.pour * 100} mL</b>` : "100 mL 컵으로 1 L 그릇을 채워 보세요!"; };
        setCounter();
        const btn = h("button.btn.primary.big", { type: "button", disabled: P.pour >= 10, onclick: () => {
          P.pour = Math.min(10, P.pour + 1); saveProg(); box.setCount(P.pour); setCounter();
          speak(`${P.pour * 100} 밀리리터`);
          if (P.pour >= 10) { btn.disabled = true; setTimeout(() => { P.step = 1; saveProg(); draw(); }, 1100); }
        } }, "🥛 100 mL 붓기");
        return [h("div.panel", h("h3", "천 개의 물방울", speakBtn("100 밀리리터 컵으로 1 리터 그릇을 가득 채우려면 몇 번 부어야 할까요?")),
          h("p", "100 mL 컵으로 1 L 그릇을 가득 채우려면 몇 번 부어야 할까요?"),
          h("div.scene", h("div.small-cup", "🥛", h("span.label", "100 mL")), h("div.arrow", "➜"), box),
          counter, h("div.row.center-row", btn))];
      }
      if (P.step === 1) {
        return [h("div.panel", h("p.big-msg", "1 L 그릇이 가득 찼어요! 100 mL를 10번 부었어요."),
          numberQuestion({ q: "1 L는 몇 mL와 같을까요? 1 L = □ mL", answer: 1000, unit: "mL", prefix: "1 L = ",
            helper: S.helper, helperOptions: [10, 100, 1000],
            hint: "100 mL가 10번이면 100, 200, 300, … 몇 mL일까요?", onCorrect: next }))];
      }
      return [h("div.panel.stamp-panel", h("div.stamp", "1 L = 1000 mL"), speakBtn("1 리터는 1000 밀리리터와 같아요."),
        h("p", "1 L는 1000 mL와 같아요."),
        h("button.btn.primary", { type: "button", onclick: () => finishMission("🔟 ‘1 L = 1000 mL’ 각인을 얻었어요!") }, "각인 받기 ✨"))];
    },
    // M4: 장부 (바꿔 나타내기·읽기·쓰기)
    () => {
      const steps = [
        () => h("div.panel", h("h3", "마을 장부 ① 같은 들이 짝 맞추기", speakBtn("같은 들이끼리 짝을 지어 보세요.")),
          h("p.tip", "💡 1 L 300 mL = 1000 mL + 300 mL = 1300 mL"),
          matchGame({ pairs: S.helper ? MATCH_PAIRS.slice(0, 2) : MATCH_PAIRS, onDone: next })),
        () => h("div.panel", h("h3", "마을 장부 ② 바르게 읽기"),
          choiceQuiz({ q: "‘2 L 500 mL’를 바르게 읽은 것은?", options: ["2 리터 500 밀리리터", "2500 리터", "2 밀리리터 500 리터"], answer: "2 리터 500 밀리리터",
            hint: "L는 리터, mL는 밀리리터! 앞에서부터 차례로 읽어요.", onCorrect: next })),
        () => h("div.panel", h("h3", "마을 장부 ③ 바르게 쓰기"),
          lmlQuestion({ q: "‘1 리터 700 밀리리터’를 써 보세요.", l: 1, ml: 700, helper: S.helper,
            helperOptions: ["1 L 700 mL", "1 mL 700 L", "17 L"], answerText: "1 L 700 mL",
            hint: "리터 앞의 수는 L 칸에, 밀리리터 앞의 수는 mL 칸에 써요.", onCorrect: next })),
        () => h("div.panel", h("h3", "마을 장부 ④ mL로 나타내기"),
          numberQuestion({ q: "1 L 700 mL는 몇 mL일까요?", answer: 1700, unit: "mL", helper: S.helper, helperOptions: [1700, 1007, 170],
            hint: "1 L는 1000 mL! 1000 mL와 700 mL를 합하면?", onCorrect: () => finishMission("📒 마을 장부를 완성했어요!") })),
      ];
      return [steps[Math.min(P.step, steps.length - 1)]()];
    },
  ];

  const draw = () => {
    if (P.m >= A2_MISSIONS.length) {
      root.replaceChildren(map(), h("div.panel.center-text",
        h("div.medal-row", A2_MISSIONS.map((_, i) => medal(i, "medal"))), h("h2", "단위의 각인을 모두 모았어요!"),
        h("div.summary-cards",
          h("div.sum", h("b", "1 L"), h("span", "1 리터")),
          h("div.sum", h("b", "1 mL"), h("span", "1 밀리리터")),
          h("div.sum.wide", h("b", "1 L = 1000 mL")),
          h("div.sum.wide", h("b", "1 L 300 mL = 1300 mL"), h("span", "1 리터 300 밀리리터"))),
        h("p", "선생님이 다음 활동을 열 때까지 짝과 함께 각인을 다시 읽어 보세요.")));
      return;
    }
    const steps = missions[P.m]();
    const cur = P.m <= 1 ? steps[Math.min(P.step, steps.length - 1)] : steps[0];
    root.replaceChildren(map(), cur);
  };
  draw();
  return { el: root };
}

// ───────────────── 활동3: 평화의 눈금 ─────────────────
function stA3() {
  const v = village();
  prog.a3 = prog.a3 || { lvl: 0, part: 0, poured: false };
  const P = prog.a3;
  const root = h("div.a3");
  const advance = () => {
    if (SCALE_LEVELS[P.lvl].ask === "both" && P.part === 0) { P.part = 1; saveProg(); draw(); return; }
    const lv = SCALE_LEVELS[P.lvl];
    if (lv.final) {
      push(`villages/${v.id}`, { a3: { l: Math.floor(lv.value / 1000), ml: lv.value % 1000 } });
    }
    P.lvl++; P.part = 0; P.poured = false; saveProg();
    push(`devices/${devId()}`, { a3: P.lvl });
    confetti(lv.final ? 60 : 20);
    if (lv.final) toast("🌉 다리 조각을 보냈어요!", "ok");
    draw();
  };
  const levelDots = () => h("div.level-dots", SCALE_LEVELS.map((l, i) => h("span", { class: i < P.lvl ? "on" : i === P.lvl ? "now" : "" }, i < P.lvl ? "⭐" : i + 1)));

  const bridgeBoard = () => {
    const res = S.room.villages || {};
    const done = {}; VILLAGES.forEach((x) => { if (res[x.id]?.a3) done[x.id] = true; });
    if (P.lvl >= SCALE_LEVELS.length) done[v.id] = true;
    return h("div.panel", h("h3", "🌉 평화의 다리"), bridgeSVG(VILLAGES, done),
      h("div.result-board.small", VILLAGES.map((x) => {
        const r = res[x.id]?.a3;
        return h("div.result-card", { style: { "--vc": x.color } }, vImg(x), h("b.val", r ? fmtLmL(r.l * 1000 + r.ml) : "…"));
      })));
  };

  const draw = () => {
    if (P.lvl >= SCALE_LEVELS.length) {
      root.replaceChildren(levelDots(), h("div.panel.center-text",
        h("img.guide-mid", { src: IMG.guide.cheer, alt: "" }),
        h("h2", `마법 항아리의 들이는 ${fmtLmL(JAR_ML)}!`),
        h("p.big-msg", `${JAR_ML} mL · ${readLmL(JAR_ML)}`, speakBtn(`마법 항아리의 들이는 ${readLmL(JAR_ML)}, ${JAR_ML} 밀리리터예요.`)),
        h("p", "단위로 재니까 어느 마을이 재도 똑같아요!")), bridgeBoard());
      return;
    }
    const lv = SCALE_LEVELS[P.lvl];
    const beaker = beakerSVG({ ...lv, water: !lv.final || P.poured });
    const parts = [levelDots()];
    const head = h("div.panel.mission", h("h3", `${lv.final ? "🏺 " : ""}${lv.title}`, speakBtn(lv.final ? "마법 항아리의 물을 큰 계량컵에 부어서 들이를 재어 보세요." : "눈금을 읽어 물의 양을 알아보세요.")),
      h("p", lv.final ? "마법 항아리의 물을 큰 계량컵에 옮겨 담아 들이를 재어 보세요!" : "물의 윗면과 만나는 눈금을 읽어 보세요."));
    parts.push(head);
    const scene = h("div.scene.a3-scene", lv.final ? h("div.jar-holder.small", jarSVG(P.poured ? 0 : 1)) : null, lv.final ? h("div.arrow", "➜") : null, h("div.beaker-holder", beaker));
    parts.push(scene);
    if (lv.final && !P.poured) {
      parts.push(h("div.row.center-row", h("button.btn.primary.big", { type: "button", onclick: () => {
        P.poured = true; saveProg();
        scene.querySelector(".jar .water").style.transform = "translateY(200px)";
        beaker.pour();
        setTimeout(draw, 1300);
      } }, "🫗 항아리 물 붓기")));
      root.replaceChildren(...parts);
      return;
    }
    const L = Math.floor(lv.value / 1000), M = lv.value % 1000;
    const hint = lv.hint;
    let q;
    if (lv.ask === "ml" || P.part === 1) {
      q = numberQuestion({ q: lv.ask === "ml" ? "물의 양은 몇 mL일까요?" : `${fmtLmL(lv.value)}는 몇 mL일까요?`, answer: lv.value, unit: "mL", helper: S.helper,
        helperOptions: shuffle([lv.value, lv.value + lv.tick, Math.max(lv.tick, lv.value - 2 * lv.tick)]), hint: lv.ask === "ml" ? hint : "1 L는 1000 mL예요. 1000 mL와 나머지 mL를 합해 보세요.", onCorrect: advance });
    } else {
      const opts = [fmtLmL(lv.value), fmtLmL(lv.value + 100), `${L} L ${M / 100} mL`];
      q = lmlQuestion({ q: "물의 양을 ‘□ L □ mL’로 나타내 보세요.", l: L, ml: M, helper: S.helper, helperOptions: opts, answerText: fmtLmL(lv.value), hint, onCorrect: advance });
    }
    parts.push(h("div.panel", q));
    root.replaceChildren(...parts);
  };
  draw();
  return { el: root, update: () => { if (P.lvl >= SCALE_LEVELS.length) draw(); } };
}

// ───────────────── 정리: 평화의 다리 ─────────────────
function stWrap() {
  prog.self = prog.self || [];
  const root = h("div.wrap");
  const faces = [["😀", "잘해요"], ["🙂", "보통이에요"], ["😥", "어려워요"]];
  const draw = () => {
    const res = S.room.villages || {};
    const done = {}; VILLAGES.forEach((x) => { if (res[x.id]?.a3) done[x.id] = true; });
    if (!S.sync && (prog.a3?.lvl || 0) >= SCALE_LEVELS.length) done[S.v] = true;
    root.replaceChildren(
      h("div.panel.center-text.wrap-hero", h("img.story-img", { src: IMG.bridgeDone, alt: "" }), h("h2", "평화의 다리가 놓였어요!"), bridgeSVG(VILLAGES, done),
        h("p", "같은 단위(L, mL)로 재니까 여섯 마을의 들이가 똑같아졌어요.")),
      h("div.panel", h("h3", "📝 스스로 평가해 봐요"),
        SELF_CHECK.map((text, i) => h("div.self-row", h("span.self-q", text, speakBtn(text)),
          h("div.faces", faces.map(([f, label], k) => h("button.face", {
            type: "button", "aria-pressed": String(prog.self[i] === k), title: label,
            onclick: () => { prog.self[i] = k; saveProg(); push(`devices/${devId()}`, { self: prog.self.map((x) => (x == null ? -1 : x)) }); draw(); },
          }, f)))))),
      h("div.panel.homework", h("h3", "🕵️ 우리 집 들이 탐정 (과제)"),
        h("p", "집에 있는 물건 3개의 들이를 라벨에서 찾아 L나 mL로 적어 와요."),
        h("p.small", "예) 우유 200 mL, 생수 2 L, 샴푸 500 mL")),
    );
  };
  draw();
  return { el: root, update: draw };
}

boot();
