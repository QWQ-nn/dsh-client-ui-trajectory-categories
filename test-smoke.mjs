// Smoke test for dsh-client-ui-trajectory-categories/lib/client.js
// Loads the bundle with a stubbed window.__ModuleLoader__, calls the factory
// with the REAL React, runs apply(ctx), and server-renders the view with
// realistic trajectory snapshot data (plus the empty case).
// 相对路径：基于本文件位置解析包内 lib/ 与 node_modules（CI 可移植）。
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const react = require("react");
const server = require("react-dom/server");

const src = readFileSync(fileURLToPath(new URL("./lib/client.js", import.meta.url)), "utf8");

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
let slotInjected = null;
let registeredAll = [];
const ctx = {
  effect: (fn) => { fn(); return () => {}; },
  slots: {
    inject: (key, cb) => { slotInjected = { key, cb }; return () => {}; },
    register: (options, component) => { registeredAll.push({ options, component }); return () => {}; }
  },
  sessions: {
    binding: () => ({ session: { getSnapshot: () => ({ views: new Map() }), loadOlder: async () => {} } })
  }
};
mod.apply(ctx);
if (!slotInjected || slotInjected.key !== "conversation.view") throw new Error("slot injection missing");
const dispose = slotInjected.cb();
if (typeof dispose !== "function") throw new Error("apply should return one disposer");
const ids = registeredAll.map((r) => r.options.id);
if (JSON.stringify(ids) !== JSON.stringify(["trajectory-categories"])) throw new Error("bad registrations: " + JSON.stringify(ids));
if (typeof registeredAll[0].component !== "function") throw new Error("no component in registration");
dispose();
console.log("apply(ctx) OK; registered ids =", JSON.stringify(ids));

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
    { kind: "tool-result", seq: 12, time: now - 6200, callId: "c8", call: { name: "写入文件", argsRaw: '{"file_path":"中文文档.txt","content":"内容"}' }, content: [{ type: "text", text: "已写入" }], isError: false },
    { kind: "tool-result", seq: 13, time: now - 6000, callId: "c9", call: { name: "删除文件", argsRaw: '{"file_path":"tmp/old.log"}' }, content: [{ type: "text", text: "已删除" }], isError: false }
  ],
  eventLocations: new Map([
    [1, { kind: "turn", turn: { turn: 1 } }],
    [4, { kind: "step", turn: { turn: 1 }, step: { step: 1 } }],
    [5, { kind: "step", turn: { turn: 1 }, step: { step: 1 } }]
  ]),
  requests: [{ purpose: "compaction", startSeq: 100, turn: 1, step: 0, status: "complete", startedAt: now - 3000, completedAt: now - 2900, summary: "前 100 条已压缩" }],
  runningCalls: [{ callId: "r1", name: "write", argsRaw: '{"file_path":"a.txt","content":"..."}', turn: 2, step: 1, time: now - 1000 }]
};

function fakeProps(snapshot) {
  return {
    useSession: (sel) => sel(snapshot),
    loadOlder: async () => false
  };
}

const snapshotWithData = {
  views: new Map([["trajectory", inspection]]),
  hasMore: true,
  loadingOlder: false
};
const comp = getComponent();

const html = server.renderToString(react.createElement(comp, fakeProps(snapshotWithData)));
for (const needle of ["分类", "合计", "问题", "方案 1", "报错", "工作中", "完成", "删除", "起始", "现在", "100%", "左键拖动平移"]) {
  if (!html.includes(needle)) throw new Error("render missing: " + needle);
}
for (const needle of ["读取", "写入", "命令", "子代理", "搜索", "下载"]) {
  if (!html.includes(needle)) throw new Error("render missing action label: " + needle);
}
if (!html.includes("scale(1)")) throw new Error("canvas zoom transform missing");
if (!html.includes("热力图 · 排行榜")) throw new Error("render missing heatmap collapsible header");
if (!html.includes("点击展开")) throw new Error("heatmap should be collapsed by default");
console.log("render(data) OK, html length =", html.length);

// empty case
const htmlEmpty = server.renderToString(react.createElement(comp, fakeProps({ views: new Map(), hasMore: false, loadingOlder: false })));
console.log("render(empty) OK, html length =", htmlEmpty.length);

// missing eventLocations: buildModel must not crash (regression for PR #2 fix)
const noLocInspection = JSON.parse(JSON.stringify(inspection));
delete noLocInspection.eventLocations;
const htmlNoLoc = server.renderToString(react.createElement(comp, fakeProps({ views: new Map([["trajectory", noLocInspection]]), hasMore: false, loadingOlder: false })));
if (!htmlNoLoc.includes("分类")) throw new Error("render without eventLocations failed");
console.log("render(missing-eventLocations) OK, html length =", htmlNoLoc.length);

// step-detail expansion: force the web_search tool (in 方案 1) to be expanded
const stepSrc = src.replace(
  "var _st6 = useState(null);",
  "var _st6 = useState(\"p1:a1::tool:9\");"
);
const stepMod = getModuleOf(stepSrc);
const stepComp = getComponentOf(stepMod);
const htmlStep = server.renderToString(react.createElement(stepComp, fakeProps(snapshotWithData)));
if (!htmlStep.includes("调用详情")) throw new Error("step detail missing title");
if (!htmlStep.includes("timeout")) throw new Error("step detail missing error");
if (!htmlStep.includes("参数")) throw new Error("step detail missing args label");
if (!htmlStep.includes("做了什么")) throw new Error("step detail missing 做了什么 section");
if (!htmlStep.includes("输出 / 日志")) throw new Error("step detail missing 输出/日志 section");
console.log("render(step-expanded) OK, html length =", htmlStep.length);

// heatmap expanded: force heatOpen=true → heatmap body + ranking render
const heatSrc = src.replace(
  "var _st14 = useState(false);",
  "var _st14 = useState(true);"
);
const heatMod = getModuleOf(heatSrc);
const heatComp = getComponentOf(heatMod);
const htmlHeat = server.renderToString(react.createElement(heatComp, fakeProps(snapshotWithData)));
for (const heatNeedle of ["总览", "排行榜", "少", "多", "：合计"]) {
  if (!htmlHeat.includes(heatNeedle)) throw new Error("heatmap expanded missing: " + heatNeedle);
}
if (!htmlHeat.includes("点击收起")) throw new Error("heatmap expanded should show 点击收起");
console.log("render(heatmap-expanded) OK, html length =", htmlHeat.length);

// collapsed attempt: force openAttempts to hide 方案 2's tools
const collapseSrc = src.replace(
  "var _st5 = useState(function () { return ({}); });",
  "var _st5 = useState(function () { return ({ \"p1:a2\": false }); });"
);
const collapseMod = getModuleOf(collapseSrc);
const collapseComp = getComponentOf(collapseMod);
const htmlCollapsed = server.renderToString(react.createElement(collapseComp, fakeProps(snapshotWithData)));
// 折叠为条件渲染：方案 2 的工具块（str_replace_editor 等）不应出现在 DOM 中
if (htmlCollapsed.includes("str_replace_editor")) throw new Error("collapsed attempt still renders tools");
if (!html.includes("str_replace_editor")) throw new Error("default-open attempt missing tools");
console.log("render(attempt-collapsed) OK, html length =", htmlCollapsed.length);

// repulsion: force an active cursor near the problem node (position parsed from rendered html)
const posMatch = html.match(/data-dsh-node="p1"[^>]*style="[^"]*left:\s*(\d+)px[^"]*top:\s*(\d+)px/);
if (!posMatch) throw new Error("cannot find problem node position for repel test");
const repX = parseInt(posMatch[1], 10) + 40;
const repY = parseInt(posMatch[2], 10) + 20;
const repelSrc = src.replace(
  "var _st8 = useState(function () { return { x: -9999, y: -9999, active: false }; });",
  "var _st8 = useState(function () { return { x: " + repX + ", y: " + repY + ", active: true }; });"
);
const repelMod = getModuleOf(repelSrc);
const repelComp = getComponentOf(repelMod);
const htmlRepel = server.renderToString(react.createElement(repelComp, fakeProps(snapshotWithData)));
const reps = htmlRepel.match(/translate\((-?\d+\.\d)px,-?\d+\.\dpx\)/g) || [];
const hasNonZero = reps.some((s) => !s.includes("0.0px,0.0px") && !s.includes("0.0px,-0.0px") && !s.includes("-0.0px,0.0px") && !s.includes("-0.0px,-0.0px"));
if (!hasNonZero) throw new Error("repulsion effect not applied: " + JSON.stringify(reps.slice(0, 5)));
console.log("render(repulsion) OK, html length =", htmlRepel.length);

console.log("ALL SMOKE TESTS PASSED");

function getModuleOf(source) {
  let m = null;
  const w = { __ModuleLoader__: { load: (o) => { m = o; } } };
  new Function("window", "require", source)(w, requireStub);
  if (!m) throw new Error("bundle did not register via __ModuleLoader__.load");
  return m.factory(requireStub);
}

function getComponent() {
  const all = [];
  const ctx2 = {
    effect: (fn) => { fn(); return () => {}; },
    slots: {
      inject: (key, cb) => { cb(); return () => {}; },
      register: (options, component) => { all.push(component); return () => {}; }
    },
    sessions: { binding: () => ({ session: { getSnapshot: () => ({ views: new Map() }), loadOlder: async () => {} } }) }
  };
  mod.apply(ctx2);
  if (all.length !== 1) throw new Error("expected one registered component");
  return all[0];
}

function getComponentOf(mod) {
  const all = [];
  const ctx3 = {
    effect: (fn) => { fn(); return () => {}; },
    slots: {
      inject: (key, cb) => { cb(); return () => {}; },
      register: (options, component) => { all.push(component); return () => {}; }
    },
    sessions: { binding: () => ({ session: { getSnapshot: () => ({ views: new Map() }), loadOlder: async () => {} } }) }
  };
  mod.apply(ctx3);
  if (all.length !== 1) throw new Error("expected one registered component");
  return all[0];
}
