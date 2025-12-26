import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from 'next/link'

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
  title: 'CodeSage - AI Code Review Assistant',
  description: 'AI-powered code review for React, Angular, Vue, and Svelte',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <nav className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex">
                <Link href="/" className="flex items-center">
                  <span className="text-2xl font-bold text-blue-600">Coditor</span>
                </Link>
                <div className="hidden sm:ml-10 sm:flex sm:space-x-8">
                  <Link
                    href="/"
                    className="inline-flex items-center px-1 pt-1 text-gray-900 hover:text-blue-600"
                  >
                    Home
                  </Link>
                  <Link
                    href="/review"
                    className="inline-flex items-center px-1 pt-1 text-gray-900 hover:text-blue-600"
                  >
                    Code Review
                  </Link>
                  <Link
                    href="/history"
                    className="inline-flex items-center px-1 pt-1 text-gray-900 hover:text-blue-600"
                  >
                    History
                  </Link>
                </div>
              </div>
              <div className="flex items-center">
                {/* Auth button placeholder - you'll add this later */}
                <button className="ml-4 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700">
                  Sign In
                </button>
              </div>
            </div>
          </div>
        </nav>
        <main>{children}</main>
      </body>
    </html>
  )
}
