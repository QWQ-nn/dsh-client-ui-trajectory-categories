// Smoke test for dsh-client-ui-trajectory-categories/lib/client.js
// Loads the bundle with a stubbed window.__ModuleLoader__, calls the factory
// with the REAL React, runs apply(ctx), and server-renders the view with
// realistic trajectory snapshot data (plus the empty case).
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const react = require("C:/Users/Administrator/.dsh/profiles/node_modules/react/index.js");
const server = require("C:/Users/Administrator/.dsh/profiles/node_modules/react-dom/server.js");

const src = readFileSync("G:/deepseekharness/dsh-client-ui-trajectory-categories/lib/client.js", "utf8");

let loaded = null;
const win = { __ModuleLoader__: { load: (o) => { loaded = o; } } };
const requireStub = (spec) => {
  if (spec === "react") return react;
  throw new Error("unexpected require: " + spec);
};
new Function("window", "require", src)(win, requireStub);
if (!loaded) throw new Error("bundle did not register via __ModuleLoader__.load");
if (loaded.id !== "dsh-client-ui-trajectory-categories") throw new Error("bad id: " + loaded.id);

const mod = loaded.factory(requireStub);
if (typeof mod.apply !== "function") throw new Error("no apply export");
if (!Array.isArray(mod.inject)) throw new Error("no inject export");
console.log("exports OK, inject =", JSON.stringify(mod.inject));

// ── apply(ctx) path ────────────────────────────────────────────────────
const dicts = new Map();
let slotInjected = null;
let registered = null;
const makeSlots = () => ({
  inject: (key, cb) => { slotInjected = { key, cb }; return () => {}; },
  register: (options, component) => { registered = { options, component }; return () => {}; }
});
const ctx = {
  effect: (fn) => { fn(); return () => {}; },
  locale: {
    register: (ns, d) => { dicts.set(ns, d); },
    bind: (ns) => (key, params) => {
      const d = dicts.get(ns) || {};
      const v = d[key] ?? key;
      if (params && typeof v === "string") return v.replace(/\{(\w+)\}/g, (_, k) => String(params[k] ?? ""));
      return v;
    }
  },
  slots: makeSlots(),
  sessions: {
    binding: () => ({ session: { getSnapshot: () => ({ views: new Map() }), loadOlder: async () => {} } })
  }
};
mod.apply(ctx);
if (!slotInjected || slotInjected.key !== "conversation.view") throw new Error("slot injection missing");
const dispose = slotInjected.cb();
if (typeof dispose !== "function") throw new Error("slots.register did not return a disposer");
if (!registered || registered.options.id !== "trajectory-categories") throw new Error("bad registration: " + JSON.stringify(registered && registered.options));
if (typeof registered.component !== "function") throw new Error("no component in registration");
// dispose again should be safe
dispose();
console.log("apply(ctx) OK; registered id =", registered.options.id);

// ── render path with realistic data ────────────────────────────────────
const now = Date.now();
const inspection = {
  eventNodes: [
    { kind: "user", seq: 1, time: now - 9000, content: "请优化一下日志模块" },
    { kind: "context", seq: 2, time: now - 8500, content: [{ type: "text", text: "上下文注入" }] },
    { kind: "steering", seq: 3, time: now - 8000, content: "换个方式做" },
    { kind: "assistant", seq: 4, time: now - 7800, turn: 1, step: 1, blocks: [{ kind: "text", text: "好的，我先读取现有代码。" }] },
    { kind: "tool-result", seq: 5, time: now - 7600, callId: "c1", call: { name: "read", argsRaw: '{"file_path":"src/logger.js"}' }, content: [{ type: "text", text: "export function log(msg){ console.log(msg) }" }], isError: false },
    { kind: "tool-result", seq: 6, time: now - 7400, callId: "c2", call: { name: "edit", argsRaw: '{"file_path":"src/logger.js","old_string":"a","new_string":"b"}' }, content: [{ type: "text", text: "文件已更新" }], isError: false },
    { kind: "tool-result", seq: 7, time: now - 7200, callId: "c3", call: { name: "pwsh", argsRaw: '{"command":"npm test"}' }, content: [{ type: "text", text: "PASS 3 tests" }], isError: false },
    { kind: "tool-result", seq: 8, time: now - 7000, callId: "c4", call: { name: "subagent", argsRaw: '{"description":"review code"}' }, content: [{ type: "text", text: "review done" }], isError: false },
    { kind: "tool-result", seq: 9, time: now - 6800, callId: "c5", call: { name: "web_search", argsRaw: '{"query":"dsh plugin"}' }, content: [{ type: "text", text: "no results" }], isError: true, error: { code: "timeout" } },
    { kind: "tool-result", seq: 10, time: now - 6600, callId: "c6", call: { name: "download", argsRaw: '{"url":"https://example.com/x.zip"}' }, content: [{ type: "text", text: "saved to x.zip" }], isError: false },
    { kind: "tool-result", seq: 11, time: now - 6400, callId: "c7", call: { name: "str_replace_editor", argsRaw: '{"file_path":"a.txt","old_string":"x","new_string":"y"}' }, content: [], isError: false },
    { kind: "tool-result", seq: 12, time: now - 6200, callId: "c8", call: { name: "写入文件", argsRaw: '{"file_path":"中文文档.txt","content":"内容"}' }, content: [{ type: "text", text: "已写入" }], isError: false }
  ],
  eventLocations: new Map([
    [1, { kind: "turn", turn: { turn: 1 } }],
    [4, { kind: "step", turn: { turn: 1 }, step: { step: 1 } }],
    [5, { kind: "step", turn: { turn: 1 }, step: { step: 1 } }],
    [6, { kind: "step", turn: { turn: 1 }, step: { step: 1 } }]
  ]),
  requests: [{ purpose: "compaction", startSeq: 100, turn: 1, step: 0, status: "complete", startedAt: now - 3000, completedAt: now - 2900, summary: "前 100 条已压缩" }],
  runningCalls: [{ callId: "r1", name: "write", argsRaw: '{"file_path":"a.txt","content":"..."}', turn: 2, step: 1, time: now - 1000 }]
};

function fakeProps(snapshot) {
  return {
    useSession: (sel) => sel(snapshot),
    t: (k) => k,
    loadOlder: async () => false,
    inspect: null,
    onInspectDone: () => {}
  };
}

const snapshotWithData = {
  views: new Map([["trajectory", inspection]]),
  hasMore: true,
  loadingOlder: false
};
const html = server.renderToString(react.createElement(getComponent(), fakeProps(snapshotWithData)));
if (!html.includes("分类")) throw new Error("rendered html missing tab label");
if (!html.includes("写入")) throw new Error("rendered html missing Chinese category chips");
if (!html.includes("读取")) throw new Error("rendered html missing Chinese read chip");
console.log("render(data) OK, html length =", html.length);

// empty case
const htmlEmpty = server.renderToString(react.createElement(getComponent(), fakeProps({ views: new Map(), hasMore: false, loadingOlder: false })));
console.log("render(empty) OK, html length =", htmlEmpty.length);

// expanded-detail path: force initial state to open "write" and expand entry "tool:5"
const expandedSrc = src
  .replace("useState(function () { return ({}); })", "useState(function () { return ({ read: true }); })")
  .replace("var expandedState = useState(null);", "var expandedState = useState(\"tool:5\");");
let expandedLoaded = null;
const expandedWin = { __ModuleLoader__: { load: (o) => { expandedLoaded = o; } } };
new Function("window", "require", expandedSrc)(expandedWin, requireStub);
const expandedMod = expandedLoaded.factory(requireStub);
const htmlExpanded = server.renderToString(react.createElement(getComponentOf(expandedMod), fakeProps(snapshotWithData)));
if (!htmlExpanded.includes("tool:5")) throw new Error("expanded detail missing entry");
if (!htmlExpanded.includes("参数")) throw new Error("expanded detail missing args label");
if (!htmlExpanded.includes("file_path")) throw new Error("expanded detail missing args payload");
if (!htmlExpanded.includes("结果")) throw new Error("expanded detail missing result label");
if (!htmlExpanded.includes("export function log")) throw new Error("expanded detail missing result payload");
console.log("render(expanded) OK, html length =", htmlExpanded.length);

// Chinese tool-name classification: a tool literally named 写入文件 must land
// in the write group and render when the write category is opened.
const zhSrc = src.replace("useState(function () { return ({}); })", "useState(function () { return ({ write: true }); })");
let zhLoaded = null;
const zhWin = { __ModuleLoader__: { load: (o) => { zhLoaded = o; } } };
new Function("window", "require", zhSrc)(zhWin, requireStub);
const zhMod = zhLoaded.factory(requireStub);
const htmlZh = server.renderToString(react.createElement(getComponentOf(zhMod), fakeProps(snapshotWithData)));
if (!htmlZh.includes("写入文件")) throw new Error("Chinese tool name 写入文件 not classified into write group");
if (!htmlZh.includes("中文文档.txt")) throw new Error("Chinese args preview missing file_path");
console.log("render(zh-tool) OK, html length =", htmlZh.length);

console.log("ALL SMOKE TESTS PASSED");

function getComponent() {
  // Re-run apply to capture the registered component.
  const dicts2 = new Map();
  let comp = null;
  const ctx2 = {
    effect: (fn) => { fn(); return () => {}; },
    locale: {
      register: (ns, d) => { dicts2.set(ns, d); },
      bind: (ns) => (key) => (dicts2.get(ns) || {})[key] ?? key
    },
    slots: {
      inject: (key, cb) => { cb(); return () => {}; },
      register: (options, component) => { comp = component; return () => {}; }
    },
    sessions: { binding: () => ({ session: { getSnapshot: () => ({ views: new Map() }), loadOlder: async () => {} } }) }
  };
  mod.apply(ctx2);
  if (!comp) throw new Error("no component registered");
  return comp;
}

function getComponentOf(mod) {
  const dicts3 = new Map();
  let comp = null;
  const ctx3 = {
    effect: (fn) => { fn(); return () => {}; },
    locale: {
      register: (ns, d) => { dicts3.set(ns, d); },
      bind: (ns) => (key) => (dicts3.get(ns) || {})[key] ?? key
    },
    slots: {
      inject: (key, cb) => { cb(); return () => {}; },
      register: (options, component) => { comp = component; return () => {}; }
    },
    sessions: { binding: () => ({ session: { getSnapshot: () => ({ views: new Map() }), loadOlder: async () => {} } }) }
  };
  mod.apply(ctx3);
  if (!comp) throw new Error("no component registered");
  return comp;
}
