import { APP_CONFIG, env } from "@paramlab/config";
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Tailwind,
  Text,
} from "@react-email/components";

import { emailTailwindConfig } from "../tailwind";

export default function OrderStatusEmail({
  customerName = "username",
  orderNumber = 1001,
  statusLabel = "Печатается в термокамере",
  note,
  trackingUrl,
  orderUrl = `${env.APP_URL}/cabinet/orders`,
}: {
  customerName: string;
  orderNumber: number;
  statusLabel: string;
  note?: string | null;
  trackingUrl?: string | null;
  orderUrl?: string;
}) {
  return (
    <Html lang="ru">
      <Head />
      <Preview>{`Заказ №${orderNumber}: ${statusLabel}`}</Preview>
      <Tailwind config={emailTailwindConfig}>
        <Body className="mx-auto my-auto bg-white font-sans">
          <Container className="mx-auto my-[40px] w-[465px] rounded border border-solid border-[#eaeaea] p-[20px]">
            <Heading className="mx-0 my-[30px] p-0 text-center text-[24px] font-normal text-black">
              Заказ №{orderNumber}
            </Heading>
            <Text className="text-[14px] leading-[24px] text-black">
              Здравствуйте, {customerName}!
            </Text>
            <Text className="text-[14px] leading-[24px] text-black">
              Новый этап вашего заказа в {APP_CONFIG.shortName}:{" "}
              <strong>{statusLabel}</strong>.
            </Text>
            {note ? (
              <Text className="text-[14px] leading-[24px] text-[#666666]">
                Комментарий: {note}
              </Text>
            ) : null}
            <Section className="my-[32px] text-center">
              <Button
                className="rounded bg-[#000000] px-[20px] py-[12px] text-center text-[14px] font-semibold text-white no-underline"
                href={orderUrl}
              >
                Отследить заказ
              </Button>
            </Section>
            {trackingUrl ? (
              <Text className="text-[14px] leading-[24px] text-black">
                Отслеживание отправления:{" "}
                <Link href={trackingUrl} className="text-black">
                  {trackingUrl}
                </Link>
              </Text>
            ) : null}
            <Hr className="mx-0 my-[26px] w-full border border-solid border-[#eaeaea]" />
            <Text className="text-[12px] leading-[24px] text-[#666666]">
              Вы получили это письмо, потому что оформили заказ в{" "}
              <Link href={env.APP_URL} className="text-black no-underline">
                <strong>{APP_CONFIG.shortName}</strong>
              </Link>
              . История этапов и фотоконтроль — в личном кабинете.
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}
