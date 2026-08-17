window.__ModuleLoader__.load({
	id: "dsh-client-ui-trajectory-categories",
	factory: (require) => {
		"use strict";
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });

		// ── imports ──────────────────────────────────────────────────────────
		// Only React is required; everything else is plain client-side logic.
		var react = require("react");
		var useState = react.useState;
		var useMemo = react.useMemo;
		var useCallback = react.useCallback;
		var useEffect = react.useEffect;
		var h = react.createElement;

		// ── UI strings (Chinese-first: category labels and all user-facing
		//    text render in Chinese regardless of the GUI locale, and the
		//    classification matches Chinese tool names / terms as well). ──────
		var TAB_LABEL = "分类";
		var VIEW_DESCRIPTION = "按动作类型分组的轨迹摘要：写入 / 读取 / 下载 / 命令 / 查询 / 子代理 / 其他工具 / 消息 / 压缩。点击类别展开详细动作（工具调用、参数与结果）。原始逐条列表保留在「轨迹」标签页。本视图在浏览器端本地聚合，不发起任何模型请求，不额外消耗 token。";
		var VIEW_NOTE = "分类匹配同时识别中英文工具名（写入 / 编辑 / 修改 / 读取 / 查看 / 下载 / 命令 / 执行 / 搜索 / 查询 / 子代理 等）。数据来自轨迹投影（ui-trajectory），逐条流程请切换到「轨迹」标签页。";
		var EMPTY_HINT = "轨迹数据尚未就绪：需要 ui-trajectory 插件提供轨迹投影。";
		var FILTER_PLACEHOLDER = "筛选工具名 / 内容…";
		var EXPAND_ALL = "全部展开";
		var COLLAPSE_ALL = "全部收起";
		var LOAD_OLDER = "加载更早记录";
		var LOADING = "加载中…";
		var COLLAPSE = "收起";
		var SHOW_MORE = "显示更多（{count}）";
		var ARGS_LABEL = "参数";
		var RESULT_LABEL = "结果";
		var ERROR_LABEL = "错误";
		var NO_OUTPUT = "无输出";
		var NO_ARGS = "（无参数）";
		var STATUS_RUNNING = "进行中";
		var STATUS_ERROR = "出错";
		var STATUS_OK = "成功";
		var MESSAGE_USER = "用户";
		var MESSAGE_CONTEXT = "上下文";
		var MESSAGE_STEERING = "转向";
		var MESSAGE_ASSISTANT = "回复";
		var MESSAGE_COMPACTION = "压缩摘要";
		/** 分类的中文显示名（固定中文，不随界面语言变化）。 */
		var CATEGORY_LABEL_ZH = {
			write: "写入",
			read: "读取",
			download: "下载",
			command: "命令",
			search: "查询",
			subagent: "子代理",
			other: "其他工具",
			messages: "消息",
			compaction: "压缩"
		};

		// ── categorization ───────────────────────────────────────────────────
		/** Stable category order for rendering and totals. */
		var CATEGORY_ORDER = ["write", "read", "download", "command", "search", "subagent", "other", "messages", "compaction"];
		/** Accent color per category (app theme variables with plain fallbacks). */
		var CATEGORY_COLOR = {
			write: "var(--dsw-alias-state-success-primary, #2f9e44)",
			read: "var(--dsw-alias-state-business-primary, #1f6feb)",
			download: "#9c36b5",
			command: "var(--dsw-alias-state-warn-label, #e8590c)",
			search: "#0ca678",
			subagent: "#d6336c",
			other: "var(--dsw-alias-label-tertiary, #868e96)",
			messages: "#5c7cfa",
			compaction: "#b08968"
		};
		/**
		 * 把工具名归入某个分类。关键词同时匹配中英文：
		 *   write 写入/编辑/修改/创建/删除/…   read 读取/查看/打开/查找/…
		 *   download 下载/抓取/拉取/…          command 命令/执行/运行/终端/…
		 *   search 搜索/查询/询问/…            subagent 子代理/委派/派生/…
		 * @param name - 工具名（可能为空/未定义）。
		 * @returns {@link CATEGORY_ORDER} 之一（不含 messages/compaction）。
		 */
		function categorizeTool(name) {
			var n = String(name ?? "").toLowerCase();
			// 写入：文件/内容的修改类操作（中英文）
			if (/(写入|写文件|编辑|修改|创建|新建|删除|移除|重命名|移动|复制|保存|追加|插入|替换|修补|覆盖|截断|清空|改名|write|edit|str[-_]?replace|apply[-_]?patch|patch|append|insert|mkdir|create|delete|remove|rename|move|touch|save|chmod|chown|truncate|copy)/.test(n)) return "write";
			// 读取：查看/检索文件内容类操作（中英文）
			if (/(读取|读文件|查看|打开|列出|浏览|预览|查找|搜索文件|全局搜索|正则|内容搜索|read|cat\b|view|glob|grep|list|ls\b|head|tail|stat|open|fs[-_]?read|fs[-_]?search|read[-_]?image)/.test(n)) return "read";
			// 下载：拉取远程资源（中英文）
			if (/(下载|抓取|拉取|获取链接|保存链接|download|fetch|curl|wget|get[-_]?url|web[-_]?fetch|save[-_]?url|download[-_]?file)/.test(n)) return "download";
			// 命令：执行/终端/脚本类操作（中英文）
			if (/(命令|执行|运行|终端|命令行|脚本|进程|bash|pwsh|shell|terminal|exec|run[-_]?command|cmdline|powershell|native[-_]?command|code[-_]?execution)/.test(n)) return "command";
			// 查询：搜索/问答类操作（中英文）
			if (/(搜索|查询|询问|提问|查找信息|联网搜索|search|query|lookup|web[-_]?search|ask[-_]?user|ask_question)/.test(n)) return "search";
			// 子代理：委派/派生子任务（中英文）
			if (/(子代理|子任务|委派|派生|分派|代理调用|subagent|agent|spawn|delegate|fork|interrupt[-_]?agent|send[-_]?message|list[-_]?agents|subagent[-_]?control)/.test(n)) return "subagent";
			return "other";
		}

		// ── text helpers ─────────────────────────────────────────────────────
		/** Stable empty inspection fallback (prevents selector churn). */
		var EMPTY_LIST = [];
// ── ① 文案常量（放在 CATEGORY_COLOR 之后）──────────────────────────────────────
var HEAT_LESS = "少";
var HEAT_MORE = "多";
var HEAT_ALL = "总览";
var HEAT_NONE = "无动作";
var HEAT_TOTAL = "合计";
var DATE_CHIP_PREFIX = "已选";
var DATE_CHIP_SUFFIX = "次动作";

// ── ② 模块级 helper（放在 buildModel 之前）────────────────────────────────────
/** 两位补零（避免依赖 padStart）。 */
function pad2(n) { return n < 10 ? "0" + n : "" + n; }
/** 本地日 key。 */
function dayKeyOf(ms) {
	if (typeof ms !== "number" || !isFinite(ms)) return "";
	var d = new Date(ms);
	return d.getFullYear() + "-" + pad2(d.getMonth() + 1) + "-" + pad2(d.getDate());
}
/** hex + alpha → rgba。 */
function hexRgba(hex, a) {
	var n = parseInt(hex.slice(1), 16);
	return "rgba(" + ((n >> 16) & 255) + "," + ((n >> 8) & 255) + "," + (n & 255) + "," + a + ")";
}
var HEAT_GREEN = ["#ebedf0", "#9be9a8", "#40c463", "#30a14e", "#216e39"];
/** 分段控件按钮样式。 */
function segBtnStyle(active, color) {
	return {
		border: "1px solid var(--dsw-alias-border-l1, rgba(127,127,127,.14))",
		background: active
			? (color ? hexRgba(color, 0.14) : "var(--dsw-alias-bg-layer-2, rgba(127,127,127,.1))")
			: "var(--dsw-alias-bg-layer-2, rgba(127,127,127,.05))",
		color: active ? "var(--dsw-alias-label-primary, #1f2329)" : "var(--dsw-alias-label-secondary, #5f6b7a)",
		fontSize: "12px", padding: "4px 10px", borderRadius: "999px", cursor: "pointer",
		display: "inline-flex", alignItems: "center", gap: "6px", userSelect: "none",
		fontWeight: active ? 600 : 400
	};
}


		var EMPTY_INSPECTION = {
			eventNodes: EMPTY_LIST,
			eventLocations: new Map(),
			requests: EMPTY_LIST,
			runningCalls: EMPTY_LIST
		};
		/**
		 * 工具结果的可读文本（镜像 ui-trajectory 的 detailResult：
		 * 文本块拼接；空则 "No output"；非文本则 JSON 兜底）。
		 * @param node - 带 `content`（内容块数组）的 tool-result 节点。
		 * @returns 结果文本。
		 */
		function resultText(node) {
			if (!node || typeof node !== "object") return "";
			if (node.isError) {
				var code = node.error?.code ?? node.error?.name ?? "";
				return code !== "" ? String(code) : "error";
			}
			var content = node.content;
			if (!Array.isArray(content)) return content === void 0 ? "" : String(content);
			var text = content.filter(function (b) { return b && b.type === "text" && typeof b.text === "string"; }).map(function (b) { return b.text; }).join("\n");
			if (text !== "") return text;
			if (content.length === 0 || content.every(function (b) { return b && b.type === "text" && (typeof b.text !== "string" || b.text === ""); })) return "No output";
			try { return JSON.stringify(content, null, 2); } catch { return ""; }
		}
		/**
		 * 用户/上下文/转向消息节点文本。
		 * @param content - 原始消息内容（字符串或内容块数组）。
		 * @returns 纯文本。
		 */
		function messageText(content) {
			if (typeof content === "string") return content;
			if (Array.isArray(content)) {
				return content.filter(function (b) { return b && typeof b.text === "string"; }).map(function (b) { return b.text; }).join("\n");
			}
			if (content !== null && typeof content === "object") {
				try { return JSON.stringify(content); } catch { return ""; }
			}
			return "";
		}
		/**
		 * 回复节点文本：文本 + 思考块拼接；纯工具调用时给出行内统计。
		 * @param node - 带 `blocks` 的 assistant 节点。
		 * @returns 纯文本。
		 */
		function assistantText(node) {
			var blocks = node.blocks;
			if (!Array.isArray(blocks)) return "";
			var text = blocks.filter(function (b) { return b && (b.kind === "text" || b.kind === "reasoning") && typeof b.text === "string" && b.text !== ""; }).map(function (b) { return b.text; }).join("\n");
			if (text !== "") return text;
			var calls = blocks.filter(function (b) { return b && b.kind === "tool-call"; });
			if (calls.length > 0) return "[仅工具调用] " + calls.map(function (b) { return b.name; }).join(", ");
			return "";
		}
		/**
		 * 参数单行预览：优先提取文件路径/URL 等关键字段（更贴合中文语境），
		 * 否则压缩原始 JSON。
		 * @param argsRaw - 原始参数（JSON 字符串或已解析值）。
		 * @returns 短单行预览。
		 */
		function argsPreview(argsRaw) {
			if (argsRaw === void 0 || argsRaw === null || argsRaw === "") return "";
			var parsed = null;
			if (typeof argsRaw === "string") {
				var trimmed = argsRaw.trim();
				if (trimmed === "" || trimmed === "{}") return "";
				try { parsed = JSON.parse(trimmed); } catch { parsed = null; }
				if (parsed === null) return shorten(trimmed.replace(/\s+/g, " "), 120);
			} else {
				parsed = argsRaw;
			}
			// 优先展示关键字段：文件路径 / URL / 命令 / 查询词
			var target = firstString(parsed, ["file_path", "path", "filePath", "target", "url", "uri", "command", "cmd", "query", "q", "search", "name"]);
			if (target !== "") return shorten(target, 120);
			try { return shorten(JSON.stringify(parsed), 120); } catch { return ""; }
		}
		/** 取对象中第一个存在的字符串字段值（用于参数预览）。 */
		function firstString(value, keys) {
			if (value === null || typeof value !== "object") return "";
			for (var i = 0; i < keys.length; i++) {
				var v = value[keys[i]];
				if (typeof v === "string" && v !== "") return v;
				if (v !== void 0 && v !== null && typeof v === "object") {
					var nested = firstString(v, keys);
					if (nested !== "") return nested;
				}
			}
			return "";
		}
		/** 截断字符串到 `max` 字符并加省略号。 */
		function shorten(value, max) {
			if (typeof value !== "string") value = String(value ?? "");
			if (value.length <= max) return value;
			return value.slice(0, max) + "…";
		}
		/** 毫秒时间戳的本地时钟显示，缺失显示 "—"。 */
		function fmtTime(ms) {
			if (typeof ms !== "number" || !Number.isFinite(ms)) return "—";
			try { return new Date(ms).toLocaleTimeString([], { hour12: false }); } catch { return String(ms); }
		}
		/** 从轨迹位置表取某个事件 seq 的轮次/步骤。 */
		function locationOf(eventLocations, seq) {
			var loc = eventLocations && eventLocations.get(seq);
			if (!loc) return { turn: null, step: null };
			if (loc.kind === "step") return { turn: loc.turn?.turn ?? null, step: loc.step?.step ?? null };
			if (loc.kind === "turn") return { turn: loc.turn?.turn ?? null, step: null };
			return { turn: null, step: null };
		}

		// ── model builder ────────────────────────────────────────────────────
		/**
		 * 把一份轨迹投影快照归类为有序分组。纯函数，上游 useMemo 缓存，
		 * 只在快照变化时重算。
		 * @param inspection - `snapshot.views.get("trajectory")` 的值。
		 * @returns `{ categories, totals, toolTotal }`。
		 */
		function buildModel(inspection) {
			var categories = { write: [], read: [], download: [], command: [], search: [], subagent: [], other: [], messages: [], compaction: [] };
			var totals = { write: 0, read: 0, download: 0, command: 0, search: 0, subagent: 0, other: 0, messages: 0, compaction: 0 };
			if (!inspection || typeof inspection !== "object") return { categories, totals, toolTotal: 0 };
			var nodes = inspection.eventNodes ?? EMPTY_LIST;
			var eventLocations = inspection.eventLocations ?? EMPTY_LIST;
			var requests = inspection.requests ?? EMPTY_LIST;
			var runningCalls = inspection.runningCalls ?? EMPTY_LIST;
			for (var i = 0; i < nodes.length; i++) {
				var node = nodes[i];
				if (!node || typeof node !== "object") continue;
				var kind = node.kind;
				if (kind === "user" || kind === "context" || kind === "steering") {
					var text = shorten(messageText(node.content), 200);
					var loc0 = locationOf(eventLocations, node.seq);
					categories.messages.push({
						key: "msg:" + String(node.seq),
						label: kind,
						seq: node.seq,
						time: node.time,
						turn: loc0.turn,
						step: loc0.step,
						text
					});
					totals.messages += 1;
					continue;
				}
				if (kind === "assistant") {
					categories.messages.push({
						key: "ast:" + String(node.seq),
						label: "assistant",
						seq: node.seq,
						time: node.time,
						turn: node.turn ?? null,
						step: node.step ?? null,
						text: shorten(assistantText(node), 200)
					});
					totals.messages += 1;
					continue;
				}
				if (kind === "tool-result") {
					var name = node.call?.name ?? "tool";
					var cat = categorizeTool(name);
					categories[cat].push({
						key: "tool:" + String(node.seq),
						callId: node.callId,
						name,
						argsRaw: node.call?.argsRaw ?? "",
						time: node.time,
						turn: locationOf(eventLocations, node.seq).turn,
						step: locationOf(eventLocations, node.seq).step,
						status: node.isError === true ? "error" : "ok",
						errorText: node.isError ? String(node.error?.code ?? node.error?.name ?? "error") : "",
						result: resultText(node)
					});
					totals[cat] += 1;
					continue;
				}
				// 其余节点类型（turn-end / session-end / compaction 行）不在
				// `eventNodes` 中 —— 它们经由 `requests` 呈现。
			}
			for (var r = 0; r < runningCalls.length; r++) {
				var run = runningCalls[r];
				if (!run || typeof run !== "object") continue;
				var rname = run.name ?? "tool";
				var rcat = categorizeTool(rname);
				categories[rcat].push({
					key: "run:" + String(run.callId),
					callId: run.callId,
					name: rname,
					argsRaw: run.argsRaw ?? "",
					time: run.time,
					turn: run.turn ?? null,
					step: run.step ?? null,
					status: "running",
					errorText: "",
					result: ""
				});
				totals[rcat] += 1;
			}
			for (var q = 0; q < requests.length; q++) {
				var req = requests[q];
				if (!req || req.purpose !== "compaction") continue;
				categories.compaction.push({
					key: "comp:" + String(req.startSeq),
					name: "compaction",
					argsRaw: "",
					time: req.startedAt ?? req.startSeq,
					turn: req.turn ?? null,
					step: null,
					status: req.status ?? "complete",
					errorText: req.error ?? "",
					result: shorten(req.summary ?? "", 400),
					startedAt: req.startedAt,
					completedAt: req.completedAt
				});
				totals.compaction += 1;
			}
			var toolTotal = 0;
			for (var c = 0; c < CATEGORY_ORDER.length; c++) {
				var key = CATEGORY_ORDER[c];
				if (key !== "messages" && key !== "compaction") toolTotal += totals[key];
			}
			return { categories, totals, toolTotal };
		}

		// ── ③ buildHeatmap（放在 buildModel 之后）──────────────────────────────────────
/**
 * 从 buildModel 输出二次聚合出热力图数据。纯函数。
 * @param model - buildModel 的返回值。
 * @returns { byDay, catTotals, maxTotal, catMax, span }。
 */
function buildHeatmap(model) {
	var byDay = new Map();
	var catTotals = {};
	for (var c = 0; c < CATEGORY_ORDER.length; c++) catTotals[CATEGORY_ORDER[c]] = 0;
	var push = function (time, cat) {
		if (typeof time !== "number" || !isFinite(time) || time < 1e12) return; // 排除非时间戳兜底值
		var k = dayKeyOf(time);
		if (!byDay.has(k)) byDay.set(k, { total: 0, cats: {} });
		var b = byDay.get(k);
		b.total += 1;
		b.cats[cat] = (b.cats[cat] || 0) + 1;
		catTotals[cat] += 1;
	};
	if (model && model.categories) {
		for (var i = 0; i < CATEGORY_ORDER.length; i++) {
			var cat = CATEGORY_ORDER[i];
			var list = model.categories[cat] || EMPTY_LIST;
			for (var j = 0; j < list.length; j++) push(list[j].time, cat);
		}
	}
	var maxTotal = 1;
	var catMax = {};
	for (var c2 = 0; c2 < CATEGORY_ORDER.length; c2++) catMax[CATEGORY_ORDER[c2]] = 1;
	byDay.forEach(function (b) {
		if (b.total > maxTotal) maxTotal = b.total;
		for (var k in b.cats) if (b.cats[k] > (catMax[k] || 1)) catMax[k] = b.cats[k];
	});
	var minMs = Infinity, maxMs = -Infinity;
	byDay.forEach(function (_, k) {
		var t = new Date(k.replace(/-/g, "/")).getTime();
		if (t < minMs) minMs = t;
		if (t > maxMs) maxMs = t;
	});
	if (!isFinite(minMs)) { minMs = maxMs = Date.now(); }
	return {
		byDay: byDay, catTotals: catTotals, maxTotal: maxTotal, catMax: catMax,
		span: { min: new Date(minMs), max: new Date(maxMs) }
	};
}


// ── the view component ───────────────────────────────────────────────
		/**
		 * 会话视图标签页：轨迹分类摘要。读取 ui-trajectory 的 "trajectory"
		 * 视图投影，按动作类型聚合。默认全部折叠、展开时按需渲染，
		 * 超大会话也能保持轻量。
		 * @param props - ConvViewProps & inject face：useSession、inspect、
		 * onInspectDone、loadOlder。
		 */
		// ── ④ HeatmapView 组件（放在 CategoriesView 之前）──────────────────────────────
/**
 * 热力图 + 排行榜。纯展示，状态自管理（mode / tooltip）；
 * 选中日期通过 props.dateFilter / setDateFilter 上抛，由 CategoriesView 用于过滤列表。
 * @param props.heat - buildHeatmap 的输出。
 * @param props.dateFilter - 当前选中日期（"YYYY-MM-DD" | null）。
 * @param props.setDateFilter - 设置/清除选中日期。
 */
function HeatmapView(props) {
	var heat = props.heat;
	var dateFilter = props.dateFilter;
	var setDateFilter = props.setDateFilter;
	var modeState = useState("all");
	var mode = modeState[0];
	var setMode = modeState[1];
	var tipState = useState(null);
	var tip = tipState[0];
	var setTip = tipState[1];

	var start = new Date(heat.span.min.getTime());
	start.setDate(start.getDate() - start.getDay());            // 回退到周日
	var end = new Date(heat.span.max.getTime());
	end.setDate(end.getDate() + (6 - end.getDay()));            // 前进到周六
	var DAY = 86400000;
	var weeks = Math.round((end - start) / DAY / 7) + 1;
	var max = mode === "all" ? heat.maxTotal : (heat.catMax[mode] || 1);

	function level(v) {
		if (v <= 0) return 0;
		var r = v / max;
		if (r <= 0.2) return 1; if (r <= 0.45) return 2; if (r <= 0.75) return 3; return 4;
	}
	function cellColor(v, cat) {
		var l = level(v);
		if (l === 0) return "#ebedf0";
		if (cat === "all") return HEAT_GREEN[l];
		return hexRgba(CATEGORY_COLOR[cat], [0, 0.28, 0.5, 0.75, 1][l]);
	}

	var today = new Date(); today.setHours(12, 0, 0, 0);
	var cells = [];
	var monthLabels = [];
	var lastMonth = -1;
	for (var w = 0; w < weeks; w++) {
		var colFirst = new Date(start.getTime() + w * 7 * DAY);
		var m = colFirst.getMonth();
		if (m !== lastMonth) { monthLabels.push({ w: w, label: (m + 1) + "月" }); lastMonth = m; }
		for (var dow = 0; dow < 7; dow++) {
			var d = new Date(start.getTime() + (w * 7 + dow) * DAY);
			var k = dayKeyOf(d.getTime());
			var b = heat.byDay.get(k);
			var v = b ? (mode === "all" ? b.total : (b.cats[mode] || 0)) : 0;
			var future = d.getTime() > today.getTime();
			var isSel = dateFilter === k;
			cells.push(h("div", {
				key: k,
				title: future ? "" : (k + "：" + (b ? (mode === "all" ? HEAT_TOTAL + " " + b.total + " 次" : CATEGORY_LABEL_ZH[mode] + " " + v + " 次") : HEAT_NONE)),
				style: {
					width: "12px", height: "12px", borderRadius: "2px",
					background: future ? "#f6f8fa" : cellColor(v, mode),
					outline: isSel ? "2px solid var(--dsw-alias-state-business-primary, #1f6feb)" : "1px solid rgba(27,31,35,.06)",
					outlineOffset: isSel ? "0" : "-1px",
					cursor: future ? "default" : "pointer"
				},
				onMouseEnter: future ? null : function (ev) { setTip({ x: ev.clientX, y: ev.clientY, k: k, b: b }); },
				onMouseMove: future ? null : function (ev) { setTip(function (t) { return t ? { x: ev.clientX, y: ev.clientY, k: t.k, b: t.b } : t; }); },
				onMouseLeave: future ? null : function () { setTip(null); },
				onClick: future ? null : function () { setDateFilter(dateFilter === k ? null : k); }
			}));
		}
	}

	var seg = [h("button", { key: "all", onClick: function () { setMode("all"); }, style: segBtnStyle(mode === "all", null) }, HEAT_ALL)]
		.concat(CATEGORY_ORDER.map(function (cat) {
			return h("button", { key: cat, onClick: function () { setMode(cat); }, style: segBtnStyle(mode === cat, CATEGORY_COLOR[cat]) },
				h("span", { style: { width: "8px", height: "8px", borderRadius: "50%", background: CATEGORY_COLOR[cat], flex: "none" } }),
				h("span", null, CATEGORY_LABEL_ZH[cat]));
		}));

	var sorted = CATEGORY_ORDER.slice().sort(function (a, b) { return heat.catTotals[b] - heat.catTotals[a]; });
	var rankMax = Math.max(1, heat.catTotals[sorted[0]] || 1);
	var rankRows = sorted.map(function (cat) {
		var pct = Math.round((heat.catTotals[cat] || 0) / rankMax * 100);
		return h("div", { key: cat, style: { display: "grid", gridTemplateColumns: "64px 1fr 44px", alignItems: "center", gap: "10px", fontSize: "12px" } },
			h("div", { style: { display: "flex", alignItems: "center", gap: "6px", color: "var(--dsw-alias-label-primary, #1f2329)" } },
				h("span", { style: { width: "8px", height: "8px", borderRadius: "50%", background: CATEGORY_COLOR[cat], flex: "none" } }),
				h("span", null, CATEGORY_LABEL_ZH[cat])),
			h("div", { style: { background: "var(--dsw-alias-bg-layer-2, rgba(127,127,127,.06))", borderRadius: "4px", height: "14px", overflow: "hidden" } },
				h("div", { style: { height: "100%", width: pct + "%", background: CATEGORY_COLOR[cat], borderRadius: "4px" } })),
			h("div", { style: { textAlign: "right", color: "var(--dsw-alias-label-secondary, #5f6b7a)", fontVariantNumeric: "tabular-nums" } }, String(heat.catTotals[cat] || 0)));
	});

	var tipEl = tip ? h("div", {
		style: {
			position: "fixed",
			left: Math.min(tip.x + 14, (typeof window !== "undefined" ? window.innerWidth : 1200) - 260) + "px",
			top: (tip.y + 14) + "px", pointerEvents: "none", zIndex: 50,
			background: "#1f2329", color: "#fff", fontSize: "11px", lineHeight: "1.5",
			padding: "7px 9px", borderRadius: "6px", boxShadow: "0 4px 14px rgba(0,0,0,.25)", maxWidth: "240px"
		}
	}, h("b", null, tip.k),
		tip.b ? [
			h("div", { key: "t", style: { marginTop: "2px" } }, HEAT_TOTAL + " " + tip.b.total + " 次"),
			CATEGORY_ORDER.filter(function (c) { return tip.b.cats[c]; }).sort(function (a, b2) { return tip.b.cats[b2] - tip.b.cats[a]; }).map(function (c) {
				return h("div", { key: c, style: { display: "flex", alignItems: "center", gap: "6px", marginTop: "3px" } },
					h("span", { style: { width: "8px", height: "8px", borderRadius: "2px", background: CATEGORY_COLOR[c], flex: "none" } }),
					h("span", { style: { width: "56px", color: "#cfd6de" } }, CATEGORY_LABEL_ZH[c]),
					h("span", { style: { marginLeft: "auto", fontVariantNumeric: "tabular-nums" } }, String(tip.b.cats[c])));
			})
		] : h("div", { key: "n", style: { marginTop: "2px" } }, HEAT_NONE)
	) : null;

	var chip = dateFilter ? h("div", {
		style: { display: "inline-flex", alignItems: "center", gap: "8px", marginBottom: "12px", border: "1px solid var(--dsw-alias-state-business-primary, #1f6feb)", color: "var(--dsw-alias-state-business-primary, #1f6feb)", background: "rgba(31,111,235,.07)", borderRadius: "999px", padding: "4px 6px 4px 12px", fontSize: "12px" }
	},
		DATE_CHIP_PREFIX + " " + dateFilter + " · " + ((heat.byDay.get(dateFilter) || {}).total || 0) + " " + DATE_CHIP_SUFFIX,
		h("button", { onClick: function () { setDateFilter(null); }, style: { border: "0", background: "none", color: "inherit", cursor: "pointer", fontSize: "14px", lineHeight: "1", padding: "0 4px" } }, "×")
	) : null;

	return h("div", null,
		h("div", { style: { fontWeight: 700, fontSize: "13px", marginBottom: "10px", display: "flex", alignItems: "center", gap: "8px" } },
			h("span", null, "热力图"),
			h("span", { style: { fontWeight: 400, color: "var(--dsw-alias-label-caption, #98a1ad)", fontSize: "11px" } }, "日历视图 · 颜色越深 = 当天动作越多")),
		h("div", { style: { display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "12px" } }, seg),
		chip,
		h("div", { style: { overflowX: "auto", paddingBottom: "4px" } },
			h("div", { style: { display: "inline-grid", gridTemplateColumns: "auto 1fr", gap: "4px 6px" } },
				h("div", { style: { gridColumn: "2", position: "relative", height: "14px", fontSize: "10px", color: "var(--dsw-alias-label-caption, #98a1ad)" } },
					monthLabels.map(function (ml) { return h("span", { key: ml.w, style: { position: "absolute", left: (ml.w * 15) + "px", whiteSpace: "nowrap" } }, ml.label); })),
				h("div", { style: { display: "grid", gridTemplateRows: "repeat(7, 12px)", gap: "3px", fontSize: "10px", color: "var(--dsw-alias-label-caption, #98a1ad)" } },
					h("span", null, ""), h("span", null, "一"), h("span", null, ""), h("span", null, "三"), h("span", null, ""), h("span", null, "五"), h("span", null, "")),
				h("div", { style: { display: "grid", gridAutoFlow: "column", gridTemplateRows: "repeat(7, 12px)", gap: "3px" } }, cells)
			)
		),
		h("div", { style: { display: "flex", alignItems: "center", gap: "6px", fontSize: "10px", color: "var(--dsw-alias-label-caption, #98a1ad)", marginTop: "10px", justifyContent: "flex-end" } },
			h("span", null, HEAT_LESS),
			[0, 1, 2, 3, 4].map(function (l) { return h("span", { key: l, style: { width: "12px", height: "12px", borderRadius: "2px", background: mode === "all" ? HEAT_GREEN[l] : hexRgba(CATEGORY_COLOR[mode] || "#888", [0, 0.28, 0.5, 0.75, 1][l]) } }); }),
			h("span", null, HEAT_MORE)),
		h("div", { style: { fontWeight: 700, fontSize: "13px", margin: "18px 0 10px", display: "flex", alignItems: "center", gap: "8px" } },
			h("span", null, "排行榜"),
			h("span", { style: { fontWeight: 400, color: "var(--dsw-alias-label-caption, #98a1ad)", fontSize: "11px" } }, "做的最多的是什么")),
		h("div", { style: { display: "flex", flexDirection: "column", gap: "8px" } }, rankRows),
		tipEl
	);
}


function CategoriesView(props) {
			var useSession = props.useSession;
			var inspect = props.inspect;
			var onInspectDone = props.onInspectDone;
			var loadOlder = props.loadOlder;
			var inspection = useSession(function (snapshot) {
				return snapshot && snapshot.views ? snapshot.views.get("trajectory") ?? EMPTY_INSPECTION : EMPTY_INSPECTION;
			});
			var hasMore = useSession(function (snapshot) { return snapshot ? snapshot.hasMore === true : false; });
			var loadingOlder = useSession(function (snapshot) { return snapshot ? snapshot.loadingOlder === true : false; });
			var model = useMemo(function () { return buildModel(inspection); }, [inspection]);
			var openState = useState(function () { return ({}); });
			var open = openState[0];
			var setOpen = openState[1];
			var expandedState = useState(null);
			var expandedKey = expandedState[0];
			var setExpandedKey = expandedState[1];
			var filterState = useState("");
			var filter = filterState[0];
			var setFilter = filterState[1];
			var limitState = useState(function () { return ({}); });
			var limits = limitState[0];
			var setLimits = limitState[1];
		var dateFilterState = useState(null);
		var dateFilter = dateFilterState[0];
		var setDateFilter = dateFilterState[1];
		var heat = useMemo(function () { return buildHeatmap(model); }, [model]);


			var toggleOpen = useCallback(function (cat) {
				setOpen(function (prev) {
					var next = {};
					for (var k in prev) next[k] = prev[k];
					next[cat] = !prev[cat];
					return next;
				});
			}, []);
			var expandAll = useCallback(function () {
				var next = {};
				for (var c = 0; c < CATEGORY_ORDER.length; c++) next[CATEGORY_ORDER[c]] = true;
				setOpen(next);
			}, []);
			var collapseAll = useCallback(function () { setOpen({}); }, []);
			var showMore = useCallback(function (cat) {
				setLimits(function (prev) {
					var next = {};
					for (var k in prev) next[k] = prev[k];
					next[cat] = (prev[cat] ?? 40) + 100;
					return next;
				});
			}, []);
			// 响应聊天视图的 Inspect 一次性跳转：展开所属分类并定位到对应调用。
			useEffect(function () {
				if (!inspect || !inspect.callId || !model) return;
				var found = null;
				for (var c = 0; c < CATEGORY_ORDER.length && found === null; c++) {
					var cat = CATEGORY_ORDER[c];
					var list = model.categories[cat];
					for (var i = 0; i < list.length; i++) {
						if (list[i].callId === inspect.callId) { found = list[i]; break; }
					}
				}
				if (found !== null) {
					var cat2 = categorizeTool(found.name);
					setOpen(function (prev) { return { ...prev, [cat2]: true }; });
					setExpandedKey(found.key);
				}
				if (onInspectDone) onInspectDone();
			}, [inspect, model, onInspectDone]);

			var lowerFilter = filter.trim().toLowerCase();
			var filtered = useMemo(function () {
				if (lowerFilter === "") return model;
				var out = { categories: {}, totals: {}, toolTotal: model.toolTotal };
				for (var c = 0; c < CATEGORY_ORDER.length; c++) {
					var cat = CATEGORY_ORDER[c];
					var list = model.categories[cat];
					var kept = list.filter(function (entry) {
						return (entry.name ?? "").toLowerCase().includes(lowerFilter) ||
							(entry.text ?? "").toLowerCase().includes(lowerFilter) ||
							(entry.result ?? "").toLowerCase().includes(lowerFilter) ||
							(entry.argsRaw ?? "").toLowerCase().includes(lowerFilter);
					});
					out.categories[cat] = kept;
					out.totals[cat] = kept.length;
				}
				return out;
			}, [model, lowerFilter]);
		var dateFiltered = useMemo(function () {
			if (!dateFilter) return filtered;
			var out = { categories: {}, totals: {}, toolTotal: filtered.toolTotal };
			for (var c = 0; c < CATEGORY_ORDER.length; c++) {
				var cat = CATEGORY_ORDER[c];
				var list = filtered.categories[cat] || EMPTY_LIST;
				var kept = list.filter(function (e) { return dayKeyOf(e.time) === dateFilter; });
				out.categories[cat] = kept;
				out.totals[cat] = kept.length;
			}
			return out;
		}, [filtered, dateFilter]);


			var rowStyle = {
				display: "flex", alignItems: "center", gap: "8px", cursor: "pointer",
				padding: "3px 8px", borderRadius: "4px", minWidth: 0,
				font: "400 12px/18px var(--ds-font-family-code, ui-monospace, monospace)"
			};
			var rowHoverStyle = { background: "var(--dsw-alias-interactive-bg-hover, rgba(127,127,127,.12))" };
			var rowHoverState = useState(function () { return null; });
			var rowHover = rowHoverState[0];
			var setRowHover = rowHoverState[1];

			var preStyle = {
				margin: "0", padding: "6px 8px", borderRadius: "4px", overflow: "auto", maxHeight: "260px",
				background: "var(--dsw-alias-markdown-code-block, rgba(0,0,0,.06))",
				color: "var(--dsw-alias-label-primary, #1f2329)",
				font: "400 12px/18px var(--ds-font-family-code, ui-monospace, monospace)",
				whiteSpace: "pre-wrap", overflowWrap: "anywhere", tabSize: 2
			};
			var catHeaderStyle = {
				display: "flex", alignItems: "center", gap: "8px", padding: "6px 8px",
				borderRadius: "6px", cursor: "pointer", userSelect: "none",
				background: "var(--dsw-alias-bg-layer-2, rgba(127,127,127,.05))",
				border: "1px solid var(--dsw-alias-border-l1, rgba(127,127,127,.12))"
			};
			var chipStyle = {
				display: "inline-flex", alignItems: "center", gap: "6px", cursor: "pointer",
				padding: "4px 10px", borderRadius: "999px", border: "1px solid var(--dsw-alias-border-l1, rgba(127,127,127,.14))",
				background: "var(--dsw-alias-bg-layer-2, rgba(127,127,127,.05))",
				color: "var(--dsw-alias-label-primary, #1f2329)",
				font: "var(--dsw-font-xs-13, 12px/16px ui-sans-serif, system-ui)",
				userSelect: "none"
			};
			var badgeStyle = {
				flex: "none", minWidth: "18px", textAlign: "center", padding: "0 4px", borderRadius: "999px",
				fontSize: "11px", fontWeight: 700, color: "var(--dsw-alias-label-secondary, #5f6b7a)",
				background: "var(--dsw-alias-bg-module-platform, rgba(127,127,127,.12))"
			};
			var linkButtonStyle = {
				border: "0", background: "none", cursor: "pointer",
				color: "var(--dsw-alias-state-business-primary, #1f6feb)", fontSize: "12px", padding: "2px 4px", borderRadius: "4px"
			};

			function entryRow(entry, cat) {
				var active = expandedKey === entry.key;
				var statusLabel = entry.status === "running" ? STATUS_RUNNING : entry.status === "error" ? STATUS_ERROR : STATUS_OK;
				var statusColor = entry.status === "error" ? "var(--dsw-alias-state-error-primary, #e03131)" : entry.status === "running" ? "var(--dsw-alias-state-warn-label, #e8590c)" : "var(--dsw-alias-state-success-primary, #2f9e44)";
				var isTool = cat !== "messages" && cat !== "compaction";
				var name = isTool ? entry.name : cat === "compaction" ? MESSAGE_COMPACTION : entry.label === "assistant" ? MESSAGE_ASSISTANT : entry.label === "context" ? MESSAGE_CONTEXT : entry.label === "steering" ? MESSAGE_STEERING : MESSAGE_USER;
				var preview = cat === "messages" || cat === "compaction" ? shorten(entry.text ?? entry.result ?? "", 120) : argsPreview(entry.argsRaw);
				var loc = "";
				if (entry.turn !== null && entry.turn !== void 0) loc = "T" + entry.turn + (entry.step !== null && entry.step !== void 0 ? "·S" + entry.step : "");
				return h(react.Fragment, { key: entry.key },
					h("div", {
						style: { ...rowStyle, ...(rowHover === entry.key ? rowHoverStyle : {}) },
						onClick: function () { setExpandedKey(active ? null : entry.key); },
						onMouseEnter: function () { setRowHover(entry.key); },
						onMouseLeave: function () { setRowHover(null); },
						"data-entry": entry.key
					},
						h("span", { style: { flex: "none", color: "var(--dsw-alias-label-tertiary, #868e96)", fontVariantNumeric: "tabular-nums" } }, fmtTime(entry.time)),
						loc !== "" ? h("span", { style: { flex: "none", color: "var(--dsw-alias-label-tertiary, #868e96)", fontSize: "11px" } }, loc) : null,
						h("span", { style: { flex: "none", fontWeight: 600, color: "var(--dsw-alias-label-primary, #1f2329)", maxWidth: "180px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" } }, name),
						h("span", { style: { flex: "1", minWidth: 0, color: "var(--dsw-alias-label-secondary, #5f6b7a)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" } }, preview),
						isTool ? h("span", { style: { flex: "none", color: statusColor, fontSize: "11px", fontWeight: 600 } }, statusLabel) : null,
						h("span", { style: { flex: "none", color: "var(--dsw-alias-label-caption, #98a1ad)", fontSize: "11px" } }, active ? "▾" : "▸")
					),
					active ? h("div", { style: { margin: "0 8px 6px", padding: "8px 10px", borderRadius: "6px", background: "var(--dsw-alias-bg-layer-2, rgba(127,127,127,.06))", border: "1px solid var(--dsw-alias-border-l1, rgba(127,127,127,.14))", minWidth: 0 } },
						isTool ? [
							h("div", { key: "a", style: { color: "var(--dsw-alias-label-tertiary, #868e96)", fontSize: "11px", fontWeight: 600, marginBottom: "3px" } }, ARGS_LABEL),
							h("pre", { key: "ap", style: preStyle }, entry.argsRaw && entry.argsRaw.trim() !== "" ? entry.argsRaw : NO_ARGS),
							h("div", { key: "r", style: { color: "var(--dsw-alias-label-tertiary, #868e96)", fontSize: "11px", fontWeight: 600, margin: "8px 0 3px" } }, RESULT_LABEL),
							h("pre", { key: "rp", style: preStyle }, entry.result !== "" ? entry.result : NO_OUTPUT),
							entry.errorText !== "" ? h("div", { key: "e", style: { color: "var(--dsw-alias-state-error-primary, #e03131)", fontSize: "11px", fontWeight: 600, margin: "8px 0 3px" } }, ERROR_LABEL) : null,
							entry.errorText !== "" ? h("pre", { key: "ep", style: { ...preStyle, color: "var(--dsw-alias-state-error-primary, #e03131)" } }, entry.errorText) : null
						] : [
							h("div", { key: "c", style: { color: "var(--dsw-alias-label-tertiary, #868e96)", fontSize: "11px", fontWeight: 600, marginBottom: "3px" } }, RESULT_LABEL),
							h("pre", { key: "cp", style: preStyle }, entry.text ?? entry.result ?? NO_OUTPUT)
						]
					) : null
				);
			}

			var summaryChips = CATEGORY_ORDER.map(function (cat) {
				var count = dateFiltered.totals[cat];
				if (count === 0) return null;
				return h("button", {
					key: cat,
					style: { ...chipStyle, ...(open[cat] ? { borderColor: CATEGORY_COLOR[cat] } : {}) },
					onClick: function () { toggleOpen(cat); },
					title: CATEGORY_LABEL_ZH[cat]
				},
					h("span", { style: { width: "8px", height: "8px", borderRadius: "50%", background: CATEGORY_COLOR[cat], flex: "none" } }),
					h("span", null, CATEGORY_LABEL_ZH[cat]),
					h("span", { style: badgeStyle }, String(count))
				);
			}).filter(Boolean);
			var openBlocks = CATEGORY_ORDER.map(function (cat) {
				if (!open[cat]) return null;
				var list = dateFiltered.categories[cat];
				if (list.length === 0) return null;
				var limit = limits[cat] ?? 40;
				var visible = list.slice(0, limit);
				var remaining = list.length - visible.length;
				return h("div", { key: cat, style: { marginBottom: "10px", minWidth: 0 } },
					h("div", { style: { display: "flex", alignItems: "center", gap: "8px", padding: "4px 2px 6px" } },
						h("span", { style: { width: "10px", height: "10px", borderRadius: "3px", background: CATEGORY_COLOR[cat], flex: "none" } }),
						h("span", { style: { fontWeight: 600, color: "var(--dsw-alias-label-primary, #1f2329)", fontSize: "13px" } }, CATEGORY_LABEL_ZH[cat]),
						h("span", { style: badgeStyle }, String(list.length)),
						h("button", {
							style: { marginLeft: "auto", border: "0", background: "none", cursor: "pointer", color: "var(--dsw-alias-label-secondary, #5f6b7a)", fontSize: "12px", padding: "2px 6px", borderRadius: "4px" },
							onClick: function () { toggleOpen(cat); }
						}, COLLAPSE)
					),
					h("div", { style: { display: "flex", flexDirection: "column", gap: "2px" } },
						visible.map(function (entry) { return entryRow(entry, cat); }),
						remaining > 0 ? h("button", {
							style: { alignSelf: "flex-start", border: "0", background: "none", cursor: "pointer", color: "var(--dsw-alias-state-business-primary, #1f6feb)", fontSize: "12px", padding: "4px 8px" },
							onClick: function () { showMore(cat); }
						}, SHOW_MORE.replace("{count}", String(remaining))) : null
					)
				);
			}).filter(Boolean);

			return h("div", { style: { padding: "12px 14px 24px", minWidth: 0, height: "100%", overflowY: "auto", boxSizing: "border-box" } },
				h("div", { style: { display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", marginBottom: "6px" } },
					h("span", { style: { fontWeight: 700, fontSize: "14px", color: "var(--dsw-alias-label-primary, #1f2329)" } }, TAB_LABEL),
					h("input", {
						style: { marginLeft: "auto", minWidth: "160px", padding: "4px 8px", borderRadius: "6px", border: "1px solid var(--dsw-alias-border-l1, rgba(127,127,127,.18))", background: "var(--dsw-alias-bg-layer-2, rgba(127,127,127,.05))", color: "var(--dsw-alias-label-primary, #1f2329)", font: "var(--dsw-font-xs-13, 12px/16px ui-sans-serif, system-ui)" },
						value: filter,
						onChange: function (e) { setFilter(e.target.value); },
						placeholder: FILTER_PLACEHOLDER
					}),
					h("button", { style: linkButtonStyle, onClick: expandAll }, EXPAND_ALL),
					h("button", { style: linkButtonStyle, onClick: collapseAll }, COLLAPSE_ALL)
				),
				h("div", { style: { color: "var(--dsw-alias-label-caption, #98a1ad)", fontSize: "11px", lineHeight: "16px", marginBottom: "8px" } }, VIEW_NOTE),
				hasMore ? h("div", { style: { marginBottom: "8px" } },
					h("button", {
						style: { ...linkButtonStyle, border: "1px solid var(--dsw-alias-border-l1, rgba(127,127,127,.18))", padding: "4px 10px", borderRadius: "6px" },
						onClick: function () { if (loadOlder && !loadingOlder) loadOlder(); },
						disabled: loadingOlder
					}, loadingOlder ? LOADING : LOAD_OLDER)
				) : null,
						h("div", { style: { marginBottom: "14px" } }, h(HeatmapView, { heat: heat, dateFilter: dateFilter, setDateFilter: setDateFilter })),
		h("div", { style: { display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "12px" } }, summaryChips),

				h("div", null, openBlocks),
				h("div", { style: { color: "var(--dsw-alias-label-caption, #98a1ad)", fontSize: "11px", lineHeight: "16px", marginTop: "4px" } }, VIEW_DESCRIPTION)
			);
		}

		// ── plugin body ──────────────────────────────────────────────────────
		/**
		 * 所需服务：会话视图槽位 + 普通会话分页（加载更早记录）。
		 */
		var inject = ["slots", "sessions"];
		/**
		 * 客户端插件主体：注册轨迹分类视图标签页。注册挂在槽位服务的
		 * effect 包装上，插件卸载即移除标签页。纯增量 —— 原有
		 * "轨迹" 标签页（ui-trajectory）保持不动。
		 * @param ctx - 客户端根上下文。
		 */
		function apply(ctx) {
			ctx.slots.inject("conversation.view", function () {
				return ctx.slots.register({
					name: "conversation.view",
					id: "trajectory-categories",
					order: 20,
					label: function () { return TAB_LABEL; },
					inject: function (sessionId) {
						var session = ctx.sessions.binding(sessionId)?.session;
						if (session === void 0) throw new Error("ui-trajectory-categories: session \"" + sessionId + "\" is unavailable");
						return {
							loadOlder: async function () {
								var before = session.getSnapshot().views.get("trajectory");
								await session.loadOlder();
								return session.getSnapshot().views.get("trajectory") !== before;
							}
						};
					}
				}, CategoriesView);
			});
		}

		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});
