# Portfolio — Manon Maurel

Site statique (HTML / CSS / JavaScript, sans dépendance ni étape de build).

- `content/contenu.json` — tout le contenu : projets, textes des pages
- `assets/img/` — images (`nom.jpg` ≈ 1800 px et sa vignette `nom-s.jpg` ≈ 800 px)
- `index.html`, `css/style.css`, `js/main.js` — le site

Le site publié est en lecture seule : il ne contient aucune page d'administration.
Le contenu se modifie avec un outil séparé, conservé par la propriétaire du site.

## Voir le site en local

```
python3 -m http.server 8000
```

puis ouvrir http://localhost:8000
