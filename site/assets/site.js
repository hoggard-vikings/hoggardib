// Mobile menu, CAS photo carousel, same-page jump animation, "on this page"
// highlighting and section fade-in. The site works without this file.
document.documentElement.classList.add('js');

(function () {
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var btn = document.querySelector('.menu-toggle');
  var nav = document.querySelector('.tabs');
  if (btn && nav) {
    btn.addEventListener('click', function () {
      var open = nav.classList.toggle('is-open');
      btn.setAttribute('aria-expanded', String(open));
    });
  }

  // Tab dropdowns (desktop). A short pause before opening means sweeping the
  // cursor across the tab bar doesn't pop menus open, and a short pause before
  // closing lets the cursor cross the gap into the menu. Once one menu is open,
  // moving to the next tab switches straight away.
  var desktop = window.matchMedia('(min-width: 861px)');
  var tabs = Array.prototype.slice.call(document.querySelectorAll('.tab'));
  function setOpen(tab) {
    tabs.forEach(function (t) {
      var on = t === tab;
      t.classList.toggle('is-open', on);
      var a = t.querySelector(':scope > a');
      if (a) a.setAttribute('aria-expanded', String(on));
    });
    document.body.classList.toggle('menu-open', !!tab);
  }
  function openTab() { return tabs.filter(function (t) { return t.classList.contains('is-open'); })[0]; }
  tabs.forEach(function (tab) {
    var openTimer, closeTimer;
    var a = tab.querySelector(':scope > a');
    if (a) { a.setAttribute('aria-haspopup', 'true'); a.setAttribute('aria-expanded', 'false'); }
    tab.addEventListener('mouseenter', function () {
      if (!desktop.matches) return;
      clearTimeout(closeTimer);
      if (openTab()) setOpen(tab);
      else openTimer = setTimeout(function () { setOpen(tab); }, 140);
    });
    tab.addEventListener('mouseleave', function () {
      clearTimeout(openTimer);
      closeTimer = setTimeout(function () { if (tab.classList.contains('is-open')) setOpen(null); }, 220);
    });
    tab.addEventListener('focusin', function () { if (desktop.matches) setOpen(tab); });
    tab.addEventListener('focusout', function (e) {
      if (!tab.contains(e.relatedTarget) && tab.classList.contains('is-open')) setOpen(null);
    });
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && openTab()) {
      var a = openTab().querySelector(':scope > a');
      setOpen(null);
      if (a) a.focus();
    }
  });

  // Accordions (FAQs, diploma routes, EE archive, subject groups, schedules…):
  // each item glides open and closed, and only one item per group is open at a
  // time — opening one closes whichever other one was open.
  function animateDetails(d, open) {
    var summary = d.querySelector('summary');
    var start = d.offsetHeight; // mid-animation height if one is running
    if (d._anim) { d._anim.cancel(); d._anim = null; }
    d._target = open;
    if (reduceMotion || !d.animate) { d.open = open; d._target = undefined; return; }
    d.classList.add('is-animating');
    d.classList.toggle('is-closing', !open);
    if (open) d.open = true;
    var end = open ? d.offsetHeight : summary.offsetHeight + (d.offsetHeight - d.clientHeight);
    d._anim = d.animate({ height: [start + 'px', end + 'px'] }, { duration: open ? 320 : 260, easing: 'cubic-bezier(.2,.7,.2,1)' });
    var body = d.querySelector('.acc-body');
    if (body && body.animate) body.animate({ opacity: open ? [0, 1] : [1, 0] }, { duration: open ? 320 : 200, easing: 'ease-out', fill: 'forwards' });
    d._anim.onfinish = function () {
      if (!open) d.open = false;
      d.classList.remove('is-animating', 'is-closing');
      d._anim = null;
      d._target = undefined;
      if (body && body.getAnimations) body.getAnimations().forEach(function (a) { a.cancel(); });
    };
  }
  function openDetails(d, animated) {
    var group = d.parentElement;
    Array.prototype.forEach.call(group.children, function (other) {
      if (other !== d && other.tagName === 'DETAILS' && other.open) {
        if (animated) animateDetails(other, false); else other.open = false;
      }
    });
    if (animated) animateDetails(d, true); else d.open = true;
  }
  document.querySelectorAll('.accordion > details').forEach(function (d) {
    var summary = d.querySelector('summary');
    if (!summary) return;
    summary.addEventListener('click', function (e) {
      e.preventDefault();
      // Clicking again mid-animation reverses it.
      var willOpen = d._target === undefined ? !d.open : !d._target;
      if (willOpen) openDetails(d, true); else animateDetails(d, false);
    });
  });
  // Start each group with at most one item open.
  document.querySelectorAll('.accordion').forEach(function (group) {
    var open = group.querySelectorAll(':scope > details[open]');
    for (var i = 1; i < open.length; i++) open[i].open = false;
  });

  // Cards inside a section come in one after another when it scrolls into view.
  document.querySelectorAll('.profile-grid, .rows, .people, .link-list, .accordion, .stat-row, .chips, .compare, .two-up, .split-7-5').forEach(function (group) {
    group.classList.add('stagger');
    Array.prototype.forEach.call(group.children, function (child, i) { child.style.setProperty('--i', Math.min(i, 10)); });
  });

  // Pinned masthead (desktop): a soft shadow appears once the page scrolls, and
  // its real height positions the floating section-link bar just below it.
  var masthead = document.querySelector('.masthead');
  if (masthead) {
    var setMast = function () {
      document.documentElement.style.setProperty('--mast-h', masthead.offsetHeight + 'px');
    };
    var onScroll = function () { masthead.classList.toggle('is-stuck', window.scrollY > 4); };
    setMast(); onScroll();
    window.addEventListener('resize', setMast);
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  // Homepage: the pillar panel overlaps the bottom of the hero photo by a
  // quarter of its own height (it wraps to more rows on smaller screens).
  var pillars = document.querySelector('.hero + .pillars');
  var heroInner = document.querySelector('.hero-inner');
  if (pillars && heroInner) {
    var overlap = function () {
      var q = Math.round(pillars.offsetHeight / 4);
      pillars.style.marginTop = -q + 'px';
      heroInner.style.paddingBottom = (q + (desktop.matches ? 56 : 32)) + 'px';
    };
    overlap();
    window.addEventListener('resize', overlap);
  }

  // Photo slideshows ([data-slideshow]): one full-size photo at a time, slowly
  // cross-fading to the next. Small dots let visitors jump to a photo. Pauses
  // while hovered, off screen or in a background tab, and never auto-advances
  // for visitors who ask for reduced motion.
  document.querySelectorAll('[data-slideshow]').forEach(function (root) {
    var slides = Array.prototype.slice.call(root.querySelectorAll('.slide'));
    if (slides.length < 2) { if (slides[0]) slides[0].classList.add('is-active'); return; }
    var current = 0, paused = false, onScreen = true, timer;
    var interval = parseInt(root.getAttribute('data-interval'), 10) || 5000;
    var dots = document.createElement('div');
    dots.className = 'slideshow-dots';
    var buttons = slides.map(function (s, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('aria-label', 'Photo ' + (i + 1) + ' of ' + slides.length);
      b.addEventListener('click', function () { show(i); restart(); });
      dots.appendChild(b);
      return b;
    });
    root.appendChild(dots);
    function show(i) {
      current = (i + slides.length) % slides.length;
      slides.forEach(function (s, j) { s.classList.toggle('is-active', j === current); s.setAttribute('aria-hidden', String(j !== current)); });
      buttons.forEach(function (b, j) { b.setAttribute('aria-current', String(j === current)); });
    }
    function restart() {
      clearInterval(timer);
      timer = setInterval(function () {
        if (!reduceMotion && !paused && onScreen && !document.hidden) show(current + 1);
      }, interval);
    }
    root.addEventListener('mouseenter', function () { paused = true; });
    root.addEventListener('mouseleave', function () { paused = false; });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) { onScreen = entries[0].isIntersecting; }).observe(root);
    }
    root.classList.add('is-ready');
    show(0);
    restart();
  });

  // Rotating carousels ([data-rotator]): one item in the centre, its
  // neighbours smaller and fainter on each side, turning slowly on their own.
  // Pauses while hovered, focused, off screen or in a background tab; never
  // auto-rotates for visitors who ask for reduced motion. Click a side item,
  // the arrows or a dot to move; swipe on touch screens. Without JavaScript the
  // items simply show as a grid.
  document.querySelectorAll('[data-rotator]').forEach(function (root) {
    var track = root.querySelector('.rotator-track');
    var items = Array.prototype.slice.call(track.children);
    var n = items.length, current = 0, paused = false, onScreen = true, timer;
    var interval = parseInt(root.getAttribute('data-interval'), 10) || 4000;

    var controls = document.createElement('div');
    controls.className = 'rotator-controls';
    var prev = document.createElement('button');
    prev.type = 'button'; prev.className = 'rotator-arrow'; prev.setAttribute('aria-label', 'Previous'); prev.textContent = '←';
    var next = document.createElement('button');
    next.type = 'button'; next.className = 'rotator-arrow'; next.setAttribute('aria-label', 'Next'); next.textContent = '→';
    var dots = document.createElement('div');
    dots.className = 'rotator-dots';
    var dotButtons = items.map(function (item, i) {
      var d = document.createElement('button');
      d.type = 'button';
      d.setAttribute('aria-label', (item.textContent || 'Item').trim().replace(/\s+/g, ' ').replace(/^\d+ \/ \d+ /, '') + ' (' + (i + 1) + ' of ' + n + ')');
      d.addEventListener('click', function () { go(i); restart(); });
      dots.appendChild(d);
      return d;
    });
    controls.appendChild(prev); controls.appendChild(dots); controls.appendChild(next);
    root.appendChild(controls);
    var live = document.createElement('div');
    live.className = 'visually-hidden'; live.setAttribute('aria-live', 'polite');
    root.appendChild(live);

    function layout() {
      var w = track.clientWidth;
      var itemW = items[0].offsetWidth;
      var step = Math.min(itemW * 0.96, (w - itemW) / 2 + itemW * 0.3);
      items.forEach(function (item, i) {
        var o = ((i - current) % n + n + Math.floor(n / 2)) % n - Math.floor(n / 2); // -n/2 … n/2
        var d = Math.abs(o);
        item.style.transform = 'translate(-50%, -50%) translateX(' + (o * step) + 'px) scale(' + (d === 0 ? 1 : d === 1 ? 0.8 : 0.64) + ')';
        item.style.opacity = d === 0 ? 1 : d === 1 ? 0.5 : d === 2 ? 0.18 : 0;
        item.style.zIndex = String(10 - d);
        item.style.visibility = d > 2 ? 'hidden' : 'visible';
        item.classList.toggle('is-center', d === 0);
        item.setAttribute('aria-hidden', String(d !== 0));
      });
      dotButtons.forEach(function (d, i) { d.setAttribute('aria-current', String(i === current)); });
    }
    function go(i) {
      current = (i + n) % n;
      layout();
      if (!autoplay()) live.textContent = (items[current].textContent || '').trim().replace(/\s+/g, ' ');
    }
    function autoplay() { return !reduceMotion && !paused && onScreen && !document.hidden; }
    function restart() {
      clearInterval(timer);
      timer = setInterval(function () { if (autoplay()) go(current + 1); }, interval);
    }

    items.forEach(function (item, i) {
      item.addEventListener('click', function () { if (i !== current) { go(i); restart(); } });
    });
    prev.addEventListener('click', function () { go(current - 1); restart(); });
    next.addEventListener('click', function () { go(current + 1); restart(); });
    root.addEventListener('mouseenter', function () { paused = true; });
    root.addEventListener('mouseleave', function () { paused = false; });
    root.addEventListener('focusin', function () { paused = true; });
    root.addEventListener('focusout', function (e) { if (!root.contains(e.relatedTarget)) paused = false; });
    root.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') { go(current - 1); restart(); }
      if (e.key === 'ArrowRight') { go(current + 1); restart(); }
    });
    var startX = null;
    track.addEventListener('pointerdown', function (e) { startX = e.clientX; });
    track.addEventListener('pointerup', function (e) {
      if (startX === null) return;
      var dx = e.clientX - startX; startX = null;
      if (Math.abs(dx) > 40) { go(current + (dx < 0 ? 1 : -1)); restart(); }
    });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) { onScreen = entries[0].isIntersecting; }).observe(root);
    }
    window.addEventListener('resize', layout);
    root.classList.add('is-ready');
    layout();
    restart();
  });

  // Jump links: scroll smoothly, then flash the section once it's in place so
  // it's obvious where the link went.
  function arrive(target) {
    target.classList.remove('is-arrived');
    void target.offsetWidth; // restart the animation if clicked twice
    target.classList.add('is-arrived');
    setTimeout(function () { target.classList.remove('is-arrived'); }, 1700);
  }
  function whenScrollStops(cb) {
    var done = false, timer;
    function finish() { if (done) return; done = true; window.removeEventListener('scroll', onScroll); cb(); }
    function onScroll() { clearTimeout(timer); timer = setTimeout(finish, 120); }
    window.addEventListener('scroll', onScroll, { passive: true });
    timer = setTimeout(finish, 150); // fires if the page didn't need to move
    setTimeout(finish, 1500);        // safety net
  }
  document.addEventListener('click', function (e) {
    var link = e.target.closest('a[href^="#"]');
    if (!link || link.getAttribute('href').length < 2) return;
    var target = document.getElementById(decodeURIComponent(link.getAttribute('href').slice(1)));
    if (!target) return;
    e.preventDefault();
    var section = target.closest('section') || target;
    section.classList.add('is-visible');
    var details = target.closest('details');
    if (details && !details.open) {
      if (details.parentElement.classList.contains('accordion')) openDetails(details, false);
      else details.open = true;
    }
    target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
    history.pushState(null, '', '#' + target.id);
    whenScrollStops(function () { arrive(section); });
  });
  // Arriving from another page with a #section in the address.
  if (location.hash) {
    var initial = document.getElementById(decodeURIComponent(location.hash.slice(1)));
    if (initial) window.addEventListener('load', function () { arrive(initial.closest('section') || initial); });
  }

  if (!('IntersectionObserver' in window)) return;

  // Highlight the "on this page" link for the section being read.
  var jumpLinks = document.querySelectorAll('.on-this-page a');
  if (jumpLinks.length) {
    var byId = {};
    jumpLinks.forEach(function (a) { byId[a.getAttribute('href').slice(1)] = a; });
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        jumpLinks.forEach(function (a) { a.classList.remove('is-active'); });
        var a = byId[en.target.id];
        if (a) {
          a.classList.add('is-active');
          // Keep the active link visible in the phone-width scrolling bar
          // without moving the page itself.
          var bar = a.parentNode;
          if (a.offsetLeft < bar.scrollLeft || a.offsetLeft + a.offsetWidth > bar.scrollLeft + bar.clientWidth) {
            bar.scrollLeft = a.offsetLeft - 16;
          }
        }
      });
    }, { rootMargin: '-30% 0px -60% 0px' });
    Object.keys(byId).forEach(function (id) {
      var el = document.getElementById(id);
      if (el) spy.observe(el);
    });
  }

  // Fade sections in as they scroll into view.
  if (!reduceMotion) {
    var reveal = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('is-visible'); reveal.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px' });
    document.querySelectorAll('.section, .body-section').forEach(function (s) {
      s.classList.add('reveal');
      reveal.observe(s);
    });
  }
})();
