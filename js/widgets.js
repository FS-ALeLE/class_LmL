// 문제 풀이 부품들 (객관식, 숫자 입력, L·mL 입력, 따라 쓰기, 짝 맞추기)
import { h, shuffle, speakBtn, toast, speak } from "./util.js";

// 객관식: {q, options[], answer, speakText, onCorrect, hint}
export function choiceQuiz({ q, options, answer, onCorrect, hint, speakText }) {
  const fb = h("p.feedback");
  const box = h("div.quiz",
    h("div.q", h("span", q), speakBtn(speakText || q)),
    h("div.choices", shuffle(options).map((opt) => {
      const b = h("button.choice", { type: "button", onclick: () => {
        if (box.dataset.done) return;
        if (opt === answer) {
          b.classList.add("right"); box.dataset.done = "1";
          fb.textContent = "딩동댕! 맞았어요 🎉"; fb.className = "feedback ok";
          setTimeout(onCorrect, 700);
        } else {
          b.classList.add("wrong"); setTimeout(() => b.classList.remove("wrong"), 600);
          fb.textContent = hint || "다시 한번 생각해 볼까요?"; fb.className = "feedback no";
        }
      } }, opt);
      return b;
    })),
    fb);
  return box;
}

// 숫자 입력: {q, answer, unit, helper, helperOptions, onCorrect, hint}
export function numberQuestion({ q, answer, unit = "", helper, helperOptions, onCorrect, hint, prefix = "" }) {
  if (helper && helperOptions) {
    return choiceQuiz({ q, options: helperOptions.map((o) => `${prefix}${o}${unit ? " " + unit : ""}`), answer: `${prefix}${answer}${unit ? " " + unit : ""}`, onCorrect, hint });
  }
  const fb = h("p.feedback");
  const input = h("input.num", { type: "number", inputmode: "numeric", min: "0", "aria-label": "답", placeholder: "?" });
  const check = () => {
    const v = Number(input.value);
    if (input.value === "") { fb.textContent = "숫자를 입력해 주세요."; fb.className = "feedback no"; return; }
    if (v === answer) {
      input.disabled = true; btn.disabled = true;
      fb.textContent = "딩동댕! 맞았어요 🎉"; fb.className = "feedback ok";
      setTimeout(onCorrect, 700);
    } else {
      input.classList.add("shake"); setTimeout(() => input.classList.remove("shake"), 500);
      fb.textContent = hint || "다시 한번 생각해 볼까요?"; fb.className = "feedback no";
    }
  };
  input.addEventListener("keydown", (e) => { if (e.key === "Enter") check(); });
  const btn = h("button.btn.primary", { type: "button", onclick: check }, "확인");
  return h("div.quiz",
    h("div.q", h("span", q), speakBtn(q)),
    h("div.answer-row", prefix ? h("span.unit", prefix) : null, input, unit ? h("span.unit", unit) : null, btn),
    fb);
}

// L·mL 두 칸 입력: {q, l, ml, helper, helperOptions[], answerText, onCorrect, hint}
export function lmlQuestion({ q, l, ml, helper, helperOptions, answerText, onCorrect, hint }) {
  if (helper && helperOptions) {
    return choiceQuiz({ q, options: helperOptions, answer: answerText, onCorrect, hint });
  }
  const fb = h("p.feedback");
  const iL = h("input.num", { type: "number", inputmode: "numeric", min: "0", "aria-label": "리터", placeholder: "?" });
  const iM = h("input.num", { type: "number", inputmode: "numeric", min: "0", "aria-label": "밀리리터", placeholder: "?" });
  const check = () => {
    const vl = iL.value === "" ? 0 : Number(iL.value), vm = iM.value === "" ? 0 : Number(iM.value);
    if (iL.value === "" && iM.value === "") { fb.textContent = "빈칸에 숫자를 넣어 주세요."; fb.className = "feedback no"; return; }
    if (vl === l && vm === ml) {
      iL.disabled = iM.disabled = btn.disabled = true;
      fb.textContent = "딩동댕! 맞았어요 🎉"; fb.className = "feedback ok";
      setTimeout(onCorrect, 700);
    } else {
      [iL, iM].forEach((i) => { i.classList.add("shake"); setTimeout(() => i.classList.remove("shake"), 500); });
      let msg = hint || "다시 한번 생각해 볼까요?";
      if (vm >= 1000) msg = "mL 칸에는 1000보다 작은 수가 들어가요. 1000 mL는 1 L로 바꿔 써요!";
      fb.textContent = msg; fb.className = "feedback no";
    }
  };
  const btn = h("button.btn.primary", { type: "button", onclick: check }, "확인");
  return h("div.quiz",
    h("div.q", h("span", q), speakBtn(q)),
    h("div.answer-row", iL, h("span.unit", "L"), iM, h("span.unit", "mL"), btn),
    fb);
}

// 따라 쓰기 캔버스: {glyph, helper, onDone}
export function traceBox({ glyph, helper, onDone }) {
  const size = 300;
  const canvas = h("canvas.trace", { width: size * 2, height: size * 2, style: { width: size + "px", height: size + "px" } });
  const ctx = canvas.getContext("2d");
  let ink = 0, drawing = false, last = null;
  const need = helper ? 120 : 260;
  const done = h("button.btn.primary", { type: "button", disabled: true, onclick: () => onDone() }, "다 썼어요 ✔");
  const meter = h("div.meter", h("i"));
  function guide() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#fffdf6"; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "#f0dcb8"; ctx.lineWidth = 2; ctx.setLineDash([10, 10]);
    ctx.beginPath(); ctx.moveTo(0, canvas.height / 2); ctx.lineTo(canvas.width, canvas.height / 2); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = "#e6d3b0";
    ctx.font = `700 ${glyph.length > 1 ? 300 : 420}px "Noto Sans KR", sans-serif`;
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText(glyph, canvas.width / 2, canvas.height / 2 + 20);
  }
  guide();
  const pos = (e) => { const r = canvas.getBoundingClientRect(); return { x: (e.clientX - r.left) * 2, y: (e.clientY - r.top) * 2 }; };
  canvas.addEventListener("pointerdown", (e) => { drawing = true; last = pos(e); canvas.setPointerCapture(e.pointerId); });
  canvas.addEventListener("pointermove", (e) => {
    if (!drawing) return;
    const p = pos(e);
    ctx.strokeStyle = "#2e6fd1"; ctx.lineWidth = 22; ctx.lineCap = "round"; ctx.lineJoin = "round";
    ctx.beginPath(); ctx.moveTo(last.x, last.y); ctx.lineTo(p.x, p.y); ctx.stroke();
    ink += Math.hypot(p.x - last.x, p.y - last.y) / 2; last = p;
    meter.firstChild.style.width = Math.min(100, (ink / need) * 100) + "%";
    if (ink >= need) done.disabled = false;
  });
  const end = () => { drawing = false; };
  canvas.addEventListener("pointerup", end); canvas.addEventListener("pointercancel", end);
  const clear = h("button.btn", { type: "button", onclick: () => { ink = 0; guide(); done.disabled = true; meter.firstChild.style.width = "0"; } }, "지우기");
  return h("div.trace-wrap", canvas, meter, h("div.row", clear, done));
}

// 짝 맞추기: {pairs:[{a,b}], onDone}
export function matchGame({ pairs, onDone }) {
  let sel = null, left = pairs.length;
  const fb = h("p.feedback", "같은 들이끼리 짝을 지어 보세요. 왼쪽 카드 하나, 오른쪽 카드 하나를 차례로 눌러요.");
  const mk = (text, key, side) => {
    const b = h("button.card-btn", { type: "button", "data-key": key, "data-side": side }, text);
    b.addEventListener("click", () => {
      if (b.classList.contains("matched")) return;
      if (!sel || sel.dataset.side === side) {
        if (sel) sel.classList.remove("sel");
        sel = b; b.classList.add("sel"); speak(text); return;
      }
      if (sel.dataset.key === String(key)) {
        [sel, b].forEach((x) => { x.classList.remove("sel"); x.classList.add("matched"); });
        sel = null; left--;
        fb.textContent = "짝 완성! ✨"; fb.className = "feedback ok";
        if (left === 0) setTimeout(onDone, 700);
      } else {
        [sel, b].forEach((x) => { x.classList.add("wrong"); setTimeout(() => x.classList.remove("wrong", "sel"), 600); });
        sel = null;
        fb.textContent = "앗, 들이가 달라요. 1 L는 1000 mL라는 걸 떠올려 보세요!"; fb.className = "feedback no";
      }
    });
    return b;
  };
  const L = shuffle(pairs.map((p, i) => mk(p.a, i, "L")));
  const R = shuffle(pairs.map((p, i) => mk(p.b, i, "R")));
  return h("div.match", h("div.match-cols", h("div.col", L), h("div.col", R)), fb);
}

export { toast };
