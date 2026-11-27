// shoot.mjs — playtests Turkey Escape in headless Chrome over CDP and takes
// screenshots. Usage:
//   node tools/shoot.mjs shot <name> [out.jpg]  — ?shot=<name>&seed=7 scene
//   node tools/shoot.mjs play [out.jpg]         — real play with keyboard input
// Requires the dev server on http://localhost:8082 (node serve.ts --port 8082).
// CDP on port 9333 (unique: the flight-game builder uses 9223).
import { spawn } from 'node:child_process';
import { writeFileSync } from 'node:fs';

const CHROME = `${process.env.HOME}/.cache/ms-playwright/chromium-1255/chrome-linux64/chrome`;
const PORT = 9333;
const BASE = 'http://localhost:8082';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function launch() {
  const proc = spawn(CHROME, [
    '--headless=new', '--no-sandbox', '--use-angle=swiftshader', '--disable-gpu-sandbox',
    `--remote-debugging-port=${PORT}`, '--window-size=1280,920', 'about:blank',
  ], { stdio: 'ignore' });
  for (let i = 0; i < 40; i++) {
    try {
      const res = await fetch(`http://localhost:${PORT}/json/version`);
      if (res.ok) return proc;
    } catch { /* not up yet */ }
    await sleep(500);
  }
  throw new Error('chrome did not start');
}

async function connect() {
  const targets = await (await fetch(`http://localhost:${PORT}/json/list`)).json();
  const page = targets.find((t) => t.type === 'page');
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
  let id = 0;
  const pending = new Map();
  const events = [];
  ws.onmessage = (m) => {
    const msg = JSON.parse(m.data);
    if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); }
    else if (msg.method) events.push(msg);
  };
  async function send(method, params = {}) {
    const mid = ++id;
    ws.send(JSON.stringify({ id: mid, method, params }));
    return new Promise((res) => pending.set(mid, res));
  }
  return { send, events, ws };
}

async function evalJs(send, expr) {
  const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true });
  return r.result?.result?.value;
}

function pageErrors(events) {
  return events.filter((e) => e.method === 'Runtime.exceptionThrown'
    || (e.method === 'Log.entryAdded' && e.params?.entry?.level === 'error')
    || (e.method === 'Network.loadingFailed'));
}

async function shot(name, out) {
  const proc = await launch();
  try {
    const { send, events } = await connect();
    await send('Page.enable');
    await send('Runtime.enable');
    await send('Page.navigate', { url: `${BASE}/?shot=${name}&seed=7` });
    for (let i = 0; i < 60; i++) {
      await sleep(500);
      if (await evalJs(send, 'window.__shotReady === true')) break;
    }
    const ready = await evalJs(send, 'window.__shotReady === true');
    const state = await evalJs(send, 'JSON.stringify(window.__turkeyState ? window.__turkeyState() : null)');
    await sleep(400);
    const res = await send('Page.captureScreenshot', { format: 'jpeg', quality: 82 });
    writeFileSync(out, Buffer.from(res.result.data, 'base64'));
    console.log('saved', out, '| ready:', ready, '| state:', state);
    const errors = pageErrors(events);
    console.log('page errors:', errors.length);
    for (const e of errors.slice(0, 5)) console.log(JSON.stringify(e.params ?? e).slice(0, 400));
  } finally { proc.kill(); }
}

async function key(send, type, code, k, ms = 0) {
  await send('Input.dispatchKeyEvent', { type, code, key: k });
  if (ms) await sleep(ms);
}
async function holdKey(send, code, k, ms) {
  await send('Input.dispatchKeyEvent', { type: 'keyDown', code, key: k });
  await sleep(ms);
  await send('Input.dispatchKeyEvent', { type: 'keyUp', code, key: k });
}

async function play(out) {
  const proc = await launch();
  try {
    const { send, events } = await connect();
    await send('Page.enable');
    await send('Runtime.enable');
    await send('Page.navigate', { url: `${BASE}/?seed=11` });
    await sleep(2500);
    const state = async () => evalJs(send, 'JSON.stringify(window.__turkeyState())');
    console.log('title:', await state());
    // Start the run.
    await key(send, 'keyDown', 'Enter', 'Enter');
    await key(send, 'keyUp', 'Enter', 'Enter');
    await sleep(1000);
    console.log('started:', await state());
    // Play ~14s: run right, jump periodically, dash in bursts.
    for (let round = 0; round < 7; round += 1) {
      await send('Input.dispatchKeyEvent', { type: 'keyDown', code: 'ArrowRight', key: 'ArrowRight' });
      await sleep(1200);
      await key(send, 'keyDown', 'Space', ' ');
      await key(send, 'keyUp', 'Space', ' ');
      await sleep(500);
      await send('Input.dispatchKeyEvent', { type: 'keyDown', code: 'ShiftLeft', key: 'Shift' });
      await sleep(600);
      await send('Input.dispatchKeyEvent', { type: 'keyUp', code: 'ShiftLeft', key: 'Shift' });
      await sleep(300);
      console.log(`t+${(round + 1) * 2.6}s:`, await state());
    }
    await send('Input.dispatchKeyEvent', { type: 'keyUp', code: 'ArrowRight', key: 'ArrowRight' });
    const res = await send('Page.captureScreenshot', { format: 'jpeg', quality: 82 });
    writeFileSync(out, Buffer.from(res.result.data, 'base64'));
    console.log('saved', out);
    const errors = pageErrors(events);
    console.log('page errors:', errors.length);
    for (const e of errors.slice(0, 5)) console.log(JSON.stringify(e.params ?? e).slice(0, 400));
  } finally { proc.kill(); }
}

async function idle(out) {
  const proc = await launch();
  try {
    const { send, events } = await connect();
    await send('Page.enable');
    await send('Runtime.enable');
    await send('Page.navigate', { url: `${BASE}/?seed=11` });
    await sleep(2500);
    await key(send, 'keyDown', 'Enter', 'Enter');
    await key(send, 'keyUp', 'Enter', 'Enter');
    // Do nothing for up to 60s: the farmer must catch the idle turkey.
    for (let i = 0; i < 12; i += 1) {
      await sleep(5000);
      const state = await evalJs(send, 'JSON.stringify(window.__turkeyState())');
      console.log(`idle t+${(i + 1) * 5}s:`, state);
      if (state && JSON.parse(state).over) break;
    }
    const res = await send('Page.captureScreenshot', { format: 'jpeg', quality: 82 });
    writeFileSync(out, Buffer.from(res.result.data, 'base64'));
    console.log('saved', out);
    const errors = pageErrors(events);
    console.log('page errors:', errors.length);
    for (const e of errors.slice(0, 5)) console.log(JSON.stringify(e.params ?? e).slice(0, 400));
  } finally { proc.kill(); }
}

const [,, mode, a, b] = process.argv;
if (mode === 'shot') await shot(a, b ?? `/tmp/shot-${a}.jpg`);
else if (mode === 'play') await play(a ?? '/tmp/playtest.jpg');
else if (mode === 'idle') await idle(a ?? '/tmp/idle.jpg');
else { console.log('usage: shoot.mjs shot <name> [out] | shoot.mjs play [out] | shoot.mjs idle [out]'); process.exit(1); }
