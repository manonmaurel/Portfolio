(() => {
  "use strict";

  const SITE = window.SITE;
  const CATS = window.CATEGORIES;
  const PROJETS = window.PROJETS;
  const IMG = "assets/img/";
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const pad = (n, l = 2) => String(n).padStart(l, "0");
  const catLabel = (id) => (CATS.find((c) => c.id === id) || {}).label || id;
  const el = (tag, cls, html) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  };
  const esc = (s) =>
    String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  /* ---------- Coordonnées ---------- */
  $("#year").textContent = new Date().getFullYear();
  const mailto = "mailto:" + SITE.email;
  Object.assign($("#topMail"), { href: mailto, textContent: SITE.email });
  Object.assign($("#cMail"), { href: mailto, textContent: SITE.email });
  Object.assign($("#cTel"), { href: "tel:" + SITE.telephone.replace(/\s/g, ""), textContent: SITE.telephone });
  Object.assign($("#cIn"), { href: SITE.linkedin, textContent: SITE.linkedinLabel });

  /* ---------- INDEX : bande ---------- */
  const strip = $("#strip");
  const pct = $("#pct");
  let n = 0;
  PROJETS.forEach((p) => {
    const items = p.images.length ? p.images : [null];
    items.forEach((im) => {
      n += 1;
      const a = el("a", "tile" + (im ? "" : " tile--soon"));
      a.href = "#/projet/" + p.id;
      a.dataset.cat = p.categorie;
      a.style.setProperty("--r", im ? (im.w / im.h).toFixed(4) : "0.75");
      a.style.setProperty("--i", n);
      a.draggable = false;
      a.setAttribute("aria-label", `${p.titre} — voir le projet`);
      a.innerHTML =
        `<span class="tile__cap"><span class="tile__num">${pad(n)}.</span>` +
        `<span class="tile__title">${esc(p.titre)}</span>` +
        `<span class="tile__cat">[${esc(catLabel(p.categorie))}]</span></span>` +
        `<span class="tile__media">` +
        (im
          ? `<img src="${IMG}${im.src}-s.webp" width="${im.w}" height="${im.h}" alt="${esc(im.legende || p.titre)}" draggable="false" ${n > 6 ? 'loading="lazy"' : ""}>`
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
    if (i < CATS.length - 1) filters.appendChild(el("span", "sep", ", "));
  });
  filters.addEventListener("click", (e) => {
    const b = e.target.closest("button");
    if (!b) return;
    $$("button", filters).forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
    const cat = b.dataset.cat;
    tiles.forEach((t) => t.classList.toggle("is-out", cat !== "tout" && t.dataset.cat !== cat));
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
    const li = el("li", "row" + (p.aVenir ? " row--soon" : ""));
    li.innerHTML =
      `<a class="row__link" href="#/projet/${p.id}">` +
      `<span class="row__title"><span class="row__num">P${pad(i + 1, 3)}</span>${esc(p.titre)}</span>` +
      `<span class="row__cat">${esc(catLabel(p.categorie))} — ${esc(p.medium)}</span>` +
      `<span class="row__year">${esc(p.annee)}</span>` +
      `<span class="row__arrow">${p.aVenir ? "À venir" : "(" + p.images.length + ")"}</span></a>` +
      (p.images.length
        ? `<a class="row__thumbs" href="#/projet/${p.id}" tabindex="-1" aria-hidden="true"><div>` +
          p.images.map((im) => `<img src="${IMG}${im.src}-s.webp" width="${im.w}" height="${im.h}" alt="" loading="lazy">`).join("") +
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
    const media = p.images.length
      ? p.images
          .map((im, i) => {
            const portrait = im.h > im.w;
            const inner = im.video
              ? `<video src="assets/video/${im.video}.mp4" poster="${IMG}${im.src}.webp" width="${im.w}" height="${im.h}" autoplay muted loop playsinline></video>`
              : `<img src="${IMG}${im.src}.webp" width="${im.w}" height="${im.h}" alt="${esc(im.legende || p.titre + " — image " + (i + 1))}" ${i ? 'loading="lazy"' : ""}>`;
            return (
              `<figure class="shot reveal${portrait ? " shot--portrait" : ""}">` +
              `<span class="shot__n">(${i + 1})</span><div class="shot__img">${inner}</div>` +
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
      `<h1 class="display project__title${p.titre.length > 12 ? " is-long" : ""}">${esc(p.titre)}</h1>` +
      `<dl class="project__meta mono">` +
      `<dt>Catégorie</dt><dd>${esc(catLabel(p.categorie))}</dd>` +
      `<dt>Année</dt><dd>${esc(p.annee)}</dd>` +
      `<dt>Médium</dt><dd>${esc(p.medium)}</dd></dl>` +
      `<p class="project__intro">${esc(p.intro)}</p>` +
      `<div class="project__text">${p.texte.map((t) => `<p>${esc(t)}</p>`).join("")}</div>` +
      `</div>` +
      `<div class="project__media">${media}</div>` +
      `<a class="project__next" href="#/projet/${next.id}"><span class="mono label">Projet suivant</span>` +
      `<span class="display">${esc(next.titre)} →</span></a>`;

    $$(".reveal", projectEl).forEach((r) => (io ? io.observe(r) : r.classList.add("is-in")));
    document.title = `${p.titre} — ${SITE.nom}`;
  };

  /* ---------- Routeur (#/, #/liste, #/infos, #/projet/id) ---------- */
  const views = $$(".view");
  let stripLeft = 0;
  const route = () => {
    const parts = location.hash.replace(/^#\/?/, "").split("/").filter(Boolean);
    let view = parts[0] || "index";
    let proj = null;
    if (view === "projet") {
      proj = PROJETS.find((p) => p.id === parts[1]);
      if (!proj) view = "index";
    } else if (!["index", "liste", "infos"].includes(view)) view = "index";

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
