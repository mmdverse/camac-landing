// Camac — Data-Driven Specs — §42
export const elevatorSpecs = {
  capacityKg: 450,
  persons: 6,
  cabinDepth: 112, // cm
  cabinWidth: 109, // cm
  doorWidth: 80, // cm
  doorCount: 2,
  doorType: "تلسکوپی",
  area: 1.2868, // m2
  counterweightFrame: 104, // cm ?
  minimumDoorWidth: 142 // cm — حداقل عرض مورد نیاز برای درب تلسکوپی 80
};

export const heroSegments = {
  solid:  { start: 0,   end: 120, loopFrom: 14,  loopTo: 104 },
  scan:   { start: 121, end: 228, loopFrom: 160, loopTo: 200 },
  finale: { start: 229, end: 239, loopFrom: 229, loopTo: 236 }
};

export const loadingFrames = { dir: "assets/frames/loading", count: 150, fps: 25, whiteFrom: 115 };
export const heroFrames    = { dir: "assets/frames/hero",    count: 240, fps: 30 };
export const printFrames   = { dir: "assets/frames/print",   count: 300, fps: 30 };

// Callouts anchors measured in image pct §6 — used to map to viewport cover
export const heroAnchors = {
  cabinBody: { x: 0.50, y: 0.51 }, // center of cabin
  doorSeam:  { x: 0.44, y: 0.52 },
  ceilingLight: { x: 0.50, y: 0.36 },
  lightBand: { xMin: 0.27, xMax: 0.74, yMin: 0.26, yMax: 0.76 }
};

// Scan info choreography — when scan passes, reveal metric
// Progress 0..1 within HERO (0-50% solid, 50-95% scan, 95-100% finale)
// We map these pop moments inside scan range
export const scanMetrics = [
  { id:"capacity", at: 0.58, label:"ظرفیت اسمی", value:`${elevatorSpecs.capacityKg}`, unit:"KG", sub:`${elevatorSpecs.persons} نفر — ${elevatorSpecs.capacityKg} کیلوگرم` },
  { id:"cabin",    at: 0.69, label:"ابعاد کابین", value:`${elevatorSpecs.cabinWidth} × ${elevatorSpecs.cabinDepth}`, unit:"CM", sub:`عرض ${elevatorSpecs.cabinWidth} × عمق ${elevatorSpecs.cabinDepth} سانتی‌متر` },
  { id:"door",     at: 0.80, label:"عرض درب", value:`${elevatorSpecs.doorWidth}`, unit:"CM", sub:`${elevatorSpecs.doorCount} لنگه — ${elevatorSpecs.doorType}` },
  { id:"area",     at: 0.89, label:"مساحت کابین", value:`${elevatorSpecs.area}`, unit:"M²", sub:`قاب وزنه ${elevatorSpecs.counterweightFrame} — حداقل عرض ${elevatorSpecs.minimumDoorWidth}` }
];
