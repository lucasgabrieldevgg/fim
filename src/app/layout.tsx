import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Fim! — o aviso de tarefa concluída do seu agente de IA",
  description:
    "Deixe a aba aberta, passe as instruções para o seu agente de IA e receba na hora uma notificação (com alarme opcional) quando a tarefa terminar. Grátis, sem cadastro, push via ntfy.sh.",
  keywords: [
    "agente de IA",
    "notificação",
    "tarefa concluída",
    "ntfy",
    "webhook",
    "REST",
    "alarme",
  ],
  authors: [{ name: "Fim!" }],
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/icon-192.png",
    apple: "/icon-192.png",
  },
  openGraph: {
    title: "Fim! — seu agente de IA terminou, você fica sabendo na hora",
    description:
      "Notificação e alarme quando o agente de IA termina a tarefa. Basta uma requisição REST.",
    siteName: "Fim!",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#09090b",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
