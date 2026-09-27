// FrameController — Generic — §39
// Handles image sequence → canvas cover rendering, scroll → frame, autoplay ping-pong

export class FrameController {
  constructor({ dir, count, canvas, fps = 30, loopFrom, loopTo, fit = 'cover' }) {
    this.dir = dir;
    this.count = count;
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false, desynchronized: true });
    this.fps = fps;
    this.countMinusOne = Math.max(1, count - 1);
    this.fit = fit; // 'cover' or 'contain'

    this.images = new Array(count); // Image cache sparse
    this.cacheLimit = 56; // balanced for mobile memory vs smoothness
    this.lru = []; // indices MRU

    this.progress = 0; // 0..1 target
    this.current = 0; // float interpolated
    this.frameIndex = 0;
    this.raf = null;
    this.needsRender = true;

    this.autoplay = false;
    this.autoDir = 1;
    this.autoSpeed = 0.20; // آروم و روان — نه تند نه لگ
    this.loopFrom = loopFrom ?? 0;
    this.loopTo = loopTo ?? count - 1;
    this.segment = null;

    this.onFrame = null; // callback(frameIndex)
    this._boundRender = this._renderLoop.bind(this);
    this._resizeObserver = null;
    this._dpr = Math.min(window.devicePixelRatio || 1, 2);

    this._loadingSet = new Set();
    this._pending = new Map(); // index -> Image pending

    this._initCanvas();
  }

  _initCanvas(){
    // wait a tick so layout is ready
    const ro = new ResizeObserver(()=>this._resize());
    try{ ro.observe(this.canvas); }catch(e){}
    this._resizeObserver = ro;
    // initial resize attempts
    this._resize();
    setTimeout(()=>this._resize(), 80);
    setTimeout(()=>this._resize(), 300);
    this._renderLoop();
    window.addEventListener('resize', ()=>{ this._dpr = Math.min(window.devicePixelRatio||1,2); this._resize(); this.needsRender = true; });
    // also handle orientationchange
    window.addEventListener('orientationchange', ()=> setTimeout(()=>this._resize(), 200));
  }

  _resize(){
    const rect = this.canvas.getBoundingClientRect();
    // fallback if rect is 0 (hidden) try parent
    let w = rect.width, h = rect.height;
    if (w < 10 || h < 10){
      const p = this.canvas.parentElement;
      if (p){
        const pr = p.getBoundingClientRect();
        w = pr.width || window.innerWidth;
        h = pr.height || window.innerHeight;
      } else {
        w = window.innerWidth; h = window.innerHeight;
      }
    }
    const pw = Math.max(1, Math.round(w * this._dpr));
    const ph = Math.max(1, Math.round(h * this._dpr));
    if (this.canvas.width !== pw || this.canvas.height !== ph){
      this.canvas.width = pw;
      this.canvas.height = ph;
      this.needsRender = true;
    }
  }

  // Cover math §14 — supports cover / contain
  _drawImageCover(img){
    const cw = this.canvas.width, ch = this.canvas.height;
    if (!cw || !ch || !img || !img.naturalWidth) return;
    const iw = img.naturalWidth, ih = img.naturalHeight;
    // Fill background
    this.ctx.fillStyle = "#050505";
    this.ctx.fillRect(0,0,cw,ch);
    const scale = this.fit === 'contain' ? Math.min(cw / iw, ch / ih) : Math.max(cw / iw, ch / ih);
    const dw = iw * scale, dh = ih * scale;
    const dx = (cw - dw) * 0.5, dy = (ch - dh) * 0.5;
    // Improve quality
    this.ctx.imageSmoothingEnabled = true;
    this.ctx.imageSmoothingQuality = "high";
    this.ctx.drawImage(img, dx, dy, dw, dh);
  }

  // Visible mapping helper for overlay anchoring §14
  // given imgPct 0..1, return viewportPct 0..1 clamped
  mapImagePctToViewportPct(imgPct, axis='x'){
    const cw = this.canvas.width, ch = this.canvas.height;
    if (!cw || !ch) return imgPct;
    // Need image dimensions of current frame; approximate with canvas image ratio
    // We don't have image dims here reliably without img, so approximate using source 1080x1920 ratio 0.5625
    // For generic, assume image is 9:16 vertical (1080x1920)
    const isX = axis==='x';
    const imageW = 1080, imageH = 1920;
    const viewportW = this.canvas.getBoundingClientRect().width;
    const viewportH = this.canvas.getBoundingClientRect().height;
    const scale = Math.max(viewportW / imageW, viewportH / imageH);
    const drawnW = imageW * scale, drawnH = imageH * scale;
    const viewport = isX ? viewportW : viewportH;
    const drawn = isX ? drawnW : drawnH;
    const visibleStart = (1 - viewport / drawn) / 2;
    const visibleSize = viewport / drawn;
    let framePct = (imgPct - visibleStart) / visibleSize;
    const clampMin = 0.045, clampMax = 0.955;
    framePct = Math.min(clampMax, Math.max(clampMin, framePct));
    return framePct;
  }

  _getImage(index){
    index = Math.max(0, Math.min(this.count - 1, Math.round(index)));
    if (this.images[index]) {
      // touch LRU
      const pos = this.lru.indexOf(index);
      if (pos !== -1) this.lru.splice(pos,1);
      this.lru.push(index);
      return this.images[index];
    }
    if (this._pending.has(index)) {
      const pImg = this._pending.get(index);
      if (pImg && pImg.complete && pImg.naturalWidth) {
        // promote to cache
        this._pending.delete(index);
        this._loadingSet.delete(index);
        this.images[index] = pImg;
        this.lru.push(index);
        return pImg;
      }
      return null;
    }
    if (this._loadingSet.has(index)) return null;
    this._loadingSet.add(index);
    const img = new Image();
    img.decoding = "async";
    // keep pending reference to prevent GC
    this._pending.set(index, img);
    // Use webp naming frame_0000.webp
    img.src = `${this.dir}/frame_${String(index).padStart(4,'0')}.webp`;
    img.onload = ()=>{
      this._loadingSet.delete(index);
      this._pending.delete(index);
      this.images[index] = img;
      this.lru.push(index);
      this._evictIfNeeded(index);
      // If this is near current frame, trigger render
      if (Math.abs(index - this.frameIndex) < 4) this.needsRender = true;
    };
    img.onerror = ()=>{
      this._loadingSet.delete(index);
      this._pending.delete(index);
      // retry after 600ms once
      setTimeout(()=>{ /* allow retry */ }, 600);
    };
    return null;
  }

  _evictIfNeeded(centerIdx){
    if (this.lru.length <= this.cacheLimit) return;
    // Keep window around centerIdx ± cacheLimit/2, evict farthest
    const keep = new Set();
    const radius = Math.floor(this.cacheLimit/2);
    for (let i = -radius; i <= radius; i++){
      const idx = centerIdx + i;
      if (idx>=0 && idx < this.count) keep.add(idx);
    }
    // Include recently used fallback
    const newLru = [];
    for (const idx of this.lru){
      if (keep.has(idx) || newLru.length < this.cacheLimit - radius) newLru.push(idx);
      else {
        // evict
        this.images[idx] = undefined;
      }
    }
    this.lru = newLru.slice(-this.cacheLimit);
  }

  preload(indices){
    for (const i of indices) this._getImage(i);
  }

  preloadWindow(center, radius=28){
    for (let d=-radius; d<=radius; d++){
      const idx = Math.round(center + d);
      if (idx>=0 && idx < this.count) this._getImage(idx);
    }
  }

  setProgress(p){
    const clamped = Math.min(1, Math.max(0, p));
    this.progress = clamped;
    // Stop autoplay immediately on scroll (§16)
    if (this.autoplay) this.stopAutoplay();
    this.needsRender = true;
  }

  setSegment(segmentName, map){
    // segmentName in heroSegments keys, map is segment config object
    if (map && map[segmentName]){
      const seg = map[segmentName];
      this.loopFrom = seg.loopFrom;
      this.loopTo = seg.loopTo;
      this.segment = segmentName;
    }
  }

  // Current frame based on progress or autoplay current
  _computeTargetFrame(){
    if (this.autoplay){
      return this.current; // already updated via autoplay step
    } else {
      return this.progress * this.countMinusOne;
    }
  }

  startAutoplay(fromFrame){
    if (this.autoplay) return;
    // Determine segment by fromFrame
    // Use stored loopFrom/loopTo or detect
    let f = fromFrame ?? this.frameIndex;
    f = Math.max(0, Math.min(this.countMinusOne, f));
    // If outside loop window, clamp to nearest inside
    if (f < this.loopFrom) f = this.loopFrom;
    if (f > this.loopTo) f = this.loopTo;
    this.current = f;
    this.autoplay = true;
    // Add subtle breathing class for CSS smoothness
    this.canvas.classList.add('is-autoplaying');
    // Choose direction towards center to avoid jump §17
    const mid = (this.loopFrom + this.loopTo)/2;
    this.autoDir = (f < mid) ? 1 : -1;
    // If exactly at edge, bounce
    if (f <= this.loopFrom) this.autoDir = 1;
    if (f >= this.loopTo) this.autoDir = -1;
    this.needsRender = true;
  }

  stopAutoplay(){
    this.autoplay = false;
    this.canvas.classList.remove('is-autoplaying');
  }

  // Immediate render without interpolation (for loading)
  renderFrameImmediate(index){
    this.frameIndex = Math.max(0, Math.min(this.countMinusOne, Math.round(index)));
    this.current = this.frameIndex;
    this.progress = this.frameIndex / this.countMinusOne;
    const img = this._getImage(this.frameIndex);
    if (img && img.complete && img.naturalWidth){
      this._drawImageCover(img);
      if (this.onFrame) this.onFrame(this.frameIndex);
    } else {
      // try to keep previous frame visible; will render when loaded
      // preload window
      this.preloadWindow(this.frameIndex, 8);
    }
    // also preload nearby
    this.preloadWindow(this.frameIndex, 6);
  }

  _renderLoop(){
    this.raf = requestAnimationFrame(this._boundRender);

    // handle reduced motion
    const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (this.autoplay && !reduced){
      // ping-pong loop
      this.current += this.autoDir * this.autoSpeed;
      if (this.current >= this.loopTo){
        this.current = this.loopTo;
        this.autoDir = -1;
      } else if (this.current <= this.loopFrom){
        this.current = this.loopFrom;
        this.autoDir = 1;
      }
      const nextIdx = Math.round(this.current);
      if (nextIdx !== this.frameIndex){
        this.frameIndex = nextIdx;
        this.needsRender = true;
      }
    } else if (!this.autoplay){
      // Scroll-driven: soft, smooth — no jump
      const target = this.progress * this.countMinusOne;
      const diff = target - this.current;
      if (Math.abs(diff) > 0.001){
        // Soft lerp — balanced smooth vs responsive
        this.current += diff * 0.13;
        if (Math.abs(target - this.current) < 0.07) this.current = target;
        const nextIdx = Math.round(this.current);
        if (nextIdx !== this.frameIndex){
          this.frameIndex = nextIdx;
          this.needsRender = true;
        }
      } else {
        // at rest
      }
    } else {
      // reduced motion autoplay disabled
      if (this.autoplay && reduced){
        // subtle or disabled
      }
    }

    if (this.needsRender){
      const img = this._getImage(this.frameIndex);
      if (img && img.complete && img.naturalWidth){
        this._drawImageCover(img);
        this.needsRender = false;
        if (this.onFrame) this.onFrame(this.frameIndex);
        // preload surroundings for next frames — wider for smoothness
        this.preloadWindow(this.frameIndex, 24);
      } else {
        // image not ready, keep trying — aggressive preload
        this.preloadWindow(this.frameIndex, 14);
        // do not clear needsRender, will retry next frame
      }
    }
  }

  destroy(){
    if (this.raf) cancelAnimationFrame(this.raf);
    if (this._resizeObserver) this._resizeObserver.disconnect();
  }
}
