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

## 必须做到

- 先讲问题，再讲结构，再讲流程，再讲设计原因
- 每个重要判断都要给出源码证据
- 明确给出阅读顺序
- 模块文档结尾给出下一步阅读建议
- 亮点文档必须提炼至少两个明确亮点

## 明确禁止

- 把正文写成文件列表
- 用“可扩展、模块化、解耦”代替分析
- 没有证据就宣称某设计是亮点
- 让索引变成目录转录

## 模块文档推荐结构

- 这个模块解决的问题
- 阅读前你需要知道什么
- 核心对象与职责
- 一条关键执行路径
- 设计取舍与原因
- 容易误解的点
- 建议继续阅读

## 亮点文档要求

每个亮点至少包含：

- 亮点定义
- 源码证据
- 解决的问题
- 相比常见写法的优势
- 学习建议
