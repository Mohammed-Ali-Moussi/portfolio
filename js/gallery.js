(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", function () {
    var filterBar = document.querySelector(".filter-bar");
    var cards = document.querySelectorAll(".gallery .card");

    if (!filterBar) return;

    filterBar.addEventListener("click", function (e) {
      var btn = e.target.closest(".filter-btn");
      if (!btn) return;
      filterBar.querySelectorAll(".filter-btn").forEach(function (b) {
        b.classList.remove("active");
      });
      btn.classList.add("active");
      var filter = btn.getAttribute("data-filter");
      cards.forEach(function (card) {
        var cat = card.getAttribute("data-category");
        if (filter === "all" || cat === filter) {
          card.classList.remove("hidden");
        } else {
          card.classList.add("hidden");
        }
      });
    });
  });

  /* Lightbox */
  var lightbox = document.getElementById("lightbox");
  if (lightbox) {
    var lightboxImg = document.getElementById("lightbox-img");
    var closeBtn = lightbox.querySelector(".lightbox-close");

    document.addEventListener("click", function (e) {
      var card = e.target.closest(".card[data-image]");
      if (card) {
        lightboxImg.src = card.getAttribute("data-image");
        lightbox.classList.add("open");
        return;
      }
      if (e.target === lightbox || e.target.closest(".lightbox-close")) {
        closeLightbox();
      }
    });

    function closeLightbox() {
      lightbox.classList.remove("open");
    }
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeLightbox();
    });
  }
})();
