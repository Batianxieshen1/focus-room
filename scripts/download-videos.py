"""Download scene videos from Pexels API using curl"""
import json
import os
import subprocess
import sys
import io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

VIDEOS_DIR = os.path.join(os.path.dirname(__file__), '..', 'public', 'videos')
os.makedirs(VIDEOS_DIR, exist_ok=True)

API_KEY = 'UA6qHNNOepNMSjxYLHXHNshbfk6vWxJ9qLnQ0tG3gvxLEzC3hsKYPoSJ'

SCENES = [
    ('mountain-lake', 'mountain lake serene alpine'),
    ('seaside', 'ocean waves coast sea'),
    ('forest', 'forest morning sunlight fog'),
    ('library', 'library bookshelf warm light'),
    ('rainy-cafe', 'rain drops glass window'),
    ('snowy-window', 'snow mountain winter'),
]

def curl_json(url):
    r = subprocess.run(
        ['curl', '-s', url, '-H', f'Authorization: {API_KEY}'],
        capture_output=True, text=True, timeout=30
    )
    return json.loads(r.stdout)

def download(url, filepath):
    subprocess.run(['curl', '-sL', '-o', filepath, url], timeout=300)
    return os.path.exists(filepath) and os.path.getsize(filepath) > 50000

total = len(SCENES)
done = 0

for scene_id, query in SCENES:
    filepath = os.path.join(VIDEOS_DIR, f"{scene_id}.mp4")
    if os.path.exists(filepath) and os.path.getsize(filepath) > 100000:
        mb = os.path.getsize(filepath) / 1048576
        print(f"[{done+1}/{total}] SKIP {scene_id} ({mb:.1f}MB)")
        done += 1
        continue

    print(f"[{done+1}/{total}] Searching: {scene_id}")
    try:
        data = curl_json(f"https://api.pexels.com/videos/search?query={query.replace(' ', '+')}&per_page=5&size=medium")
        videos = data.get('videos', [])
    except Exception as e:
        print(f"  Error: {e}")
        done += 1
        continue

    if not videos:
        print("  No results")
        done += 1
        continue

    # Pick best HD file from best video
    best_url = None
    for v in videos:
        for f in v.get('video_files', []):
            if f.get('height') == 1080 and f.get('file_type') == 'video/mp4':
                best_url = f['link']
                break
        if best_url:
            break

    # Fallback: any mp4
    if not best_url:
        for v in videos:
            for f in v.get('video_files', []):
                if f.get('file_type') == 'video/mp4':
                    best_url = f['link']
                    break
            if best_url:
                break

    if best_url:
        print(f"  Downloading...")
        if download(best_url, filepath):
            mb = os.path.getsize(filepath) / 1048576
            print(f"  OK {mb:.1f}MB")
        else:
            print(f"  FAILED")
    else:
        print("  No mp4 found")

    done += 1

print(f"\nComplete: {done}/{total}")
