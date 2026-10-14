/* JAVAMA — interacciones (sin dependencias) */
(() => {
  "use strict";
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const root = document.documentElement;
  root.classList.add("js");

  /* Año del copyright */
  $$("[data-year]").forEach((e) => (e.textContent = new Date().getFullYear()));

  /* ---------- Pantalla de carga (Preloader) ---------- */
  const preloader = $("#preloader");
  if (preloader) {
    let closed = false;
    const hidePreloader = () => {
      if (closed) return;
      closed = true;
      setTimeout(() => {
        preloader.classList.add("loaded");
        setTimeout(() => {
          if (preloader.parentNode) preloader.remove();
        }, 850);
      }, 700);
    };
    if (document.readyState === "complete") {
      hidePreloader();
    } else {
      window.addEventListener("load", hidePreloader);
      setTimeout(hidePreloader, 2800);
    }
  }

  /* Imágenes que faltan: se ocultan y queda el degradado de fondo */
  document.addEventListener("error", (e) => {
    if (e.target && e.target.tagName === "IMG") e.target.classList.add("img-missing");
  }, true);
  $$("img").forEach((img) => { if (img.complete && img.naturalWidth === 0) img.classList.add("img-missing"); });

  /* ---------- Navegación ---------- */
  const hero = $(".hero");
  let target = 0, cur = 0, raf = 0;
  const nav = $(".nav");
  const burger = $(".burger");
  const darks = $$(".section-dark");
  const setNav = () => {
    if (!nav) return;
    nav.classList.toggle("scrolled", scrollY > 8);
    const y = 26;
    let dark = darks.some((el) => { const r = el.getBoundingClientRect(); return r.top < y && r.bottom > y; });
    if (!dark && hero && hero.classList.contains("live")) {
      const r = hero.getBoundingClientRect();
      dark = target > 0.4 && r.bottom > y;
    }
    nav.classList.toggle("dark", dark);
  };
  const closeMenu = () => { document.body.classList.remove("menu-open"); burger && burger.setAttribute("aria-expanded", "false"); };
  if (burger) {
    burger.addEventListener("click", () => {
      const open = document.body.classList.toggle("menu-open");
      burger.setAttribute("aria-expanded", String(open));
    });
    $$(".menu-overlay a").forEach((a) => a.addEventListener("click", closeMenu));
    addEventListener("keydown", (e) => e.key === "Escape" && closeMenu());
    matchMedia("(min-width: 961px)").addEventListener("change", closeMenu);
  }

  /* ---------- Titulares troceados en palabras ---------- */
  $$("[data-split]").forEach((el) => {
    const label = el.textContent.replace(/\s+/g, " ").trim();
    el.setAttribute("aria-label", label);
    let i = 0;
    const walk = (node, grad) => {
      [...node.childNodes].forEach((n) => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(" ")); return; }
            const w = document.createElement("span"); w.className = "w"; w.setAttribute("aria-hidden", "true");
            const s = document.createElement("span"); s.style.setProperty("--i", i++); s.textContent = part;
            if (grad) s.className = "grad";
            w.appendChild(s); frag.appendChild(w);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1) walk(n, grad || n.classList.contains("grad"));
      });
    };
    walk(el, false);
    $$(".grad", el).forEach((g) => { if (g.querySelector(".w")) g.classList.remove("grad"); });
  });

  /* ---------- Revelado al entrar en pantalla ---------- */
  $$("[data-stagger]").forEach((p) => [...p.children].forEach((c, i) => {
    c.setAttribute("data-reveal", c.getAttribute("data-reveal") || "");
    c.style.setProperty("--d", i * 90);
  }));
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
  }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
  $$("[data-reveal], .ring-card").forEach((el) => io.observe(el));

  /* Contadores */
  const cio = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      cio.unobserve(e.target);
      const end = +e.target.dataset.count, t0 = performance.now(), dur = 2000;
      const step = (t) => {
        const k = clamp((t - t0) / dur), v = 1 - Math.pow(1 - k, 4);
        e.target.textContent = Math.round(end * v);
        if (k < 1) requestAnimationFrame(step);
      };
      reduce ? (e.target.textContent = end) : requestAnimationFrame(step);
    });
  }, { threshold: 0.6 });
  $$("[data-count]").forEach((el) => cio.observe(el));

  /* ---------- Texto que se ilumina con el scroll ---------- */
  const scrubs = $$(".scrub").map((el) => {
    const words = [];
    const walk = (node, accent) => {
      [...node.childNodes].forEach((n) => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(" ")); return; }
            const s = document.createElement("span"); s.className = "sw" + (accent ? " accent" : ""); s.textContent = part;
            words.push(s); frag.appendChild(s);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1) walk(n, accent || n.classList.contains("accent"));
      });
    };
    walk(el, false);
    return { el, words };
  });
  const updateScrubs = () => {
    const vh = innerHeight;
    scrubs.forEach(({ el, words }) => {
      const r = el.getBoundingClientRect();
      const p = clamp((vh * 0.82 - r.top) / (vh * 0.82 - vh * 0.38 + r.height));
      const n = p * words.length;
      words.forEach((w, i) => w.classList.toggle("on", i < n));
    });
  };

  /* ---------- Parallax suave ---------- */
  const par = $$("[data-parallax]");
  const updateParallax = () => {
    if (reduce) return;
    const vh = innerHeight;
    par.forEach((el) => {
      const r = el.parentElement.getBoundingClientRect();
      if (r.bottom < -100 || r.top > vh + 100) return;
      const k = parseFloat(el.dataset.parallax) || 0.1;
      el.style.transform = `translate3d(0, ${((r.top + r.height / 2 - vh / 2) * -k).toFixed(1)}px, 0)`;
    });
  };

  /* ---------- Foto Sobre mí: reducción de escala con el scroll ---------- */
  const aboutPhoto = $(".about-photo");
  const updateAboutScale = () => {
    if (!aboutPhoto || reduce) return;
    const vh = innerHeight;
    const r = aboutPhoto.getBoundingClientRect();
    if (r.bottom < -100 || r.top > vh + 100) return;

    const maxScroll = Math.max(500, vh * 0.85);
    const progress = clamp(window.scrollY / maxScroll);
    const scale = (1.0 - progress * 0.30).toFixed(3);
    aboutPhoto.style.setProperty("--photo-scale", scale);
  };

  /* ---------- HERO: progreso de scroll con inercia ---------- */
  const measure = () => {
    if (!hero) return;
    const max = hero.offsetHeight - innerHeight;
    target = max > 0 ? clamp(-hero.getBoundingClientRect().top / max) : 0;
  };
  const tick = () => {
    cur += (target - cur) * 0.14;
    if (Math.abs(target - cur) < 0.0005) cur = target;
    hero.style.setProperty("--p", cur.toFixed(4));
    hero.classList.toggle("cta-on", cur > 0.74);
    setNav();
    raf = cur === target ? 0 : requestAnimationFrame(tick);
  };
  const kick = () => { if (!raf) raf = requestAnimationFrame(tick); };
  if (hero && !reduce) {
    hero.classList.add("live");
    hero.style.setProperty("--p", "0");
    measure(); cur = target;
    hero.style.setProperty("--p", cur.toFixed(4));
    hero.classList.toggle("cta-on", cur > 0.74);
  }

  /* Un solo listener de scroll para todo */
  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      setNav(); updateScrubs(); updateParallax(); updateAboutScale();
      if (hero && hero.classList.contains("live")) { measure(); kick(); }
      ticking = false;
    });
  };
  addEventListener("scroll", onScroll, { passive: true });
  addEventListener("resize", onScroll);
  addEventListener("load", onScroll);
  onScroll();

  /* ---------- Foco luminoso en tarjetas ---------- */
  $$(".tile").forEach((t) => t.addEventListener("pointermove", (e) => {
    const r = t.getBoundingClientRect();
    t.style.setProperty("--mx", ((e.clientX - r.left) / r.width * 100).toFixed(1) + "%");
    t.style.setProperty("--my", ((e.clientY - r.top) / r.height * 100).toFixed(1) + "%");
  }));

  /* ---------- Pestañas segmentadas (proyectos) ---------- */
  const seg = $(".segmented");
  if (seg) {
    const tabs = $$("button", seg), thumb = $(".thumb", seg);
    const select = (i) => {
      tabs.forEach((b, j) => {
        b.setAttribute("aria-selected", j === i);
        const panel = document.getElementById(b.getAttribute("aria-controls"));
        if (panel) panel.hidden = j !== i;
      });
      thumb.style.width = tabs[i].offsetWidth + "px";
      thumb.style.transform = `translateX(${tabs[i].offsetLeft - 4}px)`;
    };
    tabs.forEach((b, i) => b.addEventListener("click", () => select(i)));
    select(0);
    addEventListener("resize", () => select(tabs.findIndex((b) => b.getAttribute("aria-selected") === "true")));
    if (document.fonts) document.fonts.ready.then(() => select(0));
  }

  /* ---------- Lightbox (proyectos) ---------- */
  const lb = $(".lightbox");
  if (lb) {
    const items = $$(".g-item");
    const lbImg = $("img", lb), lbCap = $("figcaption", lb);
    let idx = 0;
    const show = (i) => {
      idx = (i + items.length) % items.length;
      const it = items[idx], im = $("img", it);
      lbImg.src = im ? im.getAttribute("src") : "";
      lbImg.alt = im ? im.alt : "";
      lbCap.textContent = $(".cap", it).textContent.replace(/\s+/g, " ").trim();
      lbImg.classList.remove("img-missing");
    };
    const open = (i) => { show(i); lb.classList.add("open"); document.body.style.overflow = "hidden"; };
    const close = () => { lb.classList.remove("open"); document.body.style.overflow = ""; };
    items.forEach((it, i) => it.addEventListener("click", () => open(i)));
    $(".lb-close", lb).addEventListener("click", close);
    $(".lb-prev", lb).addEventListener("click", () => show(idx - 1));
    $(".lb-next", lb).addEventListener("click", () => show(idx + 1));
    lb.addEventListener("click", (e) => e.target === lb && close());
    addEventListener("keydown", (e) => {
      if (!lb.classList.contains("open")) return;
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") show(idx - 1);
      if (e.key === "ArrowRight") show(idx + 1);
    });
  }

  /* ---------- Hoja de detalle (servicios) ---------- */
  const sheet = $(".sheet");
  if (sheet) {
    const f = {
      ico: $(".ico", sheet), title: $("h3", sheet), price: $(".price", sheet),
      desc: $(".desc", sheet), list: $("ul", sheet), cta: $(".btn", sheet),
    };
    let last = null;
    const open = (card) => {
      last = card;
      const icoEl = $(".ico", card);
      const titleEl = $("h3", card);
      const priceEl = $(".price", card);
      const descEl = $("p", card);
      const dataEl = $(".data", card);

      if (f.ico && icoEl) f.ico.innerHTML = icoEl.innerHTML;
      if (f.title && titleEl) f.title.textContent = titleEl.textContent;
      if (f.price) {
        if (priceEl && priceEl.textContent.trim()) {
          f.price.textContent = priceEl.textContent;
          f.price.style.display = "";
        } else {
          f.price.textContent = "";
          f.price.style.display = "none";
        }
      }
      if (f.desc) {
        f.desc.textContent = card.dataset.desc || (descEl ? descEl.textContent : "");
      }
      if (f.list) {
        f.list.innerHTML = dataEl ? dataEl.innerHTML : "";
      }
      if (f.cta) {
        f.cta.href = "contacto.html?servicio=" + encodeURIComponent(card.dataset.contact || "") + "#formulario";
      }
      sheet.classList.add("open");
      document.body.style.overflow = "hidden";
      const closeBtn = $(".sheet-close", sheet);
      if (closeBtn) closeBtn.focus();
    };
    const close = () => { sheet.classList.remove("open"); document.body.style.overflow = ""; last && last.focus(); };
    $$(".price-card, #servicios .tile").forEach((c) => {
      c.addEventListener("click", () => open(c));
      c.setAttribute("role", "button");
      c.setAttribute("tabindex", "0");
      c.setAttribute("aria-haspopup", "dialog");
      c.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          open(c);
        }
      });
    });
    $(".sheet-close", sheet).addEventListener("click", close);
    sheet.addEventListener("click", (e) => e.target === sheet && close());
    addEventListener("keydown", (e) => e.key === "Escape" && sheet.classList.contains("open") && close());
  }

  /* ---------- Formulario de contacto ---------- */
  const form = $("#form-contacto");
  if (form) {
    const qs = new URLSearchParams(location.search).get("servicio");
    if (qs && form.servicio) form.servicio.value = qs;
    const toast = $(".toast");
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const d = new FormData(form);
      const svc = form.servicio.options[form.servicio.selectedIndex].text;
      const body = `Nombre: ${d.get("nombre")}\nEmail: ${d.get("email")}\nTeléfono: ${d.get("telefono") || "-"}\nServicio: ${svc}\n\n${d.get("mensaje")}`;
      location.href = `mailto:javamajardineria@gmail.com?subject=${encodeURIComponent("Consulta web — " + svc)}&body=${encodeURIComponent(body)}`;
      if (toast) { toast.classList.add("show"); setTimeout(() => toast.classList.remove("show"), 4200); }
      form.reset();
    });
  }
})();
