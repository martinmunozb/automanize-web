(() => {
  const video = document.querySelector('#hero-video');
  const backdrop = document.querySelector('#hero-backdrop');
  if (!video || !backdrop) return;
  const hero = video.closest('.cinema-hero');
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const portrait = matchMedia('(max-width: 800px) and (orientation: portrait)');
  const connection = navigator.connection;
  const landscapePoster = backdrop.getAttribute('src');
  const bounds = hero.getBoundingClientRect();
  let visible = bounds.bottom > 0 && bounds.top < window.innerHeight;
  let pending = false;
  let attempt = 0;
  let animationMode = false;
  let animationFailed = false;
  // Safari decodes MP4 inside <img> in hardware, without autoplay rules: smooth and sharp.
  // Browsers that cannot do that fire an image error and fall back to the animated WebP.
  let animationStage = 0;
  // Phones download the whole short clip before playing it: streaming a high-quality file over
  // mobile data plays in stop-and-go bursts. Loops then replay from memory with no rebuffering.
  let current = '';
  let loading = '';
  let hevcFailed = false;
  const downloaded = {};

  video.muted = true;
  video.defaultMuted = true;
  video.playsInline = true;
  video.controls = false;
  video.disablePictureInPicture = true;
  for (const attribute of ['muted', 'playsinline', 'webkit-playsinline']) video.setAttribute(attribute, '');

  const allowed = () => !document.hidden && visible && !motion.matches && !connection?.saveData;
  const poster = () => portrait.matches ? backdrop.dataset.portraitPoster : landscapePoster;
  const setBackdrop = src => { if (backdrop.getAttribute('src') !== src) backdrop.src = src; };
  const hevc = () => !hevcFailed && /probably|maybe/.test(video.canPlayType?.('video/mp4; codecs="hvc1.1.6.L120.90"') || '');
  const handheld = () => portrait.matches || matchMedia('(max-width: 800px), (pointer: coarse)').matches ||
    /^(slow-)?2g$|^3g$/.test(connection?.effectiveType || '');
  const source = () => {
    if (!handheld()) return video.dataset.desktop;
    const kind = portrait.matches ? 'portrait' : 'mobile';
    return (hevc() && video.dataset[kind + 'Hevc']) || video.dataset[kind];
  };
  const animationSources = () => portrait.matches
    ? [video.dataset.portrait, backdrop.dataset.portraitMotion]
    : [video.dataset.mobile, backdrop.dataset.motion];
  const renderBackdrop = () => {
    const animate = animationMode && !animationFailed && allowed();
    setBackdrop(animate ? animationSources()[animationStage] : poster());
    hero.dataset.media = animate ? 'animation' : video.dataset.playing === 'true' ? 'video' : 'poster';
  };
  const assign = (url, playable) => {
    current = url;
    video.src = playable;
    video.load();
  };
  const reset = () => {
    ++attempt;
    pending = false;
    loading = '';
    current = '';
    video.dataset.playing = 'false';
    video.pause();
    video.removeAttribute('src');
    video.load();
  };
  const useAnimation = () => {
    animationMode = true;
    reset();
    video.hidden = true;
    video.autoplay = false;
    renderBackdrop();
  };
  // Resolves with a blob: URL holding the full clip; any failure falls back to streaming the file.
  const prefetch = url => {
    if (downloaded[url]) return Promise.resolve(downloaded[url]);
    if (typeof fetch !== 'function' || typeof URL === 'undefined' || typeof URL.createObjectURL !== 'function') return Promise.resolve(url);
    return fetch(url)
      .then(response => { if (!response.ok) throw new Error(response.status); return response.blob(); })
      .then(blob => (downloaded[url] = URL.createObjectURL(blob)))
      .catch(() => url);
  };
  const play = () => {
    if (animationMode || pending || !allowed() || !video.paused) return;
    if (!current) {
      const url = source();
      if (!handheld()) assign(url, url);
      else {
        if (loading === url) return;
        loading = url;
        const currentAttempt = attempt;
        prefetch(url).then(playable => {
          if (loading !== url || currentAttempt !== attempt || animationMode) return;
          loading = '';
          assign(url, playable);
          update();
        });
        return;
      }
    }
    video.muted = true;
    pending = true;
    const currentAttempt = ++attempt;
    const rejected = error => {
      if (currentAttempt !== attempt) return;
      pending = false;
      if (error?.name === 'NotAllowedError' || error?.name === 'NotSupportedError') useAnimation();
    };
    try {
      const result = video.play();
      if (result?.then) result.then(() => {
        if (currentAttempt !== attempt) return;
        pending = false;
        if (!allowed()) video.pause();
      }, rejected);
      else pending = false;
    } catch (error) { rejected(error); }
  };
  const update = () => {
    renderBackdrop();
    video.autoplay = allowed() && !animationMode && !!current;
    if (!allowed()) {
      ++attempt;
      pending = false;
      video.pause();
      video.dataset.playing = 'false';
    } else if (!animationMode) play();
  };
  video.addEventListener('playing', () => {
    if (animationMode || !allowed()) { video.pause(); return; }
    pending = false;
    video.dataset.playing = 'true';
    hero.dataset.media = 'video';
  });
  video.addEventListener('pause', () => { video.dataset.playing = 'false'; });
  for (const event of ['loadeddata', 'canplay']) video.addEventListener(event, update);
  video.addEventListener('error', () => {
    if (animationMode || !current) return;
    const failed = current;
    const kind = portrait.matches ? 'portrait' : 'mobile';
    reset();
    if (failed === video.dataset.desktop) assign(video.dataset.mobile, video.dataset.mobile);
    else if (failed === video.dataset[kind + 'Hevc']) hevcFailed = true;
    else { useAnimation(); return; }
    update();
  });
  backdrop.addEventListener('error', () => {
    if (!animationMode || animationFailed || backdrop.getAttribute('src') !== animationSources()[animationStage]) return;
    if (animationStage < animationSources().length - 1) animationStage++;
    else animationFailed = true;
    renderBackdrop();
  });
  document.addEventListener('visibilitychange', update);
  window.addEventListener('pageshow', update);
  const watch = (query, handler) => query.addEventListener ? query.addEventListener('change', handler) : query.addListener(handler);
  watch(motion, update);
  watch(portrait, () => {
    if (!animationMode && (current || loading)) reset();
    update();
  });
  connection?.addEventListener?.('change', update);
  if ('IntersectionObserver' in window) new IntersectionObserver(entries => {
    visible = entries[0].isIntersecting;
    update();
  }).observe(hero);
  update();
})();
