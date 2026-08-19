# dsh-client-ui-trajectory-categories

纯浏览器端的 DSH Web 客户端插件：把原始轨迹整理成**中文优先、零 token 消耗**的汇总视图。

为每个会话新增「**分类**」标签页：

- **左上角「合计」面板** —— 动作类型统计（写入 / 读取 / 删除 / 下载 / 命令 / 搜索 / 子代理 / 其他工具 / 消息 / 压缩），点击即可展开该类记录；
- **思维导图画布** —— 一次只展示一个问题：问题 → 方案 → 工具调用，由轨迹自动重建；多个问题在上方「**问题画布**」标签中切换；
- 原始「**轨迹**」流程列表完整保留。

![DSH client plugin](https://img.shields.io/badge/DSH-client--plugin-web-blue) ![License](https://img.shields.io/badge/license-MIT-green)

## 特性

### 中文分类，中文语境优先
- 分类标签**固定显示中文**，不随界面语言变化；
- 分类匹配**同时识别中英文工具名/术语**——写入 / 写文件 / 编辑 / 修改、删除 / 移除、读取 / 查看 / 查找、下载 / 抓取、命令 / 执行 / 运行、搜索 / 查询、子代理 / 委派 等都能正确归类；
- 参数预览优先展示文件路径 / URL / 命令 / 查询词等关键字段，贴合中文阅读习惯。

### 「合计」面板（左上角）
- **热力图 + 分类排行榜**（来自社区 PR #1）：GitHub 风格日历热力图，按天显示动作数量（悬停某天查看各分类明细），附「做的最多的是什么」排行榜；点击某天可联动过滤下方合计面板的统计与记录，再次点击或「×」清除。
- 每类一个彩色圆点徽标 + 数量；点击类别展开该类记录列表；
- 每条记录显示时间、名称与参数预览，点击展开完整 **参数 / 结果 / 错误**；
- 支持按工具名 / 内容实时筛选；「全部展开 / 全部收起」一键切换；每类默认渲染前 40 条，可点「显示更多」按需加载。

### 思维导图画布（一次一个问题）
- 自动重建 **问题 → 方案 1 →（报错）→ 方案 2 → … → 完成** 的分叉流程；
- **一个画布只显示一个问题**，其余问题在上方「问题画布」标签栏切换，标签带状态圆点（红 = 有报错，绿 = 已交付）；
- 方案块显示回复摘要、**报错**徽标（含错误信息）与状态徽标：**工作中**（进行中）/ **完成**（已交付）；
- **点击交互**：
  - 点击**问题** → 展开 / 收起其下全部方案子流程；
  - 点击**方案** → 滑入 / 滑出其工具调用链（收起时显示 `×N` 数量角标）；
  - 点击**工具小节点** → 详情面板：**做了什么**（由参数生成的可读摘要）、**输出 / 日志**（结果）、**修改内容**（旧 → 新，仅在有修改时显示）、**参数**、**错误**。
- **画布交互**：按住左键任意位置拖动平移；`Ctrl`+滚轮或缩放按钮缩放；悬停高亮；鼠标靠近内容块有轻微排斥；
- **节点可拖动，线条带惯性**：拖动问题节点，其下方案与工具一起平移；引导线是弹性曲线，始终锚在节点左右边缘中点并弹性追随（惯性）；
- 横轴 ≈ 时间：时间越新的工具调用越靠右。

### 零额外 token 消耗
- 纯浏览器端本地聚合：**不发起任何模型请求、不做 LLM 摘要**；
- 数据直接复用 ui-trajectory 已构建的 `trajectory` 视图投影，不重复处理事件流；
- 默认折叠 / 按需渲染：参数、结果先渲染截断预览，点击才渲染全文；每类默认只渲染前 40 条，可「显示更多」。

## 依赖

- `@deepseek-ai/dsh-client-ui-trajectory`（提供 `trajectory` 视图投影，数据源）
- `@deepseek-ai/dsh-client-runtime`、`@deepseek-ai/dsh-client-ui-conversation`

## 安装

**一行命令（bundle 安装，官方路径）：**

```sh
dsh plugin --profile web add dsh-client-ui-trajectory-categories
# 或直接从源码安装（无构建步骤，lib/ 已随包发布）：
dsh plugin --profile web add github:QWQ-nn/dsh-client-ui-trajectory-categories
```

重启 dsh web 服务并刷新页面，会话头部会出现「分类」标签页。

**手动安装（想自己控制 patch 层时）：**

1. 把本包放入目标 profile 的 `node_modules`
   （如 `~/.dsh/profiles/node_modules/dsh-client-ui-trajectory-categories`）。
2. 在目标 profile 的 `cordis.patch.yml` 追加：

   ```yaml
   - insert:
       - id: ui-trajectory-categories
         name: 'dsh-client-ui-trajectory-categories'
   ```

3. 重启 dsh web 服务并刷新页面。

## 文件

- `lib/index.js` — 宿主侧空实现（浏览器专用插件）。
- `lib/client.js` — 浏览器 bundle（`window.__ModuleLoader__.load` 格式，手工构建，仅依赖 React，界面文案全中文）。
- `test-smoke.mjs` — 冒烟测试：加载 bundle、执行 `apply`、用真实 React 服务端渲染含数据 / 空数据 / 展开详情 / 中文工具名归类场景。
- `test-interact.mjs` — jsdom 交互测试：点击详情、拖动平移、Ctrl+滚轮缩放、悬停高亮、排斥、节点拖动（父带动子）、连线对齐、问题画布切换、点击切换子流程、拖动后点击忽略。

## 验证

```bash
npm install        # 安装 react / react-dom / jsdom 开发依赖
npm test           # SSR 冒烟测试
npm run test:interact   # jsdom 交互测试
```

## 贡献者

- [宋仕尧 (FlapPearLabs)](https://github.com/FlapPearLabs) — 贡献了 **热力图 + 分类排行榜** 功能（[PR #1](https://github.com/QWQ-nn/dsh-client-ui-trajectory-categories/pull/1)）与 **eventLocations 兜底修复**（[PR #2](https://github.com/QWQ-nn/dsh-client-ui-trajectory-categories/pull/2)）。

## License

MIT © QWQ-nn
