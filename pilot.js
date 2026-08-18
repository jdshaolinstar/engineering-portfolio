(() => {
  const toggle = document.getElementById('pilotToggle');
  const canvas = document.getElementById('pilotCanvas');
  const hint = document.getElementById('pilotHint');
  if (!toggle || !canvas || !hint) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const ctx = canvas.getContext('2d');
  const keys = new Set();
  const ship = { x: 0, y: 0, vx: 0, vy: 0, angle: 0, renderY: 0 };
  let particles = [];
  let orbs = [];
  let active = false;
  let raf = null;
  let tick = 0;
  let dpr = Math.min(window.devicePixelRatio || 1, 2);
  let lastFrameTime = null;
  let wasdActiveMs = 0;
  let hintDismissed = false;

  const HINT_DISMISS_MS = 10000;

  const ACCEL = 0.35;
  const FRICTION = 0.9;
  const MAX_SPEED = 4.5;
  const SCROLL_SPEED = 9;
  const MARGIN = 40;
  const TURN_RATE = 0.18;
  const ORB_SPEED = 15;
  const ORB_MAX_AGE = 150;
  const TARGET_SELECTOR = '.media, .project__link';
  const BUZZED_SELECTOR = '.media.is-buzzed, .project__link.is-buzzed';

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    canvas.style.width = window.innerWidth + 'px';
    canvas.style.height = window.innerHeight + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function resetShip() {
    ship.x = window.innerWidth / 2;
    ship.y = window.innerHeight / 2;
    ship.vx = 0;
    ship.vy = 0;
    particles = [];
    orbs = [];
  }

  function onKeyDown(e) {
    if (e.key === 'Escape') {
      stop();
      return;
    }
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      if (!activateBuzzed()) fireOrb();
      return;
    }
    const k = e.key.toLowerCase();
    if (k === 'w' || k === 'a' || k === 's' || k === 'd') {
      keys.add(k);
      e.preventDefault();
    }
  }

  function clickable(el) {
    return el.matches('.project__link') ? el : el.querySelector('.media__play');
  }

  function activateBuzzed() {
    const buzzed = document.querySelector(BUZZED_SELECTOR);
    if (!buzzed) return false;
    const target = clickable(buzzed);
    if (!target) return false;
    target.click();
    return true;
  }

  function fireOrb() {
    orbs.push({
      x: ship.x + Math.cos(ship.angle) * 24,
      y: ship.renderY + Math.sin(ship.angle) * 24,
      vx: Math.cos(ship.angle) * ORB_SPEED,
      vy: Math.sin(ship.angle) * ORB_SPEED,
      age: 0,
    });
  }

  function onKeyUp(e) {
    keys.delete(e.key.toLowerCase());
  }

  function clearBuzzed() {
    document.querySelectorAll(BUZZED_SELECTOR).forEach((el) => el.classList.remove('is-buzzed'));
  }

  function update() {
    tick += 1;

    const now = performance.now();
    const dt = lastFrameTime ? now - lastFrameTime : 16.67;
    lastFrameTime = now;

    const flying = keys.has('w') || keys.has('a') || keys.has('s') || keys.has('d');
    if (flying && !hintDismissed) {
      wasdActiveMs += dt;
      if (wasdActiveMs >= HINT_DISMISS_MS) {
        hintDismissed = true;
        hint.classList.remove('is-visible');
      }
    }

    if (document.body.classList.contains('lightbox-open')) {
      ship.vx *= FRICTION;
      ship.vy *= FRICTION;
      return;
    }

    if (keys.has('a')) ship.vx -= ACCEL;
    if (keys.has('d')) ship.vx += ACCEL;
    if (keys.has('w')) {
      ship.vy -= ACCEL;
      window.scrollBy({ top: -SCROLL_SPEED, behavior: 'instant' });
    }
    if (keys.has('s')) {
      ship.vy += ACCEL;
      window.scrollBy({ top: SCROLL_SPEED, behavior: 'instant' });
    }

    ship.vx *= FRICTION;
    ship.vy *= FRICTION;
    ship.vx = Math.max(-MAX_SPEED, Math.min(MAX_SPEED, ship.vx));
    ship.vy = Math.max(-MAX_SPEED, Math.min(MAX_SPEED, ship.vy));

    ship.x = Math.max(MARGIN, Math.min(window.innerWidth - MARGIN, ship.x + ship.vx));
    ship.y = Math.max(MARGIN, Math.min(window.innerHeight - MARGIN, ship.y + ship.vy));

    const bob = Math.sin(tick * 0.08) * 2;
    ship.renderY = ship.y + bob;

    const moveSpeed = Math.hypot(ship.vx, ship.vy);
    if (moveSpeed > 0.35) {
      const target = Math.atan2(ship.vy, ship.vx);
      let diff = target - ship.angle;
      diff = ((diff + Math.PI) % (Math.PI * 2)) - Math.PI;
      ship.angle += diff * TURN_RATE;
    }

    const speed = Math.hypot(ship.vx, ship.vy);
    if (flying || speed > 0.5) {
      const count = flying ? 2 : 1;
      for (let i = 0; i < count; i++) {
        particles.push({
          x: ship.x - 14 + (Math.random() - 0.5) * 6,
          y: ship.renderY + (Math.random() - 0.5) * 8,
          vx: -ship.vx * 0.25 + (Math.random() - 0.5) * 1.2,
          vy: -ship.vy * 0.25 + 0.6 + Math.random() * 1.2,
          life: 1,
          size: 3 + Math.random() * 3,
        });
      }
    }
    particles.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;
      p.life -= 0.025;
      p.size *= 0.98;
    });
    particles = particles.filter((p) => p.life > 0);

    const shipBox = {
      left: ship.x - 26,
      right: ship.x + 26,
      top: ship.renderY - 16,
      bottom: ship.renderY + 16,
    };
    document.querySelectorAll(TARGET_SELECTOR).forEach((el) => {
      const r = el.getBoundingClientRect();
      const overlap = !(
        shipBox.right < r.left ||
        shipBox.left > r.right ||
        shipBox.bottom < r.top ||
        shipBox.top > r.bottom
      );
      el.classList.toggle('is-buzzed', overlap);
    });

    orbs.forEach((o) => {
      o.x += o.vx;
      o.y += o.vy;
      o.age += 1;
    });
    orbs = orbs.filter(
      (o) => o.age < ORB_MAX_AGE && o.x > -20 && o.x < window.innerWidth + 20 && o.y > -20 && o.y < window.innerHeight + 20
    );

    for (const o of orbs) {
      let hitEl = null;
      for (const el of document.querySelectorAll(TARGET_SELECTOR)) {
        const r = el.getBoundingClientRect();
        if (o.x >= r.left && o.x <= r.right && o.y >= r.top && o.y <= r.bottom) {
          hitEl = el;
          break;
        }
      }
      if (hitEl) {
        const target = clickable(hitEl);
        orbs = [];
        if (target) target.click();
        break;
      }
    }
  }

  function draw() {
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

    particles.forEach((p) => {
      ctx.beginPath();
      ctx.fillStyle = `rgba(150, 158, 172, ${Math.max(p.life, 0) * 0.5})`;
      ctx.arc(p.x, p.y, Math.max(p.size, 0), 0, Math.PI * 2);
      ctx.fill();
    });

    orbs.forEach((o) => {
      ctx.beginPath();
      ctx.fillStyle = '#4de1ee';
      ctx.shadowColor = '#4de1ee';
      ctx.shadowBlur = 10;
      ctx.arc(o.x, o.y, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    });

    ctx.save();
    ctx.translate(ship.x, ship.renderY);
    ctx.rotate(ship.angle);

    ctx.beginPath();
    ctx.moveTo(22, 0);
    ctx.lineTo(-16, -12);
    ctx.lineTo(-8, 0);
    ctx.lineTo(-16, 12);
    ctx.closePath();
    ctx.fillStyle = '#ecebe4';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#4de1ee';
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(4, 0, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#4de1ee';
    ctx.fill();

    ctx.restore();
  }

  function loop() {
    if (!active) return;
    update();
    draw();
    raf = requestAnimationFrame(loop);
  }

  function start() {
    active = true;
    canvas.classList.add('is-active');
    toggle.textContent = '🛬 Land';
    toggle.setAttribute('aria-pressed', 'true');
    wasdActiveMs = 0;
    hintDismissed = false;
    hint.classList.add('is-visible');

    resize();
    resetShip();
    lastFrameTime = null;
    toggle.blur();

    window.addEventListener('resize', resize);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    loop();
  }

  function stop() {
    active = false;
    canvas.classList.remove('is-active');
    toggle.textContent = '🚀 Fly the page';
    toggle.setAttribute('aria-pressed', 'false');
    hint.classList.remove('is-visible');

    window.removeEventListener('resize', resize);
    window.removeEventListener('keydown', onKeyDown);
    window.removeEventListener('keyup', onKeyUp);
    keys.clear();
    clearBuzzed();

    if (raf) cancelAnimationFrame(raf);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  toggle.addEventListener('click', () => {
    if (active) stop();
    else start();
  });

  const isDesktop = window.matchMedia('(min-width: 900px) and (pointer: fine) and (hover: hover)').matches;
  if (isDesktop) start();
})();
