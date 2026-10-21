# 更新日志

本仓库（`hlzdhl/dsh-dafeiyu-boot`）从 **1.1.0** 起独立编号，不再沿用上游
[LeeRolling/dsh-boot-suite](https://github.com/LeeRolling/dsh-boot-suite) 的 2.x。

## 1.1.0 — 2026-10-21

基线：上游 `dsh-boot-suite` **2.7.0**（`lib/client.js` 的原样版本经三处改动后合并进来）。

### 新增

- **设置页合并**：原本独立的「聊天背景」设置页（`settings.section` id `chat-wallpaper`，
  order 27）并入「启动动画」页（id `startup-screen`）——动画设置在上，一条分隔线之后
  直接接壁纸面板，设置里只留一张页面
- **跳过联动**：第一幕的 `SKIP ▸` / `Esc` 一次收掉两段 —— 六幕动画 + 开机后的全屏开场视频，
  按下即进入应用，不再被第二段挡一次
- **第二幕自带 SKIP**：开场视频全屏时右上角也有 `SKIP ▸`（`.dsh-cw-skip`），
  位置 `right:46px; top:48px`、字号 `11px`、淡入 `400ms/260ms` 延迟，与第一幕的
  `.dsu-skip` 完全一致；视频播放中按 `Esc` 同样生效
- **检查更新指向本仓库**：`UPDATE_URL` 由上游 releases 改指本仓库 releases

### 变更

- 版本号 `2.7.0` → `1.1.0`（`package.json`、`lib/client.js` 的 `FALLBACK_VERSION`）
- 客户端缓存戳 `cw-21` → `cw-26`，确保升级后不会加载到旧 bundle
- 全屏层保持 `pointer-events: none`（不吞整页点击），只有 SKIP 按钮是 `pointer-events: auto`

### 测试

- 新增 `test/smoke-skip-intro.mjs`（22 条断言，A–J 组）：标记 → 不挂层、事件 → 立刻撤层、
  `Esc`（挂载前后两种时序）、点击 `.dsu-skip`、`__forceReplay` 优先、splash 源码级约定、
  SKIP 位置与第一幕一致
- `test/smoke-client.mjs`、`test/smoke-desktop-boot.mjs`：设置节注册数 `2 → 1`
- `test/smoke-wallpaper-once.mjs`：把「整层不可点」的断言收紧到根规则，另断言按钮可点
- 全部 15 个 `node test/smoke-*.mjs` 通过

## 2.7.0（上游基线）

上游 `dsh-boot-suite` 2.7.0 的完整行为（六幕开机动画、聊天壁纸、模板、素材、急救脚本）。
见 [`README.upstream.md`](README.upstream.md)。
