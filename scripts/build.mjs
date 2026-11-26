// LAKON — site builder (no dependencies).
// Reads data/site.json and data/catalogue.json, wraps every page of src/pages in the
// shared layout (head, header, footer, concierge), renders the catalogue-driven parts
// (product grids, universes, one page per fragrance) and writes the result to dist/.
// The brand name lives in data/site.json only: every {{brand}} token is replaced here.
import { cp, mkdir, readFile, readdir, rename, rm, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const src = resolve(root, 'src');
const final = resolve(root, 'dist');
// Built in a scratch folder, then swapped in at once, so the preview never serves a half-built site.
const out = resolve(root, '.dist-build');

const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

export async function build() {
  const site = JSON.parse(await readFile(resolve(root, 'data/site.json'), 'utf8'));
  const catalogue = JSON.parse(await readFile(resolve(root, 'data/catalogue.json'), 'utf8'));
  const partial = async (name) => readFile(resolve(src, 'partials', `${name}.html`), 'utf8');
  const [header, footer, concierge, overlays] = await Promise.all(['header', 'footer', 'concierge', 'overlays'].map(partial));
  const families = catalogue.families;
  const products = catalogue.products;

  const money = (amount) => new Intl.NumberFormat(site.locale, { style: 'currency', currency: site.currency }).format(amount);
  const priceLabel = (p) => (p.status === 'disponible' && p.price != null ? money(p.price) : 'Prix communiqué au lancement');
  // Short form for cards and lists; the product page keeps the full sentence.
  const priceShort = (p) => (p.status === 'disponible' && p.price != null ? money(p.price) : 'Lancement à venir');
  const statusLabel = (p) => ({ 'disponible': 'Disponible', 'en-creation': 'En création', 'epuise': 'Épuisé' })[p.status] || 'En création';

  // Concept bottle: thick glass, heavy base, architectural cap. Drawn, and labelled as a concept.
  // Concept bottle, drawn as a real object: thick bevelled glass, a heavy base, the juice set
  // inside the glass wall, two vertical reflections, a brushed-gold cap on a black collar and a
  // small engraved plate. Labelled as a concept for assistive technology.
  const flacon = (p, size = 'md') => {
    const id = `${p.slug}-${size}`;
    return `
    <svg class="flacon flacon--${size}" viewBox="0 0 240 340" role="img" aria-label="Visuel conceptuel du flacon ${esc(p.name)}">
      <defs>
        <linearGradient id="glass-${id}" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stop-color="#ffffff" stop-opacity=".10"/>
          <stop offset=".12" stop-color="#ffffff" stop-opacity=".02"/>
          <stop offset=".88" stop-color="#000000" stop-opacity=".18"/>
          <stop offset="1" stop-color="#000000" stop-opacity=".35"/>
        </linearGradient>
        <linearGradient id="juice-${id}" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="${p.tone}" stop-opacity=".78"/>
          <stop offset=".55" stop-color="${p.tone}"/>
          <stop offset="1" stop-color="#050505"/>
        </linearGradient>
        <linearGradient id="juiceside-${id}" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stop-color="#000" stop-opacity=".45"/>
          <stop offset=".25" stop-color="#000" stop-opacity="0"/>
          <stop offset=".7" stop-color="#fff" stop-opacity=".05"/>
          <stop offset="1" stop-color="#000" stop-opacity=".5"/>
        </linearGradient>
        <linearGradient id="gold-${id}" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stop-color="#6E5433"/>
          <stop offset=".22" stop-color="#C9AE7C"/>
          <stop offset=".45" stop-color="#F1E3C2"/>
          <stop offset=".62" stop-color="#B89663"/>
          <stop offset="1" stop-color="#5E4628"/>
        </linearGradient>
        <linearGradient id="base-${id}" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#1B1B19" stop-opacity=".10"/>
          <stop offset="1" stop-color="#1B1B19" stop-opacity=".28"/>
        </linearGradient>
        <pattern id="brush-${id}" width="4" height="2" patternUnits="userSpaceOnUse"><rect width="4" height=".6" fill="#000" opacity=".12"/></pattern>
        <radialGradient id="shadow-${id}" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#000" stop-opacity=".45"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>
      </defs>
      <ellipse cx="120" cy="326" rx="92" ry="9" fill="url(#shadow-${id})"/>
      <!-- cap: brushed gold block on a black collar -->
      <rect x="84" y="14" width="72" height="64" fill="url(#gold-${id})"/>
      <rect x="84" y="14" width="72" height="64" fill="url(#brush-${id})"/>
      <rect x="84" y="14" width="72" height="2" fill="#fff" opacity=".35"/>
      <rect x="98" y="78" width="44" height="18" fill="#0B0B0A"/>
      <rect x="98" y="78" width="44" height="2" fill="#C4A875" opacity=".55"/>
      <!-- glass: bevelled outline, thick walls, heavy base -->
      <path d="M44 104 L52 96 H188 L196 104 V310 L188 318 H52 L44 310 Z" fill="#1B1B19" fill-opacity=".09" stroke="#C4A875" stroke-opacity=".5" stroke-width="1"/>
      <path d="M58 110 H182 V262 H58 Z" fill="url(#juice-${id})"/>
      <path d="M58 110 H182 V262 H58 Z" fill="url(#juiceside-${id})"/>
      <path d="M44 104 L52 96 H188 L196 104 V310 L188 318 H52 L44 310 Z" fill="url(#glass-${id})"/>
      <path d="M52 262 H188 V310 L182 316 H58 L52 310 Z" fill="url(#base-${id})"/>
      <line x1="58" y1="262" x2="182" y2="262" stroke="#ffffff" stroke-opacity=".18"/>
      <!-- reflections -->
      <rect x="64" y="114" width="7" height="190" fill="#ffffff" opacity=".22"/>
      <rect x="75" y="114" width="2" height="190" fill="#ffffff" opacity=".12"/>
      <rect x="171" y="114" width="3" height="190" fill="#ffffff" opacity=".08"/>
      <!-- engraved plate -->
      <rect x="92" y="168" width="56" height="34" fill="#0A0A0A" fill-opacity=".35" stroke="#C4A875" stroke-opacity=".7" stroke-width=".8"/>
      <text x="120" y="184" text-anchor="middle" font-family="Bodoni Moda, Georgia, serif" font-size="9" letter-spacing="3.2" fill="#EDE3CF">${esc(site.brand)}</text>
      <text x="120" y="196" text-anchor="middle" font-family="Manrope, Arial, sans-serif" font-size="4.6" letter-spacing="1.6" fill="#C4A875">${esc(p.numeral)} · ${esc(p.name.toUpperCase())}</text>
    </svg>`;
  };

  const card = (p, i = 0) => `
    <li class="card reveal" style="--i:${i}" data-families="${p.families.join(' ')}" data-gender="${p.gender}" data-status="${p.status}" data-intensity="${p.profile.intensite}">
      <a class="card__link" href="/parfums/${p.slug}">
        <div class="card__media" style="--tone:${p.tone}">
          ${flacon(p, 'sm')}
        </div>
        <div class="card__body">
          <p class="eyebrow">${esc(p.numeral)} · ${esc(p.families.map((f) => families[f]).join(' · '))}</p>
          <h3 class="card__title">${esc(p.name)}</h3>
          <p class="card__motto">${esc(p.motto)}</p>
          <p class="card__price">${priceShort(p)}</p>
        </div>
      </a>
      <button class="fav" type="button" data-fav="${p.slug}" aria-pressed="false" aria-label="Ajouter ${esc(p.name)} aux favoris"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/></svg></button>
    </li>`;

  const universes = () => `
    <ul class="universes" role="list">
      ${products.map((p, i) => `
        <li class="universe reveal" style="--tone:${p.tone};--i:${i}">
          <a href="/parfums/${p.slug}">
            <span class="universe__num">${esc(p.numeral)}</span>
            <span class="universe__name">${esc(p.universe)}</span>
            <span class="universe__motto">${esc(p.motto)}</span>
          </a>
        </li>`).join('')}
    </ul>`;

  // Media slot: the merchant's video or photo from data/site.json, otherwise a sober living
  // scene (light, stone, the bottle) — never a fake photograph.
  const media = site.media || {};
  const scene = (slug, variant = 'light') => {
    const p = products.find((x) => x.slug === slug) || products[0];
    return `<div class="scene scene--${variant}" style="--tone:${p.tone}" role="img" aria-label="Scène conceptuelle : flacon ${esc(p.name)}">
      <div class="scene__light" aria-hidden="true"></div><div class="scene__beam" aria-hidden="true"></div>
      <div class="scene__plinth" aria-hidden="true"></div>
      <div class="scene__bottle" aria-hidden="true">${flacon(p, `scene-${variant}`)}</div>
    </div>`;
  };
  const mediaSlot = (video, poster, fallbackSlug, variant, alt = '') => {
    if (video) return `<video class="media-fill" src="${esc(video)}" ${poster ? `poster="${esc(poster)}"` : ''} autoplay muted loop playsinline preload="metadata" data-video aria-label="${esc(alt || 'Film de la maison')}"></video>`;
    if (poster) return `<img class="media-fill" src="${esc(poster)}" alt="${esc(alt)}" decoding="async">`;
    return scene(fallbackSlug, variant);
  };
  const shelf = (dark = true) => `<div class="shelf${dark ? ' shelf--dark' : ''}" role="img" aria-label="Visuel conceptuel : les sept flacons de la maison">
      <div class="shelf__wall" aria-hidden="true"></div>
      <div class="shelf__row" aria-hidden="true">${products.map((p) => `<div class="shelf__item" style="--tone:${p.tone}">${flacon(p, `shelf${dark ? 'd' : 'l'}`)}</div>`).join('')}</div>
      <div class="shelf__board" aria-hidden="true"></div>
    </div>`;
  const iconicSlugs = site.iconics?.length ? site.iconics : products.slice(0, 4).map((p) => p.slug);
  const iconic = (p, i) => `<li class="iconic" style="--i:${i}">
      <a href="/parfums/${p.slug}" class="iconic__link">
        <span class="iconic__media" style="--tone:${p.tone}">${flacon(p, 'icon')}</span>
        <span class="iconic__body"><span class="eyebrow">${esc(p.numeral)} · ${esc(p.families.map((f) => families[f]).join(' · '))}</span><span class="iconic__name">${esc(p.name)}</span><span class="small">${priceShort(p)}</span></span>
      </a>
    </li>`;

  const dynamic = {
    'media:hero': () => mediaSlot(media.heroVideo, media.heroPoster, 'silence', 'dark', 'Film d’ouverture de la maison'),
    'media:second': () => mediaSlot(media.secondVideo, media.secondPoster, 'heritage', 'light', 'Film de la maison'),
    'media:zoom': () => (media.zoomImage ? `<img class="media-fill" src="${esc(media.zoomImage)}" alt="${esc(media.zoomImageAlt)}" decoding="async" loading="lazy">` : shelf(false)),
    'media:collector': () => (media.collectorImage ? `<img class="media-fill" src="${esc(media.collectorImage)}" alt="${esc(media.collectorImageAlt)}" decoding="async" loading="lazy">` : shelf(true)),
    'iconics': () => `<ul class="iconics" role="list">${iconicSlugs.map((s) => products.find((p) => p.slug === s)).filter(Boolean).map(iconic).join('')}</ul>`,
    'products-grid:shop': () => `<ul class="grid-products grid-products--shop" role="list">${products.map(card).join('')}</ul>`,
    'products-grid:all': () => `<ul class="grid-products" role="list" data-catalogue>${products.map(card).join('')}</ul>`,
    'products-grid:signature': () => `<ul class="grid-products grid-products--signature" role="list">${products.slice(0, 4).map(card).join('')}</ul>`,
    'universes': universes,
    'family-options': () => Object.entries(families).map(([k, v]) => `<button type="button" class="chip" data-filter-family="${k}" aria-pressed="false">${esc(v)}</button>`).join(''),
    'announcements': () => site.announcements.map((a) => `<p>${esc(a)}</p>`).join(''),
  };

  const tokens = (html, extra = {}) => html
    .replace(/<!--\s*@flacon:([\w-]+)\s*-->/g, (m, slug) => {
      const p = products.find((x) => x.slug === slug);
      return p ? flacon(p, 'lg') : m;
    })
    .replace(/<!--\s*@([\w:-]+)\s*-->/g, (m, key) => (dynamic[key] ? dynamic[key]() : m))
    .replace(/\{\{(\w+)\}\}/g, (m, key) => (key in extra ? extra[key] : key in site ? esc(site[key]) : key === 'year' ? String(new Date().getFullYear()) : m));

  const layout = ({ title, description, path, body, bodyClass = '', jsonld = '' }) => {
    const fullTitle = title ? `${title} · ${site.brand}` : `${site.brand} — ${site.signature}`;
    return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(fullTitle)}</title>
<meta name="description" content="${esc(description || site.description)}">
<link rel="canonical" href="${esc(path)}">
<meta property="og:title" content="${esc(fullTitle)}">
<meta property="og:description" content="${esc(description || site.description)}">
<meta property="og:type" content="website">
<meta name="theme-color" content="#0A0A0A">
<link rel="icon" href="/assets/img/monogram.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bodoni+Moda:ital,opsz,wght@0,6..96,400;0,6..96,500;1,6..96,400&family=Manrope:wght@400;500;600&display=swap">
<link rel="stylesheet" href="/assets/css/lakon.css">
<link rel="stylesheet" href="/assets/css/maison.css">
<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@type': 'Organization', name: site.brand, slogan: site.signature })}</script>
${jsonld}
<script type="module" src="/assets/js/app.js"></script>
</head>
<body class="${bodyClass}">
<a class="skip" href="#contenu">Aller au contenu</a>
${tokens(header)}
<main id="contenu" tabindex="-1">
${body}
</main>
${tokens(footer)}
${tokens(overlays)}
${tokens(concierge)}
</body>
</html>
`;
  };

  await rm(out, { recursive: true, force: true, maxRetries: 8, retryDelay: 120 });
  await mkdir(out, { recursive: true });
  await cp(resolve(src, 'assets'), resolve(out, 'assets'), { recursive: true });
  await mkdir(resolve(out, 'data'), { recursive: true });
  await writeFile(resolve(out, 'data/catalogue.json'), JSON.stringify({ families, products, currency: site.currency, locale: site.locale }));
  await writeFile(resolve(out, 'data/site.json'), JSON.stringify({ brand: site.brand, contactEmail: site.contactEmail, checkoutProvider: site.checkoutProvider }));

  // Pages.
  const urls = [];
  for (const file of await readdir(resolve(src, 'pages'))) {
    if (!file.endsWith('.html')) continue;
    const raw = await readFile(resolve(src, 'pages', file), 'utf8');
    const meta = {};
    const body = raw.replace(/^<!--([\s\S]*?)-->\s*/, (m, block) => {
      for (const line of block.split('\n')) {
        const i = line.indexOf(':');
        if (i > 0) meta[line.slice(0, i).trim()] = line.slice(i + 1).trim();
      }
      return '';
    });
    const name = file.replace(/\.html$/, '');
    const path = name === 'index' ? '/' : `/${name}`;
    const html = layout({ title: tokens(meta.title || ''), description: tokens(meta.description || ''), path, body: tokens(body), bodyClass: meta.bodyClass || '' });
    await writeFile(resolve(out, name === 'index' ? 'index.html' : `${name}.html`), html);
    if (name !== '404') urls.push(path);
  }

  // One page per fragrance.
  const productTemplate = await readFile(resolve(src, 'templates/parfum.html'), 'utf8');
  await mkdir(resolve(out, 'parfums'), { recursive: true });
  for (const p of products) {
    const bar = (label, value) => `<div class="gauge"><dt>${label}</dt><dd><span class="gauge__track" aria-hidden="true">${[1, 2, 3, 4, 5].map((n) => `<i class="${n <= value ? 'on' : ''}"></i>`).join('')}</span><span class="sr">${value} sur 5</span></dd></div>`;
    const others = products.filter((o) => o.slug !== p.slug && o.families.some((f) => p.families.includes(f))).slice(0, 3);
    const extra = {
      slug: p.slug,
      name: esc(p.name),
      numeral: esc(p.numeral),
      motto: esc(p.motto),
      story: esc(p.story),
      tone: p.tone,
      familiesLabel: esc(p.families.map((f) => families[f]).join(' · ')),
      genderLabel: esc({ masculin: 'Masculin', feminin: 'Féminin', mixte: 'Mixte' }[p.gender] || ''),
      concentrationLabel: esc(p.concentration || 'À définir avec le laboratoire'),
      statusLabel: statusLabel(p),
      priceLabel: priceLabel(p),
      flacon: flacon(p, 'lg'),
      notesTop: esc(p.notes.top.join(' · ')),
      notesHeart: esc(p.notes.heart.join(' · ')),
      notesBase: esc(p.notes.base.join(' · ')),
      gauges: [['Intensité', p.profile.intensite], ['Fraîcheur', p.profile.fraicheur], ['Boisé', p.profile.boise], ['Ambré', p.profile.ambre], ['Floral', p.profile.floral], ['Épicé', p.profile.epice]].map(([l, v]) => bar(l, v)).join(''),
      occasions: esc(p.occasions.join(' · ')),
      seasons: esc(p.seasons.join(' · ')),
      buy: p.status === 'disponible' && p.price != null
        ? `<button class="btn btn--solid" type="button" data-add-to-cart="${p.slug}">Ajouter au panier</button>`
        : `<button class="btn btn--solid" type="button" data-notify="${p.slug}">Me prévenir du lancement</button>`,
      related: others.map(card).join(''),
    };
    const jsonld = `<script type="application/ld+json">${JSON.stringify({
      '@context': 'https://schema.org', '@type': 'Product', name: `${p.name} — ${site.brand}`, description: p.story, brand: { '@type': 'Brand', name: site.brand },
      ...(p.status === 'disponible' && p.price != null ? { offers: { '@type': 'Offer', price: p.price, priceCurrency: site.currency, availability: 'https://schema.org/InStock' } } : {}),
    })}</script>
<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Accueil', item: '/' }, { '@type': 'ListItem', position: 2, name: 'Parfums', item: '/parfums' }, { '@type': 'ListItem', position: 3, name: p.name, item: `/parfums/${p.slug}` }] })}</script>`;
    const html = layout({ title: p.name, description: `${p.name}, ${p.motto} ${p.story}`, path: `/parfums/${p.slug}`, body: tokens(productTemplate, extra), jsonld });
    await writeFile(resolve(out, 'parfums', `${p.slug}.html`), html);
    urls.push(`/parfums/${p.slug}`);
  }

  await writeFile(resolve(out, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `  <url><loc>${u}</loc></url>`).join('\n')}\n</urlset>\n`);
  await writeFile(resolve(out, 'robots.txt'), 'User-agent: *\nAllow: /\nSitemap: /sitemap.xml\n');
  await rm(final, { recursive: true, force: true, maxRetries: 8, retryDelay: 120 });
  await rename(out, final);
  return { pages: urls.length };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { pages } = await build();
  console.log(`Site construit dans dist/ (${pages} pages).`);
}
