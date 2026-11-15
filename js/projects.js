/* ------------------------------------------------------------------
   CONTENU DU SITE
   Tout le contenu (projets, textes, images) se modifie ici.

   Pour ajouter un projet :
   1. déposer les images dans assets/img/ (idéalement en .webp ou .jpg,
      une version large "nom.webp" et une petite "nom-s.webp" ~800px)
   2. copier un bloc ci-dessous et remplir les champs
   3. categorie : "creations" ou "ifm"
   Pour un projet pas encore prêt : aVenir: true (et images: []).
------------------------------------------------------------------- */

window.SITE = {
  nom: "Manon Maurel",
  email: "manonmaurel@orange.fr",
  telephone: "+33 6 51 05 31 30",
  linkedin: "https://www.linkedin.com/in/manonmaurel",
  linkedinLabel: "@manonmaurel",
};

window.CATEGORIES = [
  { id: "tout", label: "tout" },
  { id: "creations", label: "créations" },
  { id: "ifm", label: "projets ifm" },
];

window.PROJETS = [
  {
    id: "peinture",
    titre: "Peinture",
    categorie: "creations",
    annee: "2022 — 2024",
    medium: "Huile sur toile",
    intro:
      "Je peins principalement avec de la peinture à l’huile — toujours avec du rouge, et parfois une touche de bleu Majorelle.",
    texte: [
      "Le cœur a une forte importance dans mon univers, qu’il soit anatomique ou symbolique.",
    ],
    images: [
      { src: "peinture-balloon-heart", w: 1400, h: 1382, legende: "« Balloon heart » — août 2024" },
      { src: "peinture-boom", w: 1906, h: 2399, legende: "« Boom bleu majorelle » — décembre 2022" },
    ],
  },
  {
    id: "dessin",
    titre: "Dessin",
    categorie: "creations",
    annee: "2018 — 2020",
    medium: "Encre, pointillisme",
    intro:
      "Le réalisme est le style le plus présent dans mes créations, et notamment la représentation du corps humain.",
    texte: [
      "J’aime représenter la fragilité de la vie à travers la finesse de traits, rappelant la précarité de l’existence et la beauté de ce qui disparaît.",
    ],
    images: [
      { src: "dessin-01", w: 1393, h: 2399 },
      { src: "dessin-02", w: 1559, h: 2391 },
      { src: "dessin-03", w: 1619, h: 2399, legende: "« Young and alive »" },
      { src: "dessin-04", w: 1601, h: 2400 },
    ],
  },
  {
    id: "photographie",
    titre: "Photographie",
    categorie: "creations",
    annee: "Carnets de voyage",
    medium: "Photographie",
    intro:
      "Mes photos sont prises au cours de mes voyages. Ils sont ma plus grande source d’inspiration.",
    texte: [],
    images: [
      { src: "photo-antigua", w: 2400, h: 1350, legende: "Antigua, Guatemala" },
      { src: "photo-flores", w: 2399, h: 1439, legende: "Flores, Guatemala" },
      { src: "photo-desert", w: 1350, h: 2400 },
      { src: "photo-voiture", w: 1350, h: 2400 },
      { src: "photo-crepuscule", w: 1350, h: 2400 },
      { src: "photo-mer", w: 2161, h: 1216 },
      { src: "photo-cadenas", w: 1350, h: 2400 },
    ],
  },
  {
    id: "start",
    titre: "stArt.",
    categorie: "creations",
    annee: "2023",
    medium: "Identité visuelle, posters — Photoshop, Illustrator",
    intro:
      "Projet académique de création d’une marque de vêtements basée sur la personnalisation et la rénovation de pièces de seconde main.",
    texte: [
      "Le design graphique est ma dernière découverte, mais celle que je pratique le plus. J’aime créer des identités visuelles pour des marques — notamment de vêtements.",
      "Design de posters sur Photoshop et Illustrator.",
    ],
    images: [
      { src: "start-01", w: 1602, h: 2284 },
      { src: "start-02", w: 1602, h: 2276 },
      { src: "start-03", w: 1602, h: 2266 },
    ],
  },
  {
    id: "marque",
    titre: "Marque de vêtements",
    categorie: "creations",
    annee: "En cours",
    medium: "Identité de marque, sérigraphie textile",
    intro:
      "Projet personnel de création d’une marque de vêtements symbolisant l’attachement et la fluidité émotionnelle.",
    texte: [
      "La marque explore les émotions humaines, avec des vêtements qui sont à la fois confortables, esthétiques et respectueux de la nature.",
      "Premiers essais d’impression sérigraphique sur t-shirts. Création de premiers designs en accord avec les couleurs de la marque (rouge, beige et bleu roi).",
      "Logo et nom encore confidentiels.",
    ],
    images: [
      { src: "marque-tshirt", w: 720, h: 1280, video: "marque-tshirt", legende: "Essai de sérigraphie sur t-shirt" },
      { src: "marque-soffio", w: 768, h: 1024, legende: "« Un soffio d’amore »" },
      { src: "marque-spicing", w: 1536, h: 2048, legende: "« Spicing things up »" },
      { src: "marque-coeur", w: 596, h: 842 },
    ],
  },

  /* ---------- PROJETS IFM : à compléter ---------- */
  {
    id: "ifm-01",
    titre: "Projet IFM 01",
    categorie: "ifm",
    annee: "IFM",
    medium: "À compléter",
    aVenir: true,
    intro: "Projet réalisé à l’Institut Français de la Mode — bientôt en ligne.",
    texte: [],
    images: [],
  },
  {
    id: "ifm-02",
    titre: "Projet IFM 02",
    categorie: "ifm",
    annee: "IFM",
    medium: "À compléter",
    aVenir: true,
    intro: "Projet réalisé à l’Institut Français de la Mode — bientôt en ligne.",
    texte: [],
    images: [],
  },
];
