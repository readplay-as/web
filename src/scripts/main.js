/* ============================================================
   readplay.app — interactions
   ============================================================ */

import { initField } from "./field.js";

(function () {
  "use strict";

  /* ---------- Background field ---------- */

  initField(document.getElementById("bgField"));

  /* ---------- Mobile menu ---------- */

  var burger = document.getElementById("burger");
  var overlay = document.getElementById("menuOverlay");
  var menu = document.getElementById("mobileMenu");

  function setMenu(open) {
    if (!burger || !overlay || !menu) return;
    burger.setAttribute("aria-expanded", open ? "true" : "false");
    burger.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    overlay.hidden = !open;
    menu.hidden = !open;
    document.body.classList.toggle("menu-open", open);
  }

  function isOpen() {
    return burger && burger.getAttribute("aria-expanded") === "true";
  }

  if (burger) {
    burger.addEventListener("click", function () {
      setMenu(!isOpen());
    });
  }

  if (overlay) {
    overlay.addEventListener("click", function () {
      setMenu(false);
    });
  }

  if (menu) {
    menu.addEventListener("click", function (e) {
      if (e.target.closest("a")) setMenu(false);
    });
  }

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && isOpen()) setMenu(false);
  });

  window.addEventListener("resize", function () {
    if (window.innerWidth > 720 && isOpen()) setMenu(false);
  });
})();
