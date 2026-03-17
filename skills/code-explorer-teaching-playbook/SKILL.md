---
name: code-explorer-teaching-playbook
description: Apply progressive-course teaching patterns inspired by learn-claude-code. Use this skill when planning or writing code-explorer docs that should teach through stages, mental models, and one key mechanism at a time.
---

# Code Explorer Teaching Playbook

该技能把 `learn-claude-code` 的教学特征增量注入 `code-explorer` 插件体系。

它不替换现有五阶段工作流，而是在原有流程上增加三类教学约束：

1. 递进课程
2. 理解框架优先
3. 单机制聚焦

## 递进课程

规划任务时，不只要决定“分析哪些文件”，还要决定：

- 这一节属于哪个学习阶段
- 为什么现在学这一节
- 读完这一节之后下一步应该读什么

推荐阶段：

- 第一阶段：建立入口和词汇表
- 第二阶段：追踪主链路与执行可靠性
- 第三阶段：理解交付、亮点与扩展边界

## 理解框架优先

每篇核心文档在进入源码细节前，先用 1 到 2 句交代：

- 当前主题应该被看成什么
- 读者在这一节里最应该抓住的理解框架是什么

不要一上来就进入函数细节、目录结构或代码片段，也不要把这部分扩写成独立大章节。

## 单机制聚焦

每篇核心文档优先讲清一个关键机制，例如：

- 入口参数如何决定工作区行为
- 状态文件如何承担恢复职责
- 波次 barrier 如何保护前置摘要
- writer 与 reviewer 如何形成质量门禁

如果某一节同时塞入多个同级主题，优先拆分，而不是堆在一篇里。

## 对 orchestrator 的要求

生成任务时，每个核心任务至少补充：

- `lesson_stage`
- `lesson_tagline`
- `mental_model`
- `focus_mechanism`

## 对 writer 的要求

最终 docs 中应新增一份 `COURSE_OVERVIEW.md`，至少说明：

- 学习阶段划分
- 每阶段的核心任务
- 每节课的当前聚焦
- 每节课的理解框架
- 每节课聚焦的关键机制

## 对 reviewer 的要求

额外审查以下问题：

- 有没有课程阶段但没有体现阶段差异
- 有没有直接进入细节、缺少最基本的理解框架
- 有没有把“理解框架”扩写成空洞段落
- 有没有一节课讲太多主题，失去聚焦
