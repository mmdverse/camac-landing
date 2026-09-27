// Simple typewriter / count-up helper — minimal luxury
export function typewriter(el, text, speed=22){
  if (!el) return;
  el.textContent = "";
  let i=0;
  function tick(){
    if (i < text.length){
      el.textContent += text[i++];
      setTimeout(tick, speed);
    }
  }
  tick();
}
export function countUp(el, target, duration=900, suffix=""){
  if (!el) return;
  const start = performance.now();
  const from = 0;
  function frame(now){
    const t = Math.min(1, (now - start)/duration);
    const eased = 1 - Math.pow(1 - t, 3);
    const val = Math.round(from + (target - from)*eased);
    el.textContent = suffix ? `${val} ${suffix}` : `${val}`;
    if (t < 1) requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
