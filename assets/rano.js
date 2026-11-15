/* Rano theme JS: vanilla, no dependencies. */
(() => {
  document.documentElement.classList.add('js');
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const overlay = $('[data-overlay]');

  /* ---------- Drawers (menu, cart, search) ---------- */
  let openEl = null, lastFocus = null;
  function openDrawer(el) {
    if (!el) return;
    if (openEl && openEl !== el) closeDrawer();
    lastFocus = document.activeElement;
    el.hidden = false;
    const isPanel = el.classList.contains('search-panel');
    if (!isPanel) { overlay.hidden = false; document.body.style.overflow = 'hidden'; }
    requestAnimationFrame(() => { el.classList.add('is-open'); if (!isPanel) overlay.classList.add('is-open'); });
    openEl = el;
    const focusable = $('input, button, a', el);
    focusable && setTimeout(() => focusable.focus(), 50);
  }
  function closeDrawer() {
    if (!openEl) return;
    const el = openEl;
    el.classList.remove('is-open');
    overlay.classList.remove('is-open');
    document.body.style.overflow = '';
    setTimeout(() => { el.hidden = true; overlay.hidden = true; }, el.classList.contains('search-panel') ? 0 : 400);
    openEl = null;
    lastFocus && lastFocus.focus();
  }
  document.addEventListener('click', (e) => {
    const opener = e.target.closest('[data-open]');
    if (opener) {
      e.preventDefault();
      const target = document.getElementById(opener.dataset.open);
      target === openEl ? closeDrawer() : openDrawer(target);
      return;
    }
    if (e.target.closest('[data-close]') || e.target === overlay) closeDrawer();
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeDrawer(); });

  /* ---------- Header shadow on scroll (IntersectionObserver, no scroll listener) ---------- */
  const header = $('[data-header]');
  if (header) {
    const sentinel = document.createElement('div');
    sentinel.style.cssText = 'position:absolute;top:0;height:1px;width:1px';
    document.body.prepend(sentinel);
    new IntersectionObserver(([en]) => header.classList.toggle('is-scrolled', !en.isIntersecting)).observe(sentinel);
  }

  /* ---------- Announcement rotator ---------- */
  $$('[data-rotator]').forEach((bar) => {
    const msgs = $$('.announce__msg', bar);
    if (msgs.length < 2 || reduce) return;
    let i = 0;
    setInterval(() => { msgs[i].classList.remove('is-active'); i = (i + 1) % msgs.length; msgs[i].classList.add('is-active'); }, 4500);
  });

  /* ---------- Hero slideshow ---------- */
  $$('[data-slideshow]').forEach((root) => {
    const slides = $$('[data-slide]', root), dots = $$('[data-dot]', root);
    const secs = Number(root.dataset.interval) || 0;
    root.style.setProperty('--dur', secs + 's');
    let i = 0, timer;
    const go = (n) => {
      slides[i].classList.remove('is-active'); dots[i] && dots[i].classList.remove('is-active');
      i = (n + slides.length) % slides.length;
      slides[i].classList.add('is-active');
      if (dots[i]) { dots[i].classList.remove('is-active'); void dots[i].offsetWidth; dots[i].classList.add('is-active'); }
      $$('video', root).forEach((v) => (v.closest('[data-slide]') === slides[i] ? v.play().catch(() => {}) : v.pause()));
      schedule();
    };
    const schedule = () => { clearTimeout(timer); if (secs && slides.length > 1 && !reduce) timer = setTimeout(() => go(i + 1), secs * 1000); };
    dots.forEach((d) => d.addEventListener('click', () => go(Number(d.dataset.dot))));
    let x0 = null;
    root.addEventListener('touchstart', (e) => (x0 = e.touches[0].clientX), { passive: true });
    root.addEventListener('touchend', (e) => { if (x0 === null) return; const dx = e.changedTouches[0].clientX - x0; if (Math.abs(dx) > 50) go(i + (dx < 0 ? 1 : -1)); x0 = null; });
    schedule();
  });

  /* ---------- Carousels: arrows scroll the visible track ---------- */
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-prev],[data-next]');
    if (!btn) return;
    const section = btn.closest('section');
    const track = $$('[data-carousel]', section).find((t) => t.offsetParent !== null);
    if (!track) return;
    const step = track.clientWidth * 0.8;
    track.scrollBy({ left: btn.hasAttribute('data-next') ? step : -step, behavior: reduce ? 'auto' : 'smooth' });
  });

  /* ---------- Tabs ---------- */
  $$('[data-tabs]').forEach((root) => {
    const tabs = $$('[data-tab]', root), panels = $$('[data-panel]', root);
    tabs.forEach((t) => t.addEventListener('click', () => {
      tabs.forEach((x) => { x.classList.toggle('is-active', x === t); x.setAttribute('aria-selected', x === t); });
      panels.forEach((p, n) => (p.hidden = n !== Number(t.dataset.tab)));
    }));
  });

  /* ---------- Reveal + play videos only when visible ---------- */
  const io = new IntersectionObserver((entries) => entries.forEach((en) => {
    if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
  }), { rootMargin: '0px 0px -8% 0px' });
  $$('.reveal').forEach((el) => io.observe(el));
  const vio = new IntersectionObserver((entries) => entries.forEach((en) => {
    const v = en.target;
    if (v.closest('[data-slide]') && !v.closest('[data-slide]').classList.contains('is-active')) return;
    en.isIntersecting ? v.play().catch(() => {}) : v.pause();
  }), { threshold: 0.2 });
  $$('video[autoplay]').forEach((v) => { v.muted = true; vio.observe(v); });

  /* ---------- Cart (AJAX + section rendering) ---------- */
  const countEls = () => $$('[data-cart-count]');
  async function refreshCart(open = true) {
    const res = await fetch(`${window.rano.root}?sections=cart-drawer`);
    const html = (await res.json())['cart-drawer'];
    const fresh = new DOMParser().parseFromString(html, 'text/html').querySelector('#cart-drawer');
    const drawer = $('#cart-drawer');
    drawer.innerHTML = fresh.innerHTML;
    $$('.reveal', drawer).forEach((el) => el.classList.add('is-in'));
    const cart = await (await fetch(`${window.rano.root}cart.js`)).json();
    countEls().forEach((c) => { c.textContent = cart.item_count; c.hidden = cart.item_count === 0; });
    if (open && openEl !== drawer) openDrawer(drawer);
  }
  document.addEventListener('submit', async (e) => {
    const form = e.target.closest('[data-add-form]');
    if (!form || !window.fetch) return;
    e.preventDefault();
    const btn = $('[type="submit"]', form);
    btn && btn.classList.add('is-loading');
    try {
      const res = await fetch(window.rano.cartAdd, { method: 'POST', headers: { Accept: 'application/json' }, body: new FormData(form) });
      if (!res.ok) { const err = await res.json(); alert(err.description || 'Could not add to bag'); return; }
      await refreshCart(true);
    } catch (_) { form.submit(); }
    finally { btn && btn.classList.remove('is-loading'); }
  });
  document.addEventListener('click', async (e) => {
    const b = e.target.closest('#cart-drawer [data-qty]');
    if (!b) return;
    const line = b.dataset.line || b.closest('[data-line]').dataset.line;
    const drawer = $('#cart-drawer');
    drawer.classList.add('is-loading');
    await fetch(window.rano.cartChange, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify({ line: Number(line), quantity: Number(b.dataset.qty) }) });
    await refreshCart(false);
    drawer.classList.remove('is-loading');
  });

  /* ---------- Cookie consent (Shopify Customer Privacy API; localStorage outside Shopify) ---------- */
  const cookie = $('[data-cookie]');
  if (cookie) {
    const KEY = 'rano-consent';
    const boxes = $$('[data-consent]', cookie);
    const show = () => { cookie.hidden = false; requestAnimationFrame(() => cookie.classList.add('is-open')); };
    const save = (all) => {
      const c = Object.fromEntries(boxes.map((b) => [b.dataset.consent, all || b.checked]));
      localStorage.setItem(KEY, JSON.stringify(c));
      const cp = window.Shopify && Shopify.customerPrivacy;
      cp && cp.setTrackingConsent({ analytics: c.analytics, marketing: c.marketing, preferences: c.preferences, sale_of_data: c.marketing }, () => {});
      cookie.classList.remove('is-open');
      setTimeout(() => (cookie.hidden = true), 400);
    };
    $('[data-cookie-accept]', cookie).addEventListener('click', () => save(true));
    $('[data-cookie-save]', cookie).addEventListener('click', () => save(false));
    if (window.Shopify && Shopify.loadFeatures) {
      Shopify.loadFeatures([{ name: 'consent-tracking-api', version: '0.1' }], (err) => {
        if (!err && Shopify.customerPrivacy.shouldShowBanner()) show();
      });
    } else if (!localStorage.getItem(KEY)) {
      show();
    }
  }

  /* ---------- 3D models: Shopify's model-viewer, Google CDN outside Shopify ---------- */
  if ($('model-viewer')) {
    const fallback = () => customElements.get('model-viewer') || import('https://ajax.googleapis.com/ajax/libs/model-viewer/4.0.0/model-viewer.min.js');
    if (window.Shopify && Shopify.loadFeatures) Shopify.loadFeatures([{ name: 'model-viewer-ui', version: '1.0', onLoad: fallback }]);
    else fallback();
  }

  /* ---------- Product page ---------- */
  const pdp = $('[data-product]');
  if (pdp) {
    const variants = JSON.parse($('[data-variants]', pdp).textContent);
    const idInput = $('[data-variant-id]', pdp), atc = $('[data-atc]', pdp), priceEl = $('[data-price]', pdp);
    const money = (c) => new Intl.NumberFormat(document.documentElement.lang || 'en', { style: 'currency', currency: window.Shopify && Shopify.currency ? Shopify.currency.active : 'EUR' }).format(c / 100);
    $$('[data-option]', pdp).forEach((sel) => sel.addEventListener('change', () => {
      const chosen = $$('[data-option]', pdp).map((s) => s.value);
      const v = variants.find((x) => x.options.every((o, n) => o === chosen[n]));
      atc.disabled = !v || !v.available;
      atc.textContent = !v ? 'Unavailable' : v.available ? 'Add to bag' : 'Sold out';
      if (!v) return;
      idInput.value = v.id;
      const sale = v.compare_at_price > v.price;
      priceEl.innerHTML = `<span class="price${sale ? ' price--sale' : ''}"><span class="price__now">${money(v.price)}</span>${sale ? `<s class="price__was">${money(v.compare_at_price)}</s>` : ''}</span>`;
      history.replaceState(null, '', `?variant=${v.id}`);
    }));

    // Mobile gallery dots
    const track = $('.pdp__track', pdp), dots = $$('.pdp__dots span', pdp);
    if (track && dots.length) {
      const sio = new IntersectionObserver((entries) => entries.forEach((en) => {
        if (en.isIntersecting) dots.forEach((d, n) => d.classList.toggle('is-active', n === [...track.children].indexOf(en.target)));
      }), { root: track, threshold: 0.6 });
      [...track.children].forEach((s) => sio.observe(s));
    }

    // Sticky add-to-cart (mobile) when the main button is out of view
    const bar = $('[data-sticky-atc]', pdp);
    if (bar && atc) {
      bar.hidden = false;
      new IntersectionObserver(([en]) => bar.classList.toggle('is-visible', !en.isIntersecting && en.boundingClientRect.top < 0)).observe(atc);
      $('[data-sticky-submit]', bar).addEventListener('click', () => atc.click());
    }
  }
})();
