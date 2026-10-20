import { fileURLToPath } from 'node:url'
// 跳过联动测试：开机动画按 SKIP → 后面那段全屏开场视频也一起跳过。
//
// 两条时序都要成立：
//   · 视频还没挂上（闸门还没开）→ 读掉一次性标记，根本不播
//   · 视频已经在放 → 收到 'dsh-startup:skip' 事件，立刻撤层
// splash 那半边没有可注入的 DOM 环境，所以只做源码级断言（两个约定字符串必须在 requestSkip 里）。
import fs from 'node:fs'
import vm from 'node:vm'

const CLIENT = process.argv[2] || fileURLToPath(new URL('../lib/client.js', import.meta.url))
const SPLASH = new URL('../lib/splash.js', import.meta.url)
const code = fs.readFileSync(CLIENT, 'utf8')

const SKIP_KEY = 'dsh-startup-screen:skipped'
const SKIP_EVENT = 'dsh-startup:skip'

let captured = null
const timers = []

function mkEl(tag) {
  const el = {
    tagName: String(tag).toUpperCase(), id: '', className: '', dataset: {}, style: {},
    children: [], parentNode: null, currentTime: 99, duration: 7.0417, paused: true, playCalls: 0,
    readyState: 4,
    loop: false, muted: false, autoplay: false, playsInline: false, preload: '', src: '', error: null,
    _handlers: {},
    setAttribute() {}, removeAttribute() {}, load() {},
    addEventListener(t, fn) { (el._handlers[t] = el._handlers[t] || []).push(fn) },
    fire(t) { (el._handlers[t] || []).forEach((fn) => fn({ type: t })) },
    appendChild(c) { c.parentNode = el; el.children.push(c); return c },
    insertBefore(c) { c.parentNode = el; el.children.unshift(c); return c },
    removeChild(c) { const i = el.children.indexOf(c); if (i >= 0) el.children.splice(i, 1); return c },
    remove() { if (el.parentNode) el.parentNode.removeChild(el) },
    querySelector(sel) {
      return el.children.find((c) =>
        sel.startsWith('.') ? '.' + c.className === sel
          : sel.startsWith('#') ? '#' + c.id === sel
            : c.tagName === String(sel).toUpperCase()) || null
    },
    querySelectorAll() { return [] },
    pause() { el.paused = true },
    play() { el.playCalls++; el.paused = false; return Promise.resolve() },
  }
  return el
}

/* 极简事件总线：开机动画半侧 dispatch，视频半侧 listen */
const bus = {}
const win = {
  __ModuleLoader__: { load(o) { captured = o } },
  sessionStorage: {
    _m: new Map(),
    getItem(k) { return this._m.has(k) ? this._m.get(k) : null },
    setItem(k, v) { this._m.set(k, String(v)) },
    removeItem(k) { this._m.delete(k) },
  },
  addEventListener(type, fn) { (bus[type] = bus[type] || []).push(fn) },
  removeEventListener(type, fn) { bus[type] = (bus[type] || []).filter((f) => f !== fn) },
  dispatchEvent(ev) { (bus[ev.type] || []).forEach((fn) => fn(ev)); return true },
}

const sandbox = {
  window: win,
  console,
  __overlay: null,
  createdVideos: [],
  document: {
    documentElement: { attributes: [], classList: { add() {}, remove() {} } },
    head: mkEl('head'), body: mkEl('body'),
    createElement(t) { const e = mkEl(t); if (String(t) === 'video') sandbox.createdVideos.push(e); return e },
    getElementById(id) { return sandbox.document.body.children.find((c) => c.id === id) || null },
    querySelector(sel) { return sel === '#dsh-startup-root' ? sandbox.__overlay : null },
    addEventListener() {},
  },
  setTimeout: () => 0, clearTimeout: () => {},
  setInterval(fn, ms) { timers.push({ fn, ms, cleared: false, id: timers.length + 1 }); return timers.length },
  clearInterval(id) { const t = timers.find((x) => x.id === id); if (t) t.cleared = true },
  getComputedStyle: () => ({ backgroundColor: 'rgb(247, 241, 248)' }),
  MutationObserver: function () { this.observe = () => {}; this.disconnect = () => {} },
  requestAnimationFrame: (fn) => { if (fn) fn(); return 1 },
  cancelAnimationFrame: () => {},
  fetch: () => Promise.reject(new Error('no network')),
}

function tick(n = 1) { for (let i = 0; i < n; i++) for (const t of timers) if (!t.cleared) t.fn() }

function reset() {
  timers.length = 0
  sandbox.createdVideos.length = 0
  sandbox.document.body.children.length = 0
  win.sessionStorage._m.clear()
  try { mod.__teardown() } catch (e) { /* 第一次调用时 mod 还没赋值 */ }
}

vm.createContext(sandbox)
vm.runInContext(code, sandbox, { filename: 'client.js' })
const mod = captured.factory((name) => {
  if (name === 'react') {
    return {
      createElement: () => ({ props: {} }),
      useState: (v) => [v, () => {}],
      useEffect: () => {},
      useMemo: (f) => f(),
      useRef: (v) => ({ current: v }),
    }
  }
  throw new Error('unexpected require')
})

const layerEl = () => sandbox.document.getElementById('dsh-chat-wallpaper')
const skipMarker = () => win.sessionStorage.getItem(SKIP_KEY)

let fails = 0
const ok = (cond, label, extra) => {
  console.log(`  ${cond ? '✓' : '✗'} ${label}${extra ? '  ' + extra : ''}`)
  if (!cond) fails++
}

console.log('=== A. 按了 SKIP（标记在）→ 视频【根本不挂】===')
reset()
win.sessionStorage.setItem(SKIP_KEY, '1')
mod.__startWhenFree({ placement: 'front', waitForBoot: false })
tick(5)
ok(!layerEl(), '★ 被跳过的这一次 → 视频层没挂', layerEl() ? '竟然挂了' : '')
ok(sandbox.createdVideos.length === 0, '★ 连 <video> 都没创建（不白下载片子）', 'videos=' + sandbox.createdVideos.length)
ok(skipMarker() === null, '★ 标记读完就清（不然以后每次刷新都被跳过）', 'marker=' + skipMarker())

console.log('\n=== B. 视频已经在放 → 收到 skip 事件 → 撤层 ===')
reset()
mod.__startWhenFree({ placement: 'front', waitForBoot: false })
tick(1)
ok(!!layerEl(), '前置：正常情况下层已经挂上')
win.dispatchEvent({ type: SKIP_EVENT })
ok(!layerEl(), '★ 收到 dsh-startup:skip → 层被撤掉，直接露出聊天界面', layerEl() ? '层还在' : '')

console.log('\n=== C. 被跳过之后，下一次启动照常播 ===')
reset()
mod.__startWhenFree({ placement: 'front', waitForBoot: false })
tick(1)
ok(!!layerEl(), '★ 没有跳过标记 → 正常挂层播开场')
ok(skipMarker() === null, '标记不会残留在会话里')

console.log('\n=== D. 显式重播优先于跳过（用户自己点的「重播开场」）===')
reset()
win.sessionStorage.setItem(SKIP_KEY, '1')
mod.__startWhenFree({ placement: 'front', waitForBoot: false, __forceReplay: true })
tick(1)
ok(!!layerEl(), '★ __forceReplay 时即使有跳过标记也照播', layerEl() ? '' : '被吞掉了')
ok(skipMarker() === null, '★ 顺手把标记吃掉，不影响之后')

console.log('\n=== E. splash 半边确实写了这两个约定 ===')
const splashSrc = fs.readFileSync(SPLASH, 'utf8')
const skipFn = splashSrc.slice(splashSrc.indexOf('function requestSkip()'))
const skipBody = skipFn.slice(0, skipFn.indexOf('\n  }') + 1)
ok(skipBody.includes(SKIP_KEY), '★ requestSkip 里写了 sessionStorage 标记 ' + SKIP_KEY)
ok(skipBody.includes(SKIP_EVENT), "★ requestSkip 里 dispatch 了 '" + SKIP_EVENT + "' 事件")
ok(skipBody.indexOf('releaseAll()') > skipBody.indexOf(SKIP_EVENT),
  '★ 先广播、后收场（不然监听器可能在层已经拆完之后才收到事件）')

console.log(`\n通过 ${fails === 0 ? '全部' : '部分'}，失败 ${fails}`)
process.exit(fails === 0 ? 0 : 1)
