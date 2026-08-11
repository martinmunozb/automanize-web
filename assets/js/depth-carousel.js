/* ===================================================================
   DEPTH CAROUSEL — carrusel 3D en capas, vanilla JS sin dependencias.
   Equivalente funcional al componente React DepthCarousel: misma API
   de opciones (depth, spread, tilt, tiltDirection, perspective,
   visibleCards, falloff, blur, autoplay, loop, cardWidth, cardHeight,
   radius, tint, duration, ease, autoplayDelay, showControls,
   showIndicators), pero sin dependencia de un bundler.
   =================================================================== */
(function () {
    var EASE_MAP = {
        'power3.out': 'cubic-bezier(0.22, 1, 0.36, 1)',
        'power2.out': 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        'power1.out': 'cubic-bezier(0.39, 0.575, 0.565, 1)'
    };

    function createDepthCarousel(root, items, options) {
        var opts = Object.assign({
            depth: 220,
            spread: 90,
            tilt: 22,
            tiltDirection: 'right',
            perspective: 1400,
            visibleCards: 4,
            falloff: 0.2,
            blur: 6,
            autoplay: false,
            loop: true,
            cardWidth: 300,
            cardHeight: 380,
            radius: 18,
            tint: '#05060a',
            duration: 700,
            ease: 'power3.out',
            autoplayDelay: 3200,
            showControls: true,
            showIndicators: true
        }, options || {});

        var n = items.length;
        var active = 0;
        var timer = null;
        var sideCount = Math.max(1, Math.floor((opts.visibleCards - 1) / 2));
        var cssEase = EASE_MAP[opts.ease] || opts.ease;

        root.classList.add('depth-carousel');
        root.style.perspective = opts.perspective + 'px';
        root.innerHTML =
            '<div class="depth-carousel-stage"></div>' +
            (opts.showControls ?
                '<button type="button" class="depth-carousel-btn depth-carousel-prev" aria-label="Anterior">' +
                '<span class="material-symbols-outlined">chevron_left</span></button>' +
                '<button type="button" class="depth-carousel-btn depth-carousel-next" aria-label="Siguiente">' +
                '<span class="material-symbols-outlined">chevron_right</span></button>' : '') +
            (opts.showIndicators ? '<div class="depth-carousel-dots"></div>' : '');

        var stage = root.querySelector('.depth-carousel-stage');
        var dotsWrap = root.querySelector('.depth-carousel-dots');

        var cards = items.map(function (item, i) {
            var card = document.createElement('div');
            card.className = 'depth-carousel-card';
            card.style.width = opts.cardWidth + 'px';
            card.style.height = opts.cardHeight + 'px';
            card.style.borderRadius = opts.radius + 'px';
            card.style.transitionDuration = opts.duration + 'ms';
            card.style.transitionTimingFunction = cssEase;
            var img = document.createElement('img');
            img.src = item.image;
            img.alt = item.alt || '';
            img.loading = 'lazy';
            var tintEl = document.createElement('div');
            tintEl.className = 'depth-carousel-tint';
            tintEl.style.background = opts.tint;
            card.appendChild(img);
            card.appendChild(tintEl);
            card.addEventListener('click', function () { goTo(i); });
            stage.appendChild(card);
            return { el: card, tint: tintEl };
        });

        var dots = [];
        if (opts.showIndicators) {
            dots = items.map(function (_, i) {
                var dot = document.createElement('button');
                dot.type = 'button';
                dot.className = 'depth-carousel-dot';
                dot.setAttribute('aria-label', 'Ir a la imagen ' + (i + 1));
                dot.addEventListener('click', function () { goTo(i); });
                dotsWrap.appendChild(dot);
                return dot;
            });
        }

        function shortestOffset(i) {
            var d = i - active;
            if (!opts.loop) return d;
            if (d > n / 2) d -= n;
            if (d < -n / 2) d += n;
            return d;
        }

        function render() {
            cards.forEach(function (card, i) {
                var offset = shortestOffset(i);
                var absOffset = Math.abs(offset);
                var inRange = absOffset <= sideCount;
                var scale = Math.max(0.35, 1 - absOffset * opts.falloff);
                var x = offset * opts.spread;
                var z = -absOffset * opts.depth;
                var dir = opts.tiltDirection === 'right' ? -1 : 1;
                var rot = offset === 0 ? 0 : dir * opts.tilt;
                var blurPx = Math.min(opts.blur, absOffset * (opts.blur / sideCount));
                var tintOpacity = Math.min(0.65, absOffset * 0.28);

                card.el.style.transform =
                    'translate(-50%, -50%) translate3d(' + x + 'px, 0, ' + z + 'px) rotateY(' + rot + 'deg) scale(' + scale + ')';
                card.el.style.zIndex = String(100 - absOffset);
                card.el.style.filter = blurPx > 0.05 ? 'blur(' + blurPx + 'px)' : 'none';
                card.el.style.opacity = inRange ? String(Math.max(0.15, 1 - absOffset * 0.22)) : '0';
                card.el.style.pointerEvents = inRange ? 'auto' : 'none';
                card.el.classList.toggle('is-active', offset === 0);
                card.tint.style.opacity = String(tintOpacity);
            });
            dots.forEach(function (dot, i) { dot.classList.toggle('is-active', i === active); });
        }

        function goTo(i) {
            active = opts.loop ? ((i % n) + n) % n : Math.min(n - 1, Math.max(0, i));
            render();
            restartAutoplay();
        }

        function next() { goTo(active + 1); }
        function prev() { goTo(active - 1); }

        var prevBtn = root.querySelector('.depth-carousel-prev');
        var nextBtn = root.querySelector('.depth-carousel-next');
        if (prevBtn) prevBtn.addEventListener('click', prev);
        if (nextBtn) nextBtn.addEventListener('click', next);

        function restartAutoplay() {
            if (timer) clearInterval(timer);
            if (opts.autoplay) timer = setInterval(next, opts.autoplayDelay);
        }

        render();
        restartAutoplay();

        return { next: next, prev: prev, goTo: goTo };
    }

    window.createDepthCarousel = createDepthCarousel;
})();
