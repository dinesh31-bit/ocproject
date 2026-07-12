/* ==========================================================================
   WILD & ALIVE — Contact page behaviour
   Client-only form validation + submit handling (no backend wired up).
   Progressive enhancement: the form already works via native HTML5
   validation (`required` / `type="email"`) if this script fails to load.
   ========================================================================== */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const FIELDS = [
  {
    id: 'contact-name',
    errorId: 'error-name',
    message: 'Please enter your name.',
    validate: (value) => value.trim().length > 0,
  },
  {
    id: 'contact-email',
    errorId: 'error-email',
    message: 'Please enter a valid email address.',
    validate: (value) => EMAIL_RE.test(value.trim()),
  },
  {
    id: 'contact-subject',
    errorId: 'error-subject',
    message: 'Please enter a subject.',
    validate: (value) => value.trim().length > 0,
  },
  {
    id: 'contact-message',
    errorId: 'error-message',
    message: 'Please write a message.',
    validate: (value) => value.trim().length > 0,
  },
];

function initContactForm() {
  const form = document.getElementById('contact-form');
  const status = document.getElementById('contact-status');
  if (!form) return;

  function validateField(field) {
    const input = document.getElementById(field.id);
    const errorEl = document.getElementById(field.errorId);
    if (!input) return true;

    const valid = field.validate(input.value);
    input.setAttribute('aria-invalid', String(!valid));
    if (errorEl) errorEl.textContent = valid ? '' : field.message;
    return valid;
  }

  function clearField(field) {
    const input = document.getElementById(field.id);
    const errorEl = document.getElementById(field.errorId);
    input?.removeAttribute('aria-invalid');
    if (errorEl) errorEl.textContent = '';
  }

  // Re-validate as the visitor fixes a field, so errors clear promptly.
  FIELDS.forEach((field) => {
    const input = document.getElementById(field.id);
    input?.addEventListener('input', () => {
      if (input.getAttribute('aria-invalid') === 'true') validateField(field);
    });
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();

    const results = FIELDS.map(validateField);
    const allValid = results.every(Boolean);

    if (!allValid) {
      if (status) {
        status.classList.add('is-error');
        status.textContent = 'Please fix the errors above and try again.';
      }
      // Move focus to the first invalid field for keyboard/screen-reader users.
      const firstInvalid = FIELDS.find((field) => document.getElementById(field.id)?.getAttribute('aria-invalid') === 'true');
      if (firstInvalid) document.getElementById(firstInvalid.id)?.focus();
      return;
    }

    const name = form.querySelector('#contact-name').value.trim();

    if (status) {
      status.classList.remove('is-error');
      status.textContent = `Thanks, ${name}! Your message has been received — we'll reply within 2 business days.`;
    }

    form.reset();
    FIELDS.forEach(clearField);
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initContactForm);
} else {
  initContactForm();
}
