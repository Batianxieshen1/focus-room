import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Focus Room | 沉浸式自习室",
  description: "一个让你专注学习的沉浸式环境，包含动态自然场景、白噪音和计时器",
  manifest: "/manifest.json",
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
        url: "/og-image.png",
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
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body className="h-full overflow-hidden font-sans">
        {children}
        <script dangerouslySetInnerHTML={{ __html: `
          if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
              navigator.serviceWorker.register('/sw.js').catch(() => {})
            })
          }
        `}} />
      </body>
    </html>
  )
}
