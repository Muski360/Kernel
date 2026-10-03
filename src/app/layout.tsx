import type { Metadata } from "next";
import Link from "next/link";
import localFont from "next/font/local";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { SiteMotion } from "@/components/motion/site-motion";
import { siteUrl } from "@/lib/site";
import "lenis/dist/lenis.css";
import "@/styles/globals.css";
import "./home.css";
import "./sobre/about.css";
import "@/styles/motion.css";

const sans = localFont({
  src: "../../public/fonts/dm-sans-latin.woff2",
  variable: "--font-sans",
  display: "swap",
  weight: "100 1000",
});
const display = localFont({
  src: "../../public/fonts/space-grotesk-latin.woff2",
  variable: "--font-display",
  display: "swap",
  weight: "300 700",
});
const mono = localFont({
  src: "../../public/fonts/ibm-plex-mono-latin.woff2",
  variable: "--font-mono",
  display: "swap",
  weight: "400",
  preload: false,
});

export const metadata: Metadata = {
  metadataBase: siteUrl,
  title: {
    default: "KERNEL — Da ideia ao software, em uma conversa",
    template: "%s | KERNEL",
  },
  description:
    "Conheça a proposta do KERNEL: criar pequenas aplicações web a partir de uma conversa, com aprovações suas em cada decisão. Projeto educacional do SENAI Americana.",
  applicationName: "KERNEL",
  alternates: { canonical: "/" },
  openGraph: {
    url: "/",
    title: "KERNEL — Da ideia ao software, em uma conversa",
    description:
      "Você conduz a ideia. Os agentes ajudam a construir. Conheça o projeto educacional KERNEL.",
    locale: "pt_BR",
    type: "website",
    siteName: "KERNEL",
  },
  twitter: { card: "summary_large_image" },
  icons: { icon: "/icon.svg" },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="pt-BR"
      className={`${sans.variable} ${display.variable} ${mono.variable}`}
    >
      <body>
        <a href="#conteudo" className="skip-link">
          Pular para o conteúdo
        </a>
        <Header />
        <noscript>
          <nav className="no-script-nav" aria-label="Navegação sem JavaScript">
            <Link href="/#como-funciona">Como funciona</Link>
            <Link href="/sobre">Sobre o KERNEL</Link>
          </nav>
        </noscript>
        {children}
        <Footer />
        <SiteMotion />
      </body>
    </html>
  );
}
