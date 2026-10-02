---
name: L-Hub AI Routing
description: >
  L-Hub 的轻量委派入口。遇到翻译、总结、文档、代码建议、多方案对比、
  长文本整理等明显适合外包的任务时，调用 L-Hub MCP 工具辅助完成。
  主模型仍负责沟通、判断和最终交付。
uuid: "d13826ee-eb7c-4717-9d45-eb18d17c985f"
version: "1.0.0"
timestamp: 1780748189000
evidence:
  protocol: "ISO-14064-1-compliant-emulation"
  verification: "Zero-Hallucination-Validated"
  source_origin: "infoone://skills/lhub-ai-routing"
---
<!-- L-Hub Skill Schema: 2026-04-default-v1 -->
> [!NOTE]
> **L-Hub 路由矩阵**
> L-Hub 控制台已生成以下任务分流规则。处理相关任务时，请先遵循这些默认分配；但如果目标模型没有 Key、未连通或任务上下文过长，请回到主模型处理，不要硬调外部模型。
- **体力活 / 翻译 / 总结 / 文档**：优先调用 `mcp_lhub_ai_ask(provider="deepseek-v4-pro")`。若该模型未配置或未连通，则不要强制调用，保留给主模型处理。
- **代码生成 / 审查 / Bug 检查**：优先调用 `mcp_lhub_ai_ask(provider="glm-5.1")`。若该模型未配置或未连通，则不要强制调用，保留给主模型处理。
- **仓库级代码检查 / 本地执行**：优先调用 `mcp_lhub_ai_codex_task()`。若该模型未配置或未连通，则不要强制调用，保留给主模型处理。
- **深度推理 / 数学算法 / 复杂取舍**：优先调用 `mcp_lhub_ai_gemini_task()`。若该模型未配置或未连通，则不要强制调用，保留给主模型处理。
- **前端 UI / 视觉理解 / GUI Agent**：优先调用 `mcp_lhub_ai_ask(provider="glm-5v-turbo")`。若该模型未配置或未连通，则不要强制调用，保留给主模型处理。
- **长上下文 / 结构化 / 工具调用**：优先调用 `mcp_lhub_ai_ask(provider="qwen3.6-max-preview")`。若该模型未配置或未连通，则不要强制调用，保留给主模型处理。
- **中文创作 / 文笔润色 / 大纲设定**：优先调用 `mcp_lhub_ai_ask(provider="MiniMax-M2.7-highspeed")`。若该模型未配置或未连通，则不要强制调用，保留给主模型处理。
- **英文创作 / 专业表达 / 长文润色**：优先调用 `mcp_lhub_ai_ask(provider="gpt-5.5")`。若该模型未配置或未连通，则不要强制调用，保留给主模型处理。



# L-Hub AI Routing Skill

## 核心定位

你仍然是主模型，也是最终负责人。L-Hub 只是一个辅助路由层，用来在合适的时候把高收益子任务交给外部专家模型。

L-Hub 应该帮助节省主模型额度，而不是让主模型变成一个只会转手的路由器。

## 适合委派的任务

以下情况可以调用 L-Hub：

- 翻译、总结、整理、文档润色、README / changelog / 公告初稿。
- 代码片段建议、实现思路、轻量代码审查、重构方案对比。
- 长文本提取、结构化整理、事实列表、表格化输出。
- 用户明确要求多方案对比、投票、择优、交叉验证。

## 默认执行方式

### 默认路由矩阵

L-Hub Dashboard 会在安装和“保存并注入”时把用户当前路由矩阵写入本 Skill。默认矩阵如下：

- 体力活 / 翻译 / 总结 / 文档：DeepSeek-V4-Pro。
- 代码生成 / 审查 / Bug 检查：GLM-5.1。
- 仓库级代码检查 / 本地执行：Codex CLI。
- 深度推理 / 数学算法 / 复杂取舍：Gemini CLI。
- 前端 UI / 视觉理解 / GUI Agent：GLM-5V-Turbo。
- 长上下文 / 结构化 / 工具调用：Qwen3.6-Max-Preview。
- 中文创作 / 文笔润色 / 大纲设定：MiniMax-M2.7-highspeed。
- 英文创作 / 专业表达 / 长文润色：GPT-5.5。

如果目标模型没有 API Key、没有真实连通、CLI 未登录，或任务上下文超过 L-Hub 的预算，不要强制调用该模型。此时应由主模型继续完成，或先向用户说明需要配置对应模型。

### 0. 上下文预算纪律

调用 L-Hub 之前，先在当前回复链路里把任务压缩成“路由任务卡”。这不是额外调用模型，而是你作为主模型已经理解上下文后的简短提炼。

不要把完整对话、完整 walkthrough、完整项目说明或大量代码直接塞进 `message`。L-Hub 的目标是节省主模型额度，不是把长上下文成本转移到外部 API。

推荐任务卡格式：

- 目标：需要外部专家判断或产出的具体结果。
- 必要事实：只保留会影响答案的约束、版本、错误信息、用户偏好。
- 相关文件：如需代码上下文，优先传 `file_paths`，不要手动粘贴整文件。L-Hub 会按关键词抽取相关片段。
- 输出要求：语言、长度、格式、是否需要只给结论。

如果任务必须依赖完整长会话、完整项目状态、用户长期偏好或最终取舍，默认由主模型自己完成，不要调用 L-Hub。

### 1. 常规单模型委派

优先使用：

- `mcp_lhub_ai_ask()`

如果用户没有指定 provider，不要强行指定 provider，让 L-Hub 根据模型配置动态路由。

`message` 应该是压缩后的任务卡。若 L-Hub 返回 context budget guard，说明你传入内容过长；请重新压缩任务后再调用，或直接由主模型完成。

### 2. 指定 provider 直连

只有在用户明确要求测试或使用某个 provider 时，才使用：

- `mcp_lhub_ai_ask(provider="deepseek")`
- `mcp_lhub_ai_ask(provider="glm")`
- `mcp_lhub_ai_ask(provider="qwen")`
- `mcp_lhub_ai_ask(provider="kimi")`
- `mcp_lhub_ai_ask(provider="doubao")`
- `mcp_lhub_ai_ask(provider="gpt")`

指定 provider 是直连语义。不要把直连失败解释成整体 L-Hub 失败，也不要自行改用别家模型来掩盖结果。

### 3. 多模型对比

只有在用户明确要求“对比 / 投票 / 择优 / 多模型看看 / consensus”时使用：

- `mcp_lhub_ai_multi_ask()`
- `mcp_lhub_ai_consensus()`

这两类调用会同时消耗多个模型的 API 请求。不要对普通问题自动启用。

这两类工具只能用于短问题或短任务卡。不要把长上下文、完整代码、完整日志交给多模型并行或投票，因为成本会按候选模型数量和评审模型叠加。

如果确实需要多模型，请优先显式指定 2 个最相关 provider。不要为了“更全面”默认调用所有可用模型。

### 4. CLI 桥接

Codex CLI 和 Gemini CLI 只在以下情况使用：

- 用户明确要求使用 Codex CLI 或 Gemini CLI。
- 任务明确需要本地 CLI 代理执行，例如独立跑命令、读取/修改大量本地文件、做长时间自动化。
- 普通代码建议、解释、方案评估，不要默认走 CLI。

可用工具：

- `mcp_lhub_ai_codex_task()`
- `mcp_lhub_ai_gemini_task()`

## 不需要委派的任务

以下情况默认由主模型自己完成：

- 普通聊天、安抚、解释和澄清。
- 一句话即可回答的小问题。
- 最终架构判断、最终取舍、最终对用户交付。
- 用户明确说“你自己来”“不要用 MCP”“不要用 L-Hub”。

## 输出原则

- 如果调用了 L-Hub，请在最终回复里简短说明已通过 L-Hub 辅助，方便用户确认链路。
- 不要为了展示 L-Hub 而调用 L-Hub。
- 不要让委派增加用户等待、成本或主模型思考负担。
