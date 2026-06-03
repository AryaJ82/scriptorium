import type { Metadata } from "next";
import { Geist, Geist_Mono, Fraunces } from "next/font/google";
import { Toaster } from "sonner";
import { ThemeProvider } from '@/contexts/ThemeContext'
import { UserSessionProvider } from "@/contexts/UserSessionContext";
import "./globals.css";
import PageShell from "@/components/PageShell";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});
const fraunces = Fraunces({
  variable: '--font-fraunces',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: "Scriptorium",
  description: "A collaborative content platform for sharing code.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className="bg-background"
    >
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${fraunces.variable} font-sans antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <UserSessionProvider>
            <PageShell>
              {children}
            </PageShell>
          </UserSessionProvider>
          <Toaster richColors />
        </ThemeProvider>
      </body>
    </html>
  );
}
