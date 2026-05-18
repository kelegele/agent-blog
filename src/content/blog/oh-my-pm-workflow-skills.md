---
title: 把产品经理工作流做成 Skill，解放重复工作
description: Oh-My-PM 把需求澄清、竞品分析、PRD、原型、发布和复盘沉淀成 Claude Code、Codex、WorkBuddy、Trae 可用的 Agent Skills，并给出安装和使用方式，让产品经理少做重复整理，多做判断、定方向和推动结果。
date: 2026-05-18
category: 极客
categorySlug: geek
draft: false
---

这篇文章介绍的是 **[Oh-My-PM](https://github.com/kelegele/oh-my-pm)**：一个把**产品经理工作流**做成 **[Agent Skill](https://docs.anthropic.com/en/docs/claude-code/skills)** 的插件项目。它不是一个新的 [SaaS](https://en.wikipedia.org/wiki/Software_as_a_service)，也不是一个“万能产品经理机器人”，而是把**需求澄清**、**竞品分析**、**PRD**、**原型**、**发布协调**和**上线复盘**这些高频流程，沉淀成 [Claude Code](https://claude.ai/code)、[Codex](https://github.com/openai/codex)、[WorkBuddy](https://www.codebuddy.cn/) 和 [Trae](https://www.trae.ai/) 等 Agent 工具可以复用的 Skills。

我的出发点很简单：**产品经理**的很多工作并不是低价值工作，而是重复、繁琐、上下文很多。每次写 [PRD](https://www.atlassian.com/agile/product-management/requirements)，都要重新整理背景、目标、用户场景、范围、验收标准；每次做竞品分析，都要重新搭对比维度；每次功能上线，都要重新列发布清单、风险项和复盘指标。

这些工作不能完全模板化，因为每个产品、行业、阶段都不同。但它们也不应该每次从零开始。**Agent Skill** 正好卡在中间：把稳定的流程、判断标准、输出格式和上下文传递方式固定下来，把具体判断留给人和模型。

## Oh-My-PM 是什么

Oh-My-PM 是一个面向产品经理的 **AI Agent 工作流系统**，仓库在 [kelegele/oh-my-pm](https://github.com/kelegele/oh-my-pm)。

它当前的核心结构是：

- **20 个 Skills**，覆盖产品工作的主要环节
- **8 个 Subagents**，处理研究、竞品、访谈、数据、复盘等长上下文任务
- **4 个 Commands**，用于直接触发完整工作流
- **5 层产品工作流**：需求感知、策略规划、方案设计、交付协调、价值验证

这 5 层对应的是一个完整闭环：

- 需求感知：市场情报、用户研究、竞品分析、数据监控、需求澄清
- 策略规划：产品定位、路线图规划、优先级排序
- 方案设计：PRD 生成、HTML 原型、流程优化
- 交付协调：需求评审、项目协调、发布管理
- 价值验证：效果分析、反馈汇总、迭代规划

![Oh-My-PM 五层产品工作流闭环图](/blog/geek/oh-my-pm-five-layer-loop.svg)

这个结构解决的是一个实际问题：PM 工作不是单点任务，而是一条链路。竞品分析的结果应该能进入 PRD，PRD 应该能进入原型和评审，发布之后的数据和反馈又应该回到下一轮迭代。

所以 Oh-My-PM 没有把能力做成一个巨大 prompt，而是拆成多个 Skill，并通过 **`context/` 目录**传递中间产物。比如 `competitive-analysis.json` 可以被 PRD 生成读取，`impact-analysis.json` 和 `feedback-synthesis.json` 可以被迭代规划读取。

## 从 4 个 Skill 到 20 个 Skill

这个项目不是一开始就长成现在这样。

**v0.1.0** 只有 4 个核心 Skills：竞品分析、PRD 生成、迭代规划和 quick-prd。这个阶段解决的是最小闭环：先分析竞品，再写一份可落地的 PRD。

**v0.2.0** 扩展成完整 5 层架构，把产品定位、路线图、优先级、需求评审、项目协调、发布管理、效果分析和反馈汇总都补齐。这个阶段的关键变化是：它从“几个好用的提示词”变成了“产品工作流系统”。

**v0.3.0** 引入 8 个 [Subagents](https://docs.anthropic.com/en/docs/claude-code/sub-agents)。研究类任务、竞品任务、用户访谈任务会产生大量上下文，如果都塞进主对话，后续工作会变得混乱。Subagent 的价值是隔离任务、控制工具权限、让不同任务用不同模型，并且可以沉淀独立记忆。

**v0.5.1** 加入 Commands：`/quick-prd`、`/full-pm-cycle`、`/feature-launch` 和 `/ompm`。这让常用工作流可以直接调用，而不是每次靠自然语言猜测。

**v0.6.0** 把原型从外部工具依赖切到 [HTML](https://developer.mozilla.org/en-US/docs/Web/HTML) 原型。对 PM 来说，能快速看到 wireframe、mockup 或 interactive prototype，比“理论上可以连到某个设计工具”更重要。

**v0.8.0** 引入 **Plan-and-Execute 模式**，给工作流加上阶段、状态追踪和质量门控。原因也很现实：AI 很容易一路往前冲，但产品工作需要在关键节点停下来确认方向。

**v0.9.0** 之后，项目重点转向更好的插件化和跨工具可用性：Skill 目录扁平化、支持 Codex 安装、补齐中文文档、减少单个 Skill 对上下文的依赖。

## 怎么安装

如果你使用 Claude Code 或 OpenAI Codex，最直接的方式是通过 **`skills` CLI** 安装：

```bash
# Claude Code
npx skills add kelegele/oh-my-pm -a claude-code

# Codex
npx skills add kelegele/oh-my-pm -a codex

# 只安装 PRD 生成 Skill
npx skills add kelegele/oh-my-pm --skill prd-gen -a codex

# 查看可安装的 Skills
npx skills add kelegele/oh-my-pm --list
```

安装后可以用自然语言触发：

```text
帮我分析 Notion 和飞书文档的竞品差异
写一个用户个人中心改版的 PRD
这个功能上线后效果如何
我们的产品应该如何定位
```

也可以用命令触发工作流：

```bash
/quick-prd "用户个人中心改版" 淘宝 京东
/full-pm-cycle "新项目管理工具"
/feature-launch "用户注册流程"
```

## 国产 Agent 工具怎么用

我现在更推荐把 Oh-My-PM 理解成一组**标准化的 Skill 目录**，而不是只绑定某一个 Agent。只要一个工具能读取 `SKILL.md`，或者支持导入自定义技能，就可以复用这套工作流。

下面保留两个更偏产品同学会遇到的国产 Agent 工具：WorkBuddy 和 Trae。

## WorkBuddy：从技能市场上传，或让 Agent 创建

[腾讯云代码助手 WorkBuddy](https://www.codebuddy.cn/) 的 [技能市场文档](https://www.codebuddy.cn/docs/workbuddy/From-Beginner-to-Expert-Guide/Function-Description/Skills-Market) 里有三种入口：**上传技能**、**查找技能**、**创建技能**。

手动添加 Oh-My-PM 的建议做法是：先按需打包单个高频 Skill，再上传到 WorkBuddy。

比如先打包 PRD 生成：

```bash
git clone https://github.com/kelegele/oh-my-pm.git
cd oh-my-pm
zip -r prd-gen.zip skills/prd-gen
```

然后在 WorkBuddy 里：

1. 打开技能市场
2. 点击添加技能
3. 选择上传技能
4. 上传 `prd-gen.zip`
5. 导入后启用这个技能

如果你不想手动处理，可以直接让 WorkBuddy 创建一个等价技能。可以这样对它说：

```text
请帮我创建一个产品经理 PRD 生成 Skill。

触发条件：
当我说“写 PRD”“产品需求文档”“需求方案”时触发。

能力要求：
先澄清需求，再输出结构化 PRD。
PRD 需要包含背景、目标、用户场景、功能范围、验收标准、风险、数据指标和后续迭代建议。

输出要求：
保存到当前项目的 context/prd/ 目录。
如果目录不存在，请先创建。
不要修改业务代码。
```

这类“让 Agent 帮添加”的方式很适合产品、运营、业务同学。你不用理解 `SKILL.md` 的全部格式，只要把触发条件、处理流程、输出格式讲清楚。

## Trae：优先用导入入口，项目级目录做备选

[Trae 官方博客](https://www.trae.ai/blog/trae_tutorial_0115) 已经有 **Agent Skills** 的创建、导入和使用指南。由于 Trae 的版本和入口变化比较快，我建议文章读者优先使用产品内的导入入口，而不是死记某个全局路径。

手动方式：

1. 打开 Trae 的设置或 Agent Skills 页面
2. 找到 Skills、Rules and Skills 或 Agent Skills 相关入口
3. 选择导入 Skill
4. 上传或选择包含 `SKILL.md` 的 Skill 目录
5. 在对话框里输入 `/`，确认 Skill 是否出现在列表里

如果你的 Trae 版本支持项目级 `SKILL.md` 目录，也可以尝试：

```bash
git clone https://github.com/kelegele/oh-my-pm.git

mkdir -p your-project/.trae/skills
cp -R oh-my-pm/skills/prd-gen your-project/.trae/skills/
cp -R oh-my-pm/skills/competitive-analysis your-project/.trae/skills/
cp -R oh-my-pm/skills/quick-prd your-project/.trae/skills/
```

然后重启 Trae，在对话框里输入 `/` 查看是否能发现这几个 Skill。如果没有出现，就回到 UI 导入方式。不要在不确定的情况下改全局目录。

也可以让 Trae Agent 帮你安装：

```text
请帮我把 GitHub 仓库 kelegele/oh-my-pm 里的 prd-gen、competitive-analysis、quick-prd 三个 Skill 安装到当前项目。

要求：
1. clone 或下载这个仓库；
2. 检查每个 Skill 目录里是否有 SKILL.md；
3. 创建 .trae/skills/ 目录；
4. 只复制这三个 skills/<name>/ 目录；
5. 不要修改当前项目的业务代码；
6. 完成后告诉我是否需要重启 Trae，以及应该用哪些 / 命令调用。
```

这段 prompt 的重点是“只复制 Skill 目录，不要改业务代码”。让 Agent 帮安装工具时，一定要把边界写清楚。

## 真正解放的是哪些重复工作

Oh-My-PM 最适合处理的不是“拍脑袋做战略”，而是那些**每周都会出现、每次都要重新整理**的工作。

比如快速 PRD：

```bash
/quick-prd "用户个人中心改版" 淘宝 京东
```

它会先做竞品分析，再把分析结果带入 PRD。这样生成的不是空泛需求文档，而是带竞品参照、用户场景和功能范围的初稿。

比如需求澄清：

```text
我想做一个直播配置助理，先帮我澄清需求
```

Agent 不应该立刻写方案，而应该先问清楚目标用户、业务场景、输入输出、约束条件和成功指标。这个流程一旦做成 Skill，每次都会稳定执行。

比如发布管理：

```text
帮我为用户注册流程生成上线检查清单
```

它可以稳定输出发布范围、风险项、回滚预案、灰度策略、通知对象和上线后观察指标。

这些事情以前都靠 PM 自己复制旧文档、改标题、查漏补缺。Skill 的价值就是把这些“每次都差不多，但又不能完全一样”的流程固化下来。

## 为什么要用 Subagent

有些任务适合直接用 Skill，有些任务适合交给 Subagent。

**Skill 更像工作说明书**。它告诉主 Agent：什么时候触发、按什么流程做、输出什么格式、要遵守什么质量标准。

**Subagent 更像一个独立执行者**。市场研究、竞品分析、用户访谈、数据监控、效果复盘这些任务，通常会产生大量材料。如果全部留在主对话里，后续 PRD 和发布计划会被上下文噪音淹没。

所以 Oh-My-PM 把 8 个任务拆给 Subagents：

- market-researcher：市场研究
- competitive-analyst：竞品分析
- user-interviewer：用户研究
- data-monitor：指标监控
- process-optimizer：流程优化
- impact-analyst：效果分析
- feedback-collector：反馈汇总
- pm-orchestrator：完整工作流编排

这不是为了炫技，而是为了让长任务有隔离空间，让主对话保持清晰。

## 开发 Skill 的几个经验

第一，**Skill 要能独立安装**。

早期我也容易把共享规则放在某个公共文件里。但一旦用户只安装单个 Skill，公共文件就可能丢失。所以后来感知层的反幻觉规则被内嵌到每个相关 Skill 里。独立可用比结构漂亮更重要。

第二，**不要只写“怎么输出”，还要写“什么时候停下来问”**。

产品工作最怕 Agent 太主动。需求不清楚时，它不应该编；竞品信息没有来源时，它不应该猜；PRD 场景没有确认时，它不应该默认。好的 Skill 必须有澄清 gate。

第三，**用文件传递上下文，比只靠聊天记录稳定**。

`context/competitive-analysis.json`、`context/prd/*.md`、`context/impact-analysis.json` 这些文件看起来朴素，但它们让工作流可以跨会话、跨 Skill 接力。聊天记录适合交流，文件适合沉淀。

第四，**国产 Agent 工具要按它自己的入口适配**。

不同工具的入口不同：WorkBuddy 偏技能市场上传和创建，Trae 偏导入和产品内管理。不要假设所有工具都支持同一条命令。更稳的做法是：保留标准 `SKILL.md` 目录结构，再给每个工具写清楚安装路径。

第五，**别把所有能力堆进一个万能 Skill**。

PM 工作链路很长。如果一个 Skill 同时负责市场研究、PRD、原型、发布和复盘，它一定会变得难维护。拆成小 Skill，再用 workflow 串起来，反而更稳定。

## 写在最后

PM Agent 不该只是一个聊天机器人。

真正有用的 PM Agent，应该能把专业流程沉淀下来：什么时候问问题，什么时候查资料，什么时候写文档，什么时候做评审，什么时候进入下一阶段。

Oh-My-PM 想做的就是这件事：把产品经理的重复工作做成可安装、可复用、可迁移的 Skills。Claude Code 可以用，Codex 可以用，WorkBuddy 和 Trae 也可以通过导入或 Agent 辅助创建来使用。

工具会变，目录会变，模型会变。但有一件事不会变：PM 的价值不在于反复整理格式，而在于做判断、定方向、识别风险和推动结果。

Skill 要解放的，正是这些判断之前的重复劳动。
