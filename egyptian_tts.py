#!/usr/bin/env python3
"""
Egyptian Arabic Text-to-Speech — HF Space (voice cloning) with edge-tts fallback.

Primary: connects to MohamedRashad/Egyptian-Arabic-TTS on Hugging Face Spaces
          using gradio_client — supports voice cloning from a short speaker WAV.
Fallback: if the Space is unavailable, uses Microsoft Edge online neural voices
          (ar-EG-SalmaNeural / ar-EG-ShakirNeural) via edge-tts.

No local TTS model — everything runs through free hosted APIs.

Usage:
  python egyptian_tts.py "النص بالعربي"
  python egyptian_tts.py --file input.txt
  python egyptian_tts.py "النص" --speaker /path/to/sample.wav --temperature 0.8
  python egyptian_tts.py "النص" --fallback              # force edge-tts
  python egyptian_tts.py --file input.txt --voice male   # fallback with male voice
  python egyptian_tts.py --list-voices                   # list edge-tts Arabic voices
"""

import argparse
import asyncio
import importlib
import os
import shutil
import subprocess
import sys
from pathlib import Path

# ── Primary: Hugging Face Space (voice cloning) ──

SPACE_ID = "MohamedRashad/Egyptian-Arabic-TTS"
MODEL_REPO = "OmarSamir/EGTTS-V0.1"
DEFAULT_SPEAKER_FILENAME = "speaker_reference.wav"
HF_ENDPOINT = "/infer_EGTTS"

try:
    from gradio_client import Client, handle_file
    HAS_GRADIO = True
except ImportError:
    HAS_GRADIO = False

try:
    from huggingface_hub import hf_hub_download
    HAS_HF_HUB = True
except ImportError:
    HAS_HF_HUB = False

# ── Fallback: edge-tts (Microsoft neural voices) ──

try:
    import edge_tts
    HAS_EDGE = True
except ImportError:
    HAS_EDGE = False

EDGE_VOICES = {
    "female": "ar-EG-SalmaNeural",
    "male": "ar-EG-ShakirNeural",
}


# ═══════════════════════════════════════════════════════════════
#  Speaker file resolution (HF Space mode)
# ═══════════════════════════════════════════════════════════════

def resolve_speaker(speaker_path: str | None) -> str:
    """Return a path to a speaker reference WAV file.

    If *speaker_path* is given, use it as-is.
    Otherwise download the default speaker file from Hugging Face.
    """
    if speaker_path:
        if not os.path.isfile(speaker_path):
            sys.exit(f"❌ Speaker file not found: {speaker_path}")
        return speaker_path

    if not HAS_HF_HUB:
        sys.exit("❌ huggingface_hub not installed. Install with: pip install huggingface_hub")

    print(f"⬇️  Downloading default speaker from {MODEL_REPO} ...")
    try:
        path = hf_hub_download(
            repo_id=MODEL_REPO,
            filename=DEFAULT_SPEAKER_FILENAME,
        )
        print(f"   → {path}")
        return path
    except Exception as exc:
        sys.exit(f"❌ Failed to download speaker reference: {exc}")


# ═══════════════════════════════════════════════════════════════
#  Mode 1: HF Space inference (voice cloning)
# ═══════════════════════════════════════════════════════════════

def synthesize_hf(text: str, speaker_path: str, temperature: float = 0.75) -> str:
    """Send *text* to the TTS Space and return the path to the synthesised audio.

    NOTE: The Space (MohamedRashad/Egyptian-Arabic-TTS) requires a GPU backend for
    its XTTS model. If the Space is running on CPU it may fail with a server-side error.
    Use --fallback to bypass.
    """
    if not HAS_GRADIO:
        sys.exit("❌ gradio_client not installed. Install with: pip install gradio_client")

    print(f"🔌 Connecting to {SPACE_ID} ...")
    client = Client(SPACE_ID)

    print(f"🗣️  Text: {text[:80]}{'…' if len(text) > 80 else ''}")
    print(f"🎚️  Temperature: {temperature}")

    result = client.predict(
        text=text,
        speaker_audio_path=handle_file(speaker_path),
        temperature=temperature,
        api_name=HF_ENDPOINT,
    )

    audio_path = result if isinstance(result, str) else getattr(result, "path", str(result))
    print(f"✅ Synthesised audio → {audio_path}")
    return audio_path


# ═══════════════════════════════════════════════════════════════
#  Mode 2: edge-tts (Microsoft neural voices, no setup needed)
# ═══════════════════════════════════════════════════════════════

async def synthesize_edge(
    text: str,
    voice: str,
    output_path: str,
    rate: str = "+0%",
    pitch: str = "+0Hz",
    volume: str = "+0%",
    subtitles: bool = False,
) -> str:
    """Synthesise using edge-tts and save to *output_path*."""
    communicate = edge_tts.Communicate(text, voice, rate=rate, pitch=pitch, volume=volume)

    if subtitles:
        from edge_tts import SubMaker
        submaker = SubMaker()
        with open(output_path, "wb") as af:
            async for chunk in communicate.stream():
                if chunk["type"] == "audio":
                    af.write(chunk["data"])
                elif chunk["type"] == "WordBoundary":
                    submaker.feed(chunk)
        srt_path = Path(output_path).with_suffix(".srt")
        srt_path.write_text(submaker.get_srt(), encoding="utf-8")
        print(f"📜 Subtitles saved to: {srt_path}")
    else:
        await communicate.save(output_path)

    return output_path


# ═══════════════════════════════════════════════════════════════
#  Install helper (avoids global conflict with module-level HAS_EDGE)
# ═══════════════════════════════════════════════════════════════

def _ensure_edge_tts() -> None:
    """Import edge_tts, installing it first if necessary."""
    if HAS_EDGE:
        return
    print("ℹ️  edge-tts not installed. Installing...", file=sys.stderr)
    subprocess.check_call([sys.executable, "-m", "pip", "install", "edge-tts"])
    importlib.invalidate_caches()
    # Replace module-level references
    import edge_tts as _et
    globals()["edge_tts"] = _et
    globals()["HAS_EDGE"] = True


# ═══════════════════════════════════════════════════════════════
#  CLI
# ═══════════════════════════════════════════════════════════════

def main() -> None:
    parser = argparse.ArgumentParser(
        description="Egyptian Arabic Text-to-Speech (free hosted APIs, no local model)",
    )
    source = parser.add_mutually_exclusive_group()
    source.add_argument("text", nargs="?", help="Arabic text to speak")
    source.add_argument("--file", "-f", help="Read Arabic text from a file")

    parser.add_argument("--fallback", action="store_true",
                        help="Skip HF Space and use edge-tts directly")
    parser.add_argument("--voice", "-v", choices=list(EDGE_VOICES.keys()), default="female",
                        help="Edge voice: female (Salma) or male (Shakir). Default: female")
    parser.add_argument("--speaker", "-s", help="Path to speaker reference WAV (HF Space mode)")
    parser.add_argument("--temperature", "-t", type=float, default=0.75,
                        help="Sampling temperature 0.0–1.0 (HF Space mode, default 0.75)")
    parser.add_argument("--output", "-o", default="output.mp3",
                        help="Output audio file path (default: output.mp3)")
    parser.add_argument("--rate", default="+0%",
                        help="Speaking rate adjustment, e.g. +10%% (edge mode)")
    parser.add_argument("--pitch", default="+0Hz",
                        help="Pitch adjustment, e.g. +5Hz (edge mode)")
    parser.add_argument("--volume", default="+0%",
                        help="Volume adjustment, e.g. +20%% (edge mode)")
    parser.add_argument("--subtitles", action="store_true",
                        help="Generate .srt subtitles alongside audio (edge mode)")
    parser.add_argument("--list-voices", action="store_true",
                        help="List all Arabic edge-tts voices and exit")

    args = parser.parse_args()

    # ── --list-voices ──
    if args.list_voices:
        _ensure_edge_tts()
        asyncio.run(_list_arabic_voices())
        return

    # ── Read input text ──
    if args.file:
        try:
            text = Path(args.file).read_text(encoding="utf-8").strip()
        except OSError as exc:
            sys.exit(f"❌ Cannot read {args.file}: {exc}")
        if not text:
            sys.exit(f"❌ File {args.file} is empty.")
    elif args.text:
        text = args.text.strip()
    else:
        parser.print_help()
        sys.exit("\n❌ Provide text or use --file.")

    if not text:
        sys.exit("❌ No text provided.")

    # ── Decide mode ──
    use_fallback = args.fallback or not (HAS_GRADIO and HAS_HF_HUB)
    output_path = args.output

    if use_fallback:
        # ── edge-tts mode ──
        _ensure_edge_tts()

        voice_id = EDGE_VOICES[args.voice]
        print(f"🎤 Edge TTS · {voice_id}")
        print(f"🗣️  Text: {text[:80]}{'…' if len(text) > 80 else ''}")
        print(f"📁 Output: {output_path}")

        asyncio.run(synthesize_edge(
            text=text,
            voice=voice_id,
            output_path=output_path,
            rate=args.rate,
            pitch=args.pitch,
            volume=args.volume,
            subtitles=args.subtitles,
        ))
        print(f"✅ Done → {output_path}")

    else:
        # ── HF Space mode ──
        speaker_path = resolve_speaker(args.speaker)
        try:
            result_path = synthesize_hf(text, speaker_path, args.temperature)
        except Exception as exc:
            print(f"⚠️  HF Space failed: {exc}", file=sys.stderr)
            print("💡 The Space may be on CPU (needs GPU). Retrying with edge-tts fallback...")
            _ensure_edge_tts()

            voice_id = EDGE_VOICES[args.voice]
            asyncio.run(synthesize_edge(
                text=text,
                voice=voice_id,
                output_path=output_path,
                rate=args.rate,
                pitch=args.pitch,
                volume=args.volume,
                subtitles=args.subtitles,
            ))
            print(f"✅ Fallback done → {output_path}")
            return

        # Copy to desired output path
        if os.path.abspath(result_path) != os.path.abspath(output_path):
            shutil.copy2(result_path, output_path)
            print(f"📁 Copied to {output_path}")

        print("🎉 Done.")


async def _list_arabic_voices():
    voices = await edge_tts.list_voices()
    arabic = [v for v in voices if v["Locale"].startswith("ar-")]
    print(f"{'ShortName':<30}{'Gender':<10}{'Locale'}")
    print("-" * 55)
    for v in sorted(arabic, key=lambda x: x["Locale"]):
        print(f"{v['ShortName']:<30}{v['Gender']:<10}{v['Locale']}")


if __name__ == "__main__":
    main()
