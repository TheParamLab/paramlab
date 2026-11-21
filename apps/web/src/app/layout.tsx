import { cn, ThemeProvider, Toaster } from "@paramlab/ui";
import { Analytics } from "@vercel/analytics/next";
import type { Metadata, Viewport } from "next";
import { JetBrains_Mono, Onest } from "next/font/google";
import type { ReactNode } from "react";
import { SITE_URL } from "~/components/landing/data";
import { ORPCReactProvider } from "~/orpc/react";

import "~/app/styles.css";

const title =
  "ParamLab — сервис параметрической 3D-печати деталей и корпусов на заказ";
const description =
  "Инженерная параметрическая 3D-печать на заказ с точностью до 0.1 мм. Задайте размеры детали без 3D-моделирования: PETG, ABS, PA12 Nylon, PETG-CF. Доставка через Ozon и СДЭК.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title,
  description,
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
    { media: "(prefers-color-scheme: light)", color: "#0E1014" },
    { media: "(prefers-color-scheme: dark)", color: "#0E1014" },
  ],
};

// Кириллица нужна обоим шрифтам: весь текст страницы на русском.
const onestSans = Onest({
  subsets: ["latin", "cyrillic"],
  variable: "--font-geist-sans",
});
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin", "cyrillic"],
  variable: "--font-geist-mono",
});

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body
        className={cn(
          "bg-background text-foreground min-h-screen font-sans antialiased",
          onestSans.variable,
          jetbrainsMono.variable,
        )}
      >
        <ThemeProvider>
          <ORPCReactProvider>{children}</ORPCReactProvider>
          <Toaster />
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
