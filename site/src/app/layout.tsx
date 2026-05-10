import type { Metadata } from "next";
import { EB_Garamond, JetBrains_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const garamond = EB_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-garamond",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono-var",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Ansinn",
    template: "%s — Ansinn",
  },
  description: "Technical writing, AI architecture, and assorted thought by Gunter Ansinn.",
  alternates: {
    types: {
      'application/rss+xml': 'https://blog.ansinn.net/feed.xml',
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${garamond.variable} ${mono.variable}`}>
      <body>
        <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
          <header className="site-header">
            <div className="site-header-inner">
              <Link href="/" className="site-wordmark">Ansinn</Link>
              <div className="site-rule" />
            </div>
          </header>

          <main className="site-main" style={{ flex: 1 }}>
            {children}
          </main>

          <footer>
            <div className="site-footer" style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <span>© {new Date().getFullYear()} Gunter Ansinn</span>
              <div style={{ display: "flex", gap: "1.5rem", alignItems: "baseline" }}>
                <Link href="/feed.xml" style={{ color: "var(--text-muted)", textDecoration: "none", fontSize: "0.8125rem" }}>
                  RSS
                </Link>
                <Link href="/colophon" style={{ color: "var(--text-muted)", textDecoration: "none", fontSize: "0.8125rem" }}>
                  Colophon
                </Link>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
