// 작은 도우미 함수들

// h("div.card#id", {onclick}, child, "text", ...)
export function h(sel, attrs, ...children) {
  const m = sel.match(/^([a-z0-9]+)?((?:[.#][\w-]+)*)$/i);
  const el = document.createElement((m && m[1]) || "div");
  if (m && m[2]) {
    m[2].match(/[.#][\w-]+/g).forEach((t) => {
      if (t[0] === ".") el.classList.add(t.slice(1)); else el.id = t.slice(1);
    });
  }
  if (attrs && (typeof attrs !== "object" || attrs instanceof Node || Array.isArray(attrs))) {
    children.unshift(attrs); attrs = null;
  }
  if (attrs) {
    for (const [k, v] of Object.entries(attrs)) {
      if (v === undefined || v === null || v === false) continue;
      if (k.startsWith("on")) el.addEventListener(k.slice(2), v);
      else if (k === "html") el.innerHTML = v;
      else if (k === "style" && typeof v === "object") {
        for (const [sk, sv] of Object.entries(v)) {
          if (sk.startsWith("--")) el.style.setProperty(sk, sv); else el.style[sk] = sv;
        }
      }
      else el.setAttribute(k, v === true ? "" : v);
    }
  }
  append(el, children);
  return el;
}
function append(el, children) {
  children.flat(Infinity).forEach((c) => {
    if (c === null || c === undefined || c === false) return;
    el.append(c instanceof Node ? c : document.createTextNode(String(c)));
  });
}

export function svgEl(markup) {
  const t = document.createElement("template");
  t.innerHTML = markup.trim();
  return t.content.firstElementChild;
}

export function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

// 1200 → "1 L 200 mL", 300 → "300 mL", 2000 → "2 L"
export function fmtLmL(ml) {
  const l = Math.floor(ml / 1000), r = ml % 1000;
  if (l && r) return `${l} L ${r} mL`;
  if (l) return `${l} L`;
  return `${r} mL`;
}
// 읽는 말: 1200 → "1 리터 200 밀리리터"
export function readLmL(ml) {
  const l = Math.floor(ml / 1000), r = ml % 1000;
  return [l ? `${l} 리터` : "", r ? `${r} 밀리리터` : ""].filter(Boolean).join(" ");
}

// 소리로 읽어 주기 (Web Speech API)
let koVoice = null;
function pickVoice() {
  if (!("speechSynthesis" in window)) return;
  koVoice = speechSynthesis.getVoices().find((v) => v.lang && v.lang.startsWith("ko")) || null;
}
if ("speechSynthesis" in window) { pickVoice(); speechSynthesis.onvoiceschanged = pickVoice; }
export function speak(text) {
  if (!("speechSynthesis" in window)) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(
    text.replace(/(\d+)\s*mL/g, "$1 밀리리터").replace(/(\d+)\s*L/g, "$1 리터").replace(/\bmL\b/g, "밀리리터").replace(/\bL\b/g, "리터")
  );
  u.lang = "ko-KR"; u.rate = 0.9;
  if (koVoice) u.voice = koVoice;
  speechSynthesis.speak(u);
}
export function speakBtn(text) {
  return h("button.speak", { type: "button", title: "소리로 듣기", "aria-label": "소리로 듣기", onclick: (e) => { e.stopPropagation(); speak(typeof text === "function" ? text() : text); } }, "🔊");
}

export function toast(msg, kind = "") {
  let box = document.getElementById("toasts");
  if (!box) { box = h("div#toasts"); document.body.append(box); }
  const t = h(`div.toast${kind ? "." + kind : ""}`, msg);
  box.append(t);
  setTimeout(() => t.classList.add("out"), 2200);
  setTimeout(() => t.remove(), 2700);
}

export function confetti(n = 40) {
  const box = h("div.confetti");
  const colors = ["#f2b705", "#4caf50", "#2e9cca", "#e57373", "#7e57c2", "#00897b"];
  for (let i = 0; i < n; i++) {
    box.append(h("i", { style: { left: Math.random() * 100 + "%", background: colors[i % colors.length], animationDelay: Math.random() * 0.6 + "s", transform: `rotate(${Math.random() * 360}deg)` } }));
  }
  document.body.append(box);
  setTimeout(() => box.remove(), 2600);
}

export const store = {
  get(k, d = null) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
  del(k) { try { localStorage.removeItem(k); } catch {} },
};
