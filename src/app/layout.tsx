import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Source_Serif_4 } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import { Header, Footer } from "@/components";
import { WebVitals } from "@/components/WebVitals";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

// Serif for headlines - optical sizing for excellent readability at all sizes
const sourceSerif = Source_Serif_4({
  variable: "--font-source-serif",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "News Pulse",
    template: "%s | News Pulse",
  },
  description: "News before it's news. Real-time monitoring of breaking news, seismic activity, and geopolitical events from 650+ verified sources worldwide.",
  keywords: ["news", "OSINT", "intelligence", "geopolitical", "monitoring", "real-time", "global news", "breaking news", "earthquake", "pulse alert"],
  authors: [{ name: "News Pulse" }],
  creator: "News Pulse",
  publisher: "News Pulse",
  metadataBase: new URL("https://news-pulse.org"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://news-pulse.org",
    siteName: "News Pulse",
    title: "News Pulse - News before it's news",
    description: "Monitor breaking news, seismic activity, and geopolitical events from 650+ verified sources worldwide.",
  },
  twitter: {
    card: "summary_large_image",
    title: "News Pulse - News before it's news",
    description: "Monitor breaking news, seismic activity, and geopolitical events from 650+ verified sources worldwide.",
    creator: "@opensecwatcher",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    shortcut: "/favicon.svg",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#000000",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Theme initialization script to prevent FOUC
  const themeScript = `
    (function() {
      try {
        const theme = localStorage.getItem('theme');
        if (theme === 'light') {
          document.documentElement.classList.remove('dark');
        } else {
          // Default to dark mode
          document.documentElement.classList.add('dark');
        }
      } catch (e) {
        document.documentElement.classList.add('dark');
      }
    })();
  `;

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              name: "News Pulse",
              url: "https://news-pulse.org",
              description:
                "Real-time global intelligence dashboard monitoring breaking news from 650+ verified OSINT sources across 6 platforms.",
              applicationCategory: "NewsApplication",
              operatingSystem: "Web",
              author: {
                "@type": "Person",
                name: "Trevor Brown",
                url: "https://news-pulse.org/about",
              },
            }),
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${sourceSerif.variable} antialiased`}
      >
        <a
          href="#feed"
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[100] focus:px-4 focus:py-2 focus:bg-background-card focus:text-foreground focus:rounded-lg focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Skip to content
        </a>
        <Header />
        {children}
        <Footer />
        <Analytics />
        <WebVitals />
      </body>
    </html>
  );
}
