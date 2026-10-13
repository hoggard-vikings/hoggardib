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

  document.querySelectorAll('[data-carousel]').forEach(function (root) {
    var slides = root.querySelectorAll('[data-slide]');
    var dots = root.querySelectorAll('.dots button');
    var label = root.querySelector('[data-label]');
    var i = 0, n = slides.length;
    function show(k) {
      i = (k + n) % n;
      slides.forEach(function (s, j) { s.hidden = j !== i; });
      dots.forEach(function (d, j) { d.setAttribute('aria-current', String(j === i)); });
      if (label) label.textContent = (i + 1) + ' / ' + n;
    }
    root.querySelector('[data-prev]').addEventListener('click', function () { show(i - 1); });
    root.querySelector('[data-next]').addEventListener('click', function () { show(i + 1); });
    dots.forEach(function (d, j) { d.addEventListener('click', function () { show(j); }); });
    show(0);
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
    if (details) details.open = true;
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
