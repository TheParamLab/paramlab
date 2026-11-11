import { CalculatorProvider } from "~/components/landing/calculator-context";
import { NAV_LINKS } from "~/components/landing/data";
import { Faq } from "~/components/landing/faq";
import { Hero } from "~/components/landing/hero";
import { LandingHeader, Logo } from "~/components/landing/landing-header";
import {
  Capabilities,
  Delivery,
  Generators,
  Pricing,
  Products,
} from "~/components/landing/sections";
import { structuredData } from "~/components/landing/structured-data";

// `<` экранируем, чтобы текст данных не мог закрыть тег <script>.
const jsonLd = JSON.stringify(structuredData).replace(/</g, "\\u003c");

export default function HomePage() {
  return (
    <CalculatorProvider>
      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: статический JSON-LD из наших же данных, `<` экранирован
        dangerouslySetInnerHTML={{ __html: jsonLd }}
      />
      <LandingHeader />
      <main>
        <Hero />
        <Generators />
        <Capabilities />
        <Products />
        <Delivery />
        <Pricing />
        <Faq />
      </main>
      <footer className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-10 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
        <div className="flex flex-col gap-2">
          <Logo />
          <p className="text-muted-foreground text-sm">
            Инженерная 3D-печать и серийное приборостроение.
          </p>
        </div>
        <nav
          aria-label="Разделы страницы в подвале"
          className="flex flex-wrap gap-x-5 gap-y-2"
        >
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-muted-foreground hover:text-foreground text-sm transition-colors"
            >
              {link.label}
            </a>
          ))}
        </nav>
      </footer>
    </CalculatorProvider>
  );
}
