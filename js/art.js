// 그림(SVG) 만들기: 항아리, 마을 컵, 눈금 비커, 평화의 다리
import { svgEl } from "./util.js";

let uid = 0;

// ── 마법 항아리 ── level: 0~1
const JAR_PATH = "M72,22 L128,22 L126,44 C172,62 184,110 176,158 C168,204 142,228 100,228 C58,228 32,204 24,158 C16,110 28,62 74,44 Z";
const JAR_TOP = 44, JAR_BOTTOM = 228;
export function jarSVG(level = 0) {
  const id = "jar" + uid++;
  const H = JAR_BOTTOM - JAR_TOP;
  const svg = svgEl(`
  <svg class="jar" viewBox="0 0 200 240" role="img" aria-label="마법 항아리">
    <defs>
      <clipPath id="${id}"><path d="${JAR_PATH}"/></clipPath>
      <linearGradient id="${id}g" x1="0" x2="1"><stop offset="0" stop-color="#d98c4a"/><stop offset=".5" stop-color="#f0b37a"/><stop offset="1" stop-color="#c0743a"/></linearGradient>
    </defs>
    <path d="${JAR_PATH}" fill="url(#${id}g)"/>
    <g clip-path="url(#${id})">
      <rect class="water" x="0" y="${JAR_TOP}" width="200" height="${H + 4}" fill="#4fb3e8" opacity=".92"
        style="transform: translateY(${(1 - level) * H}px)"/>
      <path d="M20,140 Q60,120 100,150 T180,130" stroke="#fff" stroke-opacity=".25" stroke-width="10" fill="none"/>
    </g>
    <path d="${JAR_PATH}" fill="none" stroke="#7a4a22" stroke-width="4"/>
    <ellipse cx="100" cy="22" rx="30" ry="6" fill="#a8622c" stroke="#7a4a22" stroke-width="3"/>
    <text x="100" y="140" text-anchor="middle" font-size="30">✨</text>
  </svg>`);
  svg.setLevel = (lv) => { svg.querySelector(".water").style.transform = `translateY(${(1 - Math.min(1, Math.max(0, lv))) * H}px)`; };
  return svg;
}

// ── 마을 컵 ── 들이에 따라 크기가 달라지는 컵 (부피 ∝ 크기³)
export function cupSVG(village, { base = 110, full = true } = {}) {
  const s = Math.cbrt(village.cup / 400);
  const w = Math.round(base * s), hgt = Math.round(base * 1.15 * s);
  const svg = svgEl(`
  <svg class="cup" viewBox="0 0 100 115" width="${w}" height="${hgt}" role="img" aria-label="${village.cupName}">
    <path d="M10,8 L90,8 L80,108 L20,108 Z" fill="#fff" stroke="${village.color}" stroke-width="5" stroke-linejoin="round"/>
    ${full ? `<path d="M15,30 L85,30 L80,104 L20,104 Z" fill="#4fb3e8" opacity=".85"/>` : ""}
    <image href="${village.img}" x="27" y="50" width="46" height="46"/>
  </svg>`);
  return svg;
}

// ── 눈금 비커 / 계량컵 ──
// {max, tick, label, value, showWater, labels:true}
export function fmtScale(ml) {
  if (ml > 0 && ml % 1000 === 0) return `${ml / 1000} L`;
  return `${ml} mL`;
}
export function beakerSVG({ max, tick, label, value = 0, water = true, labelFn = fmtScale }) {
  const id = "bk" + uid++;
  const top = 40, bottom = 300, H = bottom - top;
  const x0 = 50, x1 = 190;
  const y = (ml) => bottom - (ml / max) * H;
  let ticks = "";
  for (let ml = tick; ml <= max; ml += tick) {
    const isLabel = ml % label === 0;
    const yy = y(ml).toFixed(1);
    ticks += `<line x1="${x0}" x2="${x0 + (isLabel ? 34 : 18)}" y1="${yy}" y2="${yy}" stroke="#24506b" stroke-width="${isLabel ? 3 : 2}"/>`;
    if (isLabel) ticks += `<text x="${x0 + 40}" y="${(+yy + 6).toFixed(1)}" font-size="${max > 1000 ? 17 : 15}" font-weight="700" fill="#24506b">${labelFn(ml)}</text>`;
  }
  const svg = svgEl(`
  <svg class="beaker" viewBox="0 0 240 320" role="img" aria-label="눈금이 있는 그릇">
    <defs><clipPath id="${id}"><rect x="${x0}" y="${top - 20}" width="${x1 - x0}" height="${H + 20}" rx="6"/></clipPath></defs>
    <rect x="${x0}" y="${top - 20}" width="${x1 - x0}" height="${H + 20}" rx="8" fill="#eef8fd" />
    <g clip-path="url(#${id})">
      <g class="water" style="transform: translateY(${water ? 0 : H}px)">
        <rect x="${x0}" y="${y(value)}" width="${x1 - x0}" height="${(value / max) * H + 4}" fill="#4fb3e8" opacity=".55"/>
        <line x1="${x0}" x2="${x1}" y1="${y(value)}" y2="${y(value)}" stroke="#1e88c7" stroke-width="3"/>
      </g>
    </g>
    ${ticks}
    <path d="M${x0 - 4},${top - 24} L${x0},${top - 20} L${x0},${bottom} Q${x0},${bottom + 8} ${x0 + 8},${bottom + 8} L${x1 - 8},${bottom + 8} Q${x1},${bottom + 8} ${x1},${bottom} L${x1},${top - 20} L${x1 + 4},${top - 24}"
      fill="none" stroke="#24506b" stroke-width="4" stroke-linejoin="round"/>
  </svg>`);
  svg.pour = () => { svg.querySelector(".water").style.transform = "translateY(0)"; };
  return svg;
}

// ── 1 L 그릇에 100 mL씩 붓기 ──
export function literBoxSVG(count = 0) {
  const top = 30, bottom = 290, H = bottom - top, x0 = 60, x1 = 180;
  let marks = "";
  for (let i = 1; i <= 10; i++) {
    const yy = bottom - (i / 10) * H;
    marks += `<line x1="${x1 - 22}" x2="${x1}" y1="${yy}" y2="${yy}" stroke="#24506b" stroke-width="2"/>`;
  }
  const svg = svgEl(`
  <svg class="literbox" viewBox="0 0 240 320" role="img" aria-label="1 L 그릇">
    <rect x="${x0}" y="${top}" width="${x1 - x0}" height="${H}" rx="8" fill="#eef8fd" stroke="#24506b" stroke-width="4"/>
    <g class="layers"></g>
    ${marks}
    <text x="${(x0 + x1) / 2}" y="${top - 6}" text-anchor="middle" font-size="22" font-weight="800" fill="#24506b">1 L</text>
  </svg>`);
  const layers = svg.querySelector(".layers");
  svg.setCount = (n) => {
    layers.innerHTML = "";
    for (let i = 0; i < n; i++) {
      const yy = bottom - ((i + 1) / 10) * H;
      layers.insertAdjacentHTML("beforeend",
        `<rect x="${x0 + 2}" y="${yy}" width="${x1 - x0 - 4}" height="${H / 10}" fill="${i % 2 ? "#6cc3ee" : "#4fb3e8"}" opacity=".9"/>` +
        `<text x="${x0 + 12}" y="${yy + H / 20 + 6}" font-size="14" font-weight="700" fill="#fff">${(i + 1) * 100} mL</text>`);
    }
  };
  svg.setCount(count);
  return svg;
}

// ── 평화의 다리 ── done: 마을 id → true
export function bridgeSVG(villages, done = {}) {
  const n = villages.length;
  const span = 520 / n;
  let planks = "";
  villages.forEach((v, i) => {
    const x = 140 + i * span;
    const ok = !!done[v.id];
    planks += `<g class="plank ${ok ? "on" : ""}">
      <rect x="${x + 3}" y="120" width="${span - 6}" height="34" rx="6"
        fill="${ok ? v.color : "rgba(255,255,255,.35)"}" stroke="${ok ? "#5a3b1c" : "#9a7b55"}" stroke-width="3" ${ok ? "" : 'stroke-dasharray="7 6"'}/>
      ${ok ? `<image href="${v.img}" x="${x + span / 2 - 19}" y="116" width="38" height="38"/>` : `<text x="${x + span / 2}" y="145" text-anchor="middle" font-size="22" fill="#9a7b55">?</text>`}
    </g>`;
  });
  return svgEl(`
  <svg class="bridge" viewBox="0 30 800 230" role="img" aria-label="평화의 다리">
    <rect x="0" y="0" width="800" height="260" fill="none"/>
    <path d="M0,130 L140,130 L150,260 L0,260 Z" fill="#e0b273" stroke="#9a6a35" stroke-width="3"/>
    <path d="M800,130 L660,130 L650,260 L800,260 Z" fill="#e0b273" stroke="#9a6a35" stroke-width="3"/>
    <path d="M150,220 Q400,250 650,220 L650,260 L150,260 Z" fill="#4fb3e8" opacity=".7"/>
    <path d="M140,118 Q400,40 660,118" fill="none" stroke="#7a4a22" stroke-width="4" stroke-dasharray="2 0"/>
    ${planks}
    <text x="70" y="115" text-anchor="middle" font-size="40">🏘️</text>
    <text x="730" y="115" text-anchor="middle" font-size="40">🏺</text>
  </svg>`);
}

// ── 활동1 붓기 장면: 컵이 항아리 입구 위로 이동 → 기울어지며 물줄기 → 항아리 수위 상승 ──
// 컵 안 물의 윗면은 컵이 기울어도 수평을 유지하고, 붓는 동안 줄어든다.
export function pourSceneSVG(village, jarML, poured = 0) {
  const id = "ps" + uid++;
  const GROUND = 335, JX = 200, JY = 105;               // 항아리 위치(항아리 원본 좌표 200×240)
  const H = 150 * Math.cbrt(village.cup / jarML);        // 컵 높이: 들이에 따라 (부피 ∝ 길이³)
  const W = H * 0.85, WB = W * 0.66, inset = (W - WB) / 2;
  const cupPts = [[0, 0], [-W, 0], [-W + inset, H], [-inset, H]]; // 기준점 = 컵 오른쪽 위 모서리(따르는 입구)
  const REST = { x: 95 + W / 2, y: GROUND - H };
  const POUR = { x: 284, y: 100 };
  const MAX_TILT = 100, DEPTH = H * 0.78;
  const JH = JAR_BOTTOM - JAR_TOP;
  const lv0 = Math.min(1, poured / jarML);
  const poly = cupPts.map((p) => p.join(",")).join(" ");

  const svg = svgEl(`
  <svg class="pour-scene" viewBox="0 0 420 350" role="img" aria-label="${village.cupName}으로 마법 항아리에 물 붓기">
    <defs>
      <clipPath id="${id}j"><path d="${JAR_PATH}"/></clipPath>
      <clipPath id="${id}c"><polygon points="${poly}"/></clipPath>
      <linearGradient id="${id}g" x1="0" x2="1"><stop offset="0" stop-color="#d98c4a"/><stop offset=".5" stop-color="#f0b37a"/><stop offset="1" stop-color="#c0743a"/></linearGradient>
      <linearGradient id="${id}w" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#7fd0f5"/><stop offset="1" stop-color="#3aa2dc"/></linearGradient>
    </defs>
    <ellipse cx="300" cy="${GROUND + 2}" rx="92" ry="9" fill="rgba(110,66,18,.18)"/>
    <ellipse class="cup-shadow" cx="${REST.x - W / 2}" cy="${GROUND + 2}" rx="${W * 0.5}" ry="5" fill="rgba(110,66,18,.18)"/>
    <path class="stream" d="M${POUR.x},${POUR.y} Q${POUR.x + 13},${POUR.y + 3} ${POUR.x + 15},${JY + 40}" stroke="#4fb3e8" stroke-width="7" stroke-linecap="round" fill="none" opacity="0"/>
    <g transform="translate(${JX},${JY})">
      <path d="${JAR_PATH}" fill="url(#${id}g)"/>
      <g clip-path="url(#${id}j)">
        <rect class="jar-water" x="0" y="${JAR_TOP}" width="200" height="${JH + 4}" fill="url(#${id}w)" opacity=".95"
          style="transform: translateY(${(1 - lv0) * JH}px); transition: transform .8s ease-out"/>
        <path d="M20,140 Q60,120 100,150 T180,130" stroke="#fff" stroke-opacity=".25" stroke-width="10" fill="none"/>
      </g>
      <path d="${JAR_PATH}" fill="none" stroke="#7a4a22" stroke-width="4"/>
      <ellipse cx="100" cy="22" rx="30" ry="6" fill="#a8622c" stroke="#7a4a22" stroke-width="3"/>
    </g>
    <g class="cup-g" transform="translate(${REST.x},${REST.y})">
      <g clip-path="url(#${id}c)">
        <rect class="cup-water" x="-400" y="${H - DEPTH}" width="800" height="800" fill="url(#${id}w)"/>
      </g>
      <polygon points="${poly}" fill="rgba(255,255,255,.35)" stroke="${village.color}" stroke-width="5" stroke-linejoin="round"/>
      <image href="${village.img}" x="${-W / 2 - H * 0.2}" y="${H * 0.42}" width="${H * 0.4}" height="${H * 0.4}"/>
    </g>
  </svg>`);

  const cupG = svg.querySelector(".cup-g");
  const cupWater = svg.querySelector(".cup-water");
  const stream = svg.querySelector(".stream");
  const jarWater = svg.querySelector(".jar-water");
  const shadow = svg.querySelector(".cup-shadow");
  const rad = (d) => (d * Math.PI) / 180;

  function setPose(x, y, deg, fill) {
    cupG.setAttribute("transform", `translate(${x},${y}) rotate(${deg})`);
    const s = Math.sin(rad(deg)), c = Math.cos(rad(deg));
    const ymax = Math.max(...cupPts.map(([px, py]) => px * s + py * c)); // 화면 기준 가장 낮은 곳
    const ys = Math.max(0, ymax - fill * DEPTH);                          // 물 윗면(입구보다 높아지면 넘쳐 흐름)
    cupWater.setAttribute("y", ys);
    cupWater.setAttribute("transform", `rotate(${-deg})`);               // 물 윗면은 항상 수평
    shadow.setAttribute("opacity", y >= REST.y - 1 ? 1 : 0.3);
  }
  setPose(REST.x, REST.y, 0, 1);

  svg.setLevel = (lv) => { jarWater.style.transform = `translateY(${(1 - Math.min(1, Math.max(0, lv))) * JH}px)`; };

  const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
  const lerp = (a, b, t) => a + (b - a) * t;
  const clamp01 = (t) => Math.max(0, Math.min(1, t));
  const reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;

  // 한 컵 붓기. nextLevel: 부은 뒤 항아리 수위(0~1)
  svg.pour = (nextLevel) => new Promise((resolve) => {
    if (reduce) { svg.setLevel(nextLevel); resolve(); return; }
    const T = 1800, t0 = performance.now();
    let leveled = false;
    const frame = (now) => {
      const t = now - t0;
      let x, y, deg, fill = 1;
      if (t < 500) {                       // 들어 올려 입구 위로
        const k = ease(clamp01(t / 500));
        x = lerp(REST.x, POUR.x, k); y = lerp(REST.y, POUR.y, k) - Math.sin(k * Math.PI) * 30; deg = 15 * k;
      } else if (t < 1300) {               // 기울여 붓기
        const k = ease(clamp01((t - 500) / 350));
        x = POUR.x; y = POUR.y; deg = lerp(15, MAX_TILT, k);
        fill = 1 - clamp01((t - 700) / 550);
      } else {                             // 제자리로
        const k = ease(clamp01((t - 1300) / 500));
        x = lerp(POUR.x, REST.x, k); y = lerp(POUR.y, REST.y, k) - Math.sin(k * Math.PI) * 30; deg = lerp(MAX_TILT, 0, k);
        fill = clamp01((t - 1650) / 150);  // 다음 컵을 떠 와요
      }
      const streaming = t > 680 && t < 1260;
      stream.setAttribute("opacity", streaming ? 1 : 0);
      stream.setAttribute("stroke-width", streaming ? 4 + 4 * Math.min(1, (1260 - t) / 300) : 0);
      if (t > 700 && !leveled) { leveled = true; svg.setLevel(nextLevel); }
      setPose(x, y, deg, fill);
      if (t < T) requestAnimationFrame(frame);
      else { setPose(REST.x, REST.y, 0, 1); resolve(); }
    };
    requestAnimationFrame(frame);
  });
  return svg;
}
