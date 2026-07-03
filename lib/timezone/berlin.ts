import { BERLIN_TIME_ZONE } from "@/lib/domain/constants";

type DateTimeParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
};

const berlinFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: BERLIN_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});

function getBerlinParts(date: Date): DateTimeParts {
  const parts = berlinFormatter.formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));

  return {
    year: Number(values.year),
    month: Number(values.month),
    day: Number(values.day),
    hour: Number(values.hour),
    minute: Number(values.minute),
    second: Number(values.second),
  };
}

function getBerlinOffsetMs(date: Date): number {
  const parts = getBerlinParts(date);
  const berlinAsUtc = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second,
  );

  return berlinAsUtc - date.getTime();
}

export function berlinWallTimeToUtc(date: string, time: string): Date {
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  const naiveUtc = Date.UTC(year, month - 1, day, hour, minute, 0);
  const firstPass = new Date(naiveUtc - getBerlinOffsetMs(new Date(naiveUtc)));
  const secondPass = new Date(naiveUtc - getBerlinOffsetMs(firstPass));

  return secondPass;
}

export function formatBerlinDateTime(date: Date): string {
  const parts = getBerlinParts(date);
  const pad = (value: number) => value.toString().padStart(2, "0");

  return `${parts.year}-${pad(parts.month)}-${pad(parts.day)} ${pad(parts.hour)}:${pad(
    parts.minute,
  )}`;
}

export function isBeforeAnstosszeit(now: Date, anstosszeit: Date): boolean {
  return now.getTime() < anstosszeit.getTime();
}
