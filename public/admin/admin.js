(function () {
  var state = { signups: [], statuses: [], filter: 'all' };
  var list = document.getElementById('list');

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function api(url, opts) {
    return fetch(url, Object.assign({ headers: { 'Content-Type': 'application/json' } }, opts || {})).then(function (r) {
      if (r.status === 401) { location.href = '/admin'; throw new Error('signed out'); }
      return r.json();
    });
  }

  function load() {
    api('/api/admin/signups').then(function (j) {
      state.signups = j.signups;
      state.statuses = j.statuses;
      render();
    });
  }

  function render() {
    var counts = { all: state.signups.length };
    state.statuses.forEach(function (s) { counts[s] = 0; });
    state.signups.forEach(function (s) { counts[s.status] = (counts[s.status] || 0) + 1; });

    document.getElementById('stats').innerHTML =
      '<div><b>' + counts.all + '</b><span>Total</span></div>' +
      '<div><b>' + (counts['new'] || 0) + '</b><span>New</span></div>' +
      '<div><b>' + (counts.booked || 0) + '</b><span>Booked</span></div>' +
      '<div><b>' + (counts.joined || 0) + '</b><span>Joined</span></div>';

    document.getElementById('filters').innerHTML = ['all'].concat(state.statuses).map(function (s) {
      return '<button type="button" data-filter="' + s + '" class="' + (state.filter === s ? 'on' : '') + '">' + s + ' (' + (counts[s] || 0) + ')</button>';
    }).join('');

    var rows = state.signups.filter(function (s) { return state.filter === 'all' || s.status === state.filter; });
    if (!rows.length) { list.innerHTML = '<p class="empty">No sign-ups here yet.</p>'; return; }

    list.innerHTML = rows.map(function (s) {
      var when = new Date(s.created_at.replace(' ', 'T') + 'Z').toLocaleString();
      var opts = state.statuses.map(function (st) {
        return '<option value="' + st + '"' + (st === s.status ? ' selected' : '') + '>' + st + '</option>';
      }).join('');
      return '<article class="lead status-' + esc(s.status) + '" data-id="' + s.id + '">' +
        '<div class="lead-top"><h2>' + esc(s.name) + '</h2><time>' + esc(when) + '</time></div>' +
        '<div class="lead-meta">' +
          (s.program ? '<span class="tag">' + esc(s.program) + '</span>' : '') +
          (s.experience ? '<span class="tag light">' + esc(s.experience) + '</span>' : '') +
        '</div>' +
        '<div class="lead-contact">' +
          (s.phone ? '<a href="tel:' + esc(s.phone) + '">📞 ' + esc(s.phone) + '</a><a href="sms:' + esc(s.phone) + '">💬 Text</a>' : '') +
          (s.email ? '<a href="mailto:' + esc(s.email) + '">✉️ ' + esc(s.email) + '</a>' : '') +
        '</div>' +
        (s.message ? '<p class="lead-msg">' + esc(s.message) + '</p>' : '') +
        '<div class="lead-actions">' +
          '<label>Status <select class="st">' + opts + '</select></label>' +
          '<input class="notes" placeholder="Notes (private)" value="' + esc(s.notes) + '">' +
          '<button type="button" class="del">Delete</button>' +
        '</div>' +
      '</article>';
    }).join('');
  }

  document.getElementById('filters').addEventListener('click', function (e) {
    var f = e.target.getAttribute('data-filter');
    if (f) { state.filter = f; render(); }
  });

  list.addEventListener('change', function (e) {
    var card = e.target.closest('.lead');
    if (!card) return;
    var id = card.getAttribute('data-id');
    var body = {};
    if (e.target.classList.contains('st')) body.status = e.target.value;
    if (e.target.classList.contains('notes')) body.notes = e.target.value;
    api('/api/admin/signups/' + id, { method: 'PATCH', body: JSON.stringify(body) }).then(function (j) {
      if (!j.ok) return;
      var i = state.signups.findIndex(function (s) { return String(s.id) === id; });
      if (i > -1) state.signups[i] = j.signup;
      render();
    });
  });

  list.addEventListener('click', function (e) {
    if (!e.target.classList.contains('del')) return;
    var card = e.target.closest('.lead');
    var id = card.getAttribute('data-id');
    var name = card.querySelector('h2').textContent;
    if (!confirm('Delete the sign-up from "' + name + '"? This cannot be undone.')) return;
    api('/api/admin/signups/' + id, { method: 'DELETE' }).then(function (j) {
      if (!j.ok) return;
      state.signups = state.signups.filter(function (s) { return String(s.id) !== id; });
      render();
    });
  });

  document.getElementById('logout').addEventListener('click', function () {
    fetch('/api/admin/logout', { method: 'POST' }).then(function () { location.href = '/admin'; });
  });

  load();
})();
