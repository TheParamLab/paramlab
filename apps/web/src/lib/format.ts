const number = new Intl.NumberFormat("ru-RU");
const dateTime = new Intl.DateTimeFormat("ru-RU", {
  day: "numeric",
  month: "long",
  hour: "2-digit",
  minute: "2-digit",
});
const date = new Intl.DateTimeFormat("ru-RU", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

export const formatNumber = (value: number) => number.format(value);
export const formatRub = (value: number) => `${number.format(value)} ₽`;
export const formatDate = (value: Date) => date.format(value);
export const formatDateTime = (value: Date) => dateTime.format(value);
