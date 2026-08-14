# dsh-client-ui-trajectory-categories

分类轨迹视图——纯浏览器端的 DSH Web 客户端插件。

把会话的**轨迹（Trajectory）记录按动作类型分组摘要**：写入、读取、下载、命令、查询、子代理、其他工具、消息、压缩。点击类别展开详细动作（工具调用、参数、结果、错误），**原始“轨迹”流程列表完整保留**（插件只是新增一个标签页）。

## 特点

- **中文分类，中文语境优先**：
  - 分类标签固定显示中文，不随界面语言变化；
  - 分类匹配同时识别中英文工具名/术语（写入 / 写文件 / 编辑 / 修改 / 读取 / 查看 / 查找 / 下载 / 抓取 / 命令 / 执行 / 运行 / 终端 / 搜索 / 查询 / 子代理 / 委派 等）；
  - 参数预览优先展示文件路径 / URL / 命令 / 查询词等关键字段，贴合中文阅读习惯。
- 分类聚合，每类带数量徽标；点击类别展开记录，点击记录展开参数/结果/错误全文。
- 纯浏览器端本地聚合：**不发起任何模型请求，不额外消耗 token**。
- 数据复用 ui-trajectory 的 `trajectory` 视图投影，不重复处理事件流。
- 默认全部折叠，按需渲染：展开的类别才渲染条目，参数/结果先渲染截断预览，点击才渲染全文；每类默认 40 条，可“显示更多”。
- 支持按工具名/内容筛选；聊天视图 Inspect 联动展开对应调用。

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

## 验证

```bash
node test-smoke.mjs
```
