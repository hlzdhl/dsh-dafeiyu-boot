# 大肥鱼启动动画 (dsh-dafeiyu-boot) — merged settings page (fork)

> **DeepSeek Harness boot suite**: a six-act cold-start animation plus a chat wallpaper,
> shipped as one plugin.
>
> This repository is a **modified fork** of
> [LeeRolling/dsh-boot-suite](https://github.com/LeeRolling/dsh-boot-suite) by
> **沈宏宏 (LeeRolling)**, MIT licensed. Upstream's full documentation is kept in
> [`README.upstream.md`](README.upstream.md) (Chinese) and
> [`README.upstream.en.md`](README.upstream.en.md).

[![license](https://img.shields.io/badge/license-MIT-blue)](LICENSE)
[![upstream](https://img.shields.io/badge/upstream-LeeRolling%2Fdsh--boot--suite-lightgrey)](https://github.com/LeeRolling/dsh-boot-suite)

## What this fork changes

Upstream exposes two settings pages — 「启动动画」 (`settings.section` id `startup-screen`, order 26)
and 「聊天背景」 (id `chat-wallpaper`, order 27). This fork merges them into **one** page: the
animation panel on top, a divider, then the wallpaper panel. Everything lives in `lib/client.js`:

| # | Where | Change |
|---|---|---|
| 1 | `lib/client.js:27` | new `var __cwSharedPanel = null` in the factory scope — hands the panel component from the wallpaper IIFE to the boot IIFE |
| 2 | `lib/client.js:1059-1072` | new `StartupSettings` component: `<Panel/>`, a `border-top: 1px solid var(--dsw-alias-border-l2)` divider, then `<WallpaperPanel/>`; the section now renders it |
| 3 | `lib/client.js:1089-1091`, `lib/client.js:2365-2366` | only **one** `settings.section` remains (`id: 'startup-screen'`, label 「启动动画」); the wallpaper half's second registration is replaced by `__cwSharedPanel = WallpaperPanel` |
| 4 | `BUILD` constant | cache-buster `'cw-21'` → `'cw-22'` |

`test/smoke-client.mjs` and `test/smoke-desktop-boot.mjs` were updated accordingly
(they used to assert two settings sections). No other logic, styling, audio or template was touched.

Tests: `smoke-client` 46/0, `smoke-desktop-boot` 46/0, `smoke-host` 98/0, `smoke-splash` 74/0 —
all green. Run `npm test` for the whole suite (13 zero-dependency scripts).

## Install

Quit DeepSeek Harness Desktop completely first (the profile's `package.json` is locked by the
running app), then either double-click `安装.cmd` or run:

    dsh plugin --profile desktop add link:<path-to-this-repo>

Reopen the app. Settings now shows a single 「启动动画」 page; the chat-wallpaper controls sit
below the divider. Remove any previous `dsh-startup-screen` / `dsh-chat-wallpaper` installs first.

## Config

| File | Purpose |
|---|---|
| `~/.dsh/dsh-startup.json` | boot animation: `enabled`, `mode` (`always`/`session`/`daily`), `theme`, `speed`, `requireInteraction`, `allowSkip`, `sound`, `voice`, `voiceLang`, `identity`, `accent`, `template` |
| `~/.dsh/chat-wallpaper.json` | wallpaper: `video`, `placement` (`front`/`behind`), `mode` (`once`/`loop`), `fadeOutMs`, `banner`, `bannerOpacity`, `loopStart`/`loopEnd`, `oncePerSession`, `waitForBoot`, `bootOverlaySelectors`, `objectFit`, `opacity` |

Drop clips into `~/.dsh/boot-animation/videos/` and images into `~/.dsh/chat-wallpaper/`;
the newest file by mtime wins.

## Uninstall

    dsh plugin --profile desktop remove dsh-boot-suite

Config files are not deleted automatically.

## License

MIT. Original copyright notice (© 2026 沈宏宏 / LeeRolling) is preserved verbatim in
[`LICENSE`](LICENSE); this fork's changes are released under the same license. The upstream
authorship of all design, code and assets is acknowledged — this fork only merges two UI pages.
