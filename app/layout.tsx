import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: process.env.NEXT_PUBLIC_SITE_URL
    ? new URL(process.env.NEXT_PUBLIC_SITE_URL)
    : undefined,
  title: "Focus Room | 沉浸式自习室",
  description: "一个让你专注学习的沉浸式环境，包含动态自然场景、白噪音和计时器",
  manifest: `${process.env.NEXT_PUBLIC_BASE_PATH || ''}/manifest.json`,
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Focus Room",
  },
  openGraph: {
    title: "Focus Room | 沉浸式自习室",
    description: "一个让你专注学习的沉浸式环境，包含动态自然场景、白噪音和计时器",
    type: "website",
    images: [
      {
        url: `${process.env.NEXT_PUBLIC_BASE_PATH || ''}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "Focus Room",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Focus Room | 沉浸式自习室",
    description: "一个让你专注学习的沉浸式环境，包含动态自然场景、白噪音和计时器",
  },
  robots: {
    index: true,
    follow: true,
  },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#000000",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="h-full antialiased">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@200;300;400;500;600&display=swap" rel="stylesheet" />
        <link rel="preload" as="video" href="/focus-room/videos/mountain-lake.mp4" />
        <link rel="apple-touch-icon" href={`${process.env.NEXT_PUBLIC_BASE_PATH || ''}/icon-192.png`} />
        <link rel="icon" type="image/svg+xml" href={`${process.env.NEXT_PUBLIC_BASE_PATH || ''}/icon.svg`} />
        {/* 防止主题闪烁：在 body 渲染前同步读取 localStorage 并应用 class */}
        <script dangerouslySetInnerHTML={{ __html: `
          try {
            if (localStorage.getItem('focus-room-theme') === 'light') {
              document.documentElement.classList.add('light-theme')
            }
          } catch {}
        `}} />
        {/* Loading progress bar */}
        <style dangerouslySetInnerHTML={{ __html: `
          #loading-screen { position: fixed; inset: 0; z-index: 9999; background: #0a0e1a; display: flex; flex-direction: column; align-items: center; justify-content: center; transition: opacity 0.5s; }
          #loading-screen.hide { opacity: 0; pointer-events: none; }
          .loading-bar { width: 200px; height: 2px; background: rgba(255,255,255,0.1); border-radius: 1px; overflow: hidden; margin-top: 24px; }
          .loading-bar-inner { height: 100%; background: rgba(255,255,255,0.5); animation: load 3s ease-in-out forwards; }
          @keyframes load { 0% { width: 0; } 60% { width: 70%; } 100% { width: 100%; } }
        `}} />
      </head>
      <body className="h-full overflow-hidden font-sans">
        <div id="loading-screen">
          <div style={{ fontSize: '1.5rem', fontWeight: 200, color: 'rgba(255,255,255,0.8)', letterSpacing: '0.15em' }}>Focus Room</div>
          <div className="loading-bar"><div className="loading-bar-inner"></div></div>
        </div>
        <script dangerouslySetInnerHTML={{ __html: `
          window.addEventListener('load', function() {
            setTimeout(function() {
              var el = document.getElementById('loading-screen');
              if (el) el.classList.add('hide');
            }, 300);
          });
        `}} />
        {children}
        <script dangerouslySetInnerHTML={{ __html: `
          if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
              navigator.serviceWorker.register('${process.env.NEXT_PUBLIC_BASE_PATH || ''}/sw.js').catch(() => {})
            })
          }
        `}} />
      </body>
    </html>
  )
}
