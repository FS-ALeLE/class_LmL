// 활동2 — 각인 미션 전에 선생님과 함께 배우는 화면 (교사 화면·학생 화면 공용)
import { h, speakBtn } from "./util.js";
import { literBoxSVG } from "./art.js";

export const A2_MISSIONS = [
  { mark: "L", name: "L 각인", task: "리터를 읽고 따라 쓰기" },
  { mark: "mL", name: "mL 각인", task: "밀리리터를 읽고 따라 쓰기" },
  { mark: "1000", name: "천 개의 물방울", task: "100 mL씩 부어 1 L 그릇 채우기" },
  { mark: "장부", name: "마을 장부", task: "들이를 바꾸어 나타내고 읽고 쓰기" },
];

// 활동2 교사 진행 단계: 0 L 배우기, 1 L 미션, 2 mL 배우기, 3 mL 미션, … 7 장부 미션
export const A2_STEPS = A2_MISSIONS.flatMap((m) => [
  { kind: "learn", label: `${m.mark} 배우기` },
  { kind: "mission", label: `${m.mark} 미션` },
]);
export const missionsOpen = (step) => Math.floor(((step ?? 0) + 1) / 2);

const LESSONS = [
  {
    title: "들이의 단위 ‘리터’",
    big: "1 L", read: "1 리터",
    points: [
      "들이를 나타내는 단위에는 ‘리터’가 있어요.",
      "1 리터는 1 L라고 써요. L는 크게(대문자) 써요.",
      "수를 먼저 쓰고, 한 칸 띄운 뒤 단위를 써요.",
    ],
    examples: [["2 L", "2 리터"], ["5 L", "5 리터"]],
    life: "큰 우유갑, 큰 주스병에 1 L가 담겨 있어요.",
  },
  {
    title: "더 작은 단위 ‘밀리리터’",
    big: "1 mL", read: "1 밀리리터",
    points: [
      "L보다 작은 들이를 나타낼 때는 ‘밀리리터’를 써요.",
      "1 밀리리터는 1 mL라고 써요. m은 작게, L은 크게!",
      "바르게 쓰기: 3 L (○)   L 3 (✕)   3 l (✕)",
    ],
    examples: [["200 mL", "200 밀리리터"], ["65 mL", "65 밀리리터"]],
    life: "작은 우유는 200 mL, 요구르트는 65 mL쯤이에요.",
  },
  {
    title: "1 L는 몇 mL일까?",
    interactive: true,
    points: ["100 mL 컵으로 1 L 그릇을 가득 채워 보며 다 함께 세어 봐요.", "100, 200, 300, …"],
  },
  {
    title: "들이를 두 가지로 나타내기",
    rows: [
      ["1 L 400 mL", "1000 mL + 400 mL", "1400 mL"],
      ["3200 mL", "3000 mL + 200 mL", "3 L 200 mL"],
    ],
    points: [
      "1 L = 1000 mL를 이용해서 바꾸어요.",
      "‘□ L □ mL’의 mL 자리에는 1000보다 작은 수만 써요.",
      "읽기: 2 L 600 mL → 2 리터 600 밀리리터",
    ],
  },
];

// k: 미션 번호(0~3), opts.teacher: 교사 화면용(크게, 붓기 버튼), opts.state: 교사용 붓기 횟수 저장 객체
export function lessonView(k, { teacher = false, state = {} } = {}) {
  const L = LESSONS[k];
  const m = A2_MISSIONS[k];
  const head = h("div.lesson-head",
    h("span.lesson-tag", teacher ? `${m.name} 배우기` : "👀 선생님과 함께 배워요"),
    h("h2", L.title, speakBtn([L.title, ...L.points].join(" "))));
  let body;
  if (L.interactive) {
    const n = state.pour || 0;
    const box = literBoxSVG(n);
    const done = n >= 10;
    body = h("div.lesson-body",
      h("div.lesson-visual", h("div.small-cup", "🥛", h("span.label", "100 mL")), box),
      h("div.lesson-text",
        L.points.map((p) => h("p.lesson-point", p)),
        teacher
          ? h("div",
              h("p.lesson-count", n ? `100 mL × ${n}번 = ${n * 100} mL` : "‘100 mL 붓기’를 누르며 함께 세어요."),
              done ? h("div.stamp", "1 L = 1000 mL") : null,
              h("div.row",
                h("button.btn.primary.big", { type: "button", disabled: done, onclick: () => { state.pour = n + 1; state.rerender?.(); } }, "🥛 100 mL 붓기"),
                h("button.btn.small", { type: "button", onclick: () => { state.pour = 0; state.rerender?.(); } }, "↺ 다시")))
          : h("p.lesson-count", "선생님 화면을 보며 같이 세어 보세요!")));
  } else if (L.rows) {
    body = h("div.lesson-body.col",
      h("div.convert", L.rows.map(([a, mid, b]) => h("div.convert-row",
        h("b", a), h("span.eq", "="), h("span.mid", mid), h("span.eq", "="), h("b.to", b)))),
      h("div.lesson-text", L.points.map((p) => h("p.lesson-point", p))));
  } else {
    body = h("div.lesson-body",
      h("div.lesson-unit", h("div.unit-big", L.big), h("div.read-as", "읽기: ", h("b", L.read), speakBtn(L.read))),
      h("div.lesson-text",
        L.points.map((p) => h("p.lesson-point", p)),
        h("div.lesson-examples", L.examples.map(([a, b]) => h("span.ex", h("b", a), " → ", b))),
        h("p.lesson-life", "🏠 ", L.life)));
  }
  return h(`div.panel.lesson${teacher ? ".big" : ""}`, head, body);
}
