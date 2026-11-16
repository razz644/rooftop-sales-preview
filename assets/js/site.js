(function () {
  var header = document.querySelector(".site-header");
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.getElementById("site-nav");

  function onScroll() {
    if (!header) return;
    header.classList.toggle("is-stuck", window.scrollY > 8);
  }

  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = document.body.classList.toggle("nav-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    nav.addEventListener("click", function (event) {
      if (event.target.closest("a")) {
        document.body.classList.remove("nav-open");
        toggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
      document.body.classList.remove("nav-open");
      if (toggle) toggle.setAttribute("aria-expanded", "false");
    }
  });
})();

(function () {
  var root = document.querySelector("[data-hero]");
  if (!root) return;
  var slides = Array.prototype.slice.call(root.querySelectorAll(".hero-slide"));
  var dots = Array.prototype.slice.call(root.querySelectorAll("[data-hero-dot]"));
  var current = 0;
  var timer = 0;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function show(index) {
    current = (index + slides.length) % slides.length;
    slides.forEach(function (slide, i) {
      var on = i === current;
      slide.classList.toggle("is-active", on);
      slide.toggleAttribute("inert", !on);
      if (on) slide.removeAttribute("aria-hidden");
      else slide.setAttribute("aria-hidden", "true");
    });
    dots.forEach(function (dot, i) {
      var on = i === current;
      dot.classList.toggle("is-active", on);
      if (on) dot.setAttribute("aria-current", "true");
      else dot.removeAttribute("aria-current");
    });
  }

  function start() {
    stop();
    if (reduce) return;
    timer = window.setInterval(function () { show(current + 1); }, 6500);
  }

  function stop() {
    if (timer) window.clearInterval(timer);
    timer = 0;
  }

  root.querySelector("[data-hero-prev]").addEventListener("click", function () {
    show(current - 1);
    start();
  });
  root.querySelector("[data-hero-next]").addEventListener("click", function () {
    show(current + 1);
    start();
  });
  dots.forEach(function (dot) {
    dot.addEventListener("click", function () {
      show(Number(dot.getAttribute("data-hero-dot")));
      start();
    });
  });
  root.addEventListener("mouseenter", stop);
  root.addEventListener("mouseleave", start);
  root.addEventListener("focusin", stop);
  root.addEventListener("focusout", function (event) {
    if (!root.contains(event.relatedTarget)) start();
  });
  show(0);
  start();
})();

(function () {
  var root = document.querySelector("[data-reviews]");
  if (!root) return;
  var track = root.querySelector(".reviews-track");
  var cards = Array.prototype.slice.call(track.children);
  var prev = root.querySelector("[data-reviews-prev]");
  var next = root.querySelector("[data-reviews-next]");
  var dotsWrap = root.querySelector(".reviews-dots");
  var index = 0;
  var timer = 0;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!cards.length) return;

  function perView() {
    if (window.matchMedia("(max-width: 720px)").matches) return 1;
    if (window.matchMedia("(max-width: 979px)").matches) return 2;
    return 3;
  }

  function maxIndex() {
    return Math.max(0, cards.length - perView());
  }

  function gap() {
    var styles = window.getComputedStyle(track);
    return parseFloat(styles.columnGap || styles.gap) || 0;
  }

  function render() {
    var max = maxIndex();
    if (index > max) index = 0;
    var delta = cards[0].offsetWidth + gap();
    track.style.transform = "translate3d(" + (-index * delta) + "px,0,0)";
    var dots = dotsWrap.querySelectorAll(".reviews-dot");
    if (dots.length !== max + 1) {
      dotsWrap.innerHTML = "";
      for (var i = 0; i <= max; i++) {
        var button = document.createElement("button");
        button.type = "button";
        button.className = "reviews-dot";
        button.setAttribute("aria-label", "Review group " + (i + 1));
        button.addEventListener("click", function (event) {
          var buttons = Array.prototype.slice.call(dotsWrap.children);
          index = buttons.indexOf(event.currentTarget);
          render();
          start();
        });
        dotsWrap.appendChild(button);
      }
      dots = dotsWrap.querySelectorAll(".reviews-dot");
    }
    Array.prototype.forEach.call(dots, function (dot, i) {
      var on = i === index;
      dot.classList.toggle("is-active", on);
      if (on) dot.setAttribute("aria-current", "true");
      else dot.removeAttribute("aria-current");
    });
  }

  function step(dir) {
    var max = maxIndex();
    index += dir;
    if (index > max) index = 0;
    if (index < 0) index = max;
    render();
  }

  function start() {
    stop();
    if (reduce || maxIndex() === 0) return;
    timer = window.setInterval(function () { step(1); }, 5600);
  }

  function stop() {
    if (timer) window.clearInterval(timer);
    timer = 0;
  }

  prev.addEventListener("click", function () { step(-1); start(); });
  next.addEventListener("click", function () { step(1); start(); });
  root.addEventListener("mouseenter", stop);
  root.addEventListener("mouseleave", start);
  root.addEventListener("focusin", stop);
  root.addEventListener("focusout", function (event) {
    if (!root.contains(event.relatedTarget)) start();
  });
  window.addEventListener("resize", render);
  render();
  start();
})();

(function () {
  var section = document.querySelector(".coach");
  if (!section || !("IntersectionObserver" in window)) return;
  var frame = section.querySelector("iframe");
  if (!frame) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  var started = false;

  function command(func) {
    if (!frame.contentWindow) return;
    frame.contentWindow.postMessage(JSON.stringify({
      event: "command",
      func: func,
      args: []
    }), "*");
  }

  function arm() {
    if (started) return;
    var url = new URL(frame.src, window.location.href);
    url.searchParams.set("enablejsapi", "1");
    url.searchParams.set("autoplay", "1");
    url.searchParams.set("mute", "1");
    frame.src = url.toString();
    started = true;
  }

  var watcher = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        arm();
        command("playVideo");
      } else if (started) {
        command("pauseVideo");
      }
    });
  }, { threshold: 0.45 });

  watcher.observe(section);
})();

(function () {
  var form = document.getElementById("consult-form");
  if (!form) return;
  var rules = {
    name: function (value) {
      return value.trim().length >= 2 ? "" : "Enter your full name.";
    },
    email: function (value) {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()) ? "" : "Enter a valid email address.";
    },
    phone: function (value) {
      var digits = value.replace(/\D/g, "");
      return digits.length >= 6 && digits.length <= 20 ? "" : "Enter a phone number with at least 6 digits.";
    },
    program: function (value) {
      return value.trim().length >= 2 ? "" : "Add a short subject.";
    },
    message: function (value) {
      return value.trim().length >= 8 ? "" : "Tell us a little more about what you need.";
    }
  };

  function showError(input, message) {
    var error = document.getElementById(input.getAttribute("aria-describedby"));
    if (!error) return;
    if (message) {
      error.textContent = message;
      error.hidden = false;
      input.setAttribute("aria-invalid", "true");
    } else {
      error.textContent = "";
      error.hidden = true;
      input.removeAttribute("aria-invalid");
    }
  }

  function check(input) {
    var rule = rules[input.name];
    var message = rule ? rule(input.value) : "";
    showError(input, message);
    return !message;
  }

  Object.keys(rules).forEach(function (name) {
    var input = form.elements[name];
    if (!input) return;
    input.addEventListener("input", function () {
      if (input.getAttribute("aria-invalid") === "true") check(input);
    });
  });

  form.addEventListener("submit", function (event) {
    var first = null;
    var valid = true;
    Object.keys(rules).forEach(function (name) {
      var input = form.elements[name];
      if (!input) return;
      if (!check(input)) {
        valid = false;
        if (!first) first = input;
      }
    });
    var consent = form.querySelector('input[name="consent"]');
    var consentError = document.getElementById("consult-consent-error");
    if (consent && !consent.checked) {
      valid = false;
      if (consentError) {
        consentError.textContent = "Please confirm we may contact you about this enquiry.";
        consentError.hidden = false;
      }
      consent.setAttribute("aria-invalid", "true");
      if (!first) first = consent;
    } else if (consent) {
      consent.removeAttribute("aria-invalid");
      if (consentError) {
        consentError.textContent = "";
        consentError.hidden = true;
      }
    }
    if (!valid) {
      event.preventDefault();
      if (first) first.focus();
      return;
    }
    var button = form.querySelector(".consult-submit");
    var label = form.querySelector(".consult-submit-label");
    if (button) {
      button.disabled = true;
      button.setAttribute("aria-busy", "true");
    }
    if (label) label.textContent = "Sending…";
  });
})();

(function () {
  var mega = document.querySelector("[data-mega]");
  if (!mega) return;
  var toggle = mega.querySelector(".nav-mega-toggle");
  var panel = document.getElementById("mega-programs");
  var cats = Array.prototype.slice.call(mega.querySelectorAll("[data-mega-cat]"));
  var panes = Array.prototype.slice.call(mega.querySelectorAll("[data-mega-panel]"));
  var desktop = window.matchMedia("(min-width: 980px)");
  var closeTimer = 0;
  if (!panel) return;

  function cancelClose() {
    if (closeTimer) window.clearTimeout(closeTimer);
    closeTimer = 0;
  }

  function activate(id) {
    cats.forEach(function (cat) {
      var on = cat.getAttribute("data-mega-cat") === id;
      cat.classList.toggle("is-active", on);
      cat.setAttribute("aria-selected", on ? "true" : "false");
      cat.tabIndex = on ? 0 : -1;
    });
    panes.forEach(function (pane) {
      pane.hidden = pane.getAttribute("data-mega-panel") !== id;
    });
  }

  function open() {
    panel.hidden = false;
    mega.classList.add("is-open");
    if (toggle) toggle.setAttribute("aria-expanded", "true");
  }

  function close() {
    panel.hidden = true;
    mega.classList.remove("is-open");
    if (toggle) toggle.setAttribute("aria-expanded", "false");
  }

  cats.forEach(function (cat, index) {
    cat.addEventListener("mouseenter", function () {
      if (desktop.matches) activate(cat.getAttribute("data-mega-cat"));
    });
    cat.addEventListener("click", function () {
      activate(cat.getAttribute("data-mega-cat"));
    });
    cat.addEventListener("keydown", function (event) {
      var next = null;
      if (event.key === "ArrowDown" || event.key === "ArrowRight") next = cats[(index + 1) % cats.length];
      if (event.key === "ArrowUp" || event.key === "ArrowLeft") next = cats[(index - 1 + cats.length) % cats.length];
      if (!next) return;
      event.preventDefault();
      activate(next.getAttribute("data-mega-cat"));
      next.focus();
    });
  });

  if (toggle) {
    toggle.addEventListener("click", function (event) {
      event.stopPropagation();
      if (panel.hidden) open();
      else close();
    });
  }

  mega.addEventListener("mouseenter", function () {
    if (!desktop.matches) return;
    cancelClose();
    open();
  });
  mega.addEventListener("mouseleave", function () {
    if (!desktop.matches) return;
    cancelClose();
    closeTimer = window.setTimeout(close, 220);
  });
  mega.addEventListener("focusin", function () {
    if (desktop.matches) open();
  });
  mega.addEventListener("focusout", function (event) {
    if (!desktop.matches) return;
    if (!mega.contains(event.relatedTarget)) close();
  });
  document.addEventListener("click", function (event) {
    if (!mega.contains(event.target)) close();
  });
  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") close();
  });
})();

(function () {
  function bind(form) {
    if (!form) return;

    function show(input, message) {
      var error = document.getElementById(input.getAttribute("aria-describedby"));
      if (!error) return;
      error.textContent = message;
      error.hidden = !message;
      if (message) input.setAttribute("aria-invalid", "true");
      else input.removeAttribute("aria-invalid");
    }

    form.addEventListener("submit", function (event) {
      var first = form.elements.first_name;
      var last = form.elements.last_name;
      var email = form.elements.your_email;
      var phone = form.elements.your_phone;
      var company = form.elements.company;
      var message = form.elements.message;
      var full = (first.value + " " + last.value).trim();
      var bad = null;

      function check(input, problem) {
        show(input, problem);
        if (problem && !bad) bad = input;
      }

      check(first, first.value.trim() ? "" : "Enter your first name.");
      check(last, last.value.trim() ? "" : "Enter your last name.");
      if (full.length < 2) check(last, "Enter your first and last name.");
      check(email, /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim()) ? "" : "Enter a valid email address.");
      check(phone, phone.value.replace(/\D/g, "").length >= 6 ? "" : "Enter a phone number with at least 6 digits.");
      check(company, company.value.trim() ? "" : "Enter your company.");
      var note = message.value.trim();
      check(message, note.length === 0 || note.length >= 8 ? "" : "Add a little more detail, or leave the message blank.");
      if (bad) {
        event.preventDefault();
        bad.focus();
        return;
      }
      form.elements.name.value = full;
      var button = form.querySelector("[type='submit']");
      if (button) button.disabled = true;
    });
  }

  bind(document.getElementById("sm-form"));
  bind(document.getElementById("se-form"));
  bind(document.getElementById("dc-form"));
  bind(document.getElementById("tx-form"));
  bind(document.getElementById("lc-form"));
})();

(function () {
  var nav = document.querySelector(".pn");
  if (!nav) return;
  var items = Array.prototype.slice.call(nav.querySelectorAll("[data-pn]"));
  var desktop = window.matchMedia("(min-width: 980px)");

  function setOpen(item, open) {
    item.classList.toggle("is-open", open);
    var btn = item.querySelector(":scope > .pn-row > .pn-caret, :scope > .pn-caret, :scope > .pn-group-btn");
    if (btn) btn.setAttribute("aria-expanded", open ? "true" : "false");
  }

  function closeAll(except) {
    items.forEach(function (item) {
      if (except && (item === except || item.contains(except))) return;
      setOpen(item, false);
    });
  }

  items.forEach(function (item) {
    var btn = item.querySelector(":scope > .pn-row > .pn-caret, :scope > .pn-caret, :scope > .pn-group-btn");
    if (!btn) return;
    btn.addEventListener("click", function (event) {
      event.stopPropagation();
      var open = !item.classList.contains("is-open");
      closeAll(item);
      setOpen(item, open);
    });
    item.addEventListener("mouseenter", function () {
      if (desktop.matches) btn.setAttribute("aria-expanded", "true");
    });
    item.addEventListener("mouseleave", function () {
      if (desktop.matches) setOpen(item, false);
    });
  });

  document.addEventListener("click", function (event) {
    if (!nav.contains(event.target)) closeAll();
  });
  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") closeAll();
  });
})();

/* Who We Are: count-up stats (always ends on the exact source figure) */
(function () {
  var nums = document.querySelectorAll(".wa-stat [data-count]");
  if (!nums.length || !("IntersectionObserver" in window)) return;
  if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  var run = function (el) {
    var target = parseInt(el.getAttribute("data-count"), 10);
    var start = null, dur = 1400;
    var step = function (t) {
      if (start === null) start = t;
      var p = Math.min((t - start) / dur, 1);
      el.textContent = p < 1 ? String(Math.round(target * (1 - Math.pow(1 - p, 3)))) : String(target);
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { run(e.target); io.unobserve(e.target); }
    });
  }, { threshold: 0.4 });
  nums.forEach(function (el) { io.observe(el); });
})();

/* Let's Connect: form validation + smooth scroll to the form */
(function () {
  var form = document.getElementById("lc-form");
  if (!form) return;
  document.querySelectorAll("[data-lc-scroll]").forEach(function (link) {
    link.addEventListener("click", function (event) {
      var target = document.getElementById("form");
      if (!target) return;
      event.preventDefault();
      var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      target.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
      var first = form.querySelector("input[name='first_name']");
      if (first) setTimeout(function () { first.focus({ preventScroll: true }); }, reduce ? 0 : 600);
    });
  });
})();

/* Premium pages: reveal on scroll + count-up (ends on the exact source figure) */
(function () {
  var root = document.querySelector(".pp");
  if (!root || !("IntersectionObserver" in window)) return;
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  root.classList.add("pp-js");
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); }
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
  root.querySelectorAll("[data-reveal]").forEach(function (el) { io.observe(el); });
  if (reduce) return;
  var cio = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      cio.unobserve(e.target);
      var el = e.target, target = parseInt(el.getAttribute("data-count"), 10), start = null;
      var step = function (t) {
        if (start === null) start = t;
        var p = Math.min((t - start) / 1400, 1);
        el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3))).toLocaleString("en-US");
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
  }, { threshold: 0.4 });
  root.querySelectorAll(".pp-stat [data-count]").forEach(function (el) { cio.observe(el); });
})();

/* Refinements: hero keyboard/swipe/visibility, founder reveal */
(function () {
  var root = document.querySelector("[data-hero]");
  if (root) {
    var prev = root.querySelector("[data-hero-prev]");
    var next = root.querySelector("[data-hero-next]");
    root.addEventListener("keydown", function (e) {
      if (e.key === "ArrowLeft") { e.preventDefault(); prev.click(); }
      if (e.key === "ArrowRight") { e.preventDefault(); next.click(); }
    });
    var sx = 0, sy = 0, tracking = false;
    root.addEventListener("touchstart", function (e) {
      if (e.touches.length !== 1) return;
      sx = e.touches[0].clientX; sy = e.touches[0].clientY; tracking = true;
    }, { passive: true });
    root.addEventListener("touchend", function (e) {
      if (!tracking) return;
      tracking = false;
      var t = e.changedTouches[0];
      var dx = t.clientX - sx, dy = t.clientY - sy;
      if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.3) (dx < 0 ? next : prev).click();
    }, { passive: true });
    document.addEventListener("visibilitychange", function () {
      root.dispatchEvent(new Event(document.hidden ? "mouseenter" : "mouseleave"));
    });
  }
  var items = document.querySelectorAll("[data-reveal-founder]");
  if (!items.length || !("IntersectionObserver" in window)) return;
  document.documentElement.classList.add("rf-js");
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); }
    });
  }, { threshold: 0.15 });
  items.forEach(function (el) { io.observe(el); });
})();
