// LAKON — site behaviour. Progressive enhancement: every page reads complete without it.
import { cart, favs, store } from './store.js';
import { loadCatalogue, recommend } from './recommend.js';
import { initConcierge } from './concierge.js';
import { initDiagnostic, renderProfile } from './diagnostic.js';
import { initMaison, openLayer } from './maison.js';

const root = document.documentElement;
root.classList.add('js');
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const fine = matchMedia('(pointer: fine)').matches;
const $ = (sel, scope = document) => scope.querySelector(sel);
const $$ = (sel, scope = document) => [...scope.querySelectorAll(sel)];
let sitePromise;
const site = () => (sitePromise ??= fetch('/data/site.json').then((r) => r.json()));

/* ---------- Opening (once per visit) ---------- */
function intro() {
  if (reduced) return;
  try { if (sessionStorage.getItem('lakon:intro')) return; sessionStorage.setItem('lakon:intro', '1'); } catch { return; }
  const brand = $('.wordmark')?.textContent.trim() || '';
  const el = document.createElement('div');
  el.className = 'intro';
  el.setAttribute('aria-hidden', 'true');
  el.innerHTML = `<p class="intro__name">${[...brand].map((c, i) => `<span style="--i:${i}">${c}</span>`).join('')}</p><div class="intro__rule"></div><p class="intro__motto"></p>`;
  el.querySelector('.intro__motto').textContent = $('.footer .display-s')?.textContent || '';
  document.body.append(el);
  const leave = () => { el.classList.add('is-leaving'); setTimeout(() => el.remove(), 1200); };
  setTimeout(leave, 2500);
  el.addEventListener('click', leave, { once: true });
  addEventListener('keydown', leave, { once: true });
}

/* ---------- Announcement bar ---------- */
function announcements() {
  const items = $$('.announce > p');
  if (!items.length) return;
  let i = 0;
  items[0].classList.add('is-on');
  if (items.length < 2 || reduced) return;
  setInterval(() => {
    if (document.hidden) return;
    items[i].classList.remove('is-on');
    i = (i + 1) % items.length;
    items[i].classList.add('is-on');
  }, 5000);
}

/* ---------- Mobile drawer ---------- */
function drawer() {
  const d = $('[data-drawer]');
  if (!d) return;
  const opener = $('[data-drawer-open]');
  const open = () => { d.classList.add('is-open'); d.setAttribute('aria-hidden', 'false'); opener?.setAttribute('aria-expanded', 'true'); $('summary', d)?.focus(); document.body.style.overflow = 'hidden'; };
  const close = () => { d.classList.remove('is-open'); d.setAttribute('aria-hidden', 'true'); opener?.setAttribute('aria-expanded', 'false'); document.body.style.overflow = ''; opener?.focus(); };
  opener?.addEventListener('click', open);
  $('[data-drawer-close]', d)?.addEventListener('click', close);
  d.addEventListener('click', (e) => { if (e.target === d) close(); });
  d.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
  $$('a', d).forEach((a) => a.addEventListener('click', () => { if (a.hasAttribute('data-concierge-open')) close(); }));
}

/* ---------- Current page in the main nav ---------- */
function currentNav() {
  const here = location.pathname.replace(/\.html$/, '').replace(/\/$/, '') || '/';
  for (const a of $$('.nav__trigger')) {
    const path = new URL(a.href).pathname;
    if (path !== '/' && (here === path || here.startsWith(`${path}/`))) a.setAttribute('aria-current', 'page');
  }
}

/* ---------- Scroll choreography ---------- */
function motion() {
  for (const el of $$('.words')) {
    const text = el.textContent.trim();
    const html = el.innerHTML;
    if ([...el.children].some((c) => c.tagName !== 'EM')) continue;
    el.setAttribute('aria-label', text);
    const parts = html.split(/(\s+)/);
    let w = 0;
    el.innerHTML = parts.map((part) => (/^\s+$/.test(part) || !part ? part : `<span class="w" aria-hidden="true"><span style="--w:${w++}">${part}</span></span>`)).join('');
  }
  if (!('IntersectionObserver' in window)) { $$('.reveal, .unfold, .words').forEach((el) => el.classList.add('is-in')); return; }
  const io = new IntersectionObserver((entries) => {
    for (const entry of entries) if (entry.isIntersecting) { entry.target.classList.add('is-in'); io.unobserve(entry.target); }
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
  $$('.reveal, .unfold, .words').forEach((el) => io.observe(el));

  if (reduced) return;
  const bar = document.createElement('div');
  bar.className = 'progress';
  bar.setAttribute('aria-hidden', 'true');
  document.body.append(bar);
  let frame = 0;
  addEventListener('scroll', () => {
    if (frame) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      const max = root.scrollHeight - innerHeight;
      bar.style.setProperty('--p', max > 0 ? (scrollY / max).toFixed(4) : '0');
    });
  }, { passive: true });

  if (!fine) return;
  const glow = document.createElement('div');
  glow.className = 'cursor-glow';
  glow.setAttribute('aria-hidden', 'true');
  document.body.prepend(glow);
  let x = -999, y = -999, gx = x, gy = y, raf = 0;
  const tick = () => {
    gx += (x - gx) * 0.12; gy += (y - gy) * 0.12;
    glow.style.setProperty('--cx', `${gx.toFixed(1)}px`);
    glow.style.setProperty('--cy', `${gy.toFixed(1)}px`);
    raf = Math.abs(x - gx) + Math.abs(y - gy) > 0.5 ? requestAnimationFrame(tick) : 0;
  };
  addEventListener('pointermove', (e) => { x = e.clientX; y = e.clientY; if (!raf) raf = requestAnimationFrame(tick); }, { passive: true });
}

/* ---------- Favourites ---------- */
function syncFavs() {
  for (const b of $$('[data-fav]')) b.setAttribute('aria-pressed', String(favs.has(b.dataset.fav)));
  const n = favs.all().length;
  $$('[data-fav-count]').forEach((c) => { c.textContent = n ? String(n) : ''; });
}
function favourites() {
  document.addEventListener('click', (e) => {
    const b = e.target.closest?.('[data-fav]');
    if (!b) return;
    e.preventDefault();
    favs.toggle(b.dataset.fav);
    syncFavs();
  });
  syncFavs();
}

/* ---------- Cart ---------- */
function syncCartCount() {
  const n = cart.count();
  $$('[data-cart-count]').forEach((c) => { c.textContent = n ? String(n) : ''; });
}
async function cartPage() {
  const host = $('[data-cart-lines]');
  if (!host) return;
  const { products, locale, currency } = await loadCatalogue();
  const money = (v) => new Intl.NumberFormat(locale, { style: 'currency', currency }).format(v);
  const render = () => {
    const lines = cart.lines().map((l) => ({ ...l, product: products.find((p) => p.slug === l.slug) })).filter((l) => l.product);
    $('[data-cart-empty]').hidden = lines.length > 0;
    host.innerHTML = lines.map(({ product, qty }) => `
      <li class="cart-line">
        <div class="card__media" style="--tone:${product.tone}"></div>
        <div><p class="eyebrow">${product.numeral}</p><p class="display-s">${product.name}</p><p class="small">${product.status === 'disponible' && product.price != null ? money(product.price) : 'Prix communiqué au lancement'}</p></div>
        <div class="qty"><button type="button" data-qty="${product.slug}" data-delta="-1" aria-label="Retirer un ${product.name}">−</button><output>${qty}</output><button type="button" data-qty="${product.slug}" data-delta="1" aria-label="Ajouter un ${product.name}">+</button></div>
      </li>`).join('');
    const priced = lines.every(({ product }) => product.status === 'disponible' && product.price != null);
    const total = lines.reduce((s, l) => s + (l.product.price || 0) * l.qty, 0);
    $('[data-cart-total]').textContent = lines.length ? (priced ? money(total) : 'À communiquer') : '-';
    syncCartCount();
  };
  host.addEventListener('click', (e) => {
    const b = e.target.closest('[data-qty]');
    if (!b) return;
    const line = cart.lines().find((l) => l.slug === b.dataset.qty);
    cart.setQty(b.dataset.qty, (line?.qty || 0) + Number(b.dataset.delta));
    render();
  });
  $('[data-checkout]')?.addEventListener('click', (e) => e.preventDefault());
  const gift = $('[data-gift-message]');
  if (gift) { gift.value = store.get('gift', ''); gift.addEventListener('input', () => store.set('gift', gift.value)); }
  render();
}
function cartButtons() {
  document.addEventListener('click', async (e) => {
    const add = e.target.closest?.('[data-add-to-cart]');
    if (add) { cart.add(add.dataset.addToCart); syncCartCount(); openLayer('bag', add); return; }
    const notify = e.target.closest?.('[data-notify]');
    if (notify) {
      const status = $('[data-notify-status]');
      const { contactEmail, brand } = await site();
      if (contactEmail) {
        location.href = `mailto:${contactEmail}?subject=${encodeURIComponent(`Lancement ${notify.dataset.notify} — ${brand}`)}&body=${encodeURIComponent('Merci de me prévenir du lancement de cette création.')}`;
      } else if (status) {
        status.textContent = 'Les inscriptions au lancement ouvriront très bientôt. Ajoutez cette création à vos favoris pour la retrouver.';
      }
    }
  });
  syncCartCount();
}

/* ---------- Forms: open the visitor's mail app, never send silently ---------- */
function mailForms() {
  for (const form of $$('[data-mail-form]')) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!form.reportValidity()) return;
      const key = form.dataset.mailForm;
      const status = $(`[data-form-status="${key}"]`);
      const { contactEmail, brand } = await site();
      if (!contactEmail) {
        if (status) status.textContent = 'Les demandes en ligne ouvriront avec la boutique : votre message n’a pas été envoyé.';
        return;
      }
      const body = [...new FormData(form)].map(([k, v]) => `${k} : ${v}`).join('\n');
      location.href = `mailto:${contactEmail}?subject=${encodeURIComponent(`${brand} — ${key}`)}&body=${encodeURIComponent(body)}`;
      if (status) status.textContent = 'Votre messagerie s’ouvre avec le message prêt à envoyer.';
    });
  }
}

/* ---------- Tabs ---------- */
function tabs() {
  for (const wrap of $$('[data-tabs]')) {
    const list = $('[role="tablist"]', wrap);
    const all = $$('[role="tab"]', list);
    const ink = document.createElement('span');
    ink.className = 'tabs__ink';
    list.append(ink);
    const select = (tab, focus) => {
      for (const t of all) {
        const on = t === tab;
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
        document.getElementById(t.getAttribute('aria-controls')).hidden = !on;
      }
      ink.style.setProperty('--x', `${tab.offsetLeft}px`);
      ink.style.setProperty('--w', `${tab.offsetWidth}px`);
      if (focus) tab.focus();
    };
    list.addEventListener('click', (e) => { const t = e.target.closest('[role="tab"]'); if (t) select(t); });
    list.addEventListener('keydown', (e) => {
      const i = all.indexOf(document.activeElement);
      if (i < 0) return;
      const next = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: all.length - 1 }[e.key];
      if (next === undefined) return;
      e.preventDefault();
      select(all[(next + all.length) % all.length], true);
    });
    select(all.find((t) => t.getAttribute('aria-selected') === 'true') || all[0]);
    addEventListener('resize', () => select(all.find((t) => t.getAttribute('aria-selected') === 'true')));
  }
}

/* ---------- Catalogue filters ---------- */
function catalogueFilters() {
  const grid = $('[data-catalogue]');
  if (!grid) return;
  const cards = $$('.card', grid);
  const params = new URL(location.href).searchParams;
  const state = { family: 'all', gender: params.get('genre') || 'all', sort: 'maison' };
  const count = $('[data-results-count]');
  const apply = () => {
    let shown = 0;
    for (const c of cards) {
      const ok = (state.family === 'all' || c.dataset.families.split(' ').includes(state.family)) && (state.gender === 'all' || c.dataset.gender === state.gender);
      c.hidden = !ok;
      if (ok) shown += 1;
    }
    const sorted = [...cards].sort((a, b) => state.sort === 'maison' ? 0 : (state.sort === 'intensite-asc' ? 1 : -1) * (a.dataset.intensity - b.dataset.intensity));
    if (state.sort === 'maison') cards.forEach((c) => grid.append(c)); else sorted.forEach((c) => grid.append(c));
    $$('[data-filter-family]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.filterFamily === state.family)));
    $$('[data-filter-gender]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.filterGender === state.gender)));
    if (count) count.textContent = `${shown} création${shown > 1 ? 's' : ''}`;
    $('[data-empty]').hidden = shown > 0;
  };
  document.addEventListener('click', (e) => {
    const f = e.target.closest?.('[data-filter-family]');
    if (f) { state.family = f.dataset.filterFamily; apply(); }
    const g = e.target.closest?.('[data-filter-gender]');
    if (g) { state.gender = g.dataset.filterGender; apply(); }
  });
  $('[data-sort]')?.addEventListener('change', (e) => { state.sort = e.target.value; apply(); });
  apply();
}

/* ---------- Pieces filters ---------- */
function piecesFilters() {
  const host = $('[data-pieces]');
  if (!host) return;
  $('[data-piece-filters]').addEventListener('click', (e) => {
    const b = e.target.closest('[data-piece]');
    if (!b) return;
    const v = b.dataset.piece;
    $$('[data-piece-filters] [data-piece]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    $$('[data-piece]', host).forEach((c) => { c.hidden = v !== 'all' && c.dataset.piece !== v; });
  });
}

/* ---------- Box builder ---------- */
async function boxBuilder() {
  const form = $('[data-box-builder]');
  if (!form) return;
  const { products } = await loadCatalogue();
  const host = $('[data-box-products]', form);
  host.innerHTML = products.map((p) => `<label class="option"><input type="checkbox" name="parfum" value="${p.slug}"><strong>${p.numeral} · ${p.name}</strong><span>${p.motto}</span></label>`).join('');
  const preview = $('[data-box-preview]', form);
  const summary = $('[data-box-summary]', form);
  const info = $('[data-slot-info]', form);
  const update = () => {
    const type = form.querySelector('[name="type"]:checked');
    const slots = Number(type.dataset.slots);
    const chosen = $$('[name="parfum"]:checked', form);
    if (chosen.length > slots) chosen.slice(slots).forEach((c) => { c.checked = false; });
    const picked = $$('[name="parfum"]:checked', form).map((c) => products.find((p) => p.slug === c.value));
    $$('[name="parfum"]', form).forEach((c) => { c.disabled = !c.checked && picked.length >= slots; });
    info.textContent = `${picked.length} / ${slots}`;
    preview.innerHTML = Array.from({ length: slots }, (_, i) => picked[i] ? `<i style="--tone:${picked[i].tone}"></i>` : '<i class="empty"></i>').join('');
    const presentation = form.querySelector('[name="presentation"]:checked').value;
    summary.innerHTML = `<li>Coffret : ${type.value}</li><li>Créations : ${picked.map((p) => p.name).join(', ') || '—'}</li><li>Présentation : ${presentation}</li>`;
  };
  form.addEventListener('change', update);
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const status = $('[data-form-status="box"]');
    const { contactEmail, brand } = await site();
    const picked = $$('[name="parfum"]:checked', form).map((c) => c.value);
    if (!picked.length) { status.textContent = 'Choisissez au moins une création.'; return; }
    if (!contactEmail) { status.textContent = 'Les demandes d’écrins ouvriront avec la boutique : votre composition est enregistrée sur cet appareil.'; store.set('box', Object.fromEntries(new FormData(form))); return; }
    const body = summary.innerText + `\nMessage : ${form.message.value}`;
    location.href = `mailto:${contactEmail}?subject=${encodeURIComponent(`${brand} — écrin`)}&body=${encodeURIComponent(body)}`;
  });
  update();
}

/* ---------- Account (local) ---------- */
async function account() {
  const passHost = $('[data-passport-view]');
  if (!passHost) return;
  const { products, families } = await loadCatalogue();
  const passport = store.get('passport');
  if (passport) {
    renderProfile(passHost, passport, recommend(products, families, passport), families);
  } else {
    passHost.innerHTML = '<p class="lead">Vous n’avez pas encore de passeport.</p><a class="btn btn--solid" href="/diagnostic">Faire le diagnostic</a>';
  }
  const favHost = $('[data-fav-list]');
  const renderFavs = () => {
    const list = favs.all().map((s) => products.find((p) => p.slug === s)).filter(Boolean);
    $('[data-fav-empty]').hidden = list.length > 0;
    favHost.innerHTML = list.map((p) => `<li class="card"><a class="card__link" href="/parfums/${p.slug}"><div class="card__media" style="--tone:${p.tone}"></div><div class="card__body"><p class="eyebrow">${p.numeral}</p><h3 class="card__title">${p.name}</h3><p class="card__motto">${p.motto}</p></div></a><button class="fav" type="button" data-fav="${p.slug}" aria-pressed="true" aria-label="Retirer ${p.name} des favoris"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/></svg></button></li>`).join('');
  };
  store.on(renderFavs);
  renderFavs();
  $('[data-clear-local]')?.addEventListener('click', () => { store.clear(); location.reload(); });
}

intro();
announcements();
drawer();
currentNav();
motion();
favourites();
cartButtons();
mailForms();
tabs();
catalogueFilters();
piecesFilters();
boxBuilder();
cartPage();
account();
initDiagnostic(document);
initConcierge();
initMaison();
store.on(syncCartCount);
