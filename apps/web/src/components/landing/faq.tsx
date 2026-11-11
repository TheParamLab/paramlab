import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@acme/ui";
import { FAQ } from "./data";
import { Section } from "./sections";

export function Faq() {
  return (
    <Section id="faq" eyebrow="06 · Вопросы" title="Частые вопросы">
      <Accordion className="max-w-3xl rounded-2xl border px-5">
        {FAQ.map((item) => (
          <AccordionItem
            key={item.question}
            value={item.question}
            className="last:border-b-0"
          >
            <AccordionTrigger className="gap-4 py-5 text-base">
              {item.question}
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground pb-5 text-sm text-pretty">
              {item.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </Section>
  );
}
