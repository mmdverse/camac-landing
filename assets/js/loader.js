// Loader — Hybrid: Video for loading.mp4 + FrameController fallback + Brand Reveal §5
import { FrameController } from './frame-controller.js';
import { loadingFrames } from './data.js';

export function initLoader({ onComplete }){
  const preloader = document.getElementById('preloader');
  const preProgress = document.querySelector('.preloader-progress');
  const loadingSection = document.getElementById('loadingSection');
  const loadingCanvas = document.getElementById('loadingCanvas');
  const loadingVideo = document.getElementById('loadingVideo');
  const brand = document.getElementById('brandReveal');

  // Preloader — real check: video + critical hero/print frames
  const criticalImgs = [
    `assets/frames/hero/frame_0000.webp`,
    `assets/frames/hero/frame_0001.webp`,
    `assets/frames/print/frame_0000.webp`,
  ];
  let loaded = 0;
  const totalCritical = criticalImgs.length + 1; // +1 for video
  let preloaderDone = false;
  let minShow = 420;
  const preStart = performance.now();
  let videoReady = false;

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

  // Track video ready
  if (loadingVideo){
    const onVideoCanPlay = ()=>{
      if (!videoReady){
        videoReady = true;
        loaded++;
        updatePreProgress();
        if (loaded >= totalCritical) maybeHidePreloader();
      }
    };
    loadingVideo.addEventListener('canplaythrough', onVideoCanPlay, {once:true});
    loadingVideo.addEventListener('canplay', onVideoCanPlay, {once:true});
    loadingVideo.addEventListener('loadeddata', onVideoCanPlay, {once:true});
    loadingVideo.addEventListener('error', ()=>{
      // treat as loaded to not block, will fallback to canvas
      if (!videoReady){
        videoReady = true;
        loaded++;
        updatePreProgress();
        if (loaded >= totalCritical) maybeHidePreloader();
      }
    }, {once:true});
    // if already have metadata, count
    if (loadingVideo.readyState >= 3){
      onVideoCanPlay();
    }
  } else {
    // no video, count as loaded
    loaded++;
  }

  // Preload critical images
  criticalImgs.forEach(src=>{
    const img = new Image();
    img.src = src;
    const done = ()=>{ loaded++; updatePreProgress(); if (loaded >= totalCritical) maybeHidePreloader(); };
    img.onload = done;
    img.onerror = done;
  });
  // fallback — if network slow, still continue after 1.6s
  setTimeout(()=>{ if (!preloaderDone) maybeHidePreloader(); }, 1600);
  updatePreProgress();

  // Cinematic loader — Hybrid
  let loaderCtrl = null;
  let raf = null;
  let brandShown = false;
  let videoEnded = false;

  function startCinematic(){
    // Prefer video if available and ready
    const useVideo = !!(loadingVideo && loadingVideo.src && !loadingVideo.error);
    
    if (useVideo){
      // Hide canvas, show video
      if (loadingCanvas) loadingCanvas.style.display = 'none';
      loadingVideo.style.display = 'block';
      loadingVideo.style.opacity = '1';
      loadingVideo.currentTime = 0;
      loadingVideo.muted = true;
      loadingVideo.playsInline = true;
      
      let duration = 6; // fallback
      const brandStart = 3.0; // seconds

      const onMeta = ()=>{
        if (loadingVideo.duration && !isNaN(loadingVideo.duration)){
          duration = loadingVideo.duration;
        }
      };
      if (loadingVideo.readyState >= 1) onMeta();
      else loadingVideo.addEventListener('loadedmetadata', onMeta, {once:true});

      // Try to play — if autoplay blocked, fallback to frame
      const playPromise = loadingVideo.play();
      if (playPromise) playPromise.catch(()=>{
        // autoplay blocked — fallback to frames
        console.warn('[loader] video autoplay blocked, fallback to frames');
        initFrameFallback();
        return;
      });

      const onTimeUpdate = ()=>{
        const t = loadingVideo.currentTime || 0;
        if (t >= brandStart && !brandShown){
          brandShown = true;
          brand.classList.add('visible');
        }
        if (t >= brandStart){
          const fadeP = Math.min(1, (t - brandStart) / Math.max(0.5, duration - brandStart));
          loadingVideo.style.opacity = String(1 - fadeP*0.92);
        }
      };

      const onEnded = ()=>{
        if (videoEnded) return;
        videoEnded = true;
        loadingVideo.removeEventListener('timeupdate', onTimeUpdate);
        setTimeout(()=>{
          loadingSection.classList.add('out');
          document.body.classList.add('loader-done');
          document.documentElement.style.overflow = '';
          document.body.style.overflow = '';
          if (onComplete) onComplete();
        }, 420);
      };

      loadingVideo.addEventListener('timeupdate', onTimeUpdate);
      loadingVideo.addEventListener('ended', onEnded, {once:true});

      // lock scroll during loading
      document.documentElement.style.overflow = 'hidden';
      document.body.style.overflow = 'hidden';
      raf = { cancel: ()=>{ loadingVideo.removeEventListener('timeupdate', onTimeUpdate); loadingVideo.removeEventListener('ended', onEnded); } };

      // Fallback timer: if video stalls (readyState <2 for >1.2s), switch to frames
      let fallbackTimer = setTimeout(()=>{
        if (loadingVideo.readyState < 2 && !videoEnded && !brandShown){
          console.warn('[loader] video stall, fallback to frames');
          loadingVideo.removeEventListener('timeupdate', onTimeUpdate);
          loadingVideo.removeEventListener('ended', onEnded);
          loadingVideo.style.display = 'none';
          initFrameFallback();
        }
      }, 1200);

      // clear fallback if video starts playing
      loadingVideo.addEventListener('playing', ()=> clearTimeout(fallbackTimer), {once:true});

      // Also allow skip after 2.2s
      let canSkip = false;
      setTimeout(()=>canSkip=true, 2200);
      const onClickSkip = ()=>{
        if (!canSkip || videoEnded) return;
        videoEnded = true;
        loadingVideo.removeEventListener('timeupdate', onTimeUpdate);
        loadingVideo.removeEventListener('ended', onEnded);
        loadingSection.classList.add('out');
        document.documentElement.style.overflow = '';
        document.body.style.overflow = '';
        loadingVideo.pause();
        if (onComplete) onComplete();
      };
      loadingSection.addEventListener('click', onClickSkip, {once:false});
      // store for cleanup
      loadingSection._videoSkip = onClickSkip;

    } else {
      initFrameFallback();
    }
  }

  function initFrameFallback(){
    // Show canvas, hide video
    if (loadingVideo) loadingVideo.style.display = 'none';
    if (loadingCanvas){
      loadingCanvas.style.display = 'block';
      loadingCanvas.style.opacity = '1';
    }
    loaderCtrl = new FrameController({
      dir: loadingFrames.dir,
      count: loadingFrames.count,
      canvas: loadingCanvas,
      fps: loadingFrames.fps
    });
    loaderCtrl.preloadWindow(0, 24);
    loaderCtrl.renderFrameImmediate(0);
    setTimeout(()=>{
      for(let i=0;i<loadingFrames.count;i++){
        const im=new Image(); im.src=`${loadingFrames.dir}/frame_${String(i).padStart(4,'0')}.webp`;
      }
    }, 300);

    let startTime = performance.now();
    const duration = (loadingFrames.count / loadingFrames.fps) * 1000; // ~6000ms
    const brandStart = 3000;

    function tick(now){
      const elapsed = now - startTime;
      const p = Math.min(1, elapsed / duration);
      const frame = Math.floor(p * (loadingFrames.count - 1));
      loaderCtrl.renderFrameImmediate(frame);
      if (elapsed >= brandStart && !brandShown){
        brandShown = true;
        brand.classList.add('visible');
      }
      if (elapsed >= brandStart){
        const fadeP = (elapsed - brandStart) / (duration - brandStart);
        loadingCanvas.style.opacity = String(1 - fadeP*0.92);
      }
      if (p < 1){
        raf = requestAnimationFrame(tick);
      } else {
        setTimeout(()=>{
          loadingSection.classList.add('out');
          document.body.classList.add('loader-done');
          if (loaderCtrl) loaderCtrl.destroy();
          document.documentElement.style.overflow = '';
          document.body.style.overflow = '';
          if (onComplete) onComplete();
        }, 420);
      }
    }
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    raf = requestAnimationFrame(tick);
  }

  // Global skip also works for fallback (handled inside each mode)
  // For frame fallback, the click handler above for video won't run, so add generic
  let canSkipGlobal = false;
  setTimeout(()=>canSkipGlobal=true, 2200);
  loadingSection.addEventListener('click', ()=>{
    if (!canSkipGlobal) return;
    // if video mode already handled, this will double but ok
    if (raf && typeof raf === 'object' && raf.cancel){
      // video mode
      return;
    }
    if (raf) cancelAnimationFrame(raf);
    loadingSection.classList.add('out');
    document.documentElement.style.overflow = '';
    document.body.style.overflow = '';
    if (loaderCtrl) loaderCtrl.destroy();
    if (loadingVideo) loadingVideo.pause();
    if (preloader) preloader.classList.add('hide');
    if (onComplete) onComplete();
  });
}
