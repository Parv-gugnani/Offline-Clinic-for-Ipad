import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Beauty Clinic Appointments",
  description: "Book beauty treatments and manage appointments",
  manifest: "/manifest.json",
  themeColor: "#f8bbd0",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Beauty Clinic",
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 5,
    userScalable: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="application-name" content="Beauty Clinic" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Beauty Clinic" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />

        {/* iOS icons */}
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icons/icon-192x192.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/apple-touch-icon.png" />
        <link rel="apple-touch-icon" sizes="167x167" href="/icons/icon-192x192.png" />

        {/* iOS splash screens */}
        <link rel="apple-touch-startup-image" href="/icons/apple-touch-icon.png" />

        {/* PWA color */}
        <meta name="theme-color" content="#f8bbd0" />
      </head>
      <body className={inter.className}>
        {children}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js', { scope: '/' })
                    .then(function(registration) {
                      console.log('Service Worker registered with scope:', registration.scope);
                    })
                    .catch(function(error) {
                      console.error('Service Worker registration failed:', error);
                    });
                });
              }

              // Check if the app is in standalone mode (installed)
              if (window.matchMedia('(display-mode: standalone)').matches) {
                console.log('App is running in standalone mode');
                // You can add specific behavior for installed app here
              }

              // Handle offline/online events
              window.addEventListener('online', function() {
                console.log('App is online');
                // You can add specific behavior for online state here
              });

              window.addEventListener('offline', function() {
                console.log('App is offline');
                // You can add specific behavior for offline state here
              });
            `,
          }}
        />
      </body>
    </html>
  );
}
