// Camac — Main orchestrator — §38
import { initLoader } from './loader.js';
import { initHero } from './hero.js';
import { initBlueprint } from './blueprint.js';
import { initCalculators } from './calculators.js';

const nav = document.getElementById('nav');

// Nav scroll state
let navTicking = false;
function updateNav(){
  navTicking = false;
  if (window.scrollY > 24) nav.classList.add('scrolled');
  else nav.classList.remove('scrolled');
}
window.addEventListener('scroll', ()=>{
  if (!navTicking){ navTicking=true; requestAnimationFrame(updateNav); }
}, {passive:true});

// Smooth anchor handling (اگر لینک داخلی باشد)
document.querySelectorAll('a[href^="#"]').forEach(a=>{
  a.addEventListener('click', e=>{
    const id = a.getAttribute('href');
    if (id.length > 1){
      const el = document.querySelector(id);
      if (el){
        e.preventDefault();
        const top = el.getBoundingClientRect().top + window.scrollY - 56;
        window.scrollTo({ top, behavior:'smooth' });
      }
    }
  });
});

// Loader → Hero → Blueprint chain
initLoader({
  onComplete: ()=>{
    // After loader, init scroll-driven sections
    const heroCtrl = initHero();
    const printCtrl = initBlueprint();
    initCalculators();

    // Fade in nav
    nav.style.opacity = '1';

    // Initial reveal animations
    document.querySelectorAll('.fade-in').forEach((el,i)=>{
      setTimeout(()=> el.classList.add('visible'), 300 + i*90);
    });

    // Preload remaining frames in idle
    if ('requestIdleCallback' in window){
      requestIdleCallback(()=>{
        // Warm caches
        for (let i=0;i<40;i++){
          const img = new Image(); img.src = `assets/frames/hero/frame_${String(i).padStart(4,'0')}.webp`;
        }
      });
    }
  }
});

// If loader already skipped via reduced motion? loader handles itself

// Fallback if JS disabled? not needed

// Expose specs for console
import { elevatorSpecs } from './data.js';
window.CamacSpecs = elevatorSpecs;
