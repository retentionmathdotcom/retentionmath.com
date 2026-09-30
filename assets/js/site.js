/* RetentionMath - minimal site behaviour */
(function () {
  "use strict";

  // Mobile nav
  var burger = document.querySelector(".burger");
  var nav = document.getElementById("nav");
  if (burger && nav) {
    burger.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      burger.setAttribute("aria-expanded", open ? "true" : "false");
    });
    nav.addEventListener("click", function (e) {
      if (e.target.tagName === "A") {
        nav.classList.remove("open");
        burger.setAttribute("aria-expanded", "false");
      }
    });
  }

  // Scroll reveal
  var items = document.querySelectorAll(".rv");
  if (!items.length) return;

  if (!("IntersectionObserver" in window)) {
    items.forEach(function (el) { el.classList.add("in"); });
    return;
  }

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add("in");
        io.unobserve(entry.target);
      }
    });
  }, { rootMargin: "0px 0px -60px 0px", threshold: 0.08 });

  items.forEach(function (el) { io.observe(el); });
})();

/* Offer index - expanding rows on the services page */
(function () {
  "use strict";

  var items = document.querySelectorAll(".idx__item");
  if (!items.length) return;

  // Height is driven here rather than in CSS: a grid 0fr-to-1fr transition
  // resolves to zero when triggered by a class change, and collapsing from
  // "auto" needs the start height painted in its own frame before it animates.
  function setOpen(item, open) {
    var btn = item.querySelector(".idx__btn");
    var panel = item.querySelector(".idx__panel");
    item.classList.toggle("is-open", open);
    if (btn) btn.setAttribute("aria-expanded", open ? "true" : "false");
    if (!panel) return;

    if (panel.releaseTimer) {
      window.clearTimeout(panel.releaseTimer);
      panel.releaseTimer = null;
    }

    if (open) {
      panel.style.height = panel.scrollHeight + "px";
      // Release to auto once expanded, so the panel reflows with the viewport.
      panel.releaseTimer = window.setTimeout(function () {
        panel.style.height = "auto";
        panel.releaseTimer = null;
      }, 360);
    } else {
      // Pin the current height, flush layout so it becomes the transition's
      // start value, then collapse. This does not depend on animation frames,
      // so the panel still ends closed in a background tab.
      panel.style.height = panel.scrollHeight + "px";
      panel.getBoundingClientRect();
      panel.style.height = "0px";
    }
  }

  items.forEach(function (item) {
    var btn = item.querySelector(".idx__btn");
    if (!btn) return;
    btn.addEventListener("click", function () {
      setOpen(item, !item.classList.contains("is-open"));
    });
  });

  // Deep links: services.html#ai-build-sprint opens that row and scrolls to it.
  // Smooth programmatic scrolls issued during load get discarded, so this
  // positions the page explicitly and repeats once fonts have settled.
  function scrollToItem(target) {
    var header = document.querySelector(".hdr");
    var offset = (header ? header.offsetHeight : 0) + 20;
    var top = target.getBoundingClientRect().top + window.pageYOffset - offset;
    if (top < 0) { top = 0; }
    // The stylesheet sets scroll-behavior:smooth, and a smooth scroll started
    // during load is discarded. Override it inline for this one jump.
    var root = document.documentElement;
    var prev = root.style.scrollBehavior;
    root.style.scrollBehavior = "auto";
    window.scrollTo(0, top);
    root.style.scrollBehavior = prev;
  }

  function openFromHash(scroll) {
    var id = (window.location.hash || "").slice(1);
    if (!id) return;
    var target = document.getElementById(id);
    if (!target) return;
    var isItem = target.classList.contains("idx__item");
    var isBand = target.classList.contains("idx__band");
    if (!isItem && !isBand) return;
    if (isItem) setOpen(target, true);
    if (!scroll) return;
    scrollToItem(target);
    if (document.readyState !== "complete") {
      window.addEventListener("load", function () { scrollToItem(target); }, { once: true });
    }
  }

  openFromHash(true);
  window.addEventListener("hashchange", function () { openFromHash(true); });
})();

/* Contact form - post in place so the visitor stays on the site */
(function () {
  "use strict";

  var form = document.querySelector("form[data-ajax]");
  if (!form) return;

  var status = document.getElementById("form-status");
  var btn = form.querySelector("button[type=submit]");
  var original = btn ? btn.innerHTML : "";

  function show(text, kind) {
    if (!status) return;
    status.textContent = text;
    status.className = "form__status form__status--" + kind;
  }

  function reset() {
    if (btn) { btn.disabled = false; btn.innerHTML = original; }
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (status) { status.textContent = ""; status.className = "form__status"; }
    if (btn) { btn.disabled = true; btn.textContent = "Sending\u2026"; }

    fetch(form.action, {
      method: "POST",
      body: new FormData(form),
      headers: { Accept: "application/json" }
    }).then(function (res) {
      if (res.ok) {
        form.reset();
        show("Thanks \u2014 that's with me. I read every one of these myself and will reply from dan@retentionmath.com, usually within a business day.", "ok");
        return;
      }
      return res.json().then(function (d) {
        var msg = (d && d.errors && d.errors.length)
          ? d.errors.map(function (x) { return x.message; }).join(", ")
          : "Something went wrong sending that.";
        show(msg + " You can also email dan@retentionmath.com directly.", "err");
      }).catch(function () {
        show("Something went wrong sending that. You can email dan@retentionmath.com directly.", "err");
      });
    }).catch(function () {
      show("That didn't send, which is usually a connection problem. Email dan@retentionmath.com directly and I'll pick it up.", "err");
    }).then(reset, reset);
  });
})();
