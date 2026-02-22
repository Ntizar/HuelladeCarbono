import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import Sidebar from "@/components/layout/Sidebar";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Huella de Carbono | Calculadora MITECO",
  description: "SaaS para el cálculo de huella de carbono organizacional según la normativa española (MITECO V.31). Alcance 1 + 2, GHG Protocol.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Sidebar />
        <main className="ml-64 min-h-screen flex flex-col">
          <div className="p-8 flex-1">
            {children}
          </div>
          <footer className="px-8 py-4 border-t border-gray-200 text-center text-xs text-gray-400">
            Desarrollado por <span className="font-medium text-gray-600">David Antizar</span> · Calculadora MITECO V.31
          </footer>
        </main>
      </body>
    </html>
  );
}
