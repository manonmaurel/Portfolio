# Portfolio — Manon Maurel

Site statique (HTML / CSS / JavaScript, sans dépendance ni étape de build).

## Modifier le site sans toucher au code

Ouvrir **`/admin.html`** (à la suite de l'adresse du site). La page est verrouillée : elle ne s'ouvre
qu'avec une clé d'accès GitHub ayant le droit d'écrire dans ce dépôt (la marche à suivre est indiquée sur l'écran de connexion). On peut y :

- ajouter, modifier, réordonner ou supprimer des projets ;
- ajouter des images (redimensionnées automatiquement), les légender et les réordonner ;
- modifier les textes des pages « À propos », « Parcours » et « Contact » et les coordonnées.

Le bouton **Publier** enregistre les changements sur GitHub ; le site se met à jour en une à deux minutes.

## Organisation des fichiers

- `content/contenu.json` — **tout le contenu** : projets, textes, coordonnées (écrit par la page d'administration)
- `assets/img/` — images (`nom.jpg` ≈ 1800 px et sa vignette `nom-s.jpg` ≈ 800 px)
- `index.html`, `css/style.css`, `js/main.js` — le site
- `admin.html`, `js/admin.js` — la page d'administration

## Formulaire de contact

Par défaut, le formulaire ouvre la messagerie du visiteur avec le mail déjà rédigé.
Pour un envoi sans quitter le site, créer un formulaire sur formspree.io et coller son adresse
dans Admin → Infos & contact → « Adresse du service d'envoi ».

## Voir le site en local

```
python3 -m http.server 8000
```

puis ouvrir http://localhost:8000
