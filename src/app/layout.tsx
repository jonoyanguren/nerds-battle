import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Anton, IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import "../index.css";

const anton = Anton({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-anton",
});

const plexSans = IBM_Plex_Sans({
  weight: ["400", "500", "600"],
  subsets: ["latin"],
  variable: "--font-sans",
});

const plexMono = IBM_Plex_Mono({
  weight: ["400", "600"],
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "Nerds Battle",
  description: "Estima totales de carrera. Cinco jugadores, un objetivo, sin ver las cifras.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es" className={`${anton.variable} ${plexSans.variable} ${plexMono.variable}`}>
      <body className={plexSans.className}>
        <div id="root">{children}</div>
      </body>
    </html>
  );
}
