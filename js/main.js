/* ================================================================
   OTS — Epoxy Resin Systems
   Main JavaScript
   ================================================================ */

(function () {
  'use strict';

  // ===== DOM CACHE =====
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

  const loader      = $('#loader');
  const header      = $('#header');
  const burger      = $('#burger');
  const nav         = $('#nav');
  const backToTop   = $('#backToTop');
  const yearEl      = $('#year');
  const contactForm = $('#contactForm');
  const formStatus  = $('#formStatus');
  const particles   = $('#particles');

  // ===== LOADER =====
  window.addEventListener('load', () => {
    setTimeout(() => {
      loader.classList.add('hidden');
    }, 600);
  });

  // Fallback — hide loader after 3s regardless
  setTimeout(() => loader.classList.add('hidden'), 3000);

  // ===== CURRENT YEAR =====
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }

  // ===== LANGUAGE SWITCHER =====
  // Moved to standalone inline script in index.html for isolation

  // Helper: get current translation for a key
  function getTranslation(key) {
    const lang = document.documentElement.lang || 'en';
    if (typeof translations !== 'undefined' && translations[key] && translations[key][lang]) {
      return translations[key][lang];
    }
    return key;
  }

  // ===== HEADER SCROLL =====
  let lastScroll = 0;

  function handleHeaderScroll() {
    const y = window.scrollY;
    header.classList.toggle('header--scrolled', y > 50);
    lastScroll = y;
  }

  window.addEventListener('scroll', throttle(handleHeaderScroll, 100), { passive: true });
  handleHeaderScroll(); // initial check

  // ===== MOBILE NAVIGATION =====
  burger.addEventListener('click', () => {
    const isOpen = burger.classList.toggle('active');
    nav.classList.toggle('open', isOpen);
    burger.setAttribute('aria-expanded', isOpen);
    document.body.classList.toggle('no-scroll', isOpen);
  });

  // Close on link click
  $$('.header__nav-link').forEach(link => {
    link.addEventListener('click', () => {
      burger.classList.remove('active');
      nav.classList.remove('open');
      burger.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('no-scroll');
    });
  });

  // ===== ACTIVE NAV LINK HIGHLIGHTING =====
  const sections = $$('section[id]');
  const navLinks = $$('.header__nav-link:not(.header__nav-link--cta)');

  function highlightNav() {
    const scrollY = window.scrollY + 120;
    let currentId = '';

    sections.forEach(section => {
      if (scrollY >= section.offsetTop) {
        currentId = section.id;
      }
    });

    navLinks.forEach(link => {
      link.classList.toggle(
        'header__nav-link--active',
        link.getAttribute('href') === `#${currentId}`
      );
    });
  }

  window.addEventListener('scroll', throttle(highlightNav, 100), { passive: true });

  // ===== BACK TO TOP =====
  function handleBackToTop() {
    backToTop.classList.toggle('visible', window.scrollY > 500);
  }

  window.addEventListener('scroll', throttle(handleBackToTop, 100), { passive: true });

  backToTop.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // ===== SCROLL ANIMATIONS (Intersection Observer) =====
  const animElements = $$('[data-animate]');

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const delay = entry.target.dataset.delay || 0;
            setTimeout(() => {
              entry.target.classList.add('visible');
            }, parseInt(delay, 10));
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );

    animElements.forEach(el => observer.observe(el));
  } else {
    // Fallback for older browsers
    animElements.forEach(el => el.classList.add('visible'));
  }

  // ===== COUNTER ANIMATION =====
  const counters = $$('[data-count]');

  if ('IntersectionObserver' in window) {
    const counterObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            animateCounter(entry.target);
            counterObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.5 }
    );

    counters.forEach(el => counterObserver.observe(el));
  }

  function animateCounter(el) {
    const target = parseInt(el.dataset.count, 10);
    const duration = 1500;
    const start = performance.now();

    function update(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(target * eased);

      if (progress < 1) {
        requestAnimationFrame(update);
      } else {
        el.textContent = target;
      }
    }

    requestAnimationFrame(update);
  }

  // ===== PROJECT TABS =====
  const tabs   = $$('.projects__tab');
  const panels = $$('.projects__panel');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.tab;

      tabs.forEach(t => t.classList.remove('projects__tab--active'));
      tab.classList.add('projects__tab--active');

      panels.forEach(panel => {
        panel.classList.remove('projects__panel--active');
        if (panel.id === `panel-${target}`) {
          panel.classList.add('projects__panel--active');
        }
      });
    });
  });

  // ===== CONTACT FORM =====
  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();

      // Basic validation
      const name    = $('#name').value.trim();
      const email   = $('#email').value.trim();
      const subject = $('#subject').value;
      const message = $('#message').value.trim();

      if (!name || !email || !subject || !message) {
        showFormStatus(getTranslation('form.error.fields'), 'error');
        return;
      }

      if (!isValidEmail(email)) {
        showFormStatus(getTranslation('form.error.email'), 'error');
        return;
      }

      // Submit to Formsubmit.co via AJAX
      const submitBtn = contactForm.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      submitBtn.innerHTML = `
        <svg class="btn__spinner" viewBox="0 0 24 24" fill="none" style="width:18px;height:18px;animation:spin 1s linear infinite">
          <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" stroke-dasharray="31.4" stroke-linecap="round"/>
        </svg>
        ${getTranslation('form.sending')}
      `;

      const formData = new FormData(contactForm);

      fetch(contactForm.action, {
        method: 'POST',
        body: formData,
        headers: { 'Accept': 'application/json' }
      })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          showFormStatus(getTranslation('form.success'), 'success');
          contactForm.reset();
        } else {
          showFormStatus(getTranslation('form.error.send'), 'error');
        }
        submitBtn.disabled = false;
        submitBtn.textContent = getTranslation('form.submit');
      })
      .catch(() => {
        showFormStatus(getTranslation('form.error.send'), 'error');
        submitBtn.disabled = false;
        submitBtn.textContent = getTranslation('form.submit');
      });
    });
  }

  function showFormStatus(msg, type) {
    formStatus.textContent = msg;
    formStatus.className = 'contact__form-status';
    formStatus.classList.add(`contact__form-status--${type}`);

    // Auto-hide after 5s
    setTimeout(() => {
      formStatus.className = 'contact__form-status';
    }, 5000);
  }

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  // ===== HERO PARTICLES =====
  function createParticles() {
    if (!particles) return;
    const count = window.innerWidth > 768 ? 30 : 15;

    for (let i = 0; i < count; i++) {
      const particle = document.createElement('div');
      const size = Math.random() * 3 + 1;

      Object.assign(particle.style, {
        position: 'absolute',
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: '50%',
        background: Math.random() > 0.5
          ? 'rgba(0,102,255,.3)'
          : 'rgba(0,212,170,.2)',
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        animation: `particleFloat ${6 + Math.random() * 8}s ease-in-out infinite`,
        animationDelay: `${Math.random() * 5}s`,
        pointerEvents: 'none',
      });

      particles.appendChild(particle);
    }
  }

  // Inject particle keyframes
  const particleStyle = document.createElement('style');
  particleStyle.textContent = `
    @keyframes particleFloat {
      0%, 100% { transform: translate(0, 0) scale(1); opacity: .4; }
      25%      { transform: translate(${rand(-30,30)}px, ${rand(-40,40)}px) scale(1.2); opacity: .7; }
      50%      { transform: translate(${rand(-20,20)}px, ${rand(-50,50)}px) scale(.8); opacity: .3; }
      75%      { transform: translate(${rand(-40,40)}px, ${rand(-30,30)}px) scale(1.1); opacity: .6; }
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(particleStyle);
  createParticles();

  // ===== SMOOTH SCROLL (for browsers that need extra help) =====
  $$('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        e.preventDefault();
        const offset = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--header-h'), 10) || 72;
        const top = target.offsetTop - offset;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  });

  // ===== UTILITY: Throttle =====
  function throttle(fn, wait) {
    let lastTime = 0;
    return function (...args) {
      const now = Date.now();
      if (now - lastTime >= wait) {
        lastTime = now;
        fn.apply(this, args);
      }
    };
  }

  // ===== UTILITY: Random Number =====
  function rand(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

})();
