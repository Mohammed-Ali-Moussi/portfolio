(function () {
  "use strict";

  var currentLang = "en";
  try { currentLang = localStorage.getItem("m0uss1-lang") || "en"; } catch (e) {}

  var IS_GALLERY = /gallery\.html/.test(location.pathname) || /gallery\.html/.test(location.href);

  var items = [];
  var shown = [];
  var activeCat = "all";
  var lightboxList = [];
  var lightboxIdx = 0;
  var i18nReady = false;

  var galleryJSON = IS_GALLERY
    ? document.getElementById("gallery-feed")
    : document.querySelector(".gallery[data-src='index']");

  function t(key) {
    if (window.I18N && I18N[currentLang] && I18N[currentLang][key] !== undefined) return I18N[currentLang][key];
    return key;
  }

  function L(item) {
    return {
      title: (item.title && item.title[currentLang]) || (item.title && item.title.en) || "",
      desc: (item.desc && item.desc[currentLang]) || (item.desc && item.desc.en) || ""
    };
  }

  function typeLabel(type) {
    var k = "work.filter." + type;
    var label = t(k);
    return label === k ? type : label;
  }

  function thumb(item) {
    if (item.media && item.media.kind === "youtube" && item.media.videoId) {
      return "https://img.youtube.com/vi/" + item.media.videoId + "/hqdefault.jpg";
    }
    return item.media && item.media.src ? item.media.src : "";
  }

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  /* ---------------- card markup ---------------- */
  function buildCard(item) {
    var ratio = item.ratio && item.ratio !== "free" ? item.ratio : null;
    var loc = L(item);
    var mediaStyle = "position:relative;";
    var imgStyle = ratio
      ? "position:absolute;inset:0;width:100%;height:100%;object-fit:cover"
      : "position:relative;width:100%;height:auto;object-fit:cover";
    if (ratio) mediaStyle += "aspect-ratio:" + ratio + ";";

    var img = '<img src="' + esc(thumb(item)) +
      '" alt="' + esc(loc.title) + '" loading="lazy" crossorigin="anonymous">';

    var badge = "";
    if (item.media && item.media.kind === "youtube") {
      badge = '<div class="yt-badge" style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);' +
        'width:54px;height:54px;border-radius:50%;display:grid;place-items:center;' +
        'background:rgba(217,4,41,0.25);border:1px solid rgba(217,4,41,0.65);backdrop-filter:blur(8px);' +
        'color:#fff;font-size:1.3rem;z-index:2">&#9654;</div>';
    }

    var year = item.year || "";
    var tags = (item.tags || []).slice(0, 2).join(" · ");
    var meta = [year, tags].filter(Boolean).join(" · ");

    return '<figure class="gcard reveal visible" data-id="' + esc(item.id) +
      '" tabindex="0" role="button" aria-label="' + esc(loc.title) + '">' +
      '<div class="gcard-media" style="' + mediaStyle + '">' +
      img +
      badge +
      '<div class="card-hud" aria-hidden="true">' +
      '<span class="hud-tick tl"></span><span class="hud-tick tr"></span>' +
      '<span class="hud-tick bl"></span><span class="hud-tick br"></span>' +
      '<span class="hud-time">' + esc(year) + '</span>' +
      '</div>' +
      '<div class="gcard-overlay">' +
      '<span class="gcard-type" data-loc="type">' + esc(typeLabel(item.type)) + '</span>' +
      '<h3 data-loc="title">' + esc(loc.title) + '</h3>' +
      '<div class="gcard-meta" data-loc="meta">' + esc(meta) + '</div>' +
      '</div>' +
      '</div>' +
      '</figure>';
  }

  function sortItems(list) {
    return list.slice().sort(function (a, b) {
      if (!!a.featured !== !!b.featured) return a.featured ? -1 : 1;
      return String(b.year || "").localeCompare(String(a.year || ""));
    });
  }

  function filterByCat(list, cat) {
    return cat === "all" ? list : list.filter(function (i) { return i.type === cat; });
  }

  function filterByQuery(list, q) {
    q = (q || "").toLowerCase().trim();
    if (!q) return list;
    return list.filter(function (i) {
      var loc = L(i);
      var hay = [i.type, loc.title, loc.desc, (i.tags || []).join(" ")].join(" ").toLowerCase();
      return hay.indexOf(q) !== -1;
    });
  }

  /* ---------------- index page ---------------- */
  function renderIndex() {
    if (!galleryJSON) return;
    var list = sortItems(items);
    shown = filterByCat(list, activeCat);
    galleryJSON.innerHTML = shown.map(buildCard).join("");
    bindCards();
  }

  /* ---------------- gallery page ---------------- */
  var searchInput, chipsEl, emptyEl, countEl, masonryEl;

  function renderGallery() {
    if (!masonryEl) return;
    var q = searchInput ? searchInput.value : "";
    var list = filterByQuery(filterByCat(items, activeCat), q);
    emptyEl.style.display = list.length ? "none" : "block";
    if (!list.length) { masonryEl.innerHTML = ""; shown = []; return; }
    shown = sortItems(list);
    masonryEl.innerHTML = shown.map(buildCard).join("");
    if (countEl) countEl.textContent = shown.length + " / " + items.length;
    bindCards();
  }

  function buildChips() {
    if (!chipsEl) return;
    var cats = ["all"].concat(Array.from(new Set(items.map(function (i) { return i.type; }))));
    chipsEl.innerHTML = cats.map(function (c) {
      var label = c === "all" ? t("gallery.all") : typeLabel(c);
      var n = items.filter(function (i) { return i.type === c; }).length;
      return '<button class="filter-btn' + (c === activeCat ? " active" : "") + '" data-cat="' + esc(c) + '">' +
        esc(label) + ' <span class="mono opacity-70 text-[0.8rem]">' + n + "</span></button>";
    }).join("");
    chipsEl.querySelectorAll("[data-cat]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        activeCat = btn.getAttribute("data-cat");
        chipsEl.querySelectorAll("[data-cat]").forEach(function (b) { b.classList.toggle("active", b === btn); });
        renderGallery();
        syncURL();
      });
    });
  }

  function syncURL() {
    if (!IS_GALLERY) return;
    var p = new URLSearchParams();
    if (activeCat !== "all") p.set("cat", activeCat);
    if (searchInput && searchInput.value) p.set("q", searchInput.value);
    var suffix = p.toString();
    history.replaceState(null, "", "gallery.html" + (suffix ? "?" + suffix : ""));
  }

  function readURL() {
    try {
      var p = new URLSearchParams(location.search);
      if (p.get("cat")) activeCat = p.get("cat");
      if (p.get("q")) return p.get("q");
    } catch (e) {}
    return "";
  }

  /* ---------------- card events ---------------- */
  function bindCards() {
    galleryJSON.querySelectorAll(".gcard").forEach(function (card) {
      card.addEventListener("click", function () {
        var id = card.getAttribute("data-id");
        var idx = shown.findIndex(function (i) { return i.id === id; });
        if (idx === -1) return;
        openLightbox(idx);
      });
      card.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          card.click();
        }
      });
    });
  }

  /* ---------------- lightbox ---------------- */
  var lb = document.getElementById("lightbox");
  var lbMedia = document.getElementById("lightbox-media");

  function lightboxHTML(item, idx) {
    var loc = L(item);
    var total = lightboxList.length;
    var inner;
    if (item.media && item.media.kind === "youtube" && item.media.videoId) {
      inner = '<iframe src="https://www.youtube-nocookie.com/embed/' + esc(item.media.videoId) +
        '?autoplay=1&rel=0" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>';
    } else if (item.media && item.media.kind === "gif") {
      inner = '<img src="' + esc(thumb(item)) + '" alt="' + esc(loc.title) + '">';
    } else {
      inner = '<img src="' + esc(thumb(item)) + '" alt="' + esc(loc.title) + '">';
    }
    var prev = document.getElementById("lightbox-prev");
    var next = document.getElementById("lightbox-next");
    if (prev) prev.style.display = total > 1 ? "grid" : "none";
    if (next) next.style.display = total > 1 ? "grid" : "none";
    var counter = document.createElement("div");
    counter.className = "lightbox-counter";
    counter.textContent = (idx + 1) + " / " + total;
    var caption = document.getElementById("lightbox-caption");
    caption.textContent = loc.title + (loc.desc ? " — " + loc.desc : "");
    caption.style.position = "";
    return inner;
  }

  function openLightbox(idx) {
    lightboxList = shown;
    lightboxIdx = idx;
    if (!lb || !lbMedia) return;
    lbMedia.innerHTML = lightboxHTML(shown[idx], idx);
    lb.classList.add("open");
    document.body.style.overflow = "hidden";
    if (lb.parentNode) lb.parentNode.removeChild(lb);
    document.body.appendChild(lb);
  }

  function closeLightbox() {
    if (!lb) return;
    lb.classList.remove("open");
    if (lbMedia) lbMedia.innerHTML = "";
    document.body.style.overflow = "";
  }

  function goLightbox(step) {
    if (!lb || !lb.classList.contains("open")) return;
    if (!lightboxList.length) return;
    lightboxIdx = (lightboxIdx + step + lightboxList.length) % lightboxList.length;
    lbMedia.innerHTML = lightboxHTML(lightboxList[lightboxIdx], lightboxIdx);
  }

  if (lb) {
    lb.addEventListener("click", function (e) {
      if (e.target === lb) closeLightbox();
    });
    var lbClose = lb.querySelector(".lightbox-close");
    if (lbClose) lbClose.addEventListener("click", closeLightbox);
    var prevBtn = document.getElementById("lightbox-prev");
    var nextBtn = document.getElementById("lightbox-next");
    if (prevBtn) prevBtn.addEventListener("click", function () { goLightbox(-1); });
    if (nextBtn) nextBtn.addEventListener("click", function () { goLightbox(1); });
  }

  document.addEventListener("keydown", function (e) {
    if (!lb || !lb.classList.contains("open")) return;
    if (e.key === "Escape") closeLightbox();
    if (e.key === "ArrowLeft") goLightbox(-1);
    if (e.key === "ArrowRight") goLightbox(1);
  });

  /* ---------------- boot ---------------- */
  function render() {
    if (IS_GALLERY) {
      buildChips();
      renderGallery();
    } else {
      renderIndex();
    }
  }

  function boot() {
    if (!galleryJSON) return;
    if (IS_GALLERY) {
      searchInput = document.getElementById("gallery-search");
      chipsEl = document.getElementById("gallery-chips");
      emptyEl = document.getElementById("gallery-empty");
      countEl = document.getElementById("gallery-count");
      masonryEl = document.getElementById("gallery-feed");
      var q0 = readURL();
      if (q0 && searchInput) searchInput.value = q0;
      if (searchInput) {
        searchInput.addEventListener("input", debounced(function () {
          renderGallery();
          syncURL();
        }, 180));
      }
    } else {
      var bar = document.querySelector(".filter-bar");
      if (bar) {
        bar.querySelectorAll("[data-filter]").forEach(function (btn) {
          btn.addEventListener("click", function () {
            activeCat = btn.getAttribute("data-filter");
            bar.querySelectorAll("[data-filter]").forEach(function (b) { b.classList.toggle("active", b === btn); });
            renderIndex();
          });
        });
      }
    }
    render();
  }

  function debounced(fn, ms) {
    var id;
    return function () {
      clearTimeout(id);
      id = setTimeout(fn, ms);
    };
  }

  fetch("data/gallery.json?t=" + Date.now())
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (data) {
      if (data && Array.isArray(data.items)) items = data.items;
      boot();
    })
    .catch(function () { boot(); });

  window.addEventListener("langchange", function (e) {
    currentLang = e.detail || currentLang;
    render();
  });
  window.addEventListener("i18nready", function () {
    i18nReady = true;
    render();
  });
})();