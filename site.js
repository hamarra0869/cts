(function () {
  "use strict";

  var WHATSAPP = "2250707806775";
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  // Menu mobile
  var menuBtn = $("#menuBtn");
  var menu = $("#mobileMenu");
  menuBtn.addEventListener("click", function () {
    var open = menu.classList.toggle("hidden") === false;
    menuBtn.setAttribute("aria-expanded", String(open));
  });
  menu.addEventListener("click", function (e) {
    if (e.target.tagName === "A") { menu.classList.add("hidden"); menuBtn.setAttribute("aria-expanded", "false"); }
  });

  $("#year").textContent = new Date().getFullYear();

  // Apparition au défilement
  var reveals = $$(".reveal");
  if (reduceMotion || !("IntersectionObserver" in window)) {
    reveals.forEach(function (el) { el.classList.add("is-visible"); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        io.unobserve(entry.target);
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.12 });
    reveals.forEach(function (el) { io.observe(el); });
  }

  // Compteurs
  var counters = $$("[data-count]");
  function runCounter(el) {
    var to = parseInt(el.getAttribute("data-count"), 10);
    var from = parseInt(el.getAttribute("data-from") || "0", 10);
    var start = null, duration = 1400;
    function step(t) {
      if (start === null) start = t;
      var p = Math.min(1, (t - start) / duration);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = String(Math.round(from + (to - from) * eased));
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  if (!reduceMotion && "IntersectionObserver" in window) {
    var co = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        runCounter(entry.target);
        co.unobserve(entry.target);
      });
    }, { threshold: 0.6 });
    counters.forEach(function (el) {
      el.textContent = el.getAttribute("data-from") || "0";
      co.observe(el);
    });
  }

  // En-tête, barre de progression, profondeur des photos, frise de la méthode
  var header = $("#siteHeader");
  var bar = $("#headerBar");
  var progress = $("#progress");
  var parallax = $$("[data-parallax]");
  var timeline = $(".timeline");
  var fill = $(".timeline-fill");
  var ticking = false;

  function onScroll() {
    var y = window.scrollY;
    var h = document.documentElement.scrollHeight - window.innerHeight;
    var scrolled = y > 8;
    header.classList.toggle("is-scrolled", scrolled);
    bar.classList.toggle("h-20", !scrolled);
    bar.classList.toggle("h-16", scrolled);
    progress.style.transform = "scaleX(" + (h > 0 ? y / h : 0) + ")";

    if (!reduceMotion) {
      var vh = window.innerHeight;
      parallax.forEach(function (img) {
        var r = img.parentElement.getBoundingClientRect();
        if (r.bottom < 0 || r.top > vh) return;
        var speed = parseFloat(img.getAttribute("data-parallax"));
        var offset = (r.top + r.height / 2 - vh / 2) * -speed;
        img.style.transform = "translate3d(0," + offset.toFixed(1) + "px,0) scale(1.08)";
      });
    }

    if (timeline && fill) {
      var tr = timeline.getBoundingClientRect();
      var p = Math.min(1, Math.max(0, (window.innerHeight * 0.85 - tr.top) / (window.innerHeight * 0.5)));
      fill.style.transform = "scaleX(" + (reduceMotion ? 1 : p) + ")";
    }
    ticking = false;
  }
  window.addEventListener("scroll", function () {
    if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
  }, { passive: true });
  window.addEventListener("resize", onScroll);
  onScroll();

  // Visionneuse photos
  var lb = $("#lightbox");
  var lbImg = $("#lbImg");
  var lbCap = $("#lbCap");
  var shots = $$("[data-lightbox]").map(function (btn) {
    var img = $("img", btn);
    return { src: img.getAttribute("src"), alt: img.getAttribute("alt"), cap: $("figcaption", btn).textContent, btn: btn };
  });
  var current = 0;

  function show(i) {
    current = (i + shots.length) % shots.length;
    lbImg.src = shots[current].src;
    lbImg.alt = shots[current].alt;
    lbCap.textContent = shots[current].cap + " · " + (current + 1) + "/" + shots.length;
  }
  function openLb(i) {
    show(i);
    if (typeof lb.showModal === "function") lb.showModal(); else lb.setAttribute("open", "");
    document.body.style.overflow = "hidden";
  }
  function closeLb() {
    if (typeof lb.close === "function") lb.close(); else lb.removeAttribute("open");
  }
  lb.addEventListener("close", function () {
    document.body.style.overflow = "";
    if (shots[current]) shots[current].btn.focus();
  });

  shots.forEach(function (s, i) { s.btn.addEventListener("click", function () { openLb(i); }); });
  lb.addEventListener("click", function (e) {
    var action = e.target.closest("[data-lb]");
    if (action) {
      var a = action.getAttribute("data-lb");
      if (a === "close") closeLb();
      if (a === "prev") show(current - 1);
      if (a === "next") show(current + 1);
    } else if (e.target === lb || e.target.tagName === "FIGURE") {
      closeLb();
    }
  });
  document.addEventListener("keydown", function (e) {
    if (!lb.open) return;
    if (e.key === "ArrowLeft") show(current - 1);
    if (e.key === "ArrowRight") show(current + 1);
  });
  var touchX = null;
  lb.addEventListener("touchstart", function (e) { touchX = e.touches[0].clientX; }, { passive: true });
  lb.addEventListener("touchend", function (e) {
    if (touchX === null) return;
    var dx = e.changedTouches[0].clientX - touchX;
    if (Math.abs(dx) > 50) show(current + (dx < 0 ? 1 : -1));
    touchX = null;
  });

  // Formulaire de devis → WhatsApp
  var form = $("#quoteForm");
  var error = $("#q-error");
  var val = function (id) { return document.getElementById(id).value.trim(); };

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var invalid = $$("[required]", form).filter(function (f) { return !f.value.trim(); })[0];
    if (invalid) { error.classList.remove("hidden"); invalid.focus(); return; }
    error.classList.add("hidden");

    var lines = [
      "Bonjour M. Cissé, je souhaite un devis.",
      "",
      "Travaux : " + val("q-type"),
      "Ville du chantier : " + val("q-city"),
      "Description : " + val("q-desc"),
      "",
      "Nom : " + val("q-name"),
      val("q-company") ? "Entreprise : " + val("q-company") : null,
      "Téléphone : " + val("q-phone")
    ].filter(function (l) { return l !== null; });

    window.open("https://wa.me/" + WHATSAPP + "?text=" + encodeURIComponent(lines.join("\n")), "_blank", "noopener");
  });
})();
