export function parseHHMM(hhmm: string) {
  const [hh, mm] = hhmm.split(":").map(Number);
  return { hh, mm, minutes: hh * 60 + mm };
}

export function toTZ(date: Date, tz?: string) {
  // Convierte una fecha al tiempo local del tz indicado
  return tz ? new Date(date.toLocaleString("en-US", { timeZone: tz })) : date;
}

// Convierte Date a "YYYY-MM-DD" en la zona horaria tz
export function tzDayString(date: Date, tz?: string) {
  const d = toTZ(date, tz);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

// A partir de "YYYY-MM-DD" crea un Date en mediodía UTC y lo “trae” al tz para evitar bordes de día
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
  earliest: Date, // en tz
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