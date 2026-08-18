(() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Lightbox: open project videos in a large centered modal instead of the small card */
  const lightbox = document.querySelector('.lightbox');
  const lightboxFrame = document.querySelector('.lightbox__frame');
  let lastFocused = null;

  function openLightbox(media) {
    const provider = media.dataset.provider;
    const src = media.dataset.embedSrc;
    const title = media.dataset.title || 'Project video';
    let node;
    if (provider === 'video') {
      node = document.createElement('video');
      node.src = src;
      node.controls = true;
      node.autoplay = true;
      node.playsInline = true;
    } else {
      node = document.createElement('iframe');
      node.src = src;
      node.title = title;
      node.allow = 'autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media; web-share';
      node.allowFullscreen = true;
    }
    lightboxFrame.replaceChildren(node);
    lastFocused = document.activeElement;
    lightbox.classList.add('is-open');
    document.body.classList.add('lightbox-open');
    lightbox.querySelector('.lightbox__close').focus();
  }

  function closeLightbox() {
    if (!lightbox.classList.contains('is-open')) return;
    lightbox.classList.remove('is-open');
    document.body.classList.remove('lightbox-open');
    lightboxFrame.replaceChildren();
    if (lastFocused) lastFocused.focus();
  }

  if (lightbox && lightboxFrame) {
    document.querySelectorAll('.media[data-embed-src]').forEach((media) => {
      const btn = media.querySelector('.media__play');
      if (!btn) return;
      btn.addEventListener('click', () => openLightbox(media));
    });
    lightbox.querySelectorAll('[data-close]').forEach((el) =>
      el.addEventListener('click', closeLightbox)
    );
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeLightbox();
    });
  }

  /* Mobile nav toggle */
  const navToggle = document.querySelector('.nav__toggle');
  const nav = document.querySelector('.nav');
  if (navToggle && nav) {
    navToggle.addEventListener('click', () => {
      const open = nav.classList.toggle('is-open');
      navToggle.setAttribute('aria-expanded', String(open));
    });
    nav.querySelectorAll('a').forEach((a) =>
      a.addEventListener('click', () => {
        nav.classList.remove('is-open');
        navToggle.setAttribute('aria-expanded', 'false');
      })
    );
  }

  /* Scroll reveal */
  const revealEls = document.querySelectorAll('[data-reveal]');
  if (!reduceMotion && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('is-visible'));
  }

  /* Hero depth-grid parallax + point-cloud dots */
  const heroGrid = document.querySelector('.hero__grid');
  const heroSection = document.querySelector('.hero');
  if (heroGrid) {
    const dotCount = 26;
    const colors = ['var(--cyan)', 'var(--amber)'];
    for (let i = 0; i < dotCount; i++) {
      const dot = document.createElement('span');
      dot.className = 'hero__dot';
      dot.style.left = Math.random() * 100 + '%';
      dot.style.top = 8 + Math.random() * 70 + '%';
      dot.style.setProperty('--size', 2 + Math.random() * 3 + 'px');
      dot.style.setProperty('--dot-opacity', (0.25 + Math.random() * 0.4).toFixed(2));
      dot.style.setProperty('--depth', 6 + Math.random() * 34 + 'px');
      dot.style.setProperty('--dot-color', colors[Math.random() > 0.75 ? 1 : 0]);
      heroGrid.appendChild(dot);
    }
  }
  if (heroGrid && heroSection && !reduceMotion) {
    let raf = null;
    heroSection.addEventListener('pointermove', (e) => {
      const rect = heroSection.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        heroGrid.style.setProperty('--px', x.toFixed(3));
        heroGrid.style.setProperty('--py', y.toFixed(3));
      });
    });
  }

  /* Footer year */
  const yearEl = document.querySelector('[data-year]');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());
})();
