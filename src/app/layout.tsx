import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Nunito } from "next/font/google";
import "../index.css";

const nunito = Nunito({
  weight: ["400", "600", "700", "800"],
  subsets: ["latin"],
  variable: "--font-nunito",
});

export const metadata: Metadata = {
  title: "Nerds Battle",
  description: "Estima totales de carrera. Cinco jugadores, un objetivo, sin ver las cifras.",
};

const themeScript = `(function(){try{var t=localStorage.getItem("nb-theme");if(t!=="light"&&t!=="dark")t="light";document.documentElement.setAttribute("data-theme",t)}catch(e){}})();`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es" className={nunito.variable} suppressHydrationWarning>
      <body className={nunito.className}>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <div id="root">{children}</div>
      </body>
    </html>
  );
}
