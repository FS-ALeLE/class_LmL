// 교사 진행판 (TV·전자칠판에 띄우는 화면)
import { VILLAGES, STAGES, STORY, LESSON_GOAL, JAR_ML, SCALE_LEVELS, SELF_CHECK, IMG, ACTIVITIES } from "./config.js";
import { createSync } from "./sync.js";
import { h, store, toast, confetti, fmtLmL, readLmL, speakBtn, vImg } from "./util.js";
import { jarSVG, cupSVG, bridgeSVG } from "./art.js";
import { A2_MISSIONS, A2_STEPS, lessonView } from "./lessons.js";

const app = document.getElementById("app");
const params = new URLSearchParams(location.search);
const T = { sync: null, code: null, room: null, unsub: null, lastAllDone: false };
const rp = (p = "") => `rooms/${T.code}${p ? "/" + p : ""}`;

async function boot() {
  app.replaceChildren(h("div.center", h("div.loading", "🏺 오아시스에 연결하는 중…")));
  T.sync = await createSync();
  if (!T.sync) {
    T.code = "수동";
    T.room = store.get("deuli-teacher-manual") || freshRoom();
    render();
    return;
  }
  const saved = store.get("deuli-teacher-room");
  if (saved && Date.now() - saved.at < 12 * 3600 * 1000) {
    const exists = await T.sync.get(`rooms/${saved.code}/createdAt`).catch(() => null);
    if (exists) return attach(saved.code);
  }
  await createRoom();
}

function freshRoom() {
  return { createdAt: Date.now(), stage: "lobby", storyIdx: 0, ask: false, reveal: false, conclude: false, a2step: 0, a2open: false, attention: false, villages: {}, devices: {} };
}

async function createRoom() {
  try { await T.sync.cleanupOld(); } catch (e) { console.warn("cleanup", e); }
  let code;
  for (let i = 0; i < 20; i++) {
    code = String(1000 + Math.floor(Math.random() * 9000));
    const ex = await T.sync.get(`rooms/${code}/createdAt`).catch(() => null);
    if (!ex) break;
  }
  try {
    await T.sync.set(`rooms/${code}`, { ...freshRoom(), createdAt: T.sync.now() });
  } catch (e) {
    console.error(e);
    app.replaceChildren(h("div.center", h("div.panel",
      h("h2", "방을 만들 수 없어요 😢"),
      h("p", "Firebase 보안 규칙이 적용되었는지 확인해 주세요. (README의 ‘Firebase 보안 규칙’ 참고)"),
      h("p.small", String(e && e.message || e)),
      h("a.btn", { href: "?mode=manual" }, "수동 모드로 진행하기"))));
    return;
  }
  attach(code);
}

function attach(code) {
  T.code = code;
  store.set("deuli-teacher-room", { code, at: Date.now() });
  T.unsub?.();
  T.unsub = T.sync.on(rp(), (data) => {
    if (!data) { toast("방이 닫혔어요."); return; }
    T.room = data; render();
  });
  T.sync.onConnection((ok) => document.body.classList.toggle("offline", !ok));
}

function setRoom(patch) {
  if (T.sync) { T.sync.update(rp(), patch).catch((e) => toast("저장 실패: " + e.message, "no")); }
  else { Object.assign(T.room, patch); store.set("deuli-teacher-manual", T.room); render(); }
}
function setVillage(id, patch) {
  if (T.sync) T.sync.update(rp(`villages/${id}`), patch);
  else { T.room.villages = T.room.villages || {}; T.room.villages[id] = { ...(T.room.villages[id] || {}), ...patch }; store.set("deuli-teacher-manual", T.room); render(); }
}

const stageIdx = () => Math.max(0, STAGES.findIndex((s) => s.key === (T.room.stage || "lobby")));
function goStage(i) {
  i = Math.max(0, Math.min(STAGES.length - 1, i));
  setRoom({ stage: STAGES[i].key, attention: false });
}
function next() {
  const st = T.room.stage;
  if (st === "story" && (T.room.storyIdx || 0) < STORY.length - 1) return setRoom({ storyIdx: (T.room.storyIdx || 0) + 1 });
  if (st === "a2" && (T.room.a2step || 0) < A2_STEPS.length - 1) return setRoom({ a2step: (T.room.a2step || 0) + 1 });
  goStage(stageIdx() + 1);
}
function prev() {
  const st = T.room.stage;
  if (st === "story" && (T.room.storyIdx || 0) > 0) return setRoom({ storyIdx: (T.room.storyIdx || 0) - 1 });
  if (st === "a2" && (T.room.a2step || 0) > 0) return setRoom({ a2step: (T.room.a2step || 0) - 1 });
  goStage(stageIdx() - 1);
}

function studentURL() {
  const base = location.href.replace(/teacher(\.html)?(\?.*)?(#.*)?$/, "");
  const q = new URLSearchParams();
  if (T.sync) q.set("room", T.code);
  if (params.get("mode")) q.set("mode", params.get("mode"));
  const qs = q.toString();
  return base + (qs ? "?" + qs : "");
}

// ───────────────── 공통 틀 ─────────────────
function render() {
  const R = T.room || {};
  const idx = stageIdx();
  const devices = Object.entries(R.devices || {});
  const online = devices.filter(([, d]) => d.online !== false).length;

  const top = h("header.tbar",
    h("div.brand", h("img.brand-icon", { src: "assets/img/icon-192.png", alt: "" }), "여섯 마을 물 거래 대소동"),
    T.sync ? h("button.code-chip", { type: "button", title: "입장 QR 크게 보기", onclick: showJoinModal }, "방 코드 ", h("b", T.code)) : h("div.code-chip", h("span", "📴 수동 모드")),
    T.sync ? h("div.online", `👥 ${online}대 접속`) : null,
    h("button.btn.attn", { type: "button", "aria-pressed": String(!!R.attention), onclick: () => setRoom({ attention: !R.attention }) }, R.attention ? "👀 주목 해제" : "👀 주목"),
    h("details.menu", h("summary", "⚙️"),
      h("div.menu-body",
        T.sync ? h("button.btn.primary", { type: "button", onclick: showJoinModal }, "📱 입장 QR·방 코드 크게 보기") : null,
        h("p.small", "학생 주소: ", h("b", studentURL())),
        h("button.btn", { type: "button", onclick: () => { if (confirm("결과를 지우고 처음부터 할까요? (같은 방 코드 유지)")) setRoom({ ...freshRoom(), createdAt: R.createdAt || Date.now(), devices: R.devices || {}, draw: R.draw || null }); } }, "↺ 결과 초기화"),
        T.sync ? h("button.btn", { type: "button", onclick: async () => { if (confirm("새 방을 만들까요? 학생들은 새 코드로 다시 들어와야 해요.")) { T.unsub?.(); await createRoom(); } } }, "🆕 새 방 만들기") : null,
        T.sync ? h("button.btn.danger", { type: "button", onclick: async () => { if (confirm("수업을 마치고 방을 닫을까요? 모든 기록이 지워져요.")) { T.unsub?.(); await T.sync.remove(rp()); store.del("deuli-teacher-room"); app.replaceChildren(h("div.center", h("div.panel", h("h2", "방을 닫았어요. 수고하셨습니다! 👏"), h("button.btn.primary", { onclick: () => location.reload() }, "새 수업 시작")))); } } }, "🚪 방 닫기") : null,
      )),
  );
  const stepper = h("nav.stepper", STAGES.map((s, i) =>
    h("button.step", { type: "button", class: `step ${i === idx ? "now" : i < idx ? "past" : ""}`, onclick: () => goStage(i) }, h("span.n", i), s.short)));

  const views = { lobby: vLobby, story: vStory, goal: vGoal, a1: vA1, a2: vA2, a3: vA3, wrap: vWrap };
  const main = h("main.tmain", (views[R.stage] || vLobby)(R));
  const storyLabel = R.stage === "story" ? ` (${(R.storyIdx || 0) + 1}/${STORY.length})`
    : R.stage === "a2" ? ` · ${A2_STEPS[R.a2step || 0].label}` : "";
  const foot = h("footer.tfoot",
    h("button.btn.big", { type: "button", disabled: idx === 0 && !(R.stage === "story" && R.storyIdx > 0), onclick: prev }, "◀ 이전"),
    h("div.now-label", STAGES[idx].label + storyLabel),
    h("button.btn.primary.big", { type: "button", disabled: idx === STAGES.length - 1, onclick: next }, "다음 ▶"));
  app.replaceChildren(top, stepper, main, foot);
}

// ───────────────── 입장 ─────────────────
function vLobby(R) {
  const url = studentURL();
  const qr = h("div.qr");
  if (window.QRCode && T.sync) setTimeout(() => { try { new window.QRCode(qr, { text: url, width: 200, height: 200 }); } catch {} }, 0);
  return h("div.lobby",
    h("div.join.panel",
      h("img.join-guide", { src: IMG.guide.hello, alt: "" }),
      h("h2", "태블릿으로 들어와요!"),
      T.sync ? h("div.join-code", T.code) : h("p", "수동 모드: 학생들은 주소로 들어와 ‘출발’을 누르면 돼요."),
      qr,
      h("p.url", url)),
    h("div",
    drawPanel(R),
    h("div.panel",
      h("h3", "마을별 접속 현황"),
      h("div.village-status", VILLAGES.map((v) => {
        const ds = Object.values(R.devices || {}).filter((d) => d.v === v.id);
        return h("div.vs", { style: { "--vc": v.color } }, vImg(v), h("b", v.name),
          h("span.devs", ds.length ? ds.sort((a, b) => a.seat - b.seat).map((d) => h("i", { class: d.online === false ? "off" : "" }, `${d.seat}${d.helper ? "🤝" : ""}`)) : "—"));
      })))));
}

// ── 입장 QR·방 코드 크게 보기 (수업 중 연결이 끊긴 학생용, 어느 단계에서나 열 수 있음) ──
function showJoinModal() {
  document.querySelector(".modal")?.remove();
  const url = studentURL();
  const qr = h("div.qr.big");
  const close = () => box.remove();
  const box = h("div.modal", { onclick: close },
    h("div.modal-card.join-modal", { onclick: (e) => e.stopPropagation() },
      h("h2", "태블릿으로 다시 들어와요!"),
      h("div.join-code", T.code),
      qr,
      h("p.url", url),
      h("p.small", "다시 들어오면 고른 마을과 태블릿 번호, 지금까지 푼 내용이 그대로 이어져요."),
      h("button.btn.primary.big", { type: "button", onclick: close }, "닫기")));
  document.body.append(box);
  if (window.QRCode) { try { new window.QRCode(qr, { text: url, width: 300, height: 300 }); } catch {} }
}

// ── 모둠별 마을 추첨 ──
function drawPanel(R) {
  const draw = R.draw;
  return h("div.panel.draw-panel",
    h("h3", "🎲 모둠별 마을 추첨"),
    draw
      ? h("div.draw-result", [1, 2, 3, 4, 5, 6].map((g) => {
          const v = VILLAGES.find((x) => x.id === draw[g]);
          return v ? h("div.draw-item", { style: { "--vc": v.color } }, h("span.g", `${g}모둠`), vImg(v, "emblem-sm"), h("b", v.name)) : null;
        }))
      : h("p.small", "추첨하면 1~6모둠이 맡을 마을이 정해져요. 학생 입장 화면에도 ‘○모둠’ 표시가 나와요."),
    h("button.btn.primary", { type: "button", onclick: () => {
      if (draw && Object.keys(R.devices || {}).length && !confirm("이미 들어온 태블릿이 있어요. 다시 추첨할까요? (학생이 고른 마을은 바뀌지 않아요)")) return;
      runDraw();
    } }, draw ? "🎲 다시 추첨하기" : "🎲 마을 추첨하기"));
}

function runDraw() {
  // 무작위 배정 (피셔-예이츠)
  const ids = VILLAGES.map((v) => v.id);
  for (let i = ids.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [ids[i], ids[j]] = [ids[j], ids[i]]; }
  const result = {}; ids.forEach((id, i) => { result[i + 1] = id; });

  document.querySelector(".modal")?.remove();
  const slots = [1, 2, 3, 4, 5, 6].map((g) => {
    const img = h("img.emblem-lg", { src: VILLAGES[0].img, alt: "" });
    const name = h("b.slot-name", "…");
    const el = h("div.slot", h("span.g", `${g}모둠`), h("div.slot-window", img), name);
    return { g, el, img, name, done: false };
  });
  const okBtn = h("button.btn.primary.big", { type: "button", disabled: true, onclick: () => box.remove() }, "확인");
  const box = h("div.modal",
    h("div.modal-card.draw-modal",
      h("h2", "🎲 우리 모둠은 어느 마을?"),
      h("div.slots", slots.map((s) => s.el)),
      okBtn));
  document.body.append(box);

  let k = 0;
  const spin = setInterval(() => {
    k++;
    slots.forEach((s) => { if (!s.done) s.img.src = VILLAGES[(k + s.g) % VILLAGES.length].img; });
  }, 90);
  slots.forEach((s, i) => setTimeout(() => {
    const v = VILLAGES.find((x) => x.id === result[s.g]);
    s.done = true; s.img.src = v.img; s.name.textContent = v.name;
    s.el.style.setProperty("--vc", v.color); s.el.classList.add("revealed");
    if (i === slots.length - 1) {
      clearInterval(spin); confetti(70); okBtn.disabled = false;
      setRoom({ draw: result });
    }
  }, 1300 + i * 550));
}

// ───────────────── 이야기 ─────────────────
function vStory(R) {
  const i = Math.min(STORY.length - 1, R.storyIdx || 0);
  const s = STORY[i];
  return h("div.tstory",
    h("div.tstory-stage",
      h("img.tstory-img", { src: s.img, alt: s.title }),
      h("div.tstory-cap", h("h1", s.title, speakBtn(s.text)), h("p.story-text", s.text))),
    h("div.dots-nav", STORY.map((_, k) => h("i", { class: k === i ? "on" : "" }))));
}

// ───────────────── 학습 문제 ─────────────────
function vGoal() {
  return h("div.tgoal",
    h("div.panel.goal-card.big",
      h("img.goal-guide", { src: IMG.guide.hello, alt: "" }),
      h("p.goal-kicker", "오늘의 학습 문제"),
      h("h1.goal-text", LESSON_GOAL, speakBtn(LESSON_GOAL))),
    h("div.act-list", ACTIVITIES.map((a) => h("div.panel.act-card",
      h("span.act-no", a.no), h("b", a.name), h("p", a.desc)))));
}

// 결과를 보낸 태블릿 번호 (같은 마을 태블릿은 모두 같은 값을 보냄)
function senders(by) {
  const seats = Object.keys(by || {}).sort();
  return h("span.senders", seats.length ? `보낸 태블릿: ${seats.map((x) => x + "번").join(", ")}` : "\u00a0");
}

// ───────────────── 활동1 ─────────────────
function vA1(R) {
  const res = R.villages || {};
  const cnt = VILLAGES.filter((v) => res[v.id]?.a1 != null).length;
  // 진행 버튼: 질문하기 → 컵 나란히 놓기 → 결론 정리
  let step;
  if (!R.ask) {
    step = h("div.t-question",
      h("p.t-wait", cnt < 6 ? `마을의 결과를 기다리고 있어요 (${cnt} / 6)` : "모든 마을의 결과가 도착했어요!"),
      h("button.btn.primary.big", { type: "button", disabled: cnt < 2, onclick: () => setRoom({ ask: true }) }, "🤔 질문 던지기"));
  } else if (!R.reveal) {
    step = h("div.t-question",
      h("p.big-msg", "🤔 같은 항아리인데 왜 마을마다 컵 수가 다를까요?"),
      h("button.btn.primary.big", { type: "button", onclick: () => setRoom({ reveal: true }) }, "🔍 마을 컵 나란히 놓기"));
  } else {
    step = h("div.panel.t-reveal",
      h("div.cups-row", VILLAGES.map((v) => h("div.cup-col", cupSVG(v, { base: 130 }), h("span.cup-name", v.name.replace(" 마을", ""))))),
      R.conclude
        ? [h("p.big-msg", "컵의 크기가 서로 다르면 같은 항아리도 다르게 재어져요!"),
           h("p.big-msg.accent", "👉 누구나 똑같이 쓸 수 있는 ‘기준 단위’가 필요해요.")]
        : [h("p.big-msg", "🤔 컵들을 비교해 보세요. 무엇을 알 수 있나요? 다툼을 없애려면 무엇이 필요할까요?"),
           h("button.btn.primary.big", { type: "button", onclick: () => setRoom({ conclude: true }) }, "📌 생각 정리하기")]);
  }
  return h("div.ta1",
    h("div.t-head", h("h2", "마법 항아리에는 우리 마을 컵으로 몇 컵?"), h("span.badge", `${cnt} / 6 마을 도착`)),
    h("div.t-board", VILLAGES.map((v) => {
      const val = res[v.id]?.a1;
      return h("button.t-card", { type: "button", style: { "--vc": v.color }, class: `t-card ${val != null ? "in" : ""}`,
        title: "눌러서 직접 입력", onclick: () => {
          const x = prompt(`${v.name}의 결과(컵 수)를 입력하세요`, val ?? "");
          if (x !== null && x.trim() !== "" && !isNaN(+x)) setVillage(v.id, { a1: +x });
        } },
        vImg(v), h("span.name", v.name), h("b.val", val != null ? `${val}컵` : "?"), senders(res[v.id]?.a1by));
    })),
    step);
}

// ───────────────── 활동2 ─────────────────
// 미션마다 [배우기 → 미션] 순서. 배우기 화면에서 [다음]을 누르면 학생 태블릿에 그 미션이 열린다.
const A2N = ["L", "mL", "1000", "장부"];
const lessonState = { pour: 0, rerender: () => render() };
function vA2(R) {
  const step = R.a2step || 0;
  const k = Math.floor(step / 2);
  const chips = h("div.substeps", A2_STEPS.map((st, i) =>
    h("button.substep", { type: "button", class: `substep ${st.kind} ${i === step ? "now" : i < step ? "past" : ""}`, onclick: () => setRoom({ a2step: i }) },
      st.kind === "learn" ? "📖 " : "🏅 ", st.label)));
  if (A2_STEPS[step].kind === "learn") {
    return h("div.ta2l", chips, lessonView(k, { teacher: true, state: lessonState }),
      h("p.t-hint", `설명을 마치고 [다음 ▶]을 누르면 학생 태블릿에서 ‘${A2_MISSIONS[k].name}’ 미션이 열려요.`));
  }
  const devs = Object.values(R.devices || {});
  const doneN = devs.filter((d) => (d.a2 || 0) > k).length;
  const left = h("div",
    h("div.panel.a2-now",
      h("span.lesson-tag", "지금 미션"),
      h("h2", `🏅 ${A2_MISSIONS[k].name}`),
      h("p", A2_MISSIONS[k].task),
      h("div.big-count", h("b", doneN), ` / ${devs.length}대 완료`)),
    step === A2_STEPS.length - 1
      ? (R.a2open
          ? h("div",
              h("div.concepts",
                h("div.ccard", h("b", "1 L"), h("span", "1 리터")),
                h("div.ccard", h("b", "1 mL"), h("span", "1 밀리리터")),
                h("div.ccard.wide.accent", h("b", "1 L = 1000 mL")),
                h("div.ccard.wide", h("b", "1 L 300 mL = 1300 mL"), h("span", "1 리터 300 밀리리터"))),
              h("button.btn.small", { type: "button", onclick: () => setRoom({ a2open: false }) }, "정리 숨기기"))
          : h("button.btn.primary", { type: "button", onclick: () => setRoom({ a2open: true }) }, "📌 활동2 개념 정리 보여 주기"))
      : null);
  return h("div.ta2l", chips, h("div.ta2", left, progressTable(R, "a2", A2N)));
}

function progressTable(R, key, names) {
  const devs = Object.entries(R.devices || {}).map(([id, d]) => ({ id, ...d })).sort((a, b) => a.v - b.v || a.seat - b.seat);
  return h("div.panel.progress",
    h("h3", "태블릿별 진행"),
    devs.length ? h("table",
      h("thead", h("tr", h("th", "태블릿"), names.map((n) => h("th", n)))),
      h("tbody", devs.map((d) => {
        const v = VILLAGES.find((x) => x.id === d.v) || VILLAGES[0];
        const n = d[key] || 0;
        return h("tr", h("td", h("span.td-who", vImg(v, "emblem-xs"), `${v.name.replace(" 마을", "")} ${d.seat}번${d.helper ? " 🤝" : ""}`)), names.map((_, i) => h("td", i < n ? "✅" : i === n ? "✏️" : "·")));
      })))
      : h("p.small", "아직 접속한 태블릿이 없어요."));
}

// ───────────────── 활동3 ─────────────────
function vA3(R) {
  const res = R.villages || {};
  const done = {}; VILLAGES.forEach((v) => { if (res[v.id]?.a3) done[v.id] = true; });
  const n = Object.keys(done).length;
  const all = n === VILLAGES.length;
  if (all && !T.lastAllDone) confetti(80);
  T.lastAllDone = all;
  return h("div.ta3",
    h("div.t-head", h("h2", "평화의 눈금으로 마법 항아리를 다시 재요!"), h("span.badge", `${n} / 6 다리 조각`)),
    h("div.panel", bridgeSVG(VILLAGES, done),
      h("div.t-board.small", VILLAGES.map((v) => {
        const r = res[v.id]?.a3;
        return h("button.t-card", { type: "button", style: { "--vc": v.color }, class: `t-card ${r ? "in" : ""}`, title: "눌러서 직접 완료 표시",
          onclick: () => setVillage(v.id, { a3: r ? null : { l: Math.floor(JAR_ML / 1000), ml: JAR_ML % 1000 } }) },
          vImg(v), h("b.val", r ? fmtLmL(r.l * 1000 + r.ml) : "?"), senders(res[v.id]?.a3by));
      })),
      all ? h("p.big-msg.accent", `모든 마을이 똑같이 ${fmtLmL(JAR_ML)} (${JAR_ML} mL)!`) : null),
    progressTable(R, "a3", SCALE_LEVELS.map((l, i) => `${i + 1}단계`)));
}

// ───────────────── 정리 ─────────────────
function vWrap(R) {
  const res = R.villages || {};
  const done = {}; VILLAGES.forEach((v) => { if (res[v.id]?.a3) done[v.id] = true; });
  const devs = Object.values(R.devices || {});
  const agg = SELF_CHECK.map((_, i) => [0, 1, 2].map((k) => devs.filter((d) => (d.self || [])[i] === k).length));
  return h("div.twrap",
    h("div.panel.twrap-hero", h("img.twrap-img", { src: IMG.bridgeDone, alt: "" }),
      h("div.twrap-side", h("h2", "평화의 다리 완성!"), bridgeSVG(VILLAGES, done), h("img.guide-mid", { src: IMG.guide.cheer, alt: "" }))),
    h("div.wrap-grid",
      h("div.panel",
        h("h3", "오늘 배운 것"),
        h("ul.learned",
          h("li", "들이의 단위: ", h("b", "L(리터)"), ", ", h("b", "mL(밀리리터)")),
          h("li", h("b", "1 L = 1000 mL")),
          h("li", h("b", `${fmtLmL(JAR_ML)}`), " = ", h("b", `${JAR_ML} mL`), ` (${readLmL(JAR_ML)})`),
          h("li", "단위를 쓰면 누가 재어도 똑같이 말할 수 있어요!"))),
      h("div.panel",
        h("h3", "스스로 평가 (😀 / 🙂 / 😥)"),
        SELF_CHECK.map((t, i) => h("div.agg-row", h("span", t), h("span.agg", `😀 ${agg[i][0]}  🙂 ${agg[i][1]}  😥 ${agg[i][2]}`)))),
      h("div.panel",
        h("h3", "🕵️ 과제 · 다음 차시"),
        h("p", "우리 집 들이 탐정: 집에 있는 물건 3개의 들이를 라벨에서 찾아 적어 오기"),
        h("p.small", "다음 시간: 들이의 덧셈과 뺄셈"))));
}

boot();
