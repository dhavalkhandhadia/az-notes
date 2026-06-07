import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AZ Notes",
  description:
    "Search AlgoZenith lectures, notes, and concepts instantly with a lightweight navigation layer.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="h-full antialiased"
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (() => {
                try {
                  const stored = localStorage.getItem('az-notes-theme');
                  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  const theme = stored === 'dark' || stored === 'light' ? stored : (prefersDark ? 'dark' : 'light');
                  document.documentElement.classList.toggle('dark', theme === 'dark');
                  document.documentElement.style.colorScheme = theme;
                } catch {}
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-full bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
