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

  /* ---------- Carousel autoplay (pauses on hover/touch, loops) ---------- */
  $$('[data-autoplay]').forEach((track) => {
    if (reduce) return;
    let paused = false;
    ['pointerenter', 'touchstart', 'focusin'].forEach((e) => track.addEventListener(e, () => (paused = true), { passive: true }));
    ['pointerleave', 'focusout'].forEach((e) => track.addEventListener(e, () => (paused = false)));
    setInterval(() => {
      if (paused || track.offsetParent === null) return;
      const atEnd = track.scrollLeft + track.clientWidth >= track.scrollWidth - 4;
      track.scrollTo({ left: atEnd ? 0 : track.scrollLeft + track.firstElementChild.getBoundingClientRect().width + 12, behavior: 'smooth' });
    }, Number(track.dataset.autoplay) * 1000);
  });

  /* ---------- Countdown promo ---------- */
  $$('[data-countdown]').forEach((el) => {
    const end = Date.parse(el.dataset.countdown);
    if (!end) return;
    const pad = (n) => String(n).padStart(2, '0');
    const tick = () => {
      const left = end - Date.now();
      if (left <= 0) { el.hidden = true; return clearInterval(t); }
      const s = Math.floor(left / 1000);
      $('[data-d]', el).textContent = pad(Math.floor(s / 86400));
      $('[data-h]', el).textContent = pad(Math.floor(s / 3600) % 24);
      $('[data-m]', el).textContent = pad(Math.floor(s / 60) % 60);
      $('[data-s]', el).textContent = pad(s % 60);
    };
    const t = setInterval(tick, 1000); tick();
  });
  document.addEventListener('click', async (e) => {
    const b = e.target.closest('[data-copy]');
    if (!b) return;
    try { await navigator.clipboard.writeText(b.dataset.copy); } catch (_) {}
    const l = $('[data-copy-label]', b); l.textContent = 'Copied'; setTimeout(() => (l.textContent = 'Copy'), 1800);
  });

  /* ---------- Click-to-play videos ---------- */
  document.addEventListener('click', (e) => {
    const box = e.target.closest('[data-play]');
    if (!box) return;
    const v = $('video', box);
    $$('[data-play] video').forEach((o) => { if (o !== v) { o.pause(); o.closest('[data-play]').classList.remove('is-playing'); } });
    if (v.paused) { v.muted = false; v.play().catch(() => { v.muted = true; v.play(); }); box.classList.add('is-playing'); }
    else { v.pause(); box.classList.remove('is-playing'); }
  });

  /* ---------- Trustpilot grid: Read more only when clamped ---------- */
  $$('[data-tp-grid] .tp-card').forEach((card) => {
    const txt = $('.tp-card__text', card), more = $('[data-tp-more]', card);
    if (more && txt.scrollHeight > txt.clientHeight + 2) {
      more.hidden = false;
      more.addEventListener('click', () => { card.classList.toggle('is-open'); more.textContent = card.classList.contains('is-open') ? 'Show less' : 'Read more'; });
    }
  });

  /* ---------- Localization dropdowns: close on outside click / Esc ---------- */
  document.addEventListener('click', (e) => $$('[data-loc][open]').forEach((d) => !d.contains(e.target) && d.removeAttribute('open')));
  document.addEventListener('keydown', (e) => e.key === 'Escape' && $$('[data-loc][open]').forEach((d) => d.removeAttribute('open')));

  /* ---------- Mega menu: close after clicking a link (hover stays open otherwise) ---------- */
  $$('[data-mega] .mega a').forEach((a) => a.addEventListener('click', () => document.activeElement.blur()));

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
  // Rotation only after tapping "Rotate 3D"; otherwise the model would swallow gallery swipes on mobile.
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-model-toggle]'); if (!btn) return;
    const mv = btn.parentElement.querySelector('model-viewer'); const on = btn.getAttribute('aria-pressed') !== 'true';
    mv.toggleAttribute('camera-controls', on); if (on) mv.removeAttribute('auto-rotate'); else mv.setAttribute('auto-rotate', '');
    btn.setAttribute('aria-pressed', on); btn.querySelector('[data-on]').hidden = on; btn.querySelector('[data-off]').hidden = !on;
    btn.closest('.pdp__slide').classList.toggle('is-rotating', on);
  });
  if ($('model-viewer')) {
    const fallback = () => customElements.get('model-viewer') || import('https://ajax.googleapis.com/ajax/libs/model-viewer/4.0.0/model-viewer.min.js');
    if (window.Shopify && Shopify.loadFeatures) Shopify.loadFeatures([{ name: 'model-viewer-ui', version: '1.0', onLoad: fallback }]);
    else fallback();
  }

  /* ---------- Drag-to-rotate: 3D turn through the product photos ---------- */
  $$('[data-spin]').forEach((el) => {
    const img = $('img', el), srcs = el.dataset.images.split('|');
    srcs.forEach((s) => { const i = new Image(); i.src = s; });
    let i = 0, x0 = null, busy = false;
    const set = (deg, t = '') => { img.style.transition = t; img.style.transform = `rotateY(${deg}deg) scale(${1 - Math.abs(deg) / 900})`; el.style.setProperty('--shine', Math.min(Math.abs(deg) / 60, 0.5)); };
    const turn = (dir) => {
      busy = true;
      set(-90 * dir, 'transform .28s ease-in');
      setTimeout(() => {
        i = (i + dir + srcs.length) % srcs.length;
        img.removeAttribute('srcset'); img.src = srcs[i];
        set(90 * dir);
        requestAnimationFrame(() => requestAnimationFrame(() => { set(0, 'transform .45s cubic-bezier(.16,1,.3,1)'); setTimeout(() => (busy = false), 450); }));
      }, 280);
    };
    el.addEventListener('pointerdown', (e) => { if (busy) return; x0 = e.clientX; el.setPointerCapture(e.pointerId); });
    el.addEventListener('pointermove', (e) => { if (x0 === null) return; set(Math.max(-70, Math.min(70, ((e.clientX - x0) / el.clientWidth) * 140))); });
    const end = (e) => {
      if (x0 === null) return;
      const dx = (e.clientX - x0) / el.clientWidth; x0 = null;
      Math.abs(dx) > 0.18 ? turn(dx < 0 ? 1 : -1) : set(0, 'transform .45s cubic-bezier(.16,1,.3,1)');
    };
    el.addEventListener('pointerup', end); el.addEventListener('pointercancel', end);
  });

  /* ---------- Help centre: topics, search, view toggle, prefilled subject ---------- */
  const help = $('[data-help]');
  if (help) {
    const topicsWrap = $('[data-help-topics]', help), groups = $$('[data-faq-group]', help), empty = $('[data-help-empty]', help);
    const showTopics = () => { topicsWrap.hidden = false; groups.forEach((g) => { g.hidden = true; g.classList.remove('help-faq--search'); $('[data-help-back]', g).hidden = false; $('.h2', g).hidden = false; $$('[data-faq]', g).forEach((d) => (d.hidden = false)); }); empty.hidden = true; };
    $$('[data-topic]', help).forEach((t) => t.addEventListener('click', () => {
      topicsWrap.hidden = true; groups.forEach((g) => (g.hidden = g.dataset.faqGroup !== t.dataset.topic));
      $('#topic-' + t.dataset.topic).scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    }));
    $$('[data-help-back]', help).forEach((b) => b.addEventListener('click', showTopics));
    $$('[data-view]', help).forEach((b) => b.addEventListener('click', () => {
      $$('[data-view]', help).forEach((x) => x.classList.toggle('is-active', x === b));
      $('[data-view-target]', help).classList.toggle('is-list', b.dataset.view === 'list');
    }));
    $('[data-help-search]', help).addEventListener('input', (e) => {
      const q = e.target.value.trim().toLowerCase();
      if (q.length < 2) return showTopics();
      topicsWrap.hidden = true; let hits = 0;
      groups.forEach((g) => {
        let n = 0;
        $$('[data-faq]', g).forEach((d) => { const m = d.textContent.toLowerCase().includes(q); d.hidden = !m; if (m) n++; });
        g.hidden = n === 0; g.classList.add('help-faq--search'); $('[data-help-back]', g).hidden = true; hits += n;
      });
      empty.hidden = hits > 0;
    });
  }

  /* ---------- Contact form page: subject from ?subject= or quick action ---------- */
  const subj = $('[data-cform-subject]');
  if (subj) {
    const q = new URLSearchParams(location.search).get('subject');
    if (q) subj.value = q;
    $$('.cform-page [data-subject]').forEach((a) => a.addEventListener('click', (e) => {
      if (a.getAttribute('href') !== '#cform') return;
      e.preventDefault(); subj.value = a.dataset.subject;
      $('#cform').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' }); $('#cf-name').focus({ preventScroll: true });
    }));
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

// Footer columns: open on desktop, accordion on mobile
if (matchMedia('(max-width: 989px)').matches) document.querySelectorAll('[data-footer-col]').forEach((d) => d.removeAttribute('open'));

// PDP quick questions: show the matching answer as a chat bubble
document.addEventListener('click', (e) => {
  const chip = e.target.closest('[data-ask-q]'); if (!chip) return;
  const box = chip.closest('[data-ask]'); const open = chip.getAttribute('aria-expanded') !== 'true';
  box.querySelectorAll('[data-ask-q]').forEach((c) => c.setAttribute('aria-expanded', 'false'));
  box.querySelectorAll('[data-ask-a]').forEach((a) => { a.hidden = !(open && a.dataset.askA === chip.dataset.askQ); });
  chip.setAttribute('aria-expanded', open);
});
// "Ask us anything" on the product page prefills the contact form
{
  const q = new URLSearchParams(location.search); const body = document.querySelector('textarea[name="contact[body]"]');
  if (body && q.get('q') && !body.value) body.value = (q.get('product') ? `About ${q.get('product')}: ` : '') + q.get('q');
}

// Mobile reviews: turn grid/strip into a seamless, non-pausing marquee
if (matchMedia('(max-width: 749px)').matches) {
  document.querySelectorAll('[data-tp-grid], .tp-track').forEach((box) => {
    const cards = [...box.children]; if (cards.length < 2) return;
    const inner = document.createElement('div'); inner.className = 'tp-marquee__inner';
    cards.forEach((c) => inner.append(c));
    cards.forEach((c) => { const d = c.cloneNode(true); d.setAttribute('aria-hidden', 'true'); d.querySelectorAll('a,button').forEach((x) => x.tabIndex = -1); inner.append(d); });
    inner.style.setProperty('--tp-dur', cards.length * 6 + 's');
    box.removeAttribute('data-carousel'); box.removeAttribute('data-autoplay'); box.classList.add('tp-marquee'); box.append(inner);
  });
}
