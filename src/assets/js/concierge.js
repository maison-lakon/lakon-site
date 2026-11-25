// LAKON Concierge, guided version. Understands free French text (occasion, materials,
// presence, season), asks only for what is missing, then recommends three creations
// from the real catalogue with their reasons. No AI, nothing leaves the browser.
import { FAMILY_WORDS, fold, loadCatalogue, recommend } from './recommend.js';
import { store } from './store.js';

const OCCASIONS = {
  'Le quotidien': ['quotidien', 'tous les jours', 'journee', 'matin'],
  'Le bureau': ['bureau', 'travail', 'reunion', 'boulot', 'professionnel'],
  'Une soirée': ['soir', 'soiree', 'nuit', 'diner', 'sortie'],
  'Un rendez-vous': ['rendez', 'seduction', 'seduire', 'romantique', 'amour'],
  'Une grande occasion': ['mariage', 'gala', 'ceremonie', 'grande occasion', 'evenement', 'anniversaire', 'reception'],
};
const PRESENCE = { 2: ['discret', 'leger', 'subtil', 'doux', 'intime', 'pas trop'], 3: ['present', 'equilibre', 'moyen'], 5: ['affirme', 'puissant', 'intense', 'fort', 'sillage', 'remarque', 'imposant', 'marquant'] };
const SEASONS = { 'Été': ['ete', 'chaleur', 'chaud dehors'], 'Hiver': ['hiver', 'froid'], 'Printemps': ['printemps'], 'Automne': ['automne'] };
const match = (text, words) => words.some((w) => text.includes(w));

export async function initConcierge() {
  const dialog = document.getElementById('concierge');
  if (!dialog) return;
  const log = dialog.querySelector('[data-concierge-log]');
  const chips = dialog.querySelector('[data-concierge-chips]');
  const form = dialog.querySelector('[data-concierge-form]');
  const input = form.querySelector('input');
  const launchers = document.querySelectorAll('[data-concierge-open]');
  let state = { occasion: null, families: [], intensity: null, season: null };
  let started = false;
  let catalogue;

  const say = (text, who = 'bot', delay = 0) => new Promise((resolve) => setTimeout(() => {
    const p = document.createElement('p');
    p.className = `msg msg--${who}`;
    p.textContent = text;
    log.append(p);
    log.scrollTop = log.scrollHeight;
    resolve();
  }, delay));

  const setChips = (items) => {
    chips.replaceChildren(...items.map(([label, run]) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'chip';
      b.textContent = label;
      b.addEventListener('click', () => { say(label, 'user'); run(); });
      return b;
    }));
  };

  const ask = async (delay = 450) => {
    if (!state.occasion) {
      await say('Pour quelle occasion le porterez-vous ?', 'bot', delay);
      return setChips(Object.keys(OCCASIONS).map((o) => [o, () => { state.occasion = o; ask(); }]));
    }
    if (!state.families.length) {
      await say('Quelles matières vous ressemblent ?', 'bot', delay);
      return setChips(Object.entries(catalogue.families).map(([k, v]) => [v, () => { state.families = [k]; ask(); }]));
    }
    if (!state.intensity) {
      await say('Quelle présence souhaitez-vous laisser ?', 'bot', delay);
      return setChips([['Discrète', 2], ['Présente', 3], ['Affirmée', 5]].map(([l, v]) => [l, () => { state.intensity = v; ask(); }]));
    }
    setChips([['Recommencer', restart], ['Diagnostic complet', () => { location.href = '/diagnostic'; }]]);
    await say('Je compose votre sélection.', 'bot', delay);
    const picks = recommend(catalogue.products, catalogue.families, state);
    await say('Voici les trois créations qui vous correspondent le mieux :', 'bot', 350);
    const list = document.createElement('div');
    list.className = 'picks';
    for (const { product, reasons } of picks) {
      const a = document.createElement('a');
      a.className = 'pick';
      a.href = `/parfums/${product.slug}`;
      a.innerHTML = `<span class="pick__swatch" style="--tone:${product.tone}"></span><span><strong></strong><small></small></span>`;
      a.querySelector('strong').textContent = `${product.numeral} · ${product.name}`;
      a.querySelector('small').textContent = reasons.length ? reasons.join(' · ') : product.motto;
      list.append(a);
    }
    log.append(list);
    log.scrollTop = log.scrollHeight;
    await say('Ces créations sont en développement : chaque fiche permet d’être prévenu de leur lancement.', 'bot', 600);
    if (state.occasion === 'Une grande occasion') await say('Pour une grande occasion, les archives Collector accueilleront nos éditions limitées lorsqu’elles existeront.', 'bot', 400);
  };

  const understand = (text) => {
    const t = fold(text);
    let learned = false;
    if (/recommenc|de zero|autre chose/.test(t)) { restart(); return; }
    for (const [o, words] of Object.entries(OCCASIONS)) if (match(t, words)) { state.occasion = o; learned = true; break; }
    for (const [f, words] of Object.entries(FAMILY_WORDS)) if (match(t, words) && !state.families.includes(f)) { state.families.push(f); learned = true; }
    for (const [v, words] of Object.entries(PRESENCE)) if (match(t, words)) { state.intensity = Number(v); learned = true; }
    for (const [s, words] of Object.entries(SEASONS)) if (match(t, words)) { state.season = s; learned = true; }
    if (/extrait|eau de parfum|concentration/.test(t)) { say('L’extrait est la forme la plus concentrée ; l’eau de parfum diffuse davantage ; l’huile, sans alcool, reste proche de la peau. Le Journal détaille ces différences.', 'bot', 400); return; }
    if (/conserv|garder/.test(t)) { say('À l’abri de la lumière et de la chaleur, flacon bien fermé : c’est l’essentiel.', 'bot', 400); return; }
    if (/prix|combien|tarif/.test(t)) { say('Les prix seront communiqués au lancement des créations. Je ne peux pas en donner avant.', 'bot', 400); return; }
    if (!learned) { say('Je n’ai pas tout saisi. Décrivez une matière, une occasion ou une intensité, ou choisissez ci-dessous.', 'bot', 400).then(() => ask(200)); return; }
    ask();
  };

  const restart = async () => {
    state = { occasion: null, families: [], intensity: null, season: null };
    log.replaceChildren();
    await say(`Bonsoir. Je suis le concierge de la maison, dans sa version guidée : je m’appuie uniquement sur nos créations réelles. Dites-moi l’occasion, les matières qui vous attirent et la présence que vous souhaitez.`);
    const passport = store.get('passport');
    if (passport?.families?.length) {
      state = { occasion: passport.occasion, families: passport.families, intensity: passport.intensity, season: passport.season };
      await say('J’ai retrouvé votre passeport olfactif sur cet appareil : je m’en sers comme point de départ.', 'bot', 300);
    }
    ask();
  };

  const open = async () => {
    catalogue ??= await loadCatalogue();
    dialog.show();
    launchers.forEach((l) => l.setAttribute('aria-expanded', 'true'));
    if (!started) { started = true; restart(); }
    requestAnimationFrame(() => input.focus());
  };
  const close = () => {
    dialog.close();
    launchers.forEach((l) => l.setAttribute('aria-expanded', 'false'));
  };

  launchers.forEach((l) => l.addEventListener('click', (e) => { e.preventDefault(); dialog.open ? close() : open(); }));
  dialog.querySelector('[data-concierge-close]').addEventListener('click', close);
  dialog.addEventListener('keydown', (e) => { if (e.key === 'Escape') { e.preventDefault(); close(); } });
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return;
    input.value = '';
    say(text, 'user');
    understand(text);
  });
  if (location.hash === '#concierge') open();
}
