// Loader — Preloader + Cinematic Loading + Brand Reveal §5
import { FrameController } from './frame-controller.js';
import { loadingFrames } from './data.js';

export function initLoader({ onComplete }){
  const preloader = document.getElementById('preloader');
  const preProgress = document.querySelector('.preloader-progress');
  const loadingSection = document.getElementById('loadingSection');
  const loadingCanvas = document.getElementById('loadingCanvas');
  const brand = document.getElementById('brandReveal');

  // Preloader — real check, not fake delay
  const critical = [
    `${loadingFrames.dir}/frame_0000.webp`,
    `${loadingFrames.dir}/frame_0001.webp`,
    `${loadingFrames.dir}/frame_0002.webp`,
    `${loadingFrames.dir}/frame_0005.webp`,
    `${loadingFrames.dir}/frame_0010.webp`,
    `${loadingFrames.dir}/frame_0014.webp`,
    `assets/frames/hero/frame_0000.webp`,
    `assets/frames/print/frame_0000.webp`,
  ];

  let loaded = 0;
  const totalCritical = critical.length;
  let preloaderDone = false;
  let minShow = 420; // خیلی کوتاه — فقط ضدِ چشمک
  const preStart = performance.now();

  function updatePreProgress(){
    const pct = Math.round((loaded/totalCritical)*100);
    if (preProgress) preProgress.style.width = pct + '%';
  }

  function maybeHidePreloader(){
    if (preloaderDone) return;
    const elapsed = performance.now() - preStart;
    const remaining = Math.max(0, minShow - elapsed);
    setTimeout(()=>{
      if (preloaderDone) return;
      preloaderDone = true;
      preloader.classList.add('hide');
      startCinematic();
    }, remaining);
  }

  // Preload critical images — real
  critical.forEach(src=>{
    const img = new Image();
    img.src = src;
    const done = ()=>{ loaded++; updatePreProgress(); if (loaded >= totalCritical) maybeHidePreloader(); };
    img.onload = done;
    img.onerror = done;
  });
  // fallback — if network slow, still continue after 1.6s
  setTimeout(()=>{ if (!preloaderDone) maybeHidePreloader(); }, 1600);
  updatePreProgress();

  // Cinematic loader via FrameController but also time-based
  let loaderCtrl = null;
  let startTime = null;
  let raf = null;
  let brandShown = false;

  function startCinematic(){
    // init controller
    loaderCtrl = new FrameController({
      dir: loadingFrames.dir,
      count: loadingFrames.count,
      canvas: loadingCanvas,
      fps: loadingFrames.fps
    });
    // Preload wider for smooth 6s playback — and warm all loading frames in background
    loaderCtrl.preloadWindow(0, 24);
    loaderCtrl.renderFrameImmediate(0);
    // background warm all loading frames (low priority)
    setTimeout(()=>{
      for(let i=0;i<loadingFrames.count;i++){
        const im=new Image(); im.src=`${loadingFrames.dir}/frame_${String(i).padStart(4,'0')}.webp`;
      }
    }, 300);

    startTime = performance.now();
    const duration = (loadingFrames.count / loadingFrames.fps) * 1000; // ~6000ms
    const brandStart = 3000; // from 3.0s to 6.0s §5
    const whiteFrom = loadingFrames.whiteFrom; // 115

    function tick(now){
      const elapsed = now - startTime;
      const p = Math.min(1, elapsed / duration);
      const frame = Math.floor(p * (loadingFrames.count - 1));

      // Update loader controller target without autoplay interpolation lag — direct
      loaderCtrl.renderFrameImmediate(frame);

      // Whiteout to brand fade: after frame 115, fade video, show brand
      if (elapsed >= brandStart && !brandShown){
        brandShown = true;
        brand.classList.add('visible');
        // animate letters stagger
        const letters = brand.querySelectorAll('.brand-fa span');
        letters.forEach((sp, idx)=>{
          sp.style.transitionDelay = (0.12 + idx*0.09) + 's';
        });
      }
      // Fade video layer gradually from brandStart to end
      if (elapsed >= brandStart){
        const fadeP = (elapsed - brandStart) / (duration - brandStart); // 0..1 over last 3s
        loadingCanvas.style.opacity = String(1 - fadeP*0.92);
        // Also fade vignette? keep
      }

      if (p < 1){
        raf = requestAnimationFrame(tick);
      } else {
        // complete -> transition to hero
        setTimeout(()=>{
          loadingSection.classList.add('out');
          document.body.classList.add('loader-done');
          if (loaderCtrl) loaderCtrl.destroy();
          // enable scroll
          document.documentElement.style.overflow = '';
          document.body.style.overflow = '';
          if (onComplete) onComplete();
        }, 420);
      }
    }
    // lock scroll during loading
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    raf = requestAnimationFrame(tick);
  }

  // Also allow skip on tap/click after 2s
  let canSkip = false;
  setTimeout(()=>canSkip=true, 2200);
  loadingSection.addEventListener('click', ()=>{
    if (!canSkip) return;
    if (raf) cancelAnimationFrame(raf);
    loadingSection.classList.add('out');
    document.documentElement.style.overflow = '';
    document.body.style.overflow = '';
    if (loaderCtrl) loaderCtrl.destroy();
    if (preloader) preloader.classList.add('hide');
    if (onComplete) onComplete();
  });
}
