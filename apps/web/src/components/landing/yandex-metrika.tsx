import Script from "next/script";

/** Номер счётчика Яндекс.Метрики для сайта paramlab.ru. */
const COUNTER_ID = 114398615;

/**
 * Сниппет из кабинета Метрики. `ssr: true` — чтобы счётчик инициализировался
 * сразу, не дожидаясь полной загрузки страницы.
 */
const initScript = `
(function(m,e,t,r,i,k,a){
    m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
    m[i].l=1*new Date();
    for (var j = 0; j < document.scripts.length; j++) {if (document.scripts[j].src === r) { return; }}
    k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)
})(window, document,'script','https://mc.yandex.ru/metrika/tag.js?id=${COUNTER_ID}', 'ym');

ym(${COUNTER_ID}, 'init', {ssr:true, webvisor:true, clickmap:true, ecommerce:"dataLayer", referrer: document.referrer, url: location.href, accurateTrackBounce:true, trackLinks:true});
`;

export function YandexMetrika() {
  return (
    <>
      <Script id="yandex-metrika" strategy="afterInteractive">
        {initScript}
      </Script>
      <noscript>
        <div>
          {/* biome-ignore lint/performance/noImgElement: пиксель Метрики для <noscript>, next/image здесь не нужен */}
          <img
            src={`https://mc.yandex.ru/watch/${COUNTER_ID}`}
            style={{ position: "absolute", left: "-9999px" }}
            alt=""
          />
        </div>
      </noscript>
    </>
  );
}
