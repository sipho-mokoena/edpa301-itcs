export const ZA_LOCALE = "en-ZA";
export const ZA_TIME_ZONE = "Africa/Johannesburg";

export type DateInput = Date | string | number;

function resolveDate(value: DateInput): Date {
  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new RangeError("Invalid date value provided to formatDateZA");
  }

  return date;
}

export function formatDateZA(value: DateInput): string {
  return new Intl.DateTimeFormat(ZA_LOCALE, {
    timeZone: ZA_TIME_ZONE,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(resolveDate(value));
}

export function formatDateTimeZA(value: DateInput): string {
  return new Intl.DateTimeFormat(ZA_LOCALE, {
    timeZone: ZA_TIME_ZONE,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(resolveDate(value));
}
