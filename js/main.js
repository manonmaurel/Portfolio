/* Le contenu du site est dans content/contenu.json
   (modifiable depuis la page admin.html, sans toucher au code). */
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
  const INFOS = DATA.infos || {};
  const CATS = [{ id: "tout", label: "tout" }, ...DATA.categories];
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
  $("#topRole").innerHTML = (SITE.role || []).map(esc).join("<br>");
  const mailto = "mailto:" + SITE.email;
  Object.assign($("#cMail"), { href: mailto, textContent: SITE.email });
  $("#contactTexte").textContent = INFOS.contactTexte || "";

  // Téléphone et LinkedIn : masqués, accessibles par un bouton discret
  const extras = [];
  if (SITE.telephone) extras.push(["Téléphone", "tel:" + SITE.telephone.replace(/\s/g, ""), SITE.telephone, ""]);
  if (SITE.linkedin) extras.push(["LinkedIn", SITE.linkedin, SITE.linkedinLabel || "LinkedIn", ' target="_blank" rel="noopener"']);
  if (extras.length) {
    const more = $("#more");
    more.hidden = false;
    more.addEventListener("click", () => {
      const open = more.getAttribute("aria-expanded") !== "true";
      more.setAttribute("aria-expanded", String(open));
      $("#extra").classList.toggle("is-open", open);
      // les coordonnées ne sont écrites dans la page qu'à la demande
      $("#extraList").innerHTML = open
        ? extras.map(([l, h, t, x]) => `<li><span class="mono label">${l}</span><a href="${esc(h)}"${x}>${esc(t)}</a></li>`).join("")
        : "";
    });
  }

  if (INFOS.portrait)
    $("#portrait").innerHTML = `<img src="${IMG}${esc(INFOS.portrait)}" alt="Portrait de ${esc(SITE.nom)}" loading="lazy">`;
  const cta = (label, titre, href) =>
    `<a class="infos__cta" href="${href}"><span class="mono label">${label}</span><span class="display">${titre} <i class="dotr">→</i></span></a>`;
  $("#infosText").innerHTML =
    (INFOS.accroche ? `<p class="lead">${esc(INFOS.accroche)}</p>` : "") +
    (INFOS.paragraphes || []).map((p) => `<p>${esc(p)}</p>`).join("") +
    (INFOS.signature ? `<p class="accent">${esc(INFOS.signature)}</p>` : "") +
    cta("Mon parcours", "Parcours", "#/parcours") +
    cta("Contact", "Écrivez-moi", "#/contact");

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
      ? `<h2 class="mono label">Le fil</h2><ol class="thread">` +
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
      ? `<h2 class="mono label">Ce que je peux vous apporter</h2><ol class="services">` +
        CV.services
          .map((x, i) => `<li class="service"><span class="service__n">${pad(i + 1)}</span><h3 class="service__title">${esc(x.titre)}</h3><p>${esc(x.texte)}</p></li>`)
          .join("") +
        `</ol>`
      : "") +
    cta("Disponible en freelance", "Travaillons ensemble", "#/contact");

  /* ---------- INDEX : ligne d'images ---------- */
  const strip = $("#strip");
  const pct = $("#pct");
  let n = 0;
  PROJETS.forEach((p) => {
    const items = p.images && p.images.length ? p.images : [null];
    items.forEach((im) => {
      n += 1;
      const a = el("a", "tile" + (im ? "" : " tile--soon"));
      a.href = "#/projet/" + p.id;
      a.dataset.cat = p.categorie;
      a.style.setProperty("--r", im && im.w && im.h ? (im.w / im.h).toFixed(4) : "0.75");
      a.style.setProperty("--i", n);
      a.draggable = false;
      a.setAttribute("aria-label", `${p.titre} — voir le projet`);
      a.innerHTML =
        `<span class="tile__cap"><span class="tile__num">${pad(n)}<i class="dotr">.</i></span>` +
        `<span class="tile__title">${esc(p.titre)}</span>` +
        `<span class="tile__cat">[${esc(catLabel(p.categorie))}]</span></span>` +
        `<span class="tile__media">` +
        (im
          ? `<img src="${IMG}${esc(small(im.src))}" alt="${esc(im.legende || p.titre)}" draggable="false" ${n > 8 ? 'loading="lazy"' : ""}>`
          : `À venir`) +
        `</span>`;
      strip.appendChild(a);
    });
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
      if (document.body.dataset.view !== "index") return;
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
    if (document.body.dataset.view !== "index") return;
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      if (!raf) target = strip.scrollLeft;
      glideTo(target + (e.key === "ArrowRight" ? 1 : -1) * strip.clientWidth * 0.45);
    }
  });

  const updatePct = () => {
    const m = maxScroll();
    pct.textContent = `[${pad(m > 0 ? Math.round((strip.scrollLeft / m) * 100) : 0, 3)}%]`;
  };
  strip.addEventListener("scroll", updatePct, { passive: true });
  window.addEventListener("resize", updatePct);

  /* ---------- Filtres ---------- */
  const filters = $("#filters");
  CATS.forEach((c, i) => {
    const b = el("button", null, esc(c.label));
    b.type = "button";
    b.dataset.cat = c.id;
    b.setAttribute("aria-pressed", String(c.id === "tout"));
    filters.appendChild(b);
    filters.appendChild(i < CATS.length - 1 ? el("span", "sep", ", ") : el("i", "dotr", "."));
  });
  filters.addEventListener("click", (e) => {
    const b = e.target.closest("button");
    if (!b) return;
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
    setTimeout(updatePct, 700);
  });

  /* ---------- Curseur ---------- */
  const cursor = $("#cursor");
  if (canHover) {
    window.addEventListener("mousemove", (e) => {
      cursor.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
      const over = e.target.closest && e.target.closest(".tile__media");
      cursor.classList.toggle("is-on", !!over && !strip.classList.contains("is-dragging"));
    });
    document.addEventListener("mouseleave", () => cursor.classList.remove("is-on"));
  }

  /* ---------- LISTE ---------- */
  const list = $("#list");
  PROJETS.forEach((p, i) => {
    const imgs = p.images || [];
    const li = el("li", "row" + (p.aVenir ? " row--soon" : ""));
    li.innerHTML =
      `<a class="row__link" href="#/projet/${p.id}">` +
      `<span class="row__title"><span class="row__num">P${pad(i + 1, 3)}</span>${esc(p.titre)}</span>` +
      `<span class="row__cat">${esc(catLabel(p.categorie))} — ${esc(p.medium)}</span>` +
      `<span class="row__year">${esc(p.annee)}</span>` +
      `<span class="row__arrow">${p.aVenir ? "À venir" : "(" + imgs.length + ")"}</span></a>` +
      (imgs.length
        ? `<a class="row__thumbs" href="#/projet/${p.id}" tabindex="-1" aria-hidden="true"><div>` +
          imgs.map((im) => `<img src="${IMG}${esc(small(im.src))}" width="${im.w}" height="${im.h}" alt="" loading="lazy">`).join("") +
          `</div></a>`
        : "");
    list.appendChild(li);
  });
  $("#listCount").textContent = `(${pad(PROJETS.length)}) projets`;

  /* ---------- PROJET ---------- */
  const projectEl = $("#project");
  const io =
    "IntersectionObserver" in window
      ? new IntersectionObserver(
          (entries) => entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); } }),
          { rootMargin: "0px 0px -8% 0px" }
        )
      : null;

  const renderProject = (p) => {
    const idx = PROJETS.indexOf(p);
    const next = PROJETS[(idx + 1) % PROJETS.length];
    const imgs = p.images || [];
    const media = imgs.length
      ? imgs
          .map((im, i) => {
            const portrait = im.h > im.w;
            return (
              `<figure class="shot reveal${portrait ? " shot--portrait" : ""}">` +
              `<span class="shot__n">(${i + 1})</span><div class="shot__img">` +
              `<img src="${IMG}${esc(im.src)}" width="${im.w}" height="${im.h}" alt="${esc(im.legende || p.titre + " — image " + (i + 1))}" ${i ? 'loading="lazy"' : ""}></div>` +
              (im.legende ? `<figcaption class="shot__cap mono">${esc(im.legende)}</figcaption>` : "") +
              `</figure>`
            );
          })
          .join("")
      : `<div class="project__soon mono">Bientôt en ligne</div>`;

    projectEl.innerHTML =
      `<div class="project__side">` +
      `<a class="project__back mono" href="#/">← Index</a>` +
      `<p class="mono">P${pad(idx + 1, 3)} / ${pad(PROJETS.length, 3)}</p>` +
      `<h1 class="display project__title${p.titre.length > 12 ? " is-long" : ""}">${esc(p.titre)}<i class="dotr">.</i></h1>` +
      `<dl class="project__meta mono">` +
      `<dt>Catégorie</dt><dd>${esc(catLabel(p.categorie))}</dd>` +
      (p.annee ? `<dt>Année</dt><dd>${esc(p.annee)}</dd>` : "") +
      (p.medium ? `<dt>Médium</dt><dd>${esc(p.medium)}</dd>` : "") +
      `</dl>` +
      `<p class="project__intro">${esc(p.intro)}</p>` +
      `<div class="project__text">${(p.texte || []).map((t) => `<p>${esc(t)}</p>`).join("")}</div>` +
      `</div>` +
      `<div class="project__media">${media}</div>` +
      `<a class="project__next" href="#/projet/${next.id}"><span class="mono label">Projet suivant</span>` +
      `<span class="display">${esc(next.titre)} <i class="dotr">→</i></span></a>`;

    $$(".reveal", projectEl).forEach((r) => (io ? io.observe(r) : r.classList.add("is-in")));
    document.title = `${p.titre} — ${SITE.nom}`;
  };

  /* ---------- CONTACT : formulaire ---------- */
  const form = $("#contactForm");
  const status = $("#formStatus");
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

    if (SITE.formulaire) {
      // Envoi direct via un service de formulaire (adresse réglée dans l'admin)
      const btn = $(".send", form);
      btn.disabled = true;
      say("Envoi en cours…");
      try {
        const r = await fetch(SITE.formulaire, {
          method: "POST",
          headers: { Accept: "application/json", "Content-Type": "application/json" },
          body: JSON.stringify({ nom, email, objet, message, _subject: objet }),
        });
        if (!r.ok) throw new Error(r.status);
        form.reset();
        say("Merci ! Votre message a bien été envoyé.", "is-ok");
      } catch (err) {
        say("L’envoi a échoué. Écrivez-moi directement : " + SITE.email, "is-bad");
      }
      btn.disabled = false;
      return;
    }
    // Sans service : ouvre la messagerie du visiteur avec le mail déjà rédigé
    const body = `${message}\n\n— ${nom}\n${email}`;
    location.href = `${mailto}?subject=${encodeURIComponent(objet)}&body=${encodeURIComponent(body)}`;
    say("Votre messagerie s’ouvre avec le message prêt à envoyer.", "is-ok");
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

    if (document.body.dataset.view === "index") stripLeft = strip.scrollLeft;
    if (proj) renderProject(proj);
    else document.title = `${SITE.nom} — Portfolio`;

    document.body.dataset.view = view;
    views.forEach((v) => (v.hidden = v.dataset.view !== view));
    $$("[data-nav]").forEach((a) =>
      a.dataset.nav === view ? a.setAttribute("aria-current", "page") : a.removeAttribute("aria-current")
    );
    cursor.classList.remove("is-on");
    setOn(null);
    if (view === "index") { strip.scrollLeft = stripLeft; target = stripLeft; updatePct(); }
    else window.scrollTo(0, 0);
  };
  window.addEventListener("hashchange", route);
  route();
})();
