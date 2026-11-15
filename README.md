# Portfolio — Manon Maurel

Site statique (HTML / CSS / JavaScript, sans dépendance ni étape de build).

- `index.html` — structure des pages (Index, Liste, Infos, Projet)
- `js/projects.js` — **tout le contenu** : projets, textes, images, coordonnées
- `js/main.js` — interactions (bande à faire défiler, filtres, navigation)
- `css/style.css` — mise en page
- `assets/` — images, vidéo, polices

## Ajouter ou modifier un projet

1. Déposer les images dans `assets/img/` : une version large `nom.webp` (≈1800 px) et une petite `nom-s.webp` (≈800 px).
2. Dans `js/projects.js`, copier un bloc de projet et remplir les champs (`categorie` : `"creations"` ou `"ifm"`).
3. Les deux « Projet IFM » sont des emplacements à compléter : remplacer les textes, ajouter les images et retirer `aVenir: true`.

## Voir le site en local

```
python3 -m http.server 8000
```

puis ouvrir http://localhost:8000
