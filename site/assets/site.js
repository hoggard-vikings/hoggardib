// Mobile menu toggle + CAS photo carousel. The site works without this file.
document.documentElement.classList.add('js');

(function () {
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
})();
