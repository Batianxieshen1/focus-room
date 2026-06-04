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
      </head>
      <body className="h-full overflow-hidden font-sans">
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
