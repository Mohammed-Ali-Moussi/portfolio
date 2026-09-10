(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", function () {
    // Copy email to clipboard instead of default mailto
    var emailCard = document.querySelector(".link-card[data-copy]");
    if (emailCard && navigator.clipboard) {
      emailCard.addEventListener("click", function (e) {
        e.preventDefault();
        var email = emailCard.getAttribute("data-copy");
        navigator.clipboard.writeText(email).then(function () {
          var sub = emailCard.querySelector(".link-sub");
          if (sub) {
            var original = sub.textContent;
            sub.textContent = "Copied!";
            setTimeout(function () {
              sub.textContent = original;
            }, 1500);
          }
        });
      });
    }
  });
})();
