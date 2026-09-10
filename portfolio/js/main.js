(function () {
  "use strict";

  const root = document.documentElement;
  const STORE_THEME = "m0uss1-theme";
  const STORE_LANG = "m0uss1-lang";

  /* ---------- Theme ---------- */
  const savedTheme = localStorage.getItem(STORE_THEME) || "dark";
  applyTheme(savedTheme);

  function applyTheme(theme) {
    root.setAttribute("data-theme", theme);
    document.querySelectorAll(".theme-toggle").forEach(function (t) {
      t.textContent = theme === "dark" ? "dark" : "light";
      t.setAttribute("aria-label", "Switch to " + (theme === "dark" ? "light" : "dark") + " mode");
    });
  }

  document.addEventListener("click", function (e) {
    if (e.target.closest(".theme-toggle")) {
      const next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
      applyTheme(next);
      localStorage.setItem(STORE_THEME, next);
    }
  });

  /* ---------- Language ---------- */
  let currentLang = localStorage.getItem(STORE_LANG) || "en";

  function translate(lang) {
    const dict = I18N[lang];
    if (!dict) return;
    document.querySelectorAll("[data-i18n]").forEach(function (el) {
      const key = el.getAttribute("data-i18n");
      if (dict[key] !== undefined) el.textContent = dict[key];
    });
    document.querySelectorAll("[data-i18n-placeholder]").forEach(function (el) {
      const key = el.getAttribute("data-i18n-placeholder");
      if (dict[key] !== undefined) el.setAttribute("placeholder", dict[key]);
    });
    if (lang === "tn") {
      root.setAttribute("dir", "rtl");
    } else {
      root.setAttribute("dir", "ltr");
    }
    document.querySelectorAll(".lang-opt").forEach(function (o) {
      o.classList.toggle("active", o.getAttribute("data-lang") === lang);
    });
    const label = document.querySelector(".lang-dropdown .lang-label");
    if (label) label.textContent = lang.toUpperCase();
    window.dispatchEvent(new CustomEvent("langchange", { detail: lang }));
  }

  const langDropdown = document.querySelector(".lang-dropdown");
  const langTrigger = document.querySelector(".lang-trigger");
  if (langDropdown && langTrigger) {
    langTrigger.addEventListener("click", function (e) {
      e.stopPropagation();
      langDropdown.classList.toggle("open");
      langTrigger.setAttribute("aria-expanded", langDropdown.classList.contains("open"));
    });
    document.addEventListener("click", function (e) {
      if (langDropdown && !e.target.closest(".lang-dropdown")) {
        langDropdown.classList.remove("open");
        langTrigger.setAttribute("aria-expanded", "false");
      }
    });
  }
  document.addEventListener("click", function (e) {
    const opt = e.target.closest(".lang-opt");
    if (!opt) return;
    currentLang = opt.getAttribute("data-lang");
translate(currentLang);

  window.addEventListener("i18nready", function () {
    translate(currentLang);
  });
    localStorage.setItem(STORE_LANG, currentLang);
    if (langDropdown) {
      langDropdown.classList.remove("open");
      langTrigger.setAttribute("aria-expanded", "false");
    }
  });

  translate(currentLang);

  /* ---------- Mobile nav ---------- */
  const hamburger = document.querySelector(".hamburger");
  const navLinks = document.querySelector(".nav-links");
  if (hamburger && navLinks) {
    hamburger.addEventListener("click", function () {
      navLinks.classList.toggle("open");
    });
    navLinks.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () {
        navLinks.classList.remove("open");
      });
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    /* ---------- Preloader boot sequence ---------- */
    const preloader = document.getElementById("preloader");
    const preloaderFill = document.getElementById("preloader-fill");
    const preloaderText = document.getElementById("preloader-text");
    if (preloader) {
      const bootMsgs = ["BOOTING...", "LOADING MODULES", "m0uss1 SYSTEMS ONLINE"];
      let pct = 0;
      const bootInterval = setInterval(function () {
        pct = Math.min(pct + Math.round(Math.random() * 14 + 6), 100);
        if (preloaderFill) preloaderFill.style.width = pct + "%";
        if (preloaderText && pct < 100) preloaderText.textContent = bootMsgs[Math.floor(pct / 34)];
        if (pct >= 100) {
          clearInterval(bootInterval);
          if (preloaderText) preloaderText.textContent = bootMsgs[2];
          setTimeout(function () {
            preloader.classList.add("done");
            document.body.classList.add("loaded");
            setTimeout(function () {
              if (preloader.parentNode) preloader.parentNode.removeChild(preloader);
            }, 400);
          }, 350);
        }
      }, 120);
    } else {
      document.body.classList.add("loaded");
    }

    /* ---------- Scroll progress bar + back to top ---------- */
    const progressBar = document.getElementById("progress-bar");
    const backTop = document.getElementById("back-top");
    function onScroll() {
      const doc = document.documentElement;
      const total = doc.scrollHeight - doc.clientHeight;
      const scrolled = total > 0 ? doc.scrollTop / total : 0;
      if (progressBar) progressBar.style.width = scrolled * 100 + "%";
      if (backTop) backTop.classList.toggle("show", doc.scrollTop > 400);
      highlightNav();
    }
    if (backTop) {
      backTop.addEventListener("click", function (e) {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
    }
    window.addEventListener("scroll", onScroll, { passive: true });

    /* ---------- Active nav link on scroll ---------- */
    const sections = document.querySelectorAll("section[id]");
    const navAnchors = document.querySelectorAll(".nav-links a[href^='#']");

    function highlightNav() {
      if (!sections.length) return;
      let current = sections[0].id;
      const scrollPos = window.scrollY + 120;
      sections.forEach(function (s) {
        if (scrollPos >= s.offsetTop) current = s.id;
      });
      navAnchors.forEach(function (a) {
        a.classList.toggle("active", a.getAttribute("href") === "#" + current);
      });
    }
    highlightNav();

    /* ---------- Scroll reveal ---------- */
    const revealEls = document.querySelectorAll(".reveal");
    if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              entry.target.classList.add("visible");
              io.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.12 }
      );
      revealEls.forEach(function (el) {
        io.observe(el);
      });
    } else {
      revealEls.forEach(function (el) {
        el.classList.add("visible");
      });
    }

    /* ---------- Pie chart animation ---------- */
    const pies = document.querySelectorAll(".pie[data-val]");
    if (pies.length) {
      if ("IntersectionObserver" in window) {
        const po = new IntersectionObserver(
          function (entries) {
            entries.forEach(function (entry) {
              if (entry.isIntersecting) {
                const target = entry.target;
                const val = parseInt(target.getAttribute("data-val"), 10);
                let cur = 0;
                const step = function () {
                  cur = Math.min(cur + 2, val);
                  target.style.setProperty("--p", cur);
                  if (cur < val) requestAnimationFrame(step);
                };
                step();
                po.unobserve(target);
              }
            });
          },
          { threshold: 0.3 }
        );
        pies.forEach(function (el) {
          el.style.setProperty("--p", 0);
          po.observe(el);
        });
      } else {
        pies.forEach(function (el) {
          el.style.setProperty("--p", el.getAttribute("data-val"));
        });
      }
    }

    /* ---------- M0USS1 type-out + hover scramble ---------- */
    (function () {
      const el = document.getElementById("scramble");
      if (!el) return;
      const full = el.getAttribute("data-text") || "M0USS1";
      const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#@%&*$!?/\\|-_";

      function randomChar() {
        return chars[Math.floor(Math.random() * chars.length)];
      }

      // 1) Type out letter by letter (each reveals by cycling random chars)
      let typedLen = 0;
      let typing = true;
      const typeTimer = setInterval(function () {
        if (typedLen >= full.length) {
          clearInterval(typeTimer);
          typing = false;
          el.textContent = full;
          return;
        }
        // fill up to typedLen with final, rest with random
        let out = "";
        for (let i = 0; i < full.length; i++) {
          out += i < typedLen ? full[i] : randomChar();
        }
        el.textContent = out;
        typedLen++;
      }, 70);

      // 2) On hover: scramble all, then settle back
      let scrambleTimer = null;
      el.addEventListener("mouseenter", function () {
        if (scrambleTimer) return;
        let cycles = 0;
        scrambleTimer = setInterval(function () {
          cycles++;
          let out = "";
          for (let i = 0; i < full.length; i++) {
            out += Math.random() < 0.6 ? randomChar() : full[i];
          }
          el.textContent = out;
          if (cycles > 14) {
            clearInterval(scrambleTimer);
            scrambleTimer = null;
            el.textContent = full;
          }
        }, 45);
      });
    })();

    /* ---------- Mouse-follow glow edge ---------- */
    (function () {
      const cards = document.querySelectorAll(".glow-card");
      if (!cards.length || !window.matchMedia("(hover: hover)").matches) return;
      let raf = 0;
      document.addEventListener("mousemove", function (e) {
        if (raf) return;
        raf = window.requestAnimationFrame(function () {
          raf = 0;
          cards.forEach(function (c) {
            const r = c.getBoundingClientRect();
            c.style.setProperty("--mx", (e.clientX - r.left) + "px");
            c.style.setProperty("--my", (e.clientY - r.top) + "px");
          });
        });
      });
    })();
  });

  /* ---------- Square surveillance-tracker cursor ---------- */
  const tracker = document.querySelector(".cursor-tracker");
  const ghost = document.querySelector(".cursor-ghost");

  if (tracker && ghost && window.matchMedia("(hover: hover)").matches) {
    // build lock-on corner ticks for the tracker frame
    if (!tracker.querySelector(".tick")) {
      tracker.innerHTML =
        '<span class="tick tl"></span><span class="tick tr"></span>' +
        '<span class="tick bl"></span><span class="tick br"></span>';
    }

    let mx = 0, my = 0, gx = 0, gy = 0;
    document.addEventListener("mousemove", function (e) {
      mx = e.clientX;
      my = e.clientY;
      tracker.style.left = mx + "px";
      tracker.style.top = my + "px";
    });
    function loopGhost() {
      gx += (mx - gx) * 0.1;
      gy += (my - gy) * 0.1;
      ghost.style.left = gx + "px";
      ghost.style.top = gy + "px";
      requestAnimationFrame(loopGhost);
    }
    loopGhost();

    document
      .querySelectorAll("a, button, .card, .gcard, .filter-btn, .link-card, .theme-toggle, .lang-trigger, .lang-opt")
      .forEach(function (el) {
        el.addEventListener("mouseenter", function () {
          tracker.classList.add("hover");
        });
        el.addEventListener("mouseleave", function () {
          tracker.classList.remove("hover");
        });
      });
  }

  window.m0uss1 = {
    translate: translate,
    getLang: function () {
      return currentLang;
    }
  };
})();
