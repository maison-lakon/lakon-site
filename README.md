# LAKON — boutique autonome

Site indépendant de la maison LAKON (*La force du silence.*), sans Shopify et sans aucune dépendance : HTML, CSS et JavaScript, plus deux petits scripts Node.

## Lancer en local

```powershell
cd "C:\Users\FlowUP\Desktop\Lakon Dossier\Site Code\lakon-boutique"
node scripts/serve.mjs
```

Puis ouvrir http://127.0.0.1:4321. Le site se reconstruit tout seul à chaque modification de `src/` ou `data/`.

Construire sans serveur : `node scripts/build.mjs` (résultat dans `dist/`, prêt à héberger).

## Où modifier quoi

| Je veux changer… | Fichier |
|---|---|
| Le nom de la maison (LAKON → TOKEN…), la signature, la barre d'annonce, l'e-mail de contact | `data/site.json` (un seul endroit, appliqué à toutes les pages) |
| Les parfums : nom, histoire, notes, familles, prix, statut | `data/catalogue.json` |
| Les couleurs, typographies, espacements | `src/assets/css/lakon.css` (variables en haut du fichier) |
| Le texte d'une page | `src/pages/<page>.html` |
| La fiche parfum (modèle commun) | `src/templates/parfum.html` |
| En-tête, menu, pied de page, concierge | `src/partials/` |

## Mettre vos vidéos et photos

1. Déposez vos fichiers dans `src/assets/media/` (vidéo : `.mp4` H.264, muette, moins de 8 Mo ; photo : `.webp` ou `.jpg`).
2. Dans `data/site.json`, rubrique `media`, indiquez leur chemin, par exemple `"heroVideo": "/assets/media/ouverture.mp4"`.

| Emplacement | Où il apparaît |
|---|---|
| `heroVideo` (+ `heroPoster`) | Le film d'ouverture, qui glisse à gauche au défilement pendant que les iconiques arrivent à droite |
| `secondVideo` (+ `secondPoster`) | Le film fixé à droite, à côté de la boutique |
| `zoomImage` (+ `zoomImageAlt`) | La grande photo qui se dézoome lentement |
| `collectorImage` (+ `collectorImageAlt`) | La photo du bloc Collector |

Tant qu'un emplacement est vide, une scène sobre (lumière, socle, flacon dessiné) le remplace, marquée « Visuel conceptuel ». Les iconiques affichées à côté du film se choisissent dans `iconics`.

## Mettre une création en vente

Dans `data/catalogue.json`, pour le produit concerné : `"status": "disponible"`, `"price": 120` (par exemple), `"concentration": "Eau de parfum"`. Le bouton devient « Ajouter au panier » et le prix s'affiche. **Ne le faire qu'une fois le produit fabriqué, conforme (DIP, CPNP, INCI, étiquetage) et en stock.**

## Expérience (inspirée des grandes maisons)

- Rien ne quitte la page : menu latéral (la rubrique survolée ressort, les autres s'assombrissent, ses sous-rubriques s'ouvrent à côté), recherche instantanée, compte au centre, panier latéral, demande de rendez-vous.
- Accueil : film plein écran qui glisse à gauche avec les iconiques à droite ; boutique à gauche avec un second film fixé à droite ; photo qui se dézoome ; Collector ; l'art d'offrir ; Le Cercle ; engagements ; journal.
- Pied de page : services (livraison, écrin et message, rendez-vous, conseil), lettre des exclusivités, service client, la maison, légal, interrupteur « meilleur contraste ».
- Bouton pause sur les films (accessibilité), films en pause hors de l'écran, toutes les animations coupées si « réduire les animations » est activé.

## Ce qui fonctionne

Accueil (11 sections), catalogue filtrable et triable, 7 fiches parfum (onglets, pyramide, profil, données structurées), Collector, Pièces de collection, coffrets avec configurateur, diagnostic olfactif LAKON ID (8 questions, profil, radar, 3 recommandations expliquées), LAKON Concierge (version guidée, sans IA), favoris, panier, espace personnel local, journal (3 guides), pages pro, contact, FAQ, pages légales (modèles), plan du site, 404. Animations : ouverture, apparition des titres mot par mot, cartes en 3D légère, halo du curseur, barre de lecture, bande des univers — toutes coupées si « réduire les animations » est activé.

## Ce qui reste à brancher (rien n'est simulé)

| Élément | Ce qu'il faut |
|---|---|
| Paiement | Un prestataire (Stripe ou équivalent) et votre compte ; le bouton « Passer commande » est désactivé et l'indique |
| Formulaires et listes d'attente | Renseigner `contactEmail` dans `data/site.json` (ouvre la messagerie du visiteur), ou un service de formulaires |
| Comptes clients | Un service d'authentification ; aujourd'hui tout reste sur l'appareil du visiteur |
| Concierge IA | Un petit serveur qui garde la clé API (voir l'architecture décrite dans le thème Shopify, `docs/ASSISTANT-IA.md`) |
| Photographies | Remplacer les flacons dessinés (marqués « Visuel conceptuel ») par les vraies photos |
| Polices | Les héberger sur le site avant l'ouverture (aujourd'hui Google Fonts, qui reçoit l'adresse IP) |
| Pages légales | Compléter les zones surlignées « À compléter » et faire relire |
| Domaine et hébergement | Par exemple Cloudflare Pages, comme Nūr al-Bayān (dossier `dist/`) — avec votre accord |
