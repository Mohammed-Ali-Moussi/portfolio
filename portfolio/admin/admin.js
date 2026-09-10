(function () {
  "use strict";

  /* ---------- tiny helpers ---------- */
  var $ = function (s) { return document.querySelector(s); };
  var $$ = function (s) { return Array.prototype.slice.call(document.querySelectorAll(s)); };
  var esc = function (s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  };
  var uid = function () { return "w" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); };

  function toast(msg, kind) {
    var el = document.createElement("div");
    el.className = "toast " + (kind || "ok");
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(function () { el.classList.add("show"); }, 10);
    setTimeout(function () { el.classList.remove("show"); setTimeout(function () { el.remove(); }, 300); }, 2400);
  }

  function api(url, method, body) {
    return fetch(url, {
      method: method || "GET",
      headers: { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body)
    }).then(function (r) {
      return r.json().then(function (d) { if (!r.ok) throw new Error(d.error || r.status); return d; });
    });
  }

  var RATIOS = ["1:1", "3:2", "2:3", "4:3", "16:9", "9:16", "1:2", "2:1", "free"];
  var KINDS = ["image", "gif", "youtube"];

  /* ---------- state ---------- */
  var items = [];
  var i18n = { en: {}, fr: {}, tn: {} };
  var dirty = false;

  var listEl = $("#items-list");
  var trTable = $("#translations-table");
  var tabs = { items: $("#tab-items"), translations: $("#tab-translations"), preview: $("#tab-preview") };

  function switchTab(name) {
    $$(".tab-panel").forEach(function (p) { p.classList.toggle("hidden", p.getAttribute("data-tab") !== name); });
    $$(".tab-btn").forEach(function (b) { b.classList.toggle("active", b.getAttribute("data-tab") === name); });
    if (name === "preview") refreshPreview();
  }
  $$(".tab-btn").forEach(function (b) { b.addEventListener("click", function () { switchTab(b.getAttribute("data-tab")); }); });

  function refreshPreview() {
    $("#preview-frame").src = "../index.html?t=" + Date.now();
  }
  $("#refresh-preview").addEventListener("click", refreshPreview);

  /* =================================================================
     GALLERY / ITEMS
     ================================================================= */
  function newItem() {
    return {
      id: uid(),
      type: "thumbnails",
      year: String(new Date().getFullYear()),
      featured: false,
      ratio: "16:9",
      media: { kind: "image", src: "" },
      title: { en: "", fr: "", tn: "" },
      desc: { en: "", fr: "", tn: "" },
      tags: []
    };
  }

  function knownTypes() {
    return Array.from(new Set(items.map(function (i) { return i.type; }))).sort();
  }

  function mediaSrcUI(item) {
    if (item.media.kind === "youtube") {
      var vid = item.media.videoId || "";
      return '<div class="grid grid-cols-1 gap-2 sm:grid-cols-2">' +
        '<input type="text" class="inp" id="yt-' + esc(item.id) + '" placeholder="YouTube video ID  (e.g. aqz-KE-bpKQ)" value="' + esc(vid) + '">' +
        '<div class="flex items-center gap-2 text-xs text-zinc-400">paste the ID from a YouTube URL · ' +
        '<a class="text-red-400 underline" href="https://img.youtube.com/vi/' + esc(vid) + '/hqdefault.jpg" target="_blank" rel="noopener">thumb ↗</a></div>' +
        '</div>';
    }
    var kindWord = item.media.kind === "gif" ? "video/* image/*" : "image/*";
    return '<div class="grid grid-cols-1 gap-2 sm:grid-cols-2">' +
      '<input type="file" accept="' + kindWord + '" class="inp file-upload" id="up-' + esc(item.id) + '" data-id="' + esc(item.id) + '">' +
      '<input type="text" class="inp file-path" placeholder="assets/uploads/myfile.png  (or a URL)" value="' + esc(item.media.src || "") + '">' +
      '</div>';
  }

  function itemRow(item) {
    var box = document.createElement("div");
    box.className = "item-card";
    box.innerHTML = [
      '<div class="item-top">',
      '<div class="item-preview" data-id="' + esc(item.id) + '"><div class="ph mono">no preview</div></div>',
      '<div class="item-fields">',
      '<div class="form-row">',
      '<label>type<input type="text" class="inp field-type" list="types-datalist" value="' + esc(item.type) + '"></label>',
      '<label>ratio<select class="inp field-ratio">' + RATIOS.map(function (r) {
        return '<option' + (item.ratio === r ? " selected" : "") + '>' + r + "</option>";
      }).join("") + '</select></label>',
      '<label>year<input type="number" class="inp field-year" value="' + esc(item.year || "") + '"></label>',
      '<label class="chk">featured<input type="checkbox" class="field-featured"' + (item.featured ? " checked" : "") + '></label>',
      '</div>',
      '<div class="form-row">',
      '<label>media kind<select class="inp field-kind">' + KINDS.map(function (k) {
        return '<option' + (item.media.kind === k ? " selected" : "") + '>' + k + "</option>";
      }).join("") + '</select></label>',
      '<div class="grow media-area">' + mediaSrcUI(item) + '</div>',
      '</div>',
      '<div class="form-row">',
      '<label class="col">title EN<input type="text" class="inp field-title" data-lang="en" value="' + esc(item.title && item.title.en) + '"></label>',
      '<label class="col">title FR<input type="text" class="inp field-title" data-lang="fr" value="' + esc(item.title && item.title.fr) + '"></label>',
      '<label class="col">title TN<input type="text" dir="rtl" class="inp field-title" data-lang="tn" value="' + esc(item.title && item.title.tn) + '"></label>',
      '</div>',
      '<div class="form-row">',
      '<label class="col">desc EN<textarea class="inp field-desc" data-lang="en">' + esc(item.desc && item.desc.en) + '</textarea></label>',
      '<label class="col">desc FR<textarea class="inp field-desc" data-lang="fr">' + esc(item.desc && item.desc.fr) + '</textarea></label>',
      '<label class="col">desc TN<textarea dir="rtl" class="inp field-desc" data-lang="tn">' + esc(item.desc && item.desc.tn) + '</textarea></label>',
      '</div>',
      '<div class="form-row">',
      '<label class="grow">tags<textarea class="inp field-tags" rows="1">' + esc((item.tags || []).join(", ")) + '</textarea></label>',
      '</div>',
      '</div>',
      '<div class="item-actions">',
      '<div class="flex flex-wrap gap-1">',
      '<button class="act act-up" data-id="' + esc(item.id) + '" title="move up">▲</button>',
      '<button class="act act-down" data-id="' + esc(item.id) + '" title="move down">▼</button>',
      '<button class="act act-dup" data-id="' + esc(item.id) + '" title="duplicate">⧉</button>',
      '<button class="act act-del danger" data-id="' + esc(item.id) + '" title="delete">✕</button>',
      '</div>',
      '</div>',
      '</div>'
    ].join("");
    box.querySelector(".field-type").addEventListener("input", function (e) { item.type = e.target.value; markDirty(); });
    box.querySelector(".field-ratio").addEventListener("change", function (e) { item.ratio = e.target.value; markDirty(); });
    box.querySelector(".field-year").addEventListener("input", function (e) { item.year = e.target.value; markDirty(); });
    var fFeat = box.querySelector(".field-featured");
    fFeat.addEventListener("change", function () { item.featured = fFeat.checked; markDirty(); });
    var fKind = box.querySelector(".field-kind");
    fKind.addEventListener("change", function () {
      item.media.kind = fKind.value;
      item.media.src = "";
      item.media.videoId = "";
      box.querySelector(".media-area").innerHTML = mediaSrcUI(item);
      bindMedia(box, item);
      markDirty();
    });
    box.querySelectorAll(".field-title").forEach(function (inp) {
      inp.addEventListener("input", function () { item.title[inp.getAttribute("data-lang")] = inp.value; markDirty(); });
    });
    box.querySelectorAll(".field-desc").forEach(function (t) {
      t.addEventListener("input", function () { item.desc[t.getAttribute("data-lang")] = t.value; markDirty(); });
    });
    box.querySelector(".field-tags").addEventListener("input", function (e) {
      item.tags = e.target.value.split(",").map(function (s) { return s.trim(); }).filter(Boolean);
      markDirty();
    });
    box.querySelector(".act-up").addEventListener("click", function () { moveItem(item, -1); });
    box.querySelector(".act-down").addEventListener("click", function () { moveItem(item, 1); });
    box.querySelector(".act-dup").addEventListener("click", function () {
      var copy = JSON.parse(JSON.stringify(item));
      copy.id = uid();
      items.splice(items.indexOf(item), 0, copy);
      renderItems();
      markDirty();
    });
    box.querySelector(".act-del").addEventListener("click", function () {
      items.splice(items.indexOf(item), 1);
      renderItems();
      markDirty();
    });
    bindMedia(box, item);
    return box;
  }

  function bindMedia(box, item) {
    var preview = box.querySelector(".item-preview");
    function paint() {
      var img = item.media.kind === "youtube" && item.media.videoId
        ? "https://img.youtube.com/vi/" + item.media.videoId + "/hqdefault.jpg"
        : (item.media.kind === "youtube" ? "" : item.media.src || "");
      if (!img) {
        preview.innerHTML = '<div class="ph mono">no preview</div>';
        return;
      }
      var im = new Image();
      im.onload = function () { preview.innerHTML = ""; preview.appendChild(im); };
      im.onerror = function () { preview.innerHTML = '<div class="ph mono">broken / offline</div>'; };
      im.src = img;
    }
    var yt = box.querySelector("#yt-" + CSS.escape(item.id));
    if (yt) {
      yt.addEventListener("input", function () { item.media.videoId = yt.value.trim(); markDirty(); paint(); });
    }
    var path = box.querySelector(".file-path");
    if (path) {
      path.addEventListener("input", function () { item.media.src = path.value.trim(); markDirty(); paint(); });
    }
    var file = box.querySelector(".file-upload");
    if (file) {
      file.addEventListener("change", function () {
        if (!file.files.length) return;
        var f = file.files[0];
        var reader = new FileReader();
        reader.onload = function () {
          var b64 = String(reader.result);
          var mime = f.type || (f.name.match(/\.(png|jpg|jpeg|webp|gif)$/i) ? "image/" + f.name.split(".").pop().toLowerCase() : "image/png");
          toast("uploading " + f.name + " …");
          api("/api/upload", "POST", { data: b64, name: f.name, mime: mime })
            .then(function (r) {
              item.media.src = r.path;
              if (path) path.value = r.path;
              paint();
              toast("uploaded → " + r.path);
              markDirty();
            })
            .catch(function (e) { toast("upload failed: " + e.message, "err"); });
        };
        reader.readAsDataURL(f);
      });
    }
    paint();
  }

  function moveItem(item, dir) {
    var idx = items.indexOf(item);
    var target = idx + dir;
    if (target < 0 || target >= items.length) return;
    items.splice(idx, 1);
    items.splice(target, 0, item);
    renderItems();
    markDirty();
  }

  function renderItems() {
    var dl = $("#types-datalist");
    dl.innerHTML = knownTypes().map(function (t) { return "<option>" + esc(t) + "</option>"; }).join("");
    listEl.innerHTML = "";
    items.forEach(function (item) { listEl.appendChild(itemRow(item)); });
  }

  function markDirty() {
    dirty = true;
    $("#save-gallery").classList.add("pulse");
  }
  function clearDirty() {
    dirty = false;
    $("#save-gallery").classList.remove("pulse");
  }

  $("#add-item").addEventListener("click", function () {
    var item = newItem();
    items.push(item);
    renderItems();
    markDirty();
    listEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
  });

  $("#save-gallery").addEventListener("click", function () {
    var btn = this;
    btn.disabled = true;
    api("/api/gallery", "POST", { items: items })
      .then(function (r) {
        toast("saved " + r.count + " items");
        clearDirty();
      })
      .catch(function (e) { toast("save failed: " + e.message, "err"); })
      .finally(function () { btn.disabled = false; });
  });

  /* =================================================================
     TRANSLATIONS
     ================================================================= */
  function i18nKeys(lang) {
    return Object.keys(i18n[lang] || {}).sort();
  }

  function groupOf(key) {
    var i = key.indexOf(".");
    return i === -1 ? key : key.slice(0, i);
  }

  function renderTranslations() {
    var keys = i18nKeys("en");
    var groups = {};
    keys.forEach(function (k) { (groups[groupOf(k)] = groups[groupOf(k)] || []).push(k); });
    var html = [];
    Object.keys(groups).sort().forEach(function (g) {
      html.push('<tr class="group-row"><td colspan="5">' + esc(g) + "</td></tr>");
      groups[g].forEach(function (k) {
        html.push('<tr class="key-row" data-key="' + esc(k) + '">' +
          "<td><code>" + esc(k) + "</code></td>" +
          '<td><input class="inp v" data-lang="en" value="' + esc(i18n.en[k]) + '"></td>' +
          '<td><input class="inp v" data-lang="fr" value="' + esc(i18n.fr[k]) + '"></td>' +
          '<td><input class="inp v" data-lang="tn" dir="rtl" value="' + esc(i18n.tn[k]) + '"></td>' +
          '<td><button class="act danger del-key" data-key="' + esc(k) + '">✕</button></td>' +
          "</tr>");
      });
    });
    trTable.innerHTML = html.join("");
    trTable.querySelectorAll(".v").forEach(function (inp) {
      inp.addEventListener("input", function () {
        var row = inp.closest("[data-key]");
        i18n[inp.getAttribute("data-lang")][row.getAttribute("data-key")] = inp.value;
        markTransDirty();
      });
    });
    trTable.querySelectorAll(".del-key").forEach(function (b) {
      b.addEventListener("click", function () {
        var k = b.getAttribute("data-key");
        if (!confirm("Delete key " + k + " from all languages?")) return;
        ["en", "fr", "tn"].forEach(function (l) { delete i18n[l][k]; });
        renderTranslations();
        markTransDirty();
      });
    });
  }

  $("#add-key").addEventListener("click", function () {
    var key = $("#new-key").value.trim();
    if (!key) return toast("enter a key first", "err");
    ["en", "fr", "tn"].forEach(function (l) { if (!(key in i18n[l])) i18n[l][key] = ""; });
    $("#new-key").value = "";
    renderTranslations();
    markTransDirty();
  });
  $("#new-key").addEventListener("keydown", function (e) {
    if (e.key === "Enter") { e.preventDefault(); $("#add-key").click(); }
  });

  function markTransDirty() {
    $("#save-i18n").classList.add("pulse");
  }

  $("#save-i18n").addEventListener("click", function () {
    var btn = this;
    btn.disabled = true;
    api("/api/i18n", "POST", i18n)
      .then(function () {
        toast("translations saved");
        btn.classList.remove("pulse");
      })
      .catch(function (e) { toast("save failed: " + e.message, "err"); })
      .finally(function () { btn.disabled = false; });
  });

  $("#backup-now").addEventListener("click", function () {
    api("/api/backup", "POST")
      .then(function (r) { toast("backup " + r.name + " created"); refreshBackups(); })
      .catch(function (e) { toast("backup failed: " + e.message, "err"); });
  });

  function refreshBackups() {
    api("/api/backup", "GET").then(function (r) {
      var sel = $("#restore-list");
      sel.innerHTML = "<option value=''>— restore a backup —</option>" +
        (r.backups || []).map(function (n) { return "<option>" + esc(n) + "</option>"; }).join("");
      sel.disabled = !(r.backups && r.backups.length);
    }).catch(function () {});
  }
  $("#restore-list").addEventListener("change", function (e) {
    var n = e.target.value;
    if (!n) return;
    if (!confirm("Restore " + n + "? Current data will be overwritten.")) { e.target.value = ""; return; }
    api("/api/backup?restore=" + encodeURIComponent(n), "GET")
      .then(function () {
        toast("restored " + n);
        loadAll();
        refreshBackups();
      })
      .catch(function (er) { toast("restore failed: " + er.message, "err"); });
  });

  /* =================================================================
     BOOT
     ================================================================= */
  function loadAll() {
    return Promise.all([
      api("/api/gallery", "GET"),
      fetch("data/i18n.json").then(function (r) { return r.ok ? r.json() : {}; }),
      api("/api/uploads", "GET").catch(function () { return { files: [] }; })
    ]).then(function (res) {
      var g = res[0];
      items = Array.isArray(g.items) ? g.items : [];
      var d = res[1];
      i18n = { en: d.en || {}, fr: d.fr || {}, tn: d.tn || {} };
      renderItems();
      renderTranslations();
      refreshBackups();
      clearDirty();
      $("#save-gallery").classList.remove("pulse");
      $("#save-i18n").classList.remove("pulse");
      $("#status-line").textContent = "loaded " + items.length + " items · " +
        Object.keys(i18n.en).length + " translation keys · " + (res[2].files || []).length + " uploads";
    }).catch(function (e) {
      toast("load failed: " + e.message + " — is the server running? (python3 admin/server.py)", "err");
    });
  }

  $("#open-site").addEventListener("click", function () {
    window.open("../index.html", "_blank");
  });

  document.addEventListener("keydown", function (e) {
    if ((e.ctrlKey || e.metaKey) && e.key === "s") {
      e.preventDefault();
      if ($(".tab-panel[data-tab='items']") && !$(".tab-panel[data-tab='items']").classList.contains("hidden")) {
        $("#save-gallery").click();
      } else if ($(".tab-panel[data-tab='translations']") && !$(".tab-panel[data-tab='translations']").classList.contains("hidden")) {
        $("#save-i18n").click();
      }
    }
  });

  loadAll();
  switchTab("items");
})();