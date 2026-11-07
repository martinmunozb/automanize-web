(() => {
  const video = document.querySelector('#hero-video');
  if (!video) return;
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const connection = navigator.connection;
  let visible = true;
  let failed = false;
  const play = () => {
    if (failed) return;
    if (!video.getAttribute('src')) {
      video.src = matchMedia('(max-width: 800px)').matches || connection?.effectiveType === '3g' ? video.dataset.mobile : video.dataset.desktop;
      video.muted = true;
    }
    video.play().catch(() => {});
  };
  video.addEventListener('error', () => { failed = true; video.removeAttribute('src'); video.load(); });
  const update = () => { if (document.hidden || !visible || motion.matches || connection?.saveData) video.pause(); else play(); };
  document.addEventListener('visibilitychange', update);
  motion.addEventListener('change', update);
  if ('IntersectionObserver' in window) new IntersectionObserver(entries => { visible = entries[0].isIntersecting; update(); }).observe(video);
  update();
})();
