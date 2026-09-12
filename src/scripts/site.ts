/**
 * 全站腳本 2.0：Lenis 平滑捲動 + IntersectionObserver 揭示動畫 + Hero 影片控制
 * 動效：逐字浮現 / 參道時間軸 / 磁吸按鈕 / 活動側滑翻頁
 */
import Lenis from 'lenis';

/* ---------------------------------------------------------------
 * Lenis 平滑捲動（尊重 prefers-reduced-motion）
 * ------------------------------------------------------------- */
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = window.matchMedia('(pointer: fine)').matches;

let lenis: Lenis | null = null;
if (!reduceMotion) {
  lenis = new Lenis({
    duration: 1.15,
    easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
  });

  const raf = (time: number) => {
    lenis?.raf(time);
    requestAnimationFrame(raf);
  };
  requestAnimationFrame(raf);

  // 除錯用掛點（僅在有需要時使用）
  (window as unknown as { __lenis?: Lenis }).__lenis = lenis;

  // 錨點連結改用 lenis 捲動
  document.querySelectorAll<HTMLAnchorElement>('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      if (!id || id === '#') return;
      const el = document.querySelector(id);
      if (el) {
        e.preventDefault();
        lenis?.scrollTo(el as HTMLElement, { offset: -80 });
      }
    });
  });
}

/* ---------------------------------------------------------------
 * 逐字拆解：data-chars → span.char（CSS  staggered 浮現）
 * ------------------------------------------------------------- */
document.querySelectorAll<HTMLElement>('[data-chars]').forEach((el) => {
  if (el.dataset.charsDone === 'true') return;
  el.dataset.charsDone = 'true';
  const fullLabel = (el.textContent ?? '').trim();
  el.setAttribute('aria-label', fullLabel);
  let charIndex = 0;
  const splitText = (node: Text) => {
    const frag = document.createDocumentFragment();
    Array.from(node.textContent ?? '').forEach((ch) => {
      const s = document.createElement('span');
      s.className = 'char';
      s.style.setProperty('--char-i', String(charIndex++));
      s.setAttribute('aria-hidden', 'true');
      s.textContent = ch;
      frag.appendChild(s);
    });
    node.replaceWith(frag);
  };
  const walk = (parent: Node) => {
    Array.from(parent.childNodes).forEach((node) => {
      if (node.nodeType === 3) {
        if (node.textContent) splitText(node as Text);
      } else if (node.nodeType === 1) {
        walk(node);
      }
    });
  };
  walk(el);
});

/* ---------------------------------------------------------------
 * 揭示動畫：data-reveal 元素進入視窗時加入 .is-in
 * ------------------------------------------------------------- */
const revealTargets = document.querySelectorAll<HTMLElement>('[data-reveal]');
if (revealTargets.length) {
  if (reduceMotion || !('IntersectionObserver' in window)) {
    revealTargets.forEach((el) => el.classList.add('is-in'));
  } else {
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-in');
            io.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.14, rootMargin: '0px 0px -6% 0px' },
    );
    revealTargets.forEach((el) => io.observe(el));
  }
}

/* ---------------------------------------------------------------
 * 參道時間軸生長（僅 guide 頁存在時才監聽捲動）
 * ------------------------------------------------------------- */
const timelineGrowth = document.querySelector<HTMLElement>('[data-timeline-growth]');
if (timelineGrowth && !reduceMotion) {
  const updateTimeline = () => {
    const timeline = timelineGrowth.closest('[data-timeline]');
    if (!timeline) return;
    const r = timeline.getBoundingClientRect();
    const vh = window.innerHeight;
    const p = Math.min(1, Math.max(0, (vh * 0.7 - r.top) / r.height));
    timelineGrowth.style.transform = `scaleY(${p.toFixed(3)})`;
  };
  let timelineTicking = false;
  window.addEventListener(
    'scroll',
    () => {
      if (timelineTicking) return;
      timelineTicking = true;
      requestAnimationFrame(() => {
        updateTimeline();
        timelineTicking = false;
      });
    },
    { passive: true },
  );
  updateTimeline();
}

/* ---------------------------------------------------------------
 * 磁吸按鈕（僅 fine pointer + 非 reduced-motion，guide 頁教學連結使用）
 * ------------------------------------------------------------- */
if (finePointer && !reduceMotion) {
  document.querySelectorAll<HTMLElement>('[data-magnetic]').forEach((el) => {
    const strength = 14;
    el.addEventListener('mousemove', (e) => {
      const r = el.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      el.style.transform = `translate3d(${(dx / r.width) * strength}px, ${(dy / r.height) * strength}px, 0)`;
    });
    el.addEventListener('mouseleave', () => {
      el.style.transform = 'translate3d(0, 0, 0)';
    });
  });
}

/* ---------------------------------------------------------------
 * Hero 影片與主視覺轉場：
 * - 方案一：墨浪橫掃（右下至左上）
 * - 桌機：hero-main.mp4 播一次（非 loop）
 * - 播畢瞬間，#0b0b10 刀幕以 0.36 秒自「右下向左上」斜角橫掃吞沒全螢幕
 * - 吞沒後在純墨黑中停頓約 0.5 秒（收刀定格）
 * - 隨後 8K 主視覺以 2.2 秒絲滑淡入浮現
 * - 行動裝置 / reduced-motion / 手機省流：直接移除影片與刀幕，直接顯示圖片
 * ------------------------------------------------------------- */
const heroVideo = document.querySelector<HTMLVideoElement>('[data-hero-video]');
const heroImage = document.querySelector<HTMLElement>('[data-hero-image]');
const heroCurtain = document.querySelector<HTMLElement>('[data-hero-curtain]');
const heroImg = document.querySelector<HTMLImageElement>('[data-hero-img]');

if (heroVideo && heroImage) {
  const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;

  if (reduceMotion || saveData) {
    heroVideo.remove();
    heroCurtain?.remove();
    heroImage.style.opacity = '1';
    if (heroImg) {
      heroImg.style.filter = 'none';
      heroImg.style.transform = 'scale(1.05)';
    }
  } else {
    let settled = false;

    // 方案 A 初始設定：黑夜中微光光暈蓄勢（微焦模糊 + 高光微亮 + 微推鏡）
    if (heroImg) {
      heroImg.style.filter = 'blur(14px) brightness(1.38) contrast(1.12)';
      heroImg.style.transform = 'scale(1.09)';
    }

    const revealImage = () => {
      // 移除影片層並淡入底圖容器（容器預設 opacity-0 防洩漏）
      heroVideo.remove();
      heroImage.style.opacity = '1';

      // 1. 墨浪黑幕以 2.0 秒平滑淡出
      if (heroCurtain) {
        heroCurtain.style.transition = 'opacity 2.0s cubic-bezier(0.2, 0.8, 0.2, 1)';
        heroCurtain.style.opacity = '0';
        heroCurtain.addEventListener('transitionend', () => heroCurtain.remove(), { once: true });
        window.setTimeout(() => heroCurtain.remove(), 2400);
      }

      // 2. 8K 主視覺：月華破暗・光影凝結溶出（刀光白髮先顯 → 霧氣聚攏清晰 → 慢速微鏡頭呼吸）
      if (heroImg) {
        heroImg.style.transition =
          'filter 2.4s cubic-bezier(0.16, 1, 0.3, 1), transform 3.6s cubic-bezier(0.1, 0.9, 0.2, 1)';
        heroImg.style.filter = 'blur(0px) brightness(1) contrast(1)';
        heroImg.style.transform = 'scale(1.05)';
      }
    };

    const sweepAndReveal = () => {
      if (settled) return;
      settled = true;

      if (heroCurtain) {
        // 步驟 1：結束前 0.5 秒墨浪橫掃（GPU 硬體加速 translate3d，高刷新率極致絲滑，附帶墨鋒陰影）
        heroCurtain.style.transition = 'transform 0.42s cubic-bezier(0.16, 1, 0.3, 1)';
        heroCurtain.style.transform = 'translate3d(-50%, -50%, 0) rotate(-35deg) translate3d(-10%, 0, 0)';

        // 步驟 2：吞沒後隱藏影片，在純黑單色中延續停留約 2.5 秒（靜寂定格），隨後光影凝結溶出
        window.setTimeout(() => {
          heroVideo.style.opacity = '0';
          window.setTimeout(revealImage, 2500);
        }, 420);
      } else {
        // 降級退場
        heroVideo.style.opacity = '0';
        window.setTimeout(revealImage, 600);
      }
    };

    const checkTime = () => {
      if (heroVideo.duration && Number.isFinite(heroVideo.duration)) {
        if (heroVideo.currentTime >= heroVideo.duration - 0.5) {
          sweepAndReveal();
        }
      }
    };

    const scheduleSweep = () => {
      if (heroVideo.duration && Number.isFinite(heroVideo.duration)) {
        const msUntilSweep = Math.max(0, (heroVideo.duration - 0.5 - heroVideo.currentTime) * 1000);
        window.setTimeout(sweepAndReveal, msUntilSweep);
      }
    };

    heroVideo.addEventListener('timeupdate', checkTime);
    heroVideo.addEventListener('playing', scheduleSweep, { once: true });
    heroVideo.addEventListener('ended', sweepAndReveal);
    heroVideo.addEventListener('error', () => {
      if (settled) return;
      settled = true;
      heroVideo.remove();
      heroCurtain?.remove();
      heroImage.style.opacity = '1';
      if (heroImg) {
        heroImg.style.filter = 'none';
        heroImg.style.transform = 'scale(1.05)';
      }
    });

    // 保底：15 秒內未正常結束也自動推進
    window.setTimeout(sweepAndReveal, 15000);

    const tryPlay = () =>
      heroVideo.play().catch(() => {
        heroVideo.remove();
        heroCurtain?.remove();
        heroImage.style.opacity = '1';
        if (heroImg) {
          heroImg.style.filter = 'none';
          heroImg.style.transform = 'scale(1.05)';
        }
      });
    if (heroVideo.readyState >= 2) tryPlay();
    else heroVideo.addEventListener('canplay', tryPlay, { once: true });
  }
} else if (heroImage) {
  heroImage.style.opacity = '1';
}

/* ---------------------------------------------------------------
 * 循環背景影片（版本介紹 / 龍之試煉）：進入視窗才載入播放
 * ------------------------------------------------------------- */
const bgVideos = document.querySelectorAll<HTMLVideoElement>('[data-bg-video]');
if (bgVideos.length) {
  if (reduceMotion) {
    bgVideos.forEach((v) => v.remove());
  } else {
    const vio = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const v = entry.target as HTMLVideoElement;
          if (entry.isIntersecting) {
            v.play().catch(() => {});
          } else {
            v.pause();
          }
        }
      },
      { threshold: 0.1 },
    );
    bgVideos.forEach((v) => vio.observe(v));
  }
}

/* ---------------------------------------------------------------
 * 導覽列：觸控小螢幕強制手機版＋反向放大回原生尺寸
 * 全站鎖 1280 viewport（瀏覽器整頁縮小顯示），navbar 以 --nav-k 反向 zoom
 * 回手機原生大小；viewport 無法針對單一元素設定，只能用逆縮放補回
 * ------------------------------------------------------------- */
const syncMobileNav = () => {
  const coarse = window.matchMedia('(pointer: coarse)').matches;
  const w = window.screen.width;
  if (coarse && w < 820) {
    document.documentElement.classList.add('force-mobile-nav');
    document.documentElement.style.setProperty('--nav-k', Math.min(4, 1280 / w).toFixed(3));
  } else {
    document.documentElement.classList.remove('force-mobile-nav');
    document.documentElement.style.removeProperty('--nav-k');
  }
};
syncMobileNav();
window.addEventListener('resize', syncMobileNav);
window.addEventListener('orientationchange', syncMobileNav);

/* ---------------------------------------------------------------
 * 手機選單開關
 * ------------------------------------------------------------- */
const navToggle = document.querySelector<HTMLButtonElement>('[data-nav-toggle]');
const navMenu = document.querySelector<HTMLElement>('[data-nav-menu]');
if (navToggle && navMenu) {
  navToggle.addEventListener('click', () => {
    const open = navMenu.dataset.open === 'true';
    navMenu.dataset.open = String(!open);
    navToggle.setAttribute('aria-expanded', String(!open));
    document.body.classList.toggle('overflow-hidden', !open);
  });
  navMenu.querySelectorAll('a').forEach((a) =>
    a.addEventListener('click', () => {
      navMenu.dataset.open = 'false';
      navToggle.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('overflow-hidden');
    }),
  );
}

/* ---------------------------------------------------------------
 * FAQ 手風琴（guide 頁）
 * ------------------------------------------------------------- */
document.querySelectorAll<HTMLDetailsElement>('[data-faq]').forEach((d) => {
  d.addEventListener('toggle', () => {
    if (d.open) {
      document.querySelectorAll<HTMLDetailsElement>('[data-faq][open]').forEach((other) => {
        if (other !== d) other.open = false;
      });
    }
  });
});

/* ---------------------------------------------------------------
 * 活動側滑翻頁（events 頁）：頁籤／左右鍵／觸控側滑／鍵盤／hash 同步
 * ------------------------------------------------------------- */
const eventViewport = document.querySelector<HTMLElement>('[data-event-viewport]');
if (eventViewport) {
  const eventSlides = Array.from(eventViewport.querySelectorAll<HTMLElement>('[data-slide]'));
  const eventTabBtns = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-slide-go]'));
  const eventCounter = document.querySelector<HTMLElement>('[data-event-counter]');
  const eventTabsBar = document.querySelector<HTMLElement>('[data-event-tabs]');
  const slideIds = new Set(eventSlides.map((s) => `#${s.id}`));
  const pad2 = (n: number) => String(n).padStart(2, '0');
  let eventCurrent = 0;

  const syncEventTabs = () => {
    const activeId = eventSlides[eventCurrent]?.id;
    eventTabBtns.forEach((b) => {
      const on = b.dataset.slideGo === activeId;
      b.classList.toggle('is-active', on);
      b.setAttribute('aria-selected', String(on));
    });
    if (eventCounter) {
      eventCounter.textContent = `${pad2(eventCurrent + 1)} / ${pad2(eventSlides.length)}`;
    }
  };

  function goToEvent(index: number, updateHash = true) {
    const total = eventSlides.length;
    if (!total) return;
    const next = ((index % total) + total) % total;
    if (next === eventCurrent) return;
    eventViewport!.dataset.dir = next > eventCurrent ? 'next' : 'prev';
    // 固定當前高度 → 切換 → 動畫到新高度
    const from = eventViewport!.offsetHeight;
    eventSlides[eventCurrent].classList.remove('is-active');
    eventCurrent = next;
    eventSlides[eventCurrent].classList.add('is-active');
    const to = eventSlides[eventCurrent].offsetHeight;
    if (!reduceMotion && to !== from) {
      eventViewport!.style.height = `${from}px`;
      void eventViewport!.offsetHeight;
      eventViewport!.style.height = `${to}px`;
    }
    syncEventTabs();
    if (updateHash) {
      try {
        history.replaceState(null, '', `#${eventSlides[eventCurrent].id}`);
      } catch {
        /* 忽略 */
      }
    }
  }

  eventViewport.addEventListener('transitionend', (e) => {
    if (e.propertyName === 'height') {
      eventViewport.style.height = '';
    }
  });

  document.querySelector('[data-slide-prev]')?.addEventListener('click', () => goToEvent(eventCurrent - 1));
  document.querySelector('[data-slide-next]')?.addEventListener('click', () => goToEvent(eventCurrent + 1));
  eventTabBtns.forEach((b) => {
    b.addEventListener('click', () => {
      const idx = eventSlides.findIndex((s) => s.id === b.dataset.slideGo);
      if (idx >= 0) goToEvent(idx);
    });
  });

  // PageHero 錨點改為切換翻頁（capture 先於 Lenis 錨點處理攔截）
  document.addEventListener(
    'click',
    (e) => {
      const anchor = (e.target as HTMLElement).closest?.('a[href^="#"]') as HTMLAnchorElement | null;
      if (!anchor) return;
      const hash = anchor.getAttribute('href');
      if (!hash || !slideIds.has(hash)) return;
      e.preventDefault();
      e.stopPropagation();
      const idx = eventSlides.findIndex((s) => `#${s.id}` === hash);
      if (idx >= 0) {
        goToEvent(idx, false);
        const target = eventTabsBar ?? eventViewport;
        if (lenis) lenis.scrollTo(target as HTMLElement, { offset: -140 });
        else target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
      }
    },
    true,
  );

  // 觸控側滑
  let touchX: number | null = null;
  eventViewport.addEventListener(
    'touchstart',
    (e) => {
      touchX = e.touches[0].clientX;
    },
    { passive: true },
  );
  eventViewport.addEventListener(
    'touchend',
    (e) => {
      if (touchX === null) return;
      const dx = e.changedTouches[0].clientX - touchX;
      touchX = null;
      if (Math.abs(dx) < 60) return;
      goToEvent(eventCurrent + (dx < 0 ? 1 : -1));
    },
    { passive: true },
  );

  // 鍵盤左右鍵
  window.addEventListener('keydown', (e) => {
    const t = e.target as HTMLElement | null;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')) return;
    if (e.key === 'ArrowRight') goToEvent(eventCurrent + 1);
    else if (e.key === 'ArrowLeft') goToEvent(eventCurrent - 1);
  });

  // 初始：依 hash 決定首頁，否則第一個
  const initialIdx = eventSlides.findIndex((s) => `#${s.id}` === location.hash);
  eventCurrent = initialIdx >= 0 ? initialIdx : 0;
  eventSlides.forEach((s, i) => s.classList.toggle('is-active', i === eventCurrent));
  eventViewport.dataset.dir = 'next';
  syncEventTabs();
  eventViewport.dataset.ready = 'true';
}
