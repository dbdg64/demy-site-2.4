#!/usr/bin/env bash
# Generate Egyptian Arabic voiceover for Demy explainer video
# Voice: ar-EG-ShakirNeural (male)
#
# Usage:
#   chmod +x generate-voiceover.sh
#   bash generate-voiceover.sh
#
# Output: assets/audio/slide{1..6}.mp3 + assets/audio/explainer-audio.mp3

set -e
EDGE_TTS="/home/ahmed/.local/share/pipx/venvs/pip/bin/python3 -m edge_tts"
VOICE="ar-EG-ShakirNeural"
OUTDIR="assets/audio"
mkdir -p "$OUTDIR"

echo "🎤 Generating voiceover with $VOICE ..."

# Slide 1 — Brand Intro (15s)
echo "  Slide 1/6 ..."
$EDGE_TTS --voice "$VOICE" \
  --text "ديمى — مواتير مياه بمواصفات تصنيع أوروبية. بنشتغل في السوق المصري من أكتر من ٣٠ سنة، وبنقدملك ماتور بيتم تصنيعه بخامات عالية الجودة — مش مجرد ماتور عادي." \
  --write-media "$OUTDIR/slide1.mp3"

# Slide 2 — Copper Coils (15s)
echo "  Slide 2/6 ..."
$EDGE_TTS --voice "$VOICE" \
  --text "الفرق بين ماتور ديمى وأي ماتور تاني؟ ملفات نحاس خالص ١٠٠٪، مش ألمنيوم. ليه ده مهم؟ لأن النحاس بيوصل الكهرباء أحسن، مش بيسخن بسرعة، وبيضمنلك إن الماتور يفضل شغال سنين من غير مشاكل." \
  --write-media "$OUTDIR/slide2.mp3"

# Slide 3 — Build Quality (15s)
echo "  Slide 3/6 ..."
$EDGE_TTS --voice "$VOICE" \
  --text "عمود الماتور استانلس ستيل — مش حديد عادي. الريشة — الإمبلر — نحاس. وكل ماتور فيه حماية حرارية ذكية: لو الماتور سخن، بيفصل أتوماتيك عشان يحمي نفسه. ويرجع يشتغل تاني لما يبرد." \
  --write-media "$OUTDIR/slide3.mp3"

# Slide 4 — Product Range (20s)
echo "  Slide 4/6 ..."
$EDGE_TTS --voice "$VOICE" \
  --text "ديمى متوفرة بكل المقاسات اللي ممكن تحتاجها. نصف حصان — للشقق والدور الأرضي. واحد حصان — لدورين. واحد ونص — لثلاثة أدوار. اتنين حصان فأكثر — للعمارات الكبيرة والسطح. وكل ماتور بيطلع بقدرته الحقيقية — مش بيفرج مع الاستخدام." \
  --write-media "$OUTDIR/slide4.mp3"

# Slide 5 — Warranty & Trust (15s)
echo "  Slide 5/6 ..."
$EDGE_TTS --voice "$VOICE" \
  --text "كل ماتور من ديمى بيخرج بضمان سنتين ضد عيوب التصنيع. وبنكون معاك بعد البيع — لو احتجت أي استفسار أو مساعدة، فريق ديمى موجود. ده مش كلام — ده التزام." \
  --write-media "$OUTDIR/slide5.mp3"

# Slide 6 — CTA (10s)
echo "  Slide 6/6 ..."
$EDGE_TTS --voice "$VOICE" \
  --text "ديمى — الأزبكية، القاهرة. كلمنا على واتساب: ٠١٠١٦٨٩٢٩٥٦. أو زورنا في المحل. من ١٠ الصبح لـ ١٠ بالليل — كل يوم. ديمى — ماتورك الأمين." \
  --write-media "$OUTDIR/slide6.mp3"

echo ""
echo "✅ All chunks generated in $OUTDIR/"
echo ""
echo "Now merging with 0.5s gaps ..."

# Generate 0.5s silent gap
ffmpeg -y -f lavfi -i anullsrc=r=24000:cl=mono -t 0.5 -q:a 9 "$OUTDIR/gap.mp3" 2>/dev/null

# Build concat file
rm -f "$OUTDIR/concat.txt"
for i in 1 2 3 4 5 6; do
  echo "file $OUTDIR/slide$i.mp3" >> "$OUTDIR/concat.txt"
  echo "file $OUTDIR/gap.mp3" >> "$OUTDIR/concat.txt"
done

# Merge
ffmpeg -y -f concat -safe 0 -i "$OUTDIR/concat.txt" -c copy "$OUTDIR/explainer-audio.mp3" 2>/dev/null

# Cleanup
rm -f "$OUTDIR/gap.mp3" "$OUTDIR/concat.txt"

echo "✅ explainer-audio.mp3 ready in $OUTDIR/"
echo "   Duration: $(ffprobe -v error -show_entries format=duration -of csv=p=0 $OUTDIR/explainer-audio.mp3 2>/dev/null | xargs printf '%.0f') seconds"
