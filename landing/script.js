(function () {
  'use strict';

  // ----- Nav: shrink/blur on scroll -----
  var nav = document.getElementById('nav');
  if (nav) {
    function onScroll() {
      nav.classList.toggle('scrolled', window.scrollY > 20);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // ----- Mobile menu toggle -----
  var toggle = document.getElementById('nav-toggle');
  var navLinks = document.getElementById('nav-links');
  if (toggle && navLinks) {
    toggle.addEventListener('click', function () {
      var open = navLinks.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open);
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    });
    navLinks.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () { navLinks.classList.remove('open'); });
    });
  }

  // ----- Smooth scroll for anchor links -----
  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (e) {
      var id = this.getAttribute('href');
      if (id === '#') return;
      var el = document.querySelector(id);
      if (el) {
        e.preventDefault();
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  // ----- Features: tab -> panel -----
  var tabs = document.querySelectorAll('.feature-tab');
  var panels = document.querySelectorAll('.feature-panel');
  tabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      var key = this.getAttribute('data-tab');
      tabs.forEach(function (t) { t.classList.remove('active'); t.setAttribute('aria-selected', 'false'); });
      panels.forEach(function (p) { p.classList.remove('active'); });
      this.classList.add('active');
      this.setAttribute('aria-selected', 'true');
      var panel = document.getElementById('panel-' + key);
      if (panel) panel.classList.add('active');
    });
  });

  // ----- Accordion on mobile for features (optional: show first panel only when sidebar is row) -----
  if (window.matchMedia('(max-width: 1024px)').matches) {
    var firstTab = document.querySelector('.feature-tab');
    if (firstTab) firstTab.click();
  }

  // ----- Intersection Observer: fade-up on scroll -----
  var animated = document.querySelectorAll('[data-animate]');
  if (animated.length && 'IntersectionObserver' in window) {
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) entry.target.classList.add('animate-in');
        });
      },
      { rootMargin: '0px 0px -80px 0px', threshold: 0.1 }
    );
    animated.forEach(function (el) { observer.observe(el); });
  }

  // ----- Contact form: prevent default, optional mailto or log -----
  var form = document.getElementById('contact-form');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = form.querySelector('[name="name"]').value;
      var school = form.querySelector('[name="school"]').value;
      var email = form.querySelector('[name="email"]').value;
      var phone = form.querySelector('[name="phone"]').value;
      var subject = 'EdSchool Demo Request';
      var body = 'Name: ' + encodeURIComponent(name) + '\nSchool: ' + encodeURIComponent(school) + '\nEmail: ' + encodeURIComponent(email) + '\nPhone: ' + encodeURIComponent(phone);
      window.location.href = 'mailto:support@edumapping.com?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
    });
  }
})();
