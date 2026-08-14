# dsh-client-ui-trajectory-categories

DSH Web 客户端插件：**轨迹分类视图**（Trajectory Categories）。

把会话的轨迹（Trajectory）记录按动作类型分组摘要 —— **写入 / 读取 / 下载 / 命令 / 查询 / 子代理 / 其他工具 / 消息 / 压缩**，点击类别展开详细动作（工具调用、参数、结果、错误），同时完整保留原有的「轨迹」流程列表。

- 分类标签固定中文显示，分类匹配同时识别中英文工具名/术语；
- 纯浏览器端本地聚合：**不发起任何模型请求，不额外消耗 token**；
- 数据复用 ui-trajectory 的 `trajectory` 视图投影，默认折叠、按需渲染。

## 快速开始

```bash
cd dsh-client-ui-trajectory-categories
node test-smoke.mjs        # 冒烟测试
```

## 安装

1. 把 `dsh-client-ui-trajectory-categories` 放入目标 profile 的 `node_modules`
   （如 `~/.dsh/profiles/node_modules/dsh-client-ui-trajectory-categories`）。
2. 在目标 profile 的 `cordis.patch.yml` 追加：

   ```yaml
   - insert:
       - id: ui-trajectory-categories
         name: 'dsh-client-ui-trajectory-categories'
   ```

3. 重启 dsh web 服务，刷新页面后会话头部出现「分类」标签页。

详见 [`dsh-client-ui-trajectory-categories/README.md`](dsh-client-ui-trajectory-categories/README.md)。

## License

MIT
