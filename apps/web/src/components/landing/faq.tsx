import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@paramlab/ui";
import { FAQ } from "./data";

export function Faq() {
  return (
    <section
      id="faq"
      className="scroll-mt-14 border-b border-[#262B36] bg-[#0E1014] py-16 text-[#F2F4F7] lg:py-24"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <p className="font-mono text-xs tracking-widest text-[#00D1FF] uppercase">
          04 · Инженерный справочник
        </p>
        <h2 className="mt-3 max-w-3xl text-2xl font-bold tracking-tight text-balance sm:text-3xl lg:text-4xl">
          Частые вопросы о параметрической печати
        </h2>
        <div className="mt-10">
          <Accordion className="max-w-3xl rounded-[24px] border border-[#262B36] bg-[#161920] px-6">
            {FAQ.map((item) => (
              <AccordionItem
                key={item.question}
                value={item.question}
                className="border-[#262B36] last:border-b-0"
              >
                <AccordionTrigger className="gap-4 py-5 text-left text-base font-semibold text-[#F2F4F7] hover:text-[#00D1FF]">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="pb-5 text-sm leading-relaxed text-pretty text-[#8A93A2]">
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
