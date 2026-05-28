import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Sidebar from "@/components/Sidebar";
import LoginWidget from "@/components/LoginWidget";
import { AuthProvider } from "@/components/providers/AuthContext";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "INU Courses Market",
  description: "INU Courses Market",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} antialiased`}
    >
      <body className="bg-zinc-50 text-zinc-900 flex min-h-screen">
        <AuthProvider>
          {/* Sidebar Wrapper for Sticky Island */}
          <div className="w-[300px] shrink-0 p-4 sticky top-0 h-screen hidden lg:block z-40">
            <Sidebar />
          </div>
          
          {/* Main Scrolling Area */}
          <main className="flex-1 min-w-0 flex flex-col relative">
            <LoginWidget />
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}
