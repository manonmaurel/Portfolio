/* Page d'administration : modifie content/contenu.json et ajoute des images
   dans assets/img/, puis enregistre le tout sur GitHub (bouton « Publier »). */
(async () => {
  "use strict";

  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const esc = (s) =>
    String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const small = (src) => src.replace(/(\.[a-z0-9]+)$/i, "-s$1");
  const CONTENT = "content/contenu.json";
  const IMG = "assets/img/";

  /* ---------- Réglages (gardés dans ce navigateur) ---------- */
  const store = {
    get: (k) => { try { return localStorage.getItem("pf_" + k) || ""; } catch (e) { return ""; } },
    set: (k, v) => { try { localStorage.setItem("pf_" + k, v); } catch (e) {} },
  };
  const guess = () => {
    const h = location.hostname;
    if (h.endsWith(".github.io")) {
      const owner = h.split(".")[0];
      return { owner, repo: location.pathname.split("/").filter(Boolean)[0] || h };
    }
    return { owner: "noninette", repo: "Portfolio" };
  };
  const cfg = {
    token: store.get("token"),
    owner: store.get("owner") || guess().owner,
    repo: store.get("repo") || guess().repo,
    branch: store.get("branch"),
  };

  /* ---------- GitHub ---------- */
  const gh = async (path, opts = {}) => {
    const r = await fetch(`https://api.github.com/repos/${cfg.owner}/${cfg.repo}${path}`, {
      ...opts,
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: "Bearer " + cfg.token,
        "X-GitHub-Api-Version": "2022-11-28",
        ...(opts.body ? { "Content-Type": "application/json" } : {}),
      },
    });
    if (r.status === 404 && opts.allow404) return null;
    if (!r.ok) {
      const err = new Error(
        r.status === 401 ? "Clé d’accès refusée ou expirée."
        : r.status === 403 || r.status === 404 ? "Accès refusé : vérifiez que la clé a le droit « Contents : Read and write » sur ce dépôt."
        : r.status === 409 || r.status === 422 ? "Le site a été modifié ailleurs entre-temps. Rechargez la page puis recommencez."
        : "Erreur GitHub " + r.status
      );
      err.status = r.status;
      throw err;
    }
    return r.json();
  };
  let branch = "";
  const getBranch = async () => {
    if (branch) return branch;
    branch = cfg.branch || (await gh("")).default_branch;
    return branch;
  };
  const enc = (p) => p.split("/").map(encodeURIComponent).join("/");
  const getFile = async (path) => gh(`/contents/${enc(path)}?ref=${encodeURIComponent(await getBranch())}`, { allow404: true });
  const putFile = async (path, base64, message) => {
    const cur = await getFile(path);
    return gh(`/contents/${enc(path)}`, {
      method: "PUT",
      body: JSON.stringify({ message, content: base64, branch: await getBranch(), ...(cur ? { sha: cur.sha } : {}) }),
    });
  };
  const utf8ToB64 = (str) => {
    const bytes = new TextEncoder().encode(str);
    let bin = "";
    bytes.forEach((b) => (bin += String.fromCharCode(b)));
    return btoa(bin);
  };
  const b64ToUtf8 = (b64) => new TextDecoder().decode(Uint8Array.from(atob(b64.replace(/\s/g, "")), (c) => c.charCodeAt(0)));
  const blobToB64 = (blob) =>
    new Promise((res, rej) => {
      const fr = new FileReader();
      fr.onload = () => res(String(fr.result).split(",")[1]);
      fr.onerror = rej;
      fr.readAsDataURL(blob);
    });

  /* ---------- État ---------- */
  const status = $("#status");
  const say = (msg, cls) => { status.textContent = msg; status.className = "mono" + (cls ? " " + cls : ""); };
  let data;
  const pending = new Map(); // nom de fichier -> blob (images pas encore publiées)
  const previews = new Map(); // nom de fichier -> aperçu local
  const fresh = new Set(); // projets créés pendant cette session (leur adresse est fixée à la publication)
  let sel = 0;
  let dirty = false;
  const touch = () => { dirty = true; $("#bar").classList.add("is-dirty"); };

  /* ---------- Verrou : l'espace ne s'ouvre qu'avec une clé que GitHub accepte en écriture ---------- */
  const check = async () => {
    branch = "";
    const r = await gh("");
    if (r.permissions && r.permissions.push === false) throw new Error("Cette clé n’a pas le droit de modifier le site.");
    return r;
  };
  const gateMsg = (m) => ($("#gate-msg").textContent = m);
  let unlocked = false;
  if (cfg.token) {
    try { await check(); unlocked = true; } catch (e) { gateMsg(e.status ? e.message : "Connexion à GitHub impossible. Réessayez."); }
  }
  if (!unlocked)
    await new Promise((done) => {
      $("#gate-form").addEventListener("submit", async (e) => {
        e.preventDefault();
        cfg.token = $("#g-token").value.trim();
        gateMsg("Vérification…");
        try {
          await check();
          store.set("token", cfg.token);
          done();
        } catch (err) {
          cfg.token = "";
          gateMsg(err.status ? err.message : "Connexion à GitHub impossible. Réessayez.");
        }
      });
    });
  document.body.classList.remove("is-locked");

  const load = async () => {
    try {
      const f = await getFile(CONTENT);
      if (f && f.content) return JSON.parse(b64ToUtf8(f.content));
    } catch (e) { say(e.message, "is-bad"); }
    const r = await fetch(CONTENT, { cache: "no-store" });
    return r.json();
  };
  try { data = await load(); } catch (e) { say("Impossible de charger le contenu du site.", "is-bad"); return; }
  data.projets = data.projets || [];
  data.infos = data.infos || {};
  data.parcours = Object.assign({ accroche: "", reperes: [], etapes: [], services: [] }, data.parcours);

  const thumb = (src) => previews.get(small(src)) || IMG + small(src);

  /* ---------- Lecture / écriture d'un champ par son chemin ("projets.2.titre") ---------- */
  const getPath = (path) => path.split(".").reduce((o, k) => (o == null ? o : o[k]), data);
  const setPath = (path, val) => {
    const keys = path.split(".");
    const last = keys.pop();
    keys.reduce((o, k) => o[k], data)[last] = val;
  };
  const field = (label, path, o = {}) => {
    const v = getPath(path);
    const kind = o.kind || "text";
    const attrs = `data-path="${path}" data-kind="${kind}"`;
    let input;
    if (kind === "lines" || kind === "paras")
      input = `<textarea ${attrs} rows="${o.rows || 4}">${esc((v || []).join(kind === "paras" ? "\n\n" : "\n"))}</textarea>`;
    else if (kind === "area") input = `<textarea ${attrs} rows="${o.rows || 3}">${esc(v)}</textarea>`;
    else if (kind === "select")
      input = `<select ${attrs}>${o.options.map((x) => `<option value="${esc(x.id)}"${x.id === v ? " selected" : ""}>${esc(x.label)}</option>`).join("")}</select>`;
    else input = `<input type="${o.type || "text"}" ${attrs} value="${esc(v)}" placeholder="${esc(o.placeholder || "")}">`;
    return `<label class="f${o.wide ? " f--wide" : ""}"><span class="mono">${label}</span>${input}${o.hint ? `<small>${o.hint}</small>` : ""}</label>`;
  };
  document.addEventListener("input", (e) => {
    const t = e.target;
    if (!t.dataset || !t.dataset.path) return;
    const kind = t.dataset.kind;
    let v = t.value;
    if (kind === "lines") v = v.split("\n").map((x) => x.trim()).filter(Boolean);
    else if (kind === "paras") v = v.split(/\n\s*\n/).map((x) => x.trim()).filter(Boolean);
    else if (kind === "check") v = t.checked;
    setPath(t.dataset.path, v);
    touch();
    if (/^projets\.\d+\.titre$/.test(t.dataset.path)) renderList();
  });

  /* ---------- Onglet Projets ---------- */
  const plist = $("#plist");
  const editor = $("#editor");
  const renderList = () => {
    plist.innerHTML = data.projets
      .map((p, i) => {
        const im = (p.images || [])[0];
        return (
          `<li class="${i === sel ? "is-sel" : ""}">` +
          `<button class="pick" data-act="sel" data-i="${i}">${im ? `<img src="${esc(thumb(im.src))}" alt="">` : `<i class="ph"></i>`}<span>${esc(p.titre || "Sans titre")}</span></button>` +
          `<button class="ico" data-act="up" data-i="${i}" title="Monter" aria-label="Monter">↑</button>` +
          `<button class="ico" data-act="down" data-i="${i}" title="Descendre" aria-label="Descendre">↓</button></li>`
        );
      })
      .join("");
  };
  const renderEditor = () => {
    const p = data.projets[sel];
    if (!p) { editor.innerHTML = `<h2>Aucun projet</h2><p class="sub">Cliquez sur « + Nouveau projet » pour commencer.</p>`; return; }
    const b = `projets.${sel}`;
    editor.innerHTML =
      `<h2>${esc(p.titre || "Sans titre")}</h2><p class="sub">Les modifications apparaissent sur le site après avoir cliqué sur « Publier ».</p>` +
      `<div class="grid">` +
      field("Titre", `${b}.titre`, { placeholder: "Ex. : Pointillisme" }) +
      field("Catégorie", `${b}.categorie`, { kind: "select", options: data.categories }) +
      field("Année", `${b}.annee`, { placeholder: "Ex. : 2025" }) +
      field("Médium / technique", `${b}.medium`, { placeholder: "Ex. : Encre sur papier" }) +
      field("Phrase d’introduction", `${b}.intro`, { kind: "area", wide: true, rows: 2 }) +
      field("Texte", `${b}.texte`, { kind: "paras", wide: true, rows: 5, hint: "Laissez une ligne vide entre deux paragraphes." }) +
      `<label class="f f--wide check"><input type="checkbox" data-path="${b}.aVenir" data-kind="check"${p.aVenir ? " checked" : ""}> Afficher comme « à venir » (projet pas encore prêt)</label>` +
      `</div>` +
      `<h3>Images</h3><p>La première image sert de vignette. Elles sont redimensionnées automatiquement.</p>` +
      `<div class="imgs">` +
      (p.images || [])
        .map(
          (im, j) =>
            `<div class="im"><img src="${esc(thumb(im.src))}" alt="">` +
            `<div class="im__row"><span class="mono">(${j + 1})</span>` +
            `<button class="ico" data-act="img-up" data-j="${j}" title="Avancer" aria-label="Avancer">←</button>` +
            `<button class="ico" data-act="img-down" data-j="${j}" title="Reculer" aria-label="Reculer">→</button>` +
            `<button class="ico" data-act="img-del" data-j="${j}" title="Retirer" aria-label="Retirer">✕</button></div>` +
            `<input type="text" data-path="${b}.images.${j}.legende" value="${esc(im.legende)}" placeholder="Légende (facultatif)"></div>`
        )
        .join("") +
      `</div>` +
      `<label class="drop" id="drop"><input type="file" id="files" accept="image/*" multiple>+ Ajouter des images — cliquez ou glissez-les ici</label>` +
      `<div class="foot"><button class="btn btn--danger" data-act="del">Supprimer ce projet</button></div>`;
  };
  const renderProjets = () => { renderList(); renderEditor(); };

  const move = (arr, i, d) => {
    const j = i + d;
    if (j < 0 || j >= arr.length) return false;
    [arr[i], arr[j]] = [arr[j], arr[i]];
    return true;
  };
  $("#tab-projets").addEventListener("click", (e) => {
    const b = e.target.closest("[data-act]");
    if (!b) return;
    const act = b.dataset.act;
    const i = +b.dataset.i;
    const j = +b.dataset.j;
    const p = data.projets[sel];
    if (act === "sel") sel = i;
    else if (act === "up" || act === "down") {
      const d = act === "up" ? -1 : 1;
      if (!move(data.projets, i, d)) return;
      if (sel === i) sel = i + d; else if (sel === i + d) sel = i;
      touch();
    } else if (act === "img-up" || act === "img-down") {
      if (!move(p.images, j, act === "img-up" ? -1 : 1)) return;
      touch();
    } else if (act === "img-del") { p.images.splice(j, 1); touch(); }
    else if (act === "del") {
      if (!confirm(`Supprimer le projet « ${p.titre} » ?`)) return;
      data.projets.splice(sel, 1);
      sel = Math.max(0, sel - 1);
      touch();
    }
    renderProjets();
  });
  $("#add").addEventListener("click", () => {
    const p = {
      id: "projet-" + Date.now().toString(36),
      titre: "Nouveau projet",
      categorie: (data.categories[0] || {}).id || "",
      annee: String(new Date().getFullYear()),
      medium: "", aVenir: false, intro: "", texte: [], images: [],
    };
    fresh.add(p);
    data.projets.push(p);
    sel = data.projets.length - 1;
    touch();
    renderProjets();
    const t = $('[data-path$=".titre"]', editor);
    t.focus(); t.select();
  });

  /* Images : redimensionnées dans le navigateur (grande 1800 px + vignette 800 px, en JPEG) */
  const toJpeg = (bitmap, max) =>
    new Promise((res) => {
      const k = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
      const c = document.createElement("canvas");
      c.width = Math.round(bitmap.width * k);
      c.height = Math.round(bitmap.height * k);
      const ctx = c.getContext("2d");
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, c.width, c.height);
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(bitmap, 0, 0, c.width, c.height);
      c.toBlob((blob) => res({ blob, w: c.width, h: c.height }), "image/jpeg", 0.85);
    });
  const decode = async (file) => {
    try { return await createImageBitmap(file, { imageOrientation: "from-image" }); } catch (e) {}
    return new Promise((res, rej) => {
      const img = new Image();
      img.onload = () => res(Object.assign(img, { width: img.naturalWidth, height: img.naturalHeight }));
      img.onerror = rej;
      img.src = URL.createObjectURL(file);
    });
  };
  const addFiles = async (files) => {
    const p = data.projets[sel];
    if (!p) return;
    let n = 0;
    for (const file of files) {
      if (!file.type.startsWith("image/")) continue;
      say(`Préparation de ${file.name}…`);
      try {
        const bmp = await decode(file);
        const big = await toJpeg(bmp, 1800);
        const sm = await toJpeg(bmp, 800);
        const name = `img-${Date.now().toString(36)}${n}.jpg`;
        pending.set(name, big.blob);
        pending.set(small(name), sm.blob);
        previews.set(small(name), URL.createObjectURL(sm.blob));
        p.images.push({ src: name, w: big.w, h: big.h, legende: "" });
        n += 1;
      } catch (e) {
        say(`« ${file.name} » n’a pas pu être lue (format non reconnu : essayez en JPG ou PNG).`, "is-bad");
        return renderProjets();
      }
    }
    if (n) { p.aVenir = false; touch(); say(`${n} image${n > 1 ? "s" : ""} ajoutée${n > 1 ? "s" : ""}. Pensez à publier.`); }
    renderProjets();
  };
  editor.addEventListener("change", (e) => { if (e.target.id === "files") addFiles([...e.target.files]); });
  editor.addEventListener("dragover", (e) => { const d = e.target.closest("#drop"); if (d) { e.preventDefault(); d.classList.add("is-over"); } });
  editor.addEventListener("dragleave", (e) => { const d = e.target.closest("#drop"); if (d) d.classList.remove("is-over"); });
  editor.addEventListener("drop", (e) => { if (e.target.closest("#drop")) { e.preventDefault(); addFiles([...e.dataTransfer.files]); } });

  /* ---------- Onglet Infos & contact ---------- */
  const renderInfos = () => {
    $("#tab-infos").innerHTML =
      `<h2>Infos &amp; contact</h2><p class="sub">Les textes de l’en-tête, de la page « Infos » et de la page « Contact ».</p>` +
      `<div class="grid">` +
      field("Nom", "site.nom") +
      field("En-tête (une ligne par ligne)", "site.role", { kind: "lines", rows: 2 }) +
      field("Adresse mail", "site.email", { type: "email" }) +
      field("Téléphone", "site.telephone", { hint: "Visible seulement après un clic sur « autres coordonnées ». Vide : jamais affiché." }) +
      field("Lien LinkedIn", "site.linkedin", { type: "url", hint: "Même principe que le téléphone." }) +
      field("Texte du lien LinkedIn", "site.linkedinLabel") +
      `</div>` +
      `<h3>Page « Infos »</h3><p>Votre présentation.</p><div class="grid">` +
      field("Accroche (en grand)", "infos.accroche", { kind: "area", wide: true }) +
      field("Paragraphes", "infos.paragraphes", { kind: "paras", wide: true, rows: 9, hint: "Laissez une ligne vide entre deux paragraphes." }) +
      field("Phrase finale (en rouge)", "infos.signature", { kind: "area", wide: true }) +
      `</div>` +
      `<h3>Page « Contact »</h3><p>Le formulaire pour vous écrire.</p><div class="grid">` +
      field("Texte d’invitation", "infos.contactTexte", { kind: "area", wide: true, rows: 2 }) +
      field("Adresse du service d’envoi (facultatif)", "site.formulaire", {
        type: "url", wide: true, placeholder: "https://formspree.io/f/…",
        hint: "Vide : le formulaire ouvre la messagerie du visiteur avec le mail déjà rédigé. Avec une adresse Formspree (compte gratuit sur formspree.io), le message vous est envoyé sans quitter le site.",
      }) +
      `</div>`;
  };

  /* ---------- Onglet Parcours ---------- */
  const listEditor = (path, cols, addLabel) =>
    (getPath(path) || [])
      .map(
        (it, i) =>
          `<div class="rep-item"><div class="grid">${cols.map((c) => field(c.label, `${path}.${i}.${c.key}`, c.o || {})).join("")}</div>` +
          `<div class="im__row"><span class="mono">(${i + 1})</span>` +
          `<button class="ico" data-lact="up" data-lpath="${path}" data-i="${i}" title="Monter" aria-label="Monter">↑</button>` +
          `<button class="ico" data-lact="down" data-lpath="${path}" data-i="${i}" title="Descendre" aria-label="Descendre">↓</button>` +
          `<button class="ico" data-lact="del" data-lpath="${path}" data-i="${i}" title="Retirer" aria-label="Retirer">✕</button></div></div>`
      )
      .join("") +
    `<button class="btn btn--small" data-lact="add" data-lpath="${path}" data-keys="${cols.map((c) => c.key).join(",")}">+ ${addLabel}</button>`;
  const renderParcours = () => {
    $("#tab-parcours").innerHTML =
      `<h2>Parcours</h2><p class="sub">Votre page de présentation, façon CV.</p>` +
      `<div class="grid">${field("Accroche (en grand)", "parcours.accroche", { kind: "area", wide: true })}</div>` +
      `<h3>Repères</h3><p>Quelques informations clés, en un coup d’œil.</p>` +
      listEditor("parcours.reperes", [{ key: "label", label: "Intitulé" }, { key: "valeur", label: "Valeur" }], "Ajouter un repère") +
      `<h3>Le fil — formations et expériences</h3><p>Dans l’ordre d’affichage, de haut en bas.</p>` +
      listEditor(
        "parcours.etapes",
        [
          { key: "periode", label: "Période", o: { placeholder: "Ex. : 2024 — 2025" } },
          { key: "titre", label: "Titre", o: { placeholder: "Ex. : Assistante chef de produit" } },
          { key: "lieu", label: "Lieu / entreprise / école", o: { wide: true } },
          { key: "texte", label: "Description", o: { kind: "area", wide: true, rows: 2 } },
        ],
        "Ajouter une étape"
      ) +
      `<h3>Ce que je peux vous apporter</h3><p>Vos services, pour vos futurs clients.</p>` +
      listEditor(
        "parcours.services",
        [{ key: "titre", label: "Titre", o: { wide: true } }, { key: "texte", label: "Description", o: { kind: "area", wide: true, rows: 2 } }],
        "Ajouter un service"
      );
  };
  $("#tab-parcours").addEventListener("click", (e) => {
    const b = e.target.closest("[data-lact]");
    if (!b) return;
    const arr = getPath(b.dataset.lpath);
    const i = +b.dataset.i;
    if (b.dataset.lact === "add") arr.push(Object.fromEntries(b.dataset.keys.split(",").map((k) => [k, ""])));
    else if (b.dataset.lact === "del") arr.splice(i, 1);
    else if (!move(arr, i, b.dataset.lact === "up" ? -1 : 1)) return;
    touch();
    renderParcours();
  });

  /* ---------- Onglets ---------- */
  $$(".tabs button").forEach((b) =>
    b.addEventListener("click", () => {
      $$(".tabs button").forEach((x) => x.setAttribute("aria-selected", String(x === b)));
      ["projets", "infos", "parcours", "reglages"].forEach((t) => ($("#tab-" + t).hidden = t !== b.dataset.tab));
      if (b.dataset.tab === "parcours") renderParcours();
      if (b.dataset.tab === "infos") renderInfos();
      if (b.dataset.tab === "projets") renderProjets();
    })
  );
  const openTab = (t) => $(`.tabs button[data-tab="${t}"]`).click();

  /* ---------- Réglages ---------- */
  $("#s-token").value = cfg.token;
  $("#s-owner").value = cfg.owner;
  $("#s-repo").value = cfg.repo;
  $("#s-branch").value = cfg.branch;
  $("#s-save").addEventListener("click", async () => {
    cfg.token = $("#s-token").value.trim();
    cfg.owner = $("#s-owner").value.trim();
    cfg.repo = $("#s-repo").value.trim();
    cfg.branch = $("#s-branch").value.trim();
    branch = "";
    ["token", "owner", "repo", "branch"].forEach((k) => store.set(k, cfg[k]));
    if (!cfg.token) return say("Collez d’abord votre clé d’accès.", "is-bad");
    say("Test de la connexion…");
    try {
      const r = await gh("");
      if (r.permissions && r.permissions.push === false) throw new Error("La clé fonctionne mais n’a pas le droit d’écrire (Contents : Read and write).");
      say(`Connexion réussie au dépôt ${r.full_name} (branche ${await getBranch()}).`, "is-ok");
    } catch (e) { say(e.message, "is-bad"); }
  });
  $("#s-logout").addEventListener("click", () => {
    if (dirty && !confirm("Des modifications ne sont pas publiées. Se déconnecter quand même ?")) return;
    dirty = false;
    store.set("token", "");
    location.reload();
  });
  $("#s-export").addEventListener("click", () => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2) + "\n"], { type: "application/json" }));
    a.download = "contenu.json";
    a.click();
  });

  /* ---------- Publier ---------- */
  const slug = (s) =>
    String(s).normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/œ/gi, "oe").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  const publish = async () => {
    if (!cfg.token) { openTab("reglages"); return say("Avant de publier, ajoutez votre clé d’accès (une seule fois).", "is-bad"); }
    const btn = $("#publish");
    btn.disabled = true;
    try {
      // Adresse définitive des nouveaux projets, d'après leur titre
      for (const p of fresh) {
        if (!data.projets.includes(p)) continue;
        const base = slug(p.titre) || "projet";
        let id = base, k = 2;
        while (data.projets.some((q) => q !== p && q.id === id)) id = `${base}-${k++}`;
        p.id = id;
      }
      // Seules les images encore utilisées sont envoyées
      const used = new Set();
      data.projets.forEach((p) => (p.images || []).forEach((im) => { used.add(im.src); used.add(small(im.src)); }));
      const todo = [...pending.keys()].filter((name) => used.has(name));
      let i = 0;
      for (const name of todo) {
        say(`Envoi des images… (${++i}/${todo.length})`);
        await putFile(IMG + name, await blobToB64(pending.get(name)), "Admin : ajout d'une image");
        pending.delete(name);
      }
      say("Enregistrement des textes…");
      await putFile(CONTENT, utf8ToB64(JSON.stringify(data, null, 2) + "\n"), "Admin : mise à jour du contenu");
      fresh.clear();
      dirty = false;
      $("#bar").classList.remove("is-dirty");
      say("Publié ! Le site se met à jour d’ici une à deux minutes.", "is-ok");
    } catch (e) {
      say("Publication interrompue — " + e.message, "is-bad");
    }
    btn.disabled = false;
  };
  $("#publish").addEventListener("click", publish);
  window.addEventListener("beforeunload", (e) => { if (dirty) { e.preventDefault(); e.returnValue = ""; } });

  renderProjets();
})();
