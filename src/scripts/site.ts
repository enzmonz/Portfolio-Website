/**
 * Site-wide progressive enhancement. Everything here is optional: the site is
 * fully usable without JavaScript.
 */

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');

/* ------------------------------------------------------------------ */
/* Scroll reveal + in-view flags                                       */
/* ------------------------------------------------------------------ */

/*
 * Reveal is geometric (getBoundingClientRect), not IntersectionObserver-based:
 * several entrances start fully clipped (clip-path), and Chromium treats a fully
 * clipped target as never intersecting — those elements used to stay at opacity 0
 * forever. Bounding rects ignore clip-path, opacity and filters, so this can't stall.
 *
 * An element is revealed once its top has crossed 92% of the viewport height —
 * including elements already scrolled past (scroll restoration on refresh, #hash
 * links, back/forward), so nothing above the fold is ever left blank.
 */
function initReveal() {
  const root = document.documentElement;
  const show = (el: HTMLElement) => {
    el.classList.add('is-visible');
    el.dataset.visible = 'true';
  };

  let pending = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal], [data-inview]'));
  const revealAll = () => {
    pending.forEach(show);
    pending = [];
  };

  // Tells the head watchdog (Layout.astro) that the reveal system is alive.
  root.classList.add('reveal-ready');

  if (reduceMotion.matches) return revealAll();

  let frame = 0;
  const sweep = () => {
    frame = 0;
    const line = window.innerHeight * 0.92;
    // Read all geometry before changing classes to avoid layout thrashing.
    const visible: HTMLElement[] = [];
    pending = pending.filter((el) => {
      const r = el.getBoundingClientRect();
      if (r.width === 0 && r.height === 0) return true; // display:none (e.g. other breakpoint)
      if (r.top < line) {
        visible.push(el);
        return false;
      }
      return true;
    });
    visible.forEach(show);
    if (!pending.length) stop();
  };
  const schedule = () => {
    if (!frame) frame = requestAnimationFrame(sweep);
  };
  const events: [EventTarget, string][] = [
    [window, 'scroll'],
    [window, 'resize'],
    [window, 'load'],
    [window, 'hashchange'],
    [window, 'pageshow'],
  ];
  const stop = () => events.forEach(([t, e]) => t.removeEventListener(e, schedule));
  events.forEach(([t, e]) => t.addEventListener(e, schedule, { passive: true }));

  sweep();
  // Fonts and images can shift layout after the first sweep.
  document.fonts?.ready.then(schedule);

  // If the visitor switches motion off mid-visit, nothing should wait for a scroll.
  reduceMotion.addEventListener('change', (e) => e.matches && revealAll());
}

/* ------------------------------------------------------------------ */
/* Navigation core                                                     */
/* ------------------------------------------------------------------ */

function initNavCore() {
  const dock = document.querySelector<HTMLElement>('[data-core-dock]');
  const openBtn = document.querySelector<HTMLButtonElement>('[data-core-open]');
  const dialog = document.querySelector<HTMLDialogElement>('[data-core-menu]');
  if (!dock || !openBtn || !dialog || typeof dialog.showModal !== 'function') return;

  const closeBtn = dialog.querySelector<HTMLButtonElement>('[data-core-close]');
  const items = Array.from(dialog.querySelectorAll<HTMLElement>('.hub-item'));
  const links = Array.from(dialog.querySelectorAll<HTMLAnchorElement>('[data-hub-link]'));
  const lines = dialog.querySelector<SVGSVGElement>('[data-hub-lines]');
  const currentLabel = dock.querySelector<HTMLElement>('[data-core-current]');
  const onHome = dock.dataset.page === 'home';

  /* Compact floating control after the first scroll. */
  const onScroll = () => {
    if (window.scrollY > 64) dock.dataset.compact = '';
    else delete dock.dataset.compact;
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* Lay the destinations out as a fan beneath the core (desktop only). */
  const layout = () => {
    const orb = openBtn.querySelector('.core-orb')?.getBoundingClientRect();
    const cx = window.innerWidth / 2;
    const cy = orb ? orb.top + orb.height / 2 : 48;
    dialog.style.setProperty('--core-y', `${cy}px`);
    dialog.style.setProperty('--core-top', `${orb ? orb.top - (56 - orb.height) / 2 : 14}px`);
    const wide = window.matchMedia('(width >= 48rem) and (height >= 34rem)').matches;
    if (lines) lines.innerHTML = '';
    if (!wide) return;
    const rx = Math.min(window.innerWidth * 0.38, 560);
    const ry = Math.min(window.innerHeight * 0.4, 330);
    const n = items.length;
    const start = 158;
    const end = 22;
    const fragments: string[] = [];
    items.forEach((li, i) => {
      const angle = ((start + ((end - start) * i) / (n - 1)) * Math.PI) / 180;
      const x = cx + Math.cos(angle) * rx;
      const y = cy + 36 + Math.sin(angle) * ry;
      li.style.setProperty('--x', `${x}px`);
      li.style.setProperty('--y', `${y}px`);
      li.style.setProperty('--from-x', `calc(${cx - x}px - 50%)`);
      li.style.setProperty('--from-y', `calc(${cy - y}px - 50%)`);
      fragments.push(`<line x1="${cx}" y1="${cy + 30}" x2="${x}" y2="${y - 24}" />`);
    });
    if (lines) lines.innerHTML = fragments.join('');
  };

  let closing = 0;
  const open = () => {
    window.clearTimeout(closing);
    layout();
    dialog.showModal();
    dock.dataset.open = '';
    openBtn.setAttribute('aria-expanded', 'true');
    document.documentElement.style.overflow = 'hidden';
    requestAnimationFrame(() => requestAnimationFrame(() => (dialog.dataset.state = 'open')));
  };

  const close = (after?: () => void) => {
    if (!dialog.open) return after?.();
    dialog.dataset.state = 'closing';
    const finish = () => {
      dialog.close();
      after?.();
    };
    if (reduceMotion.matches) finish();
    else closing = window.setTimeout(finish, 260);
  };

  dialog.addEventListener('close', () => {
    delete dialog.dataset.state;
    delete dock.dataset.open;
    openBtn.setAttribute('aria-expanded', 'false');
    document.documentElement.style.overflow = '';
  });
  dialog.addEventListener('cancel', (event) => {
    event.preventDefault();
    close(() => openBtn.focus());
  });

  openBtn.addEventListener('click', open);
  closeBtn?.addEventListener('click', () => close(() => openBtn.focus()));
  dialog.querySelector('[data-core-scrim]')?.addEventListener('click', () => close());

  links.forEach((link) =>
    link.addEventListener('click', (event) => {
      const href = link.getAttribute('href') ?? '';
      if (!href.startsWith('#')) {
        dialog.dataset.state = 'closing';
        return; // normal navigation to another page
      }
      event.preventDefault();
      close(() => {
        const target = document.querySelector<HTMLElement>(href);
        target?.scrollIntoView({ behavior: reduceMotion.matches ? 'auto' : 'smooth' });
        history.pushState(null, '', href);
      });
    }),
  );

  /* Arrow keys move between destinations. */
  dialog.addEventListener('keydown', (event) => {
    const index = links.indexOf(document.activeElement as HTMLAnchorElement);
    if (index < 0) return;
    const step = event.key === 'ArrowRight' || event.key === 'ArrowDown' ? 1 : event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? -1 : 0;
    if (!step) return;
    event.preventDefault();
    links[(index + step + links.length) % links.length].focus();
  });

  window.addEventListener('resize', () => dialog.open && layout());

  /* Current section → compact label + aria-current. */
  if (!onHome) return;
  const labels = new Map(links.map((a) => [a.dataset.navLink!, a.querySelector('.hub-label')?.textContent ?? '']));
  const indices = new Map(links.map((a, i) => [a.dataset.navLink!, String(i).padStart(2, '0')]));
  const sections = Array.from(labels.keys())
    .map((id) => document.getElementById(id))
    .filter((el): el is HTMLElement => el !== null);
  let current = '';
  const pick = () => {
    const line = window.innerHeight * 0.4;
    let active = sections[0]?.id ?? 'home';
    for (const s of sections) if (s.getBoundingClientRect().top - line <= 0) active = s.id;
    if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) {
      active = sections[sections.length - 1]?.id ?? active;
    }
    if (active === current) return;
    current = active;
    if (currentLabel) currentLabel.textContent = `${indices.get(active)} · ${labels.get(active)}`;
    links.forEach((a) => {
      if (a.dataset.navLink === active) a.setAttribute('aria-current', 'true');
      else a.removeAttribute('aria-current');
    });
  };
  let ticking = false;
  window.addEventListener(
    'scroll',
    () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        pick();
      });
    },
    { passive: true },
  );
  pick();
}

/* ------------------------------------------------------------------ */
/* Theme toggle: circular reveal from the button                       */
/* ------------------------------------------------------------------ */

function initTheme() {
  const root = document.documentElement;
  const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  const buttons = document.querySelectorAll<HTMLButtonElement>('[data-theme-toggle]');

  const sync = () => {
    const theme = root.dataset.theme === 'light' ? 'light' : 'dark';
    const next = theme === 'dark' ? 'light' : 'dark';
    buttons.forEach((b) => b.setAttribute('aria-label', `Switch to ${next} theme`));
    meta?.setAttribute('content', theme === 'dark' ? '#09090b' : '#f7e9e7');
  };

  buttons.forEach((button) =>
    button.addEventListener('click', (event) => {
      const next = root.dataset.theme === 'light' ? 'dark' : 'light';
      try {
        localStorage.setItem('theme', next);
      } catch {
        /* storage unavailable — theme still applies for this page */
      }
      const apply = () => {
        root.dataset.theme = next;
        sync();
      };
      if (reduceMotion.matches) return apply();

      const doc = document as Document & {
        startViewTransition?: (cb: () => void) => { ready: Promise<void>; finished: Promise<void> };
      };
      if (!doc.startViewTransition) {
        root.classList.add('theme-fade');
        apply();
        window.setTimeout(() => root.classList.remove('theme-fade'), 500);
        return;
      }
      const rect = button.getBoundingClientRect();
      const x = (event as MouseEvent).clientX || rect.left + rect.width / 2;
      const y = (event as MouseEvent).clientY || rect.top + rect.height / 2;
      const r = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
      root.classList.add('theme-vt');
      const vt = doc.startViewTransition(apply);
      vt.ready
        .then(() =>
          root.animate(
            { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${r}px at ${x}px ${y}px)`] },
            { duration: 650, easing: 'cubic-bezier(0.16, 1, 0.3, 1)', pseudoElement: '::view-transition-new(root)' },
          ),
        )
        .catch(() => {});
      vt.finished.finally(() => root.classList.remove('theme-vt'));
    }),
  );
  sync();
}

/* ------------------------------------------------------------------ */
/* Cursor ring + magnetic elements (fine pointers, motion allowed)     */
/* ------------------------------------------------------------------ */

function initPointerEffects() {
  if (!finePointer.matches || reduceMotion.matches) return;

  const layer = document.querySelector<HTMLElement>('[data-cursor-layer]');
  const ring = layer?.querySelector<HTMLElement>('.cursor-ring');
  const dot = layer?.querySelector<HTMLElement>('.cursor-dot');
  let x = -100;
  let y = -100;
  let rx = x;
  let ry = y;
  let raf = 0;

  const tick = () => {
    rx += (x - rx) * 0.2;
    ry += (y - ry) * 0.2;
    if (ring) ring.style.transform = `translate3d(${rx}px, ${ry}px, 0)`;
    if (dot) dot.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    raf = Math.abs(x - rx) + Math.abs(y - ry) > 0.2 ? requestAnimationFrame(tick) : 0;
  };

  const interactive = 'a, button, [role="tab"], summary, label, [data-cursor]';
  document.addEventListener(
    'pointermove',
    (event) => {
      if (event.pointerType !== 'mouse') return;
      x = event.clientX;
      y = event.clientY;
      if (layer) {
        layer.dataset.active = '';
        const target = event.target as Element | null;
        const over = target?.closest(interactive);
        if (over && (over as HTMLElement).dataset.cursor !== 'none') layer.dataset.hover = '';
        else delete layer.dataset.hover;
        if (target?.closest('[data-cursor="none"]')) layer.dataset.hidden = '';
        else delete layer.dataset.hidden;
      }
      if (!raf) raf = requestAnimationFrame(tick);
    },
    { passive: true },
  );
  document.documentElement.addEventListener('pointerleave', () => layer && delete layer.dataset.active);

  /* Magnetic: elements drift a few px toward the pointer. */
  document.querySelectorAll<HTMLElement>('[data-magnetic]').forEach((el) => {
    const strength = Number(el.dataset.magnetic) || 0.22;
    el.addEventListener('pointermove', (event) => {
      const r = el.getBoundingClientRect();
      const dx = (event.clientX - (r.left + r.width / 2)) * strength;
      const dy = (event.clientY - (r.top + r.height / 2)) * strength;
      el.style.setProperty('--mag-x', `${Math.max(-8, Math.min(8, dx))}px`);
      el.style.setProperty('--mag-y', `${Math.max(-8, Math.min(8, dy))}px`);
    });
    el.addEventListener('pointerleave', () => {
      el.style.removeProperty('--mag-x');
      el.style.removeProperty('--mag-y');
    });
  });
}

/* ------------------------------------------------------------------ */
/* Pointer spotlight on surfaces                                       */
/* ------------------------------------------------------------------ */

function initSpotlight() {
  if (!finePointer.matches) return;
  let frame = 0;
  document.addEventListener(
    'pointermove',
    (event) => {
      const el = (event.target as Element | null)?.closest<HTMLElement>('.spotlight');
      if (!el) return;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const r = el.getBoundingClientRect();
        el.style.setProperty('--mx', `${event.clientX - r.left}px`);
        el.style.setProperty('--my', `${event.clientY - r.top}px`);
      });
    },
    { passive: true },
  );
}

initReveal();
initNavCore();
initTheme();
initPointerEffects();
initSpotlight();
