# dsh-client-ui-trajectory-categories

A pure client-side DSH Web plugin that turns the raw trajectory into a **Chinese-first, zero-token** summary view.

Adds a **「分类」 (Categories)** tab to every conversation session:

- **Top-left 「合计」 (Summary) panel** — action-type statistics (写入/读取/删除/下载/命令/搜索/子代理/其他工具/消息/压缩) with one-click record expansion.
- **Mind-map canvas** — one problem per canvas: 问题 (problem) → 方案 (attempt) → 工具调用 (tool calls), rebuilt from the trajectory. Switch between problems with the **「问题画布」 tabs**.
- The original **Trajectory** list stays untouched.

![Overview](https://img.shields.io/badge/DSH-client--plugin-web-blue) ![License](https://img.shields.io/badge/license-MIT-green)

## Features

### Chinese-first categorization
- Category labels are **always Chinese**, regardless of UI language.
- Classification matches **both Chinese and English** tool names/terms — 写入/写文件/编辑/修改, 删除/移除, 读取/查看/查找, 下载/抓取, 命令/执行/运行, 搜索/查询, 子代理/委派 … all map to the right category.
- Arg previews prioritize the meaningful field (file path / URL / command / query), so rows read naturally in Chinese.

### 「合计」 summary panel (top-left)
- **Heatmap + category ranking** (from community PR #1): a GitHub-style calendar heatmap of how many actions ran each day (hover a day for per-category breakdown), plus a leaderboard of the most-used categories. Click a day to filter the summary chips/records below; click again (or `×`) to clear.
- One chip per category with a count badge; click a chip to expand that category's records inline.
- Each record shows time, name and arg preview; click to expand full **参数 (args) / 结果 (result) / 错误 (error)**.
- Real-time filter by tool name/content; 全部展开 / 全部收起 buttons; “显示更多” loads more records lazily (default 40 per category).

### Mind-map canvas (one problem per canvas)
- Rebuilds the flow **问题 → 方案 1 →（报错）→ 方案 2 → … → 完成** automatically from user/assistant/tool events.
- **One problem per canvas** — other problems live in the **「问题画布」 tab bar** above the canvas; each tab shows a status dot (red = had errors, green = delivered).
- Attempt pills show reply summary, **报错** badge with the error text, and status badges: **工作中** (running) / **完成** (delivered).
- **Click**:
  - click a **problem** → expand/collapse all of its sub-flows;
  - click an **attempt pill** → slide its tool-call chain in/out (collapsed pills show a `×N` count);
  - click a **tool chip** → detail panel: **做了什么** (what the AI did, from args), **输出 / 日志** (result), **修改内容** (old → new diff, only when present), **参数**, **错误**.
- **Interactive canvas**: drag the background to pan, `Ctrl`+wheel or the zoom buttons to zoom; hover highlights the block; the cursor gently repels nearby blocks.
- **Draggable nodes with inertia lines**: drag a problem node and all its attempts/tools follow; connectors are elastic curves anchored to node edges that glide after the nodes (inertia).
- Horizontal axis ≈ time — newer tool calls sit further right.

### Zero extra token consumption
- Pure client-side aggregation; **no model requests, no LLM summarization**.
- Reuses the `trajectory` view projection built by `ui-trajectory` — no re-processing of the event stream.
- Defaults to collapsed / render-on-demand; args and results render truncated previews until clicked; records load lazily (40 per category first).

## Dependencies

- `@deepseek-ai/dsh-client-ui-trajectory` — provides the `trajectory` view projection (data source)
- `@deepseek-ai/dsh-client-runtime`, `@deepseek-ai/dsh-client-ui-conversation`

## Installation

**One-liner (official bundle install):**

```sh
dsh plugin --profile web add dsh-client-ui-trajectory-categories
# or install straight from source (no build step, lib/ ships with the package):
dsh plugin --profile web add github:QWQ-nn/dsh-client-ui-trajectory-categories
```

Restart the dsh web service and refresh the page — a **「分类」** tab appears in the conversation header.

**Manual install (when you want to control the patch layer yourself):**

1. Put this package in the target profile's `node_modules`
   (e.g. `~/.dsh/profiles/node_modules/dsh-client-ui-trajectory-categories`).
2. Append to the profile's `cordis.patch.yml`:

   ```yaml
   - insert:
       - id: ui-trajectory-categories
         name: 'dsh-client-ui-trajectory-categories'
   ```

3. Restart dsh web and refresh the page.

## Files

- `lib/index.js` — host-side no-op (browser-only plugin).
- `lib/client.js` — the browser bundle (`window.__ModuleLoader__.load` format, hand-built, React-only, Chinese UI copy).
- `test-smoke.mjs` — smoke tests: bundle load, `apply()`, server-render with data / empty / expanded detail / Chinese tool names.
- `test-interact.mjs` — jsdom interaction tests: click-to-detail, drag-pan, ctrl+wheel zoom, hover, repulsion, node drag (parent moves children), connector alignment, problem switcher, tap-to-toggle, tap-guard after drag.

## Verification

```bash
npm install        # installs react/react-dom/jsdom devDependencies
npm test           # SSR smoke tests
npm run test:interact   # jsdom interaction tests
```

## Contributors

- [宋仕尧 (FlapPearLabs)](https://github.com/FlapPearLabs) — contributed the **heatmap + category ranking** feature ([PR #1](https://github.com/QWQ-nn/dsh-client-ui-trajectory-categories/pull/1)) and the **eventLocations fallback hardening** ([PR #2](https://github.com/QWQ-nn/dsh-client-ui-trajectory-categories/pull/2)).

## License

MIT © QWQ-nn
