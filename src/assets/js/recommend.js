// Deterministic recommendation engine shared by the diagnostic and the concierge.
// It scores the real catalogue against an olfactory profile and explains each pick.
// No AI: every reason comes from the product's own data.

let cataloguePromise;
export const loadCatalogue = () => (cataloguePromise ??= fetch('/data/catalogue.json').then((r) => r.json()));

export const FAMILY_WORDS = {
  boise: ['bois', 'boise', 'cedre', 'santal', 'vetiver', 'oud', 'patchouli', 'gaiac'],
  cuir: ['cuir', 'daim', 'tabac', 'fume', 'bouleau'],
  ambre: ['ambre', 'oriental', 'vanille', 'resine', 'benjoin', 'labdanum', 'tonka', 'chaud', 'gourmand'],
  epice: ['epice', 'poivre', 'cardamome', 'safran', 'cannelle', 'girofle', 'piquant'],
  frais: ['frais', 'fraicheur', 'agrume', 'bergamote', 'citron', 'neroli', 'marin', 'leger', 'propre', 'the'],
  musc: ['musc', 'encens', 'poudre', 'iris', 'peau', 'silence'],
  floral: ['fleur', 'floral', 'rose', 'jasmin', 'lavande', 'oranger'],
};

export const fold = (text) => String(text || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/**
 * @param {object} profile { families: string[], avoid: string[], intensity: 1-5, occasion?: string, season?: string, gender?: string }
 */
export function recommend(products, families, profile, limit = 3) {
  return products
    .map((p) => {
      let score = 0;
      const reasons = [];
      const liked = p.families.filter((f) => profile.families?.includes(f));
      if (liked.length) {
        score += liked.length * 4;
        reasons.push(`famille ${liked.map((f) => families[f].toLowerCase()).join(' et ')}`);
      }
      const disliked = p.families.filter((f) => profile.avoid?.includes(f));
      score -= disliked.length * 6;
      if (profile.intensity) {
        const gap = Math.abs((p.profile.intensite || 3) - profile.intensity);
        score += 3 - Math.min(gap, 3);
        if (gap <= 1) reasons.push(gap === 0 ? 'présence exactement voulue' : 'présence proche de vos attentes');
      }
      if (profile.occasion && p.occasions.includes(profile.occasion)) {
        score += 2;
        reasons.push(`pensé pour ${profile.occasion.toLowerCase()}`);
      }
      if (profile.season && p.seasons.includes(profile.season)) {
        score += 1;
        reasons.push(`à son aise en ${profile.season.toLowerCase()}`);
      }
      if (profile.gender === 'mixte' && p.gender === 'mixte') score += 1;
      return { product: p, score, reasons };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
