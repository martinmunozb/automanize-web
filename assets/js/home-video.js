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

  video.muted = true;
  video.defaultMuted = true;
  video.playsInline = true;
  video.controls = false;
  video.disablePictureInPicture = true;
  for (const attribute of ['muted', 'playsinline', 'webkit-playsinline']) video.setAttribute(attribute, '');

  const allowed = () => !document.hidden && visible && !motion.matches && !connection?.saveData;
  const poster = () => portrait.matches ? backdrop.dataset.portraitPoster : landscapePoster;
  const setBackdrop = src => { if (backdrop.getAttribute('src') !== src) backdrop.src = src; };
  const source = () => portrait.matches ? video.dataset.portrait :
    matchMedia('(max-width: 800px), (pointer: coarse)').matches || /^(slow-)?2g$|^3g$/.test(connection?.effectiveType || '')
      ? video.dataset.mobile : video.dataset.desktop;
  const animationSources = () => portrait.matches
    ? [video.dataset.portrait, backdrop.dataset.portraitMotion]
    : [video.dataset.mobile, backdrop.dataset.motion];
  const renderBackdrop = () => {
    const animate = animationMode && !animationFailed && allowed();
    setBackdrop(animate ? animationSources()[animationStage] : poster());
    hero.dataset.media = animate ? 'animation' : video.dataset.playing === 'true' ? 'video' : 'poster';
  };
  const useAnimation = () => {
    animationMode = true;
    ++attempt;
    pending = false;
    video.hidden = true;
    video.autoplay = false;
    video.dataset.playing = 'false';
    video.pause();
    video.removeAttribute('src');
    video.load();
    renderBackdrop();
  };
  const play = () => {
    if (animationMode || pending || !allowed() || !video.paused) return;
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
    video.autoplay = allowed() && !animationMode;
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
    if (animationMode) return;
    ++attempt;
    pending = false;
    if (video.getAttribute('src') === video.dataset.desktop) {
      video.src = video.dataset.mobile;
      video.load();
      update();
    } else useAnimation();
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
    if (!animationMode && video.getAttribute('src')) {
      ++attempt;
      pending = false;
      video.dataset.playing = 'false';
      video.src = source();
      video.load();
    }
    update();
  });
  connection?.addEventListener?.('change', update);
  if ('IntersectionObserver' in window) new IntersectionObserver(entries => {
    visible = entries[0].isIntersecting;
    update();
  }).observe(hero);
  update();
})();
