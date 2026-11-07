const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const script = fs.readFileSync(path.join(__dirname, '../assets/js/home-video.js'), 'utf8');
const tick = () => new Promise(resolve => setImmediate(resolve));
function fixture({ mobile = true, reduced = false, saveData = false, blocked = false, legacy = false } = {}) {
  function target() {
    const handlers = {};
    return { addEventListener(name, callback) { (handlers[name] ||= []).push(callback); },
      emit(name, event = {}) { for (const callback of handlers[name] || []) callback(event); } };
  }
  const attrs = {};
  const hero = { getBoundingClientRect: () => ({ top: 0, bottom: 800 }) };
  const video = Object.assign(target(), {
    dataset: { desktop: 'desktop.mp4', mobile: 'mobile.mp4' }, paused: true, calls: 0,
    muted: false, defaultMuted: false, playsInline: false, loads: 0,
    closest: () => hero, getAttribute: name => attrs[name] ?? null,
    setAttribute(name, value) { attrs[name] = value; }, removeAttribute(name) { delete attrs[name]; },
    load() { this.loads++; }, pause() { this.paused = true; },
    play() {
      this.calls++;
      assert.equal(this.muted && this.defaultMuted && this.playsInline, true);
      if (blocked) return Promise.reject(Object.assign(new Error('Requires interaction'), { name: 'NotAllowedError' }));
      this.paused = false;
      return Promise.resolve();
    }
  });
  Object.defineProperty(video, 'src', { set(value) { attrs.src = value; }, get() { return attrs.src; } });
  const document = Object.assign(target(), { hidden: false, querySelector: () => video });
  const window = Object.assign(target(), { innerHeight: 800 });
  const motion = Object.assign(target(), { matches: reduced });
  if (legacy) { motion.addListener = callback => { motion.change = callback; }; motion.addEventListener = undefined; }
  let intersection;
  window.IntersectionObserver = class { constructor(callback) { intersection = callback; } observe(element) { assert.equal(element, hero); } };
  vm.runInNewContext(script, { document, window, navigator: { connection: { saveData } },
    matchMedia: query => query.includes('reduced-motion') ? motion : { matches: mobile },
    IntersectionObserver: window.IntersectionObserver });
  return { video, document, window, motion, unblock() { blocked = false; },
    intersect(value) { intersection([{ isIntersecting: value }]); } };
}
test('inline muted mobile video starts without waiting for a tap', async () => {
  const f = fixture(); await tick();
  assert.equal(f.video.src, 'mobile.mp4'); assert.equal(f.video.paused, false);
  assert.equal(f.video.autoplay, true); assert.equal(f.video.dataset.playback, 'playing');
});
test('a rejected autoplay recovers synchronously on a trusted touch', async () => {
  const f = fixture({ blocked: true }); await tick();
  assert.equal(f.video.dataset.playback, 'blocked'); const attempts = f.video.calls;
  f.unblock(); f.document.emit('touchend', { isTrusted: true });
  assert.equal(f.video.calls, attempts + 1); await tick(); assert.equal(f.video.paused, false);
});
test('synthetic gestures do not initiate a blocked video', async () => {
  const f = fixture({ blocked: true }); await tick(); const attempts = f.video.calls;
  f.document.emit('pointerup', { isTrusted: false }); assert.equal(f.video.calls, attempts);
});
test('visibility and page restoration pause and restart without reloading the file', async () => {
  const f = fixture(); await tick();
  f.document.hidden = true; f.document.emit('visibilitychange'); assert.equal(f.video.paused, true);
  f.document.hidden = false; f.window.emit('pageshow'); await tick();
  assert.equal(f.video.paused, false); assert.equal(f.video.loads, 1);
  f.intersect(false); assert.equal(f.video.paused, true);
  f.intersect(true); await tick(); assert.equal(f.video.paused, false);
});
test('motion and data saving preferences avoid background downloads', async () => {
  for (const options of [{ reduced: true }, { saveData: true }]) {
    const f = fixture(options); f.document.emit('touchend', { isTrusted: true }); await tick();
    assert.equal(f.video.calls, 0); assert.equal(f.video.src, undefined); assert.equal(f.video.autoplay, false);
  }
});
test('older media-query listeners still support preference changes', async () => {
  const f = fixture({ reduced: true, legacy: true });
  f.motion.matches = false; f.motion.change(); await tick(); assert.equal(f.video.paused, false);
});
test('desktop decoding failure falls back once to mobile then keeps the poster', async () => {
  const f = fixture({ mobile: false }); await tick(); assert.equal(f.video.src, 'desktop.mp4');
  f.video.pause(); f.video.emit('error'); await tick(); assert.equal(f.video.src, 'mobile.mp4');
  f.video.pause(); f.video.emit('error'); await tick();
  assert.equal(f.video.src, undefined); assert.equal(f.video.dataset.playback, 'unavailable');
  const attempts = f.video.calls; f.document.emit('touchend', { isTrusted: true }); f.video.emit('error');
  assert.equal(f.video.calls, attempts);
});
test('readiness can recover an initial interrupted play without polling', async () => {
  const f = fixture({ blocked: true }); await tick(); f.unblock();
  f.video.emit('canplay'); await tick(); assert.equal(f.video.paused, false);
});
