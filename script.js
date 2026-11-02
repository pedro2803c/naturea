document.addEventListener('DOMContentLoaded', () => {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const revealItems = document.querySelectorAll('.fade-up-init');
  if ('IntersectionObserver' in window && !prefersReducedMotion) {
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('in-view');
        revealObserver.unobserve(entry.target);
      });
    }, { threshold: .15, rootMargin: '0px 0px -40px 0px' });
    revealItems.forEach((item) => revealObserver.observe(item));
  } else {
    revealItems.forEach((item) => item.classList.add('in-view'));
  }

  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', (event) => {
      const target = document.querySelector(anchor.getAttribute('href'));
      if (!target) return;
      event.preventDefault();
      target.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'start' });
    });
  });

  const searchButton = document.querySelector('.search-action');
  searchButton.addEventListener('click', () => {
    document.querySelector('#about').scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'start' });
  });

  const initialViewportWidth = window.innerWidth;
  const heroSection = document.querySelector('.hero');
  const heroImage = document.querySelector('.hero-image');
  if (initialViewportWidth > 992 && !prefersReducedMotion) {
    heroSection.addEventListener('pointermove', (event) => {
      const bounds = heroSection.getBoundingClientRect();
      const x = ((event.clientX - bounds.left) / bounds.width - .5) * 24;
      const y = ((event.clientY - bounds.top) / bounds.height - .5) * 24;
      heroImage.style.transform = `scale(1.05) translate(${x * .4}px,${y * .4}px)`;
    });
    heroSection.addEventListener('pointerleave', () => { heroImage.style.transform = 'scale(1.02) translate(0,0)'; });
  }

  const tiltCards = document.querySelectorAll('[data-tilt]');
  if (initialViewportWidth > 992 && !prefersReducedMotion) {
    tiltCards.forEach((card) => {
      card.addEventListener('pointermove', (event) => {
        const rect = card.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width - .5;
        const y = (event.clientY - rect.top) / rect.height - .5;
        const rotateY = x * 12;
        const rotateX = y * -12;
        card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-6px)`;
      });
      card.addEventListener('pointerleave', () => { card.style.transform = ''; });
    });
  }

  const productCards = [...document.querySelectorAll('.product-card')];
  productCards.forEach((card) => {
    card.addEventListener('click', () => {
      const selected = card.getAttribute('aria-pressed') !== 'true';
      productCards.forEach((item) => item.setAttribute('aria-pressed', 'false'));
      card.setAttribute('aria-pressed', String(selected));
    });
  });

  const testimonialDeck = document.querySelector('[data-testimonial-deck]');
  const testimonialCards = [...document.querySelectorAll('[data-testimonial]')];
  const paginationButtons = [...document.querySelectorAll('.testimonial-pagination button')];
  const deckBackdrop = document.querySelector('.deck-backdrop');
  let activeTestimonial = 0;
  let autoplayTimer = 0;
  let progressTimer = 0;
  let cycleDuration = 5500;
  let remaining = cycleDuration;
  let cycleStart = 0;
  let deckPaused = false;

  function progressFill(index) {
    return testimonialCards[index].querySelector('.quote-progress i');
  }

  function startProgress(duration) {
    const fill = progressFill(activeTestimonial);
    fill.style.transition = 'none';
    fill.style.width = '0%';
    fill.offsetWidth;
    if (prefersReducedMotion) return;
    window.clearTimeout(progressTimer);
    progressTimer = window.setTimeout(() => {
      if (deckPaused) return;
      fill.style.transition = `width ${duration}ms linear`;
      fill.style.width = '100%';
    }, 50);
  }

  function scheduleAdvance(duration = cycleDuration) {
    window.clearTimeout(autoplayTimer);
    cycleDuration = duration;
    remaining = duration;
    if (prefersReducedMotion || deckPaused) return;
    cycleStart = Date.now();
    autoplayTimer = window.setTimeout(() => activateTestimonial((activeTestimonial + 1) % testimonialCards.length), duration);
    startProgress(duration);
  }

  function activateTestimonial(index) {
    activeTestimonial = (index + testimonialCards.length) % testimonialCards.length;
    testimonialCards.forEach((card, cardIndex) => {
      card.classList.remove('active','next','previous');
      if (cardIndex === activeTestimonial) card.classList.add('active');
      else if (cardIndex === (activeTestimonial + 1) % testimonialCards.length) card.classList.add('next');
      else card.classList.add('previous');
    });
    paginationButtons.forEach((button, buttonIndex) => {
      const selected = buttonIndex === activeTestimonial;
      button.classList.toggle('is-active', selected);
      button.setAttribute('aria-pressed', String(selected));
    });
    deckBackdrop.className = `deck-backdrop tone-${activeTestimonial}`;
    testimonialCards.forEach((_, cardIndex) => {
      if (cardIndex !== activeTestimonial) {
        const fill = progressFill(cardIndex);
        fill.style.transition = 'none';
        fill.style.width = '0%';
      }
    });
    const activeFill = progressFill(activeTestimonial);
    activeFill.style.transition = 'none';
    activeFill.style.width = '0%';
    scheduleAdvance(cycleDuration);
  }

  function pauseDeck() {
    if (deckPaused || prefersReducedMotion) return;
    deckPaused = true;
    window.clearTimeout(autoplayTimer);
    remaining = Math.max(50, cycleDuration - (Date.now() - cycleStart));
    const fill = progressFill(activeTestimonial);
    const currentWidth = getComputedStyle(fill).width;
    fill.style.transition = 'none';
    fill.style.width = currentWidth;
    fill.offsetWidth;
    testimonialDeck.classList.add('is-paused');
  }

  function resumeDeck() {
    if (!deckPaused || prefersReducedMotion) return;
    deckPaused = false;
    testimonialDeck.classList.remove('is-paused');
    const fill = progressFill(activeTestimonial);
    fill.style.transition = `width ${remaining}ms linear`;
    fill.offsetWidth;
    fill.style.width = '100%';
    cycleDuration = remaining;
    cycleStart = Date.now();
    autoplayTimer = window.setTimeout(() => {
      cycleDuration = 5500;
      activateTestimonial((activeTestimonial + 1) % testimonialCards.length);
    }, remaining);
  }

  testimonialCards.forEach((card, index) => {
    card.addEventListener('click', () => { if (index !== activeTestimonial) activateTestimonial(index); });
    card.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        activateTestimonial(index);
      }
    });
  });
  paginationButtons.forEach((button, index) => button.addEventListener('click', () => activateTestimonial(index)));
  testimonialDeck.addEventListener('mouseenter', pauseDeck);
  testimonialDeck.addEventListener('mouseleave', resumeDeck);
  testimonialDeck.addEventListener('focusin', pauseDeck);
  testimonialDeck.addEventListener('focusout', (event) => {
    if (!testimonialDeck.contains(event.relatedTarget)) resumeDeck();
  });
  if (!prefersReducedMotion) scheduleAdvance(cycleDuration);

  document.querySelectorAll('.workflow-tags button').forEach((button) => {
    button.addEventListener('click', () => {
      document.querySelectorAll('.workflow-tags button').forEach((tag) => {
        const selected = tag === button;
        tag.classList.toggle('is-selected', selected);
        tag.setAttribute('aria-pressed', String(selected));
      });
    });
  });

  const offerForm = document.querySelector('.offer-form');
  offerForm.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!offerForm.reportValidity()) return;
    window.alert('Obrigado pelo interesse! Seu cupom exclusivo de 15% OFF foi enviado para seu e-mail.');
    offerForm.reset();
  });

  const menuToggle = document.querySelector('.menu-toggle');
  const drawer = document.querySelector('.mobile-drawer');
  const drawerBackdrop = document.querySelector('.drawer-backdrop');
  const drawerClose = document.querySelector('.drawer-close');
  const drawerLinks = [...document.querySelectorAll('.drawer-links a')];

  function closeDrawer(returnFocus = true) {
    drawer.classList.remove('is-open');
    drawerBackdrop.classList.remove('is-open');
    drawer.setAttribute('aria-hidden','true');
    drawer.inert = true;
    menuToggle.setAttribute('aria-expanded','false');
    menuToggle.setAttribute('aria-label','Abrir navegação');
    document.body.style.overflow = '';
    if (returnFocus) menuToggle.focus();
  }

  function openDrawer() {
    drawer.classList.add('is-open');
    drawerBackdrop.classList.add('is-open');
    drawer.setAttribute('aria-hidden','false');
    drawer.inert = false;
    menuToggle.setAttribute('aria-expanded','true');
    menuToggle.setAttribute('aria-label','Fechar navegação');
    document.body.style.overflow = 'hidden';
    drawerClose.focus();
  }

  menuToggle.addEventListener('click', () => {
    if (menuToggle.getAttribute('aria-expanded') === 'true') closeDrawer();
    else openDrawer();
  });
  drawerClose.addEventListener('click', () => closeDrawer());
  drawerBackdrop.addEventListener('click', () => closeDrawer());
  drawerLinks.forEach((link) => link.addEventListener('click', () => closeDrawer(false)));
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && drawer.classList.contains('is-open')) closeDrawer();
  });
});
