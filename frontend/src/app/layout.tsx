import type { Metadata, Viewport } from "next";
import { Fredoka } from "next/font/google";
import "./globals.css";
import { TelegramProvider, OfflineProvider, ErrorBoundaryProvider } from "../components/providers";
import { SyncIndicator } from "../components/shared";

const fredoka = Fredoka({
  variable: "--font-fredoka",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  minimumScale: 0.5,
  maximumScale: 3,
  userScalable: true,
  viewportFit: "cover",
  themeColor: "#0a0a1a",
};

export const metadata: Metadata = {
  title: "Whale",
  description: "Play games, complete quests, and earn rewards in the Telegram Mini App",
  applicationName: "Whale",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Whale",
  },
  formatDetection: {
    telephone: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Telegram Web App Script - MUST be loaded before app */}
        <script src="https://telegram.org/js/telegram-web-app.js" />
      </head>
      <body
        className={`${fredoka.variable} font-sans antialiased min-h-screen-safe flex justify-center`}
        style={{ backgroundColor: '#0a0a1a' }}
        suppressHydrationWarning
      >
        <div 
          className="w-full overflow-hidden relative"
          style={{ 
            maxWidth: '100%',
            minHeight: '100dvh',
            background: "url('/background.png') no-repeat center center",
            backgroundSize: 'cover'
          }}
        >
          <ErrorBoundaryProvider>
            <TelegramProvider>
              <OfflineProvider>
                {children}
              </OfflineProvider>
            </TelegramProvider>
          </ErrorBoundaryProvider>
        </div>
      </body>
    </html>
  );
}
