(() => {
  const video = document.querySelector('#hero-video');
  if (!video) return;

  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const connection = navigator.connection;
  const hero = video.closest('.cinema-hero') || video;
  const bounds = hero.getBoundingClientRect();
  let visible = bounds.bottom > 0 && bounds.top < window.innerHeight;
  let failed = false;
  let pending = false;
  let attempt = 0;

  // Set the playback properties before attaching a source (including on Safari).
  video.muted = true;
  video.defaultMuted = true;
  video.playsInline = true;
  video.setAttribute('muted', '');
  video.setAttribute('playsinline', '');
  video.setAttribute('webkit-playsinline', '');

  const allowed = () => !document.hidden && visible && !motion.matches && !connection?.saveData;
  const source = () => matchMedia('(max-width: 800px), (pointer: coarse)').matches ||
    /^(slow-)?2g$|^3g$/.test(connection?.effectiveType || '')
    ? video.dataset.mobile : video.dataset.desktop;

  const play = () => {
    if (failed || pending || !allowed() || !video.paused) return;
    if (!video.getAttribute('src')) {
      video.src = source();
      video.load();
    }
    video.muted = true;
    pending = true;
    const currentAttempt = ++attempt;
    const rejected = error => {
      if (currentAttempt !== attempt) return;
      pending = false;
      // No timer loop: retry on readiness, a real interaction or page restoration.
      video.dataset.playback = error?.name === 'NotAllowedError' ? 'blocked' : 'waiting';
    };
    try {
      const result = video.play();
      if (result?.then) result.then(() => {
        if (currentAttempt !== attempt) return;
        pending = false;
        if (!allowed()) video.pause();
        else video.dataset.playback = 'playing';
      }, rejected);
      else pending = false;
    } catch (error) { rejected(error); }
  };
  const update = () => {
    video.autoplay = allowed() && !failed;
    if (!allowed()) {
      ++attempt;
      pending = false;
      video.pause();
    } else play();
  };

  // A synchronous call from a real touch also works when autoplay needs a gesture.
  const interact = event => { if (event.isTrusted) update(); };
  for (const event of ['touchend', 'pointerup', 'keydown']) {
    document.addEventListener(event, interact, { capture: true, passive: true });
  }
  for (const event of ['loadeddata', 'canplay']) video.addEventListener(event, update);
  video.addEventListener('error', () => {
    if (failed) return;
    ++attempt;
    pending = false;
    if (video.getAttribute('src') === video.dataset.desktop) {
      video.src = video.dataset.mobile;
      video.load();
      update();
    } else {
      failed = true;
      video.autoplay = false;
      video.dataset.playback = 'unavailable';
      video.removeAttribute('src');
      video.load();
    }
  });
  document.addEventListener('visibilitychange', update);
  window.addEventListener('pageshow', update);
  if (motion.addEventListener) motion.addEventListener('change', update);
  else motion.addListener(update);
  connection?.addEventListener?.('change', update);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(entries => {
      visible = entries[0].isIntersecting;
      update();
    }).observe(hero);
  }
  update();
})();
