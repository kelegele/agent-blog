---
title: agentsmd 使用指南：五个场景让 AI 不再重复踩坑
description: AI 每次开新会话都重复踩同一个坑？agentsmd-skill 把会话教训蒸馏成一行一条的可执行规则，写进项目根目录的 AGENTS.md。本文按五个真实场景介绍它的用法：固化教训、瘦身规范、冷启动、文档目录沉淀、记忆同步，附安装方法与触发话术。
date: 2026-11-09
category: 创造力
categorySlug: creativity
draft: false
---

先对号入座。你大概率有一份这样的经历：周一告诉 AI「这个项目用 pnpm，别用 npm」，周三新会话它又 `npm install` 了；纠错记录散落在几十个会话日志里，换台电脑、换个工具，全部蒸发；硬着头皮让 AI 写一份项目规范，得到一个 500 行的「最佳实践」堆——一半是常识，一半是从没跑过的命令。文件越胖，读它的 AI 越是选择性失明。

[agentsmd-skill](https://github.com/kelegele/agentsmd-skill) 就是为这些时刻做的：把这次会话踩的坑蒸馏成一行一条的可执行规则，写进项目根目录的 [AGENTS.md](https://agents.md/)。从此每个新会话——[Claude Code](https://claude.com/claude-code)、[Codex](https://openai.com/codex)、[Cursor](https://cursor.com) 都一样——开工前先读它，照着做。它守四条底线：一条规则只说一件事、全文不超 120 行、写进去的命令必须真跑过、所有改动先给你批准。

这篇文章不讲设计原理（[那篇](/blog/agents-md-lessons-without-bloat)早就写过了），按五个真实场景讲它什么时候用、怎么用。

## 场景一：同样的坑，每次会话都要重新踩一遍

最常见的场景。这次会话里你纠正了 AI 三次：测试要先起本地数据库、部署脚本别碰 `main` 分支、报错先看 `pnpm logs`。下次会话，它照犯。

会话收尾时说一句：

> 把这次会话踩的坑固化成项目规则

它会走一条固定流水线：先收集——你指出的错误、真实撞上的坑、重复两次以上的偏好才算数，一次性细节和常识直接排除；再蒸馏——泛化、压成一行、归入最贴的章节，过「会再遇到、违反有损失、一行说得清」三道准入，缺一道就丢；然后和现有规则做合并比对——等价的丢弃、重叠的合并、冲突的保新的；最后把完整变更方案摆给你，批准了才动文件。

## 场景二：AGENTS.md 已经写成了垃圾堆

如果规范文件已经四五百行，规则互相打架、常识占半壁江山，AI 读它约等于没读。

还是一句话：

> 更新项目规范：按合并决策表并入这次的教训，超 120 行先删后加

它做的是有机合并而非追加：五道闸门（等价丢弃 / 重叠合并 / 特例被通用版本替换 / 冲突保新 / 过时删除）筛完，逼近 120 行硬上限就先削减再新增。仍有价值但不达标的内容——比如一段低频操作细节——迁往 `docs/<主题>.md`，根文件留一行引用。删的是冗余，不是记忆。

## 场景三：新项目冷启动，想要一份能跑的规范

新项目还没有 AGENTS.md，你想要一份从目录结构、README 和构建配置长出来的首版规范，而不是模板填空。

> 还没有 AGENTS.md——用 agentsmd 生成首版，命令逐条实跑验证

这一步的差异点在命令验证：写入的每条构建、测试命令逐条实跑；部署、迁移这类不便实跑的，与 `package.json` scripts、Makefile、CI 配置逐一核对，对不上不写入。为什么这么轴？因为这个文件对 AI 来说是「可信上下文」，一条假命令比十条缺规则更致命——agent 会信以为真地执行。这是[发布后被真实使用打脸](/blog/agentsmd-skill-iteration-retrospective)换来的规则。

## 场景四：目录里没有代码，全是文档和数据

报告库、写作协作目录、数据空间——没有 `package.json`，「构建命令」「lint 规范」这些章节毫无意义，它们真正要管的是数据口径、命名归档、交付复核。

> 给这个协作目录沉淀工作规则，并归集散落的报告、数据和参考资料

流程开始前会先判定这是 coding 还是 work 场景：work 场景扫描文档结构和命名约定，规则偏向数据定义、归档与交付；归集时文档进 `docs/`、机器可读数据进 `data/`、参考资料进 `references/`。移动前先全项目查引用，被引用的文件不动，移完逐个修断链——而且所有移动都要你批准。

## 场景五：你的 agent 有个人记忆，但和项目脱节

Hermes、OpenClaw 这类带记忆机制的个人 agent，记忆条目常常和具体项目对不上：这条教训属于哪个项目？下次在这个项目里还适用吗？

顺手的做法是固化教训时捎带一句：

> 把教训写进 AGENTS.md，并归集散落在根目录的文档和数据

它不建私有记忆格式，完全搭宿主便车：agent 有记忆机制，项目记忆就按宿主自己的格式沉淀，先查重、经批准再写入；没有记忆机制就静默跳过。TODO 和 CHANGELOG 也一并更新。装在哪个 agent 里，就长成那个 agent 的样子。

## 安装与更新

三种方式任选，[skills.sh](https://skills.sh/kelegele/agentsmd-skill) 数据显示最常用的是第一种：

```bash
# 方式一：skills CLI（推荐，可一句话更新）
npx skills add kelegele/agentsmd-skill
npx skills update agentsmd   # 以后更新

# 方式二：git clone（全局装到 Claude Code；项目级用 .claude/skills/agentsmd）
git clone https://github.com/kelegele/agentsmd-skill.git ~/.claude/skills/agentsmd
git -C ~/.claude/skills/agentsmd pull   # 以后更新

# 方式三：不想装任何东西？把仓库地址丢给你的 agent
# "Install this skill for me: https://github.com/kelegele/agentsmd-skill"
```

也在 [ClawHub](https://clawhub.ai)（`clawhub install agentsmd`）和 [LobeHub](https://lobehub.com) Skills Marketplace 上架了。装完部分 agent 需要重启或开新会话才加载。AGENTS.md 本身遵循开放规范，Claude Code、Codex、Cursor、[Gemini CLI](https://github.com/google-gemini/gemini-cli)、OpenCode、WorkBuddy 读的是同一个文件。

## 三个高频疑问

**会不会让 AI 堆一堆通用常识凑数？** 不会。「三道准入」是硬流程，为凑数堆常识被明确写进了禁令——一次性细节和常识在收集阶段就被排除。

**文件会不会无限长？** 不会。120 行硬上限，追加被禁止，超了先削减；有价值的细节迁去 `docs/`，根文件留一行引用。

**会不会不经我同意就改文件？** 不会。AGENTS.md、记忆、进度文件、移动文档，全部先出完整方案、批准后才执行。

## 现在就开始

最小成本的开始方式：挑一个你反复纠错的项目，装上，然后让 AI 把这次会话的教训固化进去。看一遍它给出的变更方案——哪些进、哪些合并、哪些删、每条规则为什么这样写——你会立刻知道这东西是不是你的菜。

仓库在 [GitHub](https://github.com/kelegele/agentsmd-skill)，问题和想法欢迎提 [Issues](https://github.com/kelegele/agentsmd-skill/issues)。想深挖设计的，读[设计哲学篇](/blog/agents-md-lessons-without-bloat)；想知道这七个版本是怎么被真实使用打出来的，读[迭代复盘篇](/blog/agentsmd-skill-iteration-retrospective)。
