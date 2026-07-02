# ديمى — Explainer Video Plan (Demy Water Pump Focus)

## Pipeline: HTML Slides + Voiceover → MP4

```
Script (Egyptian Arabic)
       ↓
HTML Slide Deck  ──→  FFmpeg ──→ MP4 video  ──→ Website
       ↑                        ↑
  CSS transitions         edge-tts (Azure)
  (you know this)         voiceover audio
```

**Cost: ZERO.** No API keys, no watermarks, no credit limits.

**Voice:** `ar-EG-ShakirNeural` (male Egyptian Arabic)

---

## 1. Script — ديمى مواتير المياه (Demy Water Pumps)

### Structure (6 slides, ~90 seconds)

| Slide | Topic | Duration | Visual |
|-------|-------|----------|--------|
| 1 | Brand intro — 30 years, European specs | 15s | Demy logo + hero visual |
| 2 | Copper coils — why 100% copper matters | 15s | Copper vs aluminum comparison |
| 3 | Build quality — stainless shaft, thermal protection | 15s | Cutaway showing internal parts |
| 4 | Product range — sizes for every need | 20s | Grid of products by horsepower |
| 5 | Quality guarantee — 2-year warranty | 15s | Warranty badge + trust icons |
| 6 | Call to action — WhatsApp + location | 10s | Contact card |

### Full Script (Egyptian Arabic — Demy Product Focus)

**Slide 1 — مقدمة عن ديمى (15s)**
> "ديمى — مواتير مياه بمواصفات تصنيع أوروبية. بنشتغل في السوق المصري من أكتر من ٣٠ سنة، وبنقدملك ماتور بيتم تصنيعه بخامات عالية الجودة — مش مجرد ماتور عادي."

**Slide 2 — الملفات النحاس ١٠٠٪ (15s)**
> "الفرق بين ماتور ديمى وأي ماتور تاني؟ ملفات نحاس خالص ١٠٠٪، مش ألمنيوم. ليه ده مهم؟ لأن النحاس بيوصل الكهرباء أحسن، مش بيسخن بسرعة، وبيضمنلك إن الماتور يفضل شغال سنين من غير مشاكل."

**Slide 3 — جودة التصنيع (15s)**
> "عمود الماتور استانلس ستيل — مش حديد عادي. الريشة (الإمبلر) نحاس. وكل ماتور فيه حماية حرارية ذكية: لو الماتور سخن، بيفصل أتوماتيك عشان يحمي نفسه. ويرجع يشتغل تاني لما يبرد."

**Slide 4 — المقاسات المتاحة (20s)**
> "ديمى متوفرة بكل المقاسات اللي ممكن تحتاجها. نصف حصان — للشقق والدور الأرضي. واحد حصان — لدورين. واحد ونص — لثلاثة أدوار. اتنين حصان فأكثر — للعمارات الكبيرة والسطح. وكل ماتور بيطلع بقدرته الحقيقية — مش بيفرج مع الاستخدام."

**Slide 5 — الضمان والثقة (15s)**
> "كل ماتور من ديمى بيخرج بضمان سنتين ضد عيوب التصنيع. وبنكون معاك بعد البيع — لو احتاجت أي استفسار أو مساعدة، فريق ديمى موجود. ده مش كلام — ده التزام."

**Slide 6 — اتصل بينا (10s)**
> "ديمى — الأزبكية، القاهرة. كلمنا على واتساب: ٠١٠١٦٨٩٢٩٥٦. أو زورنا في المحل. من ١٠ الصبح لـ ١٠ بالليل — كل يوم. ديمى — ماتورك الأمين."

---

## 2. Slide Deck Visual Guide

### Design System
- **Background:** Dark gradient (#0b0e14 → #151926)
- **Accent:** Gold/orange (#ffa800, #e09600)
- **Font:** Cairo (Arabic), system for fallback
- **Layout:** RTL, center-aligned content
- **Elements:** Large typography, minimal icons, subtle glow effects

### Slide Layouts

| Slide | Layout |
|-------|--------|
| 1 | Centered logo + headline, subtle water flow animation in background |
| 2 | Split: text left, visual right (copper coil badge) |
| 3 | Split: text left, 3 feature badges stacked right |
| 4 | Product range grid with icons by HP |
| 5 | Centered: warranty seal + trust elements |
| 6 | Contact card with WhatsApp button, location |

### Transitions
- All slides: `fadeIn + translateY(30px → 0)` over 0.8s
- Between slides: cross-fade 0.5s
- Auto-advance timed to narration duration

---

## 3. Voiceover Generation

```bash
# Using edge-tts with Egyptian Arabic male voice
/home/ahmed/.local/share/pipx/venvs/pip/bin/python3 -m edge_tts \
  --voice ar-EG-ShakirNeural \
  --text "نص الكلام" \
  --write-media slide.mp3
```

Script split into 6 MP3 chunks, then merged with 0.5s gaps.

---

## 4. Render Pipeline

```
Slides (HTML) → Export as PNG → FFmpeg → MP4
                                      ↑
                               Audio (concatenated)
```

FFmpeg command:
```bash
ffmpeg -loop 1 -i slide1.png -t 15 -r 15 -c:v libx264 -pix_fmt yuv420p slide1.ts
# ... per slide, then concat + audio
```

---

## 5. Website Integration

### In WordPress (wp-demy-child)
- Video file: `assets/videos/demy-explainer.mp4`
- Add section to homepage `index.php` or create a dedicated page

### In Prototype (Express)
- Video file: `public/video/demy-explainer.mp4`
- Register via POST to `/api/media` — auto-appears on awareness page

---

## Files to Build

| File | Status |
|------|--------|
| `explainer-video-plan.md` | ✅ Updated with Demy script |
| `explainer-slides.html` | 🔜 Next — the actual slide deck |
| `generate-voiceover.sh` | 🔜 Shell script for audio |
| `demy-explainer.mp4` | 🔜 Final output |
