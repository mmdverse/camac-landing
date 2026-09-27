// Blueprint — Print frames + Grid overlay §18-22
import { FrameController } from './frame-controller.js';
import { printFrames } from './data.js';

export function initBlueprint(){
  const wrapper = document.getElementById('blueprintWrapper');
  const viewport = document.getElementById('blueprintViewport');
  const canvas = document.getElementById('printCanvas');
  const grid = document.getElementById('blueprintGrid');
  if (!wrapper || !canvas) return;

  const ctrl = new FrameController({
    dir: printFrames.dir,
    count: printFrames.count,
    canvas: canvas,
    fps: printFrames.fps,
    loopFrom: 40,
    loopTo: 260,
    fit: 'contain' // contain prevents half-outside crop — full blueprint visible
  });

  // Grid reveal on scroll
  let ticking = false;
  let idleTimer = null;

  function getProgress(){
    const rect = wrapper.getBoundingClientRect();
    const vh = window.innerHeight;
    const total = wrapper.offsetHeight - vh;
    let p = -rect.top / total;
    p = Math.min(1, Math.max(0, p));
    return p;
  }

  function onScroll(){
    const p = getProgress();
    ctrl.setProgress(p);

    // Grid opacity: fade in as we enter blueprint (p 0..0.28)
    if (grid){
      const gOpacity = Math.min(1, Math.max(0, (p - 0.02)/0.22));
      grid.style.opacity = String(gOpacity * 0.38);
      if (gOpacity > 0.02) grid.classList.add('visible');
      else grid.classList.remove('visible');
    }

    // Titles subtle parallax
    const header = viewport.querySelector('.blueprint-header');
    if (header){
      const t = Math.min(1, p*1.8);
      header.style.transform = `translateY(${t* -6}px)`;
      header.style.opacity = String(0.85 + t*0.15);
    }

    // Autoplay idle like hero but subtle
    clearTimeout(idleTimer);
    ctrl.stopAutoplay();
    idleTimer = setTimeout(()=>{
      const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (!reduced && p > 0.04 && p < 0.96){
        // gentle ping-pong near current frame ± 14
        const cur = Math.round(p * (printFrames.count-1));
        const from = Math.max(0, cur - 12);
        const to = Math.min(printFrames.count-1, cur + 12);
        ctrl.loopFrom = from;
        ctrl.loopTo = to;
        ctrl.startAutoplay(cur);
      }
    }, 180);
  }

  function rafScroll(){
    ticking = false;
    onScroll();
  }
  function handleScroll(){
    if (!ticking){ ticking=true; requestAnimationFrame(rafScroll); }
  }

  ctrl.preloadWindow(0, 28);
  ctrl.renderFrameImmediate(0);
  setTimeout(()=> ctrl._resize(), 80);
  setTimeout(()=> { ctrl._resize(); ctrl.renderFrameImmediate(0); }, 260);

  window.addEventListener('scroll', handleScroll, { passive:true });
  window.addEventListener('resize', handleScroll);

  const io = new IntersectionObserver(entries=>{
    entries.forEach(e=>{
      if (!e.isIntersecting){ ctrl.stopAutoplay(); clearTimeout(idleTimer); }
      else {
        clearTimeout(idleTimer);
        idleTimer = setTimeout(()=>{
          const p = getProgress();
          const cur = Math.round(p * (printFrames.count-1));
          const from = Math.max(0, cur - 14);
          const to = Math.min(printFrames.count-1, cur + 14);
          ctrl.loopFrom = from; ctrl.loopTo = to;
          const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
          if (!reduced) ctrl.startAutoplay(cur);
        }, 240);
      }
    });
  }, {threshold:0.04});
  io.observe(viewport);

  setTimeout(handleScroll, 650);
  // initial life autoplay for blueprint entry
  setTimeout(()=>{
    const p = getProgress();
    if (p < 0.06){
      const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (!reduced) ctrl.startAutoplay(18);
    }
  }, 1100);

  window._printCtrl = ctrl;
  return ctrl;
}
