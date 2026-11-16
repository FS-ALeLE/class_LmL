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
