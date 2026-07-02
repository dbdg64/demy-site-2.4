# Explainer Video — Technical Implementation Guide

## Prerequisites (Already Installed)

| Tool | Status |
|------|--------|
| `edge-tts` 7.2.8 | ✅ at `/home/ahmed/.local/share/pipx/venvs/pip/lib/python3.14/site-packages` |
| Python 3.14 | ✅ |
| FFmpeg | ✅ (check with `ffmpeg -version`) |

---

## 1. Voiceover Generation

### Script Chunks

Save this as `scripts/generate-voiceover.sh` in the waterpumper project.

```bash
#!/usr/bin/env bash
# Generate Egyptian Arabic voiceover chunks using edge-tts
# Usage: bash scripts/generate-voiceover.sh

EDGE_TTS="/home/ahmed/.local/share/pipx/venvs/pip/bin/python3 -m edge_tts"
VOICE="ar-EG-SalmaNeural"  # or ar-EG-ShakirNeural for male
OUTDIR="assets/audio"
mkdir -p "$OUTDIR"

# Slide 1 — Opening (15s)
$EDGE_TTS --voice "$VOICE" \
  --text "أهلاً بيك في ديمى. احنا في سوق مواتير المياه من أكتر من ٣٠ سنة. وبنقدملك مواتير بمواصفات تصنيع أوروبية — ملفات نحاس خالص، وعمود استانلس، وحماية حرارية — بضمان سنتين." \
  --write-media "$OUTDIR/slide1.mp3"

# Slide 2 — Problem (15s)
$EDGE_TTS --voice "$VOICE" \
  --text "المشكلة أكتر واحد بيقع فيها: إنه بيشتري ماتور صغير على دورين، أو كبير على شقة واحدة. والنتيجة: ماتور بيحرق بسرعة، أو فاتورة كهرباء عالية من غير داعي." \
  --write-media "$OUTDIR/slide2.mp3"

# Slide 3 — How to choose (20s)
$EDGE_TTS --voice "$VOICE" \
  --text "عشان تختار الصح: دور أرضي فقط أو شقة = نصف حصان. دورين = ١ حصان. ثلاثة أدوار = ١.٥ حصان. أدوار كتير أو سطح = ٢ حصان فأكثر. ولو عاوز ماتور يخدم الشقة والسطح مع بعض — يبقى ١.٥ حصان أحسن اختيار." \
  --write-media "$OUTDIR/slide3.mp3"

# Slide 4 — Why Demy (15s)
$EDGE_TTS --voice "$VOICE" \
  --text "كل ماتور من ديمى ملفات نحاس خالص ١٠٠٪ — مش ألمنيوم. عمود استانلس ضد الصدأ. ريشة نحاس. وفيه حماية حرارية تفصل الماتور أتوماتيك لو سخن. وكل ده بضمان سنتين." \
  --write-media "$OUTDIR/slide4.mp3"

# Slide 5 — Flomak (15s)
$EDGE_TTS --voice "$VOICE" \
  --text "نصيحة مهمة: ركب فلوماك مع الماتور. الفلوماك بينظم ضغط المية، وبيحمي الماتور من التشغيل الجاف، وبيوفر في فاتورة الكهرباء. وفروق الضغط هتبقا أحسن بكتير." \
  --write-media "$OUTDIR/slide5.mp3"

# Slide 6 — CTA (10s)
$EDGE_TTS --voice "$VOICE" \
  --text "ديمى — الأزبكية، القاهرة. كلمنا على واتساب: ٠١٠١٦٨٩٢٩٥٦. أو زورنا في المحل. احنا موجودين كل يوم من ١٠ الصبح لـ ١٠ بالليل." \
  --write-media "$OUTDIR/slide6.mp3"

echo "✅ Voiceover chunks generated in $OUTDIR/"
```

### Concatenate + Add Pauses

```bash
# Generate 500ms silent gap
ffmpeg -f lavfi -i anullsrc=r=24000:cl=mono -t 0.5 -q:a 9 gap.mp3

# Build concat file
for f in slide1 slide2 slide3 slide4 slide5 slide6; do
  echo "file $f.mp3" >> concat.txt
  echo "file gap.mp3" >> concat.txt
done

# Merge
ffmpeg -f concat -safe 0 -i concat.txt -c copy explainer-audio.mp3

# Cleanup
rm gap.mp3 concat.txt
```

---

## 2. HTML Slide Deck

See `explainer-slides.html` — self-contained file with:

- 1920×1080 slides (responsive down to mobile)
- Cairo font (RTL)
- Dark background + Demy orange/gold accents
- CSS `@keyframes` transitions (fade-in, slide-up)
- JavaScript auto-advance timer tied to audio duration
- Overlay play/pause controls for manual preview

---

## 3. FFmpeg Render Pipeline

### Method A: Image Sequence (Recommended for Your Celeron)

Export each slide as a PNG (1280×720) manually from Chrome, then:

```bash
ffmpeg -framerate 1/15 -i slide%d.png \
  -i explainer-audio.mp3 \
  -c:v libx264 -preset medium -crf 23 \
  -pix_fmt yuv420p -vf "scale=1280:720" \
  -c:a aac -b:a 128k \
  -shortest \
  demy-explainer.mp4
```

`-framerate 1/15` = 1 frame every 15 seconds — each slide shows for 15s.
For the 20s slide (slide 3), duplicate that frame or use a concat approach.

### Method B: Advanced (Concat Per-Slide)

For precise per-slide timing:

```bash
# Render each slide as a video segment at 15fps
# slide1: 15 seconds
ffmpeg -loop 1 -i slide1.png -c:v libx264 -t 15 -pix_fmt yuv420p -r 15 slide1.ts
# slide2: 15 seconds
ffmpeg -loop 1 -i slide2.png -c:v libx264 -t 15 -pix_fmt yuv420p -r 15 slide2.ts
# slide3: 20 seconds
ffmpeg -loop 1 -i slide3.png -c:v libx264 -t 20 -pix_fmt yuv420p -r 15 slide3.ts
# ... etc

# Concat + add audio
ffmpeg -i "concat:slide1.ts|slide2.ts|slide3.ts|slide4.ts|slide5.ts|slide6.ts" \
  -i explainer-audio.mp3 \
  -c:v libx264 -c:a aac -shortest demy-explainer.mp4
```

---

## 4. Integration Points

### Prototype (Express)
```
prototype/public/video/demy-explainer.mp4
```
Then POST to `/api/media` to register it (see main plan).

### WordPress Child Theme
```
waterpumper/wp-demy-child/assets/videos/demy-explainer.mp4
```
Then add the video section to the appropriate template.

---

## Performance Notes (Celeron N2840)

| Operation | Expected Time | Notes |
|-----------|---------------|-------|
| Voiceover generation | ~30s | Just network latency |
| FFmpeg render (720p) | ~3-5 min | Software x264 encoding |
| FFmpeg render (1080p) | ~10-15 min | Avoid — no hardware encoder |
| Final file size (720p) | ~5-8 MB | Fine for web embedding |

**Recommendation:** Render at 720p. For a 90s explainer video on a website, 720p looks great and keeps the file small for mobile users in Egypt.

---

## File Structure

```
waterpumper-project/
├── explainer-video-plan.md       ← this plan (main)
├── impl-guide.md                 ← this file (technical)
├── explainer-slides.html         ← TODO: slide deck
├── assets/
│   ├── audio/
│   │   ├── slide1.mp3
│   │   ├── slide2.mp3
│   │   ├── ...
│   │   └── explainer-audio.mp3   ← final merged audio
│   └── slides/
│       ├── slide1.png
│       ├── slide2.png
│       └── ...                   ← exported slide images
└── demy-explainer.mp4            ← FINAL VIDEO
```
