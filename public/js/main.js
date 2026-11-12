(function () {
  // Mobile menu
  var btn = document.getElementById('menuBtn');
  var nav = document.getElementById('nav');
  if (btn && nav) {
    btn.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    nav.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') { nav.classList.remove('open'); btn.setAttribute('aria-expanded', 'false'); }
    });
  }

  // Veterans November promo: show only through Nov 30, 2026.
  var now = new Date();
  var promoStart = new Date(2026, 10, 1);
  var promoEnd = new Date(2026, 11, 1);
  if (now >= promoStart && now < promoEnd) {
    var bar = document.getElementById('vetPromo');
    var sec = document.getElementById('vets');
    if (bar) bar.hidden = false;
    if (sec) sec.hidden = false;
  }

  // Links that preselect a program on the form
  var select = document.getElementById('programSelect');
  document.querySelectorAll('[data-program]').forEach(function (a) {
    a.addEventListener('click', function () {
      if (select) select.value = a.getAttribute('data-program');
    });
  });

  // Year
  var y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();

  // Reveal on scroll
  var targets = document.querySelectorAll('.bout, .quote, .board, .inventory li, .coach-mark, .coach-copy, .fb-frame, .flyer, .visit');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.12 });
    targets.forEach(function (t) { t.classList.add('reveal'); io.observe(t); });
  }

  // Free class form
  var form = document.getElementById('joinForm');
  var msg = document.getElementById('formMsg');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var data = Object.fromEntries(new FormData(form).entries());
      msg.className = 'form-msg';
      if (!data.name || !data.name.trim()) { msg.textContent = 'Please add your name.'; msg.classList.add('err'); return; }
      if (!data.phone && !data.email) { msg.textContent = 'Add a phone or email so we can reach you.'; msg.classList.add('err'); return; }
      var submit = form.querySelector('button[type="submit"]');
      submit.disabled = true;
      submit.textContent = 'Sending…';
      fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
        .then(function (r) { return r.json().then(function (j) { return { ok: r.ok, j: j }; }); })
        .then(function (res) {
          if (!res.ok) throw new Error(res.j.error || 'Something went wrong.');
          form.reset();
          msg.textContent = "You're in! We'll reach out soon to set up your free class.";
          msg.classList.add('ok');
        })
        .catch(function (err) {
          msg.textContent = err.message + ' Or call (207) 747-1948.';
          msg.classList.add('err');
        })
        .finally(function () {
          submit.disabled = false;
          submit.textContent = 'Get My Free Class';
        });
    });
  }
})();
