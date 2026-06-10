/* ============================================
   黑貓神話 狼魂覺醒 - 全域互動腳本
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {

  /* ---- 粒子系統 ---- */
  const canvas = document.getElementById('particles-canvas');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    let particles = [];
    let animFrame;
    let w, h;

    const resize = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    class Particle {
      constructor() {
        this.reset();
        this.y = Math.random() * h;
      }
      reset() {
        this.x = Math.random() * w;
        this.y = -20;
        this.size = Math.random() * 2 + 0.8;
        this.speedY = Math.random() * 0.4 + 0.15;
        this.speedX = (Math.random() - 0.5) * 0.3;
        this.opacity = Math.random() * 0.5 + 0.1;
        this.fadeSpeed = Math.random() * 0.003 + 0.001;
        this.pulse = Math.random() * Math.PI * 2;
      }
      update() {
        this.y += this.speedY;
        this.x += this.speedX + Math.sin(this.pulse) * 0.15;
        this.pulse += 0.01;
        this.opacity += this.fadeSpeed;
        if (this.opacity > 0.6) this.fadeSpeed = -Math.abs(this.fadeSpeed);
        if (this.opacity < 0.08) this.fadeSpeed = Math.abs(this.fadeSpeed);
        if (this.y > h + 20) this.reset();
        if (this.x < -20) this.x = w + 20;
        if (this.x > w + 20) this.x = -20;
      }
      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        const r = Math.random() > 0.92 ? '212, 168, 67' : '200, 200, 210';
        ctx.fillStyle = `rgba(${r}, ${this.opacity})`;
        ctx.fill();
      }
    }

    const PARTICLE_COUNT = 70;
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const p = new Particle();
      p.y = Math.random() * h;
      particles.push(p);
    }

    (function animate() {
      ctx.clearRect(0, 0, w, h);
      particles.forEach(p => { p.update(); p.draw(); });
      animFrame = requestAnimationFrame(animate);
    })();

    window.addEventListener('resize', () => {
      particles = [];
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        particles.push(new Particle());
      }
    });
  }

  /* ---- 導覽列 ---- */
  const navbar = document.querySelector('.navbar');
  const navToggle = document.querySelector('.nav-toggle');
  const navLinks = document.querySelector('.nav-links');
  const navLinksAll = document.querySelectorAll('.nav-links a');

  /* 滾動變色 */
  let scrollTicking = false;
  const updateNavbar = () => {
    if (window.scrollY > 50) {
      navbar?.classList.add('scrolled');
    } else {
      navbar?.classList.remove('scrolled');
    }
    scrollTicking = false;
  };

  window.addEventListener('scroll', () => {
    if (!scrollTicking) {
      requestAnimationFrame(updateNavbar);
      scrollTicking = true;
    }
  }, { passive: true });
  updateNavbar();

  /* 手機選單 */
  navToggle?.addEventListener('click', () => {
    navToggle.classList.toggle('active');
    navLinks?.classList.toggle('open');
  });

  navLinksAll.forEach(link => {
    link.addEventListener('click', () => {
      navToggle?.classList.remove('active');
      navLinks?.classList.remove('open');
    });
  });

  /* 當前頁面高亮 */
  const currentPath = window.location.pathname.split('/').pop() || 'index.html';
  navLinksAll.forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPath) {
      link.classList.add('active');
    } else if (currentPath === '' && href === 'index.html') {
      link.classList.add('active');
    }
  });

  /* ---- 滾動揭示動畫 ---- */
  const revealElements = document.querySelectorAll('.reveal');
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

  revealElements.forEach(el => revealObserver.observe(el));

  /* ---- 數字計數器 ---- */
  const counters = document.querySelectorAll('.counter');
  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const target = parseInt(el.getAttribute('data-target'), 10);
        const duration = 2000;
        const suffix = el.getAttribute('data-suffix') || '';
        const startTime = performance.now();

        const tick = (now) => {
          const elapsed = now - startTime;
          const progress = Math.min(elapsed / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          const current = Math.floor(eased * target);
          el.textContent = current + suffix;
          if (progress < 1) {
            requestAnimationFrame(tick);
          } else {
            el.textContent = target + suffix;
          }
        };

        requestAnimationFrame(tick);
        counterObserver.unobserve(el);
      }
    });
  }, { threshold: 0.5 });

  counters.forEach(el => counterObserver.observe(el));

  /* ---- 打字機效果 ---- */
  const typewriterEl = document.querySelector('.typewriter');
  if (typewriterEl) {
    const text = typewriterEl.getAttribute('data-text') || '';
    const speed = parseInt(typewriterEl.getAttribute('data-speed'), 10) || 60;
    let idx = 0;

    const type = () => {
      if (idx < text.length) {
        typewriterEl.textContent += text.charAt(idx);
        idx++;
        setTimeout(type, speed + Math.random() * 30);
      }
    };

    setTimeout(type, 500);
  }

  /* ---- 平滑內部錨點 ---- */
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  /* ---- 手風琴 ---- */
  document.querySelectorAll('.acc-header').forEach(header => {
    header.addEventListener('click', () => {
      const item = header.parentElement;
      const isOpen = item.classList.contains('open');
      document.querySelectorAll('.acc-item.open').forEach(el => el.classList.remove('open'));
      if (!isOpen) item.classList.add('open');
    });
  });

});