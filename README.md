# 大肥鱼启动动画 · 合并设置页的修改版

> **DeepSeek Harness 开机套件** —— 六幕开机动画 + 聊天壁纸，一个插件两个半侧。
>
> 本仓库是 **[LeeRolling/dsh-boot-suite](https://github.com/LeeRolling/dsh-boot-suite) 的修改版（fork）**，
> 原作者 **沈宏宏（LeeRolling）**，MIT 许可。相对上游只改了 3 处：把原本独立的
> **「聊天背景」设置页并入「启动动画」页**，设置里只留一张页面。上游完整文档保留在
> [`README.upstream.md`](README.upstream.md)。

[![license](https://img.shields.io/badge/license-MIT-blue)](LICENSE)
[![upstream](https://img.shields.io/badge/upstream-LeeRolling%2Fdsh--boot--suite-lightgrey)](https://github.com/LeeRolling/dsh-boot-suite)
[![platform](https://img.shields.io/badge/platform-Windows%20%7C%20Web-lightgrey)](#安装)

![开机动画主画面](docs/hero.png)

![完整六幕启动动画 + 开机后的开场视频](docs/demo.gif)

<sub>**完整过程 · 约 16 秒**：0:00 黑幕标识 → 0:03 过曝洗白 → 0:03–0:11 五步授权 → 0:12 色散故障揭幕
→ 0:12 起是**开机之后的开场视频**（聊天壁纸半侧，`placement: front`）。
前半段原速录制自 [`preview/demo.html`](preview/demo.html)，后半段取自 `~/.dsh/boot-animation/videos/`；无音轨。</sub>

---

## 为什么有这个 fork

上游 2.5.0 起把两个半侧拆成**两个设置页**：

- 设置 →「启动动画」（`settings.section` id `startup-screen`，order 26）—— 六幕动画的各项设置
- 设置 →「聊天背景」（id `chat-wallpaper`，order 27）—— 开场视频 / 底图 / 横幅

两者调的是同一套开机体验（先看动画、再看视频），却要来回切页。这个 fork 把它合成**一张**
「启动动画」页：上半是动画设置，一条分隔线之后直接接壁纸面板。

---

## 和上游的差别

全部改动集中在 `lib/client.js` 一个文件里（该文件内是两个 IIFE：`__bootHalf` 开机动画、`__wallHalf` 壁纸）：

| # | 位置 | 改动 |
|---|---|---|
| 1 | `lib/client.js:27` | 外层工厂作用域新增 `var __cwSharedPanel = null` —— 两个 IIFE 之间传递组件句柄（壁纸半侧写，动画半侧读） |
| 2 | `lib/client.js:1059-1072` | 新增 `StartupSettings` 组件：上 `<Panel/>`，中间 `border-top: 1px solid var(--dsw-alias-border-l2)` 分隔线，下 `<WallpaperPanel/>`；设置页注册改为渲染它 |
| 3 | `lib/client.js:1089-1091` / `lib/client.js:2365-2366` | 设置节注册只剩**一处**（`id: 'startup-screen'`，标签「启动动画」）；壁纸半侧原来的第二个 `settings.section` 注册块被替换为 `__cwSharedPanel = WallpaperPanel` |
| 4 | `lib/client.js` 顶部 `BUILD` | 缓存戳 `'cw-21'` → `'cw-22'` —— 客户端 bundle 带长缓存，不换戳会加载到旧包 |

配套的测试也跟着改了（原来断言"注册了 2 个设置节"）：

- `test/smoke-client.mjs`：`sections === 1`；新增"合并页有分隔线""能渲染出「当前状态」「背景图」「重播开场」"三条断言
- `test/smoke-desktop-boot.mjs`：注册数 `2 → 1`，原"聊天背景设置节也注册了"改为"聊天背景不再单独注册设置节"

除此之外**没有改动**上游任何逻辑、样式、音频和模板。

---

## 它是什么

DSH 冷启动时先播六幕动画，播完进聊天，再落在你自己设的底图上：

    黑幕 DeepSeek 标识 → 过曝洗白 → 暖白「技术档案」底板
      → 五步交互式访问授权 → 色散故障揭幕 → 聊天壁纸

**不是视频文件，是代码动画**：`lib/splash.js` + `lib/splash.css` 用 DOM + CSS 动画 + WebAudio
现场绘制，画面部分只有 ~94 KB。

| | 开机动画 | 聊天壁纸 |
|---|---|---|
| 设置入口 | 设置页 →「启动动画」 | 同一页，分隔线以下 |
| 内容 | 六幕序列、逐字打出的英文副标题、环形准星、色散故障 | 开场视频 / 静态底图 / 大字横幅 |
| 素材 | 5 句真声台词 + 终幕欢迎语 + 2 个界面音效（mp3） | 你自己的视频和图片 |
| 可调 | 身份名称 / 编号 / 权限等级 / 配色 / 速度 / 音色 / 语速 / 每处文案 / 模板 | 视频放置方式、循环区间、纱的浓度、横幅文字 |

两个半侧**各自独立**：动画坏了不影响壁纸，壁纸坏了不影响动画，界面照常进。

六幕内容：黑幕 DeepSeek 标识 → 过曝洗白 → 暖白「技术档案」底板 → 五步交互式访问授权 → 色散故障揭幕。
前两幕要点按钮或 Enter / 空格推进，其余自动；台词是真声 mp3，缺失自动回落系统 TTS，语音没播完不推进。

---

## 安装

### 方式一：双击安装（推荐）

1. 下载本仓库（Code → Download ZIP，或 `git clone`）并解压
2. **完全退出** DeepSeek Harness Desktop（任务管理器里确认没有 `DeepSeek Harness` 进程）
3. 双击根目录的 **`安装.cmd`**
4. 重新打开桌面端

脚本会自动找到 DSH 命令行（不在 PATH 里也行）、找到已初始化的 profile、卸掉同名旧插件、
以 `link:` 方式装好并修正 `bundles` 列表，最后自检。
只想看它要做什么、不动手：`powershell -File tools\install.ps1 -CheckOnly`

### 方式二：命令行

    # 桌面端：先完全退出 DeepSeek Harness Desktop
    dsh plugin --profile desktop add link:<仓库路径>

**桌面端必须先完全退出** —— 否则 profile 的 `package.json` 被进程锁着，装不进去。

> 从旧的两个插件（`dsh-startup-screen` / `dsh-chat-wallpaper`）迁过来的话，
> 先 `dsh plugin --profile desktop remove` 掉它们，再装本插件。

装好后**设置页只多出一项**：「启动动画」（下半页就是聊天背景）。

---

## 配置

| 文件 | 管什么 |
|---|---|
| `~/.dsh/dsh-startup.json` | 开机动画：`enabled`、`mode`（`always` / `session` / `daily`）、`theme`、`speed`、`requireInteraction`、`allowSkip`、`sound`、`voice`、`voiceLang`、`identity`、`accent`、`template` |
| `~/.dsh/chat-wallpaper.json` | 壁纸：`video`、`placement`（`front` 开场 / `behind` 常驻底）、`mode`（`once` / `loop`）、`fadeOutMs`、`banner`、`bannerOpacity`、`loopStart` / `loopEnd`（支持时间码 `00:00:05:23`）、`oncePerSession`、`waitForBoot`、`bootOverlaySelectors`、`objectFit`、`opacity` |

两个文件都由设置页生成，一般不用手改。素材直接丢目录即可，**按修改时间取最新**：

- 视频：`~/.dsh/boot-animation/videos/`
- 底图：`~/.dsh/chat-wallpaper/`

---

## 测试

零依赖冒烟测试，13 套：

    node test/smoke-client.mjs          # 合并后的设置页：只注册 1 节、分隔线、面板内容
    node test/smoke-desktop-boot.mjs    # 桌面端 boot 注入与两半侧装配
    node test/smoke-host.mjs            # 宿主路由 / 配置读写
    node test/smoke-splash.mjs          # 六幕时序
    node test/smoke-merge.mjs           # 配置合并
    npm test                            # 全跑

本 fork 当前状态：`smoke-client` 46/0、`smoke-desktop-boot` 46/0、`smoke-host` 98/0、
`smoke-splash` 74/0，全部通过。

---

## 卸载

双击 **`卸载.cmd`**（开机黑屏、界面点不动时的急救也用它），或：

    dsh plugin --profile desktop remove dsh-boot-suite

配置文件不会自动删，要清干净手动删 `~/.dsh/dsh-startup.json` 和 `~/.dsh/chat-wallpaper.json`。

---

## 许可与致谢

- 上游：[LeeRolling/dsh-boot-suite](https://github.com/LeeRolling/dsh-boot-suite)，作者 **沈宏宏（LeeRolling）**
- 许可：MIT，原始版权声明完整保留在 [`LICENSE`](LICENSE)；本 fork 的修改部分同样以 MIT 发布
- 本仓库只做上面列出的 3 处 UI 合并，**不主张**上游任何设计、代码与素材的著作权

---

## 已知限制

- 基于上游 **2.7.0** 的 `lib/client.js` 修改；上游 `main` 已到 **2.8.1**。
  合并上游更新时，上面 3 处改动需要重放（冲突基本集中在这三处）
- 只测过 Windows 桌面端 + web profile 的渲染路径
- 壁纸面板读取配置失败时只在页内显示「读取失败」，不影响动画与聊天
