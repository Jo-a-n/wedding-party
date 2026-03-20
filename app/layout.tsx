import type { Metadata } from "next";
import { allFonts } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ντανιέλα & Κωνσταντίνος — 21 Μαρτίου 2026",
  description: "Ο γάμος της Ντανιέλας και του Κωνσταντίνου. Σάββατο 21 Μαρτίου 2026. Ευχές, φωτογραφίες και ρύζι!",
};

const fontVariables = allFonts.map((f) => f.variable).join(" ");

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="el" data-theme="dark" className={fontVariables} suppressHydrationWarning>
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
