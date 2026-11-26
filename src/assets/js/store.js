// Local persistence for the visitor's own data: cart, favourites, passport.
// Everything stays on the device (localStorage, prefixed "lakon:"); nothing is sent anywhere.
const PREFIX = 'lakon:';
const listeners = new Set();

export const store = {
  get(key, fallback = null) {
    try { return JSON.parse(localStorage.getItem(PREFIX + key)) ?? fallback; } catch { return fallback; }
  },
  set(key, value) {
    try { localStorage.setItem(PREFIX + key, JSON.stringify(value)); } catch {}
    listeners.forEach((fn) => fn(key));
  },
  clear() {
    try { Object.keys(localStorage).filter((k) => k.startsWith(PREFIX)).forEach((k) => localStorage.removeItem(k)); } catch {}
    listeners.forEach((fn) => fn('*'));
  },
  on(fn) { listeners.add(fn); },
};

export const favs = {
  all: () => store.get('favs', []),
  has: (slug) => favs.all().includes(slug),
  toggle(slug) {
    const list = favs.all();
    store.set('favs', list.includes(slug) ? list.filter((s) => s !== slug) : [...list, slug]);
    return favs.has(slug);
  },
};

export const cart = {
  lines: () => store.get('cart', []),
  add(slug, qty = 1) {
    const lines = cart.lines();
    const line = lines.find((l) => l.slug === slug);
    if (line) line.qty += qty; else lines.push({ slug, qty });
    store.set('cart', lines);
  },
  setQty(slug, qty) {
    store.set('cart', cart.lines().map((l) => (l.slug === slug ? { ...l, qty } : l)).filter((l) => l.qty > 0));
  },
  count: () => cart.lines().reduce((n, l) => n + l.qty, 0),
};
