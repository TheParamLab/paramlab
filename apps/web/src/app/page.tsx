import type { Metadata } from "next";
import { BentoAdvantages } from "~/components/landing/bento-advantages";
import { CalculatorProvider } from "~/components/landing/calculator-context";
import { NAV_LINKS } from "~/components/landing/data";
import { Faq } from "~/components/landing/faq";
import { Hero } from "~/components/landing/hero";
import { LandingHeader, Logo } from "~/components/landing/landing-header";
import { ProductionCycle } from "~/components/landing/production-cycle";
import { structuredData } from "~/components/landing/structured-data";
import { TemplateShowcase } from "~/components/landing/template-showcase";
import { UploadHero } from "~/components/landing/upload-hero";

// `<` экранируем, чтобы текст данных не мог закрыть тег <script>.
const jsonLd = JSON.stringify(structuredData).replace(/</g, "\\u003c");

// canonical только у лендинга: /cabinet и /auth не должны ссылаться на `/`.
export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export default function HomePage() {
  return (
    <CalculatorProvider>
      <div className="min-h-screen bg-[#0E1014] text-[#F2F4F7] selection:bg-[#FF5C1A] selection:text-[#0E1014]">
        <script
          type="application/ld+json"
          // biome-ignore lint/security/noDangerouslySetInnerHtml: статический JSON-LD из наших же данных, `<` экранирован
          dangerouslySetInnerHTML={{ __html: jsonLd }}
        />
        <LandingHeader />
        <main>
          <UploadHero />
          <Hero />
          <BentoAdvantages />
          <TemplateShowcase />
          <ProductionCycle />
          <Faq />
        </main>
        <footer className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-12 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
          <div className="flex flex-col gap-2">
            <Logo />
            <p className="text-sm text-[#8A93A2]">
              Инженерная лаборатория параметрической 3D-печати · Точность до{" "}
              <span className="font-mono text-[#00D1FF]">0.1 мм</span>.
            </p>
          </div>
          <nav
            aria-label="Разделы страницы в подвале"
            className="flex flex-wrap gap-x-6 gap-y-2"
          >
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm text-[#8A93A2] transition-colors duration-240 hover:text-[#F2F4F7]"
              >
                {link.label}
              </a>
            ))}
          </nav>
        </footer>
      </div>
    </CalculatorProvider>
  );
}
