// LAKON ID — the olfactory diagnostic. Eight progressive questions, then a profile
// (dominant families, radar, presence) and three recommendations with their reasons.
// The passport is saved on this device only (localStorage "lakon:passport").
import { loadCatalogue, recommend } from './recommend.js';
import { store } from './store.js';

const QUESTIONS = [
  { id: 'occasion', q: 'Pour quelle occasion cherchez-vous un parfum ?', type: 'one', options: ['Le quotidien', 'Le bureau', 'Une soirée', 'Un rendez-vous', 'Une grande occasion'] },
  { id: 'families', q: 'Quelles matières vous attirent ?', hint: 'Plusieurs choix possibles.', type: 'many', options: 'families' },
  { id: 'avoid', q: 'Et celles que vous n’aimez pas ?', hint: 'Facultatif.', type: 'many', options: 'families', optional: true },
  { id: 'intensity', q: 'Quelle présence souhaitez-vous laisser ?', type: 'one', options: [['1', 'Intime, presque secrète'], ['2', 'Discrète'], ['3', 'Présente'], ['4', 'Affirmée'], ['5', 'Imposante']] },
  { id: 'season', q: 'À quelle saison pensez-vous d’abord ?', type: 'one', options: ['Printemps', 'Été', 'Automne', 'Hiver'] },
  { id: 'style', q: 'Votre style se rapproche plutôt de…', type: 'one', options: ['Classique et tailleur', 'Sobre et minimal', 'Décontracté chic', 'Affirmé et créatif'] },
  { id: 'character', q: 'Vous préférez les parfums…', type: 'one', options: ['Classiques, rassurants', 'Originaux, inattendus', 'Un peu des deux'] },
  { id: 'format', q: 'Quel format vous tente ?', type: 'one', options: ['Parfum vaporisé', 'Huile parfumée, sans alcool', 'Les deux'] },
];

export async function initDiagnostic(root) {
  const form = root.querySelector('[data-quiz]');
  if (!form) return;
  const { products, families } = await loadCatalogue();
  const stepsHost = form.querySelector('[data-quiz-steps]');
  const bar = form.querySelector('.quiz__progress span');
  const count = form.querySelector('[data-quiz-count]');
  const prev = form.querySelector('[data-quiz-prev]');
  const next = form.querySelector('[data-quiz-next]');
  const result = root.querySelector('[data-quiz-result]');

  stepsHost.innerHTML = QUESTIONS.map((question, i) => {
    const opts = question.options === 'families' ? Object.entries(families) : question.options.map((o) => (Array.isArray(o) ? o : [o, o]));
    const type = question.type === 'many' ? 'checkbox' : 'radio';
    return `<fieldset class="quiz__step" data-step="${i}" ${i ? 'hidden' : ''} style="border:0;padding:0;margin:0">
      <legend class="quiz__q">${question.q}</legend>
      ${question.hint ? `<p class="small">${question.hint}</p>` : ''}
      <div class="options">${opts.map(([value, label]) => `<label class="option"><input type="${type}" name="${question.id}" value="${value}"><strong>${label}</strong></label>`).join('')}</div>
    </fieldset>`;
  }).join('');

  let step = 0;
  const steps = [...stepsHost.querySelectorAll('[data-step]')];
  const answered = (i) => QUESTIONS[i].optional || form.querySelector(`[name="${QUESTIONS[i].id}"]:checked`);
  const show = () => {
    steps.forEach((el, i) => { el.hidden = i !== step; });
    bar.style.setProperty('--p', `${((step + 1) / QUESTIONS.length) * 100}%`);
    count.textContent = `Question ${step + 1} sur ${QUESTIONS.length}`;
    prev.disabled = step === 0;
    next.textContent = step === QUESTIONS.length - 1 ? 'Voir mon profil' : 'Suivant';
    next.disabled = !answered(step);
  };
  form.addEventListener('change', () => { next.disabled = !answered(step); });
  prev.addEventListener('click', () => { if (step > 0) { step -= 1; show(); } });
  next.addEventListener('click', () => {
    if (!answered(step)) return;
    if (step < QUESTIONS.length - 1) { step += 1; show(); steps[step].querySelector('input')?.focus(); return; }
    finish();
  });
  show();

  const finish = () => {
    const data = new FormData(form);
    const profile = {
      occasion: data.get('occasion'),
      families: data.getAll('families'),
      avoid: data.getAll('avoid'),
      intensity: Number(data.get('intensity')) || 3,
      season: data.get('season'),
      style: data.get('style'),
      character: data.get('character'),
      format: data.get('format'),
      date: new Date().toISOString(),
    };
    const picks = recommend(products, families, profile);
    profile.picks = picks.map((p) => p.product.slug);
    store.set('passport', profile);
    form.hidden = true;
    renderProfile(result, profile, picks, families);
    result.hidden = false;
    result.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
  };

  const saved = store.get('passport');
  if (saved && new URL(location.href).searchParams.has('resultat')) {
    form.hidden = true;
    renderProfile(result, saved, recommend(products, families, saved), families);
    result.hidden = false;
  }
}

export function renderProfile(host, profile, picks, families) {
  const axes = ['boise', 'ambre', 'epice', 'frais', 'floral', 'musc', 'cuir'];
  const values = axes.map((a) => (profile.families.includes(a) ? 1 : profile.avoid?.includes(a) ? 0.15 : 0.4));
  const pt = (i, r) => {
    const angle = (Math.PI * 2 * i) / axes.length - Math.PI / 2;
    return [100 + Math.cos(angle) * r * 80, 100 + Math.sin(angle) * r * 80].map((n) => n.toFixed(1)).join(',');
  };
  const radar = `<svg class="radar" viewBox="0 0 200 200" role="img" aria-label="Profil : ${profile.families.map((f) => families[f]).join(', ') || 'à préciser'}">
    ${[0.33, 0.66, 1].map((r) => `<polygon points="${axes.map((_, i) => pt(i, r)).join(' ')}" fill="none" stroke="currentColor" stroke-opacity=".15"/>`).join('')}
    <polygon points="${values.map((v, i) => pt(i, v)).join(' ')}" fill="#C4A875" fill-opacity=".25" stroke="#7A5E38"/>
    ${axes.map((a, i) => { const [x, y] = pt(i, 1.18).split(','); return `<text x="${x}" y="${y}" font-size="7" text-anchor="middle" fill="currentColor" opacity=".7">${families[a]}</text>`; }).join('')}
  </svg>`;
  const dominant = profile.families.map((f) => families[f]).join(' · ') || 'À préciser';
  const presence = ['', 'Intime', 'Discrète', 'Présente', 'Affirmée', 'Imposante'][profile.intensity] || 'Présente';
  const first = picks[0]?.product;
  host.innerHTML = `
    <div class="split" style="align-items:start">
      <div class="profile__id">
        <p class="eyebrow">Passeport olfactif · ID</p>
        <p class="display-m">${first ? first.universe : 'Votre profil'}</p>
        <p class="italic" style="font-family:var(--serif);color:var(--fg-soft)">${first ? first.motto : ''}</p>
        <hr class="rule" style="margin-block:1rem">
        <dl class="facts" style="border-color:rgb(240 235 225 / .15)">
          <dt>Familles</dt><dd>${dominant}</dd>
          <dt>Présence</dt><dd>${presence}</dd>
          <dt>Occasion</dt><dd>${profile.occasion || '—'}</dd>
          <dt>Saison</dt><dd>${profile.season || '—'}</dd>
          <dt>Format</dt><dd>${profile.format || '—'}</dd>
        </dl>
      </div>
      <div class="stack">${radar}</div>
    </div>
    <div class="stack">
      <p class="eyebrow">Vos recommandations</p>
      <ul class="list-num" role="list">${picks.map(({ product, reasons }, i) => `
        <li><span class="numeral">${['I', 'II', 'III'][i]}</span><h3><a href="/parfums/${product.slug}" style="text-decoration:none">${product.name}</a></h3>
        <p>${reasons.length ? `Pourquoi : ${reasons.join(', ')}.` : 'Une proposition pour élargir votre palette.'}</p>
        <p class="small">${product.status === 'disponible' ? 'Disponible' : 'En création, prix communiqué au lancement'}</p></li>`).join('')}
      </ul>
      <p class="small">Ces recommandations viennent d’un moteur de correspondance fondé sur les données de nos créations, pas d’une intelligence artificielle.</p>
      <div class="actions"><a class="btn btn--solid" href="/compte#passeport">Voir mon passeport</a><a class="btn" href="/diagnostic">Recommencer</a></div>
    </div>`;
}
