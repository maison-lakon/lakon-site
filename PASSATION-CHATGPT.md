# LAKON — dossier de passation (à donner à ChatGPT)

> Colle ce document en premier message, puis joins le fichier `lakon-boutique-code.zip`. Demande ensuite ce que tu veux faire.

---

## 1. Rôle à jouer

Tu reprends le développement du site de **LAKON**, maison de parfumerie de luxe masculine (signature : *La force du silence.*). Tu agis comme directeur artistique d'une maison de luxe et développeur front-end senior. Le résultat doit paraître **professionnel, haut de gamme, jamais « généré par IA »**. Inspirations : Dior Beauty, Louis Vuitton, Ralph Lauren, Maison Francis Kurkdjian, Creed, Tom Ford Private Blend. S'inspirer de leurs mécanismes, ne jamais copier textes, logos, photos ou designs.

## 2. Le projet en une phrase

Un site **autonome, sans Shopify et sans aucune dépendance** (HTML, CSS, JavaScript natif + deux scripts Node), construit en pages statiques depuis des données centralisées.

## 3. Lancer et construire

```
node scripts/serve.mjs     → aperçu sur http://127.0.0.1:4321 (reconstruit à chaque modification)
node scripts/build.mjs     → génère le site final dans dist/ (prêt à héberger, ex. Cloudflare Pages)
```
Node 20 ou plus. Aucun `npm install` nécessaire.

## 4. Arborescence

```
data/site.json          Nom de marque (centralisé), signature, annonces, e-mail de contact, médias (vidéos/photos), iconiques
data/catalogue.json     Les 7 créations : nom, univers, devise, histoire, familles, notes, profil (1-5), occasions, saisons, teinte, statut, prix
scripts/build.mjs       Assemble les pages : layout commun + partials + jetons {{brand}} + blocs dynamiques <!-- @... --> + 1 page par parfum + sitemap
scripts/serve.mjs       Serveur local (URLs propres, reconstruction automatique)
src/partials/           header.html, footer.html, overlays.html (menu, recherche, compte, panier, rendez-vous), concierge.html
src/pages/*.html        Une page par fichier ; en-tête de métadonnées en commentaire (title / description)
src/templates/parfum.html  Modèle de fiche parfum (jetons {{name}}, {{notesTop}}, {{gauges}}…)
src/assets/css/lakon.css   Système de design (variables, typographie, composants)
src/assets/css/maison.css  Couche « grande maison » (menu latéral, fenêtres, scènes animées, pied de page)
src/assets/js/app.js       Point d'entrée (animations, favoris, panier, filtres, onglets, formulaires, configurateur, espace)
src/assets/js/maison.js    Fenêtres sans quitter la page, menu qui assombrit, recherche instantanée, film qui glisse, photo dézoomée, contraste
src/assets/js/recommend.js Moteur de recommandation déterministe (partagé)
src/assets/js/diagnostic.js Diagnostic olfactif « LAKON ID » (8 questions → profil + radar + 3 recommandations expliquées)
src/assets/js/concierge.js  « LAKON Concierge » version guidée (comprend des phrases en français, sans IA)
src/assets/js/store.js      Données du visiteur en localStorage (panier, favoris, passeport, contraste)
src/assets/media/           Emplacement des vraies vidéos et photos
```

### Jetons et blocs reconnus par `build.mjs`
- `{{brand}}`, `{{signature}}`, `{{tagline}}`, `{{year}}` (depuis `site.json`)
- `<!-- @products-grid:all -->`, `<!-- @products-grid:signature -->`, `<!-- @products-grid:shop -->`
- `<!-- @universes -->`, `<!-- @iconics -->`, `<!-- @family-options -->`, `<!-- @announcements -->`
- `<!-- @media:hero -->`, `<!-- @media:second -->`, `<!-- @media:zoom -->`, `<!-- @media:collector -->` (vidéo/photo si renseignée dans `site.json > media`, sinon scène conceptuelle)
- `<!-- @flacon:<slug> -->` (flacon dessiné en SVG)

## 5. Direction artistique (à respecter)

- **Fond blanc et ivoire, texte noir, détails or.** Variables dans `lakon.css` :
  `--blanc #FFFFFF`, `--ivoire #F5F1EA`, `--obsidienne #0A0A0A`, `--or #C4A875` (filets et décors uniquement : 2,3:1 sur blanc), `--or-texte #7A5E38` (texte doré sur fond clair : 6:1), `--bronze #92734F`.
- Teintes réservées aux univers : émeraude `#123C32`, bleu nuit `#101D2C`, ambre `#704528`, anthracite `#1B1B19`.
- Sections sombres avec la classe `.theme-dark` (Collector, pied de page). Sections alternées : `.section--alt`.
- Typographie : **Bodoni Moda** (titres, classes `.display-xl/-l/-m/-s`) + **Manrope** (texte). Petites capitales espacées (`.eyebrow`, `.caps`).
- Géométrie carrée, filets fins, beaucoup d'espace. Animations lentes et sobres, toujours coupées si `prefers-reduced-motion`.
- **Interdits** : dégradés partout, boutons arrondis, néons, émojis, ombres dorées, pop-ups agressifs, textes marketing génériques (« plongez dans un univers… »).

## 6. Règles absolues d'honnêteté (très important)

Les produits **n'existent pas encore** (fournisseurs en cours de sélection, formules non validées, aucune conformité cosmétique faite). Donc :
- Jamais de faux avis, faux stocks, fausse rareté, faux comptes à rebours, faux partenaires ou ambassadeurs, fausses certifications.
- Prix affiché : « Prix communiqué au lancement » tant que `status` ≠ `"disponible"`.
- Visuels dessinés marqués « Visuel conceptuel ».
- Un service non lancé est marqué « Bientôt » (classe `.soon`) ou présenté comme futur.
- Le concierge est annoncé comme **version guidée, sans IA**. Ne jamais le présenter comme une IA.
- Tenue et sillage : jamais de durée promise sans tests réels.
- Ne jamais mettre de clé API dans le code front-end.

## 7. Ce qui fonctionne

- 29 pages : accueil, parfums (filtres famille/genre, tri), 7 fiches parfum (onglets Notes/Profil/Composition/Rituel/Livraison, données structurées Product + BreadcrumbList), Collector, Pièces de collection, Coffrets (+ configurateur), Diagnostic, Le Cercle, La Maison, Professionnels (devis), Journal + 3 guides, Panier, Mon espace, Contact, FAQ, Livraison-retours, Mentions légales, CGV, Confidentialité, Accessibilité, 404. Sitemap + robots.
- **Accueil scénarisé** : film plein écran qui glisse à gauche au défilement avec « Les iconiques » à droite (`.stage`, variable CSS `--e`) ; boutique à gauche + second film fixé à droite (`.split-media`) ; photo qui se dézoome (`.zoomout`, variable `--z`) ; Collector ; L'art d'offrir ; Le Cercle ; Engagements ; Journal.
- **Rien ne quitte la page** : menu latéral (rubrique survolée mise en avant, autres assombries, sous-rubriques à côté), recherche instantanée, compte (fenêtre centrale), panier (tiroir), rendez-vous. Fenêtres = `<dialog>` natifs ouverts par `data-open="id"`, fermés par `data-close`.
- Pied de page : services, lettre des exclusivités, colonnes, interrupteur « meilleur contraste ».
- Responsive vérifié (ordinateur + mobile 375 px, pas de débordement), aucune erreur console.

## 8. Ce qui reste à faire / brancher

| Priorité | Sujet | Détail |
|---|---|---|
| 1 | Vraies vidéos et photos | Déposer dans `src/assets/media/`, renseigner `site.json > media` |
| 1 | E-mail de contact | `site.json > contactEmail` (sinon les formulaires disent honnêtement que rien n'est envoyé) |
| 1 | Pages légales | Compléter les zones « À compléter » (éditeur, hébergeur, CGV, RGPD) et faire relire |
| 2 | Paiement | Stripe Checkout ou équivalent (bouton « Passer commande » désactivé aujourd'hui) |
| 2 | Formulaires réels | Service de formulaires ou petite fonction serveur (au lieu du `mailto:`) |
| 2 | Polices auto-hébergées | Remplacer Google Fonts (RGPD) par des fichiers `.woff2` locaux |
| 3 | Comptes clients | Authentification + espace sécurisé (aujourd'hui tout est local) |
| 3 | Concierge IA | Petit serveur (Cloudflare Worker, etc.) qui garde la clé API, limite les requêtes, ne répond qu'à partir du catalogue réel |
| 3 | Mise en ligne | Héberger `dist/` (ex. Cloudflare Pages) + nom de domaine |
| 4 | Langues | Anglais, arabe (RTL), espagnol |

## 9. Manière de travailler attendue

- Modifier les **sources** (`src/`, `data/`, `scripts/`), jamais `dist/` (régénéré).
- Garder le JavaScript sans framework, un module par responsabilité, en amélioration progressive (la page doit rester lisible sans JS).
- Accessibilité : contraste ≥ 4,5:1, navigation clavier, `aria-*` corrects, alternative au mouvement.
- Après chaque changement : relancer `node scripts/build.mjs`, vérifier la console du navigateur, le mobile et les liens.
- Versionner avec Git (le projet est un dépôt Git ; dernier commit : `7ff17a1`).
- Donner les modifications sous forme de **fichiers complets** ou de remplacements précis (« remplace ce bloc par celui-ci »), en indiquant le chemin du fichier.

## 10. Historique utile

- Un thème Shopify « LAKON » existe aussi (dossier `Site Code/LAKON`, thème non publié « LAKON aperçu »), abandonné au profit de ce site autonome. Ne pas le mélanger avec ce projet.
- Le propriétaire veut : blanc + détails or + noir, niveau Dior/LV, beaucoup d'animation maîtrisée, rien qui fasse « IA ».
