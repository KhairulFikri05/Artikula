import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Script from "next/script";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Sekalian kita ubah judul tab browser-nya biar keren!
export const metadata: Metadata = {
  title: "ARTIKULA",
  description: "Platform Terapi Inklusi VAK",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      {/* KAMAR KHUSUS UNTUK OTAK AI */}
      <head>
        <Script 
          src="https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/face_mesh.js" 
          strategy="beforeInteractive" 
          crossOrigin="anonymous"
        />
      </head>

      {/* KAMAR UNTUK TAMPILAN UI GAME / HALAMAN */}
      <body className="min-h-full flex flex-col">
        {children}
      </body>
    </html>
  );
}