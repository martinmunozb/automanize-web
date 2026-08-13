(() => {
  const modal = document.getElementById('cta-modal');
  const openButtons = document.querySelectorAll('.js-open-cta');
  const closeButtons = document.querySelectorAll('.js-close-cta');
  const menuButton = document.querySelector('.menu-button');
  const mobileMenu = document.querySelector('.mobile-menu');
  let lastFocus = null;

  const focusables = () => [...modal.querySelectorAll('button, a[href]')].filter(el => !el.disabled);
  const openModal = () => {
    lastFocus = document.activeElement;
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
    window.setTimeout(() => modal.querySelector('.modal-close')?.focus({ preventScroll: true }), 120);
  };
  const closeModal = () => {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
    lastFocus?.focus();
  };

  openButtons.forEach(button => button.addEventListener('click', openModal));
  closeButtons.forEach(button => button.addEventListener('click', closeModal));

  document.addEventListener('keydown', event => {
    if (!modal.classList.contains('is-open')) return;
    if (event.key === 'Escape') closeModal();
    if (event.key === 'Tab') {
      const items = focusables();
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
  });

  menuButton?.addEventListener('click', () => {
    const open = mobileMenu.hasAttribute('hidden');
    mobileMenu.toggleAttribute('hidden', !open);
    menuButton.setAttribute('aria-expanded', String(open));
  });
  mobileMenu?.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
    mobileMenu.setAttribute('hidden', '');
    menuButton.setAttribute('aria-expanded', 'false');
  }));

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => entry.isIntersecting && entry.target.classList.add('in-view'));
  }, { threshold: .14 });
  document.querySelectorAll('.reveal-on-scroll').forEach(element => observer.observe(element));
})();
