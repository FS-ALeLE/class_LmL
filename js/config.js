// ─────────────────────────────────────────────
//  들이 수업 앱 설정
//  (문구·문제를 바꾸고 싶으면 이 파일만 고치면 됩니다)
// ─────────────────────────────────────────────

// Firebase 웹 설정값은 공개되어도 괜찮은 값입니다.
// 실제 보호는 Firebase 콘솔의 Realtime Database 보안 규칙(database.rules.json)이 담당합니다.
export const FIREBASE_CONFIG = {
  apiKey: "AIzaSyDFpd-gXXVR8LaE_KRTeRuwyJGj2tYFZtU",
  authDomain: "class-lml.firebaseapp.com",
  databaseURL: "https://class-lml-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "class-lml",
  storageBucket: "class-lml.firebasestorage.app",
  messagingSenderId: "336174924238",
  appId: "1:336174924238:web:49979e31c2e1030bf1ab9f",
};

// 마법 항아리의 들이 (mL) — 1 L 200 mL
export const JAR_ML = 1200;

// 여섯 마을. cup = 그 마을 컵의 들이(mL). 항아리를 나누면 모두 자연수가 되도록 정했습니다.
// 1200 ÷ 200 = 6, ÷300 = 4, ÷150 = 8, ÷400 = 3, ÷240 = 5, ÷100 = 12
export const VILLAGES = [
  { id: 1, img: "assets/img/village1.webp", name: "해바라기 마을", emoji: "🌻", color: "#f2b705", cup: 200, cupName: "해바라기 컵" },
  { id: 2, img: "assets/img/village2.webp", name: "선인장 마을",   emoji: "🌵", color: "#4caf50", cup: 300, cupName: "선인장 컵" },
  { id: 3, img: "assets/img/village3.webp", name: "낙타 마을",     emoji: "🐪", color: "#c47f3c", cup: 150, cupName: "낙타 컵" },
  { id: 4, img: "assets/img/village4.webp", name: "별빛 마을",     emoji: "⭐", color: "#7e57c2", cup: 400, cupName: "별빛 컵" },
  { id: 5, img: "assets/img/village5.webp", name: "야자수 마을",   emoji: "🌴", color: "#00897b", cup: 240, cupName: "야자수 컵" },
  { id: 6, img: "assets/img/village6.webp", name: "조개 마을",     emoji: "🐚", color: "#e57373", cup: 100, cupName: "조개 컵" },
];

// 수업 단계 (교사 화면이 이 순서로 진행)
export const STAGES = [
  { key: "lobby", label: "입장",          short: "입장" },
  { key: "story", label: "이야기 시작",   short: "이야기" },
  { key: "goal",  label: "학습 문제",     short: "학습 문제" },
  { key: "a1",    label: "활동1 물 거래 대소동", short: "활동1" },
  { key: "a2",    label: "활동2 단위의 탄생",   short: "활동2" },
  { key: "a3",    label: "활동3 평화의 눈금",   short: "활동3" },
  { key: "wrap",  label: "정리 평화의 다리",    short: "정리" },
];

// 도입 이야기 (교사 화면 슬라이드 + 학생 화면 동일)
// 왜 '항아리 하나만큼'인가: 항아리는 하루에 딱 한 번 가득 차고, 마을들이 차례로 한 항아리씩 가져간다.
export const STORY = [
  {
    title: "사막의 마법 항아리",
    text: "뜨거운 사막 한가운데 오아시스가 있어요. 오아시스의 마법 항아리는 매일 아침 해가 뜨면 반짝이며 물이 가득 차올라요. 하지만 하루에 딱 한 번, 딱 한 항아리만큼만 차오른답니다.",
    art: "🏜️🏺💧", img: "assets/img/story1.webp",
  },
  {
    title: "여섯 마을의 약속",
    text: "물이 귀한 사막의 여섯 마을이 모여 약속했어요. \"하루에 한 마을씩 차례대로, 항아리 하나 가득 물을 가져가자! 그러면 모두 똑같이 나누어 쓸 수 있어!\"",
    art: "🌻🌵🐪⭐🌴🐚", img: "assets/img/story2.webp",
  },
  {
    title: "그런데 큰일이 났어요!",
    text: "마을마다 자기 마을 컵으로 받은 물을 세어 보았더니 말이 서로 달라요. \"우리 마을은 몇 컵밖에 못 받았어!\" \"다른 마을은 훨씬 많이 가져갔대!\" \"불공평해!\"",
    art: "😠💬😤", img: "assets/img/story3.webp",
  },
  {
    title: "오늘의 미션",
    text: "정말 어떤 마을이 물을 더 많이 가져간 걸까요? 물의 양을 누구나 똑같이 말할 수 있는 방법을 찾아, 여섯 마을 사이에 평화의 다리를 놓아 주세요!",
    art: "🌉✨", img: "assets/img/story4.webp",
  },
];

// 오늘의 활동 안내 (학습 문제 화면)
export const ACTIVITIES = [
  { no: "활동1", name: "물 거래 대소동", desc: "우리 마을 컵으로 마법 항아리를 재어 보아요." },
  { no: "활동2", name: "단위의 탄생", desc: "L와 mL를 쓰고 읽고, 1 L가 몇 mL인지 알아보아요." },
  { no: "활동3", name: "평화의 눈금", desc: "눈금을 읽어 마법 항아리의 들이를 재어 보아요." },
];

// 학습 문제
export const LESSON_GOAL = "들이의 단위 L와 mL를 알고, 들이를 바르게 쓰고 읽어 봅시다.";

// 활동2 — 장부 맞추기(같은 들이 짝)
export const MATCH_PAIRS = [
  { a: "1 L 300 mL", b: "1300 mL" },
  { a: "1 L 30 mL",  b: "1030 mL" },
  { a: "2 L 500 mL", b: "2500 mL" },
  { a: "3 L",        b: "3000 mL" },
];

// 활동3 — 눈금 읽기 단계
// max: 그릇 최대 눈금, tick: 작은 눈금 한 칸, label: 숫자가 쓰인 간격, value: 물의 높이
// ask: "ml" → mL만 / "both" → L·mL와 mL 둘 다
export const SCALE_LEVELS = [
  { title: "첫 번째 눈금", max: 1000, tick: 100, label: 100, value: 700,  ask: "ml",
    hint: "물의 윗면과 같은 높이에 있는 숫자를 읽어 보세요." },
  { title: "숨은 눈금",   max: 1000, tick: 100, label: 500, value: 300,  ask: "ml",
    hint: "숫자가 없는 작은 눈금 한 칸은 100 mL예요. 아래부터 한 칸씩 세어 보세요." },
  { title: "큰 계량컵",   max: 2000, tick: 100, label: 500, value: 1400, ask: "both",
    hint: "1 L(=1000 mL)를 지나서 작은 눈금이 몇 칸 더 올라갔나요? 한 칸은 100 mL예요." },
  { title: "마법 항아리의 비밀", max: 2000, tick: 100, label: 500, value: JAR_ML, ask: "both", final: true,
    hint: "1 L를 지나 작은 눈금 몇 칸만큼 더 있나요? 한 칸은 100 mL예요." },
];

// 정리 — 스스로 평가
export const SELF_CHECK = [
  "1 L는 1000 mL라는 것을 알아요.",
  "들이를 L와 mL로 쓰고 읽을 수 있어요.",
  "눈금을 보고 들이를 잴 수 있어요.",
];

// 그림 경로
export const IMG = {
  title: "assets/img/title_scene.webp",
  bridgeDone: "assets/img/bridge_done.webp",
  guide: {
    hello: "assets/img/guide_hello.webp",
    great: "assets/img/guide_great.webp",
    think: "assets/img/guide_think.webp",
    cheer: "assets/img/guide_cheer.webp",
  },
  badge: ["assets/img/badge1.webp", "assets/img/badge2.webp", "assets/img/badge3.webp", "assets/img/badge4.webp"],
};
