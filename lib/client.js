window.__ModuleLoader__.load({
	id: "dsh-client-ui-trajectory-categories",
	factory: (require) => {
		"use strict";
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });

		// ── imports ──────────────────────────────────────────────────────────
		var react = require("react");
		var useState = react.useState;
		var useMemo = react.useMemo;
		var useCallback = react.useCallback;
		var useEffect = react.useEffect;
		var useRef = react.useRef;
		var h = react.createElement;

		// ── UI strings (Chinese-first) ───────────────────────────────────────
		var TAB_LABEL = "分类";
		var VIEW_DESCRIPTION = "左侧「合计」为动作类型统计（点击展开该类记录）；右侧是一张思维导图画布：一次只展示一个问题（问题 → 方案 → 工具调用），打开时默认显示最新问题，其余问题在上方「问题画布」标签中切换，横轴即时间（越新越靠右）。按住左键任意位置拖动平移，滚轮直接缩放；内容块悬停高亮，鼠标靠近会有轻微排斥。点击问题展开/收起全部子流程，点击方案收起/展开其工具，点击工具块查看 AI 做了什么、输出、修改内容等详情。本视图为浏览器端本地聚合，不发起任何模型请求，不额外消耗 token。";
		var VIEW_NOTE = "画布操作：左键拖动平移 · 滚轮缩放 · 点击问题/方案收起展开 · 点击工具块查看详情。数据来自轨迹投影（ui-trajectory）。";
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
		var TOTAL_LABEL = "合计";
		var FLOW_PROBLEM = "问题";
		var FLOW_ATTEMPT = "方案";
		var FLOW_ERROR = "报错";
		var FLOW_WORKING = "工作中";
		var FLOW_DONE = "完成";
		var FLOW_NO_ATTEMPT = "（暂无尝试）";
		var FLOW_NO_REPLY = "（无文本回复）";
		var FLOW_STEP_DETAIL = "调用详情";
		var CANVAS_HINT = "左键拖动平移 · 滚轮缩放 · 点击节点看详情";
		var ZOOM_RESET = "100%";
		var ZOOM_IN = "＋";
		var ZOOM_OUT = "－";
		/** 分类的中文显示名（固定中文）。 */
		var CATEGORY_LABEL_ZH = {
			write: "写入",
			read: "读取",
			delete: "删除",
			download: "下载",
			command: "命令",
			search: "搜索",
			subagent: "子代理",
			other: "其他工具",
			messages: "消息",
			compaction: "压缩"
		};
		/** 子流程步骤的动作类型中文名（与分类一致）。 */
		var ACTION_LABEL = CATEGORY_LABEL_ZH;

		// ── categorization ───────────────────────────────────────────────────
		var CATEGORY_ORDER = ["write", "read", "delete", "download", "command", "search", "subagent", "other", "messages", "compaction"];
		var CATEGORY_COLOR = {
			write: "var(--dsw-alias-state-success-primary, #2f9e44)",
			read: "var(--dsw-alias-state-business-primary, #1f6feb)",
			delete: "#c92a2a",
			download: "#9c36b5",
			command: "var(--dsw-alias-state-warn-label, #e8590c)",
			search: "#0ca678",
			subagent: "#d6336c",
			other: "var(--dsw-alias-label-tertiary, #868e96)",
			messages: "#5c7cfa",
			compaction: "#b08968"
		};
		var COLOR_DONE = "var(--dsw-alias-state-success-primary, #2f9e44)";
		var COLOR_ERROR = "var(--dsw-alias-state-error-primary, #e03131)";
		var COLOR_RUNNING = "var(--dsw-alias-state-warn-label, #e8590c)";
		var COLOR_LINE = "var(--dsw-alias-border-l2, rgba(127,127,127,.32))";
		// ── 热力图 / 排行榜 文案与工具（移植自 PR #1，适配当前画布版）────────────
		var HEAT_LESS = "少";
		var HEAT_MORE = "多";
		var HEAT_ALL = "总览";
		var HEAT_NONE = "无动作";
		var HEAT_TOTAL = "合计";
		var DATE_CHIP_PREFIX = "已选";
		var DATE_CHIP_SUFFIX = "次动作";
		/** 两位补零（避免依赖 padStart）。 */
		function pad2(n) { return n < 10 ? "0" + n : "" + n; }
		/** 本地日 key（YYYY-MM-DD）。 */
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
		function categorizeTool(name) {
			var n = String(name ?? "").toLowerCase();
			if (/(写入|写文件|编辑|修改|创建|新建|追加|插入|替换|修补|覆盖|截断|清空|保存|write|edit|str[-_]?replace|apply[-_]?patch|patch|append|insert|mkdir|create|touch|save|chmod|chown|truncate|copy)/.test(n)) return "write";
			if (/(删除|移除|清理|卸载|清掉|delete|remove|rm\b|unlink|del\b)/.test(n)) return "delete";
			if (/(读取|读文件|查看|打开|列出|浏览|预览|查找|搜索文件|全局搜索|正则|read|cat\b|view|glob|grep|list|ls\b|head|tail|stat|open|fs[-_]?read|fs[-_]?search|read[-_]?image)/.test(n)) return "read";
			if (/(下载|抓取|拉取|获取链接|保存链接|download|fetch|curl|wget|get[-_]?url|web[-_]?fetch|save[-_]?url|download[-_]?file)/.test(n)) return "download";
			if (/(命令|执行|运行|终端|命令行|脚本|进程|bash|pwsh|shell|terminal|exec|run[-_]?command|cmdline|powershell|native[-_]?command|code[-_]?execution)/.test(n)) return "command";
			if (/(搜索|查询|询问|提问|联网搜索|search|query|lookup|web[-_]?search|ask[-_]?user|ask_question)/.test(n)) return "search";
			if (/(子代理|子任务|委派|派生|分派|subagent|agent|spawn|delegate|fork|interrupt[-_]?agent|send[-_]?message|list[-_]?agents|subagent[-_]?control)/.test(n)) return "subagent";
			return "other";
		}

		// ── text helpers ─────────────────────────────────────────────────────
		var EMPTY_LIST = [];
		var EMPTY_INSPECTION = {
			eventNodes: EMPTY_LIST,
			eventLocations: new Map(),
			requests: EMPTY_LIST,
			runningCalls: EMPTY_LIST
		};
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
		function assistantText(node) {
			var blocks = node.blocks;
			if (!Array.isArray(blocks)) return "";
			var text = blocks.filter(function (b) { return b && (b.kind === "text" || b.kind === "reasoning") && typeof b.text === "string" && b.text !== ""; }).map(function (b) { return b.text; }).join("\n");
			if (text !== "") return text;
			var calls = blocks.filter(function (b) { return b && b.kind === "tool-call"; });
			if (calls.length > 0) return "[仅工具调用] " + calls.map(function (b) { return b.name; }).join(", ");
			return "";
		}
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
			var target = firstString(parsed, ["file_path", "path", "filePath", "target", "url", "uri", "command", "cmd", "query", "q", "search", "name"]);
			if (target !== "") return shorten(target, 120);
			try { return shorten(JSON.stringify(parsed), 120); } catch { return ""; }
		}
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
		function shorten(value, max) {
			if (typeof value !== "string") value = String(value ?? "");
			if (value.length <= max) return value;
			return value.slice(0, max) + "…";
		}
		/** 从工具参数提取"AI 做了什么"的可读摘要（中文语境）。 */
		function toolSummary(tool) {
			var lines = [];
			var parsed = null;
			if (typeof tool.argsRaw === "string" && tool.argsRaw.trim() !== "") {
				try { parsed = JSON.parse(tool.argsRaw); } catch { parsed = null; }
			} else if (tool.argsRaw && typeof tool.argsRaw === "object") {
				parsed = tool.argsRaw;
			}
			if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
				var fp = parsed.file_path || parsed.path || parsed.filePath || parsed.target || parsed.directory;
				if (typeof fp === "string" && fp !== "") lines.push("文件：" + fp);
				if (typeof parsed.old_string === "string" && typeof parsed.new_string === "string") {
					lines.push("修改：" + shorten(parsed.old_string, 36) + " → " + shorten(parsed.new_string, 36));
				} else if (typeof parsed.content === "string" && parsed.content !== "") {
					lines.push("内容：" + shorten(parsed.content, 60));
				}
				if (typeof parsed.command === "string" && parsed.command !== "") lines.push("命令：" + shorten(parsed.command, 90));
				if (typeof parsed.query === "string" && parsed.query !== "") lines.push("查询：" + shorten(parsed.query, 90));
				if (typeof parsed.url === "string" && parsed.url !== "") lines.push("地址：" + shorten(parsed.url, 90));
				if (typeof parsed.description === "string" && parsed.description !== "") lines.push("说明：" + shorten(parsed.description, 60));
				if (typeof parsed.url === "string" && typeof parsed.file_path === "string") lines.push("保存到：" + parsed.file_path);
			}
			if (lines.length === 0) lines.push("动作：" + tool.name);
			return lines;
		}
		/** 提取"修改内容"（old → new），无则返回 null。 */
		function toolModified(tool) {
			var parsed = null;
			if (typeof tool.argsRaw === "string" && tool.argsRaw.trim() !== "") {
				try { parsed = JSON.parse(tool.argsRaw); } catch { parsed = null; }
			}
			if (parsed && typeof parsed.old_string === "string" && typeof parsed.new_string === "string") {
				return { old: parsed.old_string, new: parsed.new_string };
			}
			return null;
		}
		function fmtTime(ms) {
			if (typeof ms !== "number" || !Number.isFinite(ms)) return "—";
			try { return new Date(ms).toLocaleTimeString([], { hour12: false }); } catch { return String(ms); }
		}
		function locationOf(eventLocations, seq) {
			var loc = eventLocations && eventLocations.get(seq);
			if (!loc) return { turn: null, step: null };
			if (loc.kind === "step") return { turn: loc.turn?.turn ?? null, step: loc.step?.step ?? null };
			if (loc.kind === "turn") return { turn: loc.turn?.turn ?? null, step: null };
			return { turn: null, step: null };
		}

		// ── model builder（分类统计）──────────────────────────────────────────
		function buildModel(inspection) {
			var categories = { write: [], read: [], delete: [], download: [], command: [], search: [], subagent: [], other: [], messages: [], compaction: [] };
			var totals = { write: 0, read: 0, delete: 0, download: 0, command: 0, search: 0, subagent: 0, other: 0, messages: 0, compaction: 0 };
			if (!inspection || typeof inspection !== "object") return { categories, totals, toolTotal: 0 };
			var nodes = inspection.eventNodes ?? EMPTY_LIST;
			var eventLocations = inspection.eventLocations ?? new Map();
			var requests = inspection.requests ?? EMPTY_LIST;
			var runningCalls = inspection.runningCalls ?? EMPTY_LIST;
			for (var i = 0; i < nodes.length; i++) {
				var node = nodes[i];
				if (!node || typeof node !== "object") continue;
				var kind = node.kind;
				if (kind === "user" || kind === "context" || kind === "steering") {
					categories.messages.push({
						key: "msg:" + String(node.seq),
						label: kind,
						seq: node.seq,
						time: node.time,
						turn: locationOf(eventLocations, node.seq).turn,
						step: locationOf(eventLocations, node.seq).step,
						text: shorten(messageText(node.content), 200)
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

		// ── heatmap builder（按天聚合分类计数，移植自 PR #1）────────────────────
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

		// ── flow builder（问题 → 方案 → 报错 → … → 完成）───────────────────────
		function buildFlow(inspection) {
			var problems = [];
			var current = null;
			var attempt = null;
			var attemptCount = 0;
			if (!inspection || typeof inspection !== "object") return problems;
			var nodes = inspection.eventNodes ?? EMPTY_LIST;
			var runningCalls = inspection.runningCalls ?? EMPTY_LIST;
			var requests = inspection.requests ?? EMPTY_LIST;
			var requestByStep = new Map();
			for (var ri = 0; ri < requests.length; ri++) {
				var req = requests[ri];
				if (req && req.purpose === "assistant" && req.turn !== void 0) requestByStep.set(String(req.turn) + "\u0000" + String(req.step), req);
			}
			function ensureProblem(seq, time, text) {
				if (current === null) {
					attemptCount = 0;
					current = { seq: seq ?? 0, time: time ?? null, text: text ?? "", notes: [], attempts: [] };
					problems.push(current);
				}
				return current;
			}
			function startAttempt(node) {
				attemptCount += 1;
				attempt = {
					number: attemptCount,
					seq: node && node.seq !== void 0 ? node.seq : 0,
					time: node && node.time !== void 0 ? node.time : null,
					reply: "",
					tools: [],
					error: null,
					running: false
				};
			}
			function closeAttempt() {
				if (attempt !== null) {
					current.attempts.push(attempt);
					attempt = null;
				}
			}
			for (var i = 0; i < nodes.length; i++) {
				var node = nodes[i];
				if (!node || typeof node !== "object") continue;
				var kind = node.kind;
				if (kind === "user") {
					if (attempt !== null) closeAttempt();
					attemptCount = 0;
					current = { seq: node.seq, time: node.time, text: messageText(node.content), notes: [], attempts: [] };
					problems.push(current);
					continue;
				}
				if (kind === "context" || kind === "steering") {
					if (attempt !== null) closeAttempt();
					ensureProblem(node.seq, node.time, "");
					current.notes.push({ kind, seq: node.seq, time: node.time, text: shorten(messageText(node.content), 200) });
					continue;
				}
				if (kind === "assistant") {
					ensureProblem(node.seq, node.time, "");
					if (attempt === null) startAttempt(node);
					var text = assistantText(node);
					if (text !== "") attempt.reply = attempt.reply === "" ? text : attempt.reply + "\n" + text;
					if (node.turn !== void 0 && node.step !== void 0 && attempt.error === null) {
						var stepReq = requestByStep.get(String(node.turn) + "\u0000" + String(node.step));
						if (stepReq && stepReq.status === "error") attempt.error = { source: "assistant", tool: "", message: stepReq.error ?? "error" };
					}
					continue;
				}
				if (kind === "tool-result") {
					ensureProblem(node.seq, node.time, "");
					if (attempt === null) startAttempt(node);
					attempt.tools.push({
						key: "tool:" + String(node.seq),
						callId: node.callId,
						name: node.call?.name ?? "tool",
						argsRaw: node.call?.argsRaw ?? "",
						time: node.time,
						status: node.isError === true ? "error" : "ok",
						errorText: node.isError ? String(node.error?.code ?? node.error?.name ?? "error") : "",
						result: resultText(node),
						action: categorizeTool(node.call?.name ?? "tool")
					});
					if (node.isError === true) {
						if (attempt.error === null) attempt.error = { source: "tool", tool: node.call?.name ?? "tool", message: String(node.error?.code ?? node.error?.name ?? "error") };
						closeAttempt();
					}
					continue;
				}
			}
			for (var r = 0; r < runningCalls.length; r++) {
				var run = runningCalls[r];
				if (!run || typeof run !== "object") continue;
				ensureProblem(run.seq, run.time, "");
				if (attempt === null) startAttempt(run);
				attempt.tools.push({
					key: "run:" + String(run.callId),
					callId: run.callId,
					name: run.name ?? "tool",
					argsRaw: run.argsRaw ?? "",
					time: run.time,
					status: "running",
					errorText: "",
					result: "",
					action: categorizeTool(run.name ?? "tool")
				});
				attempt.running = true;
			}
			if (current !== null) closeAttempt();
			for (var p = 0; p < problems.length; p++) {
				var pr = problems[p];
				pr.delivered = false;
				if (pr.attempts.length > 0) {
					var last = pr.attempts[pr.attempts.length - 1];
					pr.delivered = last.error === null;
				}
			}
			return problems;
		}

		// ── HeatmapView 组件（GitHub 风格贡献热力图 + 分类排行榜，移植自 PR #1）─
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
			var _h1 = useState("all");
			var mode = _h1[0];
			var setMode = _h1[1];
			var _h2 = useState(null);
			var tip = _h2[0];
			var setTip = _h2[1];

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

		// ── the view component（思维导图画布：缩放 + 任意位置拖动 + 排斥 + 高亮）─
		function CategoriesView(props) {
			var useSession = props.useSession;
			var loadOlder = props.loadOlder;
			var inspection = useSession(function (snapshot) {
				return snapshot && snapshot.views ? snapshot.views.get("trajectory") ?? EMPTY_INSPECTION : EMPTY_INSPECTION;
			});
			var hasMore = useSession(function (snapshot) { return snapshot ? snapshot.hasMore === true : false; });
			var loadingOlder = useSession(function (snapshot) { return snapshot ? snapshot.loadingOlder === true : false; });
			var model = useMemo(function () { return buildModel(inspection); }, [inspection]);
			var problems = useMemo(function () { return buildFlow(inspection); }, [inspection]);
			// 当前画布显示的问题索引（一个画布只显示一个问题，其余在画布选项中切换）
			// null = 自动跟随最新问题（打开分类页默认显示最新，点标签后固定）
			var _st12 = useState(null);
			var activeP = _st12[0];
			var setActiveP = _st12[1];
			var ap = activeP === null ? Math.max(0, problems.length - 1) : Math.min(activeP, Math.max(0, problems.length - 1));
			// 画布内容尺寸（绝对定位坐标系；一次只展示一个问题，内容大小按该问题计算）
			var layout = useMemo(function () {
				var zoneTops = [];
				var heights = [];
				var contentWs = [];
				for (var p = 0; p < problems.length; p++) {
					var pr = problems[p];
					var zoneH = Math.max(380, pr.attempts.length * 170 + 150);
					// 每个问题都是独立的画布坐标系（原点在左上角），切换时互不影响
					zoneTops.push(0);
					heights.push(zoneH);
					var maxW = 860;
					for (var a = 0; a < pr.attempts.length; a++) {
						var spread = Math.max(320, pr.attempts[a].tools.length * 168);
						var w = 340 + 148 + 30 + spread + 150;
						if (w > maxW) maxW = w;
					}
					contentWs.push(maxW);
				}
				var idx = Math.min(ap, problems.length - 1);
				return {
					zoneTops: zoneTops,
					heights: heights,
					contentWs: contentWs,
					contentW: problems.length ? contentWs[idx] : 860,
					contentH: problems.length ? heights[idx] + 24 : 380
				};
			}, [problems, ap]);
			var contentW = layout.contentW;
			var _st1 = useState(function () { return ({}); });
			var openChips = _st1[0];
			var setOpenChips = _st1[1];
			var _st2 = useState(null);
			var expandedEntry = _st2[0];
			var setExpandedEntry = _st2[1];
			var _st3 = useState(function () { return ({}); });
			var limits = _st3[0];
			var setLimits = _st3[1];
			var _st4 = useState("");
			var filter = _st4[0];
			var setFilter = _st4[1];
			var _st5 = useState(function () { return ({}); });
			var openAttempts = _st5[0];
			var setOpenAttempts = _st5[1];
			var _st6 = useState(null);
			var expandedTool = _st6[0];
			var setExpandedTool = _st6[1];
			// 画布视图状态：平移 + 缩放
			var _st7 = useState(function () { return { x: 30, y: 16, z: 1 }; });
			var view = _st7[0];
			var setView = _st7[1];
			// 光标位置（内容坐标，rAF 节流）用于排斥效果
			var _st8 = useState(function () { return { x: -9999, y: -9999, active: false }; });
			var cursor = _st8[0];
			var setCursor = _st8[1];
			var cursorPending = useRef(null);
			var cursorRaf = useRef(0);
			var canvasRef = useRef(null);
			var panDrag = useRef(null);
			var _st9 = useState(null);
			var hoverId = _st9[0];
			var setHoverId = _st9[1];
			// 节点位置（可拖动；拖父节点时子节点一起平移，线条随节点边缘连接）
			var _st10 = useState(function () { return buildInitialPositions(); });
			var nodePos = _st10[0];
			var setNodePos = _st10[1];
			var nodeDrag = useRef(null);
			/** 记录上一次指针交互是否发生了拖动（区分「点击」与「拖拽」，供 onClick 判断）。 */
			var lastDragMoved = useRef(false);
			// 引导线动画状态（线条弹性追随节点边缘 = 线条惯性）
			var _st11 = useState({});
			var lineState = _st11[0];
			var setLineState = _st11[1];
			var lineTargetsRef = useRef({});
			var lineAnimRef = useRef({});
			// 热力图 / 排行榜（移植自 PR #1）：选中日期用于过滤合计面板
			var _st13 = useState(null);
			var dateFilter = _st13[0];
			var setDateFilter = _st13[1];
			var heat = useMemo(function () { return buildHeatmap(model); }, [model]);
			// 热力图收纳：默认收起，点击标题栏展开/收起（避免与画布抢空间）
			var _st14 = useState(false);
			var heatOpen = _st14[0];
			var setHeatOpen = _st14[1];
			// 按下反馈：点击节点时轻微缩放（动画）
			var _st15 = useState(null);
			var pressedKey = _st15[0];
			var setPressedKey = _st15[1];
			/** 拖动组：问题 → 其下所有方案与工具；方案 → 其工具；工具 → 自身。 */
			function groupKeysFor(key) {
				if (key.charAt(0) === "p" && key.indexOf(":") === -1) {
					var seq = key.slice(1);
					var keys = [key];
					for (var pi = 0; pi < problems.length; pi++) {
						var pr = problems[pi];
						if (String(pr.seq) !== seq) continue;
						for (var ai = 0; ai < pr.attempts.length; ai++) {
							var att = pr.attempts[ai];
							var aKey = "p" + seq + ":a" + String(att.number);
							keys.push(aKey);
							for (var ti = 0; ti < att.tools.length; ti++) keys.push(aKey + "::" + att.tools[ti].key);
						}
					}
					return keys;
				}
				if (key.indexOf(":a") !== -1 && key.indexOf("::") === -1) {
					var parts = key.split(":a");
					var pSeq = parts[0].slice(1);
					var aNum = parts[1];
					var keys2 = [key];
					for (var pj = 0; pj < problems.length; pj++) {
						var prj = problems[pj];
						if (String(prj.seq) !== pSeq) continue;
						for (var aj = 0; aj < prj.attempts.length; aj++) {
							var attj = prj.attempts[aj];
							if (String(attj.number) !== aNum) continue;
							for (var tj = 0; tj < attj.tools.length; tj++) keys2.push(key + "::" + attj.tools[tj].key);
						}
					}
					return keys2;
				}
				return [key];
			}
			function startNodeDrag(e, key) {
				e.stopPropagation();
				if (e.button !== 0) return;
				var base = {};
				for (var k in nodePos) base[k] = nodePos[k];
				nodeDrag.current = { key: key, startX: e.clientX, startY: e.clientY, base: base, moved: false };
				setPressedKey(key);
				try { e.currentTarget.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
			}
			function moveNodeDrag(e) {
				var d = nodeDrag.current;
				if (!d) return;
				var dx = e.clientX - d.startX;
				var dy = e.clientY - d.startY;
				if (!d.moved && Math.abs(dx) + Math.abs(dy) > 3) d.moved = true;
				if (!d.moved) return;
				var keys = groupKeysFor(d.key);
				setNodePos(function (prev) {
					var next = {};
					for (var k in prev) next[k] = prev[k];
					for (var i = 0; i < keys.length; i++) {
						var kk = keys[i];
						var b = d.base[kk];
						if (b) next[kk] = { x: b.x + dx, y: b.y + dy };
					}
					return next;
				});
			}
			function endNodeDrag() {
				if (nodeDrag.current) lastDragMoved.current = nodeDrag.current.moved;
				nodeDrag.current = null;
				setPressedKey(null);
			}
			/** 按下缩放：节点 transform 拼接 scale（点击时从 1 → 0.94，松手恢复）。 */
			function pressScale(key, baseTransform) {
				return key !== null && key === pressedKey ? baseTransform + " scale(0.94)" : baseTransform;
			}

			var toggleChip = useCallback(function (cat) {
				setOpenChips(function (prev) {
					var next = {};
					for (var k in prev) next[k] = prev[k];
					next[cat] = !prev[cat];
					return next;
				});
			}, []);
			var showMore = useCallback(function (cat) {
				setLimits(function (prev) {
					var next = {};
					for (var k in prev) next[k] = prev[k];
					next[cat] = (prev[cat] ?? 40) + 100;
					return next;
				});
			}, []);
			var toggleAttempt = useCallback(function (key) {
				if (panDrag.current && panDrag.current.moved) return;
				setOpenAttempts(function (prev) {
					var next = {};
					for (var k in prev) next[k] = prev[k];
					next[key] = !prev[key];
					return next;
				});
			}, []);
			/** 点击守卫：上次指针交互若为拖动则忽略本次 click（pointer capture 会把 click 重定向到 wrapper）。 */
			function tapGuard() {
				var m = lastDragMoved.current;
				lastDragMoved.current = false;
				return m;
			}

			// ── 画布交互：任意位置左键拖动平移、滚轮缩放 ──────────
			function contentPoint(e) {
				var box = canvasRef.current;
				if (!box) return null;
				var rect = box.getBoundingClientRect();
				return {
					x: (e.clientX - rect.left - view.x) / view.z,
					y: (e.clientY - rect.top - view.y) / view.z
				};
			}
			function scheduleCursor(pt, active) {
				cursorPending.current = { x: pt.x, y: pt.y, active: active };
				if (cursorRaf.current) return;
				cursorRaf.current = requestAnimationFrame(function () {
					cursorRaf.current = 0;
					var p = cursorPending.current;
					if (p) setCursor(p);
				});
			}
			function canvasPointerDown(e) {
				if (e.button !== 0) return;
				panDrag.current = { startX: e.clientX, startY: e.clientY, vx: view.x, vy: view.y, moved: false };
				try { e.currentTarget.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
			}
			function canvasPointerMove(e) {
				var pt = contentPoint(e);
				if (!pt) return;
				var d = panDrag.current;
				scheduleCursor(pt, d === null);
				if (d && !d.moved) {
					var dist = Math.abs(e.clientX - d.startX) + Math.abs(e.clientY - d.startY);
					if (dist > 4) d.moved = true;
				}
				if (d && d.moved) {
					setView(function (v) {
						return { x: d.vx + (e.clientX - d.startX), y: d.vy + (e.clientY - d.startY), z: v.z };
					});
				}
			}
			function canvasPointerUp() {
				panDrag.current = null;
			}
			function canvasPointerLeave() {
				panDrag.current = null;
				setCursor(function (c) { return c.active ? { x: -9999, y: -9999, active: false } : c; });
			}
			function canvasWheel(e) {
				e.preventDefault();
				var box = canvasRef.current;
				if (!box) return;
				var rect = box.getBoundingClientRect();
				var px = e.clientX - rect.left;
				var py = e.clientY - rect.top;
				// 滚轮直接缩放（以鼠标位置为锚点）
				var factor = e.deltaY < 0 ? 1.12 : 1 / 1.12;
				setView(function (v) {
					var nz = Math.min(2.6, Math.max(0.35, v.z * factor));
					var k = nz / v.z;
					return { x: px - (px - v.x) * k, y: py - (py - v.y) * k, z: nz };
				});
			}
			// 原生 wheel 监听（passive:false，避免 React passive 警告，保证 preventDefault 生效）
			useEffect(function () {
				var el = canvasRef.current;
				if (!el) return undefined;
				function onNativeWheel(ev) { canvasWheel(ev); }
				el.addEventListener("wheel", onNativeWheel, { passive: false });
				return function () { el.removeEventListener("wheel", onNativeWheel); };
			}, []);
			function zoomBy(factor) {
				setView(function (v) {
					var nz = Math.min(2.6, Math.max(0.35, v.z * factor));
					return { x: v.x, y: v.y, z: nz };
				});
			}
			/** 排斥效果：光标靠近块时轻微推开（内容坐标）。 */
			function repelFor(x, y, w, h) {
				if (!cursor.active) return "translate(0px, 0px)";
				var cx = x + w / 2;
				var cy = y + h / 2;
				var dx = cx - cursor.x;
				var dy = cy - cursor.y;
				var dist = Math.sqrt(dx * dx + dy * dy);
				var R = 130;
				if (dist >= R || dist === 0) return "translate(0px, 0px)";
				var f = (1 - dist / R) * 12;
				return "translate(" + ((dx / dist) * f).toFixed(1) + "px," + ((dy / dist) * f).toFixed(1) + "px)";
			}
			var blockTransition = "transform .16s ease-out";

			var lowerFilter = filter.trim().toLowerCase();
			var filtered = useMemo(function () {
				if (lowerFilter === "") return model;
				var out = { categories: {}, totals: {}, toolTotal: model.toolTotal };
				for (var c = 0; c < CATEGORY_ORDER.length; c++) {
					var cat = CATEGORY_ORDER[c];
					var list = model.categories[cat];
					out.categories[cat] = list.filter(function (entry) {
						return (entry.name ?? "").toLowerCase().includes(lowerFilter) ||
							(entry.text ?? "").toLowerCase().includes(lowerFilter) ||
							(entry.result ?? "").toLowerCase().includes(lowerFilter) ||
							(entry.argsRaw ?? "").toLowerCase().includes(lowerFilter);
					});
					out.totals[cat] = out.categories[cat].length;
				}
				return out;
			}, [model, lowerFilter]);
			// 按选中日期二次过滤（热力图联动合计面板）
			var dateFiltered = useMemo(function () {
				if (!dateFilter) return filtered;
				var out = { categories: {}, totals: {}, toolTotal: filtered.toolTotal };
				for (var dc = 0; dc < CATEGORY_ORDER.length; dc++) {
					var dcat = CATEGORY_ORDER[dc];
					var dlist = filtered.categories[dcat] || EMPTY_LIST;
					var kept = dlist.filter(function (e) { return dayKeyOf(e.time) === dateFilter; });
					out.categories[dcat] = kept;
					out.totals[dcat] = kept.length;
				}
				return out;
			}, [filtered, dateFilter]);

			var preStyle = {
				margin: "0", padding: "6px 8px", borderRadius: "6px", overflow: "auto", maxHeight: "220px",
				background: "var(--dsw-alias-markdown-code-block, rgba(0,0,0,.06))",
				color: "var(--dsw-alias-label-primary, #1f2329)",
				font: "400 12px/18px var(--ds-font-family-code, ui-monospace, monospace)",
				whiteSpace: "pre-wrap", overflowWrap: "anywhere", tabSize: 2
			};
			var badgeBase = {
				flex: "none", fontSize: "11px", fontWeight: 700, borderRadius: "999px", padding: "0 6px", lineHeight: "16px", border: "1px solid"
			};
			var linkButtonStyle = {
				border: "0", background: "none", cursor: "pointer",
				color: "var(--dsw-alias-state-business-primary, #1f6feb)", fontSize: "12px", padding: "2px 4px", borderRadius: "4px"
			};

			// ── 合计面板 ────────────────────────────────────────────────
			var chips = CATEGORY_ORDER.map(function (cat) {
				var count = dateFiltered.totals[cat];
				if (count === 0) return null;
				return h("button", {
					key: cat,
					style: {
						display: "inline-flex", alignItems: "center", gap: "6px", cursor: "pointer",
						padding: "3px 10px", borderRadius: "999px", border: "1px solid " + (openChips[cat] ? CATEGORY_COLOR[cat] : "var(--dsw-alias-border-l1, rgba(127,127,127,.16))"),
						background: "var(--dsw-alias-bg-layer-2, rgba(127,127,127,.06))",
						color: "var(--dsw-alias-label-primary, #1f2329)", fontSize: "12px", userSelect: "none"
					},
					onClick: function () { toggleChip(cat); },
					title: CATEGORY_LABEL_ZH[cat]
				},
					h("span", { style: { width: "8px", height: "8px", borderRadius: "50%", background: CATEGORY_COLOR[cat], flex: "none" } }),
					h("span", null, CATEGORY_LABEL_ZH[cat]),
					h("span", { style: { color: "var(--dsw-alias-label-tertiary, #868e96)", fontWeight: 700 } }, String(count))
				);
			}).filter(Boolean);

			function entryRow(entry, cat) {
				var active = expandedEntry === entry.key;
				var isTool = cat !== "messages" && cat !== "compaction";
				var statusColor = entry.status === "error" ? COLOR_ERROR : entry.status === "running" ? COLOR_RUNNING : COLOR_DONE;
				var name = isTool ? entry.name : cat === "compaction" ? MESSAGE_COMPACTION : entry.label === "assistant" ? MESSAGE_ASSISTANT : entry.label === "context" ? MESSAGE_CONTEXT : entry.label === "steering" ? MESSAGE_STEERING : MESSAGE_USER;
				var preview = cat === "messages" || cat === "compaction" ? shorten(entry.text ?? entry.result ?? "", 120) : argsPreview(entry.argsRaw);
				return h(react.Fragment, { key: entry.key },
					h("div", {
						style: {
							display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", padding: "3px 6px", borderRadius: "4px", minWidth: "0",
							background: active ? "var(--dsw-alias-interactive-bg-active, rgba(127,127,127,.14))" : "transparent",
							font: "400 12px/18px var(--ds-font-family-code, ui-monospace, monospace)"
						},
						onClick: function () { setExpandedEntry(active ? null : entry.key); }
					},
						h("span", { style: { flex: "none", color: "var(--dsw-alias-label-tertiary, #868e96)", fontVariantNumeric: "tabular-nums" } }, fmtTime(entry.time)),
						h("span", { style: { flex: "none", fontWeight: 600, maxWidth: "150px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "var(--dsw-alias-label-primary, #1f2329)" } }, name),
						h("span", { style: { flex: "1", minWidth: "0", color: "var(--dsw-alias-label-secondary, #5f6b7a)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" } }, preview),
						isTool ? h("span", { style: { ...badgeBase, borderColor: statusColor, color: statusColor } }, entry.status === "error" ? STATUS_ERROR : entry.status === "running" ? STATUS_RUNNING : STATUS_OK) : null,
						h("span", { style: { color: "var(--dsw-alias-label-caption, #98a1ad)", fontSize: "11px" } }, active ? "▾" : "▸")
					),
					active ? h("div", { style: { margin: "0 6px 6px", padding: "8px 10px", borderRadius: "6px", background: "var(--dsw-alias-bg-layer-2, rgba(127,127,127,.06))", border: "1px solid var(--dsw-alias-border-l1, rgba(127,127,127,.14))", animation: "dsh-pop-down .2s cubic-bezier(.2,.8,.3,1.05) both" } },
						isTool ? [
							h("div", { key: "a", style: { color: "var(--dsw-alias-label-tertiary, #868e96)", fontSize: "11px", fontWeight: 600, marginBottom: "3px" } }, ARGS_LABEL),
							h("pre", { key: "ap", style: preStyle }, entry.argsRaw && entry.argsRaw.trim() !== "" ? entry.argsRaw : NO_ARGS),
							h("div", { key: "r", style: { color: "var(--dsw-alias-label-tertiary, #868e96)", fontSize: "11px", fontWeight: 600, margin: "8px 0 3px" } }, RESULT_LABEL),
							h("pre", { key: "rp", style: preStyle }, entry.result !== "" ? entry.result : NO_OUTPUT),
							entry.errorText !== "" ? h("div", { key: "e", style: { color: COLOR_ERROR, fontSize: "11px", fontWeight: 600, margin: "8px 0 3px" } }, ERROR_LABEL) : null,
							entry.errorText !== "" ? h("pre", { key: "ep", style: { ...preStyle, color: COLOR_ERROR } }, entry.errorText) : null
						] : [
							h("div", { key: "c", style: { color: "var(--dsw-alias-label-tertiary, #868e96)", fontSize: "11px", fontWeight: 600, marginBottom: "3px" } }, RESULT_LABEL),
							h("pre", { key: "cp", style: preStyle }, entry.text ?? entry.result ?? NO_OUTPUT)
						]
					) : null
				);
			}

			var anyChipOpen = false;
			for (var ck in openChips) if (openChips[ck]) { anyChipOpen = true; break; }
			var openChipBlocks = CATEGORY_ORDER.map(function (cat) {
				if (!openChips[cat]) return null;
				var list = dateFiltered.categories[cat];
				if (list.length === 0) return null;
				var limit = limits[cat] ?? 40;
				var visible = list.slice(0, limit);
				var remaining = list.length - visible.length;
				return h("div", { key: "chip-" + cat, style: { marginTop: "8px", borderTop: "1px dashed var(--dsw-alias-border-l1, rgba(127,127,127,.18))", paddingTop: "8px", animation: "dsh-pop-down .22s cubic-bezier(.2,.8,.3,1.05) both" } },
					h("div", { style: { display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" } },
						h("span", { style: { width: "8px", height: "8px", borderRadius: "3px", background: CATEGORY_COLOR[cat], flex: "none" } }),
						h("span", { style: { fontWeight: 600, fontSize: "12px", color: "var(--dsw-alias-label-primary, #1f2329)" } }, CATEGORY_LABEL_ZH[cat]),
						h("span", { style: { color: "var(--dsw-alias-label-tertiary, #868e96)", fontSize: "11px" } }, String(list.length)),
						h("button", { style: { marginLeft: "auto", ...linkButtonStyle }, onClick: function () { toggleChip(cat); } }, COLLAPSE)
					),
					h("div", { style: { display: "flex", flexDirection: "column", gap: "2px" } },
						visible.map(function (entry) { return entryRow(entry, cat); }),
						remaining > 0 ? h("button", { style: { alignSelf: "flex-start", ...linkButtonStyle, fontSize: "11px", padding: "3px 6px" }, onClick: function () { showMore(cat); } }, SHOW_MORE.replace("{count}", String(remaining))) : null
					)
				);
			}).filter(Boolean);

			// ── 思维导图节点（内容坐标，绝对定位；一次只展示一个问题） ──────
			function problemEndTime(problem) {
				if (problem.attempts.length === 0) return problem.time;
				var last = problem.attempts[problem.attempts.length - 1];
				return last.tools.length > 0 ? last.tools[last.tools.length - 1].time : last.time;
			}
			/** 方案胶囊的垂直位置：围绕问题节点上下错落（不再一条线）。 */
			function attemptCenterY(count, index, zoneH) {
				var halfH = zoneH / 2;
				var base = 90;
				var gap = 170;
				if (count === 1) return halfH;
				var y = index % 2 === 0 ? halfH - base - Math.floor(index / 2) * gap : halfH + base + Math.floor(index / 2) * gap;
				return Math.max(50, Math.min(zoneH - 50, y));
			}
			/** 方案胶囊的水平位置：错落偏移，避免所有方案挤在同一竖线上。 */
			function attemptLeft(problem, attempt, contentW, index) {
				var stagger = (index % 3) * 34;
				return 270 + stagger;
			}
			function attemptWidth(attempt, open) {
				// 方案胶囊 + 右侧工具行总宽（用于水平定位边界）
				return open ? 150 + 24 + Math.max(260, attempt.tools.length * 152) : 150;
			}
			/** 节点移动：即时定位（惯性由引导线承担，线条弹性追随节点边缘）。 */
			var nodeMoveTransition = "transform .16s ease-out";
			/** 初始化所有节点位置（内容坐标），供拖动与连线使用。 */
			function buildInitialPositions() {
				var pos = {};
				for (var p = 0; p < problems.length; p++) {
					var pr = problems[p];
					var pKey = "p" + String(pr.seq);
					var zoneTop = layout.zoneTops[p] ?? 10;
					var zoneH = layout.heights[p] ?? 380;
					pos[pKey] = { x: 16, y: zoneTop + Math.max(40, zoneH / 2 - 37) };
					for (var a = 0; a < pr.attempts.length; a++) {
						var att = pr.attempts[a];
						var aKey = pKey + ":a" + String(att.number);
						var centerY = attemptCenterY(pr.attempts.length, a, zoneH);
						var pillX = attemptLeft(pr, att, layout.contentWs[p] ?? 860, a);
						pos[aKey] = { x: pillX, y: zoneTop + centerY - 27 };
						var tStart = att.tools.length > 0 ? att.tools[0].time : att.time;
						var tEnd = att.tools.length > 0 ? att.tools[att.tools.length - 1].time : att.time;
						var tSpan = (tEnd - tStart) || 1;
						var spread = Math.max(320, att.tools.length * 168);
						var rowY = zoneTop + centerY - 22 + toolWave(0);
						var cursor = pillX + 148 + 30;
						for (var t = 0; t < att.tools.length; t++) {
							var tool = att.tools[t];
							var timeX = pillX + 148 + 30 + ((tool.time - tStart) / tSpan) * spread;
							if (timeX < cursor) timeX = cursor;
							cursor = timeX + 148;
							pos[aKey + "::" + tool.key] = { x: timeX, y: zoneTop + centerY - 22 + toolWave(t) };
						}
					}
				}
				return pos;
			}
			/** 工具节点垂直波浪：轻微上下错落，避免一条直线。 */
			function toolWave(t) {
				return Math.round(Math.sin(t * 1.1) * 16);
			}
			/** 节点边缘之间的曲线连接线（弹性弯曲）。 */
			function pathBetween(from, to) {
				var mx = from.x + (to.x - from.x) / 2;
				return "M " + from.x + " " + from.y + " C " + mx + " " + from.y + ", " + mx + " " + to.y + ", " + to.x + " " + to.y;
			}
			/** 方案节点：小胶囊 + 右侧一排独立工具小节点（无大容器包裹，按时间铺开）。 */
			function attemptNode(problem, attempt, index, pKey, zoneTop, zoneH) {
				var aKey = pKey + ":a" + String(attempt.number);
				var open = openAttempts[aKey] !== false;
				var hasError = attempt.error !== null;
				var running = attempt.running || attempt.tools.some(function (t) { return t.status === "running"; });
				var delivered = problem.delivered === true && attempt === problem.attempts[problem.attempts.length - 1];
				var statusColor = hasError ? COLOR_ERROR : delivered ? COLOR_DONE : running ? COLOR_RUNNING : "var(--dsw-alias-border-l1, rgba(127,127,127,.35))";
				var pillW = 148;
				var pillH = 54; // 固定高度，引导线中点（+27）始终命中胶囊左右边缘中心
				var attLeft = attemptLeft(problem, attempt, contentW, index);
				var centerY = zoneTop + attemptCenterY(problem.attempts.length, index, zoneH);
				var pillPos = nodePos[aKey] || { x: attLeft, y: centerY - pillH / 2 };
				var pillX = pillPos.x;
				var pillY = pillPos.y;
				var hovered = hoverId === aKey;
				var repelPill = repelFor(pillX, pillY, pillW, pillH);
				var tools = attempt.tools;
				var tStart = tools.length > 0 ? tools[0].time : attempt.time;
				var tEnd = tools.length > 0 ? tools[tools.length - 1].time : attempt.time;
				var tSpan = (tEnd - tStart) || 1;
				var spread = Math.max(320, tools.length * 168);
				var rowY = centerY - 22; // 工具节点高 44，垂直居中对齐
				var cursor = pillX + pillW + 30;
				var placed = tools.map(function (tool, ti) {
					var stepKey = aKey + "::" + tool.key;
					var saved = nodePos[stepKey];
					var timeX = pillX + pillW + 30 + ((tool.time - tStart) / tSpan) * spread;
					if (timeX < cursor) timeX = cursor;
					cursor = timeX + 148;
					return { tool: tool, left: saved ? saved.x : timeX, top: saved ? saved.y : rowY + toolWave(ti) };
				});
				return h(react.Fragment, { key: aKey },
					// 方案胶囊（小节点，可拖动，子工具跟随）
					h("div", {
						"data-dsh-node": "a" + aKey,
						style: {
							position: "absolute", left: pillX + "px", top: pillY + "px", width: pillW + "px", height: pillH + "px",
							transform: pressScale(aKey, repelPill), transition: nodeMoveTransition, zIndex: hovered ? 5 : 2, cursor: "grab", touchAction: "none", pointerEvents: "auto"
						},
						onPointerDown: function (e) { startNodeDrag(e, aKey); },
						onPointerMove: moveNodeDrag,
						onPointerUp: endNodeDrag,
						onPointerOver: function () { setHoverId(aKey); },
						onPointerOut: function () { setHoverId(null); },
						onClick: function () {
							if (tapGuard()) return;
							toggleAttempt(aKey);
						}
					},
						h("div", {
							style: {
								height: "100%", boxSizing: "border-box",
								borderRadius: "18px", border: "1.5px solid " + statusColor, padding: "5px 10px", cursor: "grab", userSelect: "none",
								background: hovered ? "var(--dsw-alias-bg-layer-2, rgba(127,127,127,.15))" : "var(--dsw-alias-bg-layer-1, rgba(127,127,127,.06))",
								boxShadow: hovered ? "0 2px 10px rgba(0,0,0,.14)" : "none",
								display: "flex", flexDirection: "column", justifyContent: "center", overflow: "hidden"
							}
						},
							h("div", { style: { display: "flex", alignItems: "center", gap: "5px", flexWrap: "wrap" } },
								h("span", { style: { fontWeight: 700, fontSize: "13px", color: "var(--dsw-alias-label-primary, #1f2329)" } }, FLOW_ATTEMPT + " " + String(attempt.number)),
								hasError ? h("span", { style: { ...badgeBase, borderColor: COLOR_ERROR, color: COLOR_ERROR, fontSize: "10px", padding: "0 5px" } }, FLOW_ERROR) : null,
								running ? h("span", { style: { ...badgeBase, borderColor: COLOR_RUNNING, color: COLOR_RUNNING, fontSize: "10px", padding: "0 5px" } }, FLOW_WORKING) : null,
								delivered ? h("span", { style: { ...badgeBase, borderColor: COLOR_DONE, color: COLOR_DONE, fontSize: "10px", padding: "0 5px" } }, FLOW_DONE) : null,
								!open && tools.length > 0 ? h("span", { style: { color: "var(--dsw-alias-label-caption, #98a1ad)", fontSize: "10px" } }, "×" + String(tools.length)) : null,
								h("span", { style: { marginLeft: "auto", color: "var(--dsw-alias-label-caption, #98a1ad)", fontSize: "10px" } }, open ? "▾" : "▸")
							),
							hasError ? h("div", { style: { marginTop: "2px", color: COLOR_ERROR, fontSize: "10px", lineHeight: "12px", maxWidth: "138px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" } },
								FLOW_ERROR + "：" + (attempt.error.tool !== "" ? attempt.error.tool + " — " : "") + attempt.error.message
							) : null
						)
					),
					// 工具节点：每个都是独立小节点，不在任何大容器内（可拖动；出现时由小变大）
					open ? placed.map(function (item, ti) {
						var tool = item.tool;
						var stepKey = aKey + "::" + tool.key;
						var sel = expandedTool === stepKey;
						var stColor = tool.status === "error" ? COLOR_ERROR : tool.status === "running" ? COLOR_RUNNING : COLOR_DONE;
						var chipW = 128;
						var chipRepel = repelFor(item.left, item.top, chipW, 30);
						var chipHover = hoverId === stepKey;
						return h("div", {
							key: tool.key,
							"data-dsh-node": "t" + stepKey,
							style: {
								position: "absolute", left: item.left + "px", top: item.top + "px", width: chipW + "px", height: "44px",
								transform: pressScale(stepKey, chipRepel), transition: nodeMoveTransition, zIndex: sel ? 20 : (chipHover ? 5 : 2), cursor: "grab", touchAction: "none", pointerEvents: "auto",
								animation: "dsh-pop-in .2s ease-out " + (ti * 0.03) + "s"
							},
							onPointerDown: function (e) { startNodeDrag(e, stepKey); },
							onPointerMove: moveNodeDrag,
							onPointerUp: endNodeDrag,
							onPointerOver: function () { setHoverId(stepKey); },
							onPointerOut: function () { setHoverId(null); },
							onClick: function (e) {
								e.stopPropagation();
								if (tapGuard()) return;
								if (panDrag.current && panDrag.current.moved) return;
								setExpandedTool(sel ? null : stepKey);
							}
						},
							h("button", {
								"data-dsh-tool": stepKey,
								style: {
									display: "flex", alignItems: "center", gap: "4px", cursor: "grab", userSelect: "none", whiteSpace: "nowrap",
									padding: "4px 8px", borderRadius: "12px", fontSize: "11px",
									border: "1px solid " + (sel ? stColor : "var(--dsw-alias-border-l1, rgba(127,127,127,.3))"),
									background: sel ? "var(--dsw-alias-bg-layer-2, rgba(127,127,127,.16))" : chipHover ? "var(--dsw-alias-bg-layer-2, rgba(127,127,127,.12))" : "var(--dsw-alias-bg-layer-1, rgba(127,127,127,.05))",
									color: "var(--dsw-alias-label-primary, #1f2329)"
								},
								title: fmtTime(tool.time) + " · " + tool.name
							},
								h("span", { style: { fontWeight: 700, color: CATEGORY_COLOR[tool.action] ?? "var(--dsw-alias-label-secondary, #5f6b7a)" } }, ACTION_LABEL[tool.action] ?? "其他"),
								h("span", { style: { fontFamily: "var(--ds-font-family-code, ui-monospace, monospace)", maxWidth: "68px", overflow: "hidden", textOverflow: "ellipsis" } }, tool.name),
								h("span", { style: { flex: "none", width: "6px", height: "6px", borderRadius: "50%", background: stColor } })
							),
							h("span", { style: { display: "block", fontSize: "10px", color: "var(--dsw-alias-label-caption, #98a1ad)", fontVariantNumeric: "tabular-nums", textAlign: "center", marginTop: "2px" } }, fmtTime(tool.time)),
							sel ? (function () {
								var summary = toolSummary(tool);
								var mod = toolModified(tool);
								var sec = { color: "var(--dsw-alias-label-tertiary, #868e96)", fontSize: "11px", fontWeight: 600, margin: "6px 0 2px" };
								// 靠近画布右缘时向左翻转，避免被画布裁剪
								var flipLeft = item.left + 310 > layout.contentW;
								var flipTop = item.top + 360 > layout.contentH;
								return h("div", { style: { position: "absolute", left: flipLeft ? "auto" : "0", right: flipLeft ? "0" : "auto", top: flipTop ? "auto" : "48px", bottom: flipTop ? "0" : "auto", width: "300px", padding: "6px 8px", borderRadius: "10px", background: "var(--dsw-alias-bg-layer-2, rgba(127,127,127,.17))", border: "1px solid " + stColor, zIndex: 8, maxHeight: "300px", overflow: "auto", boxShadow: "0 4px 14px rgba(0,0,0,.18)", animation: "dsh-pop-down .22s cubic-bezier(.2,.8,.3,1.05) both" } },
									h("div", { style: { color: "var(--dsw-alias-label-tertiary, #868e96)", fontSize: "10px", fontWeight: 600, marginBottom: "2px" } }, FLOW_STEP_DETAIL + " · " + tool.name),
									h("div", { style: sec }, "做了什么"),
									summary.map(function (line, li) {
										return h("div", { key: "s" + li, style: { fontSize: "11px", lineHeight: "16px", color: "var(--dsw-alias-label-primary, #1f2329)", overflowWrap: "anywhere" } }, line);
									}),
									h("div", { style: sec }, "输出 / 日志"),
									h("pre", { style: { ...preStyle, maxHeight: "110px", margin: "0" } }, tool.result !== "" ? tool.result : NO_OUTPUT),
									mod !== null ? [
										h("div", { key: "ml", style: sec }, "修改内容"),
										h("pre", { key: "mo", style: { ...preStyle, maxHeight: "80px", margin: "0" } }, "旧：\n" + mod.old),
										h("pre", { key: "mn", style: { ...preStyle, maxHeight: "80px", margin: "4px 0 0", color: COLOR_DONE } }, "新：\n" + mod.new)
									] : null,
									h("div", { style: sec }, ARGS_LABEL),
									h("pre", { style: { ...preStyle, maxHeight: "100px", margin: "0" } }, tool.argsRaw && tool.argsRaw.trim() !== "" ? tool.argsRaw : NO_ARGS),
									tool.errorText !== "" ? h("div", { style: { color: COLOR_ERROR, fontSize: "11px", fontWeight: 600, margin: "6px 0 2px" } }, ERROR_LABEL) : null,
									tool.errorText !== "" ? h("pre", { style: { ...preStyle, maxHeight: "70px", color: COLOR_ERROR, margin: "0" } }, tool.errorText) : null
								);
							})() : null
						);
					}) : null
				);
			}
			/** 点击问题节点：展开/收起其下全部方案子流程。 */
			function toggleProblemAll(pKey, problem) {
				var anyOpen = problem.attempts.some(function (att) { return openAttempts[pKey + ":a" + String(att.number)] !== false; });
				var next = {};
				for (var k in openAttempts) next[k] = openAttempts[k];
				for (var ai2 = 0; ai2 < problem.attempts.length; ai2++) next[pKey + ":a" + String(problem.attempts[ai2].number)] = !anyOpen;
				setOpenAttempts(next);
			}
			/** 单个问题区域（画布坐标系内绝对定位；一次只展示一个问题）。 */
			function problemZone(problem, index, zoneTop, zoneH) {
				var pKey = "p" + String(problem.seq);
				var hasAttempts = problem.attempts.length > 0;
				var lastTime = hasAttempts ? problemEndTime(problem) : problem.time;
				var pNodeH = 74;
				var pW = 190;
				var pPos = nodePos[pKey] || { x: 16, y: zoneTop + Math.max(40, zoneH / 2 - 37) };
				var hoveredP = hoverId === pKey;
				var repelP = repelFor(pPos.x, pPos.y, pW, pNodeH);
				return h("div", { key: pKey, style: { position: "absolute", left: "0", top: zoneTop + "px", width: contentW + "px", height: zoneH + "px", pointerEvents: "none" } },
					// 问题根节点（可拖动，其下方案与工具跟随；点击展开/收起全部子流程）
					h("div", {
						"data-dsh-node": pKey,
						style: {
							position: "absolute", left: pPos.x + "px", top: pPos.y + "px", width: pW + "px", height: "74px", borderRadius: "18px",
							border: "2px solid var(--dsw-alias-state-business-primary, #1f6feb)",
							background: hoveredP ? "var(--dsw-alias-state-business-tertiary, rgba(31,111,235,.2))" : "var(--dsw-alias-state-business-tertiary, rgba(31,111,235,.12))",
							padding: "9px 16px", cursor: "grab", userSelect: "none",
							transform: pressScale(pKey, repelP), transition: nodeMoveTransition, zIndex: hoveredP ? 5 : 2, pointerEvents: "auto", touchAction: "none",
							display: "flex", flexDirection: "column", justifyContent: "center", overflow: "hidden"
						},
						onPointerDown: function (e) { startNodeDrag(e, pKey); },
						onPointerMove: moveNodeDrag,
						onPointerUp: endNodeDrag,
						onPointerOver: function () { setHoverId(pKey); },
						onPointerOut: function () { setHoverId(null); },
						onClick: function () {
							if (tapGuard()) return;
							toggleProblemAll(pKey, problem);
						}
					},
						h("div", { style: { fontWeight: 700, fontSize: "13px", color: "var(--dsw-alias-state-business-primary, #1f6feb)" } }, FLOW_PROBLEM + (problems.length > 1 ? " " + String(index + 1) : "")),
						h("div", { style: { fontSize: "12px", marginTop: "3px", maxWidth: "160px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "var(--dsw-alias-label-secondary, #5f6b7a)" } }, shorten(problem.text, 30) || "…"),
						h("div", { style: { fontSize: "10px", marginTop: "4px", color: "var(--dsw-alias-label-caption, #98a1ad)", fontVariantNumeric: "tabular-nums" } }, fmtTime(problem.time) + " → " + fmtTime(lastTime))
					),
					// 方案与工具节点（连线由画布上的 SVG 层统一绘制）
					hasAttempts ? problem.attempts.map(function (attempt, ai) { return attemptNode(problem, attempt, ai, pKey, zoneTop, zoneH); })
						: h("div", { style: { position: "absolute", left: "260px", top: zoneTop + zoneH / 2 - 12, color: "var(--dsw-alias-label-caption, #98a1ad)", fontSize: "12px", pointerEvents: "auto" } }, FLOW_NO_ATTEMPT)
				);
			}

			// 只展示当前选中的问题（其余在画布选项标签中切换）
			var activeProblem = problems.length ? problems[ap] : null;
			var flowBlocks = activeProblem ? [problemZone(activeProblem, ap, layout.zoneTops[ap], layout.heights[ap])] : [];
			var isEmpty = problems.length === 0;
			// 引导线：节点边缘 → 节点边缘（曲线，随拖动自然弯曲；仅当前问题）
			var connectors = [];
			var connSeq = 0;
			if (activeProblem) {
				var cpr = activeProblem;
				var cpKey = "p" + String(cpr.seq);
				var cZoneTop = layout.zoneTops[ap] ?? 0;
				var cZoneH = layout.heights[ap] ?? 380;
				var cpp = nodePos[cpKey] || { x: 16, y: cZoneTop + Math.max(40, cZoneH / 2 - 37) };
				for (var cai = 0; cai < cpr.attempts.length; cai++) {
					var catt = cpr.attempts[cai];
					var caKey = cpKey + ":a" + String(catt.number);
					var cap = nodePos[caKey] || { x: attemptLeft(cpr, catt, contentW, cai), y: cZoneTop + attemptCenterY(cpr.attempts.length, cai, cZoneH) - 27 };
					connectors.push({
						k: "c" + (connSeq++),
						e: { x1: cpp.x + 190, y1: cpp.y + 37, x2: cap.x, y2: cap.y + 27 }
					});
					if (openAttempts[caKey] !== false) {
						var tStart = catt.tools.length > 0 ? catt.tools[0].time : catt.time;
						var tEnd = catt.tools.length > 0 ? catt.tools[catt.tools.length - 1].time : catt.time;
						var tSpan = (tEnd - tStart) || 1;
						var spreadC = Math.max(320, catt.tools.length * 168);
						var cursorC = cap.x + 148 + 30;
						for (var cti = 0; cti < catt.tools.length; cti++) {
							var ctool = catt.tools[cti];
							var ctp = nodePos[caKey + "::" + ctool.key];
							var timeXC = cap.x + 148 + 30 + ((ctool.time - tStart) / tSpan) * spreadC;
							if (timeXC < cursorC) timeXC = cursorC;
							cursorC = timeXC + 148;
							if (!ctp) ctp = { x: timeXC, y: cZoneTop + attemptCenterY(cpr.attempts.length, cai, cZoneH) - 22 + toolWave(cti) };
							connectors.push({
								k: "c" + (connSeq++),
								e: { x1: cap.x + 148, y1: cap.y + 27, x2: ctp.x, y2: ctp.y + 22 }
							});
						}
					}
				}
			}
			// 记录当前目标端点（每帧渲染时刷新）
			var lineTargets = {};
			for (var lti = 0; lti < connectors.length; lti++) lineTargets[connectors[lti].k] = connectors[lti].e;
			lineTargetsRef.current = lineTargets;
			// 线条弹性动画：常驻 rAF 循环，端点向目标 lerp（惯性），空闲时不触发重渲染
			useEffect(function () {
				var raf = 0;
				function step() {
					var t = lineTargetsRef.current;
					var anim = lineAnimRef.current;
					var next = {};
					var changed = false;
					for (var k in t) {
						var g = t[k];
						var c = anim[k];
						if (!c) {
							next[k] = { x1: g.x1, y1: g.y1, x2: g.x2, y2: g.y2 };
							anim[k] = next[k];
							continue;
						}
						var nx1 = c.x1 + (g.x1 - c.x1) * 0.3;
						var ny1 = c.y1 + (g.y1 - c.y1) * 0.3;
						var nx2 = c.x2 + (g.x2 - c.x2) * 0.3;
						var ny2 = c.y2 + (g.y2 - c.y2) * 0.3;
						if (Math.abs(g.x1 - c.x1) + Math.abs(g.y1 - c.y1) + Math.abs(g.x2 - c.x2) + Math.abs(g.y2 - c.y2) > 0.5) changed = true;
						next[k] = { x1: nx1, y1: ny1, x2: nx2, y2: ny2 };
						anim[k] = next[k];
					}
					if (changed) setLineState(next);
					raf = requestAnimationFrame(step);
				}
				raf = requestAnimationFrame(step);
				return function () { cancelAnimationFrame(raf); };
			}, []);
			var anyOpen = false;
			for (var ok in openAttempts) if (openAttempts[ok]) { anyOpen = true; break; }

			// 动画 keyframes：卡片从上往下弹出（由小变大）+ 淡入
			var POP_CSS = "@keyframes dsh-pop-down{from{opacity:0;transform:translateY(-14px) scale(.9);transform-origin:top center}to{opacity:1;transform:translateY(0) scale(1);transform-origin:top center}}@keyframes dsh-pop-in{from{opacity:0;transform:scale(.86);transform-origin:center}to{opacity:1;transform:scale(1);transform-origin:center}}";
			var POP_STYLE = "animation:dsh-pop-down .24s cubic-bezier(.2,.8,.3,1.05) both";
			var POP_IN_STYLE = "animation:dsh-pop-in .18s ease-out both";
			return h("div", { style: { minWidth: "0", height: "100%", boxSizing: "border-box", display: "flex", flexDirection: "column", overflow: "hidden", font: "var(--dsw-font-xs-13, 12px/16px ui-sans-serif, system-ui)", color: "var(--dsw-alias-label-primary, #1f2329)" } },
				h("style", null, POP_CSS),
				// 头部（固定）
				h("div", { style: { display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", padding: "12px 14px 0" } },
					h("span", { style: { fontWeight: 700, fontSize: "14px", color: "var(--dsw-alias-label-primary, #1f2329)" } }, TAB_LABEL),
					h("input", {
						style: { marginLeft: "auto", minWidth: "150px", padding: "4px 8px", borderRadius: "6px", border: "1px solid var(--dsw-alias-border-l1, rgba(127,127,127,.18))", background: "var(--dsw-alias-bg-layer-2, rgba(127,127,127,.05))", color: "var(--dsw-alias-label-primary, #1f2329)", fontSize: "12px" },
						value: filter,
						onChange: function (e) { setFilter(e.target.value); },
						placeholder: FILTER_PLACEHOLDER
					}),
					hasMore ? h("button", {
						style: { ...linkButtonStyle, border: "1px solid var(--dsw-alias-border-l1, rgba(127,127,127,.18))", padding: "3px 10px", borderRadius: "6px" },
						onClick: function () { if (loadOlder && !loadingOlder) loadOlder(); },
						disabled: loadingOlder
					}, loadingOlder ? LOADING : LOAD_OLDER) : null
				),
				h("div", { style: { color: "var(--dsw-alias-label-caption, #98a1ad)", fontSize: "11px", lineHeight: "16px", padding: "6px 14px 0" } }, VIEW_NOTE),
				// 热力图 + 排行榜（移植自 PR #1；可收纳卡片，点击标题展开/收起，避免与画布抢空间）
				h("div", { style: { padding: "10px 14px 0" } },
					h("div", { style: { border: "1px solid var(--dsw-alias-border-l1, rgba(127,127,127,.18))", borderRadius: "10px", background: "var(--dsw-alias-bg-layer-2, rgba(127,127,127,.04))", overflow: "hidden" } },
						h("button", {
							style: {
								display: "flex", alignItems: "center", gap: "8px", width: "100%", border: "0", cursor: "pointer", userSelect: "none",
								padding: "8px 12px", background: "transparent", color: "var(--dsw-alias-label-primary, #1f2329)",
								font: "600 13px/18px var(--ds-font-family, ui-sans-serif, system-ui)", textAlign: "left",
								transform: pressedKey === "heat" ? "scale(.97)" : "none", transition: "transform .14s ease-out"
							},
							onPointerDown: function () { setPressedKey("heat"); },
							onPointerUp: function () { setPressedKey(null); },
							onPointerLeave: function () { setPressedKey(null); },
							onClick: function () { setHeatOpen(!heatOpen); }
						},
							h("span", { style: { flex: "none", width: "8px", height: "8px", borderRadius: "2px", background: "var(--dsw-alias-state-success-primary, #2f9e44)" } }),
							h("span", null, "热力图 · 排行榜"),
							h("span", { style: { marginLeft: "auto", color: "var(--dsw-alias-label-tertiary, #868e96)", fontSize: "11px", fontWeight: 400 } }, heatOpen ? "点击收起 ▾" : "点击展开 ▸")
						),
						heatOpen ? h("div", { style: { padding: "0 12px 10px", animation: "dsh-pop-down .24s cubic-bezier(.2,.8,.3,1.05) both" } }, h(HeatmapView, { heat: heat, dateFilter: dateFilter, setDateFilter: setDateFilter })) : null
					)
				),
				// 左上角「合计」面板（固定，展开记录时内部滚动）
				h("div", { style: { padding: "10px 14px 0" } },
					h("div", { style: { display: "inline-block", minWidth: "200px", maxWidth: "100%", border: "1px solid var(--dsw-alias-border-l1, rgba(127,127,127,.18))", borderRadius: "10px", padding: "8px 10px", background: "var(--dsw-alias-bg-layer-2, rgba(127,127,127,.04))", maxHeight: anyChipOpen ? "32vh" : "none", overflowY: anyChipOpen ? "auto" : "visible" } },
						h("div", { style: { display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" } },
							h("span", { style: { fontWeight: 700, fontSize: "12px", color: "var(--dsw-alias-label-primary, #1f2329)" } }, TOTAL_LABEL),
							h("span", { style: { color: "var(--dsw-alias-label-tertiary, #868e96)", fontSize: "11px" } }, String(model.toolTotal) + " 次工具调用"),
							h("button", { style: { marginLeft: "auto", ...linkButtonStyle }, onClick: function () {
								var next = {};
								for (var c = 0; c < CATEGORY_ORDER.length; c++) next[CATEGORY_ORDER[c]] = true;
								setOpenChips(next);
							} }, EXPAND_ALL),
							h("button", { style: linkButtonStyle, onClick: function () { setOpenChips({}); } }, COLLAPSE_ALL)
						),
						h("div", { style: { display: "flex", flexWrap: "wrap", gap: "5px" } }, chips),
						h("div", null, openChipBlocks)
					)
				),
				// 画布选项：一次只显示一个问题，其余问题在标签中切换
				problems.length > 1 ? h("div", { style: { display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap", padding: "8px 14px 0" } },
					h("span", { style: { fontSize: "11px", fontWeight: 700, color: "var(--dsw-alias-label-tertiary, #868e96)", marginRight: "2px" } }, FLOW_PROBLEM + "画布"),
					problems.map(function (pr, pi) {
						var active = pi === ap;
						var hasErr = pr.attempts.some(function (a) { return a.error !== null; });
						var done = pr.delivered === true;
						var dotColor = hasErr ? COLOR_ERROR : done ? COLOR_DONE : "var(--dsw-alias-label-caption, #98a1ad)";
						return h("button", {
							key: "tab-" + String(pr.seq),
							style: {
								display: "inline-flex", alignItems: "center", gap: "5px", cursor: "pointer", userSelect: "none",
								padding: "3px 10px", borderRadius: "999px", fontSize: "12px",
								border: "1px solid " + (active ? "var(--dsw-alias-state-business-primary, #1f6feb)" : "var(--dsw-alias-border-l1, rgba(127,127,127,.18))"),
								background: active ? "var(--dsw-alias-state-business-tertiary, rgba(31,111,235,.14))" : "var(--dsw-alias-bg-layer-2, rgba(127,127,127,.05))",
								color: "var(--dsw-alias-label-primary, #1f2329)"
							},
							title: shorten(pr.text, 60) || "",
							onClick: function () { setActiveP(pi); setExpandedTool(null); setHoverId(null); }
						},
							h("span", { style: { flex: "none", width: "7px", height: "7px", borderRadius: "50%", background: dotColor } }),
							FLOW_PROBLEM + " " + String(pi + 1),
							h("span", { style: { color: "var(--dsw-alias-label-tertiary, #868e96)", fontSize: "10px" } }, String(pr.attempts.length) + " 方案")
						);
					})
				) : null,
				// 画布（flex 撑满；任意位置左键拖动平移，滚轮缩放）
				isEmpty ? h("div", { style: { flex: "1", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--dsw-alias-label-caption, #98a1ad)", fontSize: "12px" } }, EMPTY_HINT)
					: h("div", {
						style: { flex: "1", minHeight: "0", position: "relative", overflow: "hidden", borderTop: "1px solid var(--dsw-alias-border-l1, rgba(127,127,127,.16))", marginTop: "10px", cursor: "grab", touchAction: "none", userSelect: "none" },
						"data-dsh-canvas": "",
						ref: function (el) { canvasRef.current = el; },
						onPointerDown: canvasPointerDown,
						onPointerMove: canvasPointerMove,
						onPointerUp: canvasPointerUp,
						onPointerLeave: canvasPointerLeave
					},
						// 缩放/平移后的内容
						h("div", { "data-dsh-content": "", style: { position: "absolute", left: "0", top: "0", width: layout.contentW + "px", height: layout.contentH + "px", transformOrigin: "0 0", transform: "translate(" + view.x + "px," + view.y + "px) scale(" + view.z + ")" } },
							// 时间标尺（当前问题的起止时间）
							h("div", { style: { position: "absolute", left: "16px", right: "16px", top: "10px", display: "flex", alignItems: "center", gap: "10px", color: "var(--dsw-alias-label-caption, #98a1ad)", fontSize: "11px", fontWeight: 600 } },
								h("span", { style: { flex: "none" } }, "起始 " + fmtTime(activeProblem ? activeProblem.time : 0)),
								h("div", { style: { flex: "1", height: "2px", background: COLOR_LINE, position: "relative" } },
									h("span", { style: { position: "absolute", left: "0", top: "-4px", width: "2px", height: "10px", background: COLOR_LINE } }),
									h("span", { style: { position: "absolute", left: "50%", top: "-4px", width: "2px", height: "10px", background: COLOR_LINE } }),
									h("span", { style: { position: "absolute", right: "0", top: "-4px", width: "2px", height: "10px", background: COLOR_LINE } })
								),
								h("span", { style: { flex: "none" } }, "现在 " + fmtTime(activeProblem ? problemEndTime(activeProblem) : 0))
							),
							// 引导线层（SVG，节点边缘之间，弹性追随）
							h("svg", { width: layout.contentW, height: layout.contentH, style: { position: "absolute", left: "0", top: "0", pointerEvents: "none" } },
								Object.keys(lineState).map(function (k) {
									var e = lineState[k];
									return h("path", { key: k, d: pathBetween({ x: e.x1, y: e.y1 }, { x: e.x2, y: e.y2 }), stroke: COLOR_LINE, strokeWidth: "2", fill: "none", strokeLinecap: "round" });
								})
							),
							flowBlocks
						),
						// 缩放控件
						h("div", { style: { position: "absolute", left: "12px", bottom: "12px", display: "flex", alignItems: "center", gap: "4px", padding: "4px", borderRadius: "10px", border: "1px solid var(--dsw-alias-border-l1, rgba(127,127,127,.2))", background: "var(--dsw-alias-bg-layer-2, rgba(127,127,127,.5))", zIndex: 9 } },
							h("button", { style: { border: "0", background: "none", cursor: "pointer", color: "var(--dsw-alias-label-primary, #1f2329)", fontSize: "14px", width: "24px", height: "24px", borderRadius: "6px" }, onClick: function () { zoomBy(1 / 1.2); }, title: "缩小" }, ZOOM_OUT),
							h("button", { style: { border: "0", background: "none", cursor: "pointer", color: "var(--dsw-alias-label-primary, #1f2329)", fontSize: "11px", width: "44px", height: "24px", borderRadius: "6px", fontVariantNumeric: "tabular-nums" }, onClick: function () { setView(function (v) { return { x: 30, y: 16, z: 1 }; }); }, title: "重置缩放" }, Math.round(view.z * 100) + "%"),
							h("button", { style: { border: "0", background: "none", cursor: "pointer", color: "var(--dsw-alias-label-primary, #1f2329)", fontSize: "14px", width: "24px", height: "24px", borderRadius: "6px" }, onClick: function () { zoomBy(1.2); }, title: "放大" }, ZOOM_IN)
						),
						// 操作提示
						h("div", { style: { position: "absolute", right: "12px", top: "10px", fontSize: "10px", color: "var(--dsw-alias-label-caption, #98a1ad)", opacity: ".9", pointerEvents: "none" } }, CANVAS_HINT)
					),
				h("div", { style: { color: "var(--dsw-alias-label-caption, #98a1ad)", fontSize: "11px", lineHeight: "16px", padding: "6px 14px 10px", flex: "none" } }, VIEW_DESCRIPTION)
			);
		}

		// ── plugin body ──────────────────────────────────────────────────────
		var inject = ["slots", "sessions"];
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
