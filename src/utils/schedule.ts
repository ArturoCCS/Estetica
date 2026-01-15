import { BusinessDayKey, GlobalSettings } from "../types/settings";

export function parseHHMM(hhmm: string) {
  const [hh, mm] = hhmm.split(":").map(Number);
  return { hh, mm, minutes: hh * 60 + mm };
}

export function toTZ(date: Date, tz?: string) {
  return tz ? new Date(date.toLocaleString("en-US", { timeZone: tz })) : date;
}

export function dateOnlyStringToTZ(dateStr: string, tz?: string) {
  const dNoonUTC = new Date(`${dateStr}T12:00:00Z`);
  return toTZ(dNoonUTC, tz);
}

export function businessDayKeyForDateString(dateStr: string, tz?: string): BusinessDayKey {
  const d = dateOnlyStringToTZ(dateStr, tz);
  const idx = d.getDay();
  const keys: BusinessDayKey[] = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
  return keys[idx];
}

export function makeSlotsForDay(
  bh: GlobalSettings["businessHours"][BusinessDayKey],
  intervalMin: number,
  serviceDurationMin?: number
) {
  const start = parseHHMM(bh.start).minutes;
  const end = parseHHMM(bh.end).minutes;
  const slots: string[] = [];
  for (let m = start; m < end; m += intervalMin) {
    if (serviceDurationMin && m + serviceDurationMin > end) break;
    const hh = String(Math.floor(m / 60)).padStart(2, "0");
    const mm = String(m % 60).padStart(2, "0");
    slots.push(`${hh}:${mm}`);
  }
  return slots;
}

export function filterSlotsByMinLeadOnSameDay(
  slots: string[],
  selectedDateStr: string,
  earliest: Date,
  tz?: string,
) {
  const eTZ = toTZ(earliest, tz);
  const ehh = eTZ.getHours();
  const emm = eTZ.getMinutes();
  return slots.filter(t => {
    const { hh, mm } = parseHHMM(t);
    if (hh > ehh) return true;
    if (hh === ehh && mm >= emm) return true;
    return false;
  });
}