"""Compress all scene videos using FFmpeg with CRF 23 (visually lossless)"""
import os
import subprocess
import sys
import io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

try:
    import imageio_ffmpeg
    FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()
except ImportError:
    print("[ERROR] imageio-ffmpeg not installed. Run: pip install imageio-ffmpeg")
    sys.exit(1)

VIDEOS_DIR = os.path.join(os.path.dirname(__file__), '..', 'public', 'videos')
CRF = 23  # visually lossless

videos = [f for f in os.listdir(VIDEOS_DIR) if f.endswith('.mp4')]
total = len(videos)
done = 0

for filename in sorted(videos):
    filepath = os.path.join(VIDEOS_DIR, filename)
    orig_size = os.path.getsize(filepath) / 1048576

    # Skip if already small enough (< 15MB)
    if orig_size < 15:
        print(f"[{done+1}/{total}] SKIP {filename} ({orig_size:.1f}MB)")
        done += 1
        continue

    tmp_path = filepath + '.tmp'
    print(f"[{done+1}/{total}] Compressing {filename} ({orig_size:.1f}MB)...")

    result = subprocess.run([
        FFMPEG, '-y', '-i', filepath,
        '-c:v', 'libx264', '-crf', str(CRF), '-preset', 'fast',
        '-c:a', 'aac', '-b:a', '128k',
        '-movflags', '+faststart',
        tmp_path
    ], capture_output=True, text=True, timeout=300)

    if result.returncode == 0 and os.path.exists(tmp_path):
        new_size = os.path.getsize(tmp_path) / 1048576
        reduction = (1 - new_size / orig_size) * 100
        os.replace(tmp_path, filepath)
        print(f"  OK {orig_size:.1f}MB -> {new_size:.1f}MB (-{reduction:.0f}%)")
    else:
        print(f"  FAILED: {result.stderr[:200]}")
        if os.path.exists(tmp_path):
            os.remove(tmp_path)

    done += 1

# Summary
print("\n" + "=" * 40)
total_orig = sum(os.path.getsize(os.path.join(VIDEOS_DIR, f)) for f in videos) / 1048576
print(f"Total: {total_orig:.0f}MB")
print("=" * 40)
