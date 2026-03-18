import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ντανιέλα & Κωνσταντίνος — 21 Μαρτίου 2026",
  description: "Ο γάμος της Ντανιέλας και του Κωνσταντίνου. Σάββατο 21 Μαρτίου 2026. Ευχές, φωτογραφίες και ρύζι!",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="el" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var theme=localStorage.getItem("wedding-party-theme");if(theme==="light"||theme==="dark"){document.documentElement.dataset.theme=theme;}}catch(e){}})();`,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
