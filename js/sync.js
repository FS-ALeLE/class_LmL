// 실시간 동기화 계층
//  - firebase : 실제 수업용 (기본값)
//  - local    : 같은 브라우저의 여러 탭끼리 동기화 (?mode=local, 연습·시연용)
//  - null     : 수동 모드 (?mode=manual 또는 연결 실패 시)
import { FIREBASE_CONFIG } from "./config.js";

const FB_VER = "10.12.2";

export async function createSync() {
  const mode = new URLSearchParams(location.search).get("mode");
  if (mode === "manual") return null;
  if (mode === "local") return localSync();
  try {
    return await withTimeout(firebaseSync(), 9000);
  } catch (e) {
    console.warn("[sync] Firebase 연결 실패 → 수동 모드", e);
    return null;
  }
}

function withTimeout(p, ms) {
  return Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error("timeout")), ms))]);
}

async function firebaseSync() {
  const appMod = await import(`https://www.gstatic.com/firebasejs/${FB_VER}/firebase-app.js`);
  const db = await import(`https://www.gstatic.com/firebasejs/${FB_VER}/firebase-database.js`);
  const app = appMod.initializeApp(FIREBASE_CONFIG);
  const database = db.getDatabase(app);
  const r = (p) => db.ref(database, p);

  await new Promise((res) => {
    const off = db.onValue(r(".info/connected"), (s) => {
      if (s.val() === true) { off(); res(); }
    });
  });

  return {
    kind: "firebase",
    get: async (p) => (await db.get(r(p))).val(),
    set: (p, v) => db.set(r(p), v),
    update: (p, v) => db.update(r(p), v),
    remove: (p) => db.remove(r(p)),
    on: (p, cb) => db.onValue(r(p), (s) => cb(s.val())),
    onDisconnectSet: (p, v) => db.onDisconnect(r(p)).set(v),
    onConnection: (cb) => db.onValue(r(".info/connected"), (s) => cb(!!s.val())),
    now: () => Date.now(),
    // 하루 지난 방 정리 (보안 규칙이 이 형태의 조회만 허용)
    cleanupOld: async () => {
      const q = db.query(r("rooms"), db.orderByChild("createdAt"), db.limitToFirst(20));
      const snap = await db.get(q);
      const limit = Date.now() - 24 * 3600 * 1000;
      const jobs = [];
      snap.forEach((c) => {
        const v = c.val();
        if (!v || !v.createdAt || v.createdAt < limit) jobs.push(db.remove(c.ref));
      });
      await Promise.all(jobs);
    },
  };
}

// ── 로컬(탭 간) 동기화: localStorage + BroadcastChannel ──
function localSync() {
  const KEY = "deuli-local-db";
  const ch = new BroadcastChannel("deuli-local");
  const listeners = new Set();
  const load = () => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; } };
  const save = (t) => localStorage.setItem(KEY, JSON.stringify(t));
  const parts = (p) => p.split("/").filter(Boolean);
  const getAt = (t, p) => parts(p).reduce((o, k) => (o == null ? undefined : o[k]), t);
  const setAt = (t, p, v) => {
    const ks = parts(p); let o = t;
    ks.slice(0, -1).forEach((k) => { if (typeof o[k] !== "object" || o[k] === null) o[k] = {}; o = o[k]; });
    if (v === null || v === undefined) delete o[ks[ks.length - 1]];
    else o[ks[ks.length - 1]] = JSON.parse(JSON.stringify(v));
  };
  const fire = () => listeners.forEach((l) => l());
  ch.onmessage = fire;
  const changed = (t) => { save(t); ch.postMessage(1); setTimeout(fire, 0); };

  return {
    kind: "local",
    get: async (p) => getAt(load(), p) ?? null,
    set: async (p, v) => { const t = load(); setAt(t, p, v); changed(t); },
    update: async (p, obj) => { const t = load(); Object.entries(obj).forEach(([k, v]) => setAt(t, `${p}/${k}`, v)); changed(t); },
    remove: async (p) => { const t = load(); setAt(t, p, null); changed(t); },
    on: (p, cb) => {
      let last;
      const l = () => { const v = getAt(load(), p) ?? null; const s = JSON.stringify(v); if (s !== last) { last = s; cb(v); } };
      listeners.add(l); setTimeout(l, 0);
      return () => listeners.delete(l);
    },
    onDisconnectSet: () => {},
    onConnection: (cb) => { setTimeout(() => cb(true), 0); return () => {}; },
    now: () => Date.now(),
    cleanupOld: async () => {},
  };
}
