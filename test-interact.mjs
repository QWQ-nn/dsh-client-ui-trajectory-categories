// Interaction test: render the canvas view in jsdom and simulate real
// pointer/wheel/click events to verify drag-pan, ctrl+wheel zoom, hover
// highlight, cursor repulsion and tool-detail clicks actually work.
// 相对路径：基于本文件位置解析包内 lib/ 与 node_modules（CI 可移植）。
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { JSDOM } = require("jsdom");

const dom = new JSDOM('<!DOCTYPE html><html><body><div id="root"></div></body></html>', { pretendToBeVisual: true });
const win = dom.window;
global.window = win;
global.document = win.document;
try { Object.defineProperty(global, "navigator", { value: win.navigator, configurable: true }); } catch { global.navigator = win.navigator; }
global.requestAnimationFrame = (cb) => win.requestAnimationFrame(cb);
global.cancelAnimationFrame = (id) => win.cancelAnimationFrame(id);
global.Element = win.Element;
global.HTMLElement = win.HTMLElement;
global.Node = win.Node;
global.getComputedStyle = (el) => win.getComputedStyle(el);

const react = require("react");
const ReactDOMClient = require("react-dom/client");
const { flushSync } = require("react-dom");

const src = readFileSync(fileURLToPath(new URL("./lib/client.js", import.meta.url)), "utf8");

let loaded = null;
const winStub = { __ModuleLoader__: { load: (o) => { loaded = o; } } };
const requireStub = (spec) => {
  if (spec === "react") return react;
  throw new Error("unexpected require: " + spec);
};
new Function("window", "require", src)(winStub, requireStub);
const mod = loaded.factory(requireStub);

let comp = null;
const ctx = {
  effect: (fn) => { fn(); return () => {}; },
  slots: { inject: (k, cb) => { cb(); return () => {}; }, register: (o, c) => { comp = c; return () => {}; } },
  sessions: { binding: () => ({ session: { getSnapshot: () => ({ views: new Map() }), loadOlder: async () => {} } }) }
};
mod.apply(ctx);

const now = Date.now();
const inspection = {
  eventNodes: [
    { kind: "user", seq: 1, time: now - 9000, content: "请优化日志模块" },
    { kind: "assistant", seq: 2, time: now - 8500, turn: 1, step: 1, blocks: [{ kind: "text", text: "开始" }] },
    { kind: "tool-result", seq: 3, time: now - 8000, callId: "c1", call: { name: "read", argsRaw: '{"file_path":"a.js"}' }, content: [{ type: "text", text: "ok" }], isError: false },
    { kind: "tool-result", seq: 4, time: now - 7800, callId: "c2", call: { name: "edit", argsRaw: '{"file_path":"a.js"}' }, content: [{ type: "text", text: "ok" }], isError: false },
    { kind: "tool-result", seq: 5, time: now - 7600, callId: "c3", call: { name: "web_search", argsRaw: '{"query":"x"}' }, content: [{ type: "text", text: "no" }], isError: true, error: { code: "timeout" } }
  ],
  eventLocations: new Map(),
  requests: [],
  runningCalls: []
};
const snap = { views: new Map([["trajectory", inspection]]), hasMore: false, loadingOlder: false };

const tick = () => new Promise((r) => setTimeout(r, 40));
function fire(target, type, init) {
  init = init || {};
  let ev;
  if (type.startsWith("pointer") || type.startsWith("mouse")) {
    ev = new win.MouseEvent(type, { bubbles: true, cancelable: true, view: win, clientX: init.clientX || 0, clientY: init.clientY || 0, button: init.button !== undefined ? init.button : 0, relatedTarget: init.relatedTarget !== undefined ? init.relatedTarget : null });
  } else if (type === "wheel") {
    try {
      ev = new win.WheelEvent(type, { bubbles: true, cancelable: true, deltaX: init.deltaX || 0, deltaY: init.deltaY || 0, ctrlKey: !!init.ctrlKey });
    } catch {
      ev = new win.Event(type, { bubbles: true, cancelable: true });
      Object.assign(ev, { deltaX: init.deltaX || 0, deltaY: init.deltaY || 0, ctrlKey: !!init.ctrlKey });
    }
  } else {
    ev = new win.Event(type, { bubbles: true, cancelable: true });
    Object.assign(ev, init);
  }
  target.dispatchEvent(ev);
  return ev;
}

const root = document.getElementById("root");
const container = ReactDOMClient.createRoot(root);
container.render(react.createElement(comp, { useSession: (sel) => sel(snap), loadOlder: async () => false }));
await tick();
await tick();

const canvas = document.querySelector("[data-dsh-canvas]");
const content = document.querySelector("[data-dsh-content]");
const problemNode = document.querySelector('[data-dsh-node="p1"]');
const toolBtn = document.querySelector("[data-dsh-tool]");
if (!canvas || !content || !problemNode || !toolBtn) throw new Error("canvas/content/problem/tool not rendered");

// ── 1. click a tool chip → detail appears ──
flushSync(() => { toolBtn.dispatchEvent(new win.MouseEvent("click", { bubbles: true, cancelable: true, button: 0 })); });
await tick();
if (!document.body.innerHTML.includes("调用详情")) throw new Error("tool click detail missing");
console.log("1. tool click detail OK");

// ── 2. drag pan: pointerdown(100,100) → pointermove(160,120) → content moves ──
flushSync(() => {
  fire(canvas, "pointerdown", { clientX: 100, clientY: 100, button: 0 });
  fire(canvas, "pointermove", { clientX: 160, clientY: 120 });
});
await tick();
let t = content.style.transform || "";
if (!t.includes("translate(90px,36px)")) throw new Error("drag pan failed, transform=" + t);
console.log("2. drag pan OK:", t);
flushSync(() => { fire(canvas, "pointerup", {}); });

// ── 3. wheel zoom (no ctrl needed) → scale increases ──
flushSync(() => { fire(canvas, "wheel", { deltaX: 0, deltaY: -100, ctrlKey: false }); });
await tick();
t = content.style.transform || "";
if (!t.includes("scale(1.12)")) throw new Error("zoom failed, transform=" + t);
console.log("3. wheel zoom (direct) OK:", t);

// ── 4. hover highlight: pointerover on problem node → background changes ──
const beforeBg = problemNode.style.background || "";
flushSync(() => { fire(problemNode, "pointerover", { relatedTarget: null }); });
await tick();
const afterBg = problemNode.style.background || "";
if (afterBg === beforeBg || afterBg === "") throw new Error("hover highlight failed: before=" + beforeBg + " after=" + afterBg);
console.log("4. hover highlight OK:", afterBg);
flushSync(() => { fire(problemNode, "pointerout", { relatedTarget: null }); });

// ── 5. repulsion: pointer near problem node center → its transform becomes non-zero ──
// problem node center in content coords; view is translate(100.8,40.32) scale(1.12)
const ppX = parseInt(problemNode.style.left, 10);
const ppY = parseInt(problemNode.style.top, 10);
const pcx = ppX + 95 + 20;
const pcy = ppY + 37 + 10;
flushSync(() => { fire(canvas, "pointermove", { clientX: 100.8 + pcx * 1.12, clientY: 40.32 + pcy * 1.12 }); });
await tick();
const afterRepel = problemNode.style.transform || "";
if (!/translate\(-?\d+\.\dpx,-?\d+\.\dpx\)/.test(afterRepel) || /0\.0px,-?0\.0px/.test(afterRepel)) {
  throw new Error("repulsion failed: " + afterRepel);
}
console.log("5. repulsion OK:", afterRepel);

// ── 6. node drag: drag the 方案 pill → its tools follow (parent drags children) ──
const pill = document.querySelector('[data-dsh-node="ap1:a1"]');
const toolEl = document.querySelector('[data-dsh-tool]');
const toolWrap = toolEl ? toolEl.parentElement : null;
if (!pill || !toolWrap) throw new Error("pill/tool wrapper not found");
const pillBefore = { x: parseInt(pill.style.left, 10), y: parseInt(pill.style.top, 10) };
const toolBefore = { x: parseInt(toolWrap.style.left, 10), y: parseInt(toolWrap.style.top, 10) };
flushSync(() => {
  fire(pill, "pointerdown", { clientX: 200, clientY: 200, button: 0 });
  fire(pill, "pointermove", { clientX: 250, clientY: 230 });
});
await tick();
const pillAfter = { x: parseInt(pill.style.left, 10), y: parseInt(pill.style.top, 10) };
const toolAfter = { x: parseInt(toolWrap.style.left, 10), y: parseInt(toolWrap.style.top, 10) };
if (pillAfter.x - pillBefore.x !== 50 || pillAfter.y - pillBefore.y !== 30) throw new Error("pill drag failed: " + JSON.stringify({ pillBefore, pillAfter }));
if (toolAfter.x - toolBefore.x !== 50 || toolAfter.y - toolBefore.y !== 30) throw new Error("tool did not follow parent drag: " + JSON.stringify({ toolBefore, toolAfter }));
console.log("6. node drag (parent moves children) OK");
flushSync(() => { fire(pill, "pointerup", {}); });

// ── 7. connectors align with node edges (wait for line animation to converge) ──
const probEl = document.querySelector('[data-dsh-node="p1"]');
const pillEl = document.querySelector('[data-dsh-node="ap1:a1"]');
const probX = parseInt(probEl.style.left, 10);
const probY = parseInt(probEl.style.top, 10);
const pillX2 = parseInt(pillEl.style.left, 10);
const pillY2 = parseInt(pillEl.style.top, 10);
const pillLeftEdge = { x: pillX2, y: pillY2 + 27 };
const probRightEdge = { x: probX + 190, y: probY + 37 };
let aligned = false;
for (let i = 0; i < 40; i++) {
  await tick();
  const svgEl2 = document.querySelector("svg");
  if (!svgEl2) continue;
  const paths2 = Array.from(svgEl2.querySelectorAll("path")).map((p) => p.getAttribute("d") || "");
  const endsAtPill = paths2.some((d) => {
    const m = d.trim().match(/([\d.]+)\s+([\d.]+)\s*$/);
    return m && Math.abs(parseFloat(m[1]) - pillLeftEdge.x) < 2 && Math.abs(parseFloat(m[2]) - pillLeftEdge.y) < 2;
  });
  const startsAtProblem = paths2.some((d) => {
    const m = d.match(/^M\s+([\d.]+)\s+([\d.]+)/);
    return m && Math.abs(parseFloat(m[1]) - probRightEdge.x) < 2 && Math.abs(parseFloat(m[2]) - probRightEdge.y) < 2;
  });
  if (endsAtPill && startsAtProblem) { aligned = true; break; }
}
if (!aligned) throw new Error("connectors did not align with node edges: pill=" + JSON.stringify(pillLeftEdge) + " problem=" + JSON.stringify(probRightEdge));
console.log("7. connectors align with node edges OK");

// ── 8. problem switcher: 2 user messages → 2 problem tabs; switching shows the other problem ──
const root2 = document.createElement("div");
root2.id = "root2";
document.body.appendChild(root2);
const snap2 = {
  views: new Map([["trajectory", {
    eventNodes: [
      { kind: "user", seq: 1, time: now - 9000, content: "第一个问题" },
      { kind: "assistant", seq: 2, time: now - 8500, turn: 1, step: 1, blocks: [{ kind: "text", text: "尝试一" }] },
      { kind: "tool-result", seq: 3, time: now - 8000, callId: "c1", call: { name: "read", argsRaw: '{"file_path":"a.js"}' }, content: [{ type: "text", text: "ok" }], isError: false },
      { kind: "user", seq: 4, time: now - 6000, content: "第二个问题" },
      { kind: "assistant", seq: 5, time: now - 5500, turn: 2, step: 1, blocks: [{ kind: "text", text: "尝试二" }] },
      { kind: "tool-result", seq: 6, time: now - 5000, callId: "c2", call: { name: "edit", argsRaw: '{"file_path":"b.js"}' }, content: [{ type: "text", text: "ok" }], isError: false }
    ],
    eventLocations: new Map(),
    requests: [],
    runningCalls: []
  }]]),
  hasMore: false,
  loadingOlder: false
};
const container2 = ReactDOMClient.createRoot(root2);
container2.render(react.createElement(comp, { useSession: (sel) => sel(snap2), loadOlder: async () => false }));
await tick();
await tick();
const tabs = Array.from(root2.querySelectorAll("button")).filter((b) => b.textContent && b.textContent.includes("问题"));
if (tabs.length < 2) throw new Error("problem switcher tabs missing: " + tabs.length);
// 打开分类默认显示最新问题（第二个问题 p4）
if (!root2.querySelector('[data-dsh-node="p4"]')) throw new Error("latest problem node p4 missing at start");
if (root2.querySelector('[data-dsh-node="p1"]')) throw new Error("problem 1 node should NOT render initially (default = latest problem)");
const tab1 = tabs.find((b) => b.textContent.includes("问题 1"));
flushSync(() => { tab1.dispatchEvent(new win.MouseEvent("click", { bubbles: true, cancelable: true, button: 0 })); });
await tick();
if (!root2.querySelector('[data-dsh-node="p1"]')) throw new Error("switching to problem 1 failed: p1 node missing");
if (root2.querySelector('[data-dsh-node="p4"]')) throw new Error("problem 2 node still rendered after switch");
const tab2b = tabs.find((b) => b.textContent.includes("问题 2"));
flushSync(() => { tab2b.dispatchEvent(new win.MouseEvent("click", { bubbles: true, cancelable: true, button: 0 })); });
await tick();
if (!root2.querySelector('[data-dsh-node="p4"]')) throw new Error("switching back to problem 2 failed");
console.log("8. problem switcher (default latest, one per canvas) OK");
container2.unmount();
document.body.removeChild(root2);

// ── 9. click problem node → toggles all sub-flows (collapse/expand) ──
const probNode9 = document.querySelector('[data-dsh-node="p1"]');
const pill9 = document.querySelector('[data-dsh-node="ap1:a1"]');
if (!probNode9 || !pill9) throw new Error("nodes for tap-toggle test missing");
const before9 = document.querySelectorAll('[data-dsh-node^="tp1:a1::"]').length;
// 完整指针序列（按下→抬起→点击），确保 tapGuard 把本次交互当作点击
flushSync(() => {
  fire(probNode9, "pointerdown", { clientX: 100, clientY: 100, button: 0 });
  fire(probNode9, "pointerup", {});
});
await tick();
flushSync(() => { probNode9.dispatchEvent(new win.MouseEvent("click", { bubbles: true, cancelable: true, button: 0 })); });
await tick();
const after9 = document.querySelectorAll('[data-dsh-node^="tp1:a1::"]').length;
if (before9 === 0 || after9 !== 0) throw new Error("problem tap did not collapse sub-flow: before=" + before9 + " after=" + after9);
console.log("9. problem tap toggles sub-flow OK");
// 再点一次展开，恢复状态
flushSync(() => {
  fire(probNode9, "pointerdown", { clientX: 100, clientY: 100, button: 0 });
  fire(probNode9, "pointerup", {});
});
await tick();
flushSync(() => { probNode9.dispatchEvent(new win.MouseEvent("click", { bubbles: true, cancelable: true, button: 0 })); });
await tick();
if (document.querySelectorAll('[data-dsh-node^="tp1:a1::"]').length === 0) throw new Error("problem tap did not re-expand sub-flow");

// ── 10. drag then click must NOT toggle (tapGuard) ──
const pill10 = document.querySelector('[data-dsh-node="ap1:a1"]');
const wrap10 = document.querySelector('[data-dsh-node^="tp1:a1::"]');
const toolCountBefore = document.querySelectorAll('[data-dsh-node^="tp1:a1::"]').length;
flushSync(() => {
  fire(pill10, "pointerdown", { clientX: 300, clientY: 300, button: 0 });
  fire(pill10, "pointermove", { clientX: 400, clientY: 330 });
});
await tick();
flushSync(() => { fire(pill10, "pointerup", {}); });
await tick();
flushSync(() => { pill10.dispatchEvent(new win.MouseEvent("click", { bubbles: true, cancelable: true, button: 0 })); });
await tick();
const toolCountAfter = document.querySelectorAll('[data-dsh-node^="tp1:a1::"]').length;
if (toolCountAfter !== toolCountBefore) throw new Error("click after drag toggled (tapGuard failed): before=" + toolCountBefore + " after=" + toolCountAfter);
console.log("10. tapGuard: click after drag ignored OK");

// ── 11. heatmap collapsible: collapsed by default, click header to expand/collapse ──
const heatHeader = Array.from(document.querySelectorAll("button")).find((b) => b.textContent && b.textContent.includes("热力图 · 排行榜"));
if (!heatHeader) throw new Error("heatmap collapsible header missing");
if (!document.body.innerHTML.includes("点击展开")) throw new Error("heatmap should start collapsed");
flushSync(() => { heatHeader.dispatchEvent(new win.MouseEvent("click", { bubbles: true, cancelable: true, button: 0 })); });
await tick();
if (!document.body.innerHTML.includes("点击收起")) throw new Error("heatmap did not expand on header click");
if (!document.body.innerHTML.includes("排行榜")) throw new Error("heatmap ranking missing after expand");
flushSync(() => { heatHeader.dispatchEvent(new win.MouseEvent("click", { bubbles: true, cancelable: true, button: 0 })); });
await tick();
if (!document.body.innerHTML.includes("点击展开")) throw new Error("heatmap did not collapse on second click");
console.log("11. heatmap collapsible toggle OK");

console.log("ALL INTERACTION TESTS PASSED");
container.unmount();
