import { cn, ThemeProvider } from "@acme/ui";
import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import type { ReactNode } from "react";
import { SITE_URL } from "~/components/landing/data";

import "~/app/styles.css";

const title =
  "ParamLab — инженерная 3D-печать деталей и корпусов на заказ, расчет онлайн";
const description =
  "Печатаем технические детали и корпуса из PETG, ASA, PA6-CF и поликарбоната. Цена за 5 секунд по файлу STL/STEP или по размерам в генераторе. Доставка в ПВЗ Ozon от 199 ₽.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title,
  description,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "ru_RU",
    url: SITE_URL,
    siteName: "ParamLab",
    title,
    description,
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "black" },
  ],
};

// Кириллица нужна обоим шрифтам: весь текст страницы на русском.
const geistSans = Geist({
  subsets: ["latin", "cyrillic"],
  variable: "--font-geist-sans",
});
const geistMono = Geist_Mono({
  subsets: ["latin", "cyrillic"],
  variable: "--font-geist-mono",
});

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body
        className={cn(
          "bg-background text-foreground min-h-screen font-sans antialiased",
          geistSans.variable,
          geistMono.variable,
        )}
      >
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
