// Calculators — Dark Luxury — §30-31
import { elevatorSpecs } from './data.js';

export function initCalculators(){
  // Capacity calculator
  const formCap = document.getElementById('capacityForm');
  const resCap = document.getElementById('capacityResult');
  if (formCap){
    formCap.addEventListener('submit', (e)=>{
      e.preventDefault();
      const shaftH = parseFloat(document.getElementById('shaftH').value) || 0;
      const shaftW = parseFloat(document.getElementById('shaftW').value) || 0;
      const shaftD = parseFloat(document.getElementById('shaftD').value) || 0;
      const doorType = document.getElementById('doorType').value;

      // Validation
      if (!shaftW || !shaftD){
        showCapError("لطفاً عرض و عمق چاه را وارد کنید.");
        return;
      }

      // Logic separated per §30
      const result = calculateCapacity({ shaftH, shaftW, shaftD, doorType });
      renderCapacityResult(result);
    });

    document.getElementById('capacityReset')?.addEventListener('click', ()=>{
      formCap.reset();
      if (resCap) resCap.classList.remove('visible');
    });
  }

  function showCapError(msg){
    if (!resCap) return;
    resCap.innerHTML = `<div class="result-note" style="color:#8a2a2a">${msg}</div>`;
    resCap.classList.add('visible');
  }

  function calculateCapacity({ shaftH, shaftW, shaftD, doorType }){
    // Estimate cabin dims: shaft minus structure (27cm total? shaft - 28?)
    // Use spec: minimumDoorWidth 142 for 80 telescopic; shaftW must be >=142 else warning
    const struct = 14; // cm per side
    const cabinW = Math.max(0, shaftW - struct*2);
    const cabinD = Math.max(0, shaftD - struct*1.4);
    const area = (cabinW * cabinD) / 10000; // m2
    // Map area to capacity tiers (EN81)
    // 0.90 => 320kg 4p, 1.10=>450 6p, 1.45=>630 8p, 1.66=>800 10p
    let tier;
    if (area < 0.90) tier = { kg: 320, persons: 4 };
    else if (area < 1.17) tier = { kg: 450, persons: 6 };
    else if (area < 1.45) tier = { kg: 630, persons: 8 };
    else if (area < 1.66) tier = { kg: 800, persons: 10 };
    else tier = { kg: 1000, persons: 13 };

    // doorType adjustment: if telescopic needs min width
    const need = doorType === 'telescopic' ? elevatorSpecs.minimumDoorWidth : 120;
    const doorOk = shaftW >= need;
    const doorMsg = doorOk ? `عرض چاه برای درب ${doorType==='telescopic'?'تلسکوپی ۸۰':'لولایی'} مناسب است.` : `هشدار: عرض چاه ${shaftW}cm برای ${doorType==='telescopic'?'درب تلسکوپی ۸۰ (حداقل '+need+'cm)':''} کم است.`;

    // Also compute suggestion vs spec default: if result matches spec default highlight
    const isSpecMatch = tier.kg === elevatorSpecs.capacityKg && tier.persons === elevatorSpecs.persons;

    return { cabinW: Math.round(cabinW), cabinD: Math.round(cabinD), area: area.toFixed(3), tier, doorOk, doorMsg, isSpecMatch, shaftH, shaftW, shaftD };
  }

  function renderCapacityResult(r){
    if (!resCap) return;
    resCap.innerHTML = `
      <div class="result-row">
        <div>
          <div class="result-label">ظرفیت پیشنهادی</div>
          <div class="result-value">${r.tier.kg} <small>KG</small></div>
        </div>
        <div style="text-align:left">
          <div class="result-label">تعداد نفر</div>
          <div class="result-value">${r.tier.persons} <small>نفر</small></div>
        </div>
      </div>
      <div class="result-row" style="flex-direction:column;align-items:stretch;gap:8px">
        <div style="display:flex;justify-content:space-between">
          <span class="result-label">ابعاد کابین محاسبه‌شده</span>
          <span style="font-size:13px;font-weight:600">${r.cabinW} × ${r.cabinD} <small style="font-size:10px;color:rgba(0,0,0,0.5)">CM</small></span>
        </div>
        <div style="display:flex;justify-content:space-between">
          <span class="result-label">مساحت کابین</span>
          <span style="font-size:13px;font-weight:600">${r.area} <small style="font-size:10px">M²</small></span>
        </div>
        <div class="result-note">${r.doorMsg}</div>
        ${r.isSpecMatch ? `<div class="result-note" style="background:rgba(0,0,0,0.06);padding:8px 10px;border-radius:10px">✓ مطابق مشخصات فنی کاماک — ۴۵۰kg / ۶ نفر — ۱۱۲×۱۰۹ — انتخاب بهینه برای چاه ${r.shaftW}×${r.shaftD}</div>` : ``}
      </div>
    `;
    resCap.classList.add('visible');
    resCap.scrollIntoView({ behavior:'smooth', block:'nearest' });
  }

  // Steel calculator
  const formSteel = document.getElementById('steelForm');
  const resSteel = document.getElementById('steelResult');
  const tableWrap = document.getElementById('steelTableWrap');
  if (formSteel){
    formSteel.addEventListener('submit', (e)=>{
      e.preventDefault();
      const height = parseFloat(document.getElementById('steelHeight').value) || 0;
      const stops = parseInt(document.getElementById('steelStops').value) || 0;
      const pit = parseFloat(document.getElementById('steelPit').value) || 0;
      const overhead = parseFloat(document.getElementById('steelOverhead').value) || 0;
      const speed = document.getElementById('steelSpeed').value;

      if (!height || !stops){
        if (resSteel){
          resSteel.innerHTML = `<div class="result-note">لطفاً ارتفاع و تعداد توقف را وارد کنید.</div>`;
          resSteel.classList.add('visible');
        }
        return;
      }
      const data = calculateSteel({ height, stops, pit, overhead, speed });
      renderSteel(data);
    });
    document.getElementById('steelReset')?.addEventListener('click', ()=>{
      formSteel.reset();
      if (resSteel) resSteel.classList.remove('visible');
      if (tableWrap) tableWrap.style.display='none';
    });
  }

  function calculateSteel({ height, stops, pit, overhead, speed }){
    // Simplified luxury steel list logic — mock engineering based on height and stops
    // Rail length = height + pit + overhead + 0.5m extra
    const railLen = height + pit/100 + overhead/100 + 0.5; // height is in meters? inputs are meters
    // Actually inputs: height in meters, pit/overhead cm convert
    const guideRails = Math.ceil(railLen / 5) * 2; // 5m per rail, 2 sides
    const brackets = Math.ceil(railLen / 1.5) * 2; // every 1.5m
    const fishplates = (guideRails - 2) * 2;
    // Cabin frame etc
    const cabinSteel = (elevatorSpecs.cabinWidth * elevatorSpecs.cabinDepth * 0.0001 * 85).toFixed(1); // mock weight
    const counterWeight = Math.ceil(elevatorSpecs.capacityKg * 0.5 + 120);
    const ropes = Math.ceil(height * 4 * 1.08); // 4 ropes with 8% extra

    return {
      height, stops, pit, overhead, speed,
      items: [
        { name:"ریل راهنما T90/B", spec:"۵ متری — نورد سرد", qty:`${guideRails} شاخه`, length:`${(guideRails*5).toFixed(1)} m`, weight:`${(guideRails*38).toFixed(0)} kg` },
        { name:"براکت دیواری", spec:"گالوانیزه — فواصل ۱.۵m", qty:`${brackets} عدد`, length:"—", weight:`${(brackets*4.2).toFixed(1)} kg` },
        { name:"لقمه اتصال ریل", spec:"Fishplate", qty:`${fishplates} دست`, length:"—", weight:`${(fishplates*1.1).toFixed(1)} kg` },
        { name:"سیم بکسل", spec:`Φ${speed==='1.0'?'۱۰':'۸'} — مغزی فولادی`, qty:`۴ رشته`, length:`${ropes} m`, weight:`${(ropes*0.39).toFixed(1)} kg` },
        { name:"شاسی کابین", spec:`${elevatorSpecs.cabinWidth}×${elevatorSpecs.cabinDepth} — ورق ۳mm`, qty:"۱ دستگاه", length:"—", weight:`${cabinSteel} kg` },
        { name:"قاب وزنه", spec:`${elevatorSpecs.counterweightFrame} — ناودانی ۱۰`, qty:"۱ دستگاه", length:`${(height+1.2).toFixed(1)} m`, weight:`${counterWeight} kg` },
        { name:"نبشی چاه", spec:"نبشی ۸ — کلاف", qty:`${stops*4} شاخه`, length:`${(stops*2.8).toFixed(1)} m`, weight:`${(stops*4*12.5).toFixed(0)} kg` },
        { name:"صفحه ضربه‌گیر", spec:"Pit buffer plate", qty:"۲ عدد", length:"—", weight:"۱۸ kg" },
      ]
    };
  }

  function renderSteel(data){
    if (!resSteel || !tableWrap) return;
    // Summary cards
    resSteel.innerHTML = `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
        <div>
          <div class="result-label">طول ریل محاسبه‌شده</div>
          <div class="result-value">${(data.height + 0.5).toFixed(2)} <small>m</small></div>
        </div>
        <div>
          <div class="result-label">تعداد توقف</div>
          <div class="result-value">${data.stops} <small>ایستگاه</small></div>
        </div>
      </div>
      <div class="result-note">برآورد اولیه بر اساس ارتفاع ${data.height}m و سرعت ${data.speed} m/s — مقادیر نهایی پس از نقشه‌کشی کارگاهی قطعی می‌شود.</div>
    `;
    resSteel.classList.add('visible');

    // Build table
    let html = `<table class="steel-table"><thead><tr><th>شرح آهن‌آلات</th><th>مشخصات</th><th>تعداد</th><th>طول</th><th>وزن تقریبی</th></tr></thead><tbody>`;
    data.items.forEach(it=>{
      html += `<tr><td style="font-weight:500;color:var(--pearl)">${it.name}</td><td>${it.spec}</td><td>${it.qty}</td><td>${it.length}</td><td>${it.weight}</td></tr>`;
    });
    html += `</tbody></table>`;
    tableWrap.innerHTML = html;
    tableWrap.style.display = 'block';
    tableWrap.scrollIntoView({ behavior:'smooth', block:'nearest' });
  }

  // Reveal on scroll
  const specs = document.querySelectorAll('.spec-card, .calc-card');
  const io = new IntersectionObserver(entries=>{
    entries.forEach(e=>{
      if (e.isIntersecting) e.target.classList.add('visible');
    });
  }, {threshold:0.12});
  specs.forEach(s=> io.observe(s));
}
