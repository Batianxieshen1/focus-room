"""Take mobile screenshots using Playwright"""
from playwright.sync_api import sync_playwright
import os

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
        # Wait for video element to have a readyState >= 2 (HAVE_CURRENT_DATA)
        try:
            page.wait_for_function(
                '() => { const v = document.querySelector("video"); return v && v.readyState >= 2; }',
                timeout=30000
            )
            # Extra wait for the video to actually render a frame
            page.wait_for_timeout(2000)
        except:
            print(f'  Video not ready, waiting extra time...')
            page.wait_for_timeout(10000)
        page.screenshot(path=os.path.join(out, filename))
        print(f'Saved: {filename}')
        page.close()

    # Mobile portrait - iPhone 14 Pro
    take_screenshot(390, 844, 'mobile-portrait.png')

    # Mobile landscape
    take_screenshot(844, 390, 'mobile-landscape.png')

    browser.close()
    print('Done!')
