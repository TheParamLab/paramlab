import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@paramlab/ui";
import { FAQ } from "~/components/landing/data";

export function Faq() {
  return (
    <section
      id="faq"
      className="scroll-mt-14 border-b border-lab-border bg-lab-bg py-16 text-lab-text lg:py-24"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <p className="font-mono text-xs tracking-widest text-lab-cyan uppercase">
          04 · Инженерный справочник
        </p>
        <h2 className="mt-3 max-w-3xl text-2xl font-bold tracking-tight text-balance sm:text-3xl lg:text-4xl">
          Частые вопросы о параметрической печати
        </h2>
        <div className="mt-10">
          <Accordion className="max-w-3xl rounded-[24px] border border-lab-border bg-lab-surface px-6">
            {FAQ.map((item) => (
              <AccordionItem
                key={item.question}
                value={item.question}
                className="border-lab-border last:border-b-0"
              >
                <AccordionTrigger className="gap-4 py-5 text-left text-base font-semibold text-lab-text hover:text-lab-cyan">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="pb-5 text-sm leading-relaxed text-pretty text-lab-muted">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}
