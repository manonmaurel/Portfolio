/* Le contenu du site est dans content/contenu.json
   (projets, textes et images : rien à modifier dans ce fichier). */
(async () => {
  "use strict";

  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];

  let DATA;
  try {
    const r = await fetch("content/contenu.json", { cache: "no-cache" });
    if (!r.ok) throw new Error(r.status);
    DATA = await r.json();
  } catch (e) {
    $("#strip").innerHTML = '<p class="mono" style="margin:auto">Impossible de charger le contenu.</p>';
    return;
  }

  const SITE = DATA.site;
  // Intitulés du site (modifiables dans l'éditeur) et leurs valeurs par défaut
  const T = Object.assign({"nav_index": "Index", "nav_liste": "Liste", "nav_infos": "À propos", "nav_parcours": "Parcours", "nav_contact": "Écrivez-moi", "filtre_tout": "tout", "voir_projet": "Voir le projet", "a_venir": "À venir", "titre_liste": "Liste", "compte_projets": "projets", "titre_infos": "À propos", "lien_parcours_label": "Mon parcours", "lien_parcours": "Parcours", "lien_contact_label": "Contact", "lien_contact": "Écrivez-moi", "titre_parcours": "Parcours", "fil": "Le fil", "services": "Ce que je peux vous apporter", "cta_label": "Disponible en freelance", "cta": "Travaillons ensemble", "titre_contact": "Écrivez-moi", "linkedin": "LinkedIn", "form_nom": "Votre nom", "form_email": "Votre e-mail", "form_objet": "Objet", "form_message": "Votre message", "form_envoyer": "Envoyer le message", "form_ok": "Merci ! Votre message a bien été envoyé.", "retour": "Index", "bientot": "Bientôt en ligne", "projet_suivant": "Projet suivant", "en_savoir_plus": "En savoir plus", "roue_aide": "Faites défiler pour parcourir, cliquez sur l’image de devant pour l’agrandir", "fermer": "Fermer", "ouvrir_pdf": "Ouvrir le PDF"}, DATA.textes);
  document.querySelectorAll("[data-t]").forEach((e) => { if (T[e.dataset.t]) e.textContent = T[e.dataset.t]; });
  const INFOS = DATA.infos || {};
  const CATS = [{ id: "tout", label: T.filtre_tout }, ...DATA.categories];
  const PROJETS = DATA.projets;
  const IMG = "assets/img/";
  const small = (src) => src.replace(/(\.[a-z0-9]+)$/i, "-s$1");
  const pad = (n, l = 2) => String(n).padStart(l, "0");
  const catLabel = (id) => (CATS.find((c) => c.id === id) || {}).label || id;
  const el = (tag, cls, html) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  };
  const esc = (s) =>
    String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  /* ---------- En-tête, infos, coordonnées ---------- */
  $("#year").textContent = new Date().getFullYear();
  $("#topName").textContent = SITE.nom;
  $("#topRole").textContent = (SITE.role || []).join(" — ");
  $("#contactTexte").textContent = INFOS.contactTexte || "";
  if (SITE.linkedin) Object.assign($("#cIn"), { href: SITE.linkedin, hidden: false });

  if (INFOS.portrait)
    $("#portrait").innerHTML = `<img src="${IMG}${esc(INFOS.portrait)}" alt="Portrait de ${esc(SITE.nom)}" loading="lazy">`;
  const cta = (label, titre, href) =>
    `<a class="infos__cta" href="${href}"><span class="mono label">${label}</span><span class="display">${titre} <i class="dotr">→</i></span></a>`;
  $("#infosText").innerHTML =
    (INFOS.accroche ? `<p class="lead">${esc(INFOS.accroche)}</p>` : "") +
    (INFOS.paragraphes || []).map((p) => `<p>${esc(p)}</p>`).join("") +
    (INFOS.signature ? `<p class="accent">${esc(INFOS.signature)}</p>` : "") +
    cta(esc(T.lien_parcours_label), esc(T.lien_parcours), "#/parcours") +
    cta(esc(T.lien_contact_label), esc(T.lien_contact), "#/contact");

  /* ---------- PARCOURS ---------- */
  const CV = DATA.parcours || {};
  if (CV.portrait)
    $("#cvPortrait").innerHTML = `<img src="${IMG}${esc(CV.portrait)}" alt="${esc(SITE.nom)}" loading="lazy">`;
  $("#cvMain").innerHTML =
    (CV.accroche ? `<p class="lead">${esc(CV.accroche)}</p>` : "") +
    ((CV.reperes || []).length
      ? `<dl class="rep">${CV.reperes.map((r) => `<div><dt>${esc(r.label)}</dt><dd>${esc(r.valeur)}</dd></div>`).join("")}</dl>`
      : "") +
    ((CV.etapes || []).length
      ? `<h2 class="mono label">${esc(T.fil)}</h2><ol class="thread">` +
        CV.etapes
          .map(
            (e) =>
              `<li class="step">` +
              (e.periode ? `<p class="step__when">${esc(e.periode)}</p>` : "") +
              `<h3 class="step__title">${esc(e.titre)}</h3>` +
              (e.lieu ? `<p class="step__where">${esc(e.lieu)}</p>` : "") +
              (e.texte ? `<p class="step__text">${esc(e.texte)}</p>` : "") +
              `</li>`
          )
          .join("") +
        `</ol>`
      : "") +
    ((CV.services || []).length
      ? `<h2 class="mono label">${esc(T.services)}</h2><ol class="services">` +
        CV.services
          .map((x, i) => `<li class="service"><span class="service__n">${pad(i + 1)}</span><h3 class="service__title">${esc(x.titre)}</h3><p>${esc(x.texte)}</p></li>`)
          .join("") +
        `</ol>`
      : "") +
    cta(esc(T.cta_label), esc(T.cta), "#/contact");

  /* ---------- INDEX : une image de couverture par projet ---------- */
  const strip = $("#strip");
  const cover = (p) => (p.images || []).find((im) => im.src);
  PROJETS.forEach((p, n) => {
    const im = cover(p);
    const a = el("a", "tile" + (im ? "" : " tile--soon"));
    a.href = "#/projet/" + p.id;
    a.dataset.cat = p.categorie;
    a.style.setProperty("--r", im && im.w && im.h ? (im.w / im.h).toFixed(4) : "0.75");
    a.style.setProperty("--i", n + 1);
    a.draggable = false;
    a.setAttribute("aria-label", `${p.titre} — voir le projet`);
    a.innerHTML =
      `<span class="tile__cap"><span class="tile__title">${esc(p.titre)}</span>` +
      `<span class="tile__cat">[${esc(catLabel(p.categorie))}]</span></span>` +
      `<span class="tile__media">` +
      (im ? `<img src="${IMG}${esc(small(im.src))}" alt="${esc(p.titre)}" draggable="false">` : esc(T.a_venir)) +
      `</span>`;
    strip.appendChild(a);
  });
  const tiles = $$(".tile", strip);

  // Survol : la vignette s'agrandit
  const setOn = (t) => {
    tiles.forEach((x) => x.classList.toggle("is-on", x === t));
    strip.classList.toggle("has-on", !!t);
  };
  if (canHover) {
    tiles.forEach((t) => {
      t.addEventListener("mouseenter", () => !strip.classList.contains("is-dragging") && setOn(t));
      t.addEventListener("focus", () => setOn(t));
    });
    strip.addEventListener("mouseleave", () => setOn(null));
  }

  // La courbe : chaque vignette est placée à l'intérieur d'un cylindre,
  // plus elle s'éloigne du centre de l'écran, plus elle avance et pivote vers nous.
  const ANGLE = (26 * Math.PI) / 180; // angle atteint au bord de l'écran
  const curve = () => {
    if (document.body.dataset.view === "index") {
      const half = strip.clientWidth / 2;
      const R = half / ANGLE; // rayon du cylindre
      const sl = strip.scrollLeft;
      for (const t of tiles) {
        if (t.classList.contains("is-out")) continue;
        const s = t.offsetLeft + t.offsetWidth / 2 - sl - half; // distance au centre, le long de l'arc
        const a = Math.max(-1, Math.min(1, s / R));
        const x = R * Math.sin(a) - R * a;
        const z = R * (1 - Math.cos(a));
        t.style.transform = `translateX(${x.toFixed(1)}px) translateZ(${z.toFixed(1)}px) rotateY(${(-a * 57.2958).toFixed(2)}deg)`;
      }
    }
    requestAnimationFrame(curve);
  };
  requestAnimationFrame(curve);

  // Défilement fluide : molette verticale -> horizontal, glisser à la souris, flèches
  let target = 0;
  let raf = 0;
  const maxScroll = () => strip.scrollWidth - strip.clientWidth;
  const clamp = (v) => Math.max(0, Math.min(maxScroll(), v));
  const tick = () => {
    const d = target - strip.scrollLeft;
    if (Math.abs(d) < 0.6) { strip.scrollLeft = target; raf = 0; return; }
    strip.scrollLeft += d * 0.12;
    raf = requestAnimationFrame(tick);
  };
  const glideTo = (v) => { target = clamp(v); if (!raf) raf = requestAnimationFrame(tick); };

  window.addEventListener(
    "wheel",
    (e) => {
      if (document.body.dataset.view !== "index" || wheelOpen()) return;
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) { target = strip.scrollLeft; return; } // trackpad horizontal : natif
      e.preventDefault();
      const unit = e.deltaMode === 1 ? 32 : 1;
      if (!raf) target = strip.scrollLeft;
      glideTo(target + e.deltaY * unit * 1.4);
    },
    { passive: false }
  );

  let drag = null;
  strip.addEventListener("pointerdown", (e) => {
    if (e.pointerType !== "mouse" || e.button !== 0) return;
    drag = { x: e.clientX, left: strip.scrollLeft, moved: false, lastX: e.clientX, v: 0 };
    cancelAnimationFrame(raf); raf = 0;
  });
  window.addEventListener("pointermove", (e) => {
    if (!drag) return;
    const dx = e.clientX - drag.x;
    if (!drag.moved && Math.abs(dx) > 5) { drag.moved = true; strip.classList.add("is-dragging"); setOn(null); }
    if (drag.moved) {
      drag.v = e.clientX - drag.lastX; drag.lastX = e.clientX;
      strip.scrollLeft = drag.left - dx;
    }
  });
  window.addEventListener("pointerup", () => {
    if (!drag) return;
    const d = drag; drag = null;
    if (d.moved) {
      glideTo(strip.scrollLeft - d.v * 14); // inertie
      setTimeout(() => strip.classList.remove("is-dragging"), 0);
    }
  });
  strip.addEventListener("click", (e) => { if (strip.classList.contains("is-dragging")) e.preventDefault(); }, true);
  strip.addEventListener("dragstart", (e) => e.preventDefault());

  window.addEventListener("keydown", (e) => {
    if (document.body.dataset.view !== "index" || wheelOpen()) return;
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      if (!raf) target = strip.scrollLeft;
      glideTo(target + (e.key === "ArrowRight" ? 1 : -1) * strip.clientWidth * 0.45);
    }
  });

  /* ---------- Filtres ---------- */
  const filters = $("#filters");
  CATS.forEach((c, i) => {
    const b = el("button", null, esc(c.label));
    b.type = "button";
    b.dataset.cat = c.id;
    b.setAttribute("aria-pressed", String(c.id === "tout"));
    filters.appendChild(b);
    if (i < CATS.length - 1) filters.appendChild(el("span", "sep", ", "));
  });
  filters.addEventListener("click", (e) => {
    const b = e.target.closest("button");
    if (!b) return;
    if (wheelOpen()) location.hash = "#/";
    $$("button", filters).forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
    const cat = b.dataset.cat;
    tiles.forEach((t) => {
      const out = cat !== "tout" && t.dataset.cat !== cat;
      t.classList.toggle("is-out", out);
      if (out) t.style.transform = "";
    });
    setOn(null);
    cancelAnimationFrame(raf); raf = 0; target = 0;
    strip.scrollTo({ left: 0, behavior: "smooth" });
  });

  /* ---------- Curseur ---------- */
  const cursor = $("#cursor");
  if (canHover) {
    window.addEventListener("mousemove", (e) => {
      cursor.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
      const over = e.target.closest && e.target.closest(".tile__media");
      cursor.classList.toggle("is-on", !!over && !strip.classList.contains("is-dragging") && !wheelOpen());
    });
    document.addEventListener("mouseleave", () => cursor.classList.remove("is-on"));
  }

  /* ---------- LISTE ---------- */
  const list = $("#list");
  PROJETS.forEach((p, i) => {
    const imgs = p.images || [];
    const thumbs = imgs.filter((im) => im.src);
    const li = el("li", "row" + (p.aVenir ? " row--soon" : ""));
    li.innerHTML =
      `<a class="row__link" href="#/projet/${p.id}">` +
      `<span class="row__title"><span class="row__num">P${pad(i + 1, 3)}</span>${esc(p.titre)}</span>` +
      `<span class="row__cat">${esc(catLabel(p.categorie))} — ${esc(p.medium)}</span>` +
      `<span class="row__year">${esc(p.annee)}</span>` +
      `<span class="row__arrow">${p.aVenir ? esc(T.a_venir) : "(" + imgs.length + ")"}</span></a>` +
      (thumbs.length
        ? `<a class="row__thumbs" href="#/projet/${p.id}" tabindex="-1" aria-hidden="true"><div>` +
          thumbs.map((im) => `<img src="${IMG}${esc(small(im.src))}" width="${im.w}" height="${im.h}" alt="" loading="lazy">`).join("") +
          `</div></a>`
        : "");
    list.appendChild(li);
  });
  $("#listCount").textContent = `(${pad(PROJETS.length)}) ${T.compte_projets}`;

  /* ---------- PROJET : pile de cartes ---------- */
  // Au clic sur un projet, ses images et documents s'affichent en pile, en perspective, sur l'accueil.
  // On les fait défiler à la molette, au glisser ou aux flèches ; la carte de devant est mise en avant.
  const wheel = $("#wheel");
  const wview = $("#view-projet"); // zone de la pile, dans l'accueil
  const wheelOpen = () => document.body.classList.contains("is-wheel");
  const info = $("#wheelInfo");
  const lb = $("#lb");
  const W = { p: null, items: [], els: [], step: 1, full: false, rot: 0, target: 0, active: -1, drag: null, snapT: 0 };

  const renderProject = (p) => {
    const items = p.images || [];
    const n = items.length;
    // les cartes arrivent depuis la pile de droite
    Object.assign(W, { p, items, rot: 1.5, target: 0, active: -1 });
    wheel.innerHTML = items
      .map(
        (im, i) =>
          `<button type="button" class="wi${im.src ? "" : " wi--blank"}" data-i="${i}" ` +
          `aria-label="${esc(im.legende || `${p.titre}, ${im.pdf ? "document" : "image"} ${i + 1}`)}">` +
          (im.src ? `<img src="${IMG}${esc(small(im.src))}" alt="" draggable="false">` : `<span>PDF</span>`) +
          (im.pdf && im.src ? `<i class="wi__tag">PDF</i>` : "") +
          `</button>`
      )
      .join("");
    W.els = $$(".wi", wheel);
    const texte = (p.texte || []).filter(Boolean);
    info.innerHTML =
      `<p class="mono wheel__cat">${[catLabel(p.categorie), p.annee, p.medium].filter(Boolean).map(esc).join(" — ")}</p>` +
      `<h1 class="wheel__title">${esc(p.titre)}</h1>` +
      (p.intro ? `<p class="wheel__intro">${esc(p.intro)}</p>` : "") +
      (texte.length
        ? `<div class="wheel__more" hidden>${texte.map((t) => `<p>${esc(t)}</p>`).join("")}</div>` +
          `<button type="button" class="wheel__toggle" aria-expanded="false">${esc(T.en_savoir_plus)}</button>`
        : "");
    // la légende de l'image affichée, en rouge, juste sous la carte
    $("#wheelLegend").textContent = n ? "" : T.bientot;
    wview.classList.toggle("is-empty", !n);
    document.title = `${p.titre} — ${SITE.nom}`;
  };
  info.addEventListener("click", (e) => {
    const b = e.target.closest(".wheel__toggle");
    if (!b) return;
    const more = $(".wheel__more", info);
    more.hidden = !more.hidden;
    b.setAttribute("aria-expanded", String(!more.hidden));
  });

  // Taille et position des cartes, d'après la place libre entre l'en-tête et « tout, créations, projets »
  const geom = () => {
    const w = wheel.clientWidth;
    const h = wheel.clientHeight;
    const topH = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--top-h")) || 72;
    const mobile = w < 700;
    const avail = h - topH - (mobile ? 280 : 235); // on garde de la place pour le texte sous les cartes
    const ch = Math.max(170, Math.min(avail, mobile ? w * 0.95 : 520));
    const cw = ch * 0.8;
    return {
      h, ch, cw, mobile,
      cx: w / 2,
      cy: topH + (mobile ? 50 : 18) + ch / 2,
      maxW: mobile ? w - 40 : w * 0.5,
      first: mobile ? cw * 0.62 : cw * 0.78, // décalage de la première carte en attente
      gap: cw * (mobile ? 0.14 : 0.24), // écart entre les cartes empilées
      depth: mobile ? 50 : 80,
      ang: mobile ? 38 : 34, // inclinaison des cartes en attente, comme sur la référence
      max: mobile ? 4 : 7,
    };
  };
  const clampT = (t) => Math.max(0, Math.min(W.items.length - 1, t));
  const snap = () => { W.target = clampT(Math.round(W.target)); };
  const goTo = (i) => { if (W.items.length) W.target = clampT(i); };

  const frame = () => {
    if (wheelOpen() && W.els.length) {
      W.rot += (W.target - W.rot) * 0.14;
      if (Math.abs(W.target - W.rot) < 0.002) W.rot = W.target;
      const g = geom();
      wview.style.setProperty("--cy", g.cy + "px");
      wview.style.setProperty("--ch", g.ch + "px");
      wview.style.setProperty("--h", g.h + "px");
      W.els.forEach((e, i) => {
        // la carte garde les proportions de son image
        const im = W.items[i];
        const r = Math.max(0.62, Math.min(1.5, im.w && im.h ? im.w / im.h : 0.8));
        const cw = Math.min(g.ch * r, g.maxW);
        e.style.width = cw.toFixed(1) + "px";
        e.style.height = (cw / r).toFixed(1) + "px";

        const k = i - W.rot; // 0 = carte affichée, positif = en attente à droite, négatif = déjà vue
        let x, z, a, op;
        if (k >= 0) {
          // la carte affichée est droite et centrée ; les suivantes s'empilent à droite, inclinées
          const t = Math.min(k, 1);
          x = g.cx + t * g.first + Math.max(0, k - 1) * g.gap;
          z = -t * 140 - Math.max(0, k - 1) * g.depth;
          a = t * g.ang;
          op = k > g.max ? Math.max(0, 1 - (k - g.max)) : 1;
        } else {
          // les cartes déjà vues glissent vers la gauche et s'effacent
          x = g.cx + k * g.cw * 0.9;
          z = k * 60;
          a = Math.max(-1, k) * -12;
          op = Math.max(0, 1 + k * 1.4);
        }
        e.style.transform = `translate3d(${x.toFixed(1)}px, ${g.cy.toFixed(1)}px, ${z.toFixed(1)}px) translate(-50%, -50%) rotateY(${a.toFixed(2)}deg)`;
        e.style.opacity = op.toFixed(3);
        e.style.visibility = op < 0.01 ? "hidden" : "";
        e.style.zIndex = 1000 - Math.round(Math.abs(k) * 10);
      });
      const ai = Math.max(0, Math.min(W.items.length - 1, Math.round(W.rot)));
      if (ai !== W.active) {
        W.active = ai;
        W.els.forEach((e, i) => e.classList.toggle("is-active", i === ai));
        const lg = $("#wheelLegend");
        if (lg) lg.textContent = W.items[ai].legende || "";
      }
    }
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);

  wview.addEventListener(
    "wheel",
    (e) => {
      if (e.target.closest(".wheel__info") && info.scrollHeight > info.clientHeight) return; // laisse défiler le texte
      e.preventDefault();
      const d = (Math.abs(e.deltaY) >= Math.abs(e.deltaX) ? e.deltaY : e.deltaX) * (e.deltaMode === 1 ? 32 : 1);
      W.target = clampT(W.target + d * 0.005);
      clearTimeout(W.snapT);
      W.snapT = setTimeout(snap, 180);
    },
    { passive: false }
  );
  wview.addEventListener("pointerdown", (e) => {
    if (e.button || e.target.closest("a, .wheel__toggle")) return;
    W.drag = { x: e.clientX, t: W.target, moved: false, lx: e.clientX, v: 0 };
  });
  window.addEventListener("pointermove", (e) => {
    const d = W.drag;
    if (!d) return;
    const dx = e.clientX - d.x;
    if (!d.moved && Math.abs(dx) > 6) { d.moved = true; wheel.classList.add("is-dragging"); }
    if (d.moved) {
      W.target = clampT(d.t - dx / (geom().cw * 0.7));
      d.v = e.clientX - d.lx;
      d.lx = e.clientX;
    }
  });
  const endDrag = () => {
    const d = W.drag;
    W.drag = null;
    if (!d || !d.moved) return;
    W.target = clampT(W.target - (d.v * 4) / (geom().cw * 0.7)); // inertie
    snap();
    setTimeout(() => wheel.classList.remove("is-dragging"), 0);
  };
  window.addEventListener("pointerup", endDrag);
  window.addEventListener("pointercancel", endDrag);
  wheel.addEventListener("click", (e) => {
    if (wheel.classList.contains("is-dragging")) return;
    const b = e.target.closest(".wi");
    if (!b) return;
    const i = +b.dataset.i;
    if (i === W.active) openLb(i);
    else goTo(i);
  });

  /* Agrandissement d'une image ou d'un PDF */
  const lbMedia = $("#lbMedia");
  const lbCap = $("#lbCap");
  let lbI = 0;
  let lbReturn = null;
  const openLb = (i) => {
    const im = W.items[i];
    if (!im) return;
    lbI = i;
    goTo(i);
    const big = window.innerWidth > 820;
    if (im.pdf) {
      const url = IMG + im.pdf;
      lbMedia.innerHTML = big
        ? `<iframe src="${esc(url)}#view=FitH" title="${esc(im.legende || W.p.titre)}"></iframe>`
        : im.src ? `<img src="${IMG}${esc(im.src)}" alt="${esc(im.legende || W.p.titre)}">` : "";
      lbCap.innerHTML =
        (im.legende ? `<span>${esc(im.legende)}</span>` : "") +
        `<a class="lb__open" href="${esc(url)}" target="_blank" rel="noopener">${esc(T.ouvrir_pdf)}</a>`;
    } else {
      lbMedia.innerHTML = `<img src="${IMG}${esc(im.src)}" alt="${esc(im.legende || W.p.titre)}">`;
      lbCap.textContent = im.legende || "";
    }
    lb.classList.toggle("is-pdf", !!im.pdf && big);
    $$(".lb__nav", lb).forEach((b) => (b.style.visibility = W.items.length > 1 ? "" : "hidden"));
    if (lb.hidden) {
      lbReturn = document.activeElement;
      lb.hidden = false;
      $(".lb__close", lb).focus();
    }
  };
  const closeLb = () => {
    if (lb.hidden) return;
    lb.hidden = true;
    lbMedia.innerHTML = "";
    if (lbReturn && lbReturn.focus) lbReturn.focus();
  };
  const lbGo = (d) => { const n = W.items.length; openLb((lbI + d + n) % n); };
  lb.addEventListener("click", (e) => {
    const b = e.target.closest("[data-lb]");
    if (b) {
      if (b.dataset.lb === "close") closeLb();
      else lbGo(b.dataset.lb === "next" ? 1 : -1);
      return;
    }
    if (e.target === lb || e.target.classList.contains("lb__media")) closeLb();
  });
  window.addEventListener("keydown", (e) => {
    if (!wheelOpen()) return;
    if (!lb.hidden) {
      if (e.key === "Escape") closeLb();
      else if (e.key === "ArrowRight") lbGo(1);
      else if (e.key === "ArrowLeft") lbGo(-1);
      return;
    }
    if (e.key === "Escape") { location.hash = "#/"; return; }
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      const n = W.items.length;
      if (!n) return;
      let i = W.active + (e.key === "ArrowRight" ? 1 : -1);
      if (W.full) i = (i + n) % n;
      goTo(i);
    }
  });

  /* ---------- CONTACT : formulaire ---------- */
  const form = $("#contactForm");
  const status = $("#formStatus");
  form.hidden = !SITE.formulaire;
  const say = (msg, cls) => { status.textContent = msg; status.className = "mono form__status" + (cls ? " " + cls : ""); };
  form.addEventListener("input", (e) => {
    const field = e.target.closest(".field");
    if (field && e.target.checkValidity()) field.classList.remove("is-bad");
  });
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const f = new FormData(form);
    if (f.get("_gotcha")) return; // anti-robots
    let bad = false;
    $$(".field", form).forEach((field) => {
      const input = $("input, textarea", field);
      const invalid = !input.checkValidity();
      field.classList.toggle("is-bad", invalid);
      bad = bad || invalid;
    });
    if (bad) return say("Merci de compléter les champs en rouge.", "is-bad");

    const nom = f.get("nom").trim();
    const email = f.get("email").trim();
    const objet = f.get("objet").trim() || "Prise de contact via le portfolio";
    const message = f.get("message").trim();

    const btn = $(".send", form);
    btn.disabled = true;
    say("Envoi en cours…");
    try {
      // Le message part vers un service d'envoi qui le transmet par mail :
      // l'adresse de destination n'apparaît nulle part sur le site.
      const cible = SITE.formulaire.trim();
      let url, body;
      if (cible.startsWith("fs:")) {
        // FormSubmit : la destination est stockée encodée et n'est reconstituée qu'au moment de l'envoi
        url = "https://formsubmit.co/ajax/" + atob(cible.slice(3)).split("").reverse().join("");
        body = { name: nom, email, message, _subject: objet, _template: "box", _captcha: "false" };
      } else if (cible.startsWith("http")) {
        url = cible; // Formspree
        body = { nom, email, objet, message, _subject: objet };
      } else {
        url = "https://api.web3forms.com/submit"; // clé Web3Forms
        body = { access_key: cible, name: nom, email, subject: objet, message, from_name: "Portfolio — " + SITE.nom };
      }
      const r = await fetch(url, {
        method: "POST",
        headers: { Accept: "application/json", "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const res = await r.json().catch(() => ({}));
      if (!r.ok || res.success === false || res.success === "false") throw new Error(r.status);
      form.reset();
      say(T.form_ok, "is-ok");
    } catch (err) {
      say("L’envoi a échoué. Merci de réessayer dans un instant.", "is-bad");
    }
    btn.disabled = false;
  });

  /* ---------- Routeur (#/, #/liste, #/infos, #/contact, #/projet/id) ---------- */
  const views = $$(".view");
  let stripLeft = 0;
  const route = () => {
    const parts = location.hash.replace(/^#\/?/, "").split("/").filter(Boolean);
    let view = parts[0] || "index";
    let proj = null;
    if (view === "projet") {
      proj = PROJETS.find((p) => p.id === parts[1]);
      if (!proj) view = "index";
    } else if (!["index", "liste", "infos", "parcours", "contact"].includes(view)) view = "index";

    if (document.body.dataset.view === "index" && !wheelOpen()) stripLeft = strip.scrollLeft;
    if (proj) renderProject(proj);
    else document.title = `${SITE.nom} — Portfolio`;
    if (view === "projet") view = "index";
    document.body.classList.toggle("is-wheel", !!proj);
    wview.setAttribute("aria-hidden", String(!proj));

    document.body.dataset.view = view;
    views.forEach((v) => (v.hidden = v.dataset.view !== view));
    $$("[data-nav]").forEach((a) =>
      a.dataset.nav === view ? a.setAttribute("aria-current", "page") : a.removeAttribute("aria-current")
    );
    cursor.classList.remove("is-on");
    closeLb();
    setOn(null);
    if (view === "index" && !proj) { strip.scrollLeft = stripLeft; target = stripLeft; }
    else window.scrollTo(0, 0);
  };
  window.addEventListener("hashchange", route);
  route();
})();
