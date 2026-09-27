# Camac Elevator (کاماک) --- Luxury Cinematic Landing Page Specification

## 1. هدف پروژه

این پروژه یک Landing Page فارسی، کاملاً راست‌چین و لوکس برای شرکت آسانسور
است.

هدف اصلی، ساخت یک تجربه‌ی سینمایی و تعاملی است که کاربر ابتدا با یک
Loading Cinematic وارد سایت شود، سپس آسانسور را در Hero به‌صورت زنده
ببیند و با اسکرول، لایه‌های اطلاعاتی و فنی محصول آشکار شوند.

این سایت نباید شبیه یک سایت شرکتی معمولی یا یک داشبورد مهندسی باشد.

**جهت هنری:** Luxury / Modern / Minimal / Cinematic / Architectural /
Industrial / Technical but elegant

**زبان:** فارسی\
**Direction:** RTL\
**نام برند:** فارسی «کاماک» · لاتین «Camac»\
**پالت:** مشکی، خاکستری گرادیانی، سفید صدفی، با Accent بسیار محدود
آبی/Cyan فقط در بخش‌های تکنولوژیک.

------------------------------------------------------------------------

## 2. فایل‌های اصلی

سه ویدیوی اصلی در ریشه پروژه:

``` text
/loading.mp4
/hero.mp4
/print.mp4
```

این ویدیوها نباید صرفاً به شکل Background Video با autoplay ساده استفاده
شوند. هدف، تبدیل آن‌ها به Frame Sequence و کنترل آن‌ها با Scroll است.

ساختار واقعی پیاده‌شده (بدون Build Step):

``` text
/
├── index.html
├── elevator_landing_spec.md
├── loading.mp4
├── hero.mp4
├── print.mp4
└── assets/
    ├── frames/
    │   ├── loading/    frame_0000.webp … (150)
    │   ├── hero/       frame_0000.webp … (240)
    │   └── print/      frame_0000.webp … (300)
    ├── css/
    │   └── main.css
    └── js/
        ├── data.js
        ├── frame-controller.js
        ├── typewriter.js
        ├── loader.js
        ├── hero.js
        ├── blueprint.js
        ├── calculators.js
        └── main.js
```

سایت Vanilla JS است؛ هیچ Build Step و هیچ وابستگی خارجی ندارد و روی
GitHub Pages بدون تغییر اجرا می‌شود.

Frameها به WebP تبدیل شوند (تنظیمات دقیق در §35):

``` text
frame_0000.webp
frame_0001.webp
frame_0002.webp
...
```

ترتیب Frameها باید دقیقاً حفظ شود.

### مشخصات واقعی ویدیوهای مستر (اندازه‌گیری‌شده)

هر سه ویدیو به‌صورت **عمودی ۹:۱۶** با رزولوشن **۴K (2160×3840)** رندر
شده‌اند و نسخهٔ دسکتاپ ۱۶:۹ کنار گذاشته شده است:

``` text
loading.mp4   2160×3840   25 fps   150 frames   6.01 s
hero.mp4      2160×3840   30 fps   240 frames   8.01 s
print.mp4     2160×3840   30 fps   300 frames   10.01 s
```

درصد اسکرول هر بخش به تعداد فریم خودش map می‌شود، بنابراین تغییر تعداد
فریم، Section دیگری را خراب نمی‌کند.

------------------------------------------------------------------------

# 3. اصل اصلی Interaction

## Scroll = Navigation

اسکرول کاربر تعیین می‌کند سایت از یک وضعیت بصری به وضعیت بعدی برود.

## Autoplay = Life

وقتی کاربر در یک وضعیت توقف می‌کند، آن وضعیت نباید Freeze شود.

در هر Segment یک Loop بسیار ظریف و کنترل‌شده اجرا شود تا صفحه زنده بماند،
بدون اینکه کاربر را به Segment بعدی ببرد.

------------------------------------------------------------------------

# 4. روایت کلی

``` text
PRE-LOADER   (صفحهٔ سیاه + سه نقطهٔ متحرک)
   ↓
LOADING CINEMATIC
   ↓
BRAND REVEAL   (کاماک / Camac — آخرین ۳ ثانیه)
   ↓
HERO — SOLID ELEVATOR
   ↓
HERO — DIMENSIONAL SCAN
   ↓
PRINT / BLUEPRINT
   ↓
۰۱ — مشخصات فنی
   ↓
۰۲ — ابزار محاسبه
```

------------------------------------------------------------------------

# 5. LOADING --- loading.mp4

ویدیوی Loading از قبل طراحی شده و نباید تغییر اساسی کند.

### پیش‌لودر (قبل از لودر اصلی)

هدف: بازدیدکنندهٔ اولین بار، بدون لگ و بدون پرش صفحه، سایت را اجرا کند.
Assetهای بحرانی پیش از شروع تجربهٔ اصلی آماده می‌شوند.

-   صفحه کاملاً سیاه (`#050505`)
-   سه نقطه در مرکز صفحه
-   حرکت خلاقانه و ظریف مجاز است (نباید شبیه اسپینرهای پیش‌فرض باشد)
-   حداقل زمان نمایش کوتاه، تا پیش‌لودر «چشمک» نزند

Assetهای بحرانی که پیش‌لودر باید بگیرد:

``` text
loading frame 0000         نقش اولیه
loading frames 0000–0014   پنجرهٔ پیش‌پخش لودر
hero frame 0000
print frame 0000
```

پس از آماده‌شدن، پیش‌لودر محو می‌شود و لودر اصلی آغاز می‌شود.

### نمایش نام برند در ۳ ثانیهٔ آخر

در **آخرین ۳ ثانیهٔ لودر اصلی** نام برند وسط صفحه نمایش داده شود:

-   فارسی: «کاماک» · لاتین: «Camac»
-   چیدمان وسط‌چین (افقی و عمودی)
-   انیمیشن جذاب و اختصاصی؛ مثلاً نمایان‌شدن تدریجی حرف‌به‌حرف همراه با
    کشیده‌شدن یک خط نازک و هالهٔ نرم
-   در این بازه لایهٔ ویدیو به‌تدریج محو می‌شود تا برند روی زمینهٔ سیاه
    کاملاً خوانا بماند

### تایم‌لاین واقعی loading.mp4 (اندازه‌گیری‌شده)

``` text
frame 0000–0077   تاریکی + کشیده‌شدن خطوط نور آسانسور
frame 0078–0114   باز شدن دربها و ورود نور شدید
frame 0115–0146   White Out کامل (luma = 255)
frame 0147        گذار
frame 0148–0149   سیاه کامل
```

لودر با ۲۵ fps واقعی پخش می‌شود (۶٫۰۱ ثانیه) و نام برند از ثانیهٔ ۳٫۰ تا
۶٫۰ دیده می‌شود.

رفتار کلی:

1.  تاریکی کامل
2.  آشکار شدن تدریجی آسانسور با خطوط نور
3.  باز شدن دربها
4.  ورود نور شدید
5.  سفید شدن کامل Frame
6.  محو لایهٔ ویدیو و نمایش نام برند
7.  Transition به Hero

------------------------------------------------------------------------

# 6. HERO --- hero.mp4

نسخه فعلی Hero سه بخش اصلی دارد.

### چیدمان واقعی فریم ۹:۱۶ (اندازه‌گیری‌شده)

آسانسور در قاب عمودی این‌گونه قرار گرفته است:

``` text
باند نور کابین       x ۰٫۲۷ – ۰٫۷۴
بدنهٔ کابین          y ۰٫۲۶ – ۰٫۷۶
درز مرکزی درب        x ≈ ۰٫۴۴
نور سقف کابین        y ≈ ۰٫۳۳ – ۰٫۳۹
```

این اعداد مبنای anchor نقاط کال‌اوت هستند. چون دوربین در طول Segmentها
حرکت دارد، anchorها باید در همان بازه‌ای که کال‌اوت دیده می‌شود
اندازه‌گیری شوند، نه در frame اول.

### Segment 01 --- Real Elevator (frame 0000–0120)

در ابتدای ویدیو، یک آسانسور واقعی و لوکس در تاریکی ظاهر می‌شود.

تا حدود ثانیه ۴ حرکت/Zoom سینمایی دوربین وجود دارد.

این بخش، ورود اصلی کاربر به Hero است.

### Segment 02 --- Dimensional Scan (frame 0121–0228)

از frame ۱۲۱ یک پارچهٔ نورانی Cyan از بالای آسانسور ظاهر می‌شود و به پایین
حرکت می‌کند. اوج Scan در frame ۱۸۷ است و در frame ۲۲۹ کاملاً محو می‌شود.

آسانسور در این Effect نباید تغییر شکل دهد.

### Segment 03 --- Finale (frame 0229–0239)

بازگشت به آسانسور جامد در تاریکی و آماده‌شدن برای گذار به Blueprint.

------------------------------------------------------------------------

# 7. Segment 01 --- Autoplay

بعد از Loading، وقتی کاربر تازه وارد Hero می‌شود، نباید یک Frame ثابت
ببیند.

در حالت توقف Scroll:

-   Camera Motion بسیار آرام
-   حرکت جزئی نور
-   Reflection روی متریال
-   Ambient Motion محدود

ادامه پیدا کند.

Autoplay این Segment نباید وارد Scan شود.

مفهوم:

``` text
Segment 01
[ LOOP ]
A → B → C → B → A
```

با شروع Scroll، Autoplay متوقف و Scroll کنترل Frame را در دست می‌گیرد.

------------------------------------------------------------------------

# 8. Segment 02 --- Dimensional Scan

Scan به‌صورت یک نوار/پارچه نورانی حجمی از بالا به پایین حرکت می‌کند.

داخل محدوده Scan:

-   Grid چهارخانه
-   نمایش عمق/لایه‌ها
-   Gradient آبی و Cyan
-   نور نرم
-   Dimensional Visualization

ظاهر باید Premium Architectural Technology باشد، نه HUD یا Sci-Fi
Interface.

آسانسور:

-   تغییر شکل ندهد
-   Morph نشود
-   قطعات آن منفجر نشوند
-   ساختار اصلی حفظ شود

------------------------------------------------------------------------

# 9. استفاده از Scan برای اطلاعات

اطلاعات محصول داخل Video نوشته نشوند.

Scan چند بار در طول Scroll برای نمایش اطلاعات مختلف استفاده شود.

نمونه:

``` text
Scroll
 ↓
Scan
 ↓
ظرفیت

Scroll
 ↓
Scan
 ↓
ابعاد کابین

Scroll
 ↓
Scan
 ↓
عرض درب

Scroll
 ↓
Scan
 ↓
مشخصات فنی
```

Video فقط Visualization را ارائه می‌کند و HTML/CSS اطلاعات را نمایش
می‌دهد.

------------------------------------------------------------------------

# 10. اطلاعات محصول

اطلاعات زیر از فایل محاسبات ارائه‌شده استخراج شده‌اند:

### ظرفیت

``` text
6 نفر
450 کیلوگرم
```

### کابین

``` text
عمق کابین: 112
عرض کابین: 109
```

### درب

``` text
عرض درب: 80
تعداد درب: 2
نوع درب: تلسکوپی
```

### محاسبات

``` text
مساحت: 1.2868
کادر وزنه: 104
```

### حداقل عرض مورد نیاز برای درب مورد نظر

``` text
142
```

واحدهای واقعی پروژه در UI باید مشخص و یکدست نمایش داده شوند.

------------------------------------------------------------------------

# 11. Hero Information UI

اطلاعات به صورت Floating Overlay روی Video قرار بگیرند.

کارت‌های سنگین استفاده نشوند.

استایل پیشنهادی:

-   Transparent / translucent
-   Blur بسیار کم
-   Border بسیار ظریف
-   Dark Gray
-   Pearl White Typography

نمونه:

``` text
ظرفیت
450 KG

6 نفر
```

یا:

``` text
450
KG
ظرفیت اسمی
```

عدد اصلی بزرگ و Label کوچک باشد.

------------------------------------------------------------------------

# 12. Interaction اطلاعات با Scan

وقتی Scan از روی ناحیه مربوط عبور می‌کند، UI مربوط به آن ناحیه:

-   Fade In
-   Translate بسیار کم
-   افزایش Opacity
-   Glow بسیار محدود

داشته باشد.

مثال:

``` text
Scan → Cabin
        ↓
CABIN
112 × 109
```

سپس:

``` text
Scan → Door
        ↓
DOOR
80
```

و:

``` text
Scan → Capacity
        ↓
CAPACITY
450 KG
6 PERSONS
```

Animationها کوتاه و ظریف باشند.

------------------------------------------------------------------------

# 13. HERO Scroll Architecture

Hero به Segmentهای منطقی تقسیم شود.

مقادیر واقعی اندازه‌گیری‌شده (۲۴۰ فریم):

``` text
0% ─────────────── 50%
SOLID ELEVATOR

50% ────────────── 95%
DIMENSIONAL SCAN

95% ────────────── 100%
FINALE
```

این درصدها از مرز واقعی فریم‌ها استخراج شده‌اند؛ با تغییر تعداد فریم باید
بازمحاسبه شوند.

------------------------------------------------------------------------

# 14. Frame Mapping

مقادیر واقعی اندازه‌گیری‌شده:

``` text
loading.mp4   25 fps   150 frames   6.01 s
hero.mp4      30 fps   240 frames   8.01 s
print.mp4     30 fps   300 frames   10.01 s
```

Implementation باید FPS واقعی فایل را بخواند و به یک fps ثابت وابسته نباشد.

### پر کردن کامل قاب (Cover)

در هر سه Sequence، فریم باید **کل viewport را پر کند**:

``` text
scale = max(viewportW / imageW, viewportH / imageH)
```

اضافات Crop می‌شوند. این موارد ممنوع است:

-   `object-fit: contain`
-   Letterbox / نوار سیاه دور تصویر
-   کشیدن تصویر (Stretch)
-   مستطیل ۱۶:۹ وسط‌چین

Overlayها (کال‌اوت‌ها و …) نسبت به viewport چیده می‌شوند و مستقل از لایهٔ
تصویرند؛ مختصات آنها در «مختصات تصویر» تعریف و سپس به محدودهٔ قابل‌مشاهدهٔ
قاب map می‌شوند تا روی تصویر بمانند:

``` text
visibleStart = (1 - viewport / drawn) / 2
visibleSize  = viewport / drawn
framePct     = (imgPct - visibleStart) / visibleSize
```

و در پایان clamp به بازهٔ امن قاب (مثلاً ۴٫۵٪ تا ۹۵٫۵٪).

------------------------------------------------------------------------

# 15. Scroll → Frame

مفهوم:

``` text
scroll progress
      ↓
normalized progress 0 → 1
      ↓
frame index
      ↓
render frame
```

فرمول:

``` text
frame = progress × (totalFrames - 1)
```

Render با `requestAnimationFrame` و Interpolation نرم انجام شود.

------------------------------------------------------------------------

# 16. Autoplay هنگام توقف Scroll

وقتی Scroll متوقف شد:

1.  Segment فعال تشخیص داده شود.
2.  Frame فعلی ذخیره شود.
3.  Loop همان Segment فعال شود.
4.  Loop به Segment بعدی وارد نشود.
5.  با شروع Scroll، Autoplay فوراً متوقف شود.

مثال:

``` text
Current Frame: 120

120 → 125 → 130 → 135
135 → 130 → 125 → 120
LOOP
```

Loop باید Seamless باشد.

------------------------------------------------------------------------

# 17. نکته مهم درباره Scan

اگر کاربر وسط Scan توقف کرد، سیستم نباید ناگهان Scan را از ابتدا شروع
کند.

مثلاً:

``` text
User stops at Frame 240
```

Autoplay باید از همان محدوده ادامه پیدا کند یا نزدیک‌ترین Loop State را
انتخاب کند.

هدف:

**No visible jump.**

------------------------------------------------------------------------

# 18. BLUEPRINT --- print.mp4

ویدیوی سوم:

``` text
print.mp4
```

برای Blueprint استفاده می‌شود.

این Video یک Segment مستقل بعد از Hero است.

نیازی نیست Blueprint دوباره داخل Hero ساخته شود.

------------------------------------------------------------------------

# 19. Blueprint Information

ابعاد مهندسی **روی خود ویدیوی print.mp4 سوزان (burn-in) شده‌اند**:

``` text
194    163    144    128    114    90
```

بنابراین **هیچ Overlay ابعاد HTML روی این بخش اضافه نمی‌شود.** موارد زیر
حذف شده‌اند:

-   جعبه‌های Dimension
-   خطوط Wire و Crosshair
-   مقادیر تایپی (Typewriter)
-   برچسب‌های تکمیلی ابعاد

هدف:

``` text
print.mp4    (ابعاد روی خود نقشه)
```

تکرار ابعاد در UI، اطلاعات را دوگانه و صفحه را شلوغ می‌کند.

------------------------------------------------------------------------

# 20. Blueprint Coordinate System

چون لایهٔ ابعاد HTML حذف شده، Coordinate System برای این بخش لازم نیست.

تنها چیزی که روی Canvas می‌آید **شبکهٔ فنی (Grid)** است که کل قاب را پوشش
می‌دهد و به هیچ مختصاتی نیاز ندارد.

------------------------------------------------------------------------

# 21. Blueprint Visual Style

Blueprint باید حس CAD / Architectural Drawing داشته باشد.

رنگ‌ها:

-   Pearl White
-   Soft Gray
-   Accent بسیار محدود Blue/Cyan

Dimension Lineها:

-   Thin
-   Precise
-   Minimal

Glow شدید استفاده نشود.

هدف، Engineering Luxury است، نه HUD بازی.

از آنجا که ابعاد روی ویدیو هستند، تنها لایهٔ HTML این بخش یک شبکهٔ فنی
ظریف است که باید آن‌قدر کم‌رنگ باشد که با خطوط خود نقشه رقابت نکند.

------------------------------------------------------------------------

# 22. Blueprint UI

چون ابعاد روی ویدیو هستند، UI این بخش حداقلی است:

``` text
عنوان بخش (نقشه فنی)
    +
شبکهٔ فنی ظریف به‌عنوان فضای نقشه
    +
یادداشت واحد (سانتی‌متر)
```

انیمیشن تایپی ابعاد حذف شده است. شبکهٔ فنی با شروع اسکرول به‌آرامی ظاهر
می‌شود و اطلاعات شلوخی روی نقشه ایجاد نمی‌کند.

------------------------------------------------------------------------

# 23. Transition Hero → Blueprint

روایت:

``` text
Real Elevator
      ↓
Dimensional Scan
      ↓
Technical Layer
      ↓
Blueprint
```

Blueprint توسط:

``` text
print.mp4
```

نمایش داده می‌شود.

Hero نباید خودش Blueprint تولید کند.

------------------------------------------------------------------------

# 24. Color Palette

``` text
Black
#050505

Deep Charcoal
#111111

Graphite
#1B1B1B

Soft Gray
#7A7A7A

Pearl White
#F2F0EA

Pure White
#FFFFFF
```

Accent فقط برای Scan:

``` text
Electric Blue
#4DA3FF

Cyan
#6DE7FF
```

Accent نباید رنگ غالب سایت باشد.

------------------------------------------------------------------------

# 25. Gradient

Gradientها کنترل‌شده باشند:

``` text
Black
 ↓
Deep Charcoal
 ↓
Graphite
 ↓
Pearl White Highlight
```

Scan:

``` text
Deep Blue
 ↓
Electric Blue
 ↓
Cyan
 ↓
Transparent
```

از Neon اشباع و Glow شدید خودداری شود.

------------------------------------------------------------------------

# 26. Typography

کل سایت فارسی و RTL است.

``` css
direction: rtl;
text-align: right;
```

Hierarchy:

``` text
Eyebrow:       12–14px
Section Title: 48–80px Desktop
Large Metric:  64–120px
Body:          16–20px
Technical:     11–14px
```

Mobile باید Responsive باشد.

اعداد فنی می‌توانند با Numeral Style اختصاصی نمایش داده شوند.

------------------------------------------------------------------------

# 27. Hero Layout

Hero:

``` text
100vw
100vh
```

Frame کل viewport را پر کند (Cover — §14).

UI روی Frame Overlay شود.

Hero نباید شبیه Video Player باشد.

نباید نمایش داده شود:

-   Play Button
-   Timeline
-   Video Controls
-   Video Progress Bar

------------------------------------------------------------------------

# 28. Navigation

Navigation بسیار مینیمال باشد.

سمت راست:

``` text
لوگو
```

سمت چپ:

``` text
منو
```

گزینه‌های پیشنهادی:

``` text
محصولات
خدمات
محاسبات
پروژه‌ها
درباره ما
تماس
```

Navigation در ابتدا ساده و کم‌حجم باشد.

------------------------------------------------------------------------

# 29. Sections بعد از Blueprint

ساختار نهایی پیاده‌شده:

``` text
۰۱ — مشخصات فنی
۰۲ — ابزار محاسبه (ظرفیت + آهن‌آلات)
```

بخش‌های معرفی محصول، خدمات، پروژه‌ها، درباره شرکت و تماس در این دمو حذف
شده‌اند.

همه Sectionها باید Visual Language مشترک داشته باشند.

------------------------------------------------------------------------

# 30. Calculator --- ظرفیت آسانسور

Calculator نباید شبیه Excel باشد.

نمونه:

``` text
محاسبه ظرفیت آسانسور

ارتفاع چاه       [       ]
عرض چاه          [       ]
عمق چاه          [       ]
نوع درب           [       ]

          [ محاسبه ]

────────────────────

ظرفیت پیشنهادی
450 KG

تعداد نفر
6
```

UI:

-   Dark
-   RTL
-   Minimal
-   Thin borders
-   Large inputs
-   Clear result

منطق محاسبات از UI جدا باشد.

------------------------------------------------------------------------

# 31. Calculator --- لیست آهن‌آلات

Section جدا:

``` text
محاسبه لیست آهن‌آلات

پارامترهای ورودی
       ↓
محاسبه
       ↓
جدول خروجی
```

Table باید Dark Luxury باشد و شبیه Excel نباشد.

------------------------------------------------------------------------

# 32. Motion Design

Animationها:

-   Slow
-   Smooth
-   Intentional
-   Minimal

ممنوع:

-   Bounce
-   Excessive Parallax
-   Fast Zoom
-   Random Particles
-   Glitch شدید
-   Neon overload
-   UI Motion شلوغ

------------------------------------------------------------------------

# 33. Scroll Behavior

Scroll باید حس یک Presentation سینمایی داشته باشد.

هر Scroll باید تغییر بصری معنادار ایجاد کند.

اما Scroll Hijacking نباید آزاردهنده باشد.

Wheel، Trackpad و Touch باید با سرعت‌های مختلف به‌صورت نرم مدیریت شوند.

------------------------------------------------------------------------

# 34. Mobile

**دمو فعلی فقط برای موبایل است.** دسکتاپ فعلاً کنار گذاشته شده و هر سه ویدیو
به‌صورت مستر عمودی ۹:۱۶ با رزولوشن ۴K رندر شده‌اند:

``` text
loading.mp4    9:16
hero.mp4       9:16
print.mp4      9:16
```

در Mobile:

-   UI اطلاعات ساده‌تر شود
-   Typography کاهش یابد
-   Spacing کاهش یابد
-   فریم کل صفحه را پر کند (Cover)
-   اطلاعات مهم خوانا باشند
-   Scroll Interaction حفظ شود
-   کال‌اوت‌ها یکی‌یکی دیده شوند تا در عرض باریک جا شوند

Asset جداگانهٔ دسکتاپ وجود ندارد و در صورت نیاز بعداً اضافه می‌شود.

------------------------------------------------------------------------

# 35. Performance

Frame Sequence می‌تواند سنگین باشد.

Implementation باید در نظر بگیرد:

-   Lazy Loading
-   Limited Preload
-   Frame Caching
-   `requestAnimationFrame`
-   `IntersectionObserver`
-   WebP
-   Responsive Asset Loading

کل Sequence نباید الزاماً از ابتدا وارد RAM شود.

چند Frame قبل و بعد از Frame فعلی Preload شوند.

### بهینه‌سازی خروجی فریم‌ها (اندازه‌گیری‌شده)

منبع ۴K است، اما canvas موبایل با DPR حداکثر ۲ رندر می‌شود؛ روی نمایشگر
۳۹۰px فقط ۷۸۰px عرض لازم است. بنابراین خروجی ۴K تلف است:

``` text
1440×2560   WebP q95   compression_level 6   ≈ 41 KB / frame
کل ۶۹۰ فریم ≈ ۲۷ MB
```

-   رزولوشن ۱۴۴۰px تقریباً دو برابر رزولوشن واقعی canvas موبایل است؛
    کیفیست بازسازی تمیز و بدون افت بصری دارد
-   از خروجی ۴K (≈۲۵۷ MB) خودداری شود؛ هم حجم پروژه را غیرقابل‌مدیریت
    می‌کند و هم در موبایل lag ایجاد می‌کند
-   q95 برای محتوای سینمایی عملاً بدون افت بصری است

------------------------------------------------------------------------

# 36. Mobile Performance

در موبایل:

``` text
Unload old frames
      ↓
Keep nearby frames
      ↓
Preload upcoming frames
```

از نگهداری کل Sequence در Memory خودداری شود.

------------------------------------------------------------------------

# 37. Accessibility

حتی با وجود Cinematic بودن سایت:

-   Text واقعی HTML باشد.
-   اطلاعات مهم داخل Video نوشته نشوند.
    **استثنا:** ابعاد نقشهٔ فنی روی خود print.mp4 سوزان شده است؛ این مقادیر
    در بخش «۰۱ مشخصات فنی» به‌صورت متن واقعی HTML تکرار شده‌اند.
-   Alt مناسب استفاده شود.
-   Contrast کافی باشد.
-   `prefers-reduced-motion` رعایت شود.

در Reduced Motion:

``` text
Scroll Animation
→ reduced

Autoplay
→ disabled or extremely subtle
```

------------------------------------------------------------------------

# 38. Component Architecture

ساختار پیشنهادی:

``` text
App
│
├── PreLoader            صفحهٔ سیاه + سه نقطه + پیش‌بارگیری Asset
├── CinematicLoader      لودر اصلی + نمایان‌شدن نام برند
├── Navigation
├── HeroSection
│   ├── FrameRenderer
│   ├── HeroMetrics
│   └── HeroSegmentController
│
├── BlueprintSection
│   └── PrintFrameRenderer      (بدون لایهٔ ابعاد)
│
├── ProductSpecs
├── CapacityCalculator
└── SteelCalculator
```

------------------------------------------------------------------------

# 39. Generic Frame Controller

یک Controller مرکزی برای همه Frame Sequenceها ساخته شود:

``` text
FrameController

loadSequence()
preload()
renderFrame()
setProgress()
setSegment()
startAutoplay()
stopAutoplay()
```

Controller نباید به یک Video خاص وابسته باشد.

------------------------------------------------------------------------

# 40. Segment Configuration

Segmentها Configuration-based باشند:

مقادیر واقعی اندازه‌گیری‌شده:

``` js
const heroSegments = {
  solid:  { start: 0,   end: 120, loopFrom: 14,  loopTo: 104 },
  scan:   { start: 121, end: 228, loopFrom: 160, loopTo: 200 },
  finale: { start: 229, end: 239, loopFrom: 229, loopTo: 236 }
};

const loadingFrames = { count: 150, fps: 25, whiteFrom: 115 };
const printFrames   = { count: 300 };
```

`loopFrom/loopTo` بازه‌ای است که در توقف Scroll به‌صورت پینگ‌پونگ پخش
می‌شود؛ باید در ناحیهٔ پایدار Segment انتخاب شود تا لوپ بی‌درز باشد.

------------------------------------------------------------------------

# 41. Video Timeline و Scroll Timeline جدا هستند

این دو Timeline نباید یکی فرض شوند.

مثال:

``` text
Scroll Position 40%
        ↓
Hero Frame 175

User stops
        ↓
175 → 180 → 185 → 180 → 175
```

با Scroll بعدی:

``` text
Scroll Position 42%
        ↓
Frame 190
```

Autoplay فوراً متوقف شود.

------------------------------------------------------------------------

# 42. Data-Driven Product Specs

اطلاعات UI در یک Object مرکزی باشند:

``` js
const elevatorSpecs = {
  capacityKg: 450,
  persons: 6,
  cabinDepth: 112,
  cabinWidth: 109,
  doorWidth: 80,
  doorCount: 2,
  doorType: "تلسکوپی",
  area: 1.2868,
  counterweightFrame: 104,
  minimumDoorWidth: 142
};
```

این ساختار اجازه می‌دهد در آینده اطلاعات مدل‌های مختلف آسانسور بدون تغییر
Layout تعویض شوند.

------------------------------------------------------------------------

# 43. Blueprint Dimensions Data

این بخش حذف شده است. ابعاد روی خود print.mp4 سوزان شده‌اند و دیگر
Data-Driven نیستند؛ تنها دادهٔ باقی‌ماندهٔ این بخش، تعداد فریم است:

``` js
const printFrames = { dir: "assets/frames/print", count: 300 };
```

مقادیر ابعاد برای نمایش متنی در بخش «۰۱ مشخصات فنی» از `elevatorSpecs`
(§42) خوانده می‌شوند.

------------------------------------------------------------------------

# 44. Visual Hierarchy

در هر لحظه فقط یک چیز باید Hero باشد:

``` text
1. Elevator
2. Motion / Scan
3. Main Metric
4. Secondary Information
5. Navigation
```

UI نباید با Elevator رقابت کند.

------------------------------------------------------------------------

# 45. Overall Visual Rule

اگر بین «اطلاعات بیشتر» و «ظاهر تمیزتر» انتخاب وجود داشت، ظاهر تمیزتر
اولویت دارد.

سایت باید حس:

``` text
Luxury Product Presentation
+
Architectural Visualization
+
Engineering Portfolio
```

داشته باشد.

نه:

``` text
Corporate Website
+
Dashboard
+
Excel
```

------------------------------------------------------------------------

# 46. Final Experience

تجربه مطلوب کاربر:

``` text
صفحه سیاه + سه نقطهٔ متحرک (پیش‌لودر)
      ↓
Loading Cinematic
      ↓
نور سفید
      ↓
کاماک / Camac   (آخرین ۳ ثانیه، وسط صفحه)
      ↓
آسانسور واقعی و لوکس
      ↓
مکث کاربر
      ↓
حرکت ظریف و زنده
      ↓
Scroll
      ↓
Dimensional Light Scan
      ↓
450 KG / 6 نفر
      ↓
Scroll
      ↓
112 × 109 کابین
      ↓
Scroll
      ↓
80 عرض درب
      ↓
Scroll
      ↓
Blueprint
      ↓
ابعاد سوزان‌شده روی نقشه
      ↓
۰۱ — مشخصات فنی
      ↓
۰۲ — ابزار محاسبه
```

------------------------------------------------------------------------

# 47. اصل نهایی

این پروژه نباید صرفاً یک سایت با چند Video باشد.

هدف ساخت یک **Cinematic Interactive Product Experience** است.

سه Asset اصلی:

``` text
loading.mp4
hero.mp4
print.mp4
```

روایت اصلی:

``` text
INTRO
↓
PRODUCT
↓
ENGINEERING
```

تمام UI، Typography، Scroll، Motion و Information Architecture باید این
روایت را تقویت کنند.

> **Minimalism is not empty space.\
> Minimalism is controlled information.**
