# scripts

该目录存放 `code-explorer` 的辅助安装与校验脚本。

## 当前脚本

- `install.ps1`
  - Windows 安装脚本
  - 将当前仓库复制到 Claude 插件目录，并执行安装后自检
- `install.sh`
  - macOS / Linux 安装脚本
  - 将当前仓库复制到 Claude 插件目录，并执行安装后自检

## 设计边界

这些脚本只负责安装、复制和自检，不承担主工作流。

主工作流仍然完全由以下目录驱动：

- `commands/`
- `agents/`
- `skills/`
- `templates/`

## 推荐使用方式

### Windows

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\install.ps1
```

### macOS / Linux

```bash
bash ./scripts/install.sh
```

## 维护原则

- 脚本只做重复性安装工作
- 不引入第二套运行时
- 所有安装完成后都应能用 `claude --plugin-dir <path>` 直接验证
