# dsh-client-ui-trajectory-categories

分类轨迹视图（Trajectory Categories）——一个纯浏览器端的 DSH Web 客户端插件。

把会话的**轨迹（Trajectory）记录按动作类型分组摘要**，点开某个类别即可查看其中每条详细动作（工具调用、参数、结果、错误），**同时完整保留原有的“轨迹”流程列表**（本插件只是新增一个标签页，不改动原列表）。

## 特性

- **中文分类，中文语境优先**：
  - 分类标签**固定显示中文**（写入 / 读取 / 下载 / 命令 / 查询 / 子代理 / 其他工具 / 消息 / 压缩），不随界面语言变化；
  - 分类匹配**同时识别中英文工具名/术语**——例如「写入」「写文件」「编辑」「修改」「读取」「查看」「查找」「下载」「抓取」「命令」「执行」「运行」「终端」「搜索」「查询」「子代理」「委派」等中文关键词都能正确归类；
  - 参数预览优先展示文件路径 / URL / 命令 / 查询词等关键字段（如 `写入文件 → 中文文档.txt`），更贴合中文阅读习惯。
- **分类聚合**：每类带数量徽标；点击类别展开记录列表，点击记录展开参数、结果全文与错误信息。
- **保留原列表**：以新增 `conversation.view` 标签页（“分类”）的方式叠加，原始“轨迹”标签页原样保留。
- **零额外 token 消耗**：
  - 纯浏览器端本地聚合，不发起任何模型请求、不做 LLM 摘要；
  - 数据直接复用 ui-trajectory 已构建的 `trajectory` 视图投影，不重复处理事件流；
  - 默认全部折叠，只有展开的类别才渲染条目；参数/结果先渲染截断预览，点击才渲染全文；
  - 每类默认只渲染前 40 条，可点“显示更多”按需加载。
- **过滤与跳转**：支持按工具名/内容实时筛选；聊天视图的“Inspect”操作会联动展开对应调用。

## 依赖

- `@deepseek-ai/dsh-client-ui-trajectory`（提供 `trajectory` 视图投影，数据源）
- `@deepseek-ai/dsh-client-runtime`、`@deepseek-ai/dsh-client-ui-conversation`

## 安装

1. 把本包放入目标 profile 的 `node_modules`（例如
   `~/.dsh/profiles/node_modules/dsh-client-ui-trajectory-categories`）。
2. 在目标 profile 的 `cordis.patch.yml` 追加：

   ```yaml
   - insert:
       - id: ui-trajectory-categories
         name: 'dsh-client-ui-trajectory-categories'
   ```

3. 重启 dsh web 服务，刷新页面后会话头部标签页会出现“分类”。

## 文件

- `lib/index.js` — 宿主侧空实现（浏览器专用插件）。
- `lib/client.js` — 浏览器 bundle（`window.__ModuleLoader__.load` 格式，手工构建，仅依赖 React，全部界面文案为中文）。
- `test-smoke.mjs` — 冒烟测试：加载 bundle、执行 `apply`、用真实 React 服务端渲染含数据/空数据/展开详情/中文工具名归类四种场景。

## 验证

```bash
node test-smoke.mjs
```
