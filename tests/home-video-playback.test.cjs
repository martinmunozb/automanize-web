const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const script = fs.readFileSync(path.join(__dirname, '../assets/js/home-video.js'), 'utf8');
const tick = () => new Promise(resolve => setImmediate(resolve));
function fixture({ mobile = true, portraitMode = mobile, reduced = false, saveData = false, blocked = false, legacy = false, hevc = false, download } = {}) {
  function target() {
    const handlers = {};
    return { addEventListener(name, callback) { (handlers[name] ||= []).push(callback); },
      emit(name, event = {}) { for (const callback of handlers[name] || []) callback(event); } };
  }
  function media(extra = {}) {
    const attrs = {};
    const element = Object.assign(target(), { dataset: {}, getAttribute: name => attrs[name] ?? null,
      setAttribute(name, value) { attrs[name] = value; }, removeAttribute(name) { delete attrs[name]; } }, extra);
    Object.defineProperty(element, 'src', { set(value) { attrs.src = value; }, get() { return attrs.src; } });
    return element;
  }
  const hero = { dataset: {}, getBoundingClientRect: () => ({ top: 0, bottom: 800 }) };
  const backdrop = media({ dataset: { portraitPoster: 'portrait.webp', motion: 'landscape-motion.webp', portraitMotion: 'portrait-motion.webp' } });
  backdrop.src = 'landscape.webp';
  const video = media({
    dataset: { desktop: 'desktop.mp4', mobile: 'mobile.mp4', portrait: 'portrait.mp4', ...(hevc ? { portraitHevc: 'portrait-hevc.mp4', mobileHevc: 'mobile-hevc.mp4' } : {}) }, paused: true, calls: 0,
    canPlayType: type => hevc && type.includes('hvc1') ? 'probably' : '',
    muted: false, defaultMuted: false, playsInline: false, loads: 0, closest: () => hero,
    load() { this.loads++; this.paused = true; }, pause() { this.paused = true; this.emit('pause'); },
    play() {
      this.calls++;
      assert.equal(this.muted && this.defaultMuted && this.playsInline, true);
      if (blocked) return Promise.reject(Object.assign(new Error('Requires interaction'), { name: 'NotAllowedError' }));
      this.paused = false;
      this.emit('playing');
      return Promise.resolve();
    }
  });
  const document = Object.assign(target(), { hidden: false, querySelector: selector => selector === '#hero-video' ? video : backdrop });
  const window = Object.assign(target(), { innerHeight: 800 });
  const motion = Object.assign(target(), { matches: reduced });
  const portrait = Object.assign(target(), { matches: portraitMode });
  if (legacy) for (const query of [motion, portrait]) { query.addListener = callback => { query.change = callback; }; query.addEventListener = undefined; }
  let intersection;
  window.IntersectionObserver = class { constructor(callback) { intersection = callback; } observe(element) { assert.equal(element, hero); } };
  const extra = download ? { fetch: download.fetch, URL: { createObjectURL: blob => 'blob:' + blob.name } } : {};
  vm.runInNewContext(script, { ...extra, document, window, navigator: { connection: { saveData } },
    matchMedia: query => query.includes('reduced-motion') ? motion : query.includes('orientation: portrait') ? portrait : { matches: mobile },
    IntersectionObserver: window.IntersectionObserver });
  return { video, backdrop, hero, document, window, motion, portrait,
    intersect(value) { intersection([{ isIntersecting: value }]); } };
}
test('phones use the high-resolution portrait source inline without controls', async () => {
  const f = fixture(); await tick();
  assert.equal(f.video.src, 'portrait.mp4'); assert.equal(f.video.paused, false);
  assert.equal(f.video.controls, false); assert.equal(f.video.disablePictureInPicture, true);
  assert.equal(f.video.dataset.playing, 'true');
});
test('autoplay denial automatically shows the hardware-decoded MP4 image with no tap or native player', async () => {
  const f = fixture({ blocked: true }); await tick();
  assert.equal(f.backdrop.src, 'portrait.mp4'); assert.equal(f.hero.dataset.media, 'animation');
  assert.equal(f.video.hidden, true); assert.equal(f.video.src, undefined); assert.equal(f.video.autoplay, false);
  assert.equal(f.video.paused, true); const attempts = f.video.calls;
  f.video.emit('canplay'); f.document.emit('touchend', { isTrusted: true });
  assert.equal(f.video.calls, attempts);
});
test('blocked landscape uses the landscape MP4 image', async () => {
  const f = fixture({ blocked: true, portraitMode: false }); await tick();
  assert.equal(f.backdrop.src, 'mobile.mp4');
});
test('visibility and restoration resume video without reloading the file', async () => {
  const f = fixture(); await tick();
  f.document.hidden = true; f.document.emit('visibilitychange'); assert.equal(f.video.paused, true);
  f.document.hidden = false; f.window.emit('pageshow'); await tick();
  assert.equal(f.video.paused, false); assert.equal(f.video.loads, 1);
  f.intersect(false); assert.equal(f.video.paused, true);
  f.intersect(true); await tick(); assert.equal(f.video.paused, false);
});
test('offscreen and motion reduction suspend the animated fallback', async () => {
  const f = fixture({ blocked: true }); await tick();
  f.intersect(false); assert.equal(f.backdrop.src, 'portrait.webp');
  f.intersect(true); assert.equal(f.backdrop.src, 'portrait.mp4');
  f.motion.matches = true; f.motion.emit('change'); assert.equal(f.backdrop.src, 'portrait.webp');
});
test('motion and data saving avoid loading video and animated images', async () => {
  for (const options of [{ reduced: true }, { saveData: true }]) {
    const f = fixture(options); await tick();
    assert.equal(f.video.calls, 0); assert.equal(f.video.src, undefined);
    assert.equal(f.backdrop.src, 'portrait.webp'); assert.equal(f.video.autoplay, false);
  }
});
test('legacy media-query listeners retain preference changes', async () => {
  const f = fixture({ reduced: true, legacy: true });
  f.motion.matches = false; f.motion.change(); await tick(); assert.equal(f.video.paused, false);
});
test('desktop decode failure tries mobile once then animation', async () => {
  const f = fixture({ mobile: false }); await tick(); assert.equal(f.video.src, 'desktop.mp4');
  f.video.pause(); f.video.emit('error'); await tick(); assert.equal(f.video.src, 'mobile.mp4');
  f.video.pause(); f.video.emit('error'); await tick(); assert.equal(f.backdrop.src, 'mobile.mp4');
  const attempts = f.video.calls; f.video.emit('error'); assert.equal(f.video.calls, attempts);
});
test('MP4 image failure falls back to the animated WebP once', async () => {
  const f = fixture({ blocked: true }); await tick();
  f.backdrop.emit('error'); assert.equal(f.backdrop.src, 'portrait-motion.webp');
  f.intersect(false); f.intersect(true); assert.equal(f.backdrop.src, 'portrait-motion.webp');
});
test('animation decode failure returns to the static poster without retries', async () => {
  const f = fixture({ blocked: true }); await tick();
  f.backdrop.emit('error'); f.backdrop.emit('error'); assert.equal(f.backdrop.src, 'portrait.webp');
  f.window.emit('pageshow'); assert.equal(f.backdrop.src, 'portrait.webp');
});
test('rotating the phone selects the matching framing for video and animation', async () => {
  for (const blocked of [false, true]) {
    const f = fixture({ blocked }); await tick();
    f.portrait.matches = false; f.portrait.emit('change'); await tick();
    assert.equal(blocked ? f.backdrop.src : f.video.src, 'mobile.mp4');
  }
});

function downloader() {
  const requests = [];
  return { requests, fetch: url => new Promise(resolve => requests.push({ url,
    finish: (ok = true) => resolve({ ok, status: ok ? 200 : 500, blob: async () => ({ name: url }) }) })) };
}
test('phones wait for the whole clip before playing, showing the poster meanwhile', async () => {
  const download = downloader(); const f = fixture({ download }); await tick();
  assert.equal(download.requests.length, 1); assert.equal(download.requests[0].url, 'portrait.mp4');
  assert.equal(f.video.src, undefined); assert.equal(f.video.calls, 0); assert.equal(f.backdrop.src, 'portrait.webp');
  f.video.emit('canplay'); assert.equal(download.requests.length, 1);
  download.requests[0].finish(); await tick();
  assert.equal(f.video.src, 'blob:portrait.mp4'); assert.equal(f.video.paused, false); assert.equal(f.hero.dataset.media, 'video');
});
test('a failed download streams the file instead of staying on the poster', async () => {
  const download = downloader(); const f = fixture({ download }); await tick();
  download.requests[0].finish(false); await tick();
  assert.equal(f.video.src, 'portrait.mp4'); assert.equal(f.video.paused, false);
});
test('desktop keeps streaming the 4K file without a full download', async () => {
  const download = downloader(); const f = fixture({ mobile: false, download }); await tick();
  assert.equal(download.requests.length, 0); assert.equal(f.video.src, 'desktop.mp4');
});
test('HEVC-capable phones get the lighter HEVC file and fall back to H.264 on decode errors', async () => {
  const f = fixture({ hevc: true }); await tick();
  assert.equal(f.video.src, 'portrait-hevc.mp4');
  f.video.pause(); f.video.emit('error'); await tick();
  assert.equal(f.video.src, 'portrait.mp4'); assert.equal(f.video.paused, false); assert.notEqual(f.hero.dataset.media, 'animation');
});
test('rotating while the clip downloads drops the stale download', async () => {
  const download = downloader(); const f = fixture({ download }); await tick();
  f.portrait.matches = false; f.portrait.emit('change'); await tick();
  assert.equal(download.requests[1].url, 'mobile.mp4');
  download.requests[0].finish(); await tick(); assert.equal(f.video.src, undefined);
  download.requests[1].finish(); await tick(); assert.equal(f.video.src, 'blob:mobile.mp4');
});
