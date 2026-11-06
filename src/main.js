import { initScene, initSkillSphere } from './scene.js';

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];

/* ---------- Loader ---------- */
const loader = $('#loader');
const bar = $('#loader-progress');
let prog = 0;
const fake = setInterval(() => {
  prog = Math.min(prog + Math.random() * 18, 92);
  bar.style.width = prog + '%';
}, 120);

function finishLoading() {
  clearInterval(fake);
  bar.style.width = '100%';
  setTimeout(() => {
    loader.classList.add('done');
    document.body.classList.add('ready');
    revealHero();
  }, 350);
}

/* ---------- Init 3D (graceful fallback if WebGL is unavailable) ---------- */
try {
  initScene();
  initSkillSphere();
} catch (err) {
  console.warn('WebGL unavailable, showing static fallback.', err);
  const bg = $('#bg');
  if (bg) bg.style.background = 'radial-gradient(circle at 70% 30%, #1a1f4a, #05060f 60%)';
}
if (document.readyState === 'complete') finishLoading();
else window.addEventListener('load', finishLoading);
setTimeout(() => { if (!loader.classList.contains('done')) finishLoading(); }, 4000);

/* ---------- Reveal on scroll ---------- */
const io = new IntersectionObserver((entries) => {
  entries.forEach((e) => {
    if (!e.isIntersecting) return;
    const el = e.target;
    const siblings = $$('.reveal', el.parentElement);
    el.style.transitionDelay = Math.min(siblings.indexOf(el), 6) * 80 + 'ms';
    el.classList.add('in');
    io.unobserve(el);

    $$('[data-count]', el).concat(el.matches('[data-count]') ? [el] : []).forEach(countUp);
    $$('.gauge-fill', el).forEach((g) => (g.style.width = g.dataset.w + '%'));
  });
}, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

function revealHero() {
  $$('.hero .reveal').forEach((el, i) => {
    setTimeout(() => el.classList.add('in'), 150 + i * 130);
  });
  startTyping();
}
$$('.reveal').forEach((el) => { if (!el.closest('.hero')) io.observe(el); });

/* ---------- Count up ---------- */
function countUp(el) {
  if (el.dataset.done) return;
  el.dataset.done = 1;
  const target = +el.dataset.count;
  const t0 = performance.now();
  const dur = 1400;
  (function step(now) {
    const p = Math.min((now - t0) / dur, 1);
    el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
    if (p < 1) requestAnimationFrame(step);
  })(t0);
}

/* ---------- Typed role text ---------- */
function startTyping() {
  const roles = ['Full-Stack Developer', 'Cloud & DevOps Engineer', 'AI Engineer', 'React & Node.js Developer', 'Software Engineer'];
  const el = $('#typed');
  let r = 0, c = 0, del = false;
  (function loop() {
    const word = roles[r];
    el.textContent = word.slice(0, c);
    if (!del && c < word.length) { c++; setTimeout(loop, 70); }
    else if (!del) { del = true; setTimeout(loop, 1500); }
    else if (c > 0) { c--; setTimeout(loop, 35); }
    else { del = false; r = (r + 1) % roles.length; setTimeout(loop, 300); }
  })();
}

/* ---------- Nav ---------- */
const nav = $('#nav');
const burger = $('#burger');
const navLinks = $('.nav nav');
burger.addEventListener('click', () => {
  burger.classList.toggle('open');
  navLinks.classList.toggle('open');
});
$$('.nav nav a').forEach((a) => a.addEventListener('click', () => {
  burger.classList.remove('open');
  navLinks.classList.remove('open');
}));

const sections = $$('main section[id]');
const links = $$('.nav nav a');
const scrollBar = $('#scroll-bar');
function onScroll() {
  const y = window.scrollY;
  nav.classList.toggle('scrolled', y > 40);
  const h = document.documentElement.scrollHeight - window.innerHeight;
  scrollBar.style.width = (y / h) * 100 + '%';
  let current = sections[0].id;
  sections.forEach((s) => { if (y >= s.offsetTop - 220) current = s.id; });
  links.forEach((a) => a.classList.toggle('active', a.getAttribute('href') === '#' + current && !a.classList.contains('nav-cta')));
}
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

/* ---------- Custom cursor ---------- */
const cur = $('#cursor');
const dot = $('#cursor-dot');
if (matchMedia('(hover:hover)').matches) {
  let cx = 0, cy = 0, dx = 0, dy = 0;
  window.addEventListener('pointermove', (e) => {
    dx = e.clientX; dy = e.clientY;
    dot.style.opacity = cur.style.opacity = 1;
    dot.style.left = dx + 'px'; dot.style.top = dy + 'px';
  });
  (function follow() {
    cx += (dx - cx) * 0.16; cy += (dy - cy) * 0.16;
    cur.style.left = cx + 'px'; cur.style.top = cy + 'px';
    requestAnimationFrame(follow);
  })();
  $$('a, button, .chips span, .tags span, input, textarea').forEach((el) => {
    el.addEventListener('mouseenter', () => cur.classList.add('hover'));
    el.addEventListener('mouseleave', () => cur.classList.remove('hover'));
  });
}

/* ---------- Magnetic buttons ---------- */
$$('.magnetic').forEach((el) => {
  el.addEventListener('pointermove', (e) => {
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left - r.width / 2) * 0.25;
    const y = (e.clientY - r.top - r.height / 2) * 0.25;
    el.style.transform = `translate(${x}px, ${y}px)`;
  });
  el.addEventListener('pointerleave', () => { el.style.transform = ''; });
});

/* ---------- 3D tilt cards ---------- */
$$('.tilt').forEach((card) => {
  card.addEventListener('pointermove', (e) => {
    if (e.pointerType === 'touch') return;
    const r = card.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    card.style.transform = `perspective(900px) rotateX(${(-py * 7).toFixed(2)}deg) rotateY(${(px * 9).toFixed(2)}deg) translateZ(6px)`;
  });
  card.addEventListener('pointerleave', () => { card.style.transform = ''; });
});

/* ---------- Contact form → mailto ---------- */
$('#contact-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const name = $('#f-name').value.trim();
  const email = $('#f-email').value.trim();
  const msg = $('#f-msg').value.trim();
  const subject = encodeURIComponent(`Portfolio enquiry from ${name}`);
  const body = encodeURIComponent(`${msg}\n\n— ${name} (${email})`);
  window.location.href = `mailto:gnanaprakashdio@gmail.com?subject=${subject}&body=${body}`;
});

$('#year').textContent = new Date().getFullYear();
