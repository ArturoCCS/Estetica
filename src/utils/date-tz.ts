export function parseHHMM(hhmm: string) {
  const [hh, mm] = hhmm.split(":").map(Number);
  return { hh, mm, minutes: hh * 60 + mm };
}

export function toTZ(date: Date, tz?: string) {
  return tz ? new Date(date.toLocaleString("en-US", { timeZone: tz })) : date;
}

export function tzDayString(date: Date, tz?: string) {
  const d = toTZ(date, tz);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

export function dateOnlyToTZ(dateStr: string, tz?: string) {
  const dNoonUTC = new Date(`${dateStr}T12:00:00Z`);
  return toTZ(dNoonUTC, tz);
}

export type BusinessDayKey = "sun" | "mon" | "tue" | "wed" | "thu" | "fri" | "sat";

export function dayKeyFor(dateStr: string, tz?: string): BusinessDayKey {
  const d = dateOnlyToTZ(dateStr, tz);
  const keys: BusinessDayKey[] = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
  return keys[d.getDay()];
}

export function getDayNameES(dateStr: string, tz?: string): string {
  const d = dateOnlyToTZ(dateStr, tz);
  const days = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
  return days[d.getDay()];
}

export function getMonthNameES(dateStr: string, tz?: string): string {
  const d = dateOnlyToTZ(dateStr, tz);
  const months = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];
  return months[d.getMonth()];
}

export function formatDateES(dateStr: string, tz?: string): string {
  const d = dateOnlyToTZ(dateStr, tz);
  const dayName = getDayNameES(dateStr, tz);
  const day = d.getDate();
  const monthName = getMonthNameES(dateStr, tz);
  const year = d.getFullYear();
  return `${dayName}, ${day} de ${monthName} de ${year}`;
}

export function makeSlotsForDay(
  startHHMM: string,
  endHHMM: string,
  intervalMin: number,
  serviceDurationMin?: number
) {
  const start = parseHHMM(startHHMM).minutes;
  const end = parseHHMM(endHHMM).minutes;
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
  earliest: Date,
) {
  const eh = earliest.getHours();
  const em = earliest.getMinutes();
  return slots.filter(t => {
    const { hh, mm } = parseHHMM(t);
    if (hh > eh) return true;
    if (hh === eh && mm >= em) return true;
    return false;
  });
}

export function formatDateISO(dateStr: string, timeStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const [hh, mm] = timeStr.split(":").map(Number);
  const dt = new Date(y, (m - 1), d, hh, mm, 0, 0);
  return dt.toISOString();
}

export function toDayKey(iso: string): string {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

export function addMinutes(iso: string, minutes: number): string {
  const d = new Date(iso);
  d.setMinutes(d.getMinutes() + minutes);
  return d.toISOString();
}