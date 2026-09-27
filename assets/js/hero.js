// Hero — Scroll-driven frame + Scan overlays + Autoplay §6-17
import { FrameController } from './frame-controller.js';
import { heroFrames, heroSegments, scanMetrics } from './data.js';

export function initHero(){
  const wrapper = document.getElementById('heroWrapper');
  const viewport = document.getElementById('heroViewport');
  const canvas = document.getElementById('heroCanvas');
  const metricsWrap = document.getElementById('heroMetrics');
  const scrollHint = document.querySelector('.hero-scroll');
  const scanGlow = document.getElementById('scanGlow');

  if (!wrapper || !canvas) return;

  const ctrl = new FrameController({
    dir: heroFrames.dir,
    count: heroFrames.count,
    canvas: canvas,
    fps: heroFrames.fps,
    loopFrom: heroSegments.solid.loopFrom,
    loopTo: heroSegments.solid.loopTo
  });

  // Build metric cards
  const cards = [];
  scanMetrics.forEach(m=>{
    const card = document.createElement('div');
    card.className = 'metric-card';
    card.dataset.id = m.id;
    card.dataset.at = m.at;
    card.innerHTML = `
      <div class="metric-label">${m.label}</div>
      <div class="metric-main"><strong>${m.value}</strong> <small>${m.unit}</small></div>
      <div class="metric-sub">${m.sub}</div>
    `;
    metricsWrap.appendChild(card);
    cards.push({ el: card, at: m.at, id: m.id });
  });

  // Also add fallback static cards visible on mobile if scan not triggered? We'll control via scroll.

  let ticking = false;
  let lastScrollY = window.scrollY;
  let scrollIdleTimer = null;
  let isIdle = false;
  let currentProgress = 0; // 0..1 hero progress

  function getHeroProgress(){
    const rect = wrapper.getBoundingClientRect();
    const viewportH = window.innerHeight;
    const totalScrollable = wrapper.offsetHeight - viewportH;
    // rect.top is 0 when sticky starts; negative as we scroll
    let p = -rect.top / totalScrollable;
    p = Math.min(1, Math.max(0, p));
    return p;
  }

  function heroProgressToFrameProgress(p){
    // §13 mapping: 0-50% solid, 50-95% scan, 95-100% finale
    // But frame mapping is linear 0..1 to 0..239, with segments at those % per spec
    // Spec says: 0-50% solid (0-120), 50-95% scan (121-228), 95-100% finale (229-239)
    // For smooth scrubbing we just linear map p to frame; the segment thresholds are already in frame indices.
    // So just return p (0..1)
    return p;
  }

  function detectSegment(frame){
    if (frame <= heroSegments.solid.end) return 'solid';
    if (frame <= heroSegments.scan.end) return 'scan';
    return 'finale';
  }

  function updateMetrics(progress){
    // progress 0..1 hero
    // Show cards sequentially as scan passes
    // Each card at its at position: visible if progress >= at - 0.06 and <= at + 0.14 ?
    cards.forEach(c=>{
      const at = c.at;
      const window = 0.13; // visibility window
      const isVisible = progress >= (at - 0.04) && progress <= (at + window);
      const isNear = Math.abs(progress - at) < 0.025; // peak glow
      if (isVisible){
        c.el.classList.add('visible');
        if (isNear) c.el.classList.add('glow');
        else c.el.classList.remove('glow');
      } else {
        // keep cap/door visible after passing? spec says overlay appears when scan passes
        // We keep them visible with fade after scan passes? For simplicity, fade out after window
        c.el.classList.remove('visible','glow');
      }
    });

    // Central title fade: hide when scan active — and stay hidden till end (no reappear at finale)
    const center = document.querySelector('.hero-center');
    if (center){
      if (progress > 0.48){
        const fade = Math.min(1, (progress - 0.48) / 0.22);
        center.style.opacity = String(1 - fade * 0.98);
        center.style.transform = `translate(-50%,-50%) translateY(${fade * 14}px)`;
        center.style.pointerEvents = fade > 0.5 ? 'none' : 'auto';
      } else {
        center.style.opacity = "1";
        center.style.transform = `translate(-50%,-50%) translateY(0px)`;
        center.style.pointerEvents = 'auto';
      }
    }

    // Scan glow line position: y based on progress within scan segment
    if (scanGlow){
      if (progress >= 0.50 && progress <= 0.95){
        const scanP = (progress - 0.50) / 0.45; // 0..1 within scan
        // Map to viewport y 18% to 78%
        const y = 18 + scanP * 60;
        scanGlow.style.top = y + '%';
        scanGlow.style.opacity = String(0.55 + Math.sin(scanP*Math.PI)*0.45);
        scanGlow.style.display = 'block';
      } else {
        scanGlow.style.opacity = '0';
      }
    }
  }

  let lastProgress = -1;
  function onScroll(){
    const p = getHeroProgress();
    currentProgress = p;
    const frameP = heroProgressToFrameProgress(p);
    const frame = Math.round(frameP * (heroFrames.count - 1));

    // Update segment for autoplay loop range
    const seg = detectSegment(frame);
    // Only update loop window if not autoplaying (to avoid jump)
    if (!ctrl.autoplay){
      if (seg === 'solid'){
        ctrl.loopFrom = heroSegments.solid.loopFrom;
        ctrl.loopTo = heroSegments.solid.loopTo;
        ctrl.segment = 'solid';
      } else if (seg === 'scan'){
        ctrl.loopFrom = heroSegments.scan.loopFrom;
        ctrl.loopTo = heroSegments.scan.loopTo;
        ctrl.segment = 'scan';
      } else {
        ctrl.loopFrom = heroSegments.finale.loopFrom;
        ctrl.loopTo = heroSegments.finale.loopTo;
        ctrl.segment = 'finale';
      }
    }

    ctrl.setProgress(frameP);
    updateMetrics(p);

    // handle scroll idle → autoplay
    isIdle = false;
    ctrl.stopAutoplay();
    clearTimeout(scrollIdleTimer);
    scrollIdleTimer = setTimeout(()=>{
      isIdle = true;
      const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (!reduced){
        if (p >= 0 && p <= 1){
          const rect = viewport.getBoundingClientRect();
          const visible = rect.top < window.innerHeight && rect.bottom > 0;
          if (visible){
            // Dynamic loop — larger window now (more visible range) but slow speed
            const seg = detectSegment(frame);
            const segCfg = heroSegments[seg];
            const from = Math.max(segCfg.start, frame - 12);
            const to = Math.min(segCfg.end, frame + 12);
            ctrl.loopFrom = from;
            ctrl.loopTo = to;
            ctrl.startAutoplay(frame);
          }
        }
      }
    }, 180);

    // hide scroll hint after first scroll
    if (scrollHint && p > 0.03){
      scrollHint.style.opacity = '0';
      scrollHint.style.transform = 'translateY(-4px)';
    }

    // subtle parallax for vignette? not needed
  }

  function rafScroll(){
    ticking = false;
    onScroll();
  }

  function handleScroll(){
    if (!ticking){
      ticking = true;
      requestAnimationFrame(rafScroll);
    }
  }

  // Initial preload — B-5: solid first, then scan/finale progressively (queue handles 6 concurrent)
  ctrl.preloadWindow(0, 22);
  ctrl.renderFrameImmediate(0);
  // warm solid middle and scan center without flooding network
  setTimeout(()=> ctrl.preloadWindow(18, 18), 350);
  setTimeout(()=> ctrl.preloadWindow(165, 24), 900);
  setTimeout(()=> ctrl.preloadWindow(232, 8), 1450);
  // ensure canvas sized without flash
  setTimeout(()=>{ ctrl._resize(); }, 90);
  setTimeout(()=>{ ctrl._resize(); ctrl.renderFrameImmediate(ctrl.frameIndex); }, 280);

  window.addEventListener('scroll', handleScroll, { passive: true });
  // Responsive resize — debounced, no jump
  let resizeTimer = null;
  let lastHeroProgress = 0;
  const onHeroResize = ()=>{
    clearTimeout(resizeTimer);
    // keep canvas sized, don't jump frame
    ctrl._resize();
    resizeTimer = setTimeout(()=>{
      const p = getHeroProgress();
      const target = p * (heroFrames.count - 1);
      const diff = Math.abs(target - ctrl.current);
      // If resize caused large progress jump (mobile address bar / orientation), keep visual stable
      if (diff > 10){
        // temporarily keep current frame, sync gently after
        const keepP = ctrl.current / (heroFrames.count - 1);
        ctrl.setProgress(keepP);
        // gentle sync after layout stabilizes
        setTimeout(()=>{
          const np = getHeroProgress();
          ctrl.setProgress(np);
          updateMetrics(np);
        }, 360);
      } else {
        handleScroll();
      }
      lastHeroProgress = p;
    }, 140);
  };
  window.addEventListener('resize', onHeroResize, { passive: true });
  if (window.visualViewport) window.visualViewport.addEventListener('resize', onHeroResize, { passive: true });

  // Intersection to pause autoplay when hero not visible
  const io = new IntersectionObserver(entries=>{
    entries.forEach(e=>{
      if (!e.isIntersecting){
        ctrl.stopAutoplay();
        clearTimeout(scrollIdleTimer);
      } else {
        // when re-enters, trigger idle autoplay after short delay
        clearTimeout(scrollIdleTimer);
        scrollIdleTimer = setTimeout(()=>{
          const p = getHeroProgress();
          const frame = Math.round(p * (heroFrames.count-1));
          const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
          if (!reduced) ctrl.startAutoplay(frame);
        }, 220);
      }
    });
  }, { threshold: 0.05 });
  io.observe(viewport);

  // initial call after loader done (delay) + immediate subtle autoplay
  setTimeout(()=>{ handleScroll(); }, 400);
  // Autoplay even without scroll — life at entry (§7) — very subtle, dynamic around current
  setTimeout(()=>{
    const p = getHeroProgress();
    const frame = Math.round(p * (heroFrames.count-1));
    const seg = frame <= heroSegments.solid.end ? 'solid' : (frame <= heroSegments.scan.end ? 'scan' : 'finale');
    const segCfg = heroSegments[seg];
    const from = Math.max(segCfg.start, frame - 12);
    const to = Math.min(segCfg.end, frame + 12);
    ctrl.loopFrom = from;
    ctrl.loopTo = to;
    const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!reduced && p < 0.06){
      ctrl.startAutoplay(frame);
    }
  }, 950);

  // expose for debug
  window._heroCtrl = ctrl;

  // Autoplay callback to update metrics during autoplay ping-pong? During idle, frame stays within segment loop, metrics should stay stable
  // So no need to update metrics during autoplay

  return ctrl;
}
