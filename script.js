// Vous pouvez utiliser un fichier local ou une URL distante.
// Fichier local attendu : assets/bnl-video.mp4
// Exemple YouTube : https://www.youtube.com/watch?v=XXXXXXXXXXX
const VIDEO_URL = "";

const videoFrame = document.querySelector("#video-frame");
const playButton = document.querySelector("#play-button");
const localVideo = document.querySelector("#local-video");

function getEmbedUrl(url) {
  try {
    const parsed = new URL(url);

    if (parsed.hostname.includes("youtube.com")) {
      const id = parsed.searchParams.get("v");
      return id ? `https://www.youtube.com/embed/${id}?autoplay=1` : null;
    }

    if (parsed.hostname === "youtu.be") {
      return `https://www.youtube.com/embed/${parsed.pathname.slice(1)}?autoplay=1`;
    }

    if (parsed.hostname.includes("vimeo.com")) {
      const id = parsed.pathname.split("/").filter(Boolean).pop();
      return id ? `https://player.vimeo.com/video/${id}?autoplay=1` : null;
    }
  } catch (_) {
    return null;
  }

  return null;
}

function showLocalVideo() {
  if (!videoFrame || !localVideo) return;
  videoFrame.classList.add("has-local-video");
}

if (localVideo) {
  // L'aperçu et le bouton lecture restent affichés jusqu'au clic sur la vidéo.

  localVideo.addEventListener("error", () => {
    videoFrame.classList.remove("has-local-video");

    if (localVideo.dataset.userRequested === "true") {
      console.warn("Vidéo introuvable : déposer assets/bnl-video.mp4 (MP4 H.264).");
      localVideo.dataset.userRequested = "false";
    }
  });
}

if (playButton) {
  playButton.addEventListener("click", () => {
    const embedUrl = getEmbedUrl(VIDEO_URL || videoFrame.dataset.videoUrl);

    // Une URL renseignée est prioritaire sur le fichier local.
    if (embedUrl) {
      const iframe = document.createElement("iframe");
      iframe.src = embedUrl;
      iframe.title = "Vidéo de présentation du projet BNL";
      iframe.allow = "autoplay; fullscreen; picture-in-picture";
      iframe.allowFullscreen = true;
      iframe.loading = "lazy";
      iframe.style.cssText = "position:absolute;inset:0;width:100%;height:100%;border:0;z-index:2;";
      videoFrame.appendChild(iframe);
      return;
    }

    // Sinon, lancer le fichier MP4 local.
    if (localVideo) {
      if (localVideo.readyState >= 2) {
        showLocalVideo();
        localVideo.play().catch(() => {});
        return;
      }

      localVideo.dataset.userRequested = "true";
      localVideo.addEventListener("canplay", () => {
        showLocalVideo();
        localVideo.play().catch(() => {});
      }, { once: true });
      localVideo.load();
      return;
    }

    console.warn("Vidéo introuvable : déposer assets/bnl-video.mp4.");
  });
}

/* --- Toute la vidéo est cliquable, pas seulement le bouton lecture */
const videoEnCours = () => videoFrame && (videoFrame.classList.contains("has-local-video") || videoFrame.querySelector("iframe"));
if (videoFrame && playButton) {
  videoFrame.addEventListener("click", (event) => {
    if (videoEnCours() || event.target.closest("#play-button")) return;
    playButton.click();
  });
}

const lightbox = document.querySelector("#lightbox");
const lightboxImage = document.querySelector("#lightbox-image");
const lightboxClose = document.querySelector("#lightbox-close");
const mouvementReduit = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
let lightboxOrigine = null;
let lightboxVidage;
const closeLightbox = () => {
  if (!lightbox.classList.contains("is-open")) return;
  lightbox.classList.remove("is-open");
  lightbox.setAttribute("aria-hidden", "true");
  clearTimeout(lightboxVidage);
  lightboxVidage = setTimeout(() => { lightboxImage.src = ""; }, 300);   // après le fondu
  lightboxOrigine?.focus({ preventScroll: true });   // au clavier, on revient sur l'image ouverte
};
const openLightbox = (button, auClavier) => {
  clearTimeout(lightboxVidage);
  lightboxOrigine = button;
  lightboxImage.src = button.dataset.lightbox;
  lightboxImage.alt = button.querySelector("img")?.alt || "Image agrandie";
  lightbox.classList.add("is-open");
  lightbox.setAttribute("aria-hidden", "false");
  if (auClavier) lightboxClose.focus({ preventScroll: true });   // au clavier seulement : à la souris, pas de cadre autour de la croix
};

/* --- Galerie : effet « focus ». On ajoute autour de chaque photo un cadre, son contour
   et quatre coins de visée (le HTML ne change pas). Au clic, les coins s'éloignent,
   puis la visionneuse s'ouvre ; sur écran tactile, l'effet du survol se joue d'abord. */
document.querySelectorAll("[data-lightbox]").forEach((button) => {
  const img = button.querySelector("img");
  if (img) {
    const cadre = document.createElement("span");
    cadre.className = "image-cadre";
    img.replaceWith(cadre);
    cadre.appendChild(img);
    const filet = document.createElement("span");
    filet.className = "image-filet";
    const coins = document.createElement("span");
    coins.className = "image-coins";
    coins.setAttribute("aria-hidden", "true");
    coins.innerHTML = "<i></i><i></i><i></i><i></i>";
    button.append(filet, coins);
    button.classList.add("est-vise");
  }

  button.addEventListener("click", (event) => {
    const auClavier = event.detail === 0;   // ouverture avec Entrée ou Espace
    if (mouvementReduit) { openLightbox(button, auClavier); return; }
    const tactile = window.matchMedia("(hover: none)").matches;
    if (tactile) {
      button.classList.add("est-touche");
      setTimeout(() => button.classList.add("est-clique"), 380);
    } else {
      button.classList.add("est-clique");
    }
    setTimeout(() => openLightbox(button, auClavier), tactile ? 680 : 300);
    setTimeout(() => {   // les coins reviennent derrière la photo sans être vus
      button.classList.add("sans-transition");
      button.classList.remove("est-clique", "est-touche");
      void button.offsetWidth;
      button.classList.remove("sans-transition");
    }, tactile ? 1200 : 900);
  });
});

document.querySelector("#lightbox-close").addEventListener("click", closeLightbox);
lightbox.addEventListener("click", (event) => {
  if (event.target === lightbox) closeLightbox();
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeLightbox();
});

/* --- copie de l'adresse de contact --- */
document.querySelectorAll(".mail-copy").forEach((el) => {
  let minuteur;
  el.addEventListener("click", async () => {
    const mail = el.dataset.mail;
    try {
      await navigator.clipboard.writeText(mail);
    } catch (_) {
      const tmp = document.createElement("textarea");
      tmp.value = mail;
      document.body.appendChild(tmp);
      tmp.select();
      document.execCommand("copy");
      document.body.removeChild(tmp);
    }

    // L'adresse (06) ou le bouton (03) ne change pas : « Copied to clipboard » se dévoile dessous puis repart par la droite
    const confirmation = el.parentElement.querySelector(".mail-confirmation");
    if (confirmation) {
      clearTimeout(minuteur);
      const remettre = () => {
        confirmation.classList.add("sans-transition");
        confirmation.classList.remove("est-visible", "est-sortie");
        void confirmation.offsetWidth;
        confirmation.classList.remove("sans-transition");
      };
      remettre();
      confirmation.textContent = "Copied to clipboard";
      confirmation.classList.add("est-visible");
      minuteur = setTimeout(() => {
        confirmation.classList.add("est-sortie");
        minuteur = setTimeout(remettre, 450);
      }, 1800);
      return;
    }

  });
});

/* --- Liens pas encore publiés (06) : le clic reste sans effet tant que le lien n'est pas en ligne */
document.querySelectorAll('a[aria-disabled="true"]').forEach((a) => {
  a.addEventListener("click", (event) => event.preventDefault());
});


/* --- Intro : logo net sur la page floutée, puis lecture ligne par ligne -------
   1 s de tenue, puis une ligne jaune descend en 1,4 s : au-dessus d'elle la page
   redevient nette, le logo s'efface au passage. Un clic (ou Entrée, Espace, Échap)
   lance la lecture tout de suite. Moins de mouvement demandé : l'intro disparaît d'un coup. */
(function () {
  const intro = document.querySelector("#intro");
  if (!intro) return;

  const TENUE = 1000, LECTURE = 1400;
  const calme = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Durée transmise au CSS : ligne et défloutage restent synchronisés
  document.documentElement.style.setProperty("--lecture", LECTURE + "ms");

  const ligne = document.createElement("div");
  ligne.className = "intro-ligne";
  ligne.setAttribute("aria-hidden", "true");
  intro.after(ligne);

  let minuteurs = [];

  const terminer = () => {
    intro.classList.add("fini");
    ligne.classList.add("fini");
  };

  const lire = () => {
    minuteurs.forEach(clearTimeout);
    if (intro.classList.contains("lecture")) return;
    if (intro.classList.contains("fini")) { terminer(); return; }   // intro déjà passée (?intro=non)
    document.dispatchEvent(new Event("intro-sortie"));               // le titre du hero commence à s'écrire
    intro.classList.add("lecture");
    ligne.classList.add("en-lecture");
    minuteurs = [setTimeout(terminer, calme ? 0 : LECTURE)];
  };

  intro.addEventListener("click", lire);
  intro.addEventListener("keydown", (e) => {
    if (["Enter", " ", "Escape"].includes(e.key)) { e.preventDefault(); lire(); }
  });

  const lancer = () => { minuteurs.push(setTimeout(lire, TENUE)); };
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(lancer); else lancer();
})();

/* --- Variante du titre : ?titre=blanc enlève le jaune de « We begin. » */
if (new URLSearchParams(location.search).get("titre") === "blanc") {
  document.documentElement.classList.add("titre-blanc");
}
/* --- Tests de fond : ?video=bleu (aplat bleu derrière la vidéo), ?footer=bleu (pied de page en bleu brut),
       ?fond=rayons (image des rayons en 03 au lieu du feuillage) */
{
  const q = new URLSearchParams(location.search);
  if (q.get("video") === "bleu") document.documentElement.classList.add("video-bleu");
  if (q.get("footer") === "bleu") document.documentElement.classList.add("footer-bleu");
  if (q.get("fond") === "rayons") document.documentElement.classList.add("fond-rayons");
}
/* --- ?intro=non désactive l'intro (pour les captures et la comparaison) */
if (new URLSearchParams(location.search).get("intro") === "non") {
  document.querySelector("#intro")?.classList.add("fini");
}

/* --- Titre du hero : il s'écrit à l'arrivée, comme tapé au clavier -----
   Rythme à peine irrégulier, jamais tout à fait le même : 30 à 55 ms par
   lettre, une courte respiration aux espaces, une pause après la virgule,
   et de loin en loin une infime hésitation. Environ 1,8 s pour la phrase,
   sans curseur ; le halo s'allume avec le dernier mot.
   Démarre quand l'intro se défloute (ou tout de suite sans intro). Le texte
   reste lisible par les lecteurs d'écran. Si l'appareil demande moins de
   mouvement, le titre s'affiche d'un coup. Le halo est centré une ligne
   sous le I de BEGIN. */
(function () {
  const h1 = document.querySelector(".hero h1");
  if (!h1) return;
  const calme = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const lettres = [];
  const decouper = (noeud) => {
    [...noeud.childNodes].forEach((n) => {
      if (n.nodeType === 3) {
        const frag = document.createDocumentFragment();
        for (const c of n.textContent) {
          const s = document.createElement("span");
          s.className = "lettre"; s.textContent = c;
          frag.appendChild(s); lettres.push(s);
        }
        n.replaceWith(frag);
      } else if (n.nodeType === 1) decouper(n);
    });
  };
  decouper(h1);

  // Centre du halo : une ligne sous le I de BEGIN (dernier I du titre)
  const iBegin = lettres[Math.floor((lettres.findLastIndex((l, k) => k > 0 && (lettres[k - 1].textContent === " " || l.previousSibling?.nodeName === "BR")) + lettres.length - 1) / 2)];
  const placerHalo = () => {
    if (!iBegin) return;
    const h = h1.getBoundingClientRect(), r = iBegin.getBoundingClientRect();
    const ligne = parseFloat(getComputedStyle(h1).lineHeight);
    h1.style.setProperty("--halo-x", (r.left + r.width / 2 - h.left) + "px");
    h1.style.setProperty("--halo-y", (r.top + r.height / 2 - h.top + ligne) + "px");
  };
  placerHalo();
  window.addEventListener("resize", placerHalo);
  if (document.fonts) document.fonts.ready.then(placerHalo);
  if (calme) return;   // moins de mouvement : titre et halo affichés d'un coup

  h1.classList.add("a-ecrire");
  const hasard = (min, max) => min + Math.random() * (max - min);
  const delai = (c) => {
    if (c === ",") return hasard(160, 220);
    if (c === " ") return hasard(55, 95);
    let d = hasard(30, 55);
    if (Math.random() < .08) d += hasard(50, 90);
    return d;
  };
  // Le halo s'allume avec le dernier mot (BEGIN.) : à sa première lettre, il culmine quand le mot s'achève
  const debutDernierMot = lettres.findLastIndex((l, k) => k > 0 && (lettres[k - 1].textContent === " " || l.previousSibling?.nodeName === "BR"));  let i = 0;
  const taper = () => {
    if (i >= lettres.length) return;
    const l = lettres[i++];
    if (i - 1 === debutDernierMot) h1.classList.add("allume");
    l.classList.add("vue");
    setTimeout(taper, delai(l.textContent));
  };
  let lance = false;
  const lancer = (d) => { if (lance) return; lance = true; setTimeout(taper, d); };
  const intro = document.querySelector("#intro");
  if (!intro || intro.classList.contains("fini")) lancer(400);
  else document.addEventListener("intro-sortie", () => lancer(350), { once: true });
})();

/* --- Surlignement : le texte de chaque titre surligné est enveloppé une fois,
   pour pouvoir passer en produit sur la bande quand une ligne se coupe (mobile) */
document.querySelectorAll("h2 .surligne").forEach((s) => {
  const t = document.createElement("span");
  t.className = "surligne-texte";
  while (s.firstChild) t.appendChild(s.firstChild);
  s.appendChild(t);
});


/* --- Ajouts : animations et interactions (titres, coins de visée, menu, benchmark) --- */

/* --- Titres de section : ils apparaissent quand ils arrivent à l'écran, ligne par ligne.
   Titres bleus : le texte arrive de la gauche, puis la bande jaune glisse depuis la droite.
   Titres des fonds bleus : même arrivée du texte, sans bande.
   Une seule fois par titre. Le titre du hero garde son écriture lettre par lettre.
   Les mouvements sont dans style.css (« Apparition des titres de section »). */
(function () {
  if (!("IntersectionObserver" in window)) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const observateur = new IntersectionObserver((entrees) => {
    entrees.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.classList.add("est-visible");
      observateur.unobserve(e.target);
    });
  }, { rootMargin: "0px 0px -12% 0px" });

  // Titre sans surlignement : on le découpe en lignes aux <br> du HTML
  const decouperEnLignes = (titre) => {
    const lignes = [];
    let ligne = null;
    [...titre.childNodes].forEach((n) => {
      if (n.nodeName === "BR") { ligne = null; return; }
      if (!ligne) {
        ligne = document.createElement("span");
        ligne.className = "titre-ligne";
        titre.insertBefore(ligne, n);
        lignes.push(ligne);
      }
      ligne.appendChild(n);
    });
    return lignes;
  };

  document.querySelectorAll("main h2").forEach((titre) => {
    const surlignes = titre.querySelectorAll(".surligne");
    const lignes = surlignes.length ? [...surlignes] : decouperEnLignes(titre);
    if (!lignes.length) return;
    lignes.forEach((l, i) => l.style.setProperty("--ligne", i));
    titre.classList.add("titre-anime");
    observateur.observe(titre);
  });
})();

/* --- Défilement vers une ancre (menu, boutons, Back to top) : plus doux qu'avec le navigateur seul.
   La durée suit la distance (0,6 à 1,4 s), avec un départ et une arrivée en douceur ;
   l'en-tête fixe est pris en compte. Si l'appareil demande moins de mouvement, c'est le défilement du navigateur qui s'applique. */
(function () {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const douceur = (t) => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  let animation = null;
  document.addEventListener("click", (event) => {
    const lien = event.target.closest('a[href^="#"]');
    if (!lien || lien.getAttribute("aria-disabled") === "true") return;
    const id = lien.getAttribute("href");
    const cible = id === "#" ? null : document.querySelector(id);
    if (!cible || event.defaultPrevented || event.metaKey || event.ctrlKey) return;
    event.preventDefault();
    const marge = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;
    const depart = window.scrollY;
    const arrivee = Math.max(0, Math.min(cible.getBoundingClientRect().top + depart - marge, document.documentElement.scrollHeight - window.innerHeight));
    const distance = arrivee - depart;
    const duree = Math.min(1400, Math.max(600, Math.abs(distance) * .35));
    const debut = performance.now();
    cancelAnimationFrame(animation);
    const pas = (maintenant) => {
      const t = Math.min(1, (maintenant - debut) / duree);
      window.scrollTo({ top: depart + distance * douceur(t), behavior: "instant" });
      if (t < 1) animation = requestAnimationFrame(pas);
      else history.pushState(null, "", id);
    };
    animation = requestAnimationFrame(pas);
  });
  // Une molette, un toucher ou une touche du clavier pendant l'animation la stoppe
  ["wheel", "touchstart", "keydown"].forEach((type) => window.addEventListener(type, () => cancelAnimationFrame(animation), { passive: true }));
})();

/* --- Coins de visée qui tournent (« action ») : bouton Download et bouton lecture.
   Deux coins aux branches de 7 px. Au survol, ils longent le contour dans le sens horaire ;
   en sortant, ils poursuivent dans le même sens jusqu'à leur place. Au clic, le contour entier se trace. */
function poserViseur(hote, declencheur, marge, estInactif) {
  const BRAS = 7;
  const NS = "http://www.w3.org/2000/svg";
  const calme = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const svg = document.createElementNS(NS, "svg");
  svg.setAttribute("class", "viseur");
  svg.setAttribute("aria-hidden", "true");
  const trace = document.createElementNS(NS, "rect");
  svg.appendChild(trace);
  hote.appendChild(svg);

  let L, H, P, decalage = BRAS, dedans = false, minuteur;
  const tirets = (longueur) => { trace.style.strokeDasharray = `${longueur}px ${P - longueur}px`; };
  const placer = (valeur, anime = true) => {
    if (!anime || calme) {
      trace.style.transition = "none";
      trace.style.strokeDashoffset = valeur + "px";
      trace.getBoundingClientRect();
      trace.style.transition = "";
    } else {
      trace.style.strokeDashoffset = valeur + "px";
    }
  };
  const mesurer = () => {
    L = hote.offsetWidth + marge - 1;
    H = hote.offsetHeight + marge - 1;
    P = L + H;
    trace.setAttribute("x", ".5");
    trace.setAttribute("y", ".5");
    trace.setAttribute("width", L);
    trace.setAttribute("height", H);
    tirets(2 * BRAS);
    decalage = dedans ? BRAS - L : BRAS;
    placer(decalage, false);
  };
  const entrer = () => {
    if (dedans || (estInactif && estInactif())) return;
    dedans = true;
    declencheur.classList.add("est-survole");
    decalage -= L;   // les coins longent les bords haut et bas
    placer(decalage);
  };
  const sortir = () => {
    if (!dedans) return;
    dedans = false;
    declencheur.classList.remove("est-survole");
    decalage -= H;   // puis les bords droit et gauche, dans le même sens
    placer(decalage);
  };
  trace.addEventListener("transitionend", (e) => {
    if (e.propertyName !== "stroke-dashoffset" || dedans) return;
    decalage = BRAS;   // revenus au départ : on remet le compteur à zéro, sans mouvement
    placer(decalage, false);
  });
  declencheur.addEventListener("pointerenter", entrer);
  declencheur.addEventListener("pointerleave", sortir);
  hote.addEventListener("focus", entrer);
  hote.addEventListener("blur", sortir);
  // Écouté avant le bouton lui-même (phase de capture) : l'animation part avant que la vidéo ne se lance
  declencheur.addEventListener("click", () => {
    if (estInactif && estInactif()) return;
    clearTimeout(minuteur);
    declencheur.classList.add("est-clique");
    tirets(P);   // le contour se trace en entier
    minuteur = setTimeout(() => {
      tirets(2 * BRAS);
      declencheur.classList.remove("est-clique");
    }, 750);
  }, true);

  mesurer();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(mesurer);
  if ("ResizeObserver" in window) new ResizeObserver(mesurer).observe(hote);
}

{
  const download = document.querySelector(".site-header .button");
  if (download) {
    download.classList.add("bouton-capteur");
    poserViseur(download, download, 8);
  }
  if (playButton && videoFrame) poserViseur(playButton, videoFrame, 0, videoEnCours);
}

/* --- Menu : le lien de la section affichée reste en jaune, souligné.
   Les sections sans lien prennent celui de la section précédente (05 Examples → The dataset) ;
   aucun lien dans le hero ni en 06 Resources (le bouton Download est là pour ça). */
(function () {
  const liens = [...document.querySelectorAll(".top-nav a[href^='#']")];
  const nav = document.querySelector(".top-nav");
  const sections = [...document.querySelectorAll("main > section")];
  if (!liens.length || !sections.length) return;

  const lienDe = (section) => {
    if (section.id) return liens.find((l) => l.getAttribute("href") === "#" + section.id) || null;
    const precedentes = sections.slice(0, sections.indexOf(section)).reverse();
    const parent = precedentes.find((s) => s.id);
    return parent ? liens.find((l) => l.getAttribute("href") === "#" + parent.id) || null : null;
  };

  let actif = null;
  const mettreAJour = () => {
    const repere = window.innerHeight * .35;   // la section qui passe au tiers de l'écran
    let courante = null;
    sections.forEach((s) => { if (s.getBoundingClientRect().top <= repere) courante = s; });
    const nouveau = courante ? lienDe(courante) : null;
    if (nouveau === actif) return;
    actif = nouveau;
    liens.forEach((l) => {
      l.classList.toggle("est-actif", l === actif);
      if (l === actif) l.setAttribute("aria-current", "location");
      else l.removeAttribute("aria-current");
    });
    // Sur mobile, le menu défile à l'horizontale : le lien actif reste visible
    if (actif && nav && nav.scrollWidth > nav.clientWidth) {
      nav.scrollTo({ left: Math.max(0, actif.offsetLeft - 20), behavior: "smooth" });
    }
  };

  let enAttente = false;
  window.addEventListener("scroll", () => {
    if (enAttente) return;
    enAttente = true;
    requestAnimationFrame(() => { enAttente = false; mettreAJour(); });
  }, { passive: true });
  window.addEventListener("resize", mettreAJour);
  mettreAJour();
})();

/* --- Benchmark : tableau entier tant qu'il tient dans sa colonne, accordéon sinon.
   L'accordéon est fabriqué à partir du tableau : les chiffres ne sont écrits qu'une fois, dans le HTML.
   Le premier réseau est ouvert à l'arrivée (ordre du tableau, pas de mise en avant). */
(function () {
  const panneau = document.querySelector(".benchmark-panel");
  const tableau = panneau?.querySelector(".benchmark-table");
  const enveloppe = panneau?.querySelector(".benchmark-table-wrap");
  if (!tableau || !enveloppe) return;

  const entetes = [...tableau.querySelectorAll("thead th")];
  const liste = document.createElement("div");
  liste.className = "benchmark-list";
  const tete = document.createElement("div");
  tete.className = "benchmark-list-head";
  tete.setAttribute("aria-hidden", "true");
  tete.textContent = entetes[0].textContent.trim();   // « Network »
  liste.appendChild(tete);

  tableau.querySelectorAll("tbody tr").forEach((tr, i) => {
    const cases = [...tr.children];
    const id = "benchmark-detail-" + i;
    const ligne = document.createElement("button");
    ligne.type = "button";
    ligne.className = "benchmark-row";
    ligne.setAttribute("aria-expanded", "false");
    ligne.setAttribute("aria-controls", id);
    ligne.innerHTML = '<span class="benchmark-nom"></span><span class="benchmark-plus" aria-hidden="true"></span>';
    ligne.querySelector(".benchmark-nom").textContent = cases[0].textContent.trim();

    const detail = document.createElement("div");
    detail.className = "benchmark-detail";
    detail.id = id;
    const interieur = document.createElement("div");
    const dl = document.createElement("dl");
    dl.className = "benchmark-metriques";
    cases.slice(1).forEach((td, j) => {
      const bloc = document.createElement("div");
      const dt = document.createElement("dt");
      dt.innerHTML = entetes[j + 1].innerHTML;   // libellé et flèche de l'en-tête
      const dd = document.createElement("dd");
      dd.textContent = td.textContent.trim();
      bloc.append(dt, dd);
      dl.appendChild(bloc);
    });
    interieur.appendChild(dl);
    detail.appendChild(interieur);

    ligne.addEventListener("click", () => {
      const ouvert = ligne.getAttribute("aria-expanded") !== "true";
      ligne.setAttribute("aria-expanded", String(ouvert));
      detail.classList.toggle("is-open", ouvert);
    });
    liste.append(ligne, detail);
  });
  enveloppe.after(liste);
  liste.querySelector(".benchmark-row")?.click();

  let largeurUtile = 0;
  const mesurer = () => {
    panneau.classList.remove("is-compact");
    tableau.style.width = "max-content";   // largeur naturelle, sans compression
    largeurUtile = tableau.offsetWidth;
    tableau.style.width = "";
    ajuster();
  };
  const ajuster = () => panneau.classList.toggle("is-compact", panneau.clientWidth < largeurUtile);
  mesurer();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(mesurer);
  if ("ResizeObserver" in window) new ResizeObserver(ajuster).observe(panneau);
  else window.addEventListener("resize", ajuster);
})();
/* --- Compteur de téléchargements Hugging Face ----------------------------
   Lit le total des téléchargements depuis la création du dataset, via l'API
   publique de Hugging Face, et l'affiche dans la carte du dataset.
   Reste masqué tant que le total est sous SEUIL, ou si l'API ne répond pas. */
(function () {
  const SEUIL = 1;   // ex. 50 pour n'afficher le compteur qu'à partir de 50 téléchargements
  document.querySelectorAll("[data-hf-dataset]").forEach((el) => {
    const id = el.dataset.hfDataset;
    fetch(`https://huggingface.co/api/datasets/${id}?expand%5B%5D=downloadsAllTime`)
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((d) => {
        const n = d.downloadsAllTime;
        if (typeof n !== "number" || n < SEUIL) return;
        el.textContent = ` · ${n.toLocaleString("en-US")} download${n > 1 ? "s" : ""}`;
        el.hidden = false;
      })
      .catch(() => {});   // API indisponible : rien ne s'affiche, la carte reste propre
  });
})();