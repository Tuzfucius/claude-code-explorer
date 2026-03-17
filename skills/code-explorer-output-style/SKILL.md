---
name: code-explorer-output-style
description: Generate teaching-oriented repository learning documents. Use this skill when the user wants to understand a new repository, asks for architecture explanations, wants project highlights, or needs a guided reading path instead of raw summaries.
---

# Code Explorer Output Style

该技能约束 `code-explorer` 产物的教学表达方式。

## 核心目标

输出必须帮助读者回答：

1. 这个项目解决什么问题
2. 主链路如何从输入走到输出
3. 为什么作者这样设计
4. 读者应该从哪里开始读
5. 哪些内容最值得重点学习

## 模板优先

在开始写文档前，优先读取与目标产物对应的模板：

- `templates/docs/module.template.md`
- `templates/docs/module.rules.md`
- `templates/docs/architecture.template.md`
- `templates/docs/architecture.rules.md`
- `templates/docs/highlights.template.md`
- `templates/docs/highlights.rules.md`
- `templates/docs/index.template.md`
- `templates/docs/index.rules.md`
- `templates/docs/readme.template.md`
- `templates/docs/start-here.template.md`
- `templates/docs/learning-path.template.md`
- `templates/docs/verify-report.template.md`

规则文件优先定义硬性约束，模板文件定义推荐骨架。生成时先满足规则，再填充内容。

## 必须做到

- 先讲问题，再讲结构，再讲流程，再讲设计原因
- 每个重要判断都要给出源码证据
- 在关键节点直接插入源码代码块，并解释应关注什么
- 明确给出阅读顺序
- 模块文档结尾给出下一步阅读建议
- 亮点文档必须提炼至少两个明确亮点
- 解释应比普通摘要更详细，但保持严谨、客观、克制
- 长文档必须提供目录，方便跳转
- 每篇文档末尾都要提供返回总索引的链接

## 明确禁止

- 把正文写成文件列表
- 用“可扩展、模块化、解耦”代替分析
- 没有证据就宣称某设计是亮点
- 让索引变成目录转录
- 用空泛结论代替对代码的具体解释
- 只贴代码块而不解释代码为什么重要

## 代码块规则

当文档讲到关键节点时，必须插入源码片段。关键节点包括：

- 入口函数
- 核心数据结构
- 关键状态流转
- 核心分支判断
- 关键调度或聚合逻辑

代码块要求：

- 使用 fenced code block
- 优先截取 5 到 30 行最关键代码
- 代码块前先说明“为什么看这段”
- 代码块后立即解释：
  - 这段代码在整个链路中的位置
  - 读者应该注意的变量、调用或判断
  - 它体现了什么设计意图

## 解释深度规则

解释应明显强于普通摘要，但不能变成空话扩写。

推荐写法：

- 先给出结论
- 再用代码和调用关系证明
- 最后解释对读者理解项目的意义

不推荐写法：

- 重复改写代码变量名
- 用一大段空泛赞美替代分析
- 在没有证据时推断作者意图

## 长文目录规则

下列任一条件满足时，文档视为长文档，必须在引言后加入目录：

- 含 4 个及以上二级标题
- 正文较长，已经明显超过快速浏览范围

目录建议使用如下结构：

```md
## 目录

- [第一节](#第一节)
- [第二节](#第二节)
- [第三节](#第三节)
```

## 模块文档推荐结构

- 这个模块解决的问题
- 阅读前你需要知道什么
- 核心对象与职责
- 一条关键执行路径
- 设计取舍与原因
- 容易误解的点
- 建议继续阅读

在“核心对象与职责”和“一条关键执行路径”中，必须插入至少一个代码块并配解释。

## 亮点文档要求

每个亮点至少包含：

- 亮点定义
- 源码证据
- 解决的问题
- 相比常见写法的优势
- 学习建议

## 文档末尾回链

每篇文档最后都必须增加一个“返回导航”小节。

顶层文档使用：

```md
## 返回导航

- [返回总索引](./INDEX.md)
```

模块文档使用：

```md
## 返回导航

- [返回总索引](../INDEX.md)
```
