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
    this.cacheLimit = 90; // B: larger cache for smooth scrub, still mobile safe
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
    this._dpr = Math.min(window.devicePixelRatio || 1, 1.5); // B-1: cap DPR to 1.5 for perf

    this._loadingSet = new Set();
    this._pending = new Map(); // index -> Image pending
    this._queue = []; // B-2: queue for concurrency control
    this._activeLoads = 0;
    this._maxConcurrent = 6; // limit parallel fetches
    this._queuedSet = new Set(); // track queued indices

    this._initCanvas();
  }

  _initCanvas(){
    // wait a tick so layout is ready — stable observer without jump
    let resizeTick = null;
    let lastW = 0, lastH = 0;
    const debouncedResize = ()=>{
      if (resizeTick) return;
      resizeTick = requestAnimationFrame(()=>{
        resizeTick = null;
        const rect = this.canvas.getBoundingClientRect();
        const w = Math.round(rect.width), h = Math.round(rect.height);
        // ignore tiny changes (<2px) that cause jitter on mobile addressbar
        if (Math.abs(w - lastW) < 2 && Math.abs(h - lastH) < 2) return;
        lastW = w; lastH = h;
        this._dpr = Math.min(window.devicePixelRatio||1,1.5);
        this._resize();
        this.needsRender = true;
      });
    };
    const ro = new ResizeObserver(()=> debouncedResize());
    try{ ro.observe(this.canvas); }catch(e){}
    this._resizeObserver = ro;
    // initial resize attempts — staggered, no jump
    this._resize();
    setTimeout(()=>{ this._resize(); lastW = Math.round(this.canvas.getBoundingClientRect().width); lastH = Math.round(this.canvas.getBoundingClientRect().height); }, 90);
    setTimeout(()=> this._resize(), 320);
    this._renderLoop();
    // use visualViewport if available for stable resize on mobile (address bar)
    const onResize = ()=> debouncedResize();
    window.addEventListener('resize', onResize, {passive:true});
    if (window.visualViewport) window.visualViewport.addEventListener('resize', onResize, {passive:true});
    window.addEventListener('orientationchange', ()=> setTimeout(()=>{ debouncedResize(); }, 250));
  }

  _resize(){
    const rect = this.canvas.getBoundingClientRect();
    // fallback if rect is 0 (hidden) try parent — stable
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
    // clamp to avoid extreme DPR spikes on zoom
    const dpr = Math.min(window.devicePixelRatio||1, 1.5);
    this._dpr = dpr;
    const pw = Math.max(1, Math.round(w * dpr));
    const ph = Math.max(1, Math.round(h * dpr));
    // only resize canvas if changed, but preserve drawing to avoid flash
    if (this.canvas.width !== pw || this.canvas.height !== ph){
      // save current frame image if exists to avoid black flash
      const prevW = this.canvas.width, prevH = this.canvas.height;
      if (prevW && prevH && this.frameIndex !== undefined){
        // no clear, just resize and re-render immediately if image ready
      }
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
        // promote to cache — ensure decode done
        if (pImg.decode) {
          // already decoded? promote
        }
        this._pending.delete(index);
        this._loadingSet.delete(index);
        this.images[index] = pImg;
        this.lru.push(index);
        return pImg;
      }
      return null;
    }
    if (this._loadingSet.has(index) || this._queuedSet.has(index)) return null;
    // enqueue with priority (closer to current first)
    this._enqueue(index);
    return null;
  }

  _enqueue(index){
    // avoid duplicate
    if (this._queuedSet.has(index) || this._loadingSet.has(index)) return;
    this._queuedSet.add(index);
    // insert sorted by distance to current frame for priority
    const dist = Math.abs(index - this.frameIndex);
    let inserted = false;
    for (let i=0;i<this._queue.length;i++){
      const otherDist = Math.abs(this._queue[i] - this.frameIndex);
      if (dist < otherDist){
        this._queue.splice(i,0,index);
        inserted = true;
        break;
      }
    }
    if (!inserted) this._queue.push(index);
    this._processQueue();
  }

  _processQueue(){
    while (this._activeLoads < this._maxConcurrent && this._queue.length>0){
      const idx = this._queue.shift();
      this._queuedSet.delete(idx);
      if (this.images[idx] || this._pending.has(idx)) continue;
      this._activeLoads++;
      this._loadingSet.add(idx);
      const img = new Image();
      img.decoding = "async";
      // Use webp naming frame_0000.webp
      const src = `${this.dir}/frame_${String(idx).padStart(4,'0')}.webp`;
      img.src = src;
      this._pending.set(idx, img);
      const onDone = ()=>{
        this._activeLoads--;
        this._loadingSet.delete(idx);
        this._pending.delete(idx);
        // decode off-main-thread where supported
        const finalize = ()=>{
          this.images[idx] = img;
          this.lru.push(idx);
          this._evictIfNeeded(idx);
          if (Math.abs(idx - this.frameIndex) < 4) this.needsRender = true;
          this._processQueue();
        };
        if (img.decode){
          img.decode().then(finalize).catch(finalize);
        } else {
          finalize();
        }
      };
      const onErr = ()=>{
        this._activeLoads--;
        this._loadingSet.delete(idx);
        this._pending.delete(idx);
        this._processQueue();
        // retry after 900ms once if still needed
        setTimeout(()=>{
          if (!this.images[idx] && Math.abs(idx - this.frameIndex) < 24){
            this._enqueue(idx);
          }
        }, 900);
      };
      img.onload = onDone;
      img.onerror = onErr;
      // if already complete (cached), trigger
      if (img.complete && img.naturalWidth){
        // give decode a tick
        setTimeout(onDone, 0);
      }
    }
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
    // B-5: smarter preload — closest first, not sequential
    const indices = [];
    for (let d=0; d<=radius; d++){
      const a = Math.round(center + d);
      const b = Math.round(center - d);
      if (a>=0 && a < this.count) indices.push(a);
      if (d!==0 && b>=0 && b < this.count) indices.push(b);
    }
    for (const idx of indices) this._getImage(idx);
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
    // breathing removed — no CSS transform
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
    // breathing removed
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
