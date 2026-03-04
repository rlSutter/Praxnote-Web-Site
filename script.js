(function () {
  'use strict';

  // Footer year
  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Mobile nav toggle
  var nav = document.querySelector('.nav');
  var toggle = document.querySelector('.nav-toggle');
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', open);
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    });
    document.addEventListener('click', function (e) {
      if (nav.classList.contains('is-open') && !nav.contains(e.target) && !toggle.contains(e.target)) {
        nav.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.setAttribute('aria-label', 'Open menu');
      }
    });
  }

  // Form validation and submit
  var form = document.getElementById('info-form');
  if (!form) return;

  var requiredIds = ['name', 'email', 'role', 'message'];
  var successEl = document.getElementById('form-success');

  function showError(id, message) {
    var row = document.querySelector('[name="' + id + '"]')?.closest('.form-row');
    var errEl = document.getElementById(id + '-error');
    if (row) row.classList.add('invalid');
    if (errEl) errEl.textContent = message;
  }

  function clearErrors() {
    form.querySelectorAll('.form-row').forEach(function (r) { r.classList.remove('invalid'); });
    form.querySelectorAll('.field-error').forEach(function (e) { e.textContent = ''; });
  }

  function validate() {
    clearErrors();
    var valid = true;
    var name = form.name;
    var email = form.email;
    var role = form.role;
    var message = form.message;

    if (!name.value.trim()) {
      showError('name', 'Please enter your name.');
      valid = false;
    }
    if (!email.value.trim()) {
      showError('email', 'Please enter your email.');
      valid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) {
      showError('email', 'Please enter a valid email address.');
      valid = false;
    }
    if (!role.value) {
      showError('role', 'Please select your primary role.');
      valid = false;
    }
    if (!message.value.trim()) {
      showError('message', 'Please tell us what you\'d like to know.');
      valid = false;
    }
    return valid;
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!validate()) return;

    // For static hosting: show success and optionally log or send to a form service.
    // To collect submissions, set form action to a form endpoint (e.g. Formspree, Netlify Forms)
    // or use fetch() to your backend in the block below.
    form.setAttribute('hidden', '');
    if (successEl) successEl.removeAttribute('hidden');
    successEl?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    // Optional: send to a form backend. Uncomment and set URL for your service.
    // var fd = new FormData(form);
    // fetch('https://your-form-endpoint.com/submit', { method: 'POST', body: fd })
    //   .then(function () { /* show success */ })
    //   .catch(function () { /* show error */ });
  });
})();
