#!/usr/bin/env python3
"""
egyptian_tts.py
----------------
Text-to-speech script that speaks in the Egyptian Arabic dialect (ar-EG)
using Microsoft Edge's online neural voices via the `edge-tts` library.

Install requirements first:
    pip install edge-tts

Usage examples:
    # Speak text directly and save to an mp3 (default voice: Salma - female)
    python egyptian_tts.py "إزيك يا صاحبي، عامل إيه النهاردة؟"

    # Choose the male voice
    python egyptian_tts.py "إزيك يا صاحبي؟" --voice male

    # Read text from a file instead of the command line
    python egyptian_tts.py --file mytext.txt

    # Control speaking rate, pitch and volume
    python egyptian_tts.py "أهلاً بيك" --rate +10% --pitch +5Hz --volume +0%

    # Change the output file name
    python egyptian_tts.py "مساء الخير" --output greeting.mp3

    # Play the audio automatically after generating it (uses the OS default player)
    python egyptian_tts.py "أهلاً" --play

Available Egyptian Arabic voices (built into Edge TTS):
    female -> ar-EG-SalmaNeural
    male   -> ar-EG-ShakirNeural
"""

import argparse
import asyncio
import os
import platform
import subprocess
import sys

try:
    import edge_tts
except ImportError:
    sys.exit(
        "The 'edge-tts' package is not installed.\n"
        "Install it with:\n\n    pip install edge-tts\n"
    )

# Egyptian Arabic voice options exposed by edge-tts
VOICES = {
    "female": "ar-EG-SalmaNeural",
    "male": "ar-EG-ShakirNeural",
}


def parse_args():
    parser = argparse.ArgumentParser(
        description="Convert text to speech in Egyptian Arabic using edge-tts."
    )
    parser.add_argument(
        "text",
        nargs="?",
        help="Text to speak (in Arabic, ideally Egyptian dialect). "
        "Omit this if using --file.",
    )
    parser.add_argument(
        "--file",
        "-f",
        help="Path to a text file to read the content from instead of passing text directly.",
    )
    parser.add_argument(
        "--voice",
        "-v",
        choices=list(VOICES.keys()),
        default="female",
        help="Which Egyptian voice to use: 'female' (Salma) or 'male' (Shakir). Default: female.",
    )
    parser.add_argument(
        "--output",
        "-o",
        default="output.mp3",
        help="Output audio file name (mp3). Default: output.mp3",
    )
    parser.add_argument(
        "--rate",
        default="+0%",
        help="Speaking rate adjustment, e.g. +10%%, -15%%. Default: +0%%",
    )
    parser.add_argument(
        "--pitch",
        default="+0Hz",
        help="Pitch adjustment, e.g. +5Hz, -10Hz. Default: +0Hz",
    )
    parser.add_argument(
        "--volume",
        default="+0%",
        help="Volume adjustment, e.g. +20%%, -10%%. Default: +0%%",
    )
    parser.add_argument(
        "--subtitles",
        "-s",
        action="store_true",
        help="Also generate a .srt subtitle file alongside the audio.",
    )
    parser.add_argument(
        "--play",
        "-p",
        action="store_true",
        help="Automatically play the generated audio after it's created.",
    )
    parser.add_argument(
        "--list-voices",
        action="store_true",
        help="List all Arabic voices available via edge-tts and exit.",
    )
    return parser.parse_args()


async def list_arabic_voices():
    voices = await edge_tts.list_voices()
    arabic_voices = [v for v in voices if v["Locale"].startswith("ar-")]
    print(f"{'ShortName':<25}{'Gender':<10}{'Locale'}")
    print("-" * 50)
    for v in sorted(arabic_voices, key=lambda x: x["Locale"]):
        print(f"{v['ShortName']:<25}{v['Gender']:<10}{v['Locale']}")


async def synthesize(text, voice, output_path, rate, pitch, volume, subtitles):
    communicate = edge_tts.Communicate(
        text, voice, rate=rate, pitch=pitch, volume=volume
    )

    if subtitles:
        submaker = edge_tts.SubMaker()
        with open(output_path, "wb") as audio_file:
            async for chunk in communicate.stream():
                if chunk["type"] == "audio":
                    audio_file.write(chunk["data"])
                elif chunk["type"] == "WordBoundary":
                    submaker.feed(chunk)
        srt_path = os.path.splitext(output_path)[0] + ".srt"
        with open(srt_path, "w", encoding="utf-8") as srt_file:
            srt_file.write(submaker.get_srt())
        print(f"Subtitles saved to: {srt_path}")
    else:
        await communicate.save(output_path)


def play_audio(path):
    system = platform.system()
    try:
        if system == "Darwin":
            subprocess.run(["afplay", path], check=True)
        elif system == "Windows":
            os.startfile(path)  # noqa: S606
        else:  # Linux and others
            # Try a few common players
            for player in ("xdg-open", "mpg123", "ffplay", "aplay"):
                try:
                    subprocess.run([player, path], check=True)
                    return
                except (FileNotFoundError, subprocess.CalledProcessError):
                    continue
            print(
                "Could not find a player to auto-play the audio. "
                f"The file is saved at: {path}"
            )
    except Exception as e:
        print(f"Could not auto-play audio ({e}). File saved at: {path}")


def main():
    args = parse_args()

    if args.list_voices:
        asyncio.run(list_arabic_voices())
        return

    # Resolve the text to speak
    if args.file:
        if not os.path.isfile(args.file):
            sys.exit(f"File not found: {args.file}")
        with open(args.file, "r", encoding="utf-8") as f:
            text = f.read().strip()
    elif args.text:
        text = args.text
    else:
        sys.exit(
            "Please provide text as an argument or use --file. "
            "Run with --list-voices to see available voices."
        )

    if not text:
        sys.exit("No text to speak was found.")

    voice = VOICES[args.voice]

    print(f"Voice   : {voice}")
    print(f"Text    : {text}")
    print(f"Output  : {args.output}")

    asyncio.run(
        synthesize(
            text=text,
            voice=voice,
            output_path=args.output,
            rate=args.rate,
            pitch=args.pitch,
            volume=args.volume,
            subtitles=args.subtitles,
        )
    )

    print(f"Done. Audio saved to: {args.output}")

    if args.play:
        play_audio(args.output)


if __name__ == "__main__":
    main()
