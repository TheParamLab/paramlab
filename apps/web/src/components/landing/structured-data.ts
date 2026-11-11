import { FAQ, PRODUCTS, SITE_URL } from "./data";
import { MIN_ORDER } from "./pricing";

const organizationId = `${SITE_URL}/#organization`;
const inStock = "https://schema.org/InStock";

/** Schema.org-граф главной страницы: организация, услуга, приборы, FAQ. */
export const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": ["Organization", "ManufacturingBusiness"],
      "@id": organizationId,
      name: "ParamLab",
      url: SITE_URL,
      description:
        "Инженерная 3D-печать технических деталей и корпусов на заказ, серийное приборостроение.",
      areaServed: "RU",
      priceRange: "от 1 400 ₽",
    },
    {
      "@type": "Product",
      name: "3D-печать технических деталей и корпусов на заказ",
      description:
        "Печать инженерными пластиками PETG, ASA/ABS, PA6-CF, PC и TPU по файлу STL/STEP/3MF или по размерам из онлайн-генератора. Доставка в ПВЗ по России.",
      brand: { "@id": organizationId },
      offers: {
        "@type": "AggregateOffer",
        lowPrice: MIN_ORDER,
        priceCurrency: "RUB",
        availability: inStock,
        seller: { "@id": organizationId },
      },
    },
    ...PRODUCTS.map((product) => ({
      "@type": "Product",
      name: product.name,
      description: `${product.title}. ${product.text}`,
      brand: { "@id": organizationId },
      offers: product.pricePrefix
        ? {
            "@type": "AggregateOffer",
            lowPrice: product.price,
            priceCurrency: "RUB",
            availability: inStock,
            seller: { "@id": organizationId },
          }
        : {
            "@type": "Offer",
            price: product.price,
            priceCurrency: "RUB",
            availability: inStock,
            url: `${SITE_URL}/#products`,
            seller: { "@id": organizationId },
          },
    })),
    {
      "@type": "FAQPage",
      mainEntity: FAQ.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: { "@type": "Answer", text: item.answer },
      })),
    },
  ],
};
