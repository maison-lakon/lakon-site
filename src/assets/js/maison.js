// LAKON — haute maison behaviours: layers that never leave the page (menu, search,
// account, bag, appointment), the menu that dims all but the hovered entry, instant
// search, the film that slides aside on scroll, the slow zoom-out photograph, the media
// pause control and the high-contrast switch.
import { cart, store } from './store.js';
import { FAMILY_WORDS, fold, loadCatalogue } from './recommend.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- Layers ---------- */
let lastOpener = null;
export function openLayer(id, opener) {
  const layer = document.getElementById(id);
  if (!layer || layer.open) return;
  $$('dialog.layer[open]').forEach((d) => closeLayer(d));
  document.getElementById('concierge')?.open && document.getElementById('concierge').close();
  lastOpener = opener || document.activeElement;
  layer.showModal();
  document.documentElement.classList.add('has-layer');
  $$(`[data-open="${id}"]`).forEach((b) => b.setAttribute('aria-expanded', 'true'));
  layer.dispatchEvent(new CustomEvent('layer:open'));
  // Tabs inside a hidden layer measured zero width at load; let them re-measure now.
  requestAnimationFrame(() => dispatchEvent(new Event('resize')));
}
function closeLayer(layer) {
  if (!layer?.open) return;
  layer.close();
}
function layers() {
  document.addEventListener('click', (e) => {
    const opener = e.target.closest?.('[data-open]');
    if (opener) { e.preventDefault(); openLayer(opener.dataset.open, opener); return; }
    const closer = e.target.closest?.('[data-close]');
    if (closer) { closeLayer(closer.closest('dialog')); return; }
    const inLayer = e.target.closest?.('dialog.layer');
    if (inLayer && e.target.closest('[data-concierge-open]')) closeLayer(inLayer);
  });
  for (const layer of $$('dialog.layer')) {
    // Click on the backdrop (the dialog itself, outside its panel) closes it.
    layer.addEventListener('click', (e) => { if (e.target === layer) closeLayer(layer); });
    layer.addEventListener('close', () => {
      if (!$$('dialog.layer[open]').length) document.documentElement.classList.remove('has-layer');
      $$(`[data-open="${layer.id}"]`).forEach((b) => b.setAttribute('aria-expanded', 'false'));
      if (lastOpener && document.contains(lastOpener)) lastOpener.focus();
    });
  }
}

/* ---------- Menu: hovered entry stands out, its sub-sections open beside it ---------- */
function menu() {
  const m = document.getElementById('menu');
  if (!m) return;
  const items = $$('.menu__item', m);
  const groups = $$('.menu__group', m);
  const activate = (item) => {
    items.forEach((i) => i.classList.toggle('is-active', i === item));
    groups.forEach((g) => g.classList.toggle('is-on', g.dataset.group === item.dataset.sub));
  };
  for (const item of items) {
    item.addEventListener('mouseenter', () => activate(item));
    item.addEventListener('focusin', () => activate(item));
  }
  m.addEventListener('layer:open', () => activate(items[0]));
}

/* ---------- Instant search ---------- */
async function search() {
  const layer = document.getElementById('search');
  if (!layer) return;
  const input = $('[data-search-input]', layer);
  const results = $('[data-search-results]', layer);
  const label = $('[data-search-label]', layer);
  layer.addEventListener('layer:open', () => requestAnimationFrame(() => input.focus()));
  const { products, families } = await loadCatalogue();
  const index = products.map((p) => ({ p, text: fold([p.name, p.universe, p.motto, p.story, ...p.families.map((f) => families[f]), ...p.notes.top, ...p.notes.heart, ...p.notes.base, p.gender].join(' ')) }));
  const render = (q) => {
    const words = fold(q).split(/\s+/).filter((w) => w.length > 1);
    let hits = index;
    if (words.length) {
      hits = index.map(({ p, text }) => {
        let score = 0;
        for (const w of words) {
          if (text.includes(w)) score += 2;
          for (const [f, list] of Object.entries(FAMILY_WORDS)) if (list.some((x) => x.startsWith(w) || w.startsWith(x)) && p.families.includes(f)) score += 1;
        }
        return { p, score };
      }).filter((h) => h.score > 0).sort((a, b) => b.score - a.score);
    }
    label.textContent = words.length ? `${hits.length} création${hits.length > 1 ? 's' : ''}` : 'Créations';
    results.innerHTML = hits.length
      ? hits.map(({ p }) => `<li><a href="/parfums/${p.slug}"><span class="search__thumb" style="--tone:${p.tone}"></span><span><strong>${p.name}</strong><small>${p.families.map((f) => families[f]).join(' · ')} · ${p.motto}</small></span></a></li>`).join('')
      : '<li class="small">Aucune création ne correspond. <button type="button" class="link-inline" data-concierge-open>Demander au concierge</button></li>';
  };
  input.addEventListener('input', () => render(input.value));
  $$('[data-q]', layer).forEach((b) => b.addEventListener('click', () => { input.value = b.dataset.q; render(input.value); input.focus(); }));
  $('[data-search-form]', layer).addEventListener('submit', (e) => {
    e.preventDefault();
    const first = $('a', results);
    if (first) location.href = first.href;
  });
  render('');
}

/* ---------- Bag drawer ---------- */
async function bag() {
  const layer = document.getElementById('bag');
  if (!layer) return;
  const { products, locale, currency } = await loadCatalogue();
  const money = (v) => new Intl.NumberFormat(locale, { style: 'currency', currency }).format(v);
  const host = $('[data-bag-lines]', layer);
  const render = () => {
    const lines = cart.lines().map((l) => ({ ...l, p: products.find((x) => x.slug === l.slug) })).filter((l) => l.p);
    $('[data-bag-empty]', layer).hidden = lines.length > 0;
    host.innerHTML = lines.map(({ p, qty }) => `<li class="cart-line"><div class="card__media" style="--tone:${p.tone}"></div><div><p class="display-s" style="font-size:1.3rem">${p.name}</p><p class="small">${p.status === 'disponible' && p.price != null ? money(p.price) : 'Prix communiqué au lancement'}</p></div><div class="qty"><button type="button" data-bag-qty="${p.slug}" data-delta="-1" aria-label="Retirer un ${p.name}">-</button><output>${qty}</output><button type="button" data-bag-qty="${p.slug}" data-delta="1" aria-label="Ajouter un ${p.name}">+</button></div></li>`).join('');
    $('[data-bag-total]', layer).textContent = lines.length && lines.every(({ p }) => p.status === 'disponible' && p.price != null) ? money(lines.reduce((s, l) => s + l.p.price * l.qty, 0)) : 'À communiquer';
  };
  host.addEventListener('click', (e) => {
    const b = e.target.closest('[data-bag-qty]');
    if (!b) return;
    const line = cart.lines().find((l) => l.slug === b.dataset.bagQty);
    cart.setQty(b.dataset.bagQty, (line?.qty || 0) + Number(b.dataset.delta));
  });
  store.on(render);
  layer.addEventListener('layer:open', render);
  render();
}

/* ---------- Scroll scenes ---------- */
function progressOf(el) {
  const r = el.getBoundingClientRect();
  const total = r.height - innerHeight;
  return total > 0 ? Math.min(1, Math.max(0, -r.top / total)) : 0;
}
const ease = (t) => 1 - Math.pow(1 - t, 3);
function scenes() {
  const stage = $('[data-stage]');
  const zoom = $('[data-zoomout]');
  if (!stage && !zoom) return;
  const wide = matchMedia('(min-width: 900px)');
  let frame = 0;
  const update = () => {
    frame = 0;
    if (stage) {
      if (wide.matches && !reduced) {
        const e = ease(Math.min(1, progressOf(stage) / 0.75));
        stage.style.setProperty('--e', e.toFixed(4));
        stage.classList.toggle('is-side', e > 0.4);
      } else {
        stage.style.setProperty('--e', '0');
        stage.classList.add('is-side');
      }
    }
    if (zoom && !reduced) zoom.style.setProperty('--z', progressOf(zoom).toFixed(4));
  };
  const request = () => { if (!frame) frame = requestAnimationFrame(update); };
  addEventListener('scroll', request, { passive: true });
  addEventListener('resize', request);
  wide.addEventListener?.('change', request);
  update();
}

/* ---------- Media pause / play (WCAG 2.2.2) ---------- */
function mediaControls() {
  for (const btn of $$('[data-media-toggle]')) {
    const box = btn.closest('.stage__media') || btn.parentElement.parentElement;
    const video = $('video', box);
    const sceneEl = $('.scene', box);
    const caption = $('[data-media-caption]', box);
    if (video && caption) caption.textContent = '';
    if (reduced) { video?.pause(); sceneEl?.classList.add('is-paused'); btn.setAttribute('aria-pressed', 'true'); btn.setAttribute('aria-label', 'Lire'); }
    btn.addEventListener('click', () => {
      const paused = btn.getAttribute('aria-pressed') === 'true';
      if (paused) { video?.play(); sceneEl?.classList.remove('is-paused'); } else { video?.pause(); sceneEl?.classList.add('is-paused'); }
      btn.setAttribute('aria-pressed', String(!paused));
      btn.setAttribute('aria-label', paused ? 'Mettre en pause' : 'Lire');
    });
  }
  // Videos play only while visible, to save battery and bandwidth.
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => entries.forEach(({ target, isIntersecting }) => {
      const btn = target.closest('.stage__media')?.querySelector('[data-media-toggle]');
      if (btn?.getAttribute('aria-pressed') === 'true' || reduced) return;
      if (isIntersecting) target.play?.().catch(() => {}); else target.pause?.();
    }), { threshold: 0.1 });
    $$('video[data-video]').forEach((v) => io.observe(v));
  }
}

/* ---------- High-contrast switch ---------- */
function contrast() {
  const on = store.get('contrast', false);
  document.documentElement.classList.toggle('contrast', on);
  $$('[data-contrast]').forEach((c) => {
    c.checked = on;
    c.addEventListener('change', () => { store.set('contrast', c.checked); document.documentElement.classList.toggle('contrast', c.checked); });
  });
}

export function initMaison() {
  layers();
  menu();
  search();
  bag();
  scenes();
  mediaControls();
  contrast();
  if (location.hash === '#compte') openLayer('account');
}
