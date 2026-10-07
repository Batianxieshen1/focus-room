"""Take mobile screenshots and generate video posters using Playwright"""
import sys
import os
import pathlib
import threading
import http.server
import socketserver
from playwright.sync_api import sync_playwright

script_dir = pathlib.Path(__file__).parent.resolve()
repo_root = script_dir.parent
public_dir = repo_root / 'public'
videos_dir = public_dir / 'videos'
posters_dir = public_dir / 'posters'

# Scene ID to video filename mapping
SCENE_VIDEOS = {
    'landing': 'landing-bg.mp4',
    'mountain-lake': 'mountain-lake.mp4',
    'seaside': 'seaside.mp4',
    'forest': 'forest.mp4',
    'starry-sky': 'starry-sky.mp4',
    'rainy-cafe': 'rainy-cafe.mp4',
    'snowy-window': 'snowy-window.mp4',
    'campfire': 'campfire.mp4',
    'city-night': 'city-night.mp4',
    'starry-tent': 'starry-tent.mp4',
}

class QuietHTTPHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(public_dir), **kwargs)

    def log_message(self, format, *args):
        # Suppress noisy HTTP server access logs
        pass

def generate_posters():
    """Batch generate video poster cover images for all scenes without adding new dependencies."""
    print("Generating video posters...")
    posters_dir.mkdir(parents=True, exist_ok=True)

    with socketserver.TCPServer(('127.0.0.1', 0), QuietHTTPHandler) as httpd:
        port = httpd.server_address[1]
        server_thread = threading.Thread(target=httpd.serve_forever, daemon=True)
        server_thread.start()

        with sync_playwright() as p:
            browser = p.chromium.launch(
                args=['--no-sandbox', '--disable-dev-shm-usage', '--autoplay-policy=no-user-gesture-required'],
                chromium_sandbox=False
            )
            page = browser.new_page(viewport={'width': 1280, 'height': 720})

            for scene_id, video_filename in SCENE_VIDEOS.items():
                video_file = videos_dir / video_filename
                if not video_file.exists():
                    print(f"  [Skip] Video not found: {video_filename}")
                    continue

                out_poster = posters_dir / f"{scene_id}.jpg"
                video_url = f"http://127.0.0.1:{port}/videos/{video_filename}"
                page.goto(f"http://127.0.0.1:{port}/offline.html")
                page.set_content(f"""
                <!DOCTYPE html>
                <html>
                  <body style="margin:0;background:#000;overflow:hidden;">
                    <video id="v" src="{video_url}" muted playsinline autoplay style="width:100vw;height:100vh;object-fit:cover;"></video>
                  </body>
                </html>
                """)

                try:
                    page.wait_for_function(
                        "() => { const v = document.getElementById('v'); return v && v.readyState >= 2; }",
                        timeout=15000
                    )
                    page.evaluate("() => { const v = document.getElementById('v'); v.currentTime = 1.0; }")
                    page.wait_for_timeout(800)
                    page.screenshot(path=str(out_poster), type='jpeg', quality=85)
                    size_kb = os.path.getsize(out_poster) / 1024
                    print(f"  [OK] {scene_id} -> {out_poster.name} ({size_kb:.1f} KB)")
                except Exception as e:
                    print(f"  [Error] {scene_id}: {e}")

            browser.close()
            httpd.shutdown()
    print("Video posters generation complete!\n")

def take_mobile_screenshots():
    """Original mobile screenshot functionality"""
    url = 'http://127.0.0.1:3000/focus-room/'
    out = os.path.expanduser('~/Desktop')

    with sync_playwright() as p:
        browser = p.chromium.launch(
            args=['--no-sandbox', '--disable-dev-shm-usage', '--autoplay-policy=no-user-gesture-required'],
            chromium_sandbox=False
        )

        def take_screenshot(viewport_w, viewport_h, filename):
            page = browser.new_page(viewport={'width': viewport_w, 'height': viewport_h}, device_scale_factor=2)
            page.goto(url, wait_until='domcontentloaded', timeout=60000)
            try:
                page.wait_for_function(
                    '() => { const v = document.querySelector("video"); return v && v.readyState >= 2; }',
                    timeout=30000
                )
                page.wait_for_timeout(2000)
            except:
                print('  Video not ready, waiting extra time...')
                page.wait_for_timeout(10000)
            page.screenshot(path=os.path.join(out, filename))
            print(f'Saved: {filename}')
            page.close()

        # Mobile portrait - iPhone 14 Pro
        take_screenshot(390, 844, 'mobile-portrait.png')

        # Mobile landscape
        take_screenshot(844, 390, 'mobile-landscape.png')

        browser.close()
        print('Screenshots complete!')

if __name__ == '__main__':
    if '--mobile' in sys.argv:
        take_mobile_screenshots()
    else:
        # Default or --posters: batch generate posters
        generate_posters()
        if '--mobile' in sys.argv:
            take_mobile_screenshots()
